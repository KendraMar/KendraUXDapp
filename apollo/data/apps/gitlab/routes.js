const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { loadGitLabConfig, gitlabCacheDir } = require('../../../server/lib/config');

const router = express.Router();

// Cache file paths
const getCacheFilePath = (type) => path.join(gitlabCacheDir, `${type}.json`);
const getMetadataPath = () => path.join(gitlabCacheDir, 'metadata.json');

// Read/write cache helpers
function readCache(type) {
  const filePath = getCacheFilePath(type);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    console.error(`Error reading GitLab cache for ${type}:`, error);
  }
  return null;
}

function writeCache(type, data) {
  const filePath = getCacheFilePath(type);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing GitLab cache for ${type}:`, error);
  }
}

function readMetadata() {
  const filePath = getMetadataPath();
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error reading GitLab cache metadata:', error);
  }
  return { lastSync: null, projectsCount: 0, mergeRequestsCount: 0 };
}

function writeMetadata(data) {
  const filePath = getMetadataPath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing GitLab cache metadata:', error);
  }
}

// Helper function to make GitLab API requests
async function makeGitLabRequest(gitlabConfig, endpoint) {
  const url = `${gitlabConfig.url}/api/v4${endpoint}`;
  
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'PRIVATE-TOKEN': gitlabConfig.token,
        'Content-Type': 'application/json'
      },
      rejectUnauthorized: false // Accept self-signed certs
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`GitLab API error (${res.statusCode}): ${data}`));
          return;
        }
        
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse GitLab response: ${data}`));
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
    name: project.name,
    nameWithNamespace: project.name_with_namespace,
    path: project.path,
    pathWithNamespace: project.path_with_namespace,
    description: project.description,
    webUrl: project.web_url,
    defaultBranch: project.default_branch,
    visibility: project.visibility,
    lastActivityAt: project.last_activity_at,
    avatarUrl: project.avatar_url,
    namespace: {
      id: project.namespace?.id,
      name: project.namespace?.name,
      path: project.namespace?.path
    },
    openMergeRequestsCount: project.open_merge_requests_count || 0
  }));
}

// Transform MRs to simpler format
function transformMergeRequests(mergeRequests) {
  return mergeRequests.map(mr => ({
    id: mr.id,
    iid: mr.iid,
    title: mr.title,
    description: mr.description,
    state: mr.state,
    webUrl: mr.web_url,
    sourceBranch: mr.source_branch,
    targetBranch: mr.target_branch,
    createdAt: mr.created_at,
    updatedAt: mr.updated_at,
    mergeStatus: mr.merge_status,
    draft: mr.draft || mr.work_in_progress,
    author: {
      name: mr.author?.name,
      username: mr.author?.username,
      avatarUrl: mr.author?.avatar_url
    },
    assignees: (mr.assignees || []).map(a => ({
      name: a.name,
      username: a.username,
      avatarUrl: a.avatar_url
    })),
    reviewers: (mr.reviewers || []).map(r => ({
      name: r.name,
      username: r.username,
      avatarUrl: r.avatar_url
    })),
    labels: mr.labels || [],
    projectId: mr.project_id,
    references: {
      full: mr.references?.full
    },
    upvotes: mr.upvotes,
    downvotes: mr.downvotes,
    userNotesCount: mr.user_notes_count,
    hasConflicts: mr.has_conflicts
  }));
}

// API endpoint for getting cache status
router.get('/cache/status', (req, res) => {
  const metadata = readMetadata();
  res.json({
    success: true,
    lastSync: metadata.lastSync,
    projectsCount: metadata.projectsCount || 0,
    mergeRequestsCount: metadata.mergeRequestsCount || 0,
    hasCache: !!metadata.lastSync
  });
});

