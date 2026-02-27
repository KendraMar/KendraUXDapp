const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { loadGoogleTasksConfig, dataDir } = require('../../lib/config');
const { getTasksAccessToken, TASKS_REDIRECT_URI, TASKS_SCOPES } = require('./oauthHelpers');

// Test Tasks connection
router.get('/tasks/test', async (req, res) => {
  try {
    const config = loadGoogleTasksConfig();
    
    if (!config) {
      return res.json({
        success: false,
        error: 'Google Tasks integration not configured'
      });
    }
    
    const accessToken = await getTasksAccessToken();
    
    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }
    
    const userInfo = await userInfoResponse.json();
    
    // Also get task lists count to verify Tasks API access
    const taskListsResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!taskListsResponse.ok) {
      throw new Error('Failed to access Tasks API - check scopes');
    }
    
    const taskListsData = await taskListsResponse.json();
    
    res.json({
      success: true,
      user: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      },
      taskListsCount: (taskListsData.items || []).length
    });
    
  } catch (error) {
    console.error('Google Tasks connection test failed:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Start Tasks OAuth flow
router.get('/tasks/oauth/authorize', (req, res) => {
  const config = loadGoogleTasksConfig();
  
  if (!config || !config.clientId) {
    return res.status(400).json({
      success: false,
      error: 'Client ID not configured. Please add clientId to Google Tasks config first.'
    });
  }
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', TASKS_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', TASKS_SCOPES.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  
  res.redirect(authUrl.toString());
});

// Tasks OAuth callback
router.get('/tasks/oauth/callback', async (req, res) => {
  console.log('Google Tasks OAuth callback received');
  const { code, error } = req.query;
  
  if (error) {
    console.log('OAuth error:', error);
    return res.send(`
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1 style="color: #c9190b;">Authorization Failed</h1>
          <p>Error: ${error}</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  }
  
  if (!code) {
    return res.send(`
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1 style="color: #c9190b;">Authorization Failed</h1>
          <p>No authorization code received.</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  }
  
  try {
    const config = loadGoogleTasksConfig();
    
    if (!config || !config.clientId || !config.clientSecret) {
      throw new Error('Client ID and Client Secret must be configured first');
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: TASKS_REDIRECT_URI,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }
    
    const tokens = await tokenResponse.json();
    
    if (!tokens.refresh_token) {
      throw new Error('No refresh token received. Try revoking app access at https://myaccount.google.com/permissions and try again.');
    }
    
    // Save refresh token to config
    const configFile = path.join(dataDir, 'config.json');
    let fullConfig = {};
    
    if (fs.existsSync(configFile)) {
      fullConfig = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    }
    
    fullConfig.googleTasks = fullConfig.googleTasks || {};
    fullConfig.googleTasks.refreshToken = tokens.refresh_token;
    
    fs.writeFileSync(configFile, JSON.stringify(fullConfig, null, 2));
    
    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1 style="color: #3e8635;">✓ Google Tasks Connected!</h1>
          <p>Your refresh token has been saved automatically.</p>
          <p>You can close this window and return to Apollo.</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Tasks OAuth callback error:', error);
    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1 style="color: #c9190b;">Authorization Failed</h1>
          <p>${error.message}</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  }
});

// Get list of task lists
router.get('/tasks/lists', async (req, res) => {
  try {
    const accessToken = await getTasksAccessToken();
    
    const response = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch task lists: ${error}`);
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      taskLists: (data.items || []).map(list => ({
        id: list.id,
        title: list.title,
        updated: list.updated
      }))
    });
    
  } catch (error) {
    console.error('Error fetching task lists:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get tasks from all lists (or specific list)
router.get('/tasks/tasks', async (req, res) => {
  try {
    const accessToken = await getTasksAccessToken();
    const { listId, showCompleted = 'false' } = req.query;
    
    // First get all task lists (or use specific one)
    let taskLists = [];
    
    if (listId) {
      taskLists = [{ id: listId }];
    } else {
      const listsResponse = await fetch('https://www.googleapis.com/tasks/v1/users/@me/lists', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!listsResponse.ok) {
        throw new Error('Failed to fetch task lists');
      }
      
      const listsData = await listsResponse.json();
      taskLists = listsData.items || [];
    }
    
    // Fetch tasks from each list
    const allTasks = [];
    
    for (const list of taskLists) {
      const params = new URLSearchParams({
        maxResults: '100',
        showCompleted: showCompleted,
        showHidden: 'false'
      });
      
      const response = await fetch(
        `https://www.googleapis.com/tasks/v1/lists/${encodeURIComponent(list.id)}/tasks?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        console.error(`Failed to fetch tasks for list ${list.id}:`, await response.text());
        continue;
      }
      
      const data = await response.json();
      
      // Add list info to each task
      const tasksWithList = (data.items || []).map(task => ({
        ...task,
        listId: list.id,
        listTitle: list.title
      }));
      
      allTasks.push(...tasksWithList);
    }
    
    // Sort by updated time (newest first)
    allTasks.sort((a, b) => {
      return new Date(b.updated) - new Date(a.updated);
    });
    
    res.json({
      success: true,
      tasks: allTasks.map(task => ({
        id: task.id,
        title: task.title,
        notes: task.notes || '',
        status: task.status, // 'needsAction' or 'completed'
        due: task.due,
        completed: task.completed,
        updated: task.updated,
        listId: task.listId,
        listTitle: task.listTitle,
        parent: task.parent,
        position: task.position,
        links: task.links || [],
        selfLink: task.selfLink
      }))
    });
    
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
