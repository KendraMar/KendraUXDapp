const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { loadTranscriptionConfig } = require('../../../../server/lib/config');
const {
  getFileMetadata,
  createSlug,
  mapDriveMetadataToRecording,
  findRelatedFiles,
  fetchAndConvertTranscript,
  downloadFileAsText,
  parseChatExport,
  extractFileId,
  exportGoogleDocAsText
} = require('../../../../server/lib/google');
const {
  recordingsDir,
  findMediaFile,
  loadRecordingMetadata,
  extractFirstTabContent
} = require('./recordingHelpers');
const {
  vendorDir,
  whisperDir,
  modelsDir,
  whisperBinary,
  modelFile,
  transcribeWithWhisperCpp,
  checkFfmpeg,
  convertWebmToMp4
} = require('./transcriptionService');

const router = express.Router();

// Recordings can upload very large audio/video files (up to 5GB)
router.use(express.json({ limit: '5gb', parameterLimit: 100000 }));

// Extended timeout for large recording uploads (2 hours for 5GB files)
router.use((req, res, next) => {
  req.setTimeout(2 * 60 * 60 * 1000); // 2 hours
  res.setTimeout(2 * 60 * 60 * 1000); // 2 hours
  next();
});

// List all recordings
router.get('/', (req, res) => {
  try {
    const entries = fs.readdirSync(recordingsDir, { withFileTypes: true });
    
    const recordings = entries
      .filter(entry => entry.isDirectory())
      .map(entry => {
        try {
          return loadRecordingMetadata(entry.name);
        } catch (err) {
          console.error(`Error loading recording ${entry.name}:`, err);
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by recordedAt if available, otherwise by modifiedAt
        const dateA = new Date(a.recordedAt || a.modifiedAt);
        const dateB = new Date(b.recordedAt || b.modifiedAt);
        return dateB - dateA;
      });
    
    res.json({ success: true, recordings });
  } catch (error) {
    console.error('Error listing recordings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single recording metadata
router.get('/:id', (req, res) => {
  try {
    const recording = loadRecordingMetadata(req.params.id);
    
    if (!recording) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }
    
    res.json({ success: true, recording });
  } catch (error) {
    console.error('Error getting recording:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stream media file (video or audio)
// Supports optional ?sourceId= query param to stream a specific source
router.get('/:id/stream', (req, res) => {
  try {
    const folderPath = path.join(recordingsDir, req.params.id);
    const sourceId = req.query.sourceId;
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }
    
    // Load metadata to find the source
    const metadataPath = path.join(folderPath, 'metadata.json');
    let metadata = {};
    if (fs.existsSync(metadataPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      } catch (err) {
        console.error('Error parsing metadata:', err);
      }
    }
    
    // Find the requested source (or default source)
    const sources = metadata.sources || [];
    let source = null;
    
    if (sourceId) {
      source = sources.find(s => s.id === sourceId);
      if (!source) {
        return res.status(404).json({ success: false, error: `Source '${sourceId}' not found` });
      }
    } else {
      source = sources.find(s => s.default) || sources[0];
    }
    
    if (!source) {
      return res.status(404).json({ success: false, error: 'No source available' });
    }
    
    // Handle Google Drive sources - they can't be streamed locally
    if (source.type === 'google-drive') {
      return res.status(400).json({ 
        success: false, 
        error: 'External source - use embedded player',
        sourceType: 'google-drive',
        googleDriveFileId: source.googleDrive?.fileId
      });
    }
    
    // Handle local sources
    if (source.type !== 'local' || !source.filename) {
      return res.status(400).json({ success: false, error: 'Source is not a local file' });
    }
    
    const filePath = path.join(folderPath, source.filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Media file not found' });
    }
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    // Determine content type from filename or source mimeType
    const ext = path.extname(source.filename).toLowerCase();
    const mimeTypes = {
      // Video formats
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      // Audio formats
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.flac': 'audio/flac'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    if (range) {
      // Partial content for video seeking
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      
      const file = fs.createReadStream(filePath, { start, end });
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType
      });
      
      file.pipe(res);
    } else {
      // Full file
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': contentType
      });
      
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming recording:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve transcript VTT file
router.get('/:id/transcript', (req, res) => {
  try {
    const folderPath = path.join(recordingsDir, req.params.id);
    const transcriptPath = path.join(folderPath, 'transcript.vtt');
    
    if (!fs.existsSync(transcriptPath)) {
      return res.status(404).json({ success: false, error: 'Transcript not found' });
    }
    
    res.setHeader('Content-Type', 'text/vtt');
    res.setHeader('Access-Control-Allow-Origin', '*');
    fs.createReadStream(transcriptPath).pipe(res);
  } catch (error) {
    console.error('Error serving transcript:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update metadata
router.patch('/:id', (req, res) => {
  try {
    const folderPath = path.join(recordingsDir, req.params.id);
    const metadataPath = path.join(folderPath, 'metadata.json');
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }
    
    let metadata = {};
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    }
    
    // Merge with updates
    metadata = { ...metadata, ...req.body };
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    // Return the full updated recording
    const recording = loadRecordingMetadata(req.params.id);
    
    res.json({ success: true, metadata, recording });
  } catch (error) {
    console.error('Error updating metadata:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete recording
router.delete('/:id', (req, res) => {
  try {
    const folderPath = path.join(recordingsDir, req.params.id);
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }
    
    // Delete the entire recording folder and its contents
    fs.rmSync(folderPath, { recursive: true, force: true });
    
    console.log(`Deleted recording: ${req.params.id}`);
    
    res.json({ success: true, message: 'Recording deleted successfully' });
  } catch (error) {
    console.error('Error deleting recording:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add chat message
router.post('/:id/chat', (req, res) => {
  try {
    const folderPath = path.join(recordingsDir, req.params.id);
    const chatPath = path.join(folderPath, 'chat.json');
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }
    
    let chat = [];
    if (fs.existsSync(chatPath)) {
      chat = JSON.parse(fs.readFileSync(chatPath, 'utf-8'));
    }
    
    const newMessage = {
      id: `chat-${Date.now()}`,
      ...req.body,
      timestamp: new Date().toISOString()
    };
    
    chat.push(newMessage);
    fs.writeFileSync(chatPath, JSON.stringify(chat, null, 2));
    
    res.json({ success: true, message: newMessage });
  } catch (error) {
    console.error('Error adding chat message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add discussion thread
router.post('/:id/discussion', (req, res) => {
  try {
    const folderPath = path.join(recordingsDir, req.params.id);
    const discussionPath = path.join(folderPath, 'discussion.json');
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }
    
    let discussion = [];
    if (fs.existsSync(discussionPath)) {
      discussion = JSON.parse(fs.readFileSync(discussionPath, 'utf-8'));
    }
    
    const newThread = {
      id: `thread-${Date.now()}`,
      ...req.body,
      timestamp: new Date().toISOString(),
      likes: 0,
      replies: []
    };
    
    discussion.push(newThread);
    fs.writeFileSync(discussionPath, JSON.stringify(discussion, null, 2));
    
    res.json({ success: true, thread: newThread });
  } catch (error) {
    console.error('Error adding discussion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check if a Google Drive file has already been imported
router.get('/check-import/:googleDriveId', (req, res) => {
  try {
    const { googleDriveId } = req.params;
    const entries = fs.readdirSync(recordingsDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const metadataPath = path.join(recordingsDir, entry.name, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          if (metadata.googleDrive?.fileId === googleDriveId) {
            return res.json({ 
              success: true, 
              alreadyImported: true, 
              recordingId: entry.name,
              title: metadata.title
            });
          }
        } catch (err) {
          // Skip invalid metadata files
        }
      }
    }
    
    res.json({ success: true, alreadyImported: false });
  } catch (error) {
    console.error('Error checking import status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import a recording from Google Drive (as external reference - no download)
router.post('/import/google-drive', async (req, res) => {
  const { fileId } = req.body;
  
  if (!fileId) {
    return res.status(400).json({ success: false, error: 'fileId is required' });
  }
  
  try {
    // Check if already imported
    const entries = fs.readdirSync(recordingsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const metadataPath = path.join(recordingsDir, entry.name, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          if (metadata.googleDrive?.fileId === fileId) {
            return res.status(409).json({ 
              success: false, 
              error: 'This file has already been imported',
              existingRecordingId: entry.name
            });
          }
        } catch (err) {
          // Skip invalid metadata files
        }
      }
    }
    
    // Get file metadata from Google Drive
    console.log(`Fetching metadata for Google Drive file: ${fileId}`);
    const driveMetadata = await getFileMetadata(fileId);
    
    // Check if it's a video file
    if (!driveMetadata.mimeType?.startsWith('video/')) {
      return res.status(400).json({ 
        success: false, 
        error: `File is not a video. MIME type: ${driveMetadata.mimeType}` 
      });
    }
    
    // Create folder name with date-first format: YYYY-MM-DD_HH-MM-timestamp
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timestamp = Date.now();
    const folderId = `${year}-${month}-${day}_${hours}-${minutes}-${timestamp}`;
    const folderPath = path.join(recordingsDir, folderId);
    
    // Create folder
    fs.mkdirSync(folderPath, { recursive: true });
    
    // Map metadata - pass true for isExternalReference to indicate no local file
    const recordingMetadata = mapDriveMetadataToRecording(driveMetadata, fileId, true);
    
    // Save metadata.json
    const metadataPath = path.join(folderPath, 'metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(recordingMetadata, null, 2));
    
    // Initialize empty chat and discussion
    let chatData = [];
    let discussionData = [];
    let transcriptImported = false;
    
    // Search for related files in the same folder (transcripts, subtitles, chat exports)
    console.log('Searching for related files (transcripts, chat)...');
    try {
      const relatedFiles = await findRelatedFiles(fileId, driveMetadata);
      
      // Import transcript if found
      if (relatedFiles.transcript || relatedFiles.subtitles.length > 0) {
        const transcriptSource = relatedFiles.transcript || relatedFiles.subtitles[0];
        console.log(`Found transcript: ${transcriptSource.name} (${transcriptSource.type})`);
        
        try {
          const vttContent = await fetchAndConvertTranscript(transcriptSource);
          const transcriptPath = path.join(folderPath, 'transcript.vtt');
          fs.writeFileSync(transcriptPath, vttContent, 'utf-8');
          console.log('Transcript imported and converted to VTT');
          transcriptImported = true;
        } catch (transcriptErr) {
          console.error('Error importing transcript:', transcriptErr.message);
        }
      }
      
      // Import chat export if found
      if (relatedFiles.chat) {
        console.log(`Found chat export: ${relatedFiles.chat.name}`);
        try {
          const chatContent = await downloadFileAsText(relatedFiles.chat.id);
          chatData = parseChatExport(chatContent);
          console.log(`Parsed ${chatData.length} chat messages`);
        } catch (chatErr) {
          console.error('Error importing chat:', chatErr.message);
        }
      }
    } catch (relatedErr) {
      console.warn('Could not search for related files:', relatedErr.message);
    }
    
    // Save chat.json and discussion.json
    fs.writeFileSync(path.join(folderPath, 'chat.json'), JSON.stringify(chatData, null, 2));
    fs.writeFileSync(path.join(folderPath, 'discussion.json'), JSON.stringify(discussionData, null, 2));
    
    // NOTE: We no longer download the video file - it will be streamed directly from Google Drive
    // The video will be embedded using Google Drive's preview/embed functionality
    
    const importSummary = [];
    if (transcriptImported) importSummary.push('transcript');
    if (chatData.length > 0) importSummary.push(`${chatData.length} chat messages`);
    
    console.log(`Import complete (external reference): ${folderId}${importSummary.length > 0 ? ` with ${importSummary.join(', ')}` : ''}`);
    
    // Return the new recording
    const recording = loadRecordingMetadata(folderId);
    
    res.json({ 
      success: true, 
      message: 'Recording imported successfully' + (importSummary.length > 0 ? ` with ${importSummary.join(', ')}` : ' (external reference)'),
      recording,
      imported: {
        transcript: transcriptImported,
        chatMessages: chatData.length
      }
    });
    
  } catch (error) {
    console.error('Error importing from Google Drive:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import description from a Google Doc URL
router.post('/:id/import-description', async (req, res) => {
  const recordingId = req.params.id;
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }
  
  try {
    const folderPath = path.join(recordingsDir, recordingId);
    const metadataPath = path.join(folderPath, 'metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }
    
    // Import the functions we need
    
    // Try to extract file ID (works for both /file/d/ and /document/d/ formats)
    let fileId = extractFileId(url);
    
    // If that didn't work, try extracting from Google Docs URL format
    if (!fileId) {
      // Try Google Docs format: https://docs.google.com/document/d/{docId}/...
      const docsMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
      if (docsMatch && docsMatch[1]) {
        fileId = docsMatch[1];
      }
    }
    
    if (!fileId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Google Drive/Docs URL. Expected format: https://drive.google.com/file/d/{fileId}/view or https://docs.google.com/document/d/{docId}/...' 
      });
    }
    
    console.log(`Importing description from Google Drive file: ${fileId}`);
    
    // Get file metadata to check type
    const metadata = await getFileMetadata(fileId);
    const mimeType = metadata.mimeType || '';
    
    console.log(`File type: ${mimeType}, name: ${metadata.name}`);
    
    let descriptionContent;
    
    // Handle different file types
    if (mimeType === 'application/vnd.google-apps.document') {
      // Google Doc - export as plain text
      if (metadata.capabilities && metadata.capabilities.canCopy === false) {
        return res.status(403).json({ 
          success: false, 
          error: 'Cannot export this Google Doc. The file owner has disabled copying/exporting.' 
        });
      }
      
      console.log('Exporting Google Doc as text...');
      descriptionContent = await exportGoogleDocAsText(fileId);
      
      // Extract only the first tab content (exclude Transcript and other tabs)
      const originalLength = descriptionContent.length;
      descriptionContent = extractFirstTabContent(descriptionContent);
      if (descriptionContent.length < originalLength) {
        console.log(`Extracted first tab only: ${originalLength} -> ${descriptionContent.length} chars`);
      }
    } else if (mimeType.startsWith('text/') || /\.(txt|md)$/i.test(metadata.name)) {
      // Plain text file
      
      if (metadata.capabilities && metadata.capabilities.canDownload === false) {
        return res.status(403).json({ 
          success: false, 
          error: 'Cannot download this file. The file owner has disabled downloading.' 
        });
      }
      
      console.log('Downloading text file...');
      descriptionContent = await downloadFileAsText(fileId);
    } else {
      return res.status(400).json({ 
        success: false, 
        error: `Unsupported file type: ${mimeType}. Please use a Google Doc or text file.` 
      });
    }
    
    // Clean up the content (remove excessive whitespace, trim)
    descriptionContent = descriptionContent
      .replace(/\n{3,}/g, '\n\n')  // Replace 3+ newlines with 2
      .trim();
    
    if (!descriptionContent) {
      return res.status(400).json({ 
        success: false, 
        error: 'The document appears to be empty.' 
      });
    }
    
    // Load and update metadata
    let recordingMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    recordingMetadata.description = descriptionContent;
    recordingMetadata.descriptionSource = {
      type: 'google-drive',
      fileId: fileId,
      fileName: metadata.name,
      importedAt: new Date().toISOString()
    };
    
    // Save updated metadata
    fs.writeFileSync(metadataPath, JSON.stringify(recordingMetadata, null, 2));
    
    console.log(`Description imported from: ${metadata.name} (${descriptionContent.length} chars)`);
    
    res.json({
      success: true,
      source: metadata.name,
      length: descriptionContent.length
    });
    
  } catch (error) {
    console.error('Error importing description:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import chat from a Google Drive URL
router.post('/:id/import-chat', async (req, res) => {
  const recordingId = req.params.id;
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }
  
  try {
    const folderPath = path.join(recordingsDir, recordingId);
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }
    
    // Import the extractFileId and other functions we need
    
    // Extract file ID from URL
    const fileId = extractFileId(url);
    if (!fileId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid Google Drive URL. Expected format: https://drive.google.com/file/d/{fileId}/view' 
      });
    }
    
    console.log(`Importing chat from Google Drive file: ${fileId}`);
    
    // Get file metadata to determine type
    const metadata = await getFileMetadata(fileId);
    const mimeType = metadata.mimeType || '';
    
    console.log(`File type: ${mimeType}, name: ${metadata.name}`);
    console.log(`Capabilities:`, JSON.stringify(metadata.capabilities, null, 2));
    
    let chatContent;
    
    // Handle different file types
    if (mimeType === 'application/vnd.google-apps.document') {
      // Google Doc - export as plain text
      // Check if we can copy (required for export)
      if (metadata.capabilities && metadata.capabilities.canCopy === false) {
        return res.status(403).json({ 
          success: false, 
          error: 'Cannot export this Google Doc. The file owner has disabled copying/exporting. Please ask the owner to enable "Viewers can download" in sharing settings.' 
        });
      }
      
      console.log('Exporting Google Doc as text...');
      try {
        chatContent = await exportGoogleDocAsText(fileId);
      } catch (exportErr) {
        console.error('Export error:', exportErr.message);
        // If export fails, provide helpful guidance
        if (exportErr.message.includes('403') || exportErr.message.includes('cannot')) {
          return res.status(403).json({ 
            success: false, 
            error: 'Cannot export this Google Doc. Please ensure: 1) You have access to the file, 2) The file owner has enabled "Viewers can download" in sharing settings.' 
          });
        }
        throw exportErr;
      }
    } else if (mimeType.startsWith('text/') || /\.(txt|csv)$/i.test(metadata.name)) {
      // Plain text file - download directly
      // Check if we can download
      if (metadata.capabilities && metadata.capabilities.canDownload === false) {
        return res.status(403).json({ 
          success: false, 
          error: 'Cannot download this file. The file owner has disabled downloading. Please ask the owner to enable "Viewers can download" in sharing settings.' 
        });
      }
      
      console.log('Downloading text file...');
      try {
        chatContent = await downloadFileAsText(fileId);
      } catch (downloadErr) {
        console.error('Download error:', downloadErr.message);
        if (downloadErr.message.includes('403') || downloadErr.message.includes('cannot')) {
          return res.status(403).json({ 
            success: false, 
            error: 'Cannot download this file. Please ensure: 1) You have access to the file, 2) The file owner has enabled "Viewers can download" in sharing settings.' 
          });
        }
        throw downloadErr;
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        error: `Unsupported file type: ${mimeType}. Please use a Google Doc or text file.` 
      });
    }
    
    // Parse the chat content
    const chatMessages = parseChatExport(chatContent);
    
    if (chatMessages.length === 0) {
      // If standard parsing didn't work, try a simpler format
      // Just split by lines and treat each as a message
      const lines = chatContent.split('\n').filter(l => l.trim());
      
      // Check if it looks like a Google Meet chat export format:
      // "Name HH:MM AM/PM"
      // "Message text"
      let i = 0;
      while (i < lines.length - 1) {
        const nameLine = lines[i].trim();
        const messageLine = lines[i + 1]?.trim();
        
        // Check if this looks like "Name Time" format
        const nameTimeMatch = nameLine.match(/^(.+?)\s+(\d{1,2}:\d{2}(?:\s*(?:AM|PM))?)/i);
        
        if (nameTimeMatch && messageLine && !messageLine.match(/^\d{1,2}:\d{2}/)) {
          const user = nameTimeMatch[1].trim();
          const timeStr = nameTimeMatch[2].trim();
          
          chatMessages.push({
            id: `chat-imported-${Date.now()}-${chatMessages.length}`,
            user,
            message: messageLine,
            recordingTime: timeStr,
            recordingTimeSeconds: 0, // We don't have accurate timing for this format
            timestamp: new Date().toISOString(),
            imported: true
          });
          
          i += 2;
        } else {
          i++;
        }
      }
    }
    
    if (chatMessages.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Could not parse any chat messages from the file. The format may not be supported.' 
      });
    }
    
    // Save to chat.json
    const chatPath = path.join(folderPath, 'chat.json');
    fs.writeFileSync(chatPath, JSON.stringify(chatMessages, null, 2));
    
    console.log(`Imported ${chatMessages.length} chat messages`);
    
    res.json({
      success: true,
      messageCount: chatMessages.length,
      source: metadata.name
    });
    
  } catch (error) {
    console.error('Error importing chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch related files for an existing Google Drive recording
router.post('/:id/fetch-related', async (req, res) => {
  const recordingId = req.params.id;
  
  try {
    const folderPath = path.join(recordingsDir, recordingId);
    const metadataPath = path.join(folderPath, 'metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }
    
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    
    // Check if this is a Google Drive recording
    if (metadata.externalSource !== 'google-drive' || !metadata.googleDrive?.fileId) {
      return res.status(400).json({ 
        success: false, 
        error: 'This recording is not from Google Drive' 
      });
    }
    
    const fileId = metadata.googleDrive.fileId;
    console.log(`Fetching related files for recording: ${recordingId} (Drive file: ${fileId})`);
    
    // Get the video file metadata to find parent folder
    const driveMetadata = await getFileMetadata(fileId);
    
    // Search for related files
    const relatedFiles = await findRelatedFiles(fileId, driveMetadata);
    
    const results = {
      transcript: null,
      chat: null
    };
    
    // Import transcript if found
    if (relatedFiles.transcript || relatedFiles.subtitles.length > 0) {
      const transcriptSource = relatedFiles.transcript || relatedFiles.subtitles[0];
      console.log(`Found transcript: ${transcriptSource.name}`);
      
      try {
        const vttContent = await fetchAndConvertTranscript(transcriptSource);
        const transcriptPath = path.join(folderPath, 'transcript.vtt');
        fs.writeFileSync(transcriptPath, vttContent, 'utf-8');
        results.transcript = {
          imported: true,
          source: transcriptSource.name
        };
        console.log('Transcript imported successfully');
      } catch (err) {
        results.transcript = { imported: false, error: err.message };
      }
    }
    
    // Import chat if found
    if (relatedFiles.chat) {
      console.log(`Found chat export: ${relatedFiles.chat.name}`);
      
      try {
        const chatContent = await downloadFileAsText(relatedFiles.chat.id);
        const chatData = parseChatExport(chatContent);
        const chatPath = path.join(folderPath, 'chat.json');
        fs.writeFileSync(chatPath, JSON.stringify(chatData, null, 2));
        results.chat = {
          imported: true,
          source: relatedFiles.chat.name,
          messageCount: chatData.length
        };
        console.log(`Chat imported: ${chatData.length} messages`);
      } catch (err) {
        results.chat = { imported: false, error: err.message };
      }
    }
    
    // Return updated recording
    const recording = loadRecordingMetadata(recordingId);
    
    res.json({
      success: true,
      message: 'Related files fetched',
      results,
      recording
    });
    
  } catch (error) {
    console.error('Error fetching related files:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start transcription for a recording
router.post('/:id/transcribe', async (req, res) => {
  const recordingId = req.params.id;
  
  try {
    // Check transcription config
    const transcriptionConfig = loadTranscriptionConfig();
    const useBuiltIn = transcriptionConfig?.useBuiltIn !== false; // Default to true
    
    if (useBuiltIn) {
      // Check if Apollo transcription is ready
      if (!fs.existsSync(whisperBinary) || !fs.existsSync(modelFile)) {
        return res.status(400).json({
          success: false,
          error: 'Apollo transcription not set up. Go to Settings > AI > Transcription AI to download and configure it.'
        });
      }
    } else {
      // External API mode - check config
      if (!transcriptionConfig || !transcriptionConfig.apiUrl || !transcriptionConfig.model) {
        return res.status(400).json({
          success: false,
          error: 'Transcription AI not configured. Go to Settings > AI > Transcription AI to set it up.'
        });
      }
    }
    
    const folderPath = path.join(recordingsDir, recordingId);
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Recording not found' });
    }
    
    // Find the media file
    const media = findMediaFile(folderPath);
    if (!media) {
      return res.status(404).json({ success: false, error: 'Media file not found' });
    }
    
    const mediaPath = path.join(folderPath, media.file);
    const transcriptPath = path.join(folderPath, 'transcript.vtt');
    
    console.log(`Starting transcription for: ${recordingId}`);
    console.log(`Media file: ${mediaPath}`);
    console.log(`Using built-in Apollo model: ${useBuiltIn}`);
    
    if (useBuiltIn) {
      // Use local whisper.cpp
      console.log('Using local whisper.cpp for transcription...');
      await transcribeWithWhisperCpp(mediaPath, transcriptPath);
      
      console.log(`Transcription complete. Saved to: ${transcriptPath}`);
      
      res.json({
        success: true,
        message: 'Transcription completed successfully using Apollo Model',
        transcriptPath: 'transcript.vtt'
      });
    } else {
      // Use external API
      console.log(`Transcription API: ${transcriptionConfig.apiUrl}`);
      
      // Read the media file
      const mediaBuffer = fs.readFileSync(mediaPath);
      
      // Create form data for the Whisper API
      // Using the OpenAI-compatible /v1/audio/transcriptions endpoint
      const formData = new FormData();
      formData.append('file', new Blob([mediaBuffer]), media.file);
      formData.append('model', transcriptionConfig.model);
      formData.append('response_format', 'vtt'); // Request VTT format directly
      
      // Make request to Whisper API
      const apiUrl = transcriptionConfig.apiUrl.replace(/\/$/, ''); // Remove trailing slash
      const transcriptionUrl = `${apiUrl}/v1/audio/transcriptions`;
      
      console.log(`Sending request to: ${transcriptionUrl}`);
      
      const response = await fetch(transcriptionUrl, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Transcription API error: ${response.status} - ${errorText}`);
      }
      
      // Get the VTT content
      const vttContent = await response.text();
      
      // Save the transcript
      fs.writeFileSync(transcriptPath, vttContent, 'utf-8');
      
      console.log(`Transcription complete. Saved to: ${transcriptPath}`);
      
      res.json({
        success: true,
        message: 'Transcription completed successfully',
        transcriptPath: 'transcript.vtt'
      });
    }
    
  } catch (error) {
    console.error('Error during transcription:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get transcription status/config
router.get('/transcription/status', (req, res) => {
  const transcriptionConfig = loadTranscriptionConfig();
  
  res.json({
    success: true,
    configured: !!(transcriptionConfig?.apiUrl && transcriptionConfig?.model),
    apiUrl: transcriptionConfig?.apiUrl || null,
    model: transcriptionConfig?.model || null
  });
});

// Check Apollo built-in transcription status
router.get('/transcription/apollo-status', (req, res) => {
  try {
    const whisperInstalled = fs.existsSync(whisperBinary);
    const modelInstalled = fs.existsSync(modelFile);
    const ffmpegInstalled = checkFfmpeg();
    
    let modelSize = null;
    if (modelInstalled) {
      const stats = fs.statSync(modelFile);
      modelSize = stats.size;
    }
    
    res.json({
      success: true,
      whisperInstalled,
      modelInstalled,
      ffmpegInstalled,
      modelSize,
      ready: whisperInstalled && modelInstalled && ffmpegInstalled,
      whisperPath: whisperDir,
      modelPath: modelFile
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Setup Apollo built-in transcription (download whisper.cpp + model)
router.post('/transcription/setup-apollo', async (req, res) => {
  // Set up SSE for progress updates
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendProgress = (step, message, progress = null) => {
    res.write(`data: ${JSON.stringify({ step, message, progress })}\n\n`);
  };

  try {
    // Ensure vendor directories exist
    if (!fs.existsSync(vendorDir)) {
      fs.mkdirSync(vendorDir, { recursive: true });
    }
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    // Step 1: Clone whisper.cpp if not present
    if (!fs.existsSync(whisperDir)) {
      sendProgress('whisper', 'Cloning whisper.cpp repository...', 0);
      
      try {
        execSync('git clone --depth 1 https://github.com/ggerganov/whisper.cpp.git', {
          cwd: vendorDir,
          stdio: 'pipe'
        });
        sendProgress('whisper', 'Repository cloned successfully', 33);
      } catch (err) {
        throw new Error(`Failed to clone whisper.cpp: ${err.message}`);
      }
    } else {
      sendProgress('whisper', 'whisper.cpp already downloaded', 33);
    }

    // Step 2: Compile whisper.cpp if binary doesn't exist
    if (!fs.existsSync(whisperBinary)) {
      sendProgress('compile', 'Compiling whisper.cpp (this may take a minute)...', 33);
      
      try {
        // Use Metal acceleration on Apple Silicon
        // Note: Don't run 'make clean' on fresh clone as it may not have a clean target yet
        execSync('make -j', {
          cwd: whisperDir,
          stdio: 'pipe',
          env: { ...process.env, WHISPER_METAL: '1' }
        });
        sendProgress('compile', 'Compilation successful', 66);
      } catch (err) {
        throw new Error(`Failed to compile whisper.cpp: ${err.message}. Make sure Xcode Command Line Tools are installed (run: xcode-select --install)`);
      }
    } else {
      sendProgress('compile', 'whisper.cpp already compiled', 66);
    }

    // Step 3: Download model if not present
    if (!fs.existsSync(modelFile)) {
      sendProgress('model', 'Downloading Whisper large-v3-turbo model (~1.5GB)...', 66);
      
      const modelUrl = 'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q8_0.bin';
      
      try {
        const response = await fetch(modelUrl);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const totalSize = parseInt(response.headers.get('content-length'), 10);
        let downloadedSize = 0;
        
        const fileStream = fs.createWriteStream(modelFile);
        const reader = response.body.getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          fileStream.write(Buffer.from(value));
          downloadedSize += value.length;
          
          const percent = Math.round((downloadedSize / totalSize) * 100);
          const downloadedMB = (downloadedSize / 1024 / 1024).toFixed(1);
          const totalMB = (totalSize / 1024 / 1024).toFixed(1);
          sendProgress('model', `Downloading: ${downloadedMB}MB / ${totalMB}MB`, 66 + (percent * 0.34));
        }
        
        fileStream.end();
        await new Promise((resolve) => fileStream.on('finish', resolve));
        
        sendProgress('model', 'Model downloaded successfully', 100);
      } catch (err) {
        // Clean up partial download
        if (fs.existsSync(modelFile)) {
          fs.unlinkSync(modelFile);
        }
        throw new Error(`Failed to download model: ${err.message}`);
      }
    } else {
      sendProgress('model', 'Model already downloaded', 100);
    }

    sendProgress('complete', 'Apollo transcription is ready!', 100);
    res.write(`data: ${JSON.stringify({ success: true, complete: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error setting up Apollo transcription:', error);
    res.write(`data: ${JSON.stringify({ success: false, error: error.message })}\n\n`);
    res.end();
  }
});

module.exports = router;