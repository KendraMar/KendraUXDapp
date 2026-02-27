import React, { useState, useRef, useCallback } from 'react';
import {
  TextInput
} from '@patternfly/react-core';
import {
  ExternalLinkAltIcon,
  OutlinedFileImageIcon,
  AngleDownIcon,
  AngleRightIcon,
  PlusCircleIcon
} from '@patternfly/react-icons';
import { NODE_COLORS } from '../canvasConstants';

// Convert drawing points to an SVG path string with quadratic bezier smoothing
const pointsToSvgPath = (points) => {
  if (!points || points.length < 2) return '';
  
  let d = `M ${points[0][0]} ${points[0][1]}`;
  
  if (points.length === 2) {
    d += ` L ${points[1][0]} ${points[1][1]}`;
    return d;
  }
  
  // Use quadratic bezier curves for smoothness
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i][0] + points[i + 1][0]) / 2;
    const midY = (points[i][1] + points[i + 1][1]) / 2;
    d += ` Q ${points[i][0]} ${points[i][1]}, ${midX} ${midY}`;
  }
  
  // Connect to last point
  const last = points[points.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  
  return d;
};

const CanvasNode = ({
  node,
  isSelected,
  isEditing,
  editingText,
  isSnapTarget,
  snapTargetNode,
  isDragging,
  collapsedGroups,
  nodesInGroup,
  onMouseDown,
  onMouseUp,
  onDoubleClick,
  onTextChange,
  onTextEditSave,
  onTextEditCancel,
  onResizeMouseDown,
  onStartEdgeCreation,
  onToggleGroupCollapse,
  onAddReaction,
  onToggleReaction,
  zoom,
  theme
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showEmojiButton, setShowEmojiButton] = useState(false);
  const emojiButtonRef = useRef(null);

  const colorValue = node.color ? 
    NODE_COLORS.find(c => c.id === node.color)?.value : 
    null;
  const isCollapsed = node.type === 'group' && collapsedGroups.has(node.id);
  const collapsedHeight = 40;
  const isSticky = node.subtype === 'sticky';
  const isDrawing = node.subtype === 'drawing';

  // Sticky note colors - use node color or default yellow
  const stickyColor = colorValue || '#e0de71';
  
  // Determine border color
  const borderColor = isSnapTarget
    ? '#44cf6e'
    : isSelected
      ? '#0066cc'
      : isSticky
        ? 'transparent'
        : (colorValue || (theme?.nodeBorder || '#444'));

  // Determine background
  let background;
  if (isSticky) {
    background = stickyColor + 'dd'; // ~87% opacity
  } else if (isDrawing) {
    background = 'transparent';
  } else if (node.type === 'group') {
    background = isCollapsed
      ? (colorValue ? `${colorValue}33` : 'rgba(255,255,255,0.08)')
      : 'rgba(255,255,255,0.05)';
  } else {
    background = colorValue ? `${colorValue}22` : (theme?.nodeBg || '#252525');
  }

  const nodeTextColor = isSticky ? '#1a1a1a' : (theme?.nodeTextColor || '#e0e0e0');

  // Reactions grouped by emoji
  const reactionGroups = {};
  if (node.reactions && node.reactions.length > 0) {
    node.reactions.forEach(r => {
      if (!reactionGroups[r.emoji]) {
        reactionGroups[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
      }
      reactionGroups[r.emoji].count++;
      reactionGroups[r.emoji].users.push(r.user);
    });
  }
  const reactionList = Object.values(reactionGroups);

  const handleEmojiButtonClick = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (emojiButtonRef.current && onAddReaction) {
      const rect = emojiButtonRef.current.getBoundingClientRect();
      // Position picker above the button (picker is ~340px tall)
      const pickerHeight = 350;
      const yPos = rect.top - pickerHeight;
      // If it would go above the viewport, position it below instead
      const finalY = yPos < 8 ? rect.bottom + 8 : yPos;
      onAddReaction(node.id, { x: rect.left, y: finalY });
    }
  }, [node.id, onAddReaction]);

  const handleReactionClick = useCallback((e, emoji) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleReaction) {
      onToggleReaction(node.id, emoji);
    }
  }, [node.id, onToggleReaction]);

  return (
    <div
      style={{
        position: 'absolute',
        left: node.x,
        top: node.type === 'group' ? node.y + 24 : node.y,
        width: node.width,
        height: isCollapsed ? collapsedHeight : (node.type === 'group' ? node.height - 24 : node.height),
        background,
        border: isDrawing ? 'none' : `2px solid ${borderColor}`,
        borderRadius: isSticky ? '4px' : (node.type === 'group' ? '0 8px 8px 8px' : '8px'),
        overflow: 'visible',
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isSnapTarget
          ? '0 0 12px rgba(68, 207, 110, 0.5)'
          : isSticky
            ? `0 4px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)${isSelected ? ', 0 0 0 2px #0066cc' : ''}`
            : isSelected
              ? '0 0 0 2px rgba(0,102,204,0.3)'
              : 'none',
        zIndex: node.type === 'group' ? 0 : 1,
        transition: 'height 0.2s ease-out, background 0.2s ease-out'
      }}
      onMouseDown={(e) => onMouseDown(e, node)}
      onMouseUp={(e) => onMouseUp(e, node)}
      onDoubleClick={(e) => onDoubleClick(e, node)}
      onMouseEnter={() => { setIsHovered(true); setShowEmojiButton(true); }}
      onMouseLeave={() => { setIsHovered(false); setShowEmojiButton(false); }}
    >
      {/* Node content */}
      <div style={{ 
        padding: isDrawing ? '0' : (isSticky ? '16px' : '12px'), 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        color: nodeTextColor,
        overflow: 'hidden',
        borderRadius: 'inherit'
      }}>
        {/* Text node */}
        {node.type === 'text' && !isSticky && !isDrawing && (
          isEditing ? (
            <div 
              style={{ flex: 1, height: '100%', position: 'relative' }}
              onWheel={(e) => e.stopPropagation()}
            >
              <textarea
                value={editingText}
                onChange={(e) => onTextChange(e.target.value)}
                autoFocus
                onFocus={(e) => {
                  const el = e.target;
                  el.selectionStart = el.selectionEnd = el.value.length;
                }}
                style={{ 
                  width: '100%',
                  height: '100%',
                  background: 'transparent', 
                  border: 'none',
                  outline: 'none',
                  color: theme?.editingTextColor || '#e0e0e0',
                  resize: 'none',
                  padding: 0,
                  margin: 0,
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  overflow: 'auto',
                  caretColor: theme?.editingCaretColor || '#0066cc'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onTextEditSave();
                  } else if (e.key === 'Escape') {
                    onTextEditCancel();
                  }
                }}
                onBlur={onTextEditSave}
              />
            </div>
          ) : (
            <div 
              style={{ 
                overflow: 'auto', 
                flex: 1,
                whiteSpace: 'pre-wrap',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
              onWheel={(e) => {
                const el = e.currentTarget;
                const isScrollable = el.scrollHeight > el.clientHeight;
                const isAtTop = el.scrollTop === 0;
                const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
                if (isScrollable) {
                  if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
                    e.stopPropagation();
                  }
                }
              }}
            >
              {node.text || 'Double-click to edit'}
            </div>
          )
        )}

        {/* Sticky note */}
        {isSticky && (
          isEditing ? (
            <div 
              style={{ flex: 1, height: '100%', position: 'relative', display: 'flex' }}
              onWheel={(e) => e.stopPropagation()}
            >
              <textarea
                value={editingText}
                onChange={(e) => onTextChange(e.target.value)}
                autoFocus
                onFocus={(e) => {
                  const el = e.target;
                  el.selectionStart = el.selectionEnd = el.value.length;
                }}
                style={{ 
                  width: '100%',
                  height: '100%',
                  flex: 1,
                  background: 'transparent', 
                  border: 'none',
                  outline: 'none',
                  color: '#1a1a1a',
                  resize: 'none',
                  padding: 0,
                  margin: 0,
                  fontFamily: 'inherit',
                  fontWeight: 500,
                  fontSize: '15px',
                  lineHeight: '1.5',
                  textAlign: 'center',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  overflow: 'auto',
                  caretColor: '#0066cc'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onTextEditSave();
                  } else if (e.key === 'Escape') {
                    onTextEditCancel();
                  }
                }}
                onBlur={onTextEditSave}
              />
            </div>
          ) : (
            <div 
              style={{ 
                overflow: 'auto', 
                flex: 1,
                whiteSpace: 'pre-wrap',
                fontSize: '15px',
                lineHeight: '1.5',
                fontWeight: 500,
                display: 'flex',
                alignItems: node.text && node.text.length < 60 ? 'center' : 'flex-start',
                justifyContent: 'center',
                textAlign: 'center',
                wordBreak: 'break-word'
              }}
              onWheel={(e) => {
                const el = e.currentTarget;
                const isScrollable = el.scrollHeight > el.clientHeight;
                const isAtTop = el.scrollTop === 0;
                const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
                if (isScrollable) {
                  if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
                    e.stopPropagation();
                  }
                }
              }}
            >
              {node.text || 'Double-click to edit'}
            </div>
          )
        )}

        {/* Drawing node */}
        {isDrawing && node.drawingData && (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${node.width} ${node.height}`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none'
            }}
          >
            {node.drawingData.paths?.map((path, idx) => (
              <path
                key={idx}
                d={pointsToSvgPath(path.points)}
                stroke={path.color || '#e0e0e0'}
                strokeWidth={path.strokeWidth || 2}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ))}
          </svg>
        )}

        {/* File/image node */}
        {node.type === 'file' && (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            {node.file?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
              <img 
                src={node.file} 
                alt="Canvas asset"
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain' 
                }}
                draggable={false}
              />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <OutlinedFileImageIcon style={{ fontSize: '32px', opacity: 0.5 }} />
                <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                  {node.file || 'No file'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Link node */}
        {node.type === 'link' && (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: '100%'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              marginBottom: '8px'
            }}>
              <ExternalLinkAltIcon style={{ color: '#0066cc' }} />
              <span style={{ fontWeight: 600 }}>Link</span>
            </div>
            <a 
              href={node.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                color: theme?.linkColor || '#4da6ff',
                fontSize: '13px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {node.url}
            </a>
          </div>
        )}

        {/* Group node */}
        {node.type === 'group' && (
          <div style={{ 
            position: 'absolute',
            top: '-26px',
            left: '-2px',
            background: colorValue || (theme?.groupColorFallback || '#555'),
            padding: '4px 10px',
            borderRadius: '6px 6px 0 0',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#fff',
            minHeight: '24px',
            boxSizing: 'border-box'
          }}>
            {/* Collapse/Expand toggle */}
            <div
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                borderRadius: '3px',
                transition: 'background 0.15s ease',
                marginLeft: '-4px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleGroupCollapse(node.id);
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title={isCollapsed ? 'Expand group' : 'Collapse group'}
            >
              {isCollapsed ? (
                <AngleRightIcon style={{ fontSize: '14px' }} />
              ) : (
                <AngleDownIcon style={{ fontSize: '14px' }} />
              )}
            </div>
            
            {isEditing ? (
              <TextInput
                id="canvas-node-text-edit"
                aria-label="Edit node text"
                value={editingText}
                onChange={(e, val) => onTextChange(val)}
                autoFocus
                style={{ 
                  background: 'transparent', 
                  border: 'none',
                  padding: 0,
                  width: '100px',
                  color: '#fff'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onTextEditSave();
                  } else if (e.key === 'Escape') {
                    onTextEditCancel();
                  }
                }}
                onBlur={onTextEditSave}
              />
            ) : (
              <>
                <span>{node.label || 'Group'}</span>
                {nodesInGroup.length > 0 && (
                  <span style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '1px 7px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    marginLeft: '4px'
                  }}>
                    {nodesInGroup.length}
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* Emoji reactions display */}
        {reactionList.length > 0 && !isDrawing && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              marginTop: 'auto',
              paddingTop: '6px'
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {reactionList.map((reaction) => (
              <button
                key={reaction.emoji}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 6px',
                  background: isSticky ? 'rgba(0,0,0,0.12)' : (theme?.reactionBg || 'rgba(255,255,255,0.1)'),
                  border: '1px solid ' + (isSticky ? 'rgba(0,0,0,0.15)' : (theme?.reactionBorder || 'rgba(255,255,255,0.15)')),
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  lineHeight: 1,
                  outline: 'none',
                  color: isSticky ? '#1a1a1a' : (theme?.reactionText || '#e0e0e0')
                }}
                onClick={(e) => handleReactionClick(e, reaction.emoji)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isSticky ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSticky ? 'rgba(0,0,0,0.12)' : (theme?.reactionBg || 'rgba(255,255,255,0.1)');
                }}
                title={`${reaction.emoji} by ${reaction.users.join(', ')}`}
              >
                <span>{reaction.emoji}</span>
                {reaction.count > 1 && (
                  <span style={{ fontSize: '11px', fontWeight: 600 }}>
                    {reaction.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Emoji add button - appears on hover */}
      {showEmojiButton && !isEditing && !isDrawing && onAddReaction && (
        <div
          ref={emojiButtonRef}
          style={{
            position: 'absolute',
            bottom: '-12px',
            left: '8px',
            width: '24px',
            height: '24px',
            background: theme?.emojiButtonBg || '#2a2a2a',
            border: `1px solid ${theme?.emojiButtonBorder || '#555'}`,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 20,
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            transition: 'all 0.15s ease'
          }}
          onClick={handleEmojiButtonClick}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#0066cc';
            e.currentTarget.style.borderColor = '#0066cc';
            e.currentTarget.style.transform = 'scale(1.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme?.emojiButtonBg || '#2a2a2a';
            e.currentTarget.style.borderColor = theme?.emojiButtonBorder || '#555';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Add reaction"
        >
          <PlusCircleIcon style={{ fontSize: '12px', color: '#ccc' }} />
        </div>
      )}

      {/* Connection handles - show on selected nodes OR on snap target nodes */}
      {(() => {
        const isSnapTargetCheck = snapTargetNode?.nodeId === node.id;
        const showHandles = isSelected || isSnapTargetCheck;
        
        if (!showHandles || isDrawing) return null;
        
        return (
          <>
            {['top', 'right', 'bottom', 'left'].map(side => {
              const positions = {
                top: { left: '50%', top: '-6px', transform: 'translateX(-50%)' },
                right: { right: '-6px', top: '50%', transform: 'translateY(-50%)' },
                bottom: { left: '50%', bottom: '-6px', transform: 'translateX(-50%)' },
                left: { left: '-6px', top: '50%', transform: 'translateY(-50%)' }
              };
              
              const isSnapSide = isSnapTargetCheck && snapTargetNode?.side === side;
              
              return (
                <div
                  key={side}
                  style={{
                    position: 'absolute',
                    ...positions[side],
                    width: isSnapSide ? '16px' : '12px',
                    height: isSnapSide ? '16px' : '12px',
                    background: isSnapSide ? '#44cf6e' : '#0066cc',
                    borderRadius: '50%',
                    cursor: isSelected ? 'crosshair' : 'default',
                    border: '2px solid #fff',
                    zIndex: 10,
                    boxShadow: isSnapSide ? '0 0 8px rgba(68, 207, 110, 0.8)' : 'none',
                    transition: 'all 0.15s ease-out',
                    pointerEvents: isSelected ? 'auto' : 'none'
                  }}
                  onMouseDown={(e) => {
                    if (isSelected) {
                      e.stopPropagation();
                      onStartEdgeCreation(node.id);
                    }
                  }}
                />
              );
            })}
          </>
        );
      })()}

      {/* Resize handle */}
      {isSelected && !isDrawing && (
        <div
          style={{
            position: 'absolute',
            right: '-4px',
            bottom: '-4px',
            width: '12px',
            height: '12px',
            background: '#0066cc',
            borderRadius: '2px',
            cursor: 'nwse-resize',
            border: '2px solid #fff'
          }}
          onMouseDown={(e) => onResizeMouseDown(e, node.id)}
        />
      )}
    </div>
  );
};

export default CanvasNode;
