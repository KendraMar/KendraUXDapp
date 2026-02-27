import React from 'react';
import {
  DataList,
  DataListItem,
  DataListItemRow,
  DataListItemCells,
  DataListCell,
  Label,
  Badge,
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
  AngleRightIcon,
  AngleDownIcon,
  FolderIcon
} from '@patternfly/react-icons';
import {
  flagColors,
  getPriorityColor,
  getPriorityIcon,
  getStatusColor,
  getDeadlineColor,
  getDeadlineStatus,
  formatDeadline,
  getSourceIcon
} from '../utils/taskHelpers';
import { formatTimestamp } from '../utils/taskFormatters';
import IssueDetailPanel from './IssueDetailPanel';

const TasksListView = ({
  hierarchicalTasks,
  filteredIssues,
  allIssues,
  selectedIssue,
  onIssueClick,
  onToggleExpanded,
  onToggleShowHidden,
  onToggleStar,
  summarizing,
  summaryError,
  generateSummary,
  onEdit,
  onDelete,
  onSetFlag
}) => {
  // Recursive function to render task nodes with hierarchy
  const renderTaskNode = (node, isChild = false) => {
    const { issue, depth, children, hiddenChildren, hasChildren, isExpanded, showingHidden } = node;
    const indentPx = depth * 24;
    const isParentTask = hasChildren;
    const filteredKeys = new Set(filteredIssues.map(i => i.key));
    const matchesFilter = filteredKeys.has(issue.key);
    
    // Determine visible children based on expansion state
    const visibleChildren = isExpanded ? children : [];
    
    const elements = [];
    
    // Render the task item
    elements.push(
      <DataListItem 
        key={`${issue.source}-${issue.key}`} 
        id={issue.key}
        style={{
          opacity: matchesFilter ? 1 : 0.7,
          backgroundColor: matchesFilter ? 'transparent' : 'var(--pf-v6-global--BackgroundColor--200)'
        }}
      >
        <DataListItemRow>
          <DataListItemCells
            dataListCells={[
              <DataListCell key="content" style={{ paddingLeft: `${indentPx}px` }}>
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                  <FlexItem>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                      {/* Expand/collapse button for parent tasks */}
                      {isParentTask && (
                        <FlexItem>
                          <Button
                            variant="plain"
                            onClick={(e) => onToggleExpanded(issue.key, e)}
                            style={{ 
                              padding: '2px', 
                              minWidth: '20px',
                              color: 'var(--pf-v6-global--Color--200)'
                            }}
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? <AngleDownIcon /> : <AngleRightIcon />}
                          </Button>
                        </FlexItem>
                      )}
                      {/* Spacer for non-parent tasks to align with parents */}
                      {!isParentTask && depth > 0 && (
                        <FlexItem style={{ width: '24px' }} />
                      )}
                      <FlexItem style={{ flex: 1, minWidth: 0 }}>
                        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ 
                              fontSize: isChild ? '0.85rem' : '0.95rem',
                              fontWeight: isParentTask && depth === 0 ? 500 : 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              margin: 0,
                              color: isChild ? 'var(--pf-v6-global--Color--200)' : 'inherit'
                            }}>
                              {issue.summary}
                            </p>
                          </FlexItem>
                          <FlexItem>
                            <span style={{ 
                              fontSize: '0.7rem', 
                              color: 'var(--pf-v6-global--Color--200)' 
                            }}>
                              {formatTimestamp(issue.updated)}
                            </span>
                          </FlexItem>
                        </Flex>
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                  <FlexItem style={{ marginLeft: isParentTask ? '24px' : (depth > 0 ? '24px' : 0) }}>
                    <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <FlexItem>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          color: 'var(--pf-v6-global--Color--200)',
                          fontFamily: 'var(--pf-v6-global--FontFamily--monospace)'
                        }}>
                          {issue.key}
                        </span>
                      </FlexItem>
                      {issue.source && !isChild && (
                        <FlexItem>
                          <Label 
                            color={issue.source === 'local' ? 'gold' : 'cyan'} 
                            isCompact
                            icon={getSourceIcon(issue.source)}
                            style={{ fontSize: '0.65rem' }}
                          >
                            {issue.sourceName || issue.source}
                          </Label>
                        </FlexItem>
                      )}
                      {/* Star indicator/toggle */}
                      {issue.source === 'local' && (
                        <FlexItem>
                          <Tooltip content={issue.starred ? 'Remove star' : 'Add star'}>
                            <Button
                              variant="plain"
                              onClick={(e) => onToggleStar(issue, e)}
                              style={{ 
                                padding: '2px 4px',
                                minWidth: 'auto',
                                color: issue.starred ? '#f0ab00' : 'var(--pf-v6-global--Color--200)'
                              }}
                              aria-label={issue.starred ? 'Starred' : 'Not starred'}
                            >
                              {issue.starred ? <StarIcon /> : <OutlinedStarIcon />}
                            </Button>
                          </Tooltip>
                        </FlexItem>
                      )}
                      {/* Flag indicator */}
                      {issue.flag && (
                        <FlexItem>
                          <FlagIcon style={{ color: flagColors[issue.flag] || '#6a6e73', fontSize: '0.85rem' }} />
                        </FlexItem>
                      )}
                      {/* Deadline indicator */}
                      {issue.due && (
                        <FlexItem>
                          <Tooltip content={formatDeadline(issue.due)}>
                            <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                              <FlexItem>
                                <CalendarAltIcon style={{ color: getDeadlineColor(issue.due), fontSize: '0.8rem' }} />
                              </FlexItem>
                              <FlexItem>
                                <span style={{ 
                                  fontSize: '0.7rem', 
                                  color: getDeadlineColor(issue.due),
                                  fontWeight: getDeadlineStatus(issue.due) === 'overdue' ? 600 : 400
                                }}>
                                  {formatDeadline(issue.due)}
                                </span>
                              </FlexItem>
                            </Flex>
                          </Tooltip>
                        </FlexItem>
                      )}
                      {issue.priority && (
                        <FlexItem>
                          <Label 
                            color={getPriorityColor(issue.priority)} 
                            isCompact
                            icon={getPriorityIcon(issue.priority)}
                            style={{ fontSize: '0.65rem' }}
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
                      {issue.issueType && (
                        <FlexItem>
                          <Label color="grey" isCompact style={{ fontSize: '0.65rem' }}>
                            {issue.issueType}
                          </Label>
                        </FlexItem>
                      )}
                      {/* Show child count badge for collapsed parents */}
                      {isParentTask && !isExpanded && (children.length > 0 || hiddenChildren.length > 0) && (
                        <FlexItem>
                          <Badge isRead style={{ fontSize: '0.6rem' }}>
                            {children.length + hiddenChildren.length} {children.length + hiddenChildren.length === 1 ? 'child' : 'children'}
                          </Badge>
                        </FlexItem>
                      )}
                    </Flex>
                  </FlexItem>
                </Flex>
              </DataListCell>
            ]}
          />
        </DataListItemRow>
      </DataListItem>
    );
    
    // Render visible children if expanded
    if (isExpanded) {
      visibleChildren.forEach(childNode => {
        elements.push(...renderTaskNode(childNode, true));
      });
      
      // Render "X children hidden by filter" message if there are hidden children
      if (hiddenChildren.length > 0) {
        elements.push(
          <div 
            key={`${issue.key}-hidden-msg`}
            style={{
              paddingLeft: `${(depth + 1) * 24 + 40}px`,
              paddingTop: '4px',
              paddingBottom: '4px',
              fontSize: '0.75rem',
              color: 'var(--pf-v6-global--Color--200)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            onClick={(e) => onToggleShowHidden(issue.key, e)}
          >
            {showingHidden ? <AngleDownIcon /> : <AngleRightIcon />}
            <span>
              {showingHidden 
                ? `Hide ${hiddenChildren.length} filtered ${hiddenChildren.length === 1 ? 'child' : 'children'}`
                : `${hiddenChildren.length} ${hiddenChildren.length === 1 ? 'child' : 'children'} hidden by filter`
              }
            </span>
          </div>
        );
        
        // Render hidden children if user clicked to show them
        if (showingHidden) {
          hiddenChildren.forEach(hiddenIssue => {
            const hiddenNode = {
              issue: hiddenIssue,
              depth: depth + 1,
              children: [],
              hiddenChildren: [],
              hasChildren: false,
              isExpanded: false,
              showingHidden: false
            };
            elements.push(...renderTaskNode(hiddenNode, true));
          });
        }
      }
    }
    
    return elements;
  };

  return (
    <>
      {/* Left Panel - Issue List */}
      <div style={{ 
        width: '400px', 
        display: 'flex', 
        flexDirection: 'column',
        borderRight: '1px solid var(--pf-v6-global--BorderColor--100)',
        overflow: 'hidden'
      }}>
        {/* Issue List - Scrollable */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {hierarchicalTasks.length === 0 ? (
            <EmptyState>
              <InboxIcon size="xl" />
              <Title headingLevel="h2" size="lg">
                No issues found
              </Title>
              <EmptyStateBody>
                {allIssues.length === 0 
                  ? 'No issues are assigned to you'
                  : 'No issues match the selected filters'
                }
              </EmptyStateBody>
            </EmptyState>
          ) : (
            <DataList 
              aria-label="jira issues list"
              selectedDataListItemId={selectedIssue?.key}
              onSelectDataListItem={onIssueClick}
              isCompact
            >
              {hierarchicalTasks.flatMap(node => renderTaskNode(node, false))}
            </DataList>
          )}
        </div>
      </div>

      {/* Right Panel - Issue Detail - Scrollable independently */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '1.5rem'
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
              Choose an issue from the list to view its details
            </EmptyStateBody>
          </EmptyState>
        )}
      </div>
    </>
  );
};

export default TasksListView;
