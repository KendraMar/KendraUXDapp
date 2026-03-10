import React from 'react';
import { renderEdgePath } from '../canvasHelpers';
import { EDGE_COLORS } from '../canvasConstants';

const CanvasEdge = ({
  edge,
  from,
  to,
  isSelected,
  isRedirected,
  reconnectEdgeId,
  reconnectEndpoint,
  onEdgeClick,
  onStartEdgeReconnection,
  theme
}) => {
  const defaultEdgeColor = theme?.edgeColor || '#666';
  const color = edge.color ? 
    EDGE_COLORS.find(c => c.id === edge.color)?.value || defaultEdgeColor : 
    defaultEdgeColor;
  
  return (
    <g key={edge.id}>
      {/* Invisible wider path for easier clicking */}
      <path
        d={renderEdgePath(from, to)}
        stroke="transparent"
        strokeWidth="20"
        fill="none"
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
        onClick={(e) => onEdgeClick(e, edge)}
      />
      <path
        d={renderEdgePath(from, to)}
        stroke={isSelected ? '#0066cc' : color}
        strokeWidth={isSelected ? 3 : 2}
        fill="none"
        markerEnd={edge.toEnd === 'arrow' ? (isSelected ? 'url(#arrowhead-selected)' : 'url(#arrowhead)') : undefined}
        strokeDasharray={isRedirected ? '4,4' : undefined}
        opacity={isRedirected ? 0.7 : 1}
      />
      {edge.label && !isRedirected && (
        <text
          x={(from.x + to.x) / 2}
          y={(from.y + to.y) / 2 - 10}
          textAnchor="middle"
          fill={isSelected ? '#0066cc' : '#888'}
          fontSize="12"
          style={{ pointerEvents: 'none' }}
        >
          {edge.label}
        </text>
      )}
      {/* Edge endpoint handles when selected */}
      {isSelected && !isRedirected && (
        <>
          {/* From endpoint handle */}
          <circle
            cx={from.x}
            cy={from.y}
            r="8"
            fill={reconnectEdgeId === edge.id && reconnectEndpoint === 'from' ? '#ff6b6b' : '#0066cc'}
            stroke="#fff"
            strokeWidth="2"
            style={{ cursor: 'crosshair', pointerEvents: 'all' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartEdgeReconnection(edge.id, 'from');
            }}
          />
          {/* To endpoint handle */}
          <circle
            cx={to.x}
            cy={to.y}
            r="8"
            fill={reconnectEdgeId === edge.id && reconnectEndpoint === 'to' ? '#ff6b6b' : '#0066cc'}
            stroke="#fff"
            strokeWidth="2"
            style={{ cursor: 'crosshair', pointerEvents: 'all' }}
            onMouseDown={(e) => {
              e.stopPropagation();
              onStartEdgeReconnection(edge.id, 'to');
            }}
          />
        </>
      )}
    </g>
  );
};

export default CanvasEdge;
