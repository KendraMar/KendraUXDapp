import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Title,
  Button
} from '@patternfly/react-core';
import { OutlinedFileImageIcon } from '@patternfly/react-icons';
import CanvasToolbar from './components/CanvasToolbar';
import CanvasSidebar from './components/CanvasSidebar';
import CanvasNode from './components/CanvasNode';
import CanvasEdge from './components/CanvasEdge';
import LinkModal from './components/LinkModal';
import EmojiPicker from './components/EmojiPicker';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useCanvasHelpers } from './hooks/useCanvasHelpers';
import {
  generateId,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  DEFAULT_STICKY_WIDTH,
  DEFAULT_STICKY_HEIGHT,
  DEFAULT_DRAWING_STROKE_WIDTH,
  DEFAULT_DRAWING_COLOR,
  DRAWING_MIN_DISTANCE,
  GRID_SIZE,
  TOOL_MODES,
  NODE_COLORS,
  CANVAS_THEMES,
  DEFAULT_CANVAS_THEME,
  GRID_STYLES,
  DEFAULT_GRID_STYLE
} from './canvasConstants';
import { renderEdgePath } from './canvasHelpers';

const CanvasDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Canvas state
  const [canvas, setCanvas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Active tool
  const [activeTool, setActiveTool] = useState(TOOL_MODES.SELECT);
  
  // Viewport
  const [viewportOffset, setViewportOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Selection
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedEdges, setSelectedEdges] = useState([]);
  const [selectionBox, setSelectionBox] = useState(null);
  
  // Dragging
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragNodeStart, setDragNodeStart] = useState({});
  
  // Edge creation
  const [isCreatingEdge, setIsCreatingEdge] = useState(false);
  const [edgeStart, setEdgeStart] = useState(null);
  const [edgePreview, setEdgePreview] = useState(null);
  
  // Edge reconnection
  const [isReconnectingEdge, setIsReconnectingEdge] = useState(false);
  const [reconnectEdgeId, setReconnectEdgeId] = useState(null);
  const [reconnectEndpoint, setReconnectEndpoint] = useState(null);
  const [reconnectPreview, setReconnectPreview] = useState(null);
  
  // Snap target
  const [snapTargetNode, setSnapTargetNode] = useState(null);
  
  // Node editing
  const [editingNode, setEditingNode] = useState(null);
  const [editingText, setEditingText] = useState('');
  
  // Settings
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [canvasTheme, setCanvasTheme] = useState(() => {
    try {
      return localStorage.getItem('canvas-theme') || DEFAULT_CANVAS_THEME;
    } catch { return DEFAULT_CANVAS_THEME; }
  });
  const theme = CANVAS_THEMES[canvasTheme] || CANVAS_THEMES[DEFAULT_CANVAS_THEME];
  const [gridStyle, setGridStyle] = useState(() => {
    try {
      return localStorage.getItem('canvas-grid-style') || DEFAULT_GRID_STYLE;
    } catch { return DEFAULT_GRID_STYLE; }
  });
  
  // Dropdowns
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  
  // Modals
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [pendingLinkPosition, setPendingLinkPosition] = useState(null);
  
  // Node resizing
  const [isResizing, setIsResizing] = useState(false);
  const [resizeNode, setResizeNode] = useState(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  
  // Drag and drop for image upload
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const drawingPointsRef = useRef([]);
  
  // Emoji picker state
  const [emojiPickerState, setEmojiPickerState] = useState(null); // { nodeId, position: {x, y} }
  
  // Clipboard state (cut/copy/paste)
  const clipboardRef = useRef(null); // { nodes: [], edges: [], isCut: false }

  // Auto-save state
  const [lastSavedData, setLastSavedData] = useState(null);
  const autoSaveTimeoutRef = useRef(null);
  const isAutoSaving = useRef(false);

  // Initialize undo/redo hook
  const {
    history,
    historyIndex,
    saveToHistory,
    undo: undoAction,
    redo: redoAction
  } = useUndoRedo(canvas?.data);

  // Initialize canvas helpers hook
  const canvasHelpers = useCanvasHelpers({
    canvas,
    collapsedGroups,
    snapToGrid,
    viewportOffset,
    zoom,
    canvasRef
  });

  const {
    snapPosition,
    screenToCanvas,
    getHiddenNodeIds,
    getNodesInGroup,
    getContainingCollapsedGroup,
    getNodesMovingWithGroup,
    getNodeCenter,
    findNearestSnapTarget
  } = canvasHelpers;

  // Fetch canvas data
  useEffect(() => {
    fetchCanvas();
  }, [id]);

  const fetchCanvas = async () => {
    try {
      const response = await fetch(`/api/canvas/${id}`);
      const data = await response.json();
      if (data.success) {
        setCanvas(data.canvas);
        setLastSavedData(JSON.stringify(data.canvas.data));
        saveToHistory(data.canvas.data);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching canvas:', err);
      setError('Failed to load canvas');
      setLoading(false);
    }
  };

  // Auto-save function
  const performAutoSave = useCallback(async (dataToSave) => {
    if (!dataToSave || isAutoSaving.current) return;
    const currentDataStr = JSON.stringify(dataToSave);
    if (currentDataStr === lastSavedData) return;
    
    isAutoSaving.current = true;
    try {
      const response = await fetch(`/api/canvas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: dataToSave })
      });
      const result = await response.json();
      if (result.success) {
        setLastSavedData(currentDataStr);
        setHasChanges(false);
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
    isAutoSaving.current = false;
  }, [id, lastSavedData]);

  // Debounced auto-save
  useEffect(() => {
    if (!hasChanges || !canvas?.data) return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave(canvas.data);
    }, 3000);
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [hasChanges, canvas?.data, performAutoSave]);

  // Save on browser navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges && canvas?.data) {
        const dataStr = JSON.stringify({ data: canvas.data });
        navigator.sendBeacon(`/api/canvas/${id}`, new Blob([dataStr], { type: 'application/json' }));
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, canvas?.data, id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, []);

  // Refs for unmount save
  const canvasDataRef = useRef(null);
  const hasChangesRef = useRef(false);
  const lastSavedDataRef = useRef(null);
  
  useEffect(() => {
    canvasDataRef.current = canvas?.data;
    hasChangesRef.current = hasChanges;
    lastSavedDataRef.current = lastSavedData;
  }, [canvas?.data, hasChanges, lastSavedData]);

  useEffect(() => {
    return () => {
      if (hasChangesRef.current && canvasDataRef.current) {
        const currentDataStr = JSON.stringify(canvasDataRef.current);
        if (currentDataStr !== lastSavedDataRef.current) {
          const dataStr = JSON.stringify({ data: canvasDataRef.current });
          navigator.sendBeacon(`/api/canvas/${id}`, new Blob([dataStr], { type: 'application/json' }));
        }
      }
    };
  }, [id]);

  // Navigate back with save
  const handleNavigateBack = useCallback(async () => {
    if (hasChanges && canvas?.data) {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      try {
        await fetch(`/api/canvas/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: canvas.data })
        });
      } catch (err) {
        console.error('Error saving before navigation:', err);
      }
    }
    navigate('/canvas');
  }, [hasChanges, canvas?.data, id, navigate]);

  // Update canvas data
  const updateCanvasData = useCallback((newData, skipHistory = false) => {
    setCanvas(prev => ({ ...prev, data: newData }));
    if (!skipHistory) {
      const changed = saveToHistory(newData);
      if (changed) setHasChanges(true);
    }
  }, [saveToHistory]);

  // Undo
  const handleUndo = useCallback(() => {
    const newData = undoAction();
    if (newData) {
      setCanvas(prev => ({ ...prev, data: newData }));
      setHasChanges(true);
    }
  }, [undoAction]);

  // Redo
  const handleRedo = useCallback(() => {
    const newData = redoAction();
    if (newData) {
      setCanvas(prev => ({ ...prev, data: newData }));
      setHasChanges(true);
    }
  }, [redoAction]);

  // Manual save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/canvas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: canvas.data })
      });
      const data = await response.json();
      if (data.success) {
        setLastSavedData(JSON.stringify(canvas.data));
        setHasChanges(false);
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (err) {
      console.error('Error saving:', err);
      alert('Failed to save changes');
    }
    setIsSaving(false);
  };

  // Toggle group collapse
  const toggleGroupCollapse = useCallback((groupId) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) newSet.delete(groupId);
      else newSet.add(groupId);
      return newSet;
    });
  }, []);

  // Add node
  const addNode = useCallback((type, position, extraProps = {}) => {
    const isSticky = type === 'sticky';
    const actualType = isSticky ? 'text' : type;
    const defaultWidth = isSticky ? DEFAULT_STICKY_WIDTH : DEFAULT_NODE_WIDTH;
    const defaultHeight = isSticky ? DEFAULT_STICKY_HEIGHT : (type === 'group' ? 300 : DEFAULT_NODE_HEIGHT);

    const canvasPos = position || screenToCanvas(
      canvasRef.current?.clientWidth / 2 || 400,
      canvasRef.current?.clientHeight / 2 || 300
    );
    const snapped = snapPosition(canvasPos.x - defaultWidth / 2, canvasPos.y - defaultHeight / 2);
    
    const newNode = {
      id: generateId(),
      type: actualType,
      x: snapped.x,
      y: snapped.y,
      width: defaultWidth,
      height: defaultHeight,
      ...extraProps
    };

    if (isSticky) {
      newNode.subtype = 'sticky';
      newNode.text = extraProps.text || '';
      newNode.color = extraProps.color || '3'; // yellow
    } else if (type === 'text') {
      newNode.text = 'New text node';
    } else if (type === 'link') {
      newNode.url = extraProps.url || 'https://example.com';
    } else if (type === 'group') {
      newNode.label = 'Group';
    }

    const newData = {
      ...canvas.data,
      nodes: [...canvas.data.nodes, newNode]
    };
    updateCanvasData(newData);
    setSelectedNodes([newNode.id]);
    setSelectedEdges([]);
    return newNode;
  }, [canvas, screenToCanvas, snapPosition, updateCanvasData]);

  // Delete selected items
  const deleteSelected = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    const newNodes = canvas.data.nodes.filter(n => !selectedNodes.includes(n.id));
    const newEdges = canvas.data.edges.filter(e => 
      !selectedEdges.includes(e.id) && 
      !selectedNodes.includes(e.fromNode) && 
      !selectedNodes.includes(e.toNode)
    );
    updateCanvasData({ ...canvas.data, nodes: newNodes, edges: newEdges });
    setSelectedNodes([]);
    setSelectedEdges([]);
  }, [canvas, selectedNodes, selectedEdges, updateCanvasData]);

  // Copy selected nodes/edges to clipboard
  const copySelected = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    const copiedNodes = canvas.data.nodes.filter(n => selectedNodes.includes(n.id));
    // Include edges that connect selected nodes, plus explicitly selected edges
    const copiedEdges = canvas.data.edges.filter(e =>
      selectedEdges.includes(e.id) ||
      (selectedNodes.includes(e.fromNode) && selectedNodes.includes(e.toNode))
    );
    clipboardRef.current = {
      nodes: JSON.parse(JSON.stringify(copiedNodes)),
      edges: JSON.parse(JSON.stringify(copiedEdges)),
      isCut: false
    };
  }, [canvas, selectedNodes, selectedEdges]);

  // Cut selected nodes/edges (copy then delete)
  const cutSelected = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    const copiedNodes = canvas.data.nodes.filter(n => selectedNodes.includes(n.id));
    const copiedEdges = canvas.data.edges.filter(e =>
      selectedEdges.includes(e.id) ||
      (selectedNodes.includes(e.fromNode) && selectedNodes.includes(e.toNode))
    );
    clipboardRef.current = {
      nodes: JSON.parse(JSON.stringify(copiedNodes)),
      edges: JSON.parse(JSON.stringify(copiedEdges)),
      isCut: true
    };
    // Delete the selected items
    deleteSelected();
  }, [canvas, selectedNodes, selectedEdges, deleteSelected]);

  // Paste from clipboard
  const pasteFromClipboard = useCallback(() => {
    if (!clipboardRef.current || clipboardRef.current.nodes.length === 0) return;
    const { nodes: clipNodes, edges: clipEdges } = clipboardRef.current;

    // Build a mapping from old IDs to new IDs
    const idMap = {};
    const pasteOffset = 40; // offset in canvas units so pasted items don't land exactly on top

    const newNodes = clipNodes.map(node => {
      const newId = generateId();
      idMap[node.id] = newId;
      return {
        ...node,
        id: newId,
        x: node.x + pasteOffset,
        y: node.y + pasteOffset
      };
    });

    const newEdges = clipEdges
      .filter(edge => idMap[edge.fromNode] && idMap[edge.toNode])
      .map(edge => ({
        ...edge,
        id: generateId(),
        fromNode: idMap[edge.fromNode],
        toNode: idMap[edge.toNode]
      }));

    const newData = {
      ...canvas.data,
      nodes: [...canvas.data.nodes, ...newNodes],
      edges: [...canvas.data.edges, ...newEdges]
    };
    updateCanvasData(newData);

    // Select the newly pasted items
    setSelectedNodes(newNodes.map(n => n.id));
    setSelectedEdges([]);

    // Update clipboard so the next paste offsets further (and it's no longer a "cut")
    clipboardRef.current = {
      nodes: newNodes.map(n => ({ ...n })),
      edges: newEdges.map(e => ({ ...e })),
      isCut: false
    };
  }, [canvas, updateCanvasData]);

  // Apply color
  const applyColor = useCallback((colorId) => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    const newNodes = canvas.data.nodes.map(node =>
      selectedNodes.includes(node.id) ? { ...node, color: colorId } : node
    );
    const newEdges = canvas.data.edges.map(edge =>
      selectedEdges.includes(edge.id) ? { ...edge, color: colorId } : edge
    );
    updateCanvasData({ ...canvas.data, nodes: newNodes, edges: newEdges });
  }, [canvas, selectedNodes, selectedEdges, updateCanvasData]);

  // Clear color
  const clearColor = useCallback(() => {
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    const newNodes = canvas.data.nodes.map(node => {
      if (selectedNodes.includes(node.id)) {
        const { color, ...rest } = node;
        return rest;
      }
      return node;
    });
    const newEdges = canvas.data.edges.map(edge => {
      if (selectedEdges.includes(edge.id)) {
        const { color, ...rest } = edge;
        return rest;
      }
      return edge;
    });
    updateCanvasData({ ...canvas.data, nodes: newNodes, edges: newEdges });
  }, [canvas, selectedNodes, selectedEdges, updateCanvasData]);

  // Get selection color
  const getSelectionColor = useCallback(() => {
    const selectedNodeColors = canvas?.data?.nodes
      ?.filter(n => selectedNodes.includes(n.id))
      ?.map(n => n.color) || [];
    const selectedEdgeColors = canvas?.data?.edges
      ?.filter(e => selectedEdges.includes(e.id))
      ?.map(e => e.color) || [];
    const allColors = [...selectedNodeColors, ...selectedEdgeColors];
    if (allColors.length === 0) return null;
    const firstColor = allColors[0];
    return allColors.every(c => c === firstColor) ? firstColor : null;
  }, [canvas, selectedNodes, selectedEdges]);

  // Cancel edge reconnection
  const cancelEdgeReconnection = useCallback(() => {
    setIsReconnectingEdge(false);
    setReconnectEdgeId(null);
    setReconnectEndpoint(null);
    setReconnectPreview(null);
    setSnapTargetNode(null);
  }, []);

  // Complete edge reconnection
  const completeEdgeReconnection = useCallback((targetNodeId) => {
    if (!reconnectEdgeId || !reconnectEndpoint) return;
    const edge = canvas?.data?.edges?.find(e => e.id === reconnectEdgeId);
    if (!edge) return;
    
    if (reconnectEndpoint === 'from' && (targetNodeId === edge.fromNode || targetNodeId === edge.toNode)) {
      cancelEdgeReconnection();
      return;
    }
    if (reconnectEndpoint === 'to' && (targetNodeId === edge.toNode || targetNodeId === edge.fromNode)) {
      cancelEdgeReconnection();
      return;
    }
    
    const newEdges = canvas.data.edges.map(e => {
      if (e.id === reconnectEdgeId) {
        if (reconnectEndpoint === 'from') {
          return { 
            ...e, 
            fromNode: targetNodeId,
            fromSide: snapTargetNode?.nodeId === targetNodeId ? snapTargetNode.side : (e.fromSide || 'right')
          };
        } else {
          return { 
            ...e, 
            toNode: targetNodeId,
            toSide: snapTargetNode?.nodeId === targetNodeId ? snapTargetNode.side : (e.toSide || 'left')
          };
        }
      }
      return e;
    });
    
    updateCanvasData({ ...canvas.data, edges: newEdges });
    cancelEdgeReconnection();
  }, [reconnectEdgeId, reconnectEndpoint, canvas, updateCanvasData, snapTargetNode, cancelEdgeReconnection]);

  // --- Emoji Reactions ---
  
  const handleAddReaction = useCallback((nodeId, position) => {
    setEmojiPickerState({ nodeId, position });
  }, []);

  const handleEmojiSelect = useCallback((emoji) => {
    if (!emojiPickerState) return;
    const { nodeId } = emojiPickerState;
    
    const newNodes = canvas.data.nodes.map(node => {
      if (node.id === nodeId) {
        const reactions = node.reactions ? [...node.reactions] : [];
        reactions.push({
          emoji,
          user: 'You',
          addedAt: new Date().toISOString()
        });
        return { ...node, reactions };
      }
      return node;
    });
    
    updateCanvasData({ ...canvas.data, nodes: newNodes });
    setEmojiPickerState(null);
  }, [emojiPickerState, canvas, updateCanvasData]);

  const handleToggleReaction = useCallback((nodeId, emoji) => {
    const newNodes = canvas.data.nodes.map(node => {
      if (node.id === nodeId) {
        const reactions = node.reactions ? [...node.reactions] : [];
        const existingIdx = reactions.findIndex(r => r.emoji === emoji && r.user === 'You');
        if (existingIdx >= 0) {
          reactions.splice(existingIdx, 1);
        } else {
          reactions.push({
            emoji,
            user: 'You',
            addedAt: new Date().toISOString()
          });
        }
        return { ...node, reactions: reactions.length > 0 ? reactions : undefined };
      }
      return node;
    });
    
    updateCanvasData({ ...canvas.data, nodes: newNodes });
  }, [canvas, updateCanvasData]);

  const closeEmojiPicker = useCallback(() => {
    setEmojiPickerState(null);
  }, []);

  // --- Drawing ---

  const finalizeDrawing = useCallback((points) => {
    if (!points || points.length < 2) return;
    
    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    points.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    });
    
    const padding = 10;
    const nodeX = minX - padding;
    const nodeY = minY - padding;
    const nodeWidth = Math.max(40, maxX - minX + padding * 2);
    const nodeHeight = Math.max(40, maxY - minY + padding * 2);
    
    // Normalize points relative to node origin
    const normalizedPoints = points.map(([x, y]) => [x - nodeX, y - nodeY]);
    
    const newNode = {
      id: generateId(),
      type: 'text',
      subtype: 'drawing',
      x: nodeX,
      y: nodeY,
      width: nodeWidth,
      height: nodeHeight,
      text: '',
      drawingData: {
        paths: [{
          points: normalizedPoints,
          color: DEFAULT_DRAWING_COLOR,
          strokeWidth: DEFAULT_DRAWING_STROKE_WIDTH
        }]
      }
    };
    
    const newData = {
      ...canvas.data,
      nodes: [...canvas.data.nodes, newNode]
    };
    updateCanvasData(newData);
  }, [canvas, updateCanvasData]);

  // --- Tool Change ---
  
  const handleToolChange = useCallback((tool) => {
    setActiveTool(tool);
    // Clear selection when switching away from select
    if (tool !== TOOL_MODES.SELECT) {
      setSelectedNodes([]);
      setSelectedEdges([]);
    }
    // Close emoji picker
    setEmojiPickerState(null);
  }, []);

  // --- Keyboard Shortcuts ---

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingNode) return;
      // Don't handle shortcuts when emoji picker is open
      if (emojiPickerState) return;
      // Don't handle if focus is in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'x' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        cutSelected();
      } else if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        copySelected();
      } else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        pasteFromClipboard();
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSelectedNodes(canvas?.data?.nodes?.map(n => n.id) || []);
      } else if (e.key === 'Escape') {
        setActiveTool(TOOL_MODES.SELECT);
        setSelectedNodes([]);
        setSelectedEdges([]);
        setIsCreatingEdge(false);
        setEdgeStart(null);
        setEdgePreview(null);
        setEmojiPickerState(null);
        cancelEdgeReconnection();
      } else if (e.key === 'v' || e.key === 'V') {
        if (!e.ctrlKey && !e.metaKey) {
          handleToolChange(TOOL_MODES.SELECT);
        }
      } else if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
        handleToolChange(TOOL_MODES.TEXT);
      } else if (e.key === 's' && !e.ctrlKey && !e.metaKey) {
        handleToolChange(TOOL_MODES.STICKY);
      } else if (e.key === 'd' && !e.ctrlKey && !e.metaKey) {
        handleToolChange(TOOL_MODES.DRAW);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, handleUndo, handleRedo, editingNode, canvas, cancelEdgeReconnection, handleToolChange, emojiPickerState, cutSelected, copySelected, pasteFromClipboard]);

  // Handle mouse wheel for zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const isPinch = e.ctrlKey || Math.abs(e.deltaY) < 50;
    let zoomFactor;
    if (isPinch) {
      zoomFactor = 1 - e.deltaY * 0.01;
    } else {
      zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    }
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 5);
    const rect = canvasRef.current?.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const scale = newZoom / zoom;
    setViewportOffset({
      x: mouseX - (mouseX - viewportOffset.x) * scale,
      y: mouseY - (mouseY - viewportOffset.y) * scale
    });
    setZoom(newZoom);
  }, [zoom, viewportOffset]);

  // Handle canvas mouse down
  const handleCanvasMouseDown = useCallback((e) => {
    if (e.target !== canvasRef.current) return;
    
    // Close emoji picker on canvas click
    if (emojiPickerState) {
      setEmojiPickerState(null);
      return;
    }

    const canvasPos = screenToCanvas(e.clientX, e.clientY);

    // Cancel edge reconnection if clicking on empty canvas
    if (isReconnectingEdge) {
      cancelEdgeReconnection();
      return;
    }

    // Right click or middle mouse - pan
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewportOffset.x, y: e.clientY - viewportOffset.y });
      return;
    }

    // --- Tool-specific canvas click handling ---
    
    if (activeTool === TOOL_MODES.TEXT) {
      addNode('text', canvasPos);
      setActiveTool(TOOL_MODES.SELECT);
      return;
    }
    
    if (activeTool === TOOL_MODES.STICKY) {
      const newNode = addNode('sticky', canvasPos);
      setActiveTool(TOOL_MODES.SELECT);
      // Start editing immediately
      if (newNode) {
        setEditingNode(newNode.id);
        setEditingText('');
      }
      return;
    }
    
    if (activeTool === TOOL_MODES.GROUP) {
      addNode('group', canvasPos);
      setActiveTool(TOOL_MODES.SELECT);
      return;
    }
    
    if (activeTool === TOOL_MODES.DRAW) {
      // Start drawing
      setIsDrawing(true);
      const point = [canvasPos.x, canvasPos.y];
      setDrawingPoints([point]);
      drawingPointsRef.current = [point];
      return;
    }

    // --- Default select behavior ---
    
    if (e.button === 0 && !e.shiftKey) {
      setSelectedNodes([]);
      setSelectedEdges([]);
    }
    
    setSelectionBox({
      startX: canvasPos.x,
      startY: canvasPos.y,
      endX: canvasPos.x,
      endY: canvasPos.y
    });
  }, [screenToCanvas, viewportOffset, isReconnectingEdge, cancelEdgeReconnection, activeTool, addNode, emojiPickerState]);

  // Handle canvas mouse move
  const handleCanvasMouseMove = useCallback((e) => {
    if (isPanning) {
      setViewportOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    // Drawing mode
    if (isDrawing && activeTool === TOOL_MODES.DRAW) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const lastPoint = drawingPointsRef.current[drawingPointsRef.current.length - 1];
      const dx = canvasPos.x - lastPoint[0];
      const dy = canvasPos.y - lastPoint[1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist >= DRAWING_MIN_DISTANCE) {
        const newPoint = [canvasPos.x, canvasPos.y];
        drawingPointsRef.current = [...drawingPointsRef.current, newPoint];
        setDrawingPoints(drawingPointsRef.current);
      }
      return;
    }

    if (isDragging && selectedNodes.length > 0) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      
      setCanvas(prev => {
        const newNodes = prev.data.nodes.map(node => {
          const startPos = dragNodeStart[node.id];
          if (startPos) {
            const newPos = snapPosition(startPos.x + dx, startPos.y + dy);
            return { ...node, x: newPos.x, y: newPos.y };
          }
          return node;
        });
        return { ...prev, data: { ...prev.data, nodes: newNodes } };
      });
      return;
    }

    if (isResizing && resizeNode) {
      const dx = (e.clientX - resizeStart.x) / zoom;
      const dy = (e.clientY - resizeStart.y) / zoom;
      const newWidth = Math.max(100, resizeStart.width + dx);
      const newHeight = Math.max(60, resizeStart.height + dy);
      
      setCanvas(prev => {
        const newNodes = prev.data.nodes.map(node => {
          if (node.id === resizeNode) {
            return { 
              ...node, 
              width: snapToGrid ? Math.round(newWidth / GRID_SIZE) * GRID_SIZE : newWidth,
              height: snapToGrid ? Math.round(newHeight / GRID_SIZE) * GRID_SIZE : newHeight
            };
          }
          return node;
        });
        return { ...prev, data: { ...prev.data, nodes: newNodes } };
      });
      return;
    }

    if (selectionBox) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setSelectionBox(prev => ({ ...prev, endX: canvasPos.x, endY: canvasPos.y }));
      return;
    }

    if (isCreatingEdge && edgeStart) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setEdgePreview(canvasPos);
      const snapTarget = findNearestSnapTarget(canvasPos, [edgeStart]);
      setSnapTargetNode(snapTarget);
    }

    if (isReconnectingEdge && reconnectEdgeId) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setReconnectPreview(canvasPos);
      const edge = canvas?.data?.edges?.find(e => e.id === reconnectEdgeId);
      const excludeNodeId = reconnectEndpoint === 'from' ? edge?.toNode : edge?.fromNode;
      const snapTarget = findNearestSnapTarget(canvasPos, excludeNodeId ? [excludeNodeId] : []);
      setSnapTargetNode(snapTarget);
    }
  }, [isPanning, panStart, isDragging, dragStart, dragNodeStart, selectedNodes, zoom, canvas, snapPosition, isResizing, resizeNode, resizeStart, snapToGrid, selectionBox, screenToCanvas, isCreatingEdge, edgeStart, isReconnectingEdge, reconnectEdgeId, reconnectEndpoint, findNearestSnapTarget, isDrawing, activeTool]);

  // Handle canvas mouse up
  const handleCanvasMouseUp = useCallback((e) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    // Finalize drawing
    if (isDrawing) {
      setIsDrawing(false);
      finalizeDrawing(drawingPointsRef.current);
      setDrawingPoints([]);
      drawingPointsRef.current = [];
      return;
    }

    if (isReconnectingEdge) {
      if (snapTargetNode) {
        completeEdgeReconnection(snapTargetNode.nodeId);
      } else {
        cancelEdgeReconnection();
      }
      return;
    }

    if (isCreatingEdge && edgeStart) {
      if (snapTargetNode) {
        const newEdge = {
          id: generateId(),
          fromNode: edgeStart,
          toNode: snapTargetNode.nodeId,
          fromSide: 'right',
          toSide: snapTargetNode.side
        };
        updateCanvasData({
          ...canvas.data,
          edges: [...canvas.data.edges, newEdge]
        });
      }
      setIsCreatingEdge(false);
      setEdgeStart(null);
      setEdgePreview(null);
      setSnapTargetNode(null);
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      setCanvas(prev => {
        saveToHistory(prev.data);
        return prev;
      });
      return;
    }

    if (isResizing) {
      setIsResizing(false);
      setResizeNode(null);
      setCanvas(prev => {
        saveToHistory(prev.data);
        return prev;
      });
      return;
    }

    if (selectionBox) {
      const minX = Math.min(selectionBox.startX, selectionBox.endX);
      const maxX = Math.max(selectionBox.startX, selectionBox.endX);
      const minY = Math.min(selectionBox.startY, selectionBox.endY);
      const maxY = Math.max(selectionBox.startY, selectionBox.endY);

      const selected = canvas.data.nodes.filter(node => {
        const nodeRight = node.x + node.width;
        const nodeBottom = node.y + node.height;
        return node.x < maxX && nodeRight > minX && node.y < maxY && nodeBottom > minY;
      });

      if (selected.length > 0) {
        setSelectedNodes(e.shiftKey 
          ? [...new Set([...selectedNodes, ...selected.map(n => n.id)])]
          : selected.map(n => n.id)
        );
      }
      setSelectionBox(null);
    }
  }, [isPanning, isDragging, isResizing, selectionBox, canvas, selectedNodes, saveToHistory, isReconnectingEdge, isCreatingEdge, edgeStart, snapTargetNode, completeEdgeReconnection, cancelEdgeReconnection, updateCanvasData, isDrawing, finalizeDrawing]);

  // Handle node mouse down
  const handleNodeMouseDown = useCallback((e, node) => {
    e.stopPropagation();

    if (isReconnectingEdge) {
      completeEdgeReconnection(node.id);
      return;
    }

    if (isCreatingEdge) {
      if (edgeStart && edgeStart !== node.id) {
        const newEdge = {
          id: generateId(),
          fromNode: edgeStart,
          toNode: node.id,
          fromSide: 'right',
          toSide: snapTargetNode?.nodeId === node.id ? snapTargetNode.side : 'left'
        };
        updateCanvasData({
          ...canvas.data,
          edges: [...canvas.data.edges, newEdge]
        });
      }
      setIsCreatingEdge(false);
      setEdgeStart(null);
      setEdgePreview(null);
      setSnapTargetNode(null);
      return;
    }

    // If not in select mode, switch to select for node interaction
    if (activeTool !== TOOL_MODES.SELECT && activeTool !== TOOL_MODES.DRAW) {
      setActiveTool(TOOL_MODES.SELECT);
    }

    // Select node
    if (e.shiftKey) {
      setSelectedNodes(prev => 
        prev.includes(node.id) 
          ? prev.filter(id => id !== node.id)
          : [...prev, node.id]
      );
    } else if (!selectedNodes.includes(node.id)) {
      setSelectedNodes([node.id]);
    }
    setSelectedEdges([]);

    // Start dragging
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    const nodePositions = {};
    const nodesToDrag = selectedNodes.includes(node.id) ? selectedNodes : [node.id];
    const allNodesToMove = new Set(nodesToDrag);
    nodesToDrag.forEach(nodeId => {
      const n = canvas.data.nodes.find(nd => nd.id === nodeId);
      if (n && n.type === 'group') {
        const nodesInGroup = getNodesMovingWithGroup(nodeId);
        nodesInGroup.forEach(gn => allNodesToMove.add(gn.id));
      }
    });
    
    canvas.data.nodes.forEach(n => {
      if (allNodesToMove.has(n.id)) {
        nodePositions[n.id] = { x: n.x, y: n.y };
      }
    });
    setDragNodeStart(nodePositions);
    
    if (!selectedNodes.includes(node.id)) {
      setSelectedNodes([node.id]);
    }
  }, [isCreatingEdge, edgeStart, selectedNodes, canvas, updateCanvasData, isReconnectingEdge, completeEdgeReconnection, snapTargetNode, getNodesMovingWithGroup, activeTool]);

  // Handle node mouse up
  const handleNodeMouseUp = useCallback((e, node) => {
    if (!isReconnectingEdge && !isCreatingEdge) return;
    e.stopPropagation();
    
    if (isReconnectingEdge) {
      completeEdgeReconnection(node.id);
      return;
    }
    
    if (isCreatingEdge && edgeStart && edgeStart !== node.id) {
      const newEdge = {
        id: generateId(),
        fromNode: edgeStart,
        toNode: node.id,
        fromSide: 'right',
        toSide: snapTargetNode?.nodeId === node.id ? snapTargetNode.side : 'left'
      };
      updateCanvasData({
        ...canvas.data,
        edges: [...canvas.data.edges, newEdge]
      });
      setIsCreatingEdge(false);
      setEdgeStart(null);
      setEdgePreview(null);
      setSnapTargetNode(null);
    }
  }, [isReconnectingEdge, isCreatingEdge, edgeStart, snapTargetNode, canvas, updateCanvasData, completeEdgeReconnection]);

  // Handle node double click
  const handleNodeDoubleClick = useCallback((e, node) => {
    e.stopPropagation();
    if (node.type === 'text' && node.subtype !== 'drawing') {
      setEditingNode(node.id);
      setEditingText(node.text || '');
    } else if (node.type === 'group') {
      setEditingNode(node.id);
      setEditingText(node.label || '');
    }
  }, []);

  // Handle text editing save
  const handleTextEditSave = useCallback(() => {
    if (!editingNode) return;
    const node = canvas.data.nodes.find(n => n.id === editingNode);
    if (!node) return;

    const newNodes = canvas.data.nodes.map(n => {
      if (n.id === editingNode) {
        if (n.type === 'text') return { ...n, text: editingText };
        else if (n.type === 'group') return { ...n, label: editingText };
      }
      return n;
    });

    updateCanvasData({ ...canvas.data, nodes: newNodes });
    setEditingNode(null);
    setEditingText('');
  }, [editingNode, editingText, canvas, updateCanvasData]);

  // Handle resize
  const handleResizeMouseDown = useCallback((e, nodeId) => {
    e.stopPropagation();
    const node = canvas.data.nodes.find(n => n.id === nodeId);
    if (!node) return;
    setIsResizing(true);
    setResizeNode(nodeId);
    setResizeStart({ x: e.clientX, y: e.clientY, width: node.width, height: node.height });
  }, [canvas]);

  // Start edge creation
  const startEdgeCreation = useCallback((nodeId) => {
    setIsCreatingEdge(true);
    setEdgeStart(nodeId);
  }, []);

  // Handle edge click
  const handleEdgeClick = useCallback((e, edge) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setSelectedEdges(prev => 
        prev.includes(edge.id) ? prev.filter(id => id !== edge.id) : [...prev, edge.id]
      );
    } else {
      setSelectedEdges([edge.id]);
      setSelectedNodes([]);
    }
  }, []);

  // Start edge reconnection
  const startEdgeReconnection = useCallback((edgeId, endpoint) => {
    setIsReconnectingEdge(true);
    setReconnectEdgeId(edgeId);
    setReconnectEndpoint(endpoint);
    setReconnectPreview(null);
  }, []);

  // Handle image upload
  const uploadImageFile = useCallback(async (file, position = null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Only image files can be dropped onto the canvas');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64Data = event.target.result;
        const response = await fetch(`/api/canvas/${id}/assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, data: base64Data, mimetype: file.type })
        });
        const data = await response.json();
        if (data.success) {
          addNode('file', position, { file: data.asset.url, width: 300, height: 200 });
        } else {
          alert(data.error || 'Failed to upload image');
        }
      } catch (err) {
        console.error('Error uploading image:', err);
        alert('Failed to upload image');
      }
    };
    reader.readAsDataURL(file);
  }, [id, addNode]);

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    await uploadImageFile(file, null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadImageFile]);

  // Drag and drop
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.types.includes('Files')) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) setIsDragOver(false);
      return newCount;
    });
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    const dropPosition = screenToCanvas(e.clientX, e.clientY);
    imageFiles.forEach((file, index) => {
      uploadImageFile(file, { x: dropPosition.x + (index * 50), y: dropPosition.y + (index * 50) });
    });
  }, [screenToCanvas, uploadImageFile]);

  // Add link node
  const handleAddLinkNode = useCallback(() => {
    if (!linkUrl.trim()) return;
    addNode('link', pendingLinkPosition, { url: linkUrl });
    setIsLinkModalOpen(false);
    setLinkUrl('');
    setPendingLinkPosition(null);
  }, [linkUrl, pendingLinkPosition, addNode]);

  // Theme change handler
  const handleThemeChange = useCallback((themeId) => {
    setCanvasTheme(themeId);
    try { localStorage.setItem('canvas-theme', themeId); } catch {}
  }, []);

  // Grid style change handler
  const handleGridStyleChange = useCallback((styleId) => {
    setGridStyle(styleId);
    try { localStorage.setItem('canvas-grid-style', styleId); } catch {}
  }, []);

  // Zoom controls
  const zoomIn = () => setZoom(z => Math.min(z * 1.2, 5));
  const zoomOut = () => setZoom(z => Math.max(z / 1.2, 0.1));
  const resetZoom = () => {
    setZoom(1);
    setViewportOffset({ x: 0, y: 0 });
  };

  // Determine cursor
  const getCursor = () => {
    if (isPanning) return 'grabbing';
    if (isCreatingEdge || isReconnectingEdge) return 'crosshair';
    if (activeTool === TOOL_MODES.DRAW) return 'crosshair';
    if (activeTool === TOOL_MODES.TEXT || activeTool === TOOL_MODES.STICKY) return 'cell';
    if (activeTool === TOOL_MODES.GROUP) return 'cell';
    return 'default';
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading canvas...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <Title headingLevel="h2" size="lg">Error Loading Canvas</Title>
          <EmptyStateBody>{error}</EmptyStateBody>
          <Button variant="primary" onClick={handleNavigateBack}>
            Back to Canvases
          </Button>
        </EmptyState>
      </PageSection>
    );
  }

  const hiddenNodeIds = getHiddenNodeIds();

  // Build drawing preview SVG path
  const drawingPreviewPath = drawingPoints.length >= 2
    ? drawingPoints.reduce((d, [x, y], i) => {
        return i === 0 ? `M ${x} ${y}` : `${d} L ${x} ${y}`;
      }, '')
    : null;

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden' 
    }}>
      {/* Top Bar */}
      <CanvasToolbar
        canvas={canvas}
        onNavigateBack={handleNavigateBack}
        historyIndex={historyIndex}
        history={history}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        snapToGrid={snapToGrid}
        onSnapToGridChange={setSnapToGrid}
        hasChanges={hasChanges}
        isSaving={isSaving}
        onSave={handleSave}
        canvasTheme={canvasTheme}
        onThemeChange={handleThemeChange}
        gridStyle={gridStyle}
        onGridStyleChange={handleGridStyleChange}
      />

      {/* Main content: Sidebar + Canvas */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Sidebar */}
        <CanvasSidebar
          activeTool={activeTool}
          onToolChange={handleToolChange}
          fileInputRef={fileInputRef}
          onLinkModalOpen={() => {
            setPendingLinkPosition(null);
            setIsLinkModalOpen(true);
          }}
          isColorPickerOpen={isColorPickerOpen}
          setIsColorPickerOpen={setIsColorPickerOpen}
          selectedNodes={selectedNodes}
          selectedEdges={selectedEdges}
          getSelectionColor={getSelectionColor}
          onApplyColor={applyColor}
          onClearColor={clearColor}
          onDeleteSelected={deleteSelected}
          theme={theme}
        />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />

        {/* Canvas Area */}
        <div 
          ref={canvasRef}
          style={{ 
            flex: 1, 
            overflow: 'hidden',
            background: theme.canvasBg,
            position: 'relative',
            cursor: getCursor(),
            transition: 'background 0.3s ease'
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={(e) => {
            // Finalize drawing if mouse leaves canvas
            if (isDrawing) {
              setIsDrawing(false);
              finalizeDrawing(drawingPointsRef.current);
              setDrawingPoints([]);
              drawingPointsRef.current = [];
              return;
            }
            handleCanvasMouseUp(e);
          }}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Grid Pattern */}
          {gridStyle !== 'none' && (() => {
            const gc = theme.gridColor;
            const gs = GRID_SIZE * zoom;
            const wideGs = GRID_SIZE * 4 * zoom;
            const ox = viewportOffset.x;
            const oy = viewportOffset.y;

            if (gridStyle === 'dots') {
              return (
                <div
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `radial-gradient(circle, ${gc} 1px, transparent 1px)`,
                    backgroundSize: `${gs}px ${gs}px`,
                    backgroundPosition: `${ox}px ${oy}px`,
                    pointerEvents: 'none'
                  }}
                />
              );
            }

            if (gridStyle === 'wide') {
              return (
                <div
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundImage: `
                      linear-gradient(${gc} 1px, transparent 1px),
                      linear-gradient(90deg, ${gc} 1px, transparent 1px)
                    `,
                    backgroundSize: `${wideGs}px ${wideGs}px`,
                    backgroundPosition: `${ox}px ${oy}px`,
                    pointerEvents: 'none'
                  }}
                />
              );
            }

            if (gridStyle === 'cross') {
              // Crosses rendered via two short dashes at each intersection
              return (
                <svg
                  style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    pointerEvents: 'none',
                    overflow: 'hidden'
                  }}
                >
                  <defs>
                    <pattern
                      id="cross-pattern"
                      width={gs}
                      height={gs}
                      patternUnits="userSpaceOnUse"
                      x={ox % gs}
                      y={oy % gs}
                    >
                      <line x1={gs / 2 - 3} y1={gs / 2} x2={gs / 2 + 3} y2={gs / 2} stroke={gc} strokeWidth="1" />
                      <line x1={gs / 2} y1={gs / 2 - 3} x2={gs / 2} y2={gs / 2 + 3} stroke={gc} strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cross-pattern)" />
                </svg>
              );
            }

            // Default: standard lines
            return (
              <div
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundImage: `
                    linear-gradient(${gc} 1px, transparent 1px),
                    linear-gradient(90deg, ${gc} 1px, transparent 1px)
                  `,
                  backgroundSize: `${gs}px ${gs}px`,
                  backgroundPosition: `${ox}px ${oy}px`,
                  pointerEvents: 'none'
                }}
              />
            );
          })()}

          {/* Transform container */}
          <div
            style={{
              position: 'absolute',
              transform: `translate(${viewportOffset.x}px, ${viewportOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
          >
            {/* Edges */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '10000px',
                height: '10000px',
                overflow: 'visible',
                pointerEvents: 'none'
              }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill={theme.edgeColor} />
                </marker>
                <marker
                  id="arrowhead-selected"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#0066cc" />
                </marker>
              </defs>
              {canvas?.data?.edges?.map(edge => {
                const fromCollapsedGroup = getContainingCollapsedGroup(edge.fromNode);
                const toCollapsedGroup = getContainingCollapsedGroup(edge.toNode);
                
                if (fromCollapsedGroup && toCollapsedGroup && fromCollapsedGroup === toCollapsedGroup) {
                  return null;
                }
                
                const actualFromNode = fromCollapsedGroup || edge.fromNode;
                const actualToNode = toCollapsedGroup || edge.toNode;
                
                if (actualFromNode === actualToNode) return null;
                
                const from = getNodeCenter(actualFromNode, fromCollapsedGroup ? 'right' : (edge.fromSide || 'right'));
                const to = getNodeCenter(actualToNode, toCollapsedGroup ? 'left' : (edge.toSide || 'left'));
                const isSelected = selectedEdges.includes(edge.id);
                const isRedirected = fromCollapsedGroup || toCollapsedGroup;
                
                return (
                  <CanvasEdge
                    key={edge.id}
                    edge={edge}
                    from={from}
                    to={to}
                    isSelected={isSelected}
                    isRedirected={isRedirected}
                    reconnectEdgeId={reconnectEdgeId}
                    reconnectEndpoint={reconnectEndpoint}
                    onEdgeClick={handleEdgeClick}
                    onStartEdgeReconnection={startEdgeReconnection}
                    theme={theme}
                  />
                );
              }).filter(Boolean)}
              
              {/* Edge preview while creating */}
              {isCreatingEdge && edgeStart && edgePreview && (
                <path
                  d={renderEdgePath(
                    getNodeCenter(edgeStart, 'right'),
                    snapTargetNode ? snapTargetNode.point : edgePreview
                  )}
                  stroke={snapTargetNode ? '#44cf6e' : '#0066cc'}
                  strokeWidth="2"
                  strokeDasharray={snapTargetNode ? undefined : '5,5'}
                  fill="none"
                />
              )}
              
              {/* Edge reconnection preview */}
              {isReconnectingEdge && reconnectEdgeId && reconnectPreview && (() => {
                const edge = canvas?.data?.edges?.find(e => e.id === reconnectEdgeId);
                if (!edge) return null;
                const fixedPoint = reconnectEndpoint === 'from' 
                  ? getNodeCenter(edge.toNode, edge.toSide || 'left')
                  : getNodeCenter(edge.fromNode, edge.fromSide || 'right');
                const movingPoint = snapTargetNode ? snapTargetNode.point : reconnectPreview;
                const from = reconnectEndpoint === 'from' ? movingPoint : fixedPoint;
                const to = reconnectEndpoint === 'from' ? fixedPoint : movingPoint;
                
                return (
                  <path
                    d={renderEdgePath(from, to)}
                    stroke={snapTargetNode ? '#44cf6e' : '#ff6b6b'}
                    strokeWidth="2"
                    strokeDasharray={snapTargetNode ? undefined : '5,5'}
                    fill="none"
                  />
                );
              })()}

              {/* Drawing preview while actively drawing */}
              {isDrawing && drawingPreviewPath && (
                <path
                  d={drawingPreviewPath}
                  stroke={DEFAULT_DRAWING_COLOR}
                  strokeWidth={DEFAULT_DRAWING_STROKE_WIDTH}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.7}
                />
              )}
            </svg>

            {/* Nodes */}
            {canvas?.data?.nodes?.filter(node => !hiddenNodeIds.has(node.id)).map(node => {
              const isSelected = selectedNodes.includes(node.id);
              const isEditing = editingNode === node.id;
              const isSnapTarget = snapTargetNode?.nodeId === node.id;
              const nodesInGroup = node.type === 'group' ? getNodesInGroup(node.id) : [];
              
              return (
                <CanvasNode
                  key={node.id}
                  node={node}
                  isSelected={isSelected}
                  isEditing={isEditing}
                  editingText={editingText}
                  isSnapTarget={isSnapTarget}
                  snapTargetNode={snapTargetNode}
                  isDragging={isDragging}
                  collapsedGroups={collapsedGroups}
                  nodesInGroup={nodesInGroup}
                  onMouseDown={handleNodeMouseDown}
                  onMouseUp={handleNodeMouseUp}
                  onDoubleClick={handleNodeDoubleClick}
                  onTextChange={setEditingText}
                  onTextEditSave={handleTextEditSave}
                  onTextEditCancel={() => setEditingNode(null)}
                  onResizeMouseDown={handleResizeMouseDown}
                  onStartEdgeCreation={startEdgeCreation}
                  onToggleGroupCollapse={toggleGroupCollapse}
                  onAddReaction={handleAddReaction}
                  onToggleReaction={handleToggleReaction}
                  zoom={zoom}
                  theme={theme}
                />
              );
            })}
          </div>

          {/* Selection box */}
          {selectionBox && (
            <div
              style={{
                position: 'absolute',
                left: Math.min(selectionBox.startX, selectionBox.endX) * zoom + viewportOffset.x,
                top: Math.min(selectionBox.startY, selectionBox.endY) * zoom + viewportOffset.y,
                width: Math.abs(selectionBox.endX - selectionBox.startX) * zoom,
                height: Math.abs(selectionBox.endY - selectionBox.startY) * zoom,
                background: 'rgba(0, 102, 204, 0.1)',
                border: '1px solid rgba(0, 102, 204, 0.5)',
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Drag and drop overlay */}
          {isDragOver && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 102, 204, 0.15)',
                border: '3px dashed #0066cc',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 1000
              }}
            >
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.85)',
                  padding: '24px 48px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}
              >
                <OutlinedFileImageIcon style={{ fontSize: '48px', color: '#0066cc', marginBottom: '12px' }} />
                <div style={{ fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                  Drop image to add to canvas
                </div>
                <div style={{ fontSize: '13px', color: '#888', marginTop: '6px' }}>
                  Release to upload and create an image node
                </div>
              </div>
            </div>
          )}

          {/* Status bar */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              background: theme.statusBarBg,
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              color: theme.statusBarText,
              transition: 'background 0.3s ease, color 0.3s ease'
            }}
          >
            {canvas?.data?.nodes?.length || 0} nodes • {canvas?.data?.edges?.length || 0} edges
            {selectedNodes.length > 0 && ` • ${selectedNodes.length} selected`}
            {isCreatingEdge && ' • Click a node to connect'}
            {isReconnectingEdge && ' • Click a node to reconnect'}
            {isDrawing && ' • Drawing...'}
          </div>

          {/* Active tool indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              background: theme.statusBarBg,
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '11px',
              color: activeTool !== TOOL_MODES.SELECT ? '#0066cc' : theme.statusBarText,
              transition: 'background 0.3s ease, color 0.3s ease'
            }}
          >
            {activeTool === TOOL_MODES.SELECT && 'Scroll/Pinch to zoom • Alt+Drag to pan • Double-click to edit'}
            {activeTool === TOOL_MODES.TEXT && 'Click to place text node • Escape to cancel'}
            {activeTool === TOOL_MODES.STICKY && 'Click to place sticky note • Escape to cancel'}
            {activeTool === TOOL_MODES.DRAW && 'Click and drag to draw • Escape to cancel'}
            {activeTool === TOOL_MODES.GROUP && 'Click to place group • Escape to cancel'}
          </div>
        </div>
      </div>

      {/* Link Modal */}
      <LinkModal
        isOpen={isLinkModalOpen}
        linkUrl={linkUrl}
        onClose={() => {
          setIsLinkModalOpen(false);
          setLinkUrl('');
        }}
        onAdd={handleAddLinkNode}
        onUrlChange={setLinkUrl}
      />

      {/* Emoji Picker (floating) */}
      {emojiPickerState && (
        <EmojiPicker
          position={emojiPickerState.position}
          onSelect={handleEmojiSelect}
          onClose={closeEmojiPicker}
        />
      )}
    </div>
  );
};

export default CanvasDetail;
