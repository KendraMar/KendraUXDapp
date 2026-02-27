import React, { useRef } from 'react';
import {
  Label,
  Button,
  Tooltip,
  Flex,
  FlexItem,
  EmptyState,
  EmptyStateBody,
  Title
} from '@patternfly/react-core';
import {
  InboxIcon,
  SearchPlusIcon,
  SearchMinusIcon,
  ExpandArrowsAltIcon
} from '@patternfly/react-icons';
import {
  CANVAS_NODE_WIDTH,
  CANVAS_NODE_HEIGHT,
  GRID_SIZE,
  getPriorityColor,
  getPriorityIcon,
  getStatusColor,
  getIssueTypeColor,
  getEdgeColor,
  getSourceIcon
} from '../utils/taskHelpers';
import IssueDetailPanel from './IssueDetailPanel';

const TasksCanvasView = ({
  filteredIssues,
  selectedIssue,
  selectedCanvasNode,
  nodePositions,
  edges,
  viewportOffset,
  zoom,
  isPanning,
  isDragging,
  canvasRef,
  onCanvasMouseDown,
  onCanvasMouseMove,
  onCanvasMouseUp,
  onCanvasWheel,
  onNodeMouseDown,
  onZoomIn,
  onZoomOut,
  onResetView,
  renderEdgePath,
  summarizing,
  summaryError,
  generateSummary,
  onEdit,
  onDelete,
  onToggleStar,
  onSetFlag
}) => {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Canvas Area */}
      <div
        ref={canvasRef}
        style={{
          flex: 1,
          overflow: 'hidden',
          background: '#1a1a1a',
          position: 'relative',
          cursor: isPanning ? 'grabbing' : 'grab'
        }}
        onMouseDown={onCanvasMouseDown}
        onMouseMove={onCanvasMouseMove}
        onMouseUp={onCanvasMouseUp}
        onMouseLeave={onCanvasMouseUp}
        onWheel={onCanvasWheel}
      >
        {/* Grid Pattern */}
        <div
          className="canvas-grid"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
            backgroundPosition: `${viewportOffset.x}px ${viewportOffset.y}px`,
            pointerEvents: 'none'
          }}
        />

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
                id="task-arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
              </marker>
              <marker
                id="task-arrowhead-green"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#44cf6e" />
              </marker>
              <marker
                id="task-arrowhead-purple"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#a882ff" />
              </marker>
              <marker
                id="task-arrowhead-cyan"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#53dfdd" />
              </marker>
            </defs>
            {edges.map(edge => {
              const fromIssue = filteredIssues.find(i => i.key === edge.from);
              const toIssue = filteredIssues.find(i => i.key === edge.to);
              if (!fromIssue || !toIssue || !nodePositions[edge.from] || !nodePositions[edge.to]) return null;
              
              const path = renderEdgePath(
                { key: edge.from, ...nodePositions[edge.from] },
                { key: edge.to, ...nodePositions[edge.to] }
              );
              const color = getEdgeColor(edge.type);
              const markerId = edge.type === 'parent' ? 'task-arrowhead-green' :
                              edge.type === 'epic' ? 'task-arrowhead-purple' :
                              edge.type === 'link' ? 'task-arrowhead-cyan' : 'task-arrowhead';
              
              return (
                <g key={edge.id}>
                  <path
                    d={path}
                    stroke={color}
                    strokeWidth="2"
                    fill="none"
                    markerEnd={`url(#${markerId})`}
                    opacity="0.7"
                  />
                </g>
              );
            })}
          </svg>

          {/* Issue Nodes */}
          {filteredIssues.map(issue => {
            const pos = nodePositions[issue.key];
            if (!pos) return null;
            
            const isSelected = selectedCanvasNode === issue.key;
            const typeColor = getIssueTypeColor(issue.issueType);
            
            return (
              <div
                key={`${issue.source}-${issue.key}`}
                style={{
                  position: 'absolute',
                  left: pos.x,
                  top: pos.y,
                  width: CANVAS_NODE_WIDTH,
                  height: CANVAS_NODE_HEIGHT,
                  background: '#252525',
                  border: `2px solid ${isSelected ? '#0066cc' : typeColor}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  cursor: isDragging && isSelected ? 'grabbing' : 'grab',
                  boxShadow: isSelected ? '0 0 0 3px rgba(0,102,204,0.3)' : 'none',
                  transition: 'box-shadow 0.15s ease'
                }}
                onMouseDown={(e) => onNodeMouseDown(e, issue.key)}
              >
                {/* Color accent bar */}
                <div style={{
                  height: '4px',
                  background: typeColor
                }} />
                
                {/* Node content */}
                <div style={{ padding: '10px' }}>
                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                    <FlexItem>
                      <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                        {issue.source && (
                          <FlexItem style={{ display: 'flex', alignItems: 'center' }}>
                            {getSourceIcon(issue.source)}
                          </FlexItem>
                        )}
                        <FlexItem>
                          <span style={{ 
                            fontSize: '0.75rem', 
                            fontWeight: 'bold',
                            color: '#0066cc' 
                          }}>
                            {issue.key}
                          </span>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                    <FlexItem>
                      <Label color="grey" isCompact style={{ fontSize: '0.65rem' }}>
                        {issue.issueType}
                      </Label>
                    </FlexItem>
                  </Flex>
                  <p style={{ 
                    fontSize: '0.85rem',
                    color: '#e0e0e0',
                    margin: '6px 0 0 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: '1.3'
                  }}>
                    {issue.summary}
                  </p>
                  <Flex spaceItems={{ default: 'spaceItemsXs' }} style={{ marginTop: '8px' }}>
                    {issue.priority && (
                      <FlexItem>
                        <Label 
                          color={getPriorityColor(issue.priority)} 
                          isCompact
                          style={{ fontSize: '0.65rem' }}
                          icon={getPriorityIcon(issue.priority)}
                        >
                          {issue.priority}
                        </Label>
                      </FlexItem>
                    )}
                    {issue.status && (
                      <FlexItem>
                        <Label color={getStatusColor(issue.status)} isCompact style={{ fontSize: '0.65rem' }}>
                          {issue.status}
                        </Label>
                      </FlexItem>
                    )}
                  </Flex>
                </div>
              </div>
            );
          })}
        </div>

        {/* Canvas Controls */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            gap: '4px',
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '6px',
            padding: '4px'
          }}
        >
          <Tooltip content="Zoom out">
            <Button variant="plain" onClick={onZoomOut} style={{ color: '#e0e0e0' }}>
              <SearchMinusIcon />
            </Button>
          </Tooltip>
          <span style={{ 
            color: '#888', 
            fontSize: '12px', 
            display: 'flex', 
            alignItems: 'center',
            padding: '0 8px'
          }}>
            {Math.round(zoom * 100)}%
          </span>
          <Tooltip content="Zoom in">
            <Button variant="plain" onClick={onZoomIn} style={{ color: '#e0e0e0' }}>
              <SearchPlusIcon />
            </Button>
          </Tooltip>
          <Tooltip content="Reset view">
            <Button variant="plain" onClick={onResetView} style={{ color: '#e0e0e0' }}>
              <ExpandArrowsAltIcon />
            </Button>
          </Tooltip>
        </div>

        {/* Status bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            background: 'rgba(0,0,0,0.7)',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#888'
          }}
        >
          {filteredIssues.length} issues • {edges.length} connections
          {selectedCanvasNode && ` • Selected: ${selectedCanvasNode}`}
        </div>

        {/* Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'rgba(0,0,0,0.7)',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#888'
          }}
        >
          <Flex spaceItems={{ default: 'spaceItemsMd' }}>
            <FlexItem>
              <span style={{ color: '#a882ff' }}>━</span> Epic
            </FlexItem>
            <FlexItem>
              <span style={{ color: '#44cf6e' }}>━</span> Story
            </FlexItem>
            <FlexItem>
              <span style={{ color: '#53dfdd' }}>━</span> Task
            </FlexItem>
            <FlexItem>
              <span style={{ color: '#fb464c' }}>━</span> Bug
            </FlexItem>
          </Flex>
        </div>
      </div>

      {/* Right Panel - Issue Detail (in canvas mode) */}
      <div style={{ 
        width: '350px', 
        overflowY: 'auto', 
        padding: '1.5rem',
        borderLeft: '1px solid var(--pf-v6-global--BorderColor--100)',
        backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
      }}>
        {selectedIssue ? (
          <IssueDetailPanel 
            selectedIssue={selectedIssue}
            summarizing={summarizing}
            summaryError={summaryError}
            generateSummary={generateSummary}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleStar={onToggleStar}
            onSetFlag={onSetFlag}
          />
        ) : (
          <EmptyState>
            <InboxIcon size="xl" />
            <Title headingLevel="h2" size="lg">
              Select an issue
            </Title>
            <EmptyStateBody>
              Choose an issue from the canvas to view its details
            </EmptyStateBody>
          </EmptyState>
        )}
      </div>
    </div>
  );
};

export default TasksCanvasView;
