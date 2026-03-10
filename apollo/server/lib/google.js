const { loadGoogleConfig } = require('./config');

/**
 * Google Drive API client using OAuth 2.0
 * Uses refresh token to get access tokens for API calls
 */

// Cache for access token to avoid repeated refresh calls
let cachedAccessToken = null;
let tokenExpiry = null;

// Get a fresh access token using the refresh token
async function getAccessToken() {
  // Return cached token if still valid (with 5 minute buffer)
  if (cachedAccessToken && tokenExpiry && Date.now() < tokenExpiry - 300000) {
    return cachedAccessToken;
  }
  const config = loadGoogleConfig();
  
  if (!config) {
    throw new Error('Google configuration not found. Please add google config to data/config.json');
  }
  
  const { clientId, clientSecret, refreshToken } = config;
  
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google configuration incomplete. Need clientId, clientSecret, and refreshToken');
  }
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh access token: ${error}`);
  }
  
  const data = await response.json();
  
  // Cache the token (default expiry is 1 hour)
  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  
  return data.access_token;
}

/**
 * Extract file ID from a Google Drive URL
 * Supports format: https://drive.google.com/file/d/{fileId}/view
 */
function extractFileId(url) {
  // Pattern: https://drive.google.com/file/d/{fileId}/view
  const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return null;
}

/**
 * Get file metadata from Google Drive
 * Returns all available metadata for the file
 */
async function getFileMetadata(fileId) {
  const accessToken = await getAccessToken();
  
  // Request all available fields
  const fields = [
    'id',
    'name',
    'mimeType',
    'size',
    'createdTime',
    'modifiedTime',
    'owners',
    'sharingUser',
    'shared',
    'permissions',
    'webViewLink',
    'webContentLink',
    'thumbnailLink',
    'iconLink',
    'description',
    'starred',
    'trashed',
    'parents',
    'properties',
    'appProperties',
    'capabilities',
    'videoMediaMetadata',
    'imageMediaMetadata',
    'contentHints',
    'md5Checksum',
    'sha1Checksum',
    'sha256Checksum',
    'headRevisionId',
    'originalFilename',
    'fullFileExtension',
    'fileExtension',
    'quotaBytesUsed',
    'version'
  ].join(',');
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${fields}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get file metadata: ${error}`);
  }
  
  return await response.json();
}

/**
 * Validate if a URL is a valid Google Drive URL
 */
function isValidGoogleDriveUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'drive.google.com' && 
           url.includes('/file/d/');
  } catch {
    return false;
  }
}

/**
 * Download a file from Google Drive
 * Returns a readable stream
 */
async function downloadFile(fileId) {
  const accessToken = await getAccessToken();
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to download file: ${error}`);
  }
  
  return response;
}

/**
 * Convert duration in milliseconds to HH:MM:SS format
 */
function formatDuration(durationMillis) {
  const totalSeconds = Math.floor(durationMillis / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Create a URL-safe slug from a string
 */
function createSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 50) // Limit length
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
}

/**
 * Map Google Drive metadata to recording metadata format (v0.1.0 schema)
 * @param {Object} driveMetadata - Metadata from Google Drive API
 * @param {string} fileId - Google Drive file ID
 * @param {boolean} isExternalReference - If true, the video won't be downloaded, just referenced (default: true)
 */
function mapDriveMetadataToRecording(driveMetadata, fileId, isExternalReference = true) {
  const durationMillis = driveMetadata.videoMediaMetadata?.durationMillis 
    ? parseInt(driveMetadata.videoMediaMetadata.durationMillis, 10) 
    : null;
  
  // Clean up the title (remove date/time patterns often in meeting names)
  let title = driveMetadata.name || 'Untitled Recording';
  // Remove file extension from title
  title = title.replace(/\.(mp4|webm|mov|avi|mkv|mp3|wav|ogg|m4a)$/i, '');
  
  const mimeType = driveMetadata.mimeType || 'video/mp4';
  const size = parseInt(driveMetadata.size, 10) || 0;
  
  return {
    schemaVersion: '0.1.0',
    title,
    description: driveMetadata.description || '',
    recordedAt: driveMetadata.createdTime,
    duration: durationMillis ? formatDuration(durationMillis) : null,
    durationSeconds: durationMillis ? Math.floor(durationMillis / 1000) : null,
    presenter: driveMetadata.owners?.[0]?.displayName || null,
    participants: [],
    tags: [],
    views: 0,
    thumbnail: driveMetadata.thumbnailLink || null,
    chapters: [],
    // Sources array (v0.1.0 schema)
    sources: [
      {
        id: 'src-gdrive-1',
        title: 'Google Drive',
        type: 'google-drive',
        default: true,
        mimeType: mimeType,
        size: size,
        googleDrive: {
          fileId: fileId,
          originalFilename: driveMetadata.originalFilename,
          webViewLink: driveMetadata.webViewLink,
          webContentLink: driveMetadata.webContentLink,
          md5Checksum: driveMetadata.md5Checksum,
          owner: driveMetadata.owners?.[0]?.emailAddress || null,
          importedAt: new Date().toISOString()
        }
      }
    ]
  };
}

/**
 * List files in a Google Drive folder
 * @param {string} folderId - The folder ID to list files from
 * @param {string} query - Optional additional query filter
 */
async function listFilesInFolder(folderId, query = '') {
  const accessToken = await getAccessToken();
  
  // Build query: files in this folder that are not trashed
  let q = `'${folderId}' in parents and trashed = false`;
  if (query) {
    q += ` and ${query}`;
  }
  
  const fields = 'files(id, name, mimeType, size, createdTime, modifiedTime)';
  const params = new URLSearchParams({
    q,
    fields,
    pageSize: '100'
  });
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to list files in folder: ${error}`);
  }
  
  const data = await response.json();
  return data.files || [];
}

