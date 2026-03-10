// Helper to check if a URL is a YouTube feed
export const isYouTubeFeed = (url) => {
  if (!url) return false;
  return url.includes('youtube.com') || url.includes('youtu.be');
};

// Helper to extract YouTube video ID from a URL
export const extractYouTubeVideoId = (url) => {
  if (!url) return null;
  
  // Match various YouTube URL formats including Shorts
  const patterns = [
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,  // YouTube Shorts
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

// Helper to check if URL is a YouTube Short
export const isYouTubeShort = (url) => {
  if (!url) return false;
  return url.includes('youtube.com/shorts/');
};

// Helper to check if content is essentially empty
export const isContentEmpty = (content) => {
  if (!content) return true;
  // Strip HTML tags and whitespace
  const stripped = content.replace(/<[^>]*>/g, '').trim();
  return stripped.length < 50; // Consider empty if less than 50 chars of actual text
};

export const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

export const formatFullDate = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};
