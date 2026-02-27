import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import {
  EmptyState,
  EmptyStateBody,
  Title,
  Label,
  Tooltip,
  Button,
  Flex,
  FlexItem
} from '@patternfly/react-core';
import {
  InboxIcon,
  SearchMinusIcon,
  SearchPlusIcon,
  CompressIcon,
  AngleRightIcon,
  AngleDownIcon
} from '@patternfly/react-icons';
import {
  getStatusColor,
  getIssueTypeColor,
  normalizeStatus,
  flagColors
} from '../utils/taskHelpers';
import IssueDetailPanel from './IssueDetailPanel';

// --- Constants ---
const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 56;
const LEFT_PANEL_WIDTH = 420;
const PARENT_COL_WIDTH = 180;
const MIN_DAY_WIDTH = 3;
const MAX_DAY_WIDTH = 80;
const TODAY_COLOR = '#0066cc';
const GRID_LINE_COLOR = 'var(--pf-v6-global--BorderColor--100)';
const BAR_HEIGHT = 24;
const BAR_RADIUS = 4;
const BAR_Y_OFFSET = (ROW_HEIGHT - BAR_HEIGHT) / 2;
const DEPENDENCY_COLOR = '#8476d1';

// Status bar colors
const getStatusBarColor = (status) => {
  const norm = normalizeStatus(status);
  switch (norm) {
    case 'done': return '#3e8635';
    case 'in-progress': return '#0066cc';
    case 'review': return '#8476d1';
    case 'blocked': return '#c9190b';
    case 'open': return '#8a8d90';
    case 'backlog':
    default: return '#b8bbbe';
  }
};

// Get a lighter tint for the bar background
const getStatusBarBg = (status) => {
  const norm = normalizeStatus(status);
  switch (norm) {
    case 'done': return '#e6f5e1';
    case 'in-progress': return '#e0ecf7';
    case 'review': return '#ece8f7';
    case 'blocked': return '#fce8e6';
    case 'open': return '#f0f0f0';
    case 'backlog':
    default: return '#f5f5f5';
  }
};

// Date utilities
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const diffDays = (a, b) => {
  const msPerDay = 86400000;
  return Math.round((b - a) / msPerDay);
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfMonth = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const monthName = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short' });
};

