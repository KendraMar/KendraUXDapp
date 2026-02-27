import React from 'react';
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
  CheckCircleIcon
} from '@patternfly/react-icons';
import logoJira from '../../../../../src/assets/logos/logo-jira.svg';
import logoGoogleTasks from '../../../../../src/assets/logos/logo-google-tasks.svg';
import { FolderIcon } from '@patternfly/react-icons';

// Priority color mapping
export const getPriorityColor = (priority) => {
  const priorityLower = (priority || '').toLowerCase();
  switch (priorityLower) {
    case 'blocker':
    case 'critical':
      return 'red';
    case 'major':
    case 'high':
      return 'orange';
    case 'medium':
    case 'normal':
      return 'blue';
    case 'minor':
    case 'low':
      return 'grey';
    case 'trivial':
      return 'grey';
    default:
      return 'grey';
  }
};

// Priority icon mapping
export const getPriorityIcon = (priority) => {
  const priorityLower = (priority || '').toLowerCase();
  switch (priorityLower) {
    case 'blocker':
    case 'critical':
      return <ExclamationCircleIcon />;
    case 'major':
    case 'high':
      return <ExclamationTriangleIcon />;
    case 'medium':
    case 'normal':
      return <InfoCircleIcon />;
    case 'minor':
    case 'low':
    case 'trivial':
      return <CheckCircleIcon />;
    default:
      return <InfoCircleIcon />;
  }
};

// Status color mapping
export const getStatusColor = (status) => {
  const statusLower = (status || '').toLowerCase();
  if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('resolved')) {
    return 'green';
  } else if (statusLower.includes('progress') || statusLower.includes('review')) {
    return 'blue';
  } else if (statusLower.includes('open') || statusLower.includes('new') || statusLower.includes('to do')) {
    return 'grey';
  }
  return 'purple';
};

// Flag colors for visual display
export const flagColors = {
  red: '#c9190b',
  orange: '#f0ab00',
  yellow: '#f4c145',
  green: '#3e8635',
  blue: '#0066cc',
  purple: '#6753ac',
  gray: '#6a6e73'
};

// Flag options for dropdown
export const flagOptions = [
  { value: 'all', label: 'All flags' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'not-flagged', label: 'Not flagged' },
  { value: 'red', label: 'Red', color: '#c9190b' },
  { value: 'orange', label: 'Orange', color: '#f0ab00' },
  { value: 'yellow', label: 'Yellow', color: '#f4c145' },
  { value: 'green', label: 'Green', color: '#3e8635' },
  { value: 'blue', label: 'Blue', color: '#0066cc' },
  { value: 'purple', label: 'Purple', color: '#6753ac' },
  { value: 'gray', label: 'Gray', color: '#6a6e73' }
];

// Deadline options for dropdown
export const deadlineOptions = [
  { value: 'all', label: 'All deadlines' },
  { value: 'overdue', label: 'Overdue', color: '#c9190b' },
  { value: 'due-today', label: 'Due today', color: '#f0ab00' },
  { value: 'due-this-week', label: 'Due this week', color: '#f4c145' },
  { value: 'has-deadline', label: 'Has deadline' },
  { value: 'no-deadline', label: 'No deadline' }
];

// Helper function to get deadline status for a task
export const getDeadlineStatus = (dueDate) => {
  if (!dueDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'due-today';
  if (diffDays <= 7) return 'due-this-week';
  return 'upcoming';
};

// Get color for deadline indicator
export const getDeadlineColor = (dueDate) => {
  const status = getDeadlineStatus(dueDate);
  switch (status) {
    case 'overdue': return '#c9190b'; // red
    case 'due-today': return '#f0ab00'; // orange/gold
    case 'due-this-week': return '#f4c145'; // yellow
    default: return 'var(--pf-v6-global--Color--200)'; // grey
  }
};

// Format deadline for display
export const formatDeadline = (dueDate) => {
  if (!dueDate) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return absDays === 1 ? '1 day overdue' : `${absDays} days overdue`;
  }
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  
  return `Due ${due.toLocaleDateString()}`;
};

// Normalize status strings to kanban column keys
export const normalizeStatus = (status) => {
  const statusLower = (status || '').toLowerCase();
  
  if (statusLower === 'backlog' || statusLower.includes('backlog')) {
    return 'backlog';
  }
  if (statusLower === 'open' || statusLower === 'to do' || statusLower === 'new' || statusLower.includes('to do')) {
    return 'open';
  }
  if (statusLower.includes('progress') || statusLower === 'in progress' || statusLower === 'in-progress') {
    return 'in-progress';
  }
  if (statusLower.includes('block')) {
    return 'blocked';
  }
  if (statusLower.includes('review') || statusLower === 'in review') {
    return 'review';
  }
  if (statusLower.includes('done') || statusLower.includes('closed') || statusLower.includes('resolved') || statusLower.includes('complete')) {
    return 'done';
  }
  return 'other';
};

// Get source icon component
export const getSourceIcon = (sourceId) => {
  switch (sourceId) {
    case 'jira':
      return <img src={logoJira} alt="Jira" style={{ width: '16px', height: '16px' }} />;
    case 'googletasks':
      return <img src={logoGoogleTasks} alt="Google Tasks" style={{ width: '16px', height: '16px' }} />;
    case 'local':
      return <FolderIcon />;
    default:
      return null;
  }
};

// Check if cache is stale (older than 5 minutes)
export const isCacheStale = (cachedAtDate) => {
  if (!cachedAtDate) return true;
  const cacheAge = Date.now() - new Date(cachedAtDate).getTime();
  const fiveMinutes = 5 * 60 * 1000;
  return cacheAge > fiveMinutes;
};

// Format cache age for display
export const formatCacheAge = (cachedAtDate) => {
  if (!cachedAtDate) return null;
  const cacheAge = Date.now() - new Date(cachedAtDate).getTime();
  const minutes = Math.floor(cacheAge / 60000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
};

// Kanban column definitions
export const kanbanColumns = [
  { key: 'backlog', label: 'Backlog', color: '#6a6e73' },
  { key: 'open', label: 'Open', color: '#8a8d90' },
  { key: 'in-progress', label: 'In Progress', color: '#0066cc' },
  { key: 'blocked', label: 'Blocked', color: '#c9190b' },
  { key: 'review', label: 'In Review', color: '#8476d1' },
  { key: 'done', label: 'Done', color: '#3e8635' }
];

// Canvas layout constants
export const CANVAS_NODE_WIDTH = 280;
export const CANVAS_NODE_HEIGHT = 100;
export const GRID_SIZE = 20;

// Get issue type color for canvas nodes
export const getIssueTypeColor = (issueType) => {
  switch (issueType) {
    case 'Epic': return '#a882ff';
    case 'Story': return '#44cf6e';
    case 'Task': return '#53dfdd';
    case 'Bug': return '#fb464c';
    case 'Sub-task': return '#e9973f';
    default: return '#666';
  }
};

// Get edge color by type
export const getEdgeColor = (type) => {
  switch (type) {
    case 'parent': return '#44cf6e';
    case 'epic': return '#a882ff';
    case 'link': return '#53dfdd';
    default: return '#666';
  }
};
