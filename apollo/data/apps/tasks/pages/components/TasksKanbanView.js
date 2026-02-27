import React from 'react';
import {
  Badge,
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
  StarIcon,
  OutlinedStarIcon,
  FlagIcon,
  CalendarAltIcon,
  LockIcon,
  FolderIcon
} from '@patternfly/react-icons';
import logoJira from '../../../../../src/assets/logos/logo-jira.svg';
import logoGoogleTasks from '../../../../../src/assets/logos/logo-google-tasks.svg';
import {
  kanbanColumns,
  flagColors,
  getPriorityColor,
  getPriorityIcon,
  getDeadlineColor,
  getDeadlineStatus,
  formatDeadline,
  getSourceIcon
} from '../utils/taskHelpers';
import IssueDetailPanel from './IssueDetailPanel';

const TasksKanbanView = ({
  tasksByStatus,
  selectedIssue,
  draggedTask,
  dragOverColumn,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardClick,
  onToggleStar,
  summarizing,
  summaryError,
  generateSummary,
  onEdit,
  onDelete,
  onSetFlag
}) => {
  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Kanban Board */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '1rem',
        gap: '1rem',
        backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)'
      }}>
        {kanbanColumns.map(column => {
          const columnTasks = tasksByStatus[column.key] || [];
          const isDropTarget = dragOverColumn === column.key;
          
          // Don't show empty "Blocked" or "Other" columns
          if ((column.key === 'blocked' || column.key === 'other') && columnTasks.length === 0) {
            return null;
          }
          
          return (
            <div
              key={column.key}
              style={{
                minWidth: '280px',
                maxWidth: '280px',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: isDropTarget ? 'rgba(0, 102, 204, 0.1)' : 'var(--pf-v6-global--BackgroundColor--100)',
                borderRadius: '8px',
                border: isDropTarget ? '2px dashed var(--pf-v6-global--primary-color--100)' : '1px solid var(--pf-v6-global--BorderColor--100)',
                transition: 'background-color 0.15s ease, border-color 0.15s ease'
              }}
              onDragOver={(e) => onDragOver(e, column.key)}
              onDragLeave={(e) => onDragLeave(e, column.key)}
              onDrop={(e) => onDrop(e, column.key)}
            >
              {/* Column Header */}
              <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: column.color
                    }} />
                  </FlexItem>
                  <FlexItem>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {column.label}
                    </span>
                  </FlexItem>
                </Flex>
                <Badge isRead>{columnTasks.length}</Badge>
              </div>
              
              {/* Column Body - Scrollable */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {columnTasks.length === 0 ? (
                  <div style={{
                    padding: '2rem 1rem',
                    textAlign: 'center',
                    color: 'var(--pf-v6-global--Color--200)',
                    fontSize: '0.875rem'
                  }}>
                    No tasks
                  </div>
                ) : (
                  columnTasks.map(task => {
                    const isLocal = task.source === 'local';
                    const isSelected = selectedIssue?.key === task.key;
                    const isDragging = draggedTask?.key === task.key;
                    
                    return (
                      <div
                        key={`${task.source}-${task.key}`}
                        draggable={isLocal}
                        onDragStart={(e) => onDragStart(e, task)}
                        onDragEnd={onDragEnd}
                        onClick={() => onCardClick(task)}
                        style={{
                          padding: '0.75rem',
                          backgroundColor: isSelected 
                            ? 'var(--pf-v6-global--BackgroundColor--300)' 
                            : 'var(--pf-v6-global--BackgroundColor--200)',
                          borderRadius: '6px',
                          border: isSelected 
                            ? '1px solid var(--pf-v6-global--primary-color--100)' 
                            : '1px solid var(--pf-v6-global--BorderColor--100)',
                          cursor: isLocal ? 'grab' : 'pointer',
                          opacity: isDragging ? 0.5 : 1,
                          transition: 'background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
                          boxShadow: isSelected ? '0 0 0 2px rgba(0, 102, 204, 0.2)' : 'none'
                        }}
                      >
                        {/* Card Header */}
                        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '0.5rem' }}>
                          <FlexItem>
                            <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                              <FlexItem style={{ display: 'flex', alignItems: 'center' }}>
                                {task.source === 'jira' ? (
                                  <img src={logoJira} alt="Jira" style={{ width: '14px', height: '14px' }} />
                                ) : task.source === 'googletasks' ? (
                                  <img src={logoGoogleTasks} alt="Google Tasks" style={{ width: '14px', height: '14px' }} />
                                ) : (
                                  <FolderIcon style={{ width: '14px', height: '14px', color: 'var(--pf-v6-global--Color--200)' }} />
                                )}
                              </FlexItem>
                              <FlexItem>
                                <span style={{ 
                                  fontSize: '0.75rem', 
                                  fontWeight: 'bold',
                                  color: 'var(--pf-v6-global--primary-color--100)' 
                                }}>
                                  {task.key}
                                </span>
                              </FlexItem>
                            </Flex>
                          </FlexItem>
                          <FlexItem>
                            <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                              {/* Star indicator */}
                              {isLocal && (
                                <FlexItem>
                                  <Tooltip content={task.starred ? 'Remove star' : 'Add star'}>
                                    <Button
                                      variant="plain"
                                      onClick={(e) => onToggleStar(task, e)}
                                      style={{ 
                                        padding: '1px 3px',
                                        minWidth: 'auto',
                                        color: task.starred ? '#f0ab00' : 'var(--pf-v6-global--Color--200)'
                                      }}
                                      aria-label={task.starred ? 'Starred' : 'Not starred'}
                                    >
                                      {task.starred ? <StarIcon style={{ width: '12px', height: '12px' }} /> : <OutlinedStarIcon style={{ width: '12px', height: '12px' }} />}
                                    </Button>
                                  </Tooltip>
                                </FlexItem>
                              )}
                              {/* Flag indicator */}
                              {task.flag && (
                                <FlexItem>
                                  <FlagIcon style={{ width: '12px', height: '12px', color: flagColors[task.flag] || '#6a6e73' }} />
                                </FlexItem>
                              )}
                              {/* Deadline indicator */}
                              {task.due && (
                                <FlexItem>
                                  <Tooltip content={formatDeadline(task.due)}>
                                    <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                                      <FlexItem>
                                        <CalendarAltIcon style={{ width: '12px', height: '12px', color: getDeadlineColor(task.due) }} />
                                      </FlexItem>
                                      <FlexItem>
                                        <span style={{ 
                                          fontSize: '0.65rem', 
                                          color: getDeadlineColor(task.due),
                                          fontWeight: getDeadlineStatus(task.due) === 'overdue' ? 600 : 400
                                        }}>
                                          {formatDeadline(task.due)}
                                        </span>
                                      </FlexItem>
                                    </Flex>
                                  </Tooltip>
                                </FlexItem>
                              )}
                              {!isLocal && (
                                <FlexItem>
                                  <Tooltip content="External task (read-only)">
                                    <LockIcon style={{ width: '12px', height: '12px', color: 'var(--pf-v6-global--Color--200)' }} />
                                  </Tooltip>
                                </FlexItem>
                              )}
                            </Flex>
                          </FlexItem>
                        </Flex>
                        
                        {/* Card Title */}
                        <p style={{ 
                          fontSize: '0.875rem',
                          margin: '0 0 0.5rem 0',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          lineHeight: '1.3'
                        }}>
                          {task.summary}
                        </p>
                        
                        {/* Card Footer */}
                        <Flex spaceItems={{ default: 'spaceItemsXs' }} wrap={{ default: 'wrap' }}>
                          {task.priority && (
                            <FlexItem>
                              <Label 
                                color={getPriorityColor(task.priority)} 
                                isCompact
                                style={{ fontSize: '0.65rem' }}
                                icon={getPriorityIcon(task.priority)}
                              >
                                {task.priority}
                              </Label>
                            </FlexItem>
                          )}
                          {task.issueType && (
                            <FlexItem>
                              <Label color="grey" isCompact style={{ fontSize: '0.65rem' }}>
                                {task.issueType}
                              </Label>
                            </FlexItem>
                          )}
                        </Flex>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
        
        {/* Show "Other" column if there are uncategorized tasks */}
        {tasksByStatus.other && tasksByStatus.other.length > 0 && (
          <div
            style={{
              minWidth: '280px',
              maxWidth: '280px',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
              borderRadius: '8px',
              border: '1px solid var(--pf-v6-global--BorderColor--100)'
            }}
          >
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#6a6e73'
                  }} />
                </FlexItem>
                <FlexItem>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                    Other
                  </span>
                </FlexItem>
              </Flex>
              <Badge isRead>{tasksByStatus.other.length}</Badge>
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {tasksByStatus.other.map(task => {
                const isLocal = task.source === 'local';
                const isSelected = selectedIssue?.key === task.key;
                
                return (
                  <div
                    key={`${task.source}-${task.key}`}
                    onClick={() => onCardClick(task)}
                    style={{
                      padding: '0.75rem',
                      backgroundColor: isSelected 
                        ? 'var(--pf-v6-global--BackgroundColor--300)' 
                        : 'var(--pf-v6-global--BackgroundColor--200)',
                      borderRadius: '6px',
                      border: isSelected 
                        ? '1px solid var(--pf-v6-global--primary-color--100)' 
                        : '1px solid var(--pf-v6-global--BorderColor--100)',
                      cursor: 'pointer'
                    }}
                  >
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '0.5rem' }}>
                      <FlexItem>
                        <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem style={{ display: 'flex', alignItems: 'center' }}>
                            {task.source === 'jira' ? (
                              <img src={logoJira} alt="Jira" style={{ width: '14px', height: '14px' }} />
                            ) : task.source === 'googletasks' ? (
                              <img src={logoGoogleTasks} alt="Google Tasks" style={{ width: '14px', height: '14px' }} />
                            ) : (
                              <FolderIcon style={{ width: '14px', height: '14px', color: 'var(--pf-v6-global--Color--200)' }} />
                            )}
                          </FlexItem>
                          <FlexItem>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 'bold',
                              color: 'var(--pf-v6-global--primary-color--100)' 
                            }}>
                              {task.key}
                            </span>
                          </FlexItem>
                        </Flex>
                      </FlexItem>
                      <FlexItem>
                        {!isLocal && (
                          <Tooltip content="External task (read-only)">
                            <LockIcon style={{ width: '12px', height: '12px', color: 'var(--pf-v6-global--Color--200)' }} />
                          </Tooltip>
                        )}
                      </FlexItem>
                    </Flex>
                    <p style={{ 
                      fontSize: '0.875rem',
                      margin: '0 0 0.5rem 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.3'
                    }}>
                      {task.summary}
                    </p>
                    <Flex spaceItems={{ default: 'spaceItemsXs' }} wrap={{ default: 'wrap' }}>
                      {task.priority && (
                        <FlexItem>
                          <Label 
                            color={getPriorityColor(task.priority)} 
                            isCompact
                            style={{ fontSize: '0.65rem' }}
                            icon={getPriorityIcon(task.priority)}
                          >
                            {task.priority}
                          </Label>
                        </FlexItem>
                      )}
                      {task.issueType && (
                        <FlexItem>
                          <Label color="grey" isCompact style={{ fontSize: '0.65rem' }}>
                            {task.issueType}
                          </Label>
                        </FlexItem>
                      )}
                      {task.status && (
                        <FlexItem>
                          <Label color="purple" isCompact style={{ fontSize: '0.65rem' }}>
                            {task.status}
                          </Label>
                        </FlexItem>
                      )}
                    </Flex>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Right Panel - Issue Detail (in kanban mode) */}
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
              Select a task
            </Title>
            <EmptyStateBody>
              Click on a task card to view its details
            </EmptyStateBody>
          </EmptyState>
        )}
      </div>
    </div>
  );
};

export default TasksKanbanView;
