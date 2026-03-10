const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { loadFigmaConfig, figmaCacheDir } = require('../../../server/lib/config');

const router = express.Router();

// Cache file paths
const getCacheFilePath = (type) => path.join(figmaCacheDir, `${type}.json`);
const getMetadataPath = () => path.join(figmaCacheDir, 'metadata.json');

// Read/write cache helpers
function readCache(type) {
  const filePath = getCacheFilePath(type);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    console.error(`Error reading Figma cache for ${type}:`, error);
  }
  return null;
}

function writeCache(type, data) {
  const filePath = getCacheFilePath(type);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing Figma cache for ${type}:`, error);
  }
}

function readMetadata() {
  const filePath = getMetadataPath();
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error reading Figma cache metadata:', error);
  }
  return { lastSync: null, projectsCount: 0, filesCount: 0 };
}

function writeMetadata(data) {
  const filePath = getMetadataPath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing Figma cache metadata:', error);
  }
}

// Helper function to make Figma API requests
async function makeFigmaRequest(figmaConfig, endpoint) {
  const url = `https://api.figma.com/v1${endpoint}`;
  
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'X-Figma-Token': figmaConfig.token,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`Figma API error (${res.statusCode}): ${data}`));
          return;
        }
        
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse Figma response: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Transform projects to simpler format
function transformProjects(projects) {
  return projects.map(project => ({
    id: project.id,
    name: project.name
  }));
}

// Transform files to simpler format
function transformFiles(files, projectId, projectName) {
  return files.map(file => ({
    key: file.key,
    name: file.name,
    thumbnailUrl: file.thumbnail_url,
    lastModified: file.last_modified,
    projectId: projectId,
    projectName: projectName
  }));
}

// Transform version history
function transformVersions(versions, fileKey, fileName) {
  return versions.map(version => ({
    id: version.id,
    createdAt: version.created_at,
    label: version.label,
    description: version.description,
    user: version.user ? {
      id: version.user.id,
      handle: version.user.handle,
      imgUrl: version.user.img_url
    } : null,
    fileKey: fileKey,
    fileName: fileName,
    type: 'version'
  }));
}

// Transform comments
function transformComments(comments, fileKey, fileName) {
  return comments.map(comment => ({
    id: comment.id,
    message: comment.message,
    createdAt: comment.created_at,
    resolvedAt: comment.resolved_at,
    user: comment.user ? {
      id: comment.user.id,
      handle: comment.user.handle,
      imgUrl: comment.user.img_url
    } : null,
    fileKey: fileKey,
    fileName: fileName,
    type: 'comment',
    orderDate: comment.order_date || comment.created_at
  }));
}

// API endpoint for getting cache status
router.get('/cache/status', (req, res) => {
  const metadata = readMetadata();
  res.json({
    success: true,
    lastSync: metadata.lastSync,
    projectsCount: metadata.projectsCount || 0,
    filesCount: metadata.filesCount || 0,
    hasCache: !!metadata.lastSync
  });
});

