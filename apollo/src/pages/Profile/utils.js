export const getTagColor = (tag) => {
  const colors = {
    manager: 'blue',
    teammate: 'green',
    engineering: 'purple',
    design: 'orange',
    product: 'cyan',
    leadership: 'gold',
    external: 'grey',
    mentor: 'blue',
    networking: 'green'
  };
  return colors[tag.toLowerCase()] || 'grey';
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
