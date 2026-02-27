const express = require('express');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { dataDir, cacheDir, loadJiraConfig, loadAiConfig, loadGoogleTasksConfig } = require('../../../server/lib/config');
const { makeJiraRequest } = require('../../../server/lib/jira');
const { makeAiRequest } = require('../../../server/lib/ai');

const router = express.Router();

// Apollo tasks directory
const apolloTasksDir = path.join(__dirname, '..', '..', '..', '.apollo', 'tasks');

// Jira tasks cache file
const jiraCacheFile = path.join(cacheDir, 'jira-tasks.json');

// Google Tasks cache file
const googleTasksCacheFile = path.join(cacheDir, 'googletasks-tasks.json');

// Cache helper functions
function loadJiraCache() {
  try {
    if (fs.existsSync(jiraCacheFile)) {
      const data = JSON.parse(fs.readFileSync(jiraCacheFile, 'utf-8'));
      return data;
    }
  } catch (error) {
    console.error('Error loading Jira cache:', error);
  }
  return null;
}

function saveJiraCache(issues) {
  try {
    const cacheData = {
      issues,
      cachedAt: new Date().toISOString()
    };
    fs.writeFileSync(jiraCacheFile, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    console.error('Error saving Jira cache:', error);
  }
}

// Google Tasks cache functions
function loadGoogleTasksCache() {
  try {
    if (fs.existsSync(googleTasksCacheFile)) {
      const data = JSON.parse(fs.readFileSync(googleTasksCacheFile, 'utf-8'));
      return data;
    }
  } catch (error) {
    console.error('Error loading Google Tasks cache:', error);
  }
  return null;
}

function saveGoogleTasksCache(issues) {
  try {
    const cacheData = {
      issues,
      cachedAt: new Date().toISOString()
    };
    fs.writeFileSync(googleTasksCacheFile, JSON.stringify(cacheData, null, 2));
  } catch (error) {
    console.error('Error saving Google Tasks cache:', error);
  }
}

// Parse a local Apollo task file
function parseApolloTask(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content: markdownContent } = matter(content);
    
    // Skip files without an id field (e.g., plan documents, notes)
    if (!frontmatter.id) {
      return null;
    }
    
    // Map Apollo task format to common task format
    const priorityMap = {
      'critical': 'Critical',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    
    const statusMap = {
      'backlog': 'Backlog',
      'open': 'Open',
      'in-progress': 'In Progress',
      'blocked': 'Blocked',
      'review': 'In Review',
      'done': 'Done',
      'cancelled': 'Cancelled',
      'duplicate': 'Duplicate'
    };
    
    const typeMap = {
      'task': 'Task',
      'bug': 'Bug',
      'feature': 'Story',
      'epic': 'Epic',
      'story': 'Story',
      'chore': 'Task',
      'spike': 'Spike',
      'doc': 'Task'
    };

    // Use the full markdown content as description (excluding the h1 title which duplicates the summary)
    const lines = markdownContent.split('\n');
    const contentLines = [];
    let skippedFirstHeader = false;
    
    for (const line of lines) {
      // Skip the first h1 header since it duplicates the title from frontmatter
      if (!skippedFirstHeader && line.startsWith('# ')) {
        skippedFirstHeader = true;
        continue;
      }
      contentLines.push(line);
    }
    
    const description = contentLines.join('\n').trim();

    return {
      key: frontmatter.id,
      summary: frontmatter.title,
      description: description,
      status: statusMap[frontmatter.status] || frontmatter.status || 'Backlog',
      priority: priorityMap[frontmatter.priority] || frontmatter.priority || 'Medium',
      issueType: typeMap[frontmatter.type] || frontmatter.type || 'Task',
      assignee: (frontmatter.assignees || []).join(', ') || '',
      reporter: frontmatter.reporter || '',
      created: frontmatter.created,
      updated: frontmatter.updated || frontmatter.created,
      project: 'Apollo',
      components: frontmatter.component ? [frontmatter.component] : [],
      labels: frontmatter.labels || [],
      url: null, // Local tasks don't have external URLs
      source: 'local',
      sourceName: 'Local',
      // Relationship data for canvas view
      issueLinks: [],
      parent: frontmatter.parent ? { key: frontmatter.parent, summary: '', issueType: '' } : null,
      children: frontmatter.children || [],
      subtasks: [],
      epicKey: null,
      // Additional local task fields
      filePath: filePath,
      blocks: frontmatter.blocks || [],
      blockedBy: frontmatter.blocked_by || [],
      related: frontmatter.related || [],
      external: frontmatter.external || {},
      estimate: frontmatter.estimate || null,
      sprint: frontmatter.sprint || null,
      due: frontmatter.due || null,
      // Star and flag fields
      starred: frontmatter.starred === true,
      flag: frontmatter.flag || null
    };
    
    console.log('parseApolloTask:', frontmatter.id, 'starred from frontmatter:', frontmatter.starred, 'type:', typeof frontmatter.starred);
  } catch (error) {
    console.error(`Error parsing Apollo task ${filePath}:`, error);
    return null;
  }
}

