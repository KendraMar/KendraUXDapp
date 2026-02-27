// Format timestamp for display
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Helper function to shift heading levels in markdown (H1 -> H3, H2 -> H4, etc.)
export const shiftMarkdownHeadings = (markdown, shiftBy = 2) => {
  if (!markdown) return '';
  
  // Replace markdown headings, shifting by the specified amount
  // Process from largest to smallest to avoid double-shifting
  let shifted = markdown;
  
  // Handle ATX-style headings (# Heading)
  // Work backwards from h6 to h1 to avoid double-processing
  for (let level = 6; level >= 1; level--) {
    const newLevel = Math.min(level + shiftBy, 6);
    const pattern = new RegExp(`^${'#'.repeat(level)}\\s`, 'gm');
    shifted = shifted.replace(pattern, '#'.repeat(newLevel) + ' ');
  }
  
  return shifted;
};
