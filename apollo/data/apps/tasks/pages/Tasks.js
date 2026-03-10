import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  PageSection,
  Title,
  Content,
  Flex,
  FlexItem,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Badge,
  Button,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  SearchInput,
  Label,
  LabelGroup
} from '@patternfly/react-core';
import {
  ListIcon,
  TopologyIcon,
  TableIcon,
  SyncAltIcon,
  PlusCircleIcon,
  StarIcon,
  OutlinedStarIcon,
  FlagIcon,
  OutlinedFlagIcon,
  CalendarAltIcon,
  OutlinedCalendarAltIcon,
  ExclamationCircleIcon,
  FilterIcon,
  TimesIcon,
  OutlinedClockIcon
} from '@patternfly/react-icons';
import { useSpaceContext } from '../../../../src/lib/SpaceContext';
import TasksKanbanView from './components/TasksKanbanView';
import TasksListView from './components/TasksListView';
import TasksCanvasView from './components/TasksCanvasView';
import TasksTimelineView from './components/TasksTimelineView';
import CreateTaskModal from './components/CreateTaskModal';
import EditTaskModal from './components/EditTaskModal';
import DeleteTaskModal from './components/DeleteTaskModal';
import IssueDetailPanel from './components/IssueDetailPanel';
import {
  getPriorityColor,
  getPriorityIcon,
  getStatusColor,
  getDeadlineStatus,
  getDeadlineColor,
  formatDeadline,
  normalizeStatus,
  getSourceIcon,
  isCacheStale,
  formatCacheAge,
  kanbanColumns,
  flagColors,
  flagOptions,
  deadlineOptions,
  CANVAS_NODE_WIDTH,
  CANVAS_NODE_HEIGHT,
  GRID_SIZE,
  getIssueTypeColor,
  getEdgeColor
} from './utils/taskHelpers';
import { formatTimestamp } from './utils/taskFormatters';