// Get all local Apollo tasks
// Tasks are folders with task.md inside: {status}/{task-id}/task.md
function getLocalTasks() {
  const tasks = [];
  const directories = ['backlog', 'open', 'in-progress', 'done', 'archive'];
  
  for (const dir of directories) {
    const dirPath = path.join(apolloTasksDir, dir);
    if (!fs.existsSync(dirPath)) continue;
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      
      if (entry.isDirectory()) {
        // Look for task.md inside the folder
        const taskMdPath = path.join(dirPath, entry.name, 'task.md');
        if (fs.existsSync(taskMdPath)) {
          const task = parseApolloTask(taskMdPath);
          if (task) {
            // Store the folder path for associated files
            task.folderPath = path.join(dirPath, entry.name);
            tasks.push(task);
          }
        }
      }
    }
  }
  
  // Sort by updated/created date descending
  tasks.sort((a, b) => {
    const dateA = new Date(a.updated || a.created || 0);
    const dateB = new Date(b.updated || b.created || 0);
    return dateB - dateA;
  });
  
  return tasks;
}

// API endpoint for getting available task sources
router.get('/sources', (req, res) => {
  try {
    const jiraConfig = loadJiraConfig();
    const sources = [];
    
    // Always include local tasks source
    sources.push({
      id: 'local',
      name: 'Local',
      icon: 'folder',
      enabled: true,
      description: 'Tasks from .apollo/tasks folder'
    });
    
    // Check if Jira is configured
    if (jiraConfig && jiraConfig.url && jiraConfig.token && jiraConfig.username) {
      sources.push({
        id: 'jira',
        name: 'Jira',
        icon: 'jira',
        enabled: true,
        description: `Tasks from ${jiraConfig.url}`
      });
    }
    
    // Check if Google Tasks is configured
    const googleTasksConfig = loadGoogleTasksConfig();
    if (googleTasksConfig && googleTasksConfig.clientId && googleTasksConfig.clientSecret && googleTasksConfig.refreshToken) {
      sources.push({
        id: 'googletasks',
        name: 'Google Tasks',
        icon: 'googletasks',
        enabled: true,
        description: 'Tasks from Google Tasks'
      });
    }
    
    // Future: Add more sources here (GitHub, GitLab, Linear, etc.)
    
    res.json({ success: true, sources });
  } catch (error) {
    console.error('Error getting task sources:', error);
    res.status(500).json({ success: false, error: error.message, sources: [] });
  }
});