// Test Figma connection
router.get('/test', async (req, res) => {
  const figmaConfig = loadFigmaConfig();
  
  if (!figmaConfig || !figmaConfig.token) {
    return res.json({ 
      success: false, 
      error: 'Figma is not configured. Please add your Personal Access Token in Settings.'
    });
  }

  try {
    const userData = await makeFigmaRequest(figmaConfig, '/me');
    
    res.json({ 
      success: true, 
      message: 'Successfully connected to Figma',
      user: {
        id: userData.id,
        handle: userData.handle,
        email: userData.email,
        imgUrl: userData.img_url
      }
    });
  } catch (error) {
    console.error('Error testing Figma connection:', error);
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

// Get current user info
router.get('/user', async (req, res) => {
  const figmaConfig = loadFigmaConfig();
  const forceRefresh = req.query.refresh === 'true';
  
  if (!figmaConfig || !figmaConfig.token) {
    return res.json({ 
      success: false, 
      error: 'Figma is not configured.'
    });
  }

  // Try cache first
  if (!forceRefresh) {
    const cached = readCache('user');
    if (cached) {
      return res.json({ success: true, user: cached, fromCache: true });
    }
  }

  try {
    const userData = await makeFigmaRequest(figmaConfig, '/me');
    const user = {
      id: userData.id,
      handle: userData.handle,
      email: userData.email,
      imgUrl: userData.img_url
    };
    writeCache('user', user);
    res.json({ success: true, user, fromCache: false });
  } catch (error) {
    console.error('Error fetching Figma user:', error);
    const cached = readCache('user');
    if (cached) {
      return res.json({ success: true, user: cached, fromCache: true, fetchError: error.message });
    }
    res.json({ success: false, error: error.message });
  }
});

// Get teams
router.get('/teams', async (req, res) => {
  const figmaConfig = loadFigmaConfig();
  const forceRefresh = req.query.refresh === 'true';
  
  if (!figmaConfig || !figmaConfig.token) {
    return res.json({ 
      success: false, 
      error: 'Figma is not configured.',
      teams: []
    });
  }

  // Try cache first
  if (!forceRefresh) {
    const cached = readCache('teams');
    if (cached) {
      return res.json({ success: true, teams: cached, fromCache: true });
    }
  }

  try {
    // Get user first to get team memberships
    const userData = await makeFigmaRequest(figmaConfig, '/me');
    
    // Figma API doesn't have a direct teams endpoint, we need to use team_id from projects
    // For now, we'll return what we can get from the user's teams
    const teams = userData.teams || [];
    
    writeCache('teams', teams);
    res.json({ success: true, teams, fromCache: false });
  } catch (error) {
    console.error('Error fetching Figma teams:', error);
    const cached = readCache('teams');
    if (cached) {
      return res.json({ success: true, teams: cached, fromCache: true, fetchError: error.message });
    }
    res.json({ success: false, error: error.message, teams: [] });
  }
});

// Get projects for a team
router.get('/teams/:teamId/projects', async (req, res) => {
  const figmaConfig = loadFigmaConfig();
  const { teamId } = req.params;
  const forceRefresh = req.query.refresh === 'true';
  
  if (!figmaConfig || !figmaConfig.token) {
    return res.json({ 
      success: false, 
      error: 'Figma is not configured.',
      projects: []
    });
  }

  const cacheKey = `projects_${teamId}`;

  // Try cache first
  if (!forceRefresh) {
    const cached = readCache(cacheKey);
    if (cached) {
      return res.json({ success: true, projects: cached, fromCache: true });
    }
  }

  try {
    const projectsData = await makeFigmaRequest(figmaConfig, `/teams/${teamId}/projects`);
    const projects = transformProjects(projectsData.projects || []);
    
    writeCache(cacheKey, projects);
    res.json({ success: true, projects, fromCache: false });
  } catch (error) {
    console.error('Error fetching Figma projects:', error);
    const cached = readCache(cacheKey);
    if (cached) {
      return res.json({ success: true, projects: cached, fromCache: true, fetchError: error.message });
    }
    res.json({ success: false, error: error.message, projects: [] });
  }
});

// Helper to get team IDs from config
function getTeamIds(figmaConfig) {
  if (!figmaConfig.teamIds) return [];
  return figmaConfig.teamIds.split(',').map(id => id.trim()).filter(id => id);
}

// Get all projects (from configured teams)
router.get('/projects', async (req, res) => {
  const figmaConfig = loadFigmaConfig();
  const forceRefresh = req.query.refresh === 'true';
  
  if (!figmaConfig || !figmaConfig.token) {
    return res.json({ 
      success: false, 
      error: 'Figma is not configured.',
      projects: []
    });
  }

  const teamIds = getTeamIds(figmaConfig);
  if (teamIds.length === 0) {
    return res.json({ 
      success: false, 
      error: 'No Team IDs configured. Please add your Figma Team ID(s) in Settings.',
      projects: []
    });
  }

  // Try cache first
  if (!forceRefresh) {
    const cached = readCache('all_projects');
    if (cached) {
      return res.json({ success: true, projects: cached, fromCache: true });
    }
  }

  try {
    // Fetch projects from each configured team
    let allProjects = [];
    for (const teamId of teamIds) {
      try {
        const projectsData = await makeFigmaRequest(figmaConfig, `/teams/${teamId}/projects`);
        const projects = (projectsData.projects || []).map(p => ({
          id: p.id,
          name: p.name,
          teamId: teamId,
          teamName: projectsData.name || `Team ${teamId}`
        }));
        allProjects = [...allProjects, ...projects];
      } catch (err) {
        console.error(`Error fetching projects for team ${teamId}:`, err.message);
      }
    }
    
    writeCache('all_projects', allProjects);
    res.json({ success: true, projects: allProjects, fromCache: false });
  } catch (error) {
    console.error('Error fetching Figma projects:', error);
    const cached = readCache('all_projects');
    if (cached) {
      return res.json({ success: true, projects: cached, fromCache: true, fetchError: error.message });
    }
    res.json({ success: false, error: error.message, projects: [] });
  }
});

// Get files for a project
router.get('/projects/:projectId/files', async (req, res) => {
  const figmaConfig = loadFigmaConfig();
  const { projectId } = req.params;
  const forceRefresh = req.query.refresh === 'true';
  
  if (!figmaConfig || !figmaConfig.token) {
    return res.json({ 
      success: false, 
      error: 'Figma is not configured.',
      files: []
    });
  }

  const cacheKey = `files_${projectId}`;

  // Try cache first
  if (!forceRefresh) {
    const cached = readCache(cacheKey);
    if (cached) {
      return res.json({ success: true, files: cached, fromCache: true });
    }
  }

  try {
    const filesData = await makeFigmaRequest(figmaConfig, `/projects/${projectId}/files`);
    const files = transformFiles(filesData.files || [], projectId, filesData.name);
    
    writeCache(cacheKey, files);
    res.json({ success: true, files, fromCache: false });
  } catch (error) {
    console.error('Error fetching Figma files:', error);
    const cached = readCache(cacheKey);
    if (cached) {
      return res.json({ success: true, files: cached, fromCache: true, fetchError: error.message });
    }
    res.json({ success: false, error: error.message, files: [] });
  }
});

// Get recent files across all projects
router.get('/files/recent', async (req, res) => {
  const figmaConfig = loadFigmaConfig();
  const forceRefresh = req.query.refresh === 'true';
  
  if (!figmaConfig || !figmaConfig.token) {
    return res.json({ 
      success: false, 
      error: 'Figma is not configured.',
      files: []
    });
  }

  const teamIds = getTeamIds(figmaConfig);
  if (teamIds.length === 0) {
    return res.json({ 
      success: false, 
      error: 'No Team IDs configured.',
      files: []
    });
  }

  // Try cache first
  if (!forceRefresh) {
    const cached = readCache('recent_files');
    if (cached) {
      return res.json({ success: true, files: cached, fromCache: true });
    }
  }

  try {
    let allFiles = [];
    
    for (const teamId of teamIds) {
      try {
        const projectsData = await makeFigmaRequest(figmaConfig, `/teams/${teamId}/projects`);
        const teamName = projectsData.name || `Team ${teamId}`;
        
        for (const project of (projectsData.projects || [])) {
          try {
            const filesData = await makeFigmaRequest(figmaConfig, `/projects/${project.id}/files`);
            const files = (filesData.files || []).map(file => ({
              key: file.key,
              name: file.name,
              thumbnailUrl: file.thumbnail_url,
              lastModified: file.last_modified,
              projectId: project.id,
              projectName: project.name,
              teamId: teamId,
              teamName: teamName
            }));
            allFiles = [...allFiles, ...files];
          } catch (err) {
            console.error(`Error fetching files for project ${project.id}:`, err.message);
          }
        }
      } catch (err) {
        console.error(`Error fetching projects for team ${teamId}:`, err.message);
      }
    }
    
    // Sort by last modified
    allFiles.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    
    writeCache('recent_files', allFiles);
    res.json({ success: true, files: allFiles, fromCache: false });
  } catch (error) {
    console.error('Error fetching recent Figma files:', error);
    const cached = readCache('recent_files');
    if (cached) {
      return res.json({ success: true, files: cached, fromCache: true, fetchError: error.message });
    }
    res.json({ success: false, error: error.message, files: [] });
  }
});

// Get version history for a file
router.get('/files/:fileKey/versions', async (req, res) => {
  const figmaConfig = loadFigmaConfig();
  const { fileKey } = req.params;
  
  if (!figmaConfig || !figmaConfig.token) {
    return res.json({ 
      success: false, 
      error: 'Figma is not configured.',
      versions: []
    });
  }

  try {
    const versionsData = await makeFigmaRequest(figmaConfig, `/files/${fileKey}/versions`);
    const versions = transformVersions(versionsData.versions || [], fileKey, '');
    
    res.json({ success: true, versions });
  } catch (error) {
    console.error('Error fetching file versions:', error);
    res.json({ success: false, error: error.message, versions: [] });
  }
});

// Get comments for a file
router.get('/files/:fileKey/comments', async (req, res) => {
  const figmaConfig = loadFigmaConfig();
  const { fileKey } = req.params;
  
  if (!figmaConfig || !figmaConfig.token) {
    return res.json({ 
      success: false, 
      error: 'Figma is not configured.',
      comments: []
    });
  }

  try {
    const commentsData = await makeFigmaRequest(figmaConfig, `/files/${fileKey}/comments`);
    const comments = transformComments(commentsData.comments || [], fileKey, '');
    
    res.json({ success: true, comments });
  } catch (error) {
    console.error('Error fetching file comments:', error);
    res.json({ success: false, error: error.message, comments: [] });
  }
});

// Get recent updates (versions + comments) across all files or for a specific project
router.get('/updates', async (req, res) => {
  const figmaConfig = loadFigmaConfig();
  const { projectId, type = 'all' } = req.query; // type: 'all', 'versions', 'comments'
  const forceRefresh = req.query.refresh === 'true';
  
  if (!figmaConfig || !figmaConfig.token) {
    return res.json({ 
      success: false, 
      error: 'Figma is not configured.',
      updates: []
    });
  }

  const cacheKey = projectId ? `updates_${projectId}_${type}` : `updates_all_${type}`;

  // Try cache first
  if (!forceRefresh) {
    const cached = readCache(cacheKey);
    if (cached) {
      return res.json({ success: true, updates: cached, fromCache: true });
    }
  }

  try {
    let files = [];
    
    if (projectId) {
      // Get files for specific project
      const filesData = await makeFigmaRequest(figmaConfig, `/projects/${projectId}/files`);
      files = (filesData.files || []).map(f => ({
        key: f.key,
        name: f.name,
        projectId: projectId
      }));
    } else {
      // Get recent files from cache or fetch
      const cachedFiles = readCache('recent_files');
      if (cachedFiles) {
        files = cachedFiles.slice(0, 20); // Limit to 20 most recent files
      } else {
        // Fetch files from configured teams
        const teamIds = getTeamIds(figmaConfig);
        
        for (const teamId of teamIds.slice(0, 3)) { // Limit teams to avoid rate limiting
          try {
            const projectsData = await makeFigmaRequest(figmaConfig, `/teams/${teamId}/projects`);
            const teamName = projectsData.name || `Team ${teamId}`;
            
            for (const project of (projectsData.projects || []).slice(0, 5)) { // Limit projects
              try {
                const filesData = await makeFigmaRequest(figmaConfig, `/projects/${project.id}/files`);
                const projectFiles = (filesData.files || []).slice(0, 5).map(f => ({
                  key: f.key,
                  name: f.name,
                  projectId: project.id,
                  projectName: project.name
                }));
                files = [...files, ...projectFiles];
              } catch (err) {
                console.error(`Error fetching files for project ${project.id}:`, err.message);
              }
            }
          } catch (err) {
            console.error(`Error fetching projects for team ${teamId}:`, err.message);
          }
        }
      }
    }

    let allUpdates = [];

    // Fetch updates for each file (limit to avoid rate limiting)
    for (const file of files.slice(0, 10)) {
      try {
        if (type === 'all' || type === 'versions') {
          const versionsData = await makeFigmaRequest(figmaConfig, `/files/${file.key}/versions`);
          const versions = transformVersions(
            (versionsData.versions || []).slice(0, 5), 
            file.key, 
            file.name
          );
          allUpdates = [...allUpdates, ...versions];
        }
        
        if (type === 'all' || type === 'comments') {
          const commentsData = await makeFigmaRequest(figmaConfig, `/files/${file.key}/comments`);
          const comments = transformComments(
            (commentsData.comments || []).slice(0, 10), 
            file.key, 
            file.name
          );
          allUpdates = [...allUpdates, ...comments];
        }
      } catch (err) {
        console.error(`Error fetching updates for file ${file.key}:`, err);
      }
    }

    // Sort by date
    allUpdates.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.orderDate);
      const dateB = new Date(b.createdAt || b.orderDate);
      return dateB - dateA;
    });

    writeCache(cacheKey, allUpdates);
    res.json({ success: true, updates: allUpdates, fromCache: false });
  } catch (error) {
    console.error('Error fetching Figma updates:', error);
    const cached = readCache(cacheKey);
    if (cached) {
      return res.json({ success: true, updates: cached, fromCache: true, fetchError: error.message });
    }
    res.json({ success: false, error: error.message, updates: [] });
  }
});