/**
 * Export a Google Doc as plain text
 * @param {string} fileId - The Google Doc file ID
 */
async function exportGoogleDocAsText(fileId) {
  const accessToken = await getAccessToken();
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorObj;
    try {
      errorObj = JSON.parse(errorText);
    } catch {
      errorObj = { message: errorText };
    }
    
    // Check for common error cases
    if (response.status === 403) {
      const reason = errorObj.error?.errors?.[0]?.reason || '';
      if (reason === 'cannotExportFile' || reason === 'exportSizeLimitExceeded') {
        throw new Error(`Cannot export this Google Doc: ${errorObj.error?.message || 'Export not allowed'}`);
      }
      throw new Error(`Access denied: The file owner may have disabled exporting, or you don't have permission to access this file.`);
    }
    
    throw new Error(`Failed to export Google Doc: ${errorObj.error?.message || errorText}`);
  }
  
  return await response.text();
}

/**
 * Download a file's content as text (for subtitle files like .vtt, .srt, .sbv)
 * @param {string} fileId - The file ID
 */
async function downloadFileAsText(fileId) {
  const accessToken = await getAccessToken();
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorObj;
    try {
      errorObj = JSON.parse(errorText);
    } catch {
      errorObj = { message: errorText };
    }
    
    // Check for common error cases
    if (response.status === 403) {
      const reason = errorObj.error?.errors?.[0]?.reason || '';
      if (reason === 'cannotDownloadFile') {
        throw new Error(`Cannot download this file: The file owner has disabled downloading. Please ask them to enable "Viewers can download" in sharing settings.`);
      }
      throw new Error(`Access denied: You don't have permission to download this file, or downloading has been disabled by the owner.`);
    }
    
    throw new Error(`Failed to download file: ${errorObj.error?.message || errorText}`);
  }
  
  return await response.text();
}

/**
 * Find related files (transcripts, subtitles) for a video in its parent folder
 * @param {string} videoFileId - The video file ID
 * @param {Object} videoMetadata - The video file metadata (must include parents and name)
 */
async function findRelatedFiles(videoFileId, videoMetadata) {
  const result = {
    transcript: null,
    subtitles: [],
    chat: null
  };
  
  // Get parent folder ID
  const parentFolderId = videoMetadata.parents?.[0];
  if (!parentFolderId) {
    console.log('No parent folder found for video, cannot search for related files');
    return result;
  }
  
  console.log(`Searching for related files in folder: ${parentFolderId}`);
  
  // List all files in the parent folder
  const files = await listFilesInFolder(parentFolderId);
  console.log(`Found ${files.length} files in parent folder`);
  
  // Extract base name from video (remove extension and common suffixes)
  const videoName = videoMetadata.name || '';
  const videoBaseName = videoName
    .replace(/\.(mp4|webm|mov|avi|mkv)$/i, '')
    .replace(/\s*-\s*recording$/i, '')
    .trim();
  
  console.log(`Looking for files related to: "${videoBaseName}"`);
  
  for (const file of files) {
    // Skip the video file itself
    if (file.id === videoFileId) continue;
    
    const fileName = file.name || '';
    const mimeType = file.mimeType || '';
    
    // Check if file name is related to the video (contains similar text)
    const isRelated = fileName.toLowerCase().includes(videoBaseName.toLowerCase().substring(0, 20)) ||
                      videoBaseName.toLowerCase().includes(fileName.toLowerCase().substring(0, 20));
    
    // Also check for common transcript/subtitle patterns
    const isTranscriptPattern = /transcript|caption|subtitle/i.test(fileName);
    const isChatPattern = /chat|messages/i.test(fileName);
    
    // Google Docs (potential transcript)
    if (mimeType === 'application/vnd.google-apps.document') {
      if (isRelated || isTranscriptPattern) {
        console.log(`Found related Google Doc transcript: ${fileName}`);
        result.transcript = {
          id: file.id,
          name: fileName,
          type: 'google-doc'
        };
      }
    }
    
    // Subtitle files (.vtt, .srt, .sbv)
    if (/\.(vtt|srt|sbv)$/i.test(fileName)) {
      if (isRelated || isTranscriptPattern) {
        console.log(`Found related subtitle file: ${fileName}`);
        result.subtitles.push({
          id: file.id,
          name: fileName,
          type: fileName.split('.').pop().toLowerCase()
        });
      }
    }
    
    // Text files that might be chat exports
    if ((mimeType === 'text/plain' || /\.txt$/i.test(fileName)) && isChatPattern) {
      console.log(`Found potential chat export: ${fileName}`);
      result.chat = {
        id: file.id,
        name: fileName,
        type: 'text'
      };
    }
  }
  
  return result;
}