// Helper function to fetch fresh Jira issues
async function fetchJiraIssues(jiraConfig) {
  const jql = 'assignee = currentUser() AND status NOT IN (Done, Closed) ORDER BY updated DESC';
  const endpoint = `/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,status,priority,assignee,reporter,created,updated,description,issuetype,project,components,labels,issuelinks,parent,subtasks,customfield_10014,customfield_10015,customfield_10016`;
  
  let data;
  try {
    data = await makeJiraRequest(jiraConfig, endpoint, false);
  } catch (basicAuthError) {
    if (basicAuthError.message.includes('401')) {
      data = await makeJiraRequest(jiraConfig, endpoint, true);
    } else {
      throw basicAuthError;
    }
  }
  
  const jiraIssues = (data.issues || []).map(issue => {
    // Extract issue links (related issues, blocks, duplicates, etc.)
    const issueLinks = (issue.fields.issuelinks || []).map(link => {
      const linkedIssue = link.inwardIssue || link.outwardIssue;
      return {
        type: link.type?.name || 'Related',
        direction: link.inwardIssue ? 'inward' : 'outward',
        inwardDesc: link.type?.inward || '',
        outwardDesc: link.type?.outward || '',
        linkedIssueKey: linkedIssue?.key || '',
        linkedIssueSummary: linkedIssue?.fields?.summary || '',
        linkedIssueStatus: linkedIssue?.fields?.status?.name || ''
      };
    }).filter(link => link.linkedIssueKey);

    // Extract parent (for subtasks or stories under epics)
    const parent = issue.fields.parent ? {
      key: issue.fields.parent.key,
      summary: issue.fields.parent.fields?.summary || '',
      issueType: issue.fields.parent.fields?.issuetype?.name || ''
    } : null;

    // Extract subtasks
    const subtasks = (issue.fields.subtasks || []).map(sub => ({
      key: sub.key,
      summary: sub.fields?.summary || '',
      status: sub.fields?.status?.name || ''
    }));

    // Epic link (try common custom field IDs; Jira Cloud often 10014, Server/DC can vary)
    const epicKeyFromField = issue.fields.customfield_10014 || issue.fields.customfield_10015 || issue.fields.customfield_10016 || null;
    const parentIsEpic = parent && /epic/i.test(parent.issueType || '');
    const epicKey = epicKeyFromField || (parentIsEpic ? parent.key : null) || null;

    return {
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description || '',
      status: issue.fields.status?.name || '',
      priority: issue.fields.priority?.name || '',
      issueType: issue.fields.issuetype?.name || '',
      assignee: issue.fields.assignee?.displayName || '',
      reporter: issue.fields.reporter?.displayName || '',
      created: issue.fields.created,
      updated: issue.fields.updated,
      project: issue.fields.project?.name || '',
      components: (issue.fields.components || []).map(c => c.name),
      labels: issue.fields.labels || [],
      url: `${jiraConfig.url}/browse/${issue.key}`,
      source: 'jira',
      sourceName: 'Jira',
      // Relationship data for canvas view
      issueLinks,
      parent,
      subtasks,
      epicKey
    };
  });
  
  return jiraIssues;
}

// Helper function to fetch Google Tasks and convert to common format
async function fetchGoogleTasks() {
  // Call our internal Google Tasks API endpoint
  const port = process.env.PORT || (process.env.NODE_ENV === 'development' ? 1226 : 1225);
  const response = await fetch(`http://localhost:${port}/api/google/tasks/tasks?showCompleted=false`);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch Google Tasks: ${error}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch Google Tasks');
  }
  
  // Map Google Tasks format to common task format
  const statusMap = {
    'needsAction': 'To Do',
    'completed': 'Done'
  };
  
  const googleTasks = (data.tasks || []).map(task => ({
    key: task.id,
    summary: task.title || 'Untitled Task',
    description: task.notes || '',
    status: statusMap[task.status] || task.status || 'To Do',
    priority: 'Medium', // Google Tasks doesn't have priority
    issueType: 'Task',
    assignee: '', // Google Tasks doesn't expose assignee in the API
    reporter: '',
    created: task.updated, // Google Tasks doesn't expose created date
    updated: task.updated,
    project: task.listTitle || 'Google Tasks',
    components: [],
    labels: [],
    url: null, // Google Tasks web URL would be: https://tasks.google.com
    source: 'googletasks',
    sourceName: 'Google Tasks',
    // Relationship data (not applicable for Google Tasks)
    issueLinks: [],
    parent: task.parent ? { key: task.parent, summary: '', issueType: '' } : null,
    subtasks: [],
    epicKey: null,
    // Google Tasks specific fields
    due: task.due,
    listId: task.listId,
    listTitle: task.listTitle
  }));
  
  return googleTasks;
}

