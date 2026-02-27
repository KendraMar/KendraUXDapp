const path = require('path');
const fs = require('fs');
const { dataDir } = require('../../../../server/lib/config');

const recordingsDir = path.join(dataDir, 'recordings');

// Ensure recordings directory exists
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}

// Media file extensions we support
const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
const allMediaExtensions = [...videoExtensions, ...audioExtensions];

// Find the media file (video or audio) in a recording folder
function findMediaFile(folderPath) {
  const files = fs.readdirSync(folderPath);
  
  // First, try to find a video file (preferred)
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (videoExtensions.includes(ext)) {
      return { file, type: 'video' };
    }
  }
  
  // If no video, look for audio file
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (audioExtensions.includes(ext)) {
      return { file, type: 'audio' };
    }
  }
  
  return null;
}

// Backwards compatibility - find video file
function findVideoFile(folderPath) {
  const media = findMediaFile(folderPath);
  return media?.file || null;
}

// Load metadata for a recording folder
function loadRecordingMetadata(folderId) {
  const folderPath = path.join(recordingsDir, folderId);
  
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return null;
  }
  
  const metadataPath = path.join(folderPath, 'metadata.json');
  const chatPath = path.join(folderPath, 'chat.json');
  const transcriptPath = path.join(folderPath, 'transcript.vtt');
  const discussionPath = path.join(folderPath, 'discussion.json');
  
  // Load metadata.json
  let metadata = {};
  if (fs.existsSync(metadataPath)) {
    try {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    } catch (err) {
      console.error(`Error parsing metadata.json for ${folderId}:`, err);
    }
  }
  
  // Get sources array (required in v0.1.0 schema)
  const sources = metadata.sources || [];
  if (sources.length === 0) {
    console.warn(`No sources found for recording ${folderId}`);
    return null;
  }
  
  // Find the default source (first with default: true, or first source)
  const defaultSource = sources.find(s => s.default) || sources[0];
  
  // Determine media type from the default source's mimeType
  let mediaType = 'video';
  if (defaultSource.mimeType?.startsWith('audio/')) {
    mediaType = 'audio';
  }
  
  // Calculate size and timestamps based on source type
  let size = 0;
  let createdAt = metadata.recordedAt || new Date().toISOString();
  let modifiedAt = new Date().toISOString();
  
  if (defaultSource.type === 'google-drive') {
    // For Google Drive sources, use metadata from the source
    size = defaultSource.size || 0;
    modifiedAt = defaultSource.googleDrive?.importedAt || modifiedAt;
  } else if (defaultSource.type === 'local') {
    // For local sources, get file stats
    if (defaultSource.filename) {
      const mediaPath = path.join(folderPath, defaultSource.filename);
      if (fs.existsSync(mediaPath)) {
        const mediaStats = fs.statSync(mediaPath);
        size = mediaStats.size;
        createdAt = metadata.recordedAt || mediaStats.birthtime.toISOString();
        modifiedAt = mediaStats.mtime.toISOString();
      }
    }
  }
  
  // Load chat.json (optional)
  let chat = [];
  if (fs.existsSync(chatPath)) {
    try {
      chat = JSON.parse(fs.readFileSync(chatPath, 'utf-8'));
    } catch (err) {
      console.error(`Error parsing chat.json for ${folderId}:`, err);
    }
  }
  
  // Load discussion.json (optional)
  let discussion = [];
  if (fs.existsSync(discussionPath)) {
    try {
      discussion = JSON.parse(fs.readFileSync(discussionPath, 'utf-8'));
    } catch (err) {
      console.error(`Error parsing discussion.json for ${folderId}:`, err);
    }
  }
  
  // Check if transcript exists
  const hasTranscript = fs.existsSync(transcriptPath);
  
  const result = {
    id: folderId,
    ...metadata,
    mediaType, // 'video' or 'audio' (derived from default source)
    size,
    sizeFormatted: formatFileSize(size),
    hasTranscript,
    chat,
    discussion,
    createdAt,
    modifiedAt
  };
  
  return result;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Extract only the first tab content from a Google Docs export
 * Google Docs with multiple tabs exports all tabs with tab names as headers.
 * Common patterns for tab separators in meeting notes:
 * - "Transcript" on its own line (Google Meet notes)
 * - Tab names appearing as standalone lines after blank lines
 * 
 * This function attempts to detect and remove subsequent tabs,
 * keeping only the first tab (typically "Notes" for meeting recordings).
 */
function extractFirstTabContent(content) {
  if (!content) return content;
  
  const lines = content.split('\n');
  const result = [];
  
  // Common patterns that indicate the start of a transcript/second tab
  // These are checked as standalone lines (possibly with surrounding whitespace)
  const tabSeparatorPatterns = [
    /^transcript$/i,
    /^transcription$/i,
    /^meeting transcript$/i,
    /^auto-generated transcript$/i,
    /^captions$/i,
    /^closed captions$/i,
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check if this line matches a tab separator pattern
    // It should be preceded by a blank line (or be near the start)
    // to avoid matching "Transcript" within normal text
    const isPrecededByBlank = i === 0 || lines[i - 1].trim() === '';
    
    if (isPrecededByBlank && tabSeparatorPatterns.some(pattern => pattern.test(trimmedLine))) {
      // Found the start of a second tab - stop here
      console.log(`Found tab separator at line ${i + 1}: "${trimmedLine}"`);
      break;
    }
    
    result.push(line);
  }
  
  // Trim trailing blank lines
  while (result.length > 0 && result[result.length - 1].trim() === '') {
    result.pop();
  }
  
  return result.join('\n');
}

module.exports = {
  recordingsDir,
  videoExtensions,
  audioExtensions,
  allMediaExtensions,
  findMediaFile,
  findVideoFile,
  loadRecordingMetadata,
  formatFileSize,
  extractFirstTabContent
};