const Tasks = () => {
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStarred, setFilterStarred] = useState('all'); // 'all', 'starred', 'not-starred'
  const [filterFlag, setFilterFlag] = useState('all'); // 'all', 'flagged', 'not-flagged', or specific color
  const [filterDeadline, setFilterDeadline] = useState('all'); // 'all', 'overdue', 'due-today', 'due-this-week', 'has-deadline', 'no-deadline'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('created-desc');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isStarredOpen, setIsStarredOpen] = useState(false);
  const [isFlagOpen, setIsFlagOpen] = useState(false);
  const [isDeadlineOpen, setIsDeadlineOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState(null);
  const [cachedAt, setCachedAt] = useState(null);
  
  // Sources state
  const [availableSources, setAvailableSources] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  
  // View toggle state - restore from localStorage or default to 'list'
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('tasks-view-mode');
    return saved && ['list', 'kanban', 'canvas'].includes(saved) ? saved : 'list';
  });
  
  // Kanban drag state
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  
  // Canvas view state
  const canvasRef = useRef(null);
  const [viewportOffset, setViewportOffset] = useState({ x: 50, y: 50 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedCanvasNode, setSelectedCanvasNode] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState({});
  
  // Create task modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'task',
    status: 'backlog',
    priority: 'medium',
    component: '',
    labels: '',
    due: '',
    starred: false,
    flag: ''
  });

  // Edit task modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editTask, setEditTask] = useState({
    key: '',
    title: '',
    description: '',
    type: 'task',
    status: 'backlog',
    priority: 'medium',
    component: '',
    labels: '',
    due: '',
    starred: false,
    flag: ''
  });

  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Space context - auto-scope based on active space's sources
  const { activeSpaceId, activeSpace, sources: spaceSources, spaceName, getSourcesByType, hasSourceType } = useSpaceContext();
  const [spaceFilterActive, setSpaceFilterActive] = useState(true); // whether space-based scoping is applied

  // Extract Jira project keys from space sources
  // Supports URLs like: https://issues.redhat.com/browse/RHOAIENG-48120 → RHOAIENG
  // Also handles: https://issues.redhat.com/projects/RHOAIENG
  // And: https://jira.atlassian.net/browse/PROJ-123 → PROJ
  const spaceJiraProjectKeys = useMemo(() => {
    if (!spaceSources || spaceSources.length === 0) return [];
    
    const projectKeys = new Set();
    
    // Get all sources that look like Jira (typed as 'jira' or with Jira-like URLs)
    spaceSources.forEach(source => {
      const url = source.url || '';
      
      // Match /browse/PROJECT-123 pattern
      const browseMatch = url.match(/\/browse\/([A-Z][A-Z0-9]+-)\d+/i);
      if (browseMatch) {
        projectKeys.add(browseMatch[1].replace(/-$/, '').toUpperCase());
        return;
      }
      
      // Match /browse/PROJECT pattern (without issue number)
      const browseProjectMatch = url.match(/\/browse\/([A-Z][A-Z0-9]+)$/i);
      if (browseProjectMatch) {
        projectKeys.add(browseProjectMatch[1].toUpperCase());
        return;
      }
      
      // Match /projects/PROJECT pattern
      const projectMatch = url.match(/\/projects?\/([A-Z][A-Z0-9]+)/i);
      if (projectMatch) {
        projectKeys.add(projectMatch[1].toUpperCase());
        return;
      }
    });
    
    return Array.from(projectKeys);
  }, [spaceSources]);

  // Determine if space context filtering should be visible
  const hasSpaceContext = spaceJiraProjectKeys.length > 0;

  // Reset space filter to active when space changes
  useEffect(() => {
    setSpaceFilterActive(true);
  }, [activeSpaceId]);

  // Hierarchical list view state
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [showHiddenChildren, setShowHiddenChildren] = useState(new Set());

  // Toggle task expansion
  const toggleTaskExpanded = useCallback((taskKey, e) => {
    if (e) {
      e.stopPropagation();
    }
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskKey)) {
        next.delete(taskKey);
      } else {
        next.add(taskKey);
      }
      return next;
    });
  }, []);

  // Toggle showing hidden children for a task
  const toggleShowHiddenChildren = useCallback((taskKey, e) => {
    if (e) {
      e.stopPropagation();
    }
    setShowHiddenChildren(prev => {
      const next = new Set(prev);
      if (next.has(taskKey)) {
        next.delete(taskKey);
      } else {
        next.add(taskKey);
      }
      return next;
    });
  }, []);

  // Fetch available sources on mount
  useEffect(() => {
    fetchSources();
  }, []);

  // Fetch tasks when selected sources change
  // Use a ref to track if this is the initial load
  const isInitialLoad = useRef(true);
  
  useEffect(() => {
    if (availableSources.length > 0) {
      if (isInitialLoad.current) {
        // Initial load - use cache-first pattern
        isInitialLoad.current = false;
        fetchTasks(false);
      } else {
        // Sources changed - refresh to get data for new sources
        fetchTasks(true);
      }
    }
  }, [selectedSources]);

  const fetchSources = async () => {
    try {
      const response = await fetch('/api/tasks/sources');
      const data = await response.json();
      
      if (data.success && data.sources) {
        setAvailableSources(data.sources);
        // Initialize with all sources selected
        const enabledSources = data.sources.filter(s => s.enabled).map(s => s.id);
        setSelectedSources(enabledSources);
      }
    } catch (error) {
      console.error('Error fetching task sources:', error);
      // Fallback to fetching without sources filter
      fetchTasks();
    }
  };

  // Restore last selected issue from localStorage when issues are loaded
  useEffect(() => {
    if (issues.length > 0 && !selectedIssue) {
      const lastSelectedKey = localStorage.getItem('tasks-last-selected-issue');
      if (lastSelectedKey) {
        const issue = issues.find(i => i.key === lastSelectedKey);
        if (issue) {
          setSelectedIssue(issue);
        }
      }
    }
  }, [issues]);


  // Fetch tasks - supports cache-first pattern
  // forceRefresh: true = fetch fresh data from Jira
  // forceRefresh: false = return cached data if available
  const fetchTasks = async (forceRefresh = false) => {
    // Show refreshing indicator for manual refresh
    if (forceRefresh) {
      setRefreshing(true);
    }
    
    try {
      // Build URL with sources filter and refresh flag
      let url = '/api/tasks';
      const params = new URLSearchParams();
      
      if (selectedSources.length > 0 && selectedSources.length < availableSources.length) {
        params.set('sources', selectedSources.join(','));
      }
      if (forceRefresh) {
        params.set('refresh', 'true');
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success === false) {
        // Don't overwrite existing issues if we have them and this was a refresh
        if (issues.length === 0) {
          setError(data.error || 'Failed to fetch tasks');
        }
        setInitialLoading(false);
        setRefreshing(false);
        return;
      }
      
      setIssues(data.issues || []);
      setCachedAt(data.cachedAt || new Date().toISOString());
      setError(null);
      setInitialLoading(false);
      setRefreshing(false);
      
      // Auto-refresh if cache is stale (> 5 minutes) and this wasn't already a refresh
      if (!forceRefresh && data.fromCache && isCacheStale(data.cachedAt)) {
        // Trigger background refresh after a short delay
        setTimeout(() => {
          fetchTasks(true);
        }, 500);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      // Only show error if we don't have any data to display
      if (issues.length === 0) {
        setError('Failed to connect to task sources. Please check your configuration.');
      }
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  // Manual refresh handler
  const handleRefresh = () => {
    fetchTasks(true);
  };

  // Create task modal handlers
  const handleOpenCreateModal = () => {
    setNewTask({
      title: '',
      description: '',
      type: 'task',
      status: 'backlog',
      priority: 'medium',
      component: '',
      labels: '',
      due: '',
      starred: false,
      flag: ''
    });
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateError(null);
  };

  const handleCreateTaskChange = (field, value) => {
    setNewTask(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      setCreateError('Title is required');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTask.title.trim(),
          description: newTask.description.trim(),
          type: newTask.type,
          status: newTask.status,
          priority: newTask.priority,
          component: newTask.component.trim() || null,
          labels: newTask.labels ? newTask.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
          due: newTask.due || null,
          starred: newTask.starred || false,
          flag: newTask.flag || null
        })
      });

      const data = await response.json();

      if (data.success) {
        // Add the new task to the list
        setIssues(prev => [data.task, ...prev]);
        // Select the new task
        setSelectedIssue(data.task);
        localStorage.setItem('tasks-last-selected-issue', data.task.key);
        // Close the modal
        setIsCreateModalOpen(false);
      } else {
        setCreateError(data.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setCreateError('Failed to create task. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Edit task modal handlers
  const handleOpenEditModal = (task) => {
    // Map task data to edit form
    const typeMap = {
      'Task': 'task',
      'Bug': 'bug',
      'Story': 'story',
      'Feature': 'feature',
      'Epic': 'epic',
      'Spike': 'spike'
    };
    const statusMap = {
      'Backlog': 'backlog',
      'Open': 'open',
      'In Progress': 'in-progress',
      'Blocked': 'blocked',
      'In Review': 'review',
      'Done': 'done'
    };
    const priorityMap = {
      'Critical': 'critical',
      'High': 'high',
      'Medium': 'medium',
      'Low': 'low'
    };

    setEditTask({
      key: task.key,
      title: task.summary || '',
      description: task.description || '',
      type: typeMap[task.issueType] || 'task',
      status: statusMap[task.status] || 'backlog',
      priority: priorityMap[task.priority] || 'medium',
      component: (task.components || []).join(', '),
      labels: (task.labels || []).join(', '),
      due: task.due || '',
      starred: task.starred || false,
      flag: task.flag || ''
    });
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditError(null);
  };

  const handleEditTaskChange = (field, value) => {
    setEditTask(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateTask = async () => {
    if (!editTask.title.trim()) {
      setEditError('Title is required');
      return;
    }

    setIsUpdating(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/tasks/${editTask.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTask.title.trim(),
          description: editTask.description.trim(),
          type: editTask.type,
          status: editTask.status,
          priority: editTask.priority,
          component: editTask.component.trim() || null,
          labels: editTask.labels ? editTask.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
          due: editTask.due || null,
          starred: editTask.starred,
          flag: editTask.flag || null
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update the task in the list
        setIssues(prev => prev.map(issue => 
          issue.key === editTask.key ? data.task : issue
        ));
        // Update selected issue if it's the one being edited
        if (selectedIssue && selectedIssue.key === editTask.key) {
          setSelectedIssue(data.task);
        }
        // Close the modal
        setIsEditModalOpen(false);
      } else {
        setEditError(data.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setEditError('Failed to update task. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete task handlers
  const handleOpenDeleteModal = (task) => {
    setTaskToDelete(task);
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteError(null);
    setTaskToDelete(null);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/tasks/${taskToDelete.key}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        // Remove the task from the list
        setIssues(prev => prev.filter(issue => issue.key !== taskToDelete.key));
        // Clear selected issue if it was deleted
        if (selectedIssue && selectedIssue.key === taskToDelete.key) {
          setSelectedIssue(null);
          localStorage.removeItem('tasks-last-selected-issue');
        }
        // Close the modal
        setIsDeleteModalOpen(false);
        setTaskToDelete(null);
      } else {
        setDeleteError(data.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setDeleteError('Failed to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };


  // Handle source selection toggle
  const handleSourceToggle = (sourceId) => {
    setSelectedSources(prev => {
      if (prev.includes(sourceId)) {
        // Don't allow deselecting all sources
        if (prev.length === 1) return prev;
        return prev.filter(id => id !== sourceId);
      } else {
        return [...prev, sourceId];
      }
    });
  };

  // Get sources toggle text
  const getSourcesToggleText = () => {
    if (selectedSources.length === 0 || selectedSources.length === availableSources.length) {
      return 'All sources';
    }
    if (selectedSources.length === 1) {
      const source = availableSources.find(s => s.id === selectedSources[0]);
      return source?.name || 'Selected source';
    }
    return `${selectedSources.length} sources`;
  };

  const generateSummary = async (issueKey) => {
    setSummarizing(true);
    setSummaryError(null);
    
    const issue = issues.find(i => i.key === issueKey);
    if (!issue) {
      setSummaryError('Issue not found');
      setSummarizing(false);
      return;
    }
    
    try {
      const response = await fetch(`/api/tasks/${issueKey}/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: issue.summary,
          description: issue.description,
          priority: issue.priority,
          status: issue.status,
          issueType: issue.issueType
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the issue in the list with the new summary
        setIssues(issues.map(i => 
          i.key === issueKey ? { ...i, aiSummary: data.summary } : i
        ));
        
        // Update the selected issue if it's the one being summarized
        if (selectedIssue && selectedIssue.key === issueKey) {
          setSelectedIssue({ ...selectedIssue, aiSummary: data.summary });
        }
      } else {
        setSummaryError(data.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryError('Failed to connect to AI service');
    } finally {
      setSummarizing(false);
    }
  };

  const handleIssueClick = (_event, issueKey) => {
    const issue = filteredIssues.find(i => i.key === issueKey);
    if (issue) {
      setSelectedIssue(issue);
      // Persist the selected issue key for session restore
      localStorage.setItem('tasks-last-selected-issue', issue.key);
    }
  };


  // Toggle star status for a task
  const handleToggleStar = async (task, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Only works for local tasks
    if (task.source !== 'local') {
      return;
    }
    
    const newStarred = !task.starred;
    console.log('Toggle star:', task.key, 'current:', task.starred, 'new:', newStarred);
    
    // Optimistically update the UI
    const updatedIssue = { ...task, starred: newStarred };
    setIssues(prev => prev.map(issue => 
      issue.key === task.key ? updatedIssue : issue
    ));
    
    if (selectedIssue && selectedIssue.key === task.key) {
      setSelectedIssue(updatedIssue);
    }
    
    // Send update to API
    try {
      const requestBody = {
        title: task.summary,
        starred: newStarred
      };
      console.log('Sending request:', requestBody);
      
      const response = await fetch(`/api/tasks/${task.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('Response:', data);

      if (data.success) {
        console.log('Returned task starred value:', data.task?.starred);
        setIssues(prev => prev.map(issue => 
          issue.key === task.key ? data.task : issue
        ));
        if (selectedIssue && selectedIssue.key === task.key) {
          setSelectedIssue(data.task);
        }
      } else {
        // Revert on error
        setIssues(prev => prev.map(issue => 
          issue.key === task.key ? task : issue
        ));
        if (selectedIssue && selectedIssue.key === task.key) {
          setSelectedIssue(task);
        }
        console.error('Failed to toggle star:', data.error);
      }
    } catch (error) {
      // Revert on error
      setIssues(prev => prev.map(issue => 
        issue.key === task.key ? task : issue
      ));
      if (selectedIssue && selectedIssue.key === task.key) {
        setSelectedIssue(task);
      }
      console.error('Error toggling star:', error);
    }
  };

  // Set flag for a task
  const handleSetFlag = async (task, flagColor, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Only works for local tasks
    if (task.source !== 'local') {
      return;
    }
    
    const newFlag = flagColor || null;
    
    // Optimistically update the UI
    const updatedIssue = { ...task, flag: newFlag };
    setIssues(prev => prev.map(issue => 
      issue.key === task.key ? updatedIssue : issue
    ));
    
    if (selectedIssue && selectedIssue.key === task.key) {
      setSelectedIssue(updatedIssue);
    }
    
    // Send update to API
    try {
      const response = await fetch(`/api/tasks/${task.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: task.summary,
          flag: newFlag
        })
      });

      const data = await response.json();

      if (data.success) {
        setIssues(prev => prev.map(issue => 
          issue.key === task.key ? data.task : issue
        ));
        if (selectedIssue && selectedIssue.key === task.key) {
          setSelectedIssue(data.task);
        }
      } else {
        // Revert on error
        setIssues(prev => prev.map(issue => 
          issue.key === task.key ? task : issue
        ));
        if (selectedIssue && selectedIssue.key === task.key) {
          setSelectedIssue(task);
        }
        console.error('Failed to set flag:', data.error);
      }
    } catch (error) {
      // Revert on error
      setIssues(prev => prev.map(issue => 
        issue.key === task.key ? task : issue
      ));
      if (selectedIssue && selectedIssue.key === task.key) {
        setSelectedIssue(task);
      }
      console.error('Error setting flag:', error);
    }
  };

  // Persist view mode to localStorage
  useEffect(() => {
    localStorage.setItem('tasks-view-mode', viewMode);
  }, [viewMode]);


  // Kanban drag-and-drop handlers
  const handleDragStart = (e, task) => {
    if (task.source !== 'local') {
      // Show visual feedback that Jira tasks can't be dragged
      e.preventDefault();
      return;
    }
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.key);
    // Add dragging class for styling
    e.target.classList.add('kanban-card-dragging');
  };

  const handleDragEnd = (e) => {
    setDraggedTask(null);
    setDragOverColumn(null);
    e.target.classList.remove('kanban-card-dragging');
  };

  const handleDragOver = (e, columnKey) => {
    e.preventDefault();
    if (draggedTask) {
      setDragOverColumn(columnKey);
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e, columnKey) => {
    // Only clear if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e, columnKey) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    if (!draggedTask || draggedTask.source !== 'local') {
      return;
    }
    
    const currentStatus = normalizeStatus(draggedTask.status);
    if (currentStatus === columnKey) {
      // No change needed
      setDraggedTask(null);
      return;
    }

    // Map column key back to status value for API
    const statusMap = {
      'backlog': 'backlog',
      'open': 'open',
      'in-progress': 'in-progress',
      'blocked': 'blocked',
      'review': 'review',
      'done': 'done'
    };

    const newStatus = statusMap[columnKey];
    if (!newStatus) {
      setDraggedTask(null);
      return;
    }

    // Optimistically update the UI
    const updatedIssue = { ...draggedTask, status: columnKey === 'in-progress' ? 'In Progress' : columnKey === 'review' ? 'In Review' : columnKey.charAt(0).toUpperCase() + columnKey.slice(1) };
    setIssues(prev => prev.map(issue => 
      issue.key === draggedTask.key ? updatedIssue : issue
    ));
    
    // Update selected issue if it's the one being moved
    if (selectedIssue && selectedIssue.key === draggedTask.key) {
      setSelectedIssue(updatedIssue);
    }

    // Send update to API
    try {
      const response = await fetch(`/api/tasks/${draggedTask.key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draggedTask.summary,
          status: newStatus
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update with server response
        setIssues(prev => prev.map(issue => 
          issue.key === draggedTask.key ? data.task : issue
        ));
        if (selectedIssue && selectedIssue.key === draggedTask.key) {
          setSelectedIssue(data.task);
        }
      } else {
        // Revert on error
        setIssues(prev => prev.map(issue => 
          issue.key === draggedTask.key ? draggedTask : issue
        ));
        if (selectedIssue && selectedIssue.key === draggedTask.key) {
          setSelectedIssue(draggedTask);
        }
        console.error('Failed to update task status:', data.error);
      }
    } catch (error) {
      // Revert on error
      setIssues(prev => prev.map(issue => 
        issue.key === draggedTask.key ? draggedTask : issue
      ));
      if (selectedIssue && selectedIssue.key === draggedTask.key) {
        setSelectedIssue(draggedTask);
      }
      console.error('Error updating task status:', error);
    }

    setDraggedTask(null);
  };

  // Handle kanban card click
  const handleKanbanCardClick = (task) => {
    setSelectedIssue(task);
    localStorage.setItem('tasks-last-selected-issue', task.key);
  };


  const filteredIssues = issues
    .filter(issue => {
      // Space context filter - scope to Jira projects from active space
      if (hasSpaceContext && spaceFilterActive && spaceJiraProjectKeys.length > 0) {
        // For Jira issues, check if the issue key starts with one of the space's project keys
        if (issue.source === 'jira') {
          const issueProjectKey = issue.key ? issue.key.split('-')[0].toUpperCase() : '';
          if (!spaceJiraProjectKeys.includes(issueProjectKey)) {
            return false;
          }
        }
        // Local tasks always pass through (they're not Jira-scoped)
        // Google Tasks also pass through
      }

      if (filterStatus !== 'all' && issue.status !== filterStatus) {
        return false;
      }
      if (filterPriority !== 'all' && issue.priority !== filterPriority) {
        return false;
      }
      // Starred filter
      if (filterStarred === 'starred' && !issue.starred) {
        return false;
      }
      if (filterStarred === 'not-starred' && issue.starred) {
        return false;
      }
      // Flag filter
      if (filterFlag === 'flagged' && !issue.flag) {
        return false;
      }
      if (filterFlag === 'not-flagged' && issue.flag) {
        return false;
      }
      if (filterFlag !== 'all' && filterFlag !== 'flagged' && filterFlag !== 'not-flagged' && issue.flag !== filterFlag) {
        return false;
      }
      // Deadline filter
      if (filterDeadline !== 'all') {
        const deadlineStatus = getDeadlineStatus(issue.due);
        if (filterDeadline === 'overdue' && deadlineStatus !== 'overdue') {
          return false;
        }
        if (filterDeadline === 'due-today' && deadlineStatus !== 'due-today') {
          return false;
        }
        if (filterDeadline === 'due-this-week' && deadlineStatus !== 'due-this-week' && deadlineStatus !== 'due-today') {
          return false;
        }
        if (filterDeadline === 'has-deadline' && !issue.due) {
          return false;
        }
        if (filterDeadline === 'no-deadline' && issue.due) {
          return false;
        }
      }
      // Full-text search across multiple fields
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableFields = [
          issue.key,
          issue.summary,
          issue.title,
          issue.description,
          issue.status,
          issue.priority,
          issue.issueType,
          issue.component,
          issue.assignee,
          issue.reporter,
          ...(issue.labels || [])
        ].filter(Boolean);
        const matchesSearch = searchableFields.some(field => 
          String(field).toLowerCase().includes(query)
        );
        if (!matchesSearch) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'starred-first':
          // Starred tasks come first, then sort by created date
          if (a.starred && !b.starred) return -1;
          if (!a.starred && b.starred) return 1;
          return new Date(b.created || 0) - new Date(a.created || 0);
        case 'flagged-first':
          // Flagged tasks come first, then sort by flag color priority, then by created date
          const flagOrder = { 'red': 0, 'orange': 1, 'yellow': 2, 'green': 3, 'blue': 4, 'purple': 5, 'gray': 6 };
          if (a.flag && !b.flag) return -1;
          if (!a.flag && b.flag) return 1;
          if (a.flag && b.flag) {
            const aFlagOrder = flagOrder[a.flag] ?? 99;
            const bFlagOrder = flagOrder[b.flag] ?? 99;
            if (aFlagOrder !== bFlagOrder) return aFlagOrder - bFlagOrder;
          }
          return new Date(b.created || 0) - new Date(a.created || 0);
        case 'created-desc':
          return new Date(b.created || 0) - new Date(a.created || 0);
        case 'created-asc':
          return new Date(a.created || 0) - new Date(b.created || 0);
        case 'updated-desc':
          return new Date(b.updated || 0) - new Date(a.updated || 0);
        case 'updated-asc':
          return new Date(a.updated || 0) - new Date(b.updated || 0);
        case 'priority':
          const priorityOrder = { 'blocker': 0, 'critical': 1, 'high': 2, 'major': 3, 'medium': 4, 'normal': 5, 'minor': 6, 'low': 7, 'trivial': 8 };
          const aPriority = priorityOrder[(a.priority || '').toLowerCase()] ?? 99;
          const bPriority = priorityOrder[(b.priority || '').toLowerCase()] ?? 99;
          return aPriority - bPriority;
        case 'key':
          return (a.key || '').localeCompare(b.key || '');
        case 'due-asc':
          // Tasks with due dates come first, sorted by soonest due date
          // Tasks without due dates are sorted to the bottom
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return new Date(a.due) - new Date(b.due);
        default:
          return 0;
      }
    });

  // Group tasks by normalized status for Kanban columns
  const tasksByStatus = useMemo(() => {
    const grouped = {
      backlog: [],
      open: [],
      'in-progress': [],
      blocked: [],
      review: [],
      done: [],
      other: []
    };
    
    filteredIssues.forEach(issue => {
      const normalizedStatus = normalizeStatus(issue.status);
      if (grouped[normalizedStatus]) {
        grouped[normalizedStatus].push(issue);
      } else {
        grouped.other.push(issue);
      }
    });
    
    return grouped;
  }, [filteredIssues]);

  // Build hierarchical task structure for list view
  // This creates a tree of tasks with parent/child relationships
  const hierarchicalTasks = useMemo(() => {
    // Create a map of all issues by key for quick lookup
    const allIssuesMap = new Map(issues.map(i => [i.key, i]));
    const filteredKeys = new Set(filteredIssues.map(i => i.key));
    
    // Build parent -> children relationships from multiple sources
    // A task is a "child" if:
    // 1. It appears in another task's children array (local tasks)
    // 2. It has an epicKey pointing to another task
    // 3. It has a parent field pointing to another task
    const childToParent = new Map(); // childKey -> parentKey
    const parentToChildren = new Map(); // parentKey -> [childKeys in order]
    
    issues.forEach(issue => {
      // Handle children array (local tasks define children explicitly)
      if (issue.children && Array.isArray(issue.children)) {
        issue.children.forEach(childKey => {
          if (allIssuesMap.has(childKey)) {
            childToParent.set(childKey, issue.key);
            if (!parentToChildren.has(issue.key)) {
              parentToChildren.set(issue.key, []);
            }
            // Preserve order from children array
            if (!parentToChildren.get(issue.key).includes(childKey)) {
              parentToChildren.get(issue.key).push(childKey);
            }
          }
        });
      }
      
      // Handle epicKey (Jira-style epic linking)
      if (issue.epicKey && allIssuesMap.has(issue.epicKey)) {
        // Only set if not already a child via children array
        if (!childToParent.has(issue.key)) {
          childToParent.set(issue.key, issue.epicKey);
          if (!parentToChildren.has(issue.epicKey)) {
            parentToChildren.set(issue.epicKey, []);
          }
          if (!parentToChildren.get(issue.epicKey).includes(issue.key)) {
            parentToChildren.get(issue.epicKey).push(issue.key);
          }
        }
      }
      
      // Handle parent field (Jira-style sub-task parent)
      if (issue.parent && issue.parent.key && allIssuesMap.has(issue.parent.key)) {
        // Only set if not already a child via other mechanisms
        if (!childToParent.has(issue.key)) {
          childToParent.set(issue.key, issue.parent.key);
          if (!parentToChildren.has(issue.parent.key)) {
            parentToChildren.set(issue.parent.key, []);
          }
          if (!parentToChildren.get(issue.parent.key).includes(issue.key)) {
            parentToChildren.get(issue.parent.key).push(issue.key);
          }
        }
      }
    });
    
    // Determine root-level tasks (tasks without parents, or whose parents aren't in the list)
    const rootTasks = [];
    const processedAsChild = new Set();
    
    // Helper to get the depth/level of a task (0 = root, 1 = child of root, etc.)
    const getTaskDepth = (taskKey, visited = new Set()) => {
      if (visited.has(taskKey)) return 0; // Prevent circular references
      visited.add(taskKey);
      const parentKey = childToParent.get(taskKey);
      if (!parentKey || !allIssuesMap.has(parentKey)) return 0;
      return 1 + getTaskDepth(parentKey, visited);
    };
    
    // Build the tree structure
    // For each task that matches the filter, determine if it should appear at root level
    // or be shown under its parent
    const buildTaskNode = (issue, depth = 0) => {
      const childKeys = parentToChildren.get(issue.key) || [];
      
      // Separate children into those that match the filter and those hidden
      const visibleChildren = [];
      const hiddenChildren = [];
      
      childKeys.forEach(childKey => {
        const childIssue = allIssuesMap.get(childKey);
        if (childIssue) {
          if (filteredKeys.has(childKey)) {
            visibleChildren.push(buildTaskNode(childIssue, depth + 1));
          } else {
            hiddenChildren.push(childIssue);
          }
        }
      });
      
      return {
        issue,
        depth,
        children: visibleChildren,
        hiddenChildren,
        hasChildren: childKeys.length > 0,
        isExpanded: expandedTasks.has(issue.key),
        showingHidden: showHiddenChildren.has(issue.key)
      };
    };
    
    // Process filtered issues
    // A task appears at root level if:
    // 1. It has no parent, OR
    // 2. Its parent doesn't match the current filter AND none of its ancestors do
    // However, if a child matches the filter but parent doesn't, show the parent anyway (collapsed)
    
    // First, find all ancestors of filtered tasks
    const ancestorsToShow = new Set();
    filteredIssues.forEach(issue => {
      let currentKey = issue.key;
      while (childToParent.has(currentKey)) {
        const parentKey = childToParent.get(currentKey);
        if (parentKey && allIssuesMap.has(parentKey)) {
          ancestorsToShow.add(parentKey);
          currentKey = parentKey;
        } else {
          break;
        }
      }
    });
    
    // Collect root-level tasks (those with no parent in the visible set)
    const rootTaskKeys = new Set();
    
    // Add filtered tasks that have no parent (or parent not in visible set)
    filteredIssues.forEach(issue => {
      const parentKey = childToParent.get(issue.key);
      if (!parentKey || (!filteredKeys.has(parentKey) && !ancestorsToShow.has(parentKey))) {
        // This is a root-level visible task (unless its parent is being shown as ancestor)
        if (!ancestorsToShow.has(childToParent.get(issue.key))) {
          rootTaskKeys.add(issue.key);
        }
      }
    });
    
    // Add ancestor tasks that need to be shown (even if they don't match filter)
    ancestorsToShow.forEach(ancestorKey => {
      // Only add as root if this ancestor doesn't itself have a visible parent
      const parentKey = childToParent.get(ancestorKey);
      if (!parentKey || !ancestorsToShow.has(parentKey)) {
        rootTaskKeys.add(ancestorKey);
      }
    });
    
    // Build tree nodes for root tasks
    const result = [];
    rootTaskKeys.forEach(taskKey => {
      const issue = allIssuesMap.get(taskKey);
      if (issue) {
        result.push(buildTaskNode(issue, 0));
      }
    });
    
    // Sort root tasks same as filteredIssues sorting
    result.sort((a, b) => {
      const aIdx = filteredIssues.findIndex(i => i.key === a.issue.key);
      const bIdx = filteredIssues.findIndex(i => i.key === b.issue.key);
      // If both in filtered, use that order; otherwise put filtered ones first
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      // For ancestors not in filter, sort by created date desc
      return new Date(b.issue.created || 0) - new Date(a.issue.created || 0);
    });
    
    return result;
  }, [issues, filteredIssues, expandedTasks, showHiddenChildren]);

  // Extract unique statuses and priorities from issues
  const uniqueStatuses = ['all', ...new Set(issues.map(i => i.status).filter(Boolean))];
  const uniquePriorities = ['all', ...new Set(issues.map(i => i.priority).filter(Boolean))];

  const statusOptions = uniqueStatuses.map(status => ({
    value: status,
    label: status === 'all' ? 'All statuses' : status
  }));

  const priorityOptions = uniquePriorities.map(priority => ({
    value: priority,
    label: priority === 'all' ? 'All priorities' : priority
  }));

  // Secondary filter management
  const activeSecondaryFilterCount = (filterStarred !== 'all' ? 1 : 0) + (filterFlag !== 'all' ? 1 : 0) + (filterDeadline !== 'all' ? 1 : 0);

  const hasActiveFilters = filterStatus !== 'all' || filterPriority !== 'all' ||
    filterStarred !== 'all' || filterFlag !== 'all' || filterDeadline !== 'all' ||
    (selectedSources.length > 0 && selectedSources.length < availableSources.length);

  const clearAllFilters = () => {
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterStarred('all');
    setFilterFlag('all');
    setFilterDeadline('all');
    setSelectedSources(availableSources.filter(s => s.enabled).map(s => s.id));
  };

  // Build active filter labels for display
  const getActiveFilterLabels = () => {
    const labels = [];
    if (selectedSources.length > 0 && selectedSources.length < availableSources.length) {
      labels.push({ key: 'sources', label: `Sources: ${selectedSources.length}`, onClose: () => setSelectedSources(availableSources.filter(s => s.enabled).map(s => s.id)) });
    }
    if (filterStatus !== 'all') {
      labels.push({ key: 'status', label: `Status: ${filterStatus}`, onClose: () => setFilterStatus('all') });
    }
    if (filterPriority !== 'all') {
      labels.push({ key: 'priority', label: `Priority: ${filterPriority}`, onClose: () => setFilterPriority('all') });
    }
    if (filterStarred !== 'all') {
      labels.push({ key: 'starred', label: filterStarred === 'starred' ? 'Starred' : 'Not starred', onClose: () => setFilterStarred('all') });
    }
    if (filterFlag !== 'all') {
      const flagLabel = flagOptions.find(opt => opt.value === filterFlag)?.label || filterFlag;
      labels.push({ key: 'flag', label: `Flag: ${flagLabel}`, onClose: () => setFilterFlag('all') });
    }
    if (filterDeadline !== 'all') {
      const deadlineLabel = deadlineOptions.find(opt => opt.value === filterDeadline)?.label || filterDeadline;
      labels.push({ key: 'deadline', label: `Deadline: ${deadlineLabel}`, onClose: () => setFilterDeadline('all') });
    }
    return labels;
  };

  // Compute initial canvas layout when issues change
  useEffect(() => {
    if (filteredIssues.length > 0 && Object.keys(nodePositions).length === 0) {
      computeCanvasLayout();
    }
  }, [filteredIssues]);

  // Reset node positions when filters change
  useEffect(() => {
    computeCanvasLayout();
  }, [filterStatus, filterPriority, filterDeadline, searchQuery]);

  // Compute canvas layout - organizes issues by type and relationships
  const computeCanvasLayout = useCallback(() => {
    const positions = {};
    const issueKeys = new Set(filteredIssues.map(i => i.key));
    
    // Group issues by type for initial layout
    const epics = filteredIssues.filter(i => i.issueType === 'Epic');
    const stories = filteredIssues.filter(i => i.issueType === 'Story');
    const tasks = filteredIssues.filter(i => i.issueType === 'Task');
    const bugs = filteredIssues.filter(i => i.issueType === 'Bug');
    const subtasks = filteredIssues.filter(i => i.issueType === 'Sub-task');
    const others = filteredIssues.filter(i => 
      !['Epic', 'Story', 'Task', 'Bug', 'Sub-task'].includes(i.issueType)
    );

    const HORIZONTAL_GAP = 350;
    const VERTICAL_GAP = 140;
    let currentX = 0;
    let currentY = 0;
    
    // Build a map of parent -> children relationships
    const parentChildren = {};
    filteredIssues.forEach(issue => {
      if (issue.parent && issueKeys.has(issue.parent.key)) {
        if (!parentChildren[issue.parent.key]) {
          parentChildren[issue.parent.key] = [];
        }
        parentChildren[issue.parent.key].push(issue.key);
      }
      if (issue.epicKey && issueKeys.has(issue.epicKey)) {
        if (!parentChildren[issue.epicKey]) {
          parentChildren[issue.epicKey] = [];
        }
        parentChildren[issue.epicKey].push(issue.key);
      }
    });

    // Layout epics first (they're parents)
    epics.forEach((epic, idx) => {
      const children = parentChildren[epic.key] || [];
      const epicX = currentX;
      const epicY = 0;
      positions[epic.key] = { x: epicX, y: epicY };
      
      // Layout children below the epic
      children.forEach((childKey, childIdx) => {
        if (!positions[childKey]) {
          positions[childKey] = {
            x: epicX + (childIdx * (CANVAS_NODE_WIDTH + 40)) - ((children.length - 1) * (CANVAS_NODE_WIDTH + 40) / 2),
            y: epicY + VERTICAL_GAP
          };
        }
      });
      
      currentX += Math.max(children.length, 1) * HORIZONTAL_GAP;
    });

    // Layout remaining items that don't have positions yet
    const unpositioned = [...stories, ...tasks, ...bugs, ...subtasks, ...others]
      .filter(issue => !positions[issue.key]);
    
    // Start a new row for unpositioned items
    currentY = epics.length > 0 ? VERTICAL_GAP * 2.5 : 0;
    currentX = 0;
    const ITEMS_PER_ROW = 4;
    
    unpositioned.forEach((issue, idx) => {
      positions[issue.key] = {
        x: (idx % ITEMS_PER_ROW) * HORIZONTAL_GAP,
        y: currentY + Math.floor(idx / ITEMS_PER_ROW) * VERTICAL_GAP
      };
    });

    setNodePositions(positions);
  }, [filteredIssues]);

  // Build edges from relationships
  const computeEdges = useCallback(() => {
    const edges = [];
    const issueKeys = new Set(filteredIssues.map(i => i.key));
    
    filteredIssues.forEach(issue => {
      // Parent-child relationships (Epic -> Story, Story -> Subtask)
      if (issue.parent && issueKeys.has(issue.parent.key)) {
        edges.push({
          id: `${issue.parent.key}-${issue.key}-parent`,
          from: issue.parent.key,
          to: issue.key,
          type: 'parent',
          label: 'parent of'
        });
      }
      
      // Epic link
      if (issue.epicKey && issueKeys.has(issue.epicKey)) {
        edges.push({
          id: `${issue.epicKey}-${issue.key}-epic`,
          from: issue.epicKey,
          to: issue.key,
          type: 'epic',
          label: 'epic'
        });
      }
      
      // Issue links (blocks, relates to, etc.)
      (issue.issueLinks || []).forEach(link => {
        if (issueKeys.has(link.linkedIssueKey)) {
          // Only add edge in one direction to avoid duplicates
          const edgeId = [issue.key, link.linkedIssueKey].sort().join('-') + '-' + link.type;
          if (!edges.find(e => e.id === edgeId)) {
            edges.push({
              id: edgeId,
              from: link.direction === 'outward' ? issue.key : link.linkedIssueKey,
              to: link.direction === 'outward' ? link.linkedIssueKey : issue.key,
              type: 'link',
              label: link.type
            });
          }
        }
      });
    });
    
    return edges;
  }, [filteredIssues]);

  // Canvas mouse handlers
  const handleCanvasMouseDown = useCallback((e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-grid')) {
      // Start panning
      if (e.button === 0) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - viewportOffset.x, y: e.clientY - viewportOffset.y });
        setSelectedCanvasNode(null);
      }
    }
  }, [viewportOffset]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (isPanning) {
      setViewportOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
    
    if (isDragging && selectedCanvasNode) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      
      setNodePositions(prev => ({
        ...prev,
        [selectedCanvasNode]: {
          x: Math.round((prev[selectedCanvasNode].x + dx) / GRID_SIZE) * GRID_SIZE,
          y: Math.round((prev[selectedCanvasNode].y + dy) / GRID_SIZE) * GRID_SIZE
        }
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, panStart, isDragging, selectedCanvasNode, dragStart, zoom]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
  }, []);

  const handleCanvasWheel = useCallback((e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.3), 2);
    
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

  const handleNodeMouseDown = useCallback((e, issueKey) => {
    e.stopPropagation();
    setSelectedCanvasNode(issueKey);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    // Also set as selected issue for detail panel
    const issue = filteredIssues.find(i => i.key === issueKey);
    if (issue) {
      setSelectedIssue(issue);
      localStorage.setItem('tasks-last-selected-issue', issue.key);
    }
  }, [filteredIssues]);

  // Canvas zoom controls
  const zoomIn = () => setZoom(z => Math.min(z * 1.2, 2));
  const zoomOut = () => setZoom(z => Math.max(z / 1.2, 0.3));
  const resetView = () => {
    setZoom(1);
    setViewportOffset({ x: 50, y: 50 });
  };

  // Get node center for edge rendering
  const getNodeCenter = useCallback((issueKey, side = 'center') => {
    const pos = nodePositions[issueKey];
    if (!pos) return { x: 0, y: 0 };
    
    const centerX = pos.x + CANVAS_NODE_WIDTH / 2;
    const centerY = pos.y + CANVAS_NODE_HEIGHT / 2;
    
    switch (side) {
      case 'top': return { x: centerX, y: pos.y };
      case 'bottom': return { x: centerX, y: pos.y + CANVAS_NODE_HEIGHT };
      case 'left': return { x: pos.x, y: centerY };
      case 'right': return { x: pos.x + CANVAS_NODE_WIDTH, y: centerY };
      default: return { x: centerX, y: centerY };
    }
  }, [nodePositions]);

  // Render curved edge path
  const renderEdgePath = useCallback((from, to) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    
    // Determine best connection sides based on relative positions
    let fromSide, toSide;
    if (Math.abs(dy) > Math.abs(dx)) {
      // More vertical - connect top/bottom
      fromSide = dy > 0 ? 'bottom' : 'top';
      toSide = dy > 0 ? 'top' : 'bottom';
    } else {
      // More horizontal - connect left/right
      fromSide = dx > 0 ? 'right' : 'left';
      toSide = dx > 0 ? 'left' : 'right';
    }
    
    const fromPoint = getNodeCenter(from.key, fromSide);
    const toPoint = getNodeCenter(to.key, toSide);
    
    const controlOffset = Math.max(Math.abs(toPoint.x - fromPoint.x), Math.abs(toPoint.y - fromPoint.y)) / 2;
    
    // Create curved path
    if (fromSide === 'bottom' || fromSide === 'top') {
      const yOffset = fromSide === 'bottom' ? controlOffset : -controlOffset;
      return `M ${fromPoint.x} ${fromPoint.y} C ${fromPoint.x} ${fromPoint.y + yOffset}, ${toPoint.x} ${toPoint.y - yOffset}, ${toPoint.x} ${toPoint.y}`;
    } else {
      const xOffset = fromSide === 'right' ? controlOffset : -controlOffset;
      return `M ${fromPoint.x} ${fromPoint.y} C ${fromPoint.x + xOffset} ${fromPoint.y}, ${toPoint.x - xOffset} ${toPoint.y}, ${toPoint.x} ${toPoint.y}`;
    }
  }, [getNodeCenter]);


  // Only show full-page loading spinner on initial load with no cached data
  if (initialLoading && issues.length === 0) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner />
          <EmptyStateBody>Loading tasks...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error && issues.length === 0) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <ExclamationCircleIcon size="xl" color="var(--pf-v6-global--danger-color--100)" />
          <Title headingLevel="h2" size="lg">
            Error Loading Tasks
          </Title>
          <EmptyStateBody>
            <div style={{ 
              textAlign: 'left', 
              maxWidth: '800px', 
              margin: '1rem auto',
              padding: '1rem',
              backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflowWrap: 'break-word'
            }}>
              {error}
            </div>
          </EmptyStateBody>
          <Alert variant="info" title="Setup Instructions" style={{ marginTop: '1rem', maxWidth: '700px' }}>
            <p><strong>Available task sources:</strong></p>
            <ul style={{ marginTop: '0.5rem' }}>
              <li><strong>Local tasks:</strong> Automatically available from <code>.apollo/tasks/</code> folder</li>
              <li><strong>Jira:</strong> Configure in <code>data/config.json</code> with URL, username, and token</li>
            </ul>
            <p style={{ marginTop: '1rem' }}><strong>Common Jira issues:</strong></p>
            <ul>
              <li>Authentication failed: Check your username and token</li>
              <li>401 Unauthorized: Token may be invalid or expired</li>
              <li>403 Forbidden: Account may not have API access</li>
            </ul>
          </Alert>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden' 
    }}>
      {/* Sticky Header */}
      <PageSection variant="light" style={{ flexShrink: 0 }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Title headingLevel="h1" size="2xl">
              Tasks
            </Title>
            <Content style={{ marginTop: '0.5rem' }}>
              {hasSpaceContext && spaceFilterActive
                ? `Showing tasks scoped to ${spaceName}`
                : 'Tasks and issues from your connected sources'}
            </Content>
          </FlexItem>
          <FlexItem>
            <Flex spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <ToggleGroup aria-label="View mode toggle">
                  <ToggleGroupItem
                    icon={<ListIcon />}
                    text="List"
                    aria-label="List view"
                    buttonId="toggle-list"
                    isSelected={viewMode === 'list'}
                    onChange={() => setViewMode('list')}
                  />
                  <ToggleGroupItem
                    icon={<TableIcon />}
                    text="Kanban"
                    aria-label="Kanban view"
                    buttonId="toggle-kanban"
                    isSelected={viewMode === 'kanban'}
                    onChange={() => setViewMode('kanban')}
                  />
                  <ToggleGroupItem
                    icon={<OutlinedClockIcon />}
                    text="Timeline"
                    aria-label="Timeline view"
                    buttonId="toggle-timeline"
                    isSelected={viewMode === 'timeline'}
                    onChange={() => setViewMode('timeline')}
                  />
                  <ToggleGroupItem
                    icon={<TopologyIcon />}
                    text="Canvas"
                    aria-label="Canvas view"
                    buttonId="toggle-canvas"
                    isSelected={viewMode === 'canvas'}
                    onChange={() => setViewMode('canvas')}
                  />
                </ToggleGroup>
              </FlexItem>
              <FlexItem>
                <Badge>
                  {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
                </Badge>
              </FlexItem>
              {cachedAt && (
                <FlexItem>
                  <span style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                    Updated {formatCacheAge(cachedAt)}
                  </span>
                </FlexItem>
              )}
              <FlexItem>
                <Tooltip content={refreshing ? 'Refreshing from Jira...' : 'Refresh from Jira'}>
                  <Button
                    variant="plain"
                    onClick={handleRefresh}
                    isDisabled={refreshing}
                    aria-label="Refresh tasks"
                    style={{ padding: '4px 8px' }}
                  >
                    {refreshing ? (
                      <Spinner size="sm" />
                    ) : (
                      <SyncAltIcon />
                    )}
                  </Button>
                </Tooltip>
              </FlexItem>
              <FlexItem>
                <Button
                  variant="primary"
                  icon={<PlusCircleIcon />}
                  onClick={handleOpenCreateModal}
                >
                  Create task
                </Button>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Space Context Banner */}
      {hasSpaceContext && (
        <div style={{
          flexShrink: 0,
          padding: '0.5rem 1.5rem',
          borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
          backgroundColor: spaceFilterActive
            ? 'var(--pf-v6-global--palette--blue-50, rgba(0, 102, 204, 0.08))'
            : 'var(--pf-v6-global--BackgroundColor--200)'
        }}>
          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
            <FlexItem>
              <FilterIcon style={{
                color: spaceFilterActive
                  ? 'var(--pf-v6-global--primary-color--100)'
                  : 'var(--pf-v6-global--Color--200)',
                fontSize: '0.85rem'
              }} />
            </FlexItem>
            <FlexItem>
              <span style={{
                fontSize: '0.85rem',
                color: spaceFilterActive
                  ? 'var(--pf-v6-global--primary-color--100)'
                  : 'var(--pf-v6-global--Color--200)',
                fontWeight: 500
              }}>
                {spaceFilterActive ? 'Scoped to' : 'Available context from'}
                {' '}
                <strong>{activeSpace?.emoji} {spaceName}</strong>
              </span>
            </FlexItem>
            <FlexItem>
              <LabelGroup>
                {spaceJiraProjectKeys.map(key => (
                  <Label
                    key={key}
                    isCompact
                    color={spaceFilterActive ? 'blue' : 'grey'}
                  >
                    {key}
                  </Label>
                ))}
              </LabelGroup>
            </FlexItem>
            <FlexItem align={{ default: 'alignRight' }}>
              <Button
                variant="link"
                isSmall
                onClick={() => setSpaceFilterActive(!spaceFilterActive)}
                style={{ fontSize: '0.8rem', padding: '2px 8px' }}
              >
                {spaceFilterActive ? 'Show all tasks' : 'Apply space filter'}
              </Button>
            </FlexItem>
          </Flex>
        </div>
      )}

      {/* Sticky Filters */}
      <div style={{ 
        flexShrink: 0,
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
        backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
      }}>
        {/* Search Box */}
        <div style={{ marginBottom: '0.75rem' }}>
          <SearchInput
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(event, value) => setSearchQuery(value)}
            onClear={() => setSearchQuery('')}
            aria-label="Search tasks"
          />
        </div>

        {/* Primary filter row */}
        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
          {/* Sources Filter */}
          <FlexItem>
            <Select
              role="menu"
              isOpen={isSourcesOpen}
              selected={selectedSources}
              onSelect={(event, value) => {
                handleSourceToggle(value);
              }}
              onOpenChange={(isOpen) => setIsSourcesOpen(isOpen)}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsSourcesOpen(!isSourcesOpen)}
                  isExpanded={isSourcesOpen}
                  style={{ width: '160px' }}
                >
                  <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                    {selectedSources.length === 1 && (
                      <FlexItem>{getSourceIcon(selectedSources[0])}</FlexItem>
                    )}
                    <FlexItem>{getSourcesToggleText()}</FlexItem>
                  </Flex>
                </MenuToggle>
              )}
            >
              <SelectList>
                {availableSources.map(source => (
                  <SelectOption
                    key={source.id}
                    value={source.id}
                    hasCheckbox
                    isSelected={selectedSources.includes(source.id)}
                  >
                    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <FlexItem>{getSourceIcon(source.id)}</FlexItem>
                      <FlexItem>{source.name}</FlexItem>
                    </Flex>
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FlexItem>
          <FlexItem>
            <Select
              isOpen={isStatusOpen}
              selected={filterStatus}
              onSelect={(event, value) => {
                setFilterStatus(value);
                setIsStatusOpen(false);
              }}
              onOpenChange={(isOpen) => setIsStatusOpen(isOpen)}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsStatusOpen(!isStatusOpen)}
                  isExpanded={isStatusOpen}
                  style={{ width: '160px' }}
                >
                  {statusOptions.find(opt => opt.value === filterStatus)?.label || 'All statuses'}
                </MenuToggle>
              )}
            >
              <SelectList>
                {statusOptions.map(option => (
                  <SelectOption key={option.value} value={option.value}>
                    {option.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FlexItem>
          <FlexItem>
            <Select
              isOpen={isPriorityOpen}
              selected={filterPriority}
              onSelect={(event, value) => {
                setFilterPriority(value);
                setIsPriorityOpen(false);
              }}
              onOpenChange={(isOpen) => setIsPriorityOpen(isOpen)}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                  isExpanded={isPriorityOpen}
                  style={{ width: '160px' }}
                >
                  {priorityOptions.find(opt => opt.value === filterPriority)?.label || 'All priorities'}
                </MenuToggle>
              )}
            >
              <SelectList>
                {priorityOptions.map(option => (
                  <SelectOption key={option.value} value={option.value}>
                    {option.label}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
          </FlexItem>

          {/* More filters toggle */}
          <FlexItem>
            <Button
              variant={showMoreFilters || activeSecondaryFilterCount > 0 ? 'secondary' : 'control'}
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              icon={<FilterIcon />}
              size="sm"
            >
              {showMoreFilters ? 'Fewer filters' : 'More filters'}
              {activeSecondaryFilterCount > 0 && (
                <Badge isRead style={{ marginLeft: '0.5rem' }}>{activeSecondaryFilterCount}</Badge>
              )}
            </Button>
          </FlexItem>

          {/* Sort aligned right */}
          <FlexItem align={{ default: 'alignRight' }}>
            <Select
              isOpen={isSortOpen}
              selected={sortBy}
              onSelect={(event, value) => {
                setSortBy(value);
                setIsSortOpen(false);
              }}
              onOpenChange={(isOpen) => setIsSortOpen(isOpen)}
              toggle={(toggleRef) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  isExpanded={isSortOpen}
                  style={{ width: '200px' }}
                >
                  {sortBy === 'starred-first' ? 'Starred first' :
                   sortBy === 'flagged-first' ? 'Flagged first' :
                   sortBy === 'created-desc' ? 'Newest created' :
                   sortBy === 'created-asc' ? 'Oldest created' :
                   sortBy === 'updated-desc' ? 'Recently updated' :
                   sortBy === 'updated-asc' ? 'Least recently updated' :
                   sortBy === 'priority' ? 'Priority' :
                   sortBy === 'key' ? 'Key' :
                   sortBy === 'due-asc' ? 'Due date' : 'Sort by'}
                </MenuToggle>
              )}
            >
              <SelectList>
                <SelectOption value="starred-first">Starred first</SelectOption>
                <SelectOption value="flagged-first">Flagged first</SelectOption>
                <SelectOption value="created-desc">Newest created</SelectOption>
                <SelectOption value="created-asc">Oldest created</SelectOption>
                <SelectOption value="updated-desc">Recently updated</SelectOption>
                <SelectOption value="updated-asc">Least recently updated</SelectOption>
                <SelectOption value="priority">Priority</SelectOption>
                <SelectOption value="key">Key</SelectOption>
                <SelectOption value="due-asc">Due date</SelectOption>
              </SelectList>
            </Select>
          </FlexItem>
        </Flex>

        {/* Secondary filter row (expandable) */}
        {showMoreFilters && (
          <Flex
            spaceItems={{ default: 'spaceItemsSm' }}
            alignItems={{ default: 'alignItemsCenter' }}
            style={{ marginTop: '0.75rem' }}
          >
            {/* Starred Filter */}
            <FlexItem>
              <Select
                isOpen={isStarredOpen}
                selected={filterStarred}
                onSelect={(event, value) => {
                  setFilterStarred(value);
                  setIsStarredOpen(false);
                }}
                onOpenChange={(isOpen) => setIsStarredOpen(isOpen)}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsStarredOpen(!isStarredOpen)}
                    isExpanded={isStarredOpen}
                    style={{ width: '160px' }}
                  >
                    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <FlexItem>
                        {filterStarred === 'starred' ? <StarIcon style={{ color: '#f0ab00' }} /> : <OutlinedStarIcon />}
                      </FlexItem>
                      <FlexItem>
                        {filterStarred === 'all' ? 'All stars' :
                         filterStarred === 'starred' ? 'Starred' : 'Not starred'}
                      </FlexItem>
                    </Flex>
                  </MenuToggle>
                )}
              >
                <SelectList>
                  <SelectOption value="all">All stars</SelectOption>
                  <SelectOption value="starred">
                    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <FlexItem><StarIcon style={{ color: '#f0ab00' }} /></FlexItem>
                      <FlexItem>Starred</FlexItem>
                    </Flex>
                  </SelectOption>
                  <SelectOption value="not-starred">Not starred</SelectOption>
                </SelectList>
              </Select>
            </FlexItem>
            {/* Flag Filter */}
            <FlexItem>
              <Select
                isOpen={isFlagOpen}
                selected={filterFlag}
                onSelect={(event, value) => {
                  setFilterFlag(value);
                  setIsFlagOpen(false);
                }}
                onOpenChange={(isOpen) => setIsFlagOpen(isOpen)}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsFlagOpen(!isFlagOpen)}
                    isExpanded={isFlagOpen}
                    style={{ width: '160px' }}
                  >
                    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <FlexItem>
                        {filterFlag !== 'all' && filterFlag !== 'flagged' && filterFlag !== 'not-flagged' ? (
                          <FlagIcon style={{ color: flagColors[filterFlag] }} />
                        ) : filterFlag === 'flagged' ? (
                          <FlagIcon />
                        ) : (
                          <OutlinedFlagIcon />
                        )}
                      </FlexItem>
                      <FlexItem>
                        {flagOptions.find(opt => opt.value === filterFlag)?.label || 'All flags'}
                      </FlexItem>
                    </Flex>
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {flagOptions.map(option => (
                    <SelectOption key={option.value} value={option.value}>
                      {option.color ? (
                        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem><FlagIcon style={{ color: option.color }} /></FlexItem>
                          <FlexItem>{option.label}</FlexItem>
                        </Flex>
                      ) : (
                        option.label
                      )}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </FlexItem>
            {/* Deadline Filter */}
            <FlexItem>
              <Select
                isOpen={isDeadlineOpen}
                selected={filterDeadline}
                onSelect={(event, value) => {
                  setFilterDeadline(value);
                  setIsDeadlineOpen(false);
                }}
                onOpenChange={(isOpen) => setIsDeadlineOpen(isOpen)}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsDeadlineOpen(!isDeadlineOpen)}
                    isExpanded={isDeadlineOpen}
                    style={{ width: '180px' }}
                  >
                    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <FlexItem>
                        {filterDeadline === 'overdue' ? (
                          <CalendarAltIcon style={{ color: '#c9190b' }} />
                        ) : filterDeadline === 'due-today' ? (
                          <CalendarAltIcon style={{ color: '#f0ab00' }} />
                        ) : filterDeadline === 'due-this-week' ? (
                          <CalendarAltIcon style={{ color: '#f4c145' }} />
                        ) : filterDeadline === 'has-deadline' ? (
                          <CalendarAltIcon />
                        ) : (
                          <OutlinedCalendarAltIcon />
                        )}
                      </FlexItem>
                      <FlexItem>
                        {deadlineOptions.find(opt => opt.value === filterDeadline)?.label || 'All deadlines'}
                      </FlexItem>
                    </Flex>
                  </MenuToggle>
                )}
              >
                <SelectList>
                  {deadlineOptions.map(option => (
                    <SelectOption key={option.value} value={option.value}>
                      {option.color ? (
                        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                          <FlexItem><CalendarAltIcon style={{ color: option.color }} /></FlexItem>
                          <FlexItem>{option.label}</FlexItem>
                        </Flex>
                      ) : (
                        option.label
                      )}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </FlexItem>
          </Flex>
        )}

        {/* Active filter labels */}
        {hasActiveFilters && (
          <Flex
            spaceItems={{ default: 'spaceItemsSm' }}
            alignItems={{ default: 'alignItemsCenter' }}
            style={{ marginTop: '0.75rem' }}
          >
            <FlexItem>
              <span style={{ fontSize: '0.8rem', color: 'var(--pf-v6-global--Color--200)' }}>
                Active filters:
              </span>
            </FlexItem>
            <FlexItem flex={{ default: 'flex_1' }}>
              <LabelGroup>
                {getActiveFilterLabels().map(filter => (
                  <Label key={filter.key} onClose={filter.onClose} isCompact variant="outline">
                    {filter.label}
                  </Label>
                ))}
              </LabelGroup>
            </FlexItem>
            <FlexItem>
              <Button variant="link" size="sm" onClick={clearAllFilters} style={{ fontSize: '0.8rem', padding: 0 }}>
                Clear all filters
              </Button>
            </FlexItem>
          </Flex>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
        minHeight: 0 
      }}>
        {viewMode === 'kanban' ? (
          <TasksKanbanView
            tasksByStatus={tasksByStatus}
            selectedIssue={selectedIssue}
            draggedTask={draggedTask}
            dragOverColumn={dragOverColumn}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onCardClick={handleKanbanCardClick}
            onToggleStar={handleToggleStar}
            summarizing={summarizing}
            summaryError={summaryError}
            generateSummary={generateSummary}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
            onSetFlag={handleSetFlag}
          />
        ) : viewMode === 'list' ? (
          <TasksListView
            hierarchicalTasks={hierarchicalTasks}
            filteredIssues={filteredIssues}
            allIssues={issues}
            selectedIssue={selectedIssue}
            onIssueClick={handleIssueClick}
            onToggleExpanded={toggleTaskExpanded}
            onToggleShowHidden={toggleShowHiddenChildren}
            onToggleStar={handleToggleStar}
            summarizing={summarizing}
            summaryError={summaryError}
            generateSummary={generateSummary}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
            onSetFlag={handleSetFlag}
          />
        ) : viewMode === 'timeline' ? (
          <TasksTimelineView
            filteredIssues={filteredIssues}
            allIssues={issues}
            selectedIssue={selectedIssue}
            onIssueClick={handleIssueClick}
            onToggleStar={handleToggleStar}
            summarizing={summarizing}
            summaryError={summaryError}
            generateSummary={generateSummary}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
            onSetFlag={handleSetFlag}
          />
        ) : (
          <TasksCanvasView
            filteredIssues={filteredIssues}
            selectedIssue={selectedIssue}
            selectedCanvasNode={selectedCanvasNode}
            nodePositions={nodePositions}
            edges={computeEdges()}
            viewportOffset={viewportOffset}
            zoom={zoom}
            isPanning={isPanning}
            isDragging={isDragging}
            canvasRef={canvasRef}
            onCanvasMouseDown={handleCanvasMouseDown}
            onCanvasMouseMove={handleCanvasMouseMove}
            onCanvasMouseUp={handleCanvasMouseUp}
            onCanvasWheel={handleCanvasWheel}
            onNodeMouseDown={handleNodeMouseDown}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetView={resetView}
            renderEdgePath={renderEdgePath}
            summarizing={summarizing}
            summaryError={summaryError}
            generateSummary={generateSummary}
            onEdit={handleOpenEditModal}
            onDelete={handleOpenDeleteModal}
            onToggleStar={handleToggleStar}
            onSetFlag={handleSetFlag}
          />
        )}
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        task={newTask}
        onChange={handleCreateTaskChange}
        onSave={handleCreateTask}
        isSaving={isCreating}
        error={createError}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        task={editTask}
        onChange={handleEditTaskChange}
        onSave={handleUpdateTask}
        isSaving={isUpdating}
        error={editError}
      />

      {/* Delete Confirmation Modal */}
      <DeleteTaskModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        task={taskToDelete}
        onDelete={handleDeleteTask}
        isDeleting={isDeleting}
        error={deleteError}
      />
    </div>
  );
};

// IssueDetailPanel has been moved to ./Tasks/components/IssueDetailPanel.js

export default Tasks;