// API endpoint for getting tasks/issues (with AI summaries)
// Supports stale-while-revalidate pattern:
// - Default: returns cached data immediately (fast)
// - ?refresh=true: fetches fresh data from Jira and updates cache
router.get('/', async (req, res) => {
  const tasksFile = path.join(dataDir, 'tasks', 'tasks.json');
  
  // Parse sources from query parameter (comma-separated list)
  const requestedSources = req.query.sources 
    ? req.query.sources.split(',').map(s => s.trim().toLowerCase())
    : null; // null means all sources
  
  // Check if client wants a fresh refresh
  const forceRefresh = req.query.refresh === 'true';
  
  try {
    let allIssues = [];
    let fromCache = false;
    let cachedAt = null;
    
    // Get Jira issues if requested (or no filter specified)
    if (!requestedSources || requestedSources.includes('jira')) {
      const jiraConfig = loadJiraConfig();
      
      if (jiraConfig && jiraConfig.url && jiraConfig.token && jiraConfig.username) {
        // Check cache first (unless forcing refresh)
        const jiraCache = loadJiraCache();
        
        if (!forceRefresh && jiraCache && jiraCache.issues) {
          // Use cached data for fast initial load
          allIssues = allIssues.concat(jiraCache.issues);
          fromCache = true;
          cachedAt = jiraCache.cachedAt;
        } else {
          // Fetch fresh data from Jira
          try {
            const jiraIssues = await fetchJiraIssues(jiraConfig);
            allIssues = allIssues.concat(jiraIssues);
            
            // Update cache with fresh data
            saveJiraCache(jiraIssues);
          } catch (error) {
            console.error('Error fetching Jira issues for tasks:', error);
            
            // If refresh failed but we have cache, return cached data with error note
            if (jiraCache && jiraCache.issues) {
              allIssues = allIssues.concat(jiraCache.issues);
              fromCache = true;
              cachedAt = jiraCache.cachedAt;
            }
          }
        }
      }
    }
    
    // Get local Apollo tasks if requested (or no filter specified)
    // Local tasks are always fresh (read from disk)
    if (!requestedSources || requestedSources.includes('local')) {
      try {
        const localTasks = getLocalTasks();
        allIssues = allIssues.concat(localTasks);
      } catch (error) {
        console.error('Error fetching local Apollo tasks:', error);
      }
    }
    
    // Get Google Tasks if requested (or no filter specified)
    if (!requestedSources || requestedSources.includes('googletasks')) {
      const googleTasksConfig = loadGoogleTasksConfig();
      
      if (googleTasksConfig && googleTasksConfig.clientId && googleTasksConfig.clientSecret && googleTasksConfig.refreshToken) {
        // Check cache first (unless forcing refresh)
        const googleTasksCache = loadGoogleTasksCache();
        
        if (!forceRefresh && googleTasksCache && googleTasksCache.issues) {
          // Use cached data for fast initial load
          allIssues = allIssues.concat(googleTasksCache.issues);
          // Mark as from cache if Jira wasn't already from cache
          if (!fromCache) {
            fromCache = true;
            cachedAt = googleTasksCache.cachedAt;
          }
        } else {
          // Fetch fresh data from Google Tasks
          try {
            const googleTasks = await fetchGoogleTasks();
            allIssues = allIssues.concat(googleTasks);
            
            // Update cache with fresh data
            saveGoogleTasksCache(googleTasks);
          } catch (error) {
            console.error('Error fetching Google Tasks:', error);
            
            // If refresh failed but we have cache, return cached data with error note
            if (googleTasksCache && googleTasksCache.issues) {
              allIssues = allIssues.concat(googleTasksCache.issues);
              if (!fromCache) {
                fromCache = true;
                cachedAt = googleTasksCache.cachedAt;
              }
            }
          }
        }
      }
    }

    // Load cached AI summaries from tasks.json
    let cachedSummaries = {};
    if (fs.existsSync(tasksFile)) {
      const tasksData = JSON.parse(fs.readFileSync(tasksFile, 'utf-8'));
      cachedSummaries = (tasksData.issues || []).reduce((acc, issue) => {
        if (issue.aiSummary) {
          acc[issue.key] = issue.aiSummary;
        }
        return acc;
      }, {});
    }

    // Merge AI summaries with all issues
    const issuesWithSummaries = allIssues.map(issue => ({
      ...issue,
      aiSummary: cachedSummaries[issue.key] || null
    }));

    res.json({ 
      success: true, 
      issues: issuesWithSummaries,
      fromCache,
      cachedAt
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      issues: []
    });
  }
});