const TasksTimelineView = ({
  filteredIssues,
  allIssues,
  selectedIssue,
  onIssueClick,
  onToggleStar,
  summarizing,
  summaryError,
  generateSummary,
  onEdit,
  onDelete,
  onSetFlag
}) => {
  const timelineRef = useRef(null);
  const headerScrollRef = useRef(null);
  const leftPanelRef = useRef(null);
  const [dayWidth, setDayWidth] = useState(12);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [hoveredRow, setHoveredRow] = useState(null);

  // Initialize all groups as expanded
  useEffect(() => {
    const parentKeys = new Set();
    filteredIssues.forEach(issue => {
      if (issue.parent && issue.parent.key) {
        parentKeys.add(issue.parent.key);
      }
      if (issue.epicKey) {
        parentKeys.add(issue.epicKey);
      }
      // Also check if this issue IS a parent
      const hasChildren = filteredIssues.some(
        other => (other.parent && other.parent.key === issue.key) || other.epicKey === issue.key
      );
      if (hasChildren) {
        parentKeys.add(issue.key);
      }
    });
    setExpandedGroups(parentKeys);
  }, [filteredIssues]);

  // Build hierarchical rows
  const { rows, parentGroups } = useMemo(() => {
    const issueMap = new Map();
    filteredIssues.forEach(i => issueMap.set(i.key, i));
    if (allIssues) {
      allIssues.forEach(i => { if (!issueMap.has(i.key)) issueMap.set(i.key, i); });
    }

    // Find parent-child relationships
    const childToParent = new Map();
    const parentToChildren = new Map();

    filteredIssues.forEach(issue => {
      let parentKey = null;
      if (issue.parent && issue.parent.key) {
        parentKey = issue.parent.key;
      } else if (issue.epicKey) {
        parentKey = issue.epicKey;
      }

      if (parentKey) {
        childToParent.set(issue.key, parentKey);
        if (!parentToChildren.has(parentKey)) {
          parentToChildren.set(parentKey, []);
        }
        parentToChildren.get(parentKey).push(issue.key);
      }
    });

    // Collect groups: parents with their children
    const groups = [];
    const processedKeys = new Set();
    const parentGroupMap = new Map();

    // First pass: collect all parent keys
    const allParentKeys = new Set(parentToChildren.keys());

    // Process parents in order
    allParentKeys.forEach(parentKey => {
      const parentIssue = issueMap.get(parentKey);
      const childKeys = parentToChildren.get(parentKey) || [];
      const children = childKeys
        .map(k => issueMap.get(k))
        .filter(Boolean)
        .filter(c => filteredIssues.some(fi => fi.key === c.key));

      if (children.length === 0) return;

      const group = {
        key: parentKey,
        label: parentIssue ? parentIssue.summary : parentKey,
        issue: parentIssue,
        children: children
      };
      groups.push(group);
      parentGroupMap.set(parentKey, group);
      processedKeys.add(parentKey);
      children.forEach(c => processedKeys.add(c.key));
    });

    // Second pass: ungrouped tasks
    const ungroupedTasks = filteredIssues.filter(i => !processedKeys.has(i.key));

    // Build flat row list
    const rowList = [];
    groups.forEach(group => {
      const isExpanded = expandedGroups.has(group.key);
      rowList.push({
        type: 'parent',
        key: group.key,
        label: group.label,
        issue: group.issue,
        childCount: group.children.length,
        isExpanded
      });
      if (isExpanded) {
        group.children.forEach(child => {
          rowList.push({
            type: 'child',
            key: child.key,
            label: child.summary,
            issue: child,
            parentKey: group.key
          });
        });
      }
    });

    // Add ungrouped tasks
    if (ungroupedTasks.length > 0) {
      ungroupedTasks.forEach(task => {
        rowList.push({
          type: 'standalone',
          key: task.key,
          label: task.summary,
          issue: task
        });
      });
    }

    return { rows: rowList, parentGroups: groups };
  }, [filteredIssues, allIssues, expandedGroups]);

  // Calculate time range
  const { timelineStart, timelineEnd, todayOffset, totalDays } = useMemo(() => {
    const now = startOfDay(new Date());
    let minDate = now;
    let maxDate = addDays(now, 30);

    filteredIssues.forEach(issue => {
      if (issue.created) {
        const d = startOfDay(new Date(issue.created));
        if (d < minDate) minDate = d;
      }
      if (issue.due) {
        const d = startOfDay(new Date(issue.due));
        if (d > maxDate) maxDate = d;
      }
      if (issue.updated) {
        const d = startOfDay(new Date(issue.updated));
        if (d > maxDate) maxDate = d;
      }
    });

    // Pad the range
    const start = addDays(startOfMonth(minDate), -7);
    const end = addDays(maxDate, 30);
    const days = diffDays(start, end);
    const todayOff = diffDays(start, now);

    return {
      timelineStart: start,
      timelineEnd: end,
      todayOffset: todayOff,
      totalDays: days
    };
  }, [filteredIssues]);

  // Build month headers
  const monthHeaders = useMemo(() => {
    const headers = [];
    let current = startOfMonth(timelineStart);
    while (current < timelineEnd) {
      const nextMonth = new Date(current);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const startDay = Math.max(0, diffDays(timelineStart, current));
      const endDay = Math.min(totalDays, diffDays(timelineStart, nextMonth));
      const width = (endDay - startDay) * dayWidth;

      if (width > 0) {
        headers.push({
          label: `${monthName(current)} ${current.getFullYear()}`,
          left: startDay * dayWidth,
          width,
          month: current.getMonth(),
          year: current.getFullYear()
        });
      }
      current = nextMonth;
    }
    return headers;
  }, [timelineStart, timelineEnd, totalDays, dayWidth]);

  // Build week/day grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    // Monthly lines
    let current = startOfMonth(addDays(timelineStart, 28));
    while (current < timelineEnd) {
      const offset = diffDays(timelineStart, current);
      lines.push({
        x: offset * dayWidth,
        isMonth: true
      });
      const next = new Date(current);
      next.setMonth(next.getMonth() + 1);
      current = next;
    }

    // Weekly lines if zoomed in enough
    if (dayWidth >= 8) {
      let day = new Date(timelineStart);
      // Align to Monday
      while (day.getDay() !== 1) {
        day = addDays(day, 1);
      }
      while (day < timelineEnd) {
        const offset = diffDays(timelineStart, day);
        lines.push({
          x: offset * dayWidth,
          isMonth: false
        });
        day = addDays(day, 7);
      }
    }

    return lines;
  }, [timelineStart, timelineEnd, dayWidth]);

  // Calculate task bar positions
  const taskBars = useMemo(() => {
    const bars = new Map();
    rows.forEach((row, index) => {
      if (!row.issue) return;
      const issue = row.issue;

      let startDate = null;
      let endDate = null;

      // Determine start date
      if (issue.created) {
        startDate = startOfDay(new Date(issue.created));
      }

      // Determine end date
      if (issue.due) {
        endDate = startOfDay(new Date(issue.due));
      } else if (issue.updated && issue.created) {
        // Use updated as a proxy end if no due date
        const updated = startOfDay(new Date(issue.updated));
        const created = startOfDay(new Date(issue.created));
        if (updated > created) {
          endDate = updated;
        }
      }

      // If we have no dates, skip
      if (!startDate) return;

      // Ensure minimum bar width of 7 days
      if (!endDate) {
        endDate = addDays(startDate, 14);
      }
      if (diffDays(startDate, endDate) < 3) {
        endDate = addDays(startDate, 7);
      }

      const barStart = diffDays(timelineStart, startDate);
      const barEnd = diffDays(timelineStart, endDate);

      // Check if task is done
      const isDone = normalizeStatus(issue.status) === 'done';

      bars.set(row.key, {
        x: barStart * dayWidth,
        width: Math.max((barEnd - barStart) * dayWidth, 20),
        y: index * ROW_HEIGHT + BAR_Y_OFFSET,
        color: getStatusBarColor(issue.status),
        bgColor: getStatusBarBg(issue.status),
        label: issue.summary,
        isDone,
        hasDue: !!issue.due,
        startDate,
        endDate
      });
    });
    return bars;
  }, [rows, timelineStart, dayWidth]);

  // Calculate dependency lines
  const dependencyLines = useMemo(() => {
    const lines = [];
    const rowIndexMap = new Map();
    rows.forEach((row, index) => {
      rowIndexMap.set(row.key, index);
    });

    rows.forEach((row) => {
      if (!row.issue) return;
      const issue = row.issue;

      // blocked_by relationships
      const blockedBy = issue.blocked_by || [];
      blockedBy.forEach(blockerKey => {
        const fromBar = taskBars.get(blockerKey);
        const toBar = taskBars.get(row.key);
        if (fromBar && toBar) {
          lines.push({
            fromX: fromBar.x + fromBar.width,
            fromY: fromBar.y + BAR_HEIGHT / 2,
            toX: toBar.x,
            toY: toBar.y + BAR_HEIGHT / 2,
            type: 'blocks'
          });
        }
      });

      // blocks relationships
      const blocks = issue.blocks || [];
      blocks.forEach(blockedKey => {
        const fromBar = taskBars.get(row.key);
        const toBar = taskBars.get(blockedKey);
        if (fromBar && toBar) {
          lines.push({
            fromX: fromBar.x + fromBar.width,
            fromY: fromBar.y + BAR_HEIGHT / 2,
            toX: toBar.x,
            toY: toBar.y + BAR_HEIGHT / 2,
            type: 'blocks'
          });
        }
      });

      // Jira issue links
      if (issue.issueLinks) {
        issue.issueLinks.forEach(link => {
          const targetKey = link.inwardIssue?.key || link.outwardIssue?.key;
          if (!targetKey) return;
          const fromBar = taskBars.get(row.key);
          const toBar = taskBars.get(targetKey);
          if (fromBar && toBar) {
            lines.push({
              fromX: fromBar.x + fromBar.width,
              fromY: fromBar.y + BAR_HEIGHT / 2,
              toX: toBar.x,
              toY: toBar.y + BAR_HEIGHT / 2,
              type: 'related'
            });
          }
        });
      }
    });

    return lines;
  }, [rows, taskBars]);

  // Sync horizontal scroll between header and timeline
  const handleTimelineScroll = useCallback((e) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  }, []);

  // Sync vertical scroll between left panel and timeline
  const handleTimelineVerticalScroll = useCallback((e) => {
    if (leftPanelRef.current) {
      leftPanelRef.current.scrollTop = e.target.scrollTop;
    }
  }, []);

  const handleLeftPanelScroll = useCallback((e) => {
    if (timelineRef.current) {
      timelineRef.current.scrollTop = e.target.scrollTop;
    }
  }, []);

  // Toggle group expansion
  const toggleGroup = useCallback((key) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setDayWidth(prev => Math.min(prev * 1.5, MAX_DAY_WIDTH));
  }, []);

  const zoomOut = useCallback(() => {
    setDayWidth(prev => Math.max(prev / 1.5, MIN_DAY_WIDTH));
  }, []);

  const zoomFit = useCallback(() => {
    if (!timelineRef.current) return;
    const containerWidth = timelineRef.current.clientWidth;
    const fitWidth = Math.max(MIN_DAY_WIDTH, Math.min(containerWidth / totalDays, MAX_DAY_WIDTH));
    setDayWidth(fitWidth);
  }, [totalDays]);

  // Scroll to today on mount
  useEffect(() => {
    if (timelineRef.current && todayOffset > 0) {
      const scrollTo = (todayOffset * dayWidth) - (timelineRef.current.clientWidth / 3);
      timelineRef.current.scrollLeft = Math.max(0, scrollTo);
      if (headerScrollRef.current) {
        headerScrollRef.current.scrollLeft = Math.max(0, scrollTo);
      }
    }
  }, [todayOffset, dayWidth, rows.length]);

  // Handle wheel zoom
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setDayWidth(prev => Math.max(MIN_DAY_WIDTH, Math.min(prev * delta, MAX_DAY_WIDTH)));
    }
  }, []);

  const timelineWidth = totalDays * dayWidth;
  const contentHeight = rows.length * ROW_HEIGHT;

  if (filteredIssues.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState>
          <InboxIcon style={{ fontSize: '3rem', color: 'var(--pf-v6-global--Color--200)', marginBottom: '1rem' }} />
          <Title headingLevel="h4" size="lg">No tasks to display</Title>
          <EmptyStateBody>
            No tasks match your current filters. Try adjusting your filters or create a new task.
          </EmptyStateBody>
        </EmptyState>
      </div>
    );
  }

  // Render a dependency arrow path
  const renderDependencyPath = (line, index) => {
    const { fromX, fromY, toX, toY, type } = line;
    const midX = fromX + (toX - fromX) / 2;
    const color = type === 'blocks' ? DEPENDENCY_COLOR : '#53dfdd';

    // Curved path
    const path = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

    return (
      <g key={`dep-${index}`}>
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray={type === 'related' ? '4,4' : 'none'}
          opacity={0.6}
        />
        {/* Arrow head */}
        <polygon
          points={`${toX},${toY} ${toX - 6},${toY - 4} ${toX - 6},${toY + 4}`}
          fill={color}
          opacity={0.6}
        />
      </g>
    );
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Main timeline area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Zoom controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          borderBottom: `1px solid ${GRID_LINE_COLOR}`,
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
          flexShrink: 0
        }}>
          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
            <FlexItem>
              <Button variant="plain" onClick={zoomOut} aria-label="Zoom out" style={{ padding: '4px' }}>
                <SearchMinusIcon />
              </Button>
            </FlexItem>
            <FlexItem>
              <span style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)', minWidth: '60px', textAlign: 'center', display: 'inline-block' }}>
                {dayWidth < 6 ? 'Months' : dayWidth < 15 ? 'Weeks' : dayWidth < 40 ? 'Days' : 'Days (detail)'}
              </span>
            </FlexItem>
            <FlexItem>
              <Button variant="plain" onClick={zoomIn} aria-label="Zoom in" style={{ padding: '4px' }}>
                <SearchPlusIcon />
              </Button>
            </FlexItem>
            <FlexItem>
              <Button variant="plain" onClick={zoomFit} aria-label="Fit to view" style={{ padding: '4px' }}>
                <CompressIcon />
              </Button>
            </FlexItem>
            <FlexItem>
              <span style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                {rows.length} row{rows.length !== 1 ? 's' : ''} &middot; Ctrl+Scroll to zoom
              </span>
            </FlexItem>
          </Flex>
        </div>

        {/* Header + Content area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left panel: task names */}
          <div style={{
            width: LEFT_PANEL_WIDTH,
            minWidth: LEFT_PANEL_WIDTH,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: `2px solid ${GRID_LINE_COLOR}`,
            backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
          }}>
            {/* Left header */}
            <div style={{
              height: HEADER_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              borderBottom: `1px solid ${GRID_LINE_COLOR}`,
              flexShrink: 0,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--pf-v6-global--Color--200)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div style={{ width: PARENT_COL_WIDTH, padding: '0 12px' }}>Group</div>
              <div style={{ flex: 1, padding: '0 12px' }}>Task</div>
            </div>

            {/* Left rows */}
            <div
              ref={leftPanelRef}
              onScroll={handleLeftPanelScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden'
              }}
            >
              <div style={{ height: contentHeight }}>
                {rows.map((row, index) => {
                  const isSelected = selectedIssue && row.issue && selectedIssue.key === row.issue.key;
                  const isHovered = hoveredRow === index;

                  return (
                    <div
                      key={row.key + '-' + index}
                      style={{
                        height: ROW_HEIGHT,
                        display: 'flex',
                        alignItems: 'center',
                        borderBottom: `1px solid ${row.type === 'parent' ? GRID_LINE_COLOR : 'var(--pf-v6-global--BorderColor--300, #e0e0e0)'}`,
                        backgroundColor: isSelected
                          ? 'var(--pf-v6-global--palette--blue-50, rgba(0, 102, 204, 0.08))'
                          : isHovered
                            ? 'var(--pf-v6-global--BackgroundColor--200)'
                            : row.type === 'parent'
                              ? 'var(--pf-v6-global--BackgroundColor--100)'
                              : 'transparent',
                        cursor: row.issue ? 'pointer' : 'default',
                        transition: 'background-color 0.1s'
                      }}
                      onClick={() => row.issue && onIssueClick(row.issue)}
                      onMouseEnter={() => setHoveredRow(index)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {/* Group/Parent column */}
                      <div style={{
                        width: PARENT_COL_WIDTH,
                        padding: '0 8px',
                        fontSize: '0.8rem',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {row.type === 'parent' && (
                          <>
                            <Button
                              variant="plain"
                              style={{ padding: '2px', minWidth: 'auto' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleGroup(row.key);
                              }}
                            >
                              {row.isExpanded ? (
                                <AngleDownIcon style={{ fontSize: '0.75rem' }} />
                              ) : (
                                <AngleRightIcon style={{ fontSize: '0.75rem' }} />
                              )}
                            </Button>
                            <span style={{
                              fontWeight: 600,
                              color: 'var(--pf-v6-global--Color--100)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              flex: 1
                            }}>
                              {row.label}
                            </span>
                            <span style={{
                              fontSize: '0.7rem',
                              color: 'var(--pf-v6-global--Color--200)',
                              flexShrink: 0
                            }}>
                              ({row.childCount})
                            </span>
                          </>
                        )}
                      </div>

                      {/* Task name column */}
                      <div style={{
                        flex: 1,
                        padding: '0 12px',
                        fontSize: '0.8rem',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {row.type === 'child' && (
                          <span style={{
                            width: '8px',
                            height: '1px',
                            backgroundColor: 'var(--pf-v6-global--Color--200)',
                            flexShrink: 0
                          }} />
                        )}
                        {row.issue && (
                          <>
                            {row.issue.issueType && (
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: getIssueTypeColor(row.issue.issueType),
                                flexShrink: 0
                              }} />
                            )}
                            <span style={{
                              color: isSelected ? 'var(--pf-v6-global--primary-color--100)' : 'var(--pf-v6-global--Color--100)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {row.type === 'parent' ? '' : row.label}
                            </span>
                            {row.issue.flag && (
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '1px',
                                backgroundColor: flagColors[row.issue.flag] || '#6a6e73',
                                flexShrink: 0
                              }} />
                            )}
                          </>
                        )}
                        {row.type === 'standalone' && !row.issue && (
                          <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>{row.label}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right panel: timeline */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Timeline header (months) */}
            <div
              ref={headerScrollRef}
              style={{
                height: HEADER_HEIGHT,
                overflow: 'hidden',
                borderBottom: `1px solid ${GRID_LINE_COLOR}`,
                flexShrink: 0,
                position: 'relative',
                backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
              }}
            >
              <div style={{ width: timelineWidth, height: '100%', position: 'relative' }}>
                {/* Month labels */}
                {monthHeaders.map((header, i) => (
                  <div
                    key={`month-${i}`}
                    style={{
                      position: 'absolute',
                      left: header.left,
                      width: header.width,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      borderRight: `1px solid ${GRID_LINE_COLOR}`,
                      padding: '0 8px'
                    }}
                  >
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--pf-v6-global--Color--200)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {header.label}
                    </span>
                  </div>
                ))}

                {/* Today marker in header */}
                <div style={{
                  position: 'absolute',
                  left: todayOffset * dayWidth,
                  top: 0,
                  bottom: 0,
                  width: 0,
                  borderLeft: `2px solid ${TODAY_COLOR}`,
                  zIndex: 2
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 4,
                    left: -20,
                    backgroundColor: TODAY_COLOR,
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '3px',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Today
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline body */}
            <div
              ref={timelineRef}
              onScroll={(e) => {
                handleTimelineScroll(e);
                handleTimelineVerticalScroll(e);
              }}
              onWheel={handleWheel}
              style={{
                flex: 1,
                overflow: 'auto',
                position: 'relative'
              }}
            >
              <svg
                width={timelineWidth}
                height={contentHeight}
                style={{ display: 'block' }}
              >
                {/* Background row stripes */}
                {rows.map((row, index) => {
                  const isSelected = selectedIssue && row.issue && selectedIssue.key === row.issue.key;
                  const isHovered = hoveredRow === index;
                  return (
                    <rect
                      key={`row-bg-${index}`}
                      x={0}
                      y={index * ROW_HEIGHT}
                      width={timelineWidth}
                      height={ROW_HEIGHT}
                      fill={
                        isSelected
                          ? 'rgba(0, 102, 204, 0.06)'
                          : isHovered
                            ? 'rgba(0, 0, 0, 0.02)'
                            : row.type === 'parent'
                              ? 'rgba(0, 0, 0, 0.015)'
                              : 'transparent'
                      }
                      style={{ cursor: row.issue ? 'pointer' : 'default' }}
                      onClick={() => row.issue && onIssueClick(row.issue)}
                      onMouseEnter={() => setHoveredRow(index)}
                      onMouseLeave={() => setHoveredRow(null)}
                    />
                  );
                })}

                {/* Horizontal row dividers */}
                {rows.map((row, index) => (
                  <line
                    key={`row-line-${index}`}
                    x1={0}
                    y1={(index + 1) * ROW_HEIGHT}
                    x2={timelineWidth}
                    y2={(index + 1) * ROW_HEIGHT}
                    stroke={row.type === 'parent' ? GRID_LINE_COLOR : '#f0f0f0'}
                    strokeWidth={row.type === 'parent' ? 1 : 0.5}
                  />
                ))}

                {/* Vertical grid lines */}
                {gridLines.map((line, i) => (
                  <line
                    key={`grid-${i}`}
                    x1={line.x}
                    y1={0}
                    x2={line.x}
                    y2={contentHeight}
                    stroke={line.isMonth ? GRID_LINE_COLOR : '#f0f0f0'}
                    strokeWidth={line.isMonth ? 1 : 0.5}
                  />
                ))}

                {/* Dependency lines */}
                {dependencyLines.map((line, index) => renderDependencyPath(line, index))}

                {/* Task bars */}
                {rows.map((row, index) => {
                  const bar = taskBars.get(row.key);
                  if (!bar) return null;

                  const isSelected = selectedIssue && row.issue && selectedIssue.key === row.issue.key;
                  const isParent = row.type === 'parent';

                  return (
                    <g
                      key={`bar-${row.key}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => row.issue && onIssueClick(row.issue)}
                      onMouseEnter={() => setHoveredRow(index)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      {/* Bar background */}
                      <rect
                        x={bar.x}
                        y={bar.y}
                        width={bar.width}
                        height={BAR_HEIGHT}
                        rx={BAR_RADIUS}
                        ry={BAR_RADIUS}
                        fill={isParent ? bar.color : bar.bgColor}
                        stroke={isSelected ? TODAY_COLOR : bar.color}
                        strokeWidth={isSelected ? 2 : isParent ? 0 : 1}
                        opacity={isParent ? 0.85 : 1}
                      />

                      {/* Progress fill for non-parent bars */}
                      {!isParent && bar.isDone && (
                        <rect
                          x={bar.x}
                          y={bar.y}
                          width={bar.width}
                          height={BAR_HEIGHT}
                          rx={BAR_RADIUS}
                          ry={BAR_RADIUS}
                          fill={bar.color}
                          opacity={0.25}
                        />
                      )}

                      {/* Bar label */}
                      {bar.width > 50 && (
                        <text
                          x={bar.x + 8}
                          y={bar.y + BAR_HEIGHT / 2}
                          dominantBaseline="central"
                          fontSize={isParent ? 11 : 10}
                          fontWeight={isParent ? 600 : 400}
                          fill={isParent ? '#fff' : 'var(--pf-v6-global--Color--100)'}
                          style={{ pointerEvents: 'none' }}
                        >
                          <tspan>
                            {bar.label.length > Math.floor(bar.width / 7)
                              ? bar.label.substring(0, Math.floor(bar.width / 7) - 2) + '...'
                              : bar.label}
                          </tspan>
                        </text>
                      )}

                      {/* Due date indicator (small diamond) */}
                      {bar.hasDue && (
                        <polygon
                          points={`${bar.x + bar.width},${bar.y + BAR_HEIGHT / 2 - 4} ${bar.x + bar.width + 4},${bar.y + BAR_HEIGHT / 2} ${bar.x + bar.width},${bar.y + BAR_HEIGHT / 2 + 4} ${bar.x + bar.width - 4},${bar.y + BAR_HEIGHT / 2}`}
                          fill={bar.color}
                          opacity={0.8}
                        />
                      )}
                    </g>
                  );
                })}

                {/* Today line */}
                <line
                  x1={todayOffset * dayWidth}
                  y1={0}
                  x2={todayOffset * dayWidth}
                  y2={contentHeight}
                  stroke={TODAY_COLOR}
                  strokeWidth={2}
                  strokeDasharray="4,4"
                  opacity={0.8}
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedIssue && (
        <div style={{
          width: '350px',
          minWidth: '350px',
          borderLeft: '1px solid var(--pf-v6-global--BorderColor--100)',
          overflowY: 'auto',
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
        }}>
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
        </div>
      )}
    </div>
  );
};

export default TasksTimelineView;
