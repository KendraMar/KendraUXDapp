// Parse VTT file into cues array
export const parseVTT = (vttContent) => {
  const cues = [];
  const lines = vttContent.split('\n');
  let i = 0;
  
  // Skip WEBVTT header
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (line.includes('-->')) {
      const [startStr, endStr] = line.split('-->').map(s => s.trim());
      const startSeconds = parseVTTTime(startStr);
      const endSeconds = parseVTTTime(endStr);
      
      // Collect text lines until we hit an empty line or another timestamp
      let text = '';
      i++;
      while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
        text += (text ? ' ' : '') + lines[i].trim();
        i++;
      }
      
      if (text) {
        cues.push({
          id: `cue-${cues.length}`,
          start: startSeconds,
          end: endSeconds,
          startFormatted: formatVTTTimeDisplay(startSeconds),
          text
        });
      }
    } else {
      i++;
    }
  }
  
  return cues;
};

// Parse VTT timestamp to seconds
export const parseVTTTime = (timeStr) => {
  const parts = timeStr.split(':');
  let seconds = 0;
  
  if (parts.length === 3) {
    // HH:MM:SS.mmm
    seconds = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    // MM:SS.mmm
    seconds = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  }
  
  return seconds;
};

// Format seconds to display time (MM:SS)
export const formatVTTTimeDisplay = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