/**
 * Convert SRT format to VTT format
 */
function convertSrtToVtt(srtContent) {
  // Add WEBVTT header
  let vtt = 'WEBVTT\n\n';
  
  // Replace SRT timestamp format (00:00:00,000) with VTT format (00:00:00.000)
  const converted = srtContent
    .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
    // Remove sequence numbers (lines that are just numbers)
    .split('\n')
    .filter((line, i, arr) => {
      // Keep the line if it's not a standalone number followed by a timestamp line
      if (/^\d+$/.test(line.trim())) {
        const nextLine = arr[i + 1] || '';
        if (/-->/.test(nextLine)) {
          return false; // Skip this sequence number
        }
      }
      return true;
    })
    .join('\n');
  
  vtt += converted;
  return vtt;
}

/**
 * Convert SBV format to VTT format
 */
function convertSbvToVtt(sbvContent) {
  // Add WEBVTT header
  let vtt = 'WEBVTT\n\n';
  
  // SBV uses format: 0:00:00.000,0:00:00.000
  // VTT uses format: 00:00:00.000 --> 00:00:00.000
  const converted = sbvContent
    .replace(/(\d+:\d{2}:\d{2}\.\d{3}),(\d+:\d{2}:\d{2}\.\d{3})/g, (match, start, end) => {
      // Ensure hours are zero-padded to 2 digits
      const padTime = (time) => {
        const parts = time.split(':');
        parts[0] = parts[0].padStart(2, '0');
        return parts.join(':');
      };
      return `${padTime(start)} --> ${padTime(end)}`;
    });
  
  vtt += converted;
  return vtt;
}

/**
 * Parse Google Meet transcript document format to VTT
 * Google Meet transcripts are typically formatted as:
 * Speaker Name (timestamp)
 * What they said
 */
function convertMeetTranscriptToVtt(docContent) {
  let vtt = 'WEBVTT\n\n';
  
  // Split by double newlines to get paragraphs
  const paragraphs = docContent.split(/\n\n+/);
  let cueIndex = 0;
  let lastEndTime = 0;
  
  for (const para of paragraphs) {
    const lines = para.trim().split('\n');
    if (lines.length < 2) continue;
    
    // Try to parse speaker line: "Speaker Name (0:00:00)"
    const speakerMatch = lines[0].match(/^(.+?)\s*\((\d+:\d{2}(?::\d{2})?)\)\s*$/);
    
    if (speakerMatch) {
      const speaker = speakerMatch[1].trim();
      const timestamp = speakerMatch[2];
      const text = lines.slice(1).join(' ').trim();
      
      if (text) {
        // Parse timestamp
        const timeParts = timestamp.split(':').map(Number);
        let seconds;
        if (timeParts.length === 3) {
          seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
        } else {
          seconds = timeParts[0] * 60 + timeParts[1];
        }
        
        // Create VTT cue with assumed 5 second duration (will be adjusted by next cue)
        const startTime = formatVttTime(seconds);
        const endTime = formatVttTime(seconds + 5);
        
        vtt += `${cueIndex + 1}\n`;
        vtt += `${startTime} --> ${endTime}\n`;
        vtt += `<v ${speaker}>${text}\n\n`;
        
        cueIndex++;
        lastEndTime = seconds + 5;
      }
    }
  }
  
  return vtt;
}

/**
 * Format seconds to VTT timestamp format (HH:MM:SS.mmm)
 */
function formatVttTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.round((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

/**
 * Fetch and convert a transcript to VTT format
 * @param {Object} transcriptInfo - Info about the transcript file
 * @returns {string} VTT formatted transcript
 */
async function fetchAndConvertTranscript(transcriptInfo) {
  let content;
  
  if (transcriptInfo.type === 'google-doc') {
    console.log(`Exporting Google Doc transcript: ${transcriptInfo.name}`);
    content = await exportGoogleDocAsText(transcriptInfo.id);
    return convertMeetTranscriptToVtt(content);
  } else {
    console.log(`Downloading subtitle file: ${transcriptInfo.name}`);
    content = await downloadFileAsText(transcriptInfo.id);
    
    if (transcriptInfo.type === 'vtt') {
      // Already VTT format
      return content;
    } else if (transcriptInfo.type === 'srt') {
      return convertSrtToVtt(content);
    } else if (transcriptInfo.type === 'sbv') {
      return convertSbvToVtt(content);
    }
  }
  
  return content;
}

/**
 * Parse timestamp string to seconds
 * Supports formats like "00:00:11", "0:05", "00:00:11.191"
 */
function parseTimestampToSeconds(timestamp) {
  // Remove milliseconds if present (e.g., "00:00:11.191" -> "00:00:11")
  const cleanTimestamp = timestamp.split('.')[0];
  const timeParts = cleanTimestamp.split(':').map(Number);
  
  if (timeParts.length === 3) {
    return timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
  } else if (timeParts.length === 2) {
    return timeParts[0] * 60 + timeParts[1];
  }
  return 0;
}

/**
 * Parse chat text export to chat.json format
 * Supports multiple formats:
 * - "HH:MM:SS - Speaker Name: Message"
 * - "[HH:MM:SS] Speaker Name: Message"
 * - "Speaker Name HH:MM:SS\nMessage" (Google Meet export format)
 * - Subtitle format: "00:00:11.191,00:00:14.191\nSpeaker: Message"
 */
function parseChatExport(chatContent) {
  const messages = [];
  const lines = chatContent.split('\n');
  
  // First, try to detect subtitle format (timestamp range on one line, speaker:message on next)
  // Format: "00:00:11.191,00:00:14.191\nSpeaker: Message"
  const subtitleTimestampRegex = /^(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?),(\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?)\s*$/;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check for subtitle format (timestamp range line followed by speaker: message)
    const subtitleMatch = line.match(subtitleTimestampRegex);
    if (subtitleMatch) {
      const startTimestamp = subtitleMatch[1];
      // Look at the next non-empty line for the speaker and message
      let nextLineIndex = i + 1;
      while (nextLineIndex < lines.length && !lines[nextLineIndex].trim()) {
        nextLineIndex++;
      }
      
      if (nextLineIndex < lines.length) {
        const nextLine = lines[nextLineIndex].trim();
        // Check if next line has "Speaker: Message" format
        const speakerMatch = nextLine.match(/^(.+?):\s*(.+)$/);
        if (speakerMatch) {
          const user = speakerMatch[1].trim();
          const message = speakerMatch[2].trim();
          const seconds = parseTimestampToSeconds(startTimestamp);
          
          // Format timestamp without milliseconds for display
          const displayTimestamp = startTimestamp.split('.')[0];
          
          messages.push({
            id: `chat-${Date.now()}-${messages.length}`,
            user,
            message,
            recordingTime: displayTimestamp,
            recordingTimeSeconds: seconds,
            timestamp: new Date().toISOString()
          });
          
          // Skip the next line since we've processed it
          i = nextLineIndex;
          continue;
        }
      }
    }
    
    // Try different common single-line formats
    // Format 1: "HH:MM:SS - Speaker Name: Message"
    let match = line.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–]\s*(.+?):\s*(.+)$/);
    
    // Format 2: "[HH:MM:SS] Speaker Name: Message"
    if (!match) {
      match = line.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.+?):\s*(.+)$/);
    }
    
    // Format 3: "Speaker Name HH:MM:SS\nMessage" (Google Meet export format)
    if (!match) {
      match = line.match(/^(.+?)\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*$/);
    }
    
    if (match) {
      const timestamp = match[1];
      const user = match[2].trim();
      const message = match[3]?.trim() || '';
      
      const seconds = parseTimestampToSeconds(timestamp);
      
      if (message) {
        messages.push({
          id: `chat-${Date.now()}-${messages.length}`,
          user,
          message,
          recordingTime: timestamp,
          recordingTimeSeconds: seconds,
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  return messages;
}

module.exports = {
  getAccessToken,
  extractFileId,
  getFileMetadata,
  isValidGoogleDriveUrl,
  downloadFile,
  formatDuration,
  createSlug,
  mapDriveMetadataToRecording,
  listFilesInFolder,
  exportGoogleDocAsText,
  downloadFileAsText,
  findRelatedFiles,
  fetchAndConvertTranscript,
  parseChatExport,
  convertSrtToVtt,
  convertSbvToVtt
};