// Test GitLab connection
router.get('/test', async (req, res) => {
  const gitlabConfig = loadGitLabConfig();
  
  if (!gitlabConfig || !gitlabConfig.url || !gitlabConfig.token) {
    return res.json({ 
      success: false, 
      error: 'GitLab is not configured. Please add your GitLab URL and Personal Access Token in Settings.'
    });
  }

  try {
    const userData = await makeGitLabRequest(gitlabConfig, '/user');
    
    res.json({ 
      success: true, 
      message: 'Successfully connected to GitLab',
      user: {
        name: userData.name,
        username: userData.username,
        email: userData.email,
        avatar_url: userData.avatar_url
      }
    });
  } catch (error) {
    console.error('Error testing GitLab connection:', error);
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

// Get current user info (cached)
router.get('/user', async (req, res) => {
  const gitlabConfig = loadGitLabConfig();
  const forceRefresh = req.query.refresh === 'true';
  
  if (!gitlabConfig || !gitlabConfig.url || !gitlabConfig.token) {
    return res.json({ 
      success: false, 
      error: 'GitLab is not configured.'
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
    const userData = await makeGitLabRequest(gitlabConfig, '/user');
    writeCache('user', userData);
    res.json({ success: true, user: userData, fromCache: false });
  } catch (error) {
    console.error('Error fetching GitLab user:', error);
    // Try returning cached version on error
    const cached = readCache('user');
    if (cached) {
      return res.json({ success: true, user: cached, fromCache: true, fetchError: error.message });
    }
    res.json({ success: false, error: error.message });
  }
});

// Get projects - either contributed to or member of (cached)
router.get('/projects', async (req, res) => {
  const gitlabConfig = loadGitLabConfig();
  const { scope = 'contributed' } = req.query;
  const forceRefresh = req.query.refresh === 'true';
  
  if (!gitlabConfig || !gitlabConfig.url || !gitlabConfig.token) {
    return res.json({ 
      success: false, 
      error: 'GitLab is not configured.',
      projects: []
    });
  }

  const cacheKey = `projects_${scope}`;

  // Try cache first
  if (!forceRefresh) {
    const cached = readCache(cacheKey);
    if (cached) {
      return res.json({ success: true, projects: cached, fromCache: true });
    }
  }

  try {
    let projects;
    
    if (scope === 'contributed') {
      const user = await makeGitLabRequest(gitlabConfig, '/user');
      projects = await makeGitLabRequest(
        gitlabConfig, 
        `/users/${user.id}/contributed_projects?per_page=100&order_by=last_activity_at`
      );
    } else {
      projects = await makeGitLabRequest(
        gitlabConfig, 
        '/projects?membership=true&min_access_level=30&per_page=100&order_by=last_activity_at'
      );
    }
    
    const transformedProjects = transformProjects(projects);
    writeCache(cacheKey, transformedProjects);

    res.json({ success: true, projects: transformedProjects, fromCache: false });
  } catch (error) {
    console.error('Error fetching GitLab projects:', error);
    // Try returning cached version on error
    const cached = readCache(cacheKey);
    if (cached) {
      return res.json({ success: true, projects: cached, fromCache: true, fetchError: error.message });
    }
    res.json({ success: false, error: error.message, projects: [] });
  }
});

// Get merge requests (cached)
router.get('/merge-requests', async (req, res) => {
  const gitlabConfig = loadGitLabConfig();
  const { scope = 'all', projectScope = 'contributed' } = req.query;
  const forceRefresh = req.query.refresh === 'true';
  
  if (!gitlabConfig || !gitlabConfig.url || !gitlabConfig.token) {
    return res.json({ 
      success: false, 
      error: 'GitLab is not configured.',
      mergeRequests: []
    });
  }

  const cacheKey = `merge_requests_${scope}_${projectScope}`;

  // Try cache first
  if (!forceRefresh) {
    const cached = readCache(cacheKey);
    if (cached) {
      return res.json({ success: true, mergeRequests: cached, fromCache: true });
    }
  }

  try {
    let mergeRequests = [];
    let contributedProjectIds = null;
    
    if (projectScope === 'contributed') {
      const user = await makeGitLabRequest(gitlabConfig, '/user');
      const contributedProjects = await makeGitLabRequest(
        gitlabConfig, 
        `/users/${user.id}/contributed_projects?per_page=100`
      );
      contributedProjectIds = new Set(contributedProjects.map(p => p.id));
    }
    
    if (scope === 'assigned') {
      const reviewerMRs = await makeGitLabRequest(
        gitlabConfig, 
        '/merge_requests?reviewer_username=@me&state=opened&per_page=100&order_by=updated_at'
      );
      
      const assigneeMRs = await makeGitLabRequest(
        gitlabConfig, 
        '/merge_requests?assignee_username=@me&state=opened&per_page=100&order_by=updated_at'
      );
      
      const allMRs = [...reviewerMRs, ...assigneeMRs];
      const seenIds = new Set();
      mergeRequests = allMRs.filter(mr => {
        if (seenIds.has(mr.id)) return false;
        seenIds.add(mr.id);
        return true;
      });
    } else {
      mergeRequests = await makeGitLabRequest(
        gitlabConfig, 
        '/merge_requests?scope=all&state=opened&per_page=100&order_by=updated_at'
      );
    }
    
    if (contributedProjectIds) {
      mergeRequests = mergeRequests.filter(mr => contributedProjectIds.has(mr.project_id));
    }
    
    const transformedMRs = transformMergeRequests(mergeRequests);
    writeCache(cacheKey, transformedMRs);

    res.json({ success: true, mergeRequests: transformedMRs, fromCache: false });
  } catch (error) {
    console.error('Error fetching GitLab merge requests:', error);
    // Try returning cached version on error
    const cached = readCache(cacheKey);
    if (cached) {
      return res.json({ success: true, mergeRequests: cached, fromCache: true, fetchError: error.message });
    }
    res.json({ success: false, error: error.message, mergeRequests: [] });
  }
});

// Sync/refresh all GitLab data
router.post('/sync', async (req, res) => {
  const gitlabConfig = loadGitLabConfig();
  
  if (!gitlabConfig || !gitlabConfig.url || !gitlabConfig.token) {
    return res.json({ 
      success: false, 
      error: 'GitLab is not configured.'
    });
  }

  try {
    // Fetch user
    const userData = await makeGitLabRequest(gitlabConfig, '/user');
    writeCache('user', userData);

    // Fetch contributed projects
    const contributedProjects = await makeGitLabRequest(
      gitlabConfig, 
      `/users/${userData.id}/contributed_projects?per_page=100&order_by=last_activity_at`
    );
    const transformedContributed = transformProjects(contributedProjects);
    writeCache('projects_contributed', transformedContributed);

    // Fetch member projects
    const memberProjects = await makeGitLabRequest(
      gitlabConfig, 
      '/projects?membership=true&min_access_level=30&per_page=100&order_by=last_activity_at'
    );
    const transformedMember = transformProjects(memberProjects);
    writeCache('projects_member', transformedMember);

    // Get contributed project IDs for filtering MRs
    const contributedProjectIds = new Set(contributedProjects.map(p => p.id));

    // Fetch all MRs for contributed projects
    let allMRs = await makeGitLabRequest(
      gitlabConfig, 
      '/merge_requests?scope=all&state=opened&per_page=100&order_by=updated_at'
    );
    const filteredAllMRs = allMRs.filter(mr => contributedProjectIds.has(mr.project_id));
    writeCache('merge_requests_all_contributed', transformMergeRequests(filteredAllMRs));

    // Fetch assigned MRs for contributed projects
    const reviewerMRs = await makeGitLabRequest(
      gitlabConfig, 
      '/merge_requests?reviewer_username=@me&state=opened&per_page=100&order_by=updated_at'
    );
    const assigneeMRs = await makeGitLabRequest(
      gitlabConfig, 
      '/merge_requests?assignee_username=@me&state=opened&per_page=100&order_by=updated_at'
    );
    const combinedAssigned = [...reviewerMRs, ...assigneeMRs];
    const seenIds = new Set();
    const uniqueAssigned = combinedAssigned.filter(mr => {
      if (seenIds.has(mr.id)) return false;
      seenIds.add(mr.id);
      return true;
    });
    const filteredAssignedMRs = uniqueAssigned.filter(mr => contributedProjectIds.has(mr.project_id));
    writeCache('merge_requests_assigned_contributed', transformMergeRequests(filteredAssignedMRs));

    // Also cache for member scope (all MRs without filtering)
    writeCache('merge_requests_all_member', transformMergeRequests(allMRs));
    writeCache('merge_requests_assigned_member', transformMergeRequests(uniqueAssigned));

    // Update metadata
    const metadata = {
      lastSync: new Date().toISOString(),
      projectsCount: transformedContributed.length,
      mergeRequestsCount: filteredAllMRs.length
    };
    writeMetadata(metadata);

    res.json({ 
      success: true, 
      message: `Successfully synced GitLab data`,
      ...metadata
    });
  } catch (error) {
    console.error('Error syncing GitLab:', error);
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

// Get merge requests for a specific project
router.get('/projects/:projectId/merge-requests', async (req, res) => {
  const gitlabConfig = loadGitLabConfig();
  const { projectId } = req.params;
  
  if (!gitlabConfig || !gitlabConfig.url || !gitlabConfig.token) {
    return res.json({ 
      success: false, 
      error: 'GitLab is not configured.',
      mergeRequests: []
    });
  }

  try {
    const mergeRequests = await makeGitLabRequest(
      gitlabConfig, 
      `/projects/${projectId}/merge_requests?state=opened&per_page=50&order_by=updated_at`
    );
    
    const transformedMRs = transformMergeRequests(mergeRequests);
    res.json({ success: true, mergeRequests: transformedMRs });
  } catch (error) {
    console.error('Error fetching project merge requests:', error);
    res.json({ success: false, error: error.message, mergeRequests: [] });
  }
});

module.exports = router;