// Sync/refresh all Figma data
router.post('/sync', async (req, res) => {
  const figmaConfig = loadFigmaConfig();
  
  if (!figmaConfig || !figmaConfig.token) {
    return res.json({ 
      success: false, 
      error: 'Figma is not configured.'
    });
  }

  const teamIds = getTeamIds(figmaConfig);
  if (teamIds.length === 0) {
    return res.json({ 
      success: false, 
      error: 'No Team IDs configured. Please add your Figma Team ID(s) in Settings.'
    });
  }

  try {
    // Fetch user
    const userData = await makeFigmaRequest(figmaConfig, '/me');
    const user = {
      id: userData.id,
      handle: userData.handle,
      email: userData.email,
      imgUrl: userData.img_url
    };
    writeCache('user', user);

    // Fetch all projects and files from configured teams
    let allProjects = [];
    let allFiles = [];
    
    for (const teamId of teamIds) {
      try {
        const projectsData = await makeFigmaRequest(figmaConfig, `/teams/${teamId}/projects`);
        const teamName = projectsData.name || `Team ${teamId}`;
        
        for (const project of (projectsData.projects || [])) {
          allProjects.push({
            id: project.id,
            name: project.name,
            teamId: teamId,
            teamName: teamName
          });
          
          try {
            const filesData = await makeFigmaRequest(figmaConfig, `/projects/${project.id}/files`);
            const files = (filesData.files || []).map(file => ({
              key: file.key,
              name: file.name,
              thumbnailUrl: file.thumbnail_url,
              lastModified: file.last_modified,
              projectId: project.id,
              projectName: project.name,
              teamId: teamId,
              teamName: teamName
            }));
            allFiles = [...allFiles, ...files];
          } catch (err) {
            console.error(`Error fetching files for project ${project.id}:`, err.message);
          }
        }
      } catch (err) {
        console.error(`Error fetching projects for team ${teamId}:`, err.message);
      }
    }

    writeCache('all_projects', allProjects);
    
    // Sort files by last modified
    allFiles.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    writeCache('recent_files', allFiles);

    // Update metadata
    const metadata = {
      lastSync: new Date().toISOString(),
      projectsCount: allProjects.length,
      filesCount: allFiles.length
    };
    writeMetadata(metadata);

    res.json({ 
      success: true, 
      message: 'Successfully synced Figma data',
      ...metadata
    });
  } catch (error) {
    console.error('Error syncing Figma:', error);
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

module.exports = router;
