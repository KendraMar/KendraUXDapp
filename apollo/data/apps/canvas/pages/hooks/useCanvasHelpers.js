import { useCallback } from 'react';
import { isNodeInsideGroup, snapPosition as snapPositionHelper, screenToCanvas as screenToCanvasHelper } from '../canvasHelpers';
import { SNAP_DISTANCE, GRID_SIZE } from '../canvasConstants';

export const useCanvasHelpers = ({
  canvas,
  collapsedGroups,
  snapToGrid,
  viewportOffset,
  zoom,
  canvasRef
}) => {
  // Snap to grid
  const snapPosition = useCallback((x, y) => {
    return snapPositionHelper(x, y, snapToGrid);
  }, [snapToGrid]);

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX, screenY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    return screenToCanvasHelper(screenX, screenY, rect, viewportOffset, zoom);
  }, [viewportOffset, zoom, canvasRef]);

  // Check if a node is geometrically inside a group
  const isNodeInsideGroupCheck = useCallback((node, group) => {
    return isNodeInsideGroup(node, group);
  }, []);

  // Get all nodes that are inside collapsed groups
  const getHiddenNodeIds = useCallback(() => {
    if (!canvas?.data?.nodes || collapsedGroups.size === 0) return new Set();
    
    const hiddenIds = new Set();
    const groups = canvas.data.nodes.filter(n => n.type === 'group' && collapsedGroups.has(n.id));
    
    canvas.data.nodes.forEach(node => {
      for (const group of groups) {
        if (isNodeInsideGroup(node, group)) {
          hiddenIds.add(node.id);
          break;
        }
      }
    });
    
    return hiddenIds;
  }, [canvas, collapsedGroups]);

  // Get count of nodes inside a group
  const getNodesInGroup = useCallback((groupId) => {
    if (!canvas?.data?.nodes) return [];
    const group = canvas.data.nodes.find(n => n.id === groupId);
    if (!group) return [];
    
    return canvas.data.nodes.filter(node => isNodeInsideGroup(node, group));
  }, [canvas]);

  // Find which collapsed group contains a node (returns the group id or null)
  const getContainingCollapsedGroup = useCallback((nodeId) => {
    if (!canvas?.data?.nodes || collapsedGroups.size === 0) return null;
    
    const node = canvas.data.nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    const groups = canvas.data.nodes.filter(n => n.type === 'group' && collapsedGroups.has(n.id));
    
    for (const group of groups) {
      if (isNodeInsideGroup(node, group)) {
        return group.id;
      }
    }
    
    return null;
  }, [canvas, collapsedGroups]);

  // Get all nodes that should move with a group (nodes inside the group)
  const getNodesMovingWithGroup = useCallback((groupId) => {
    if (!canvas?.data?.nodes) return [];
    const group = canvas.data.nodes.find(n => n.id === groupId && n.type === 'group');
    if (!group) return [];
    
    return canvas.data.nodes.filter(node => isNodeInsideGroup(node, group));
  }, [canvas]);

  // Get node center for edge rendering
  const getNodeCenter = useCallback((nodeId, side = 'center') => {
    const node = canvas?.data?.nodes?.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    
    // Check if this is a collapsed group
    const isCollapsedGroup = node.type === 'group' && collapsedGroups.has(node.id);
    const collapsedHeight = 40;
    
    // Account for visual offset of group nodes (label takes 24px at top)
    const yOffset = node.type === 'group' ? 24 : 0;
    const effectiveHeight = node.type === 'group' 
      ? (isCollapsedGroup ? collapsedHeight : node.height - 24) 
      : node.height;
    
    const centerX = node.x + node.width / 2;
    const centerY = node.y + yOffset + effectiveHeight / 2;
    
    switch (side) {
      case 'top': return { x: centerX, y: node.y + yOffset };
      case 'bottom': return { x: centerX, y: node.y + yOffset + effectiveHeight };
      case 'left': return { x: node.x, y: centerY };
      case 'right': return { x: node.x + node.width, y: centerY };
      default: return { x: centerX, y: centerY };
    }
  }, [canvas, collapsedGroups]);

  // Get all attachment points for a node
  const getNodeAttachmentPoints = useCallback((node) => {
    if (!node) return [];
    
    const isCollapsedGroup = node.type === 'group' && collapsedGroups.has(node.id);
    const collapsedHeight = 40;
    const yOffset = node.type === 'group' ? 24 : 0;
    const effectiveHeight = node.type === 'group' 
      ? (isCollapsedGroup ? collapsedHeight : node.height - 24) 
      : node.height;
    
    const centerX = node.x + node.width / 2;
    const centerY = node.y + yOffset + effectiveHeight / 2;
    
    return [
      { side: 'top', x: centerX, y: node.y + yOffset },
      { side: 'bottom', x: centerX, y: node.y + yOffset + effectiveHeight },
      { side: 'left', x: node.x, y: centerY },
      { side: 'right', x: node.x + node.width, y: centerY }
    ];
  }, [collapsedGroups]);

  // Find nearest attachment point across all nodes
  const findNearestSnapTarget = useCallback((position, excludeNodeIds = []) => {
    if (!canvas?.data?.nodes || !position) return null;
    
    const hiddenNodeIds = getHiddenNodeIds();
    let nearest = null;
    let nearestDistance = SNAP_DISTANCE;
    
    canvas.data.nodes.forEach(node => {
      // Skip hidden nodes and excluded nodes
      if (hiddenNodeIds.has(node.id) || excludeNodeIds.includes(node.id)) return;
      
      const attachmentPoints = getNodeAttachmentPoints(node);
      
      attachmentPoints.forEach(point => {
        const dx = position.x - point.x;
        const dy = position.y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = {
            nodeId: node.id,
            side: point.side,
            point: { x: point.x, y: point.y }
          };
        }
      });
    });
    
    return nearest;
  }, [canvas, getHiddenNodeIds, getNodeAttachmentPoints]);

  return {
    snapPosition,
    screenToCanvas,
    isNodeInsideGroup: isNodeInsideGroupCheck,
    getHiddenNodeIds,
    getNodesInGroup,
    getContainingCollapsedGroup,
    getNodesMovingWithGroup,
    getNodeCenter,
    getNodeAttachmentPoints,
    findNearestSnapTarget
  };
};