// Generate a random 12-character alphanumeric ID
function generateTaskId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Get the directory path for a given status
function getStatusDirectory(status) {
  const statusDirMap = {
    'backlog': 'backlog',
    'open': 'open',
    'in-progress': 'in-progress',
    'blocked': 'in-progress',
    'review': 'in-progress',
    'done': 'done',
    'cancelled': 'archive'
  };
  return statusDirMap[status] || 'backlog';
}

// API endpoint for creating a new local task
// Creates folder-based tasks: {status}/{task-id}/task.md
router.post('/', (req, res) => {
  try {
    const { title, description, type, status, priority, assignees, labels, due, component, estimate, starred, flag } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    
    // Generate a unique ID
    const id = generateTaskId();
    const created = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Determine which directory to place the task in
    const statusDir = getStatusDirectory(status || 'backlog');
    const statusDirPath = path.join(apolloTasksDir, statusDir);
    
    // Create task folder: {status}/{task-id}/
    const taskFolderPath = path.join(statusDirPath, id);
    if (!fs.existsSync(taskFolderPath)) {
      fs.mkdirSync(taskFolderPath, { recursive: true });
    }
    
    // Build the task frontmatter
    const frontmatter = {
      id,
      title: title.trim(),
      type: type || 'task',
      status: status || 'backlog',
      priority: priority || 'medium',
      created,
      due: due || null,
      assignees: assignees || [],
      labels: labels || [],
      starred: starred || false,
      flag: flag || null,
      parent: null,
      blocks: [],
      blocked_by: [],
      related: [],
      external: {},
      estimate: estimate || null,
      component: component || null
    };
    
    // Build the markdown content
    const markdownContent = `
# ${title.trim()}

## Description

${description || 'No description provided.'}

## Acceptance Criteria

- [ ] To be defined

## Technical Notes



## References



## History

- ${created}: Created
`;
    
    // Use gray-matter to create the file content
    const fileContent = matter.stringify(markdownContent.trim(), frontmatter);
    
    // Write task.md inside the task folder
    const taskMdPath = path.join(taskFolderPath, 'task.md');
    fs.writeFileSync(taskMdPath, fileContent);
    
    // Create meta.json with structured metadata for fast parsing
    const metaJson = {
      id,
      title: title.trim(),
      type: type || 'task',
      status: status || 'backlog',
      priority: priority || 'medium',
      created,
      due: due || null,
      assignees: assignees || [],
      labels: labels || [],
      component: component || null,
      starred: starred || false,
      flag: flag || null
    };
    const metaJsonPath = path.join(taskFolderPath, 'meta.json');
    fs.writeFileSync(metaJsonPath, JSON.stringify(metaJson, null, 2));
    
    // Parse and return the created task
    const createdTask = parseApolloTask(taskMdPath);
    createdTask.folderPath = taskFolderPath;
    
    res.json({ success: true, task: createdTask });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to find a task by ID across all directories
// Tasks are folders with task.md inside: {status}/{task-id}/task.md
function findTaskById(taskKey) {
  const directories = ['backlog', 'open', 'in-progress', 'done', 'archive'];
  
  for (const dir of directories) {
    const dirPath = path.join(apolloTasksDir, dir);
    if (!fs.existsSync(dirPath)) continue;
    
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || !entry.isDirectory()) continue;
      
      // Check for task folder matching the ID directly
      if (entry.name === taskKey) {
        const taskMdPath = path.join(dirPath, entry.name, 'task.md');
        if (fs.existsSync(taskMdPath)) {
          return { filePath: taskMdPath, dir, folderPath: path.join(dirPath, entry.name) };
        }
      }
      
      // Also check inside folders by parsing the task file (in case folder name differs from id)
      const taskMdPath = path.join(dirPath, entry.name, 'task.md');
      if (fs.existsSync(taskMdPath)) {
        const content = fs.readFileSync(taskMdPath, 'utf-8');
        const { data: frontmatter } = matter(content);
        if (frontmatter.id === taskKey) {
          return { filePath: taskMdPath, dir, folderPath: path.join(dirPath, entry.name) };
        }
      }
    }
  }
  
  return null;
}

// API endpoint for updating a local task
// Tasks are folders with task.md inside: {status}/{task-id}/task.md
router.put('/:key', (req, res) => {
  try {
    const taskKey = req.params.key;
    const { title, description, type, status, priority, labels, due, component, starred, flag } = req.body;
    
    console.log('PUT /api/tasks/:key - Request body:', { taskKey, title, starred, flag });
    
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    
    // Find the task
    const taskInfo = findTaskById(taskKey);
    if (!taskInfo) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    const { filePath: existingFilePath, dir: existingDir, folderPath: existingFolderPath } = taskInfo;
    
    // Read the existing file
    const existingContent = fs.readFileSync(existingFilePath, 'utf-8');
    const { data: existingFrontmatter, content: existingMarkdown } = matter(existingContent);
    
    // Determine if we need to move the task to a different directory
    const newStatusDir = getStatusDirectory(status || existingFrontmatter.status || 'backlog');
    const shouldMove = newStatusDir !== existingDir;
    
    // Update frontmatter
    const updatedFrontmatter = {
      ...existingFrontmatter,
      title: title.trim(),
      type: type || existingFrontmatter.type,
      status: status || existingFrontmatter.status,
      priority: priority || existingFrontmatter.priority,
      labels: labels || existingFrontmatter.labels || [],
      due: due || existingFrontmatter.due || null,
      component: component || existingFrontmatter.component || null,
      starred: starred !== undefined ? starred : (existingFrontmatter.starred || false),
      flag: flag !== undefined ? flag : (existingFrontmatter.flag || null),
      updated: new Date().toISOString().split('T')[0]
    };
    
    console.log('Updated frontmatter starred:', updatedFrontmatter.starred, '(received:', starred, ', existing:', existingFrontmatter.starred, ')');
    
    // Update the description section in markdown if provided
    let updatedMarkdown = existingMarkdown;
    if (description !== undefined) {
      // Update the Description section
      const lines = existingMarkdown.split('\n');
      const newLines = [];
      let inDescription = false;
      let foundDescription = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith('## Description')) {
          foundDescription = true;
          inDescription = true;
          newLines.push(line);
          newLines.push('');
          newLines.push(description || 'No description provided.');
          continue;
        }
        
        if (inDescription) {
          if (line.startsWith('## ')) {
            inDescription = false;
            newLines.push('');
            newLines.push(line);
          }
          // Skip old description content
          continue;
        }
        
        newLines.push(line);
      }
      
      // If there was no description section, add one
      if (!foundDescription) {
        updatedMarkdown = `\n# ${title.trim()}\n\n## Description\n\n${description || 'No description provided.'}\n${existingMarkdown}`;
      } else {
        updatedMarkdown = newLines.join('\n');
      }
      
      // Update the title in markdown if it changed
      updatedMarkdown = updatedMarkdown.replace(/^# .+$/m, `# ${title.trim()}`);
    }
    
    // Generate new file content
    const newFileContent = matter.stringify(updatedMarkdown.trim(), updatedFrontmatter);
    
    if (shouldMove) {
      const newStatusDirPath = path.join(apolloTasksDir, newStatusDir);
      if (!fs.existsSync(newStatusDirPath)) {
        fs.mkdirSync(newStatusDirPath, { recursive: true });
      }
      
      // Move the entire folder to the new status directory
      const newFolderPath = path.join(newStatusDirPath, taskKey);
      fs.renameSync(existingFolderPath, newFolderPath);
      
      // Update the task.md file in the new location
      const newTaskMdPath = path.join(newFolderPath, 'task.md');
      fs.writeFileSync(newTaskMdPath, newFileContent);
      
      // Update meta.json if it exists
      const metaJsonPath = path.join(newFolderPath, 'meta.json');
      if (fs.existsSync(metaJsonPath)) {
        const metaJson = JSON.parse(fs.readFileSync(metaJsonPath, 'utf-8'));
        metaJson.status = updatedFrontmatter.status;
        metaJson.title = updatedFrontmatter.title;
        metaJson.priority = updatedFrontmatter.priority;
        metaJson.labels = updatedFrontmatter.labels;
        metaJson.due = updatedFrontmatter.due;
        metaJson.component = updatedFrontmatter.component;
        metaJson.starred = updatedFrontmatter.starred;
        metaJson.flag = updatedFrontmatter.flag;
        fs.writeFileSync(metaJsonPath, JSON.stringify(metaJson, null, 2));
      }
      
      const updatedTask = parseApolloTask(newTaskMdPath);
      updatedTask.folderPath = newFolderPath;
      res.json({ success: true, task: updatedTask });
    } else {
      // Update in place
      fs.writeFileSync(existingFilePath, newFileContent);
      
      // Update meta.json if it exists
      const metaJsonPath = path.join(existingFolderPath, 'meta.json');
      if (fs.existsSync(metaJsonPath)) {
        const metaJson = JSON.parse(fs.readFileSync(metaJsonPath, 'utf-8'));
        metaJson.title = updatedFrontmatter.title;
        metaJson.priority = updatedFrontmatter.priority;
        metaJson.labels = updatedFrontmatter.labels;
        metaJson.due = updatedFrontmatter.due;
        metaJson.component = updatedFrontmatter.component;
        metaJson.starred = updatedFrontmatter.starred;
        metaJson.flag = updatedFrontmatter.flag;
        fs.writeFileSync(metaJsonPath, JSON.stringify(metaJson, null, 2));
      }
      
      const updatedTask = parseApolloTask(existingFilePath);
      updatedTask.folderPath = existingFolderPath;
      res.json({ success: true, task: updatedTask });
    }
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint for deleting a local task
// Tasks are folders with task.md inside: {status}/{task-id}/task.md
router.delete('/:key', (req, res) => {
  try {
    const taskKey = req.params.key;
    
    // Find the task
    const taskInfo = findTaskById(taskKey);
    if (!taskInfo) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    
    const { folderPath } = taskInfo;
    
    // Delete the entire task folder
    fs.rmSync(folderPath, { recursive: true, force: true });
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint for AI summarization of task/issue
router.post('/:key/summarize', async (req, res) => {
  const aiConfig = loadAiConfig();
  
  if (!aiConfig || !aiConfig.apiUrl || !aiConfig.model) {
    return res.status(400).json({ 
      success: false, 
      error: 'AI is not configured. Please edit data/config.json with your AI API settings.'
    });
  }

  const tasksFile = path.join(dataDir, 'tasks', 'tasks.json');
  const issueKey = req.params.key;
  const { summary: issueSummary, description, priority, status, issueType } = req.body;
  
  try {
    // Create a prompt for the AI
    const prompt = `Briefly summarize this Jira issue in under 100 words. Focus on the problem, impact, and what needs to be done:\n\nIssue: ${issueKey}\nType: ${issueType}\nPriority: ${priority}\nStatus: ${status}\nSummary: ${issueSummary}\nDescription: ${description || 'No description provided'}`;
    
    // Get AI summary
    const aiSummary = await makeAiRequest(aiConfig, prompt);
    
    // Load or create tasks.json
    let tasksData = { issues: [] };
    if (fs.existsSync(tasksFile)) {
      tasksData = JSON.parse(fs.readFileSync(tasksFile, 'utf-8'));
    }

    // Update or add the issue with AI summary
    const issueIndex = tasksData.issues.findIndex(issue => issue.key === issueKey);
    if (issueIndex !== -1) {
      tasksData.issues[issueIndex].aiSummary = aiSummary;
    } else {
      tasksData.issues.push({ key: issueKey, aiSummary });
    }
    
    fs.writeFileSync(tasksFile, JSON.stringify(tasksData, null, 2));
    
    res.json({ success: true, summary: aiSummary });
  } catch (error) {
    console.error('Error generating AI summary for task:', error);
    res.status(500).json({ 
      success: false, 
      error: `Failed to generate summary: ${error.message}`
    });
  }
});

module.exports = router;


