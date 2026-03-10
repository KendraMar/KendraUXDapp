import { GRID_SIZE } from './canvasConstants';

// Snap to grid
export const snapPosition = (x, y, snapToGrid) => {
  if (!snapToGrid) return { x, y };
  return {
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE
  };
};

// Convert screen coordinates to canvas coordinates
export const screenToCanvas = (screenX, screenY, rect, viewportOffset, zoom) => {
  if (!rect) return { x: 0, y: 0 };
  return {
    x: (screenX - rect.left - viewportOffset.x) / zoom,
    y: (screenY - rect.top - viewportOffset.y) / zoom
  };
};

// Check if a node is geometrically inside a group (using visual coordinates)
export const isNodeInsideGroup = (node, group) => {
  if (node.id === group.id) return false;
  if (node.type === 'group') return false; // Don't nest groups
  
  // Calculate visual coordinates accounting for group label offset
  const nodeY = node.type === 'group' ? node.y + 24 : node.y;
  const nodeHeight = node.type === 'group' ? node.height - 24 : node.height;
  const groupY = group.y + 24; // Group visual area starts after label
  const groupHeight = group.height - 24;
  
  const nodeCenter = {
    x: node.x + node.width / 2,
    y: nodeY + nodeHeight / 2
  };
  
  return (
    nodeCenter.x >= group.x &&
    nodeCenter.x <= group.x + group.width &&
    nodeCenter.y >= groupY &&
    nodeCenter.y <= groupY + groupHeight
  );
};

// Render edge path
export const renderEdgePath = (from, to, curved = true) => {
  if (curved) {
    const dx = to.x - from.x;
    const controlOffset = Math.abs(dx) / 2;
    return `M ${from.x} ${from.y} C ${from.x + controlOffset} ${from.y}, ${to.x - controlOffset} ${to.y}, ${to.x} ${to.y}`;
  }
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
};
