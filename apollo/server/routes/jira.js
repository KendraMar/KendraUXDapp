const express = require('express');
const { loadJiraConfig } = require('../lib/config');
const { makeJiraRequest } = require('../lib/jira');

const router = express.Router();

// API endpoint for getting Jira issues assigned to current user
router.get('/issues', async (req, res) => {
  const jiraConfig = loadJiraConfig();
  
  if (!jiraConfig || !jiraConfig.url || !jiraConfig.token || !jiraConfig.username) {
    return res.json({ 
      success: false, 
      error: 'Jira is not configured. Please edit data/config.json with your Jira credentials.',
      issues: []
    });
  }

  try {
    // JQL query to get issues assigned to current user, excluding Done and Closed, ordered by updated date
    const jql = 'assignee = currentUser() AND status NOT IN (Done, Closed) ORDER BY updated DESC';
    const endpoint = `/rest/api/2/search?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,status,priority,assignee,reporter,created,updated,description,issuetype,project,components,labels`;
    
    let data;
    try {
      // Try Basic Auth first (username:token)
      data = await makeJiraRequest(jiraConfig, endpoint, false);
    } catch (basicAuthError) {
      // If Basic Auth fails with 401, try Bearer token
      if (basicAuthError.message.includes('401')) {
        console.log('Basic Auth failed, trying Bearer token...');
        data = await makeJiraRequest(jiraConfig, endpoint, true);
      } else {
        throw basicAuthError;
      }
    }
    
    // Transform Jira issues to our format
    const issues = (data.issues || []).map(issue => ({
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
      url: `${jiraConfig.url}/browse/${issue.key}`
    }));

    res.json({ success: true, issues });
  } catch (error) {
    console.error('Error fetching Jira issues:', error);
    res.json({ 
      success: false, 
      error: `Failed to fetch Jira issues: ${error.message}`,
      issues: []
    });
  }
});

// API endpoint for testing Jira connection
router.get('/test', async (req, res) => {
  const jiraConfig = loadJiraConfig();
  
  if (!jiraConfig || !jiraConfig.url || !jiraConfig.token || !jiraConfig.username) {
    return res.json({ 
      success: false, 
      error: 'Jira is not configured. Please edit data/config.json with your Jira credentials.'
    });
  }

  try {
    // Try to get current user info - simpler endpoint for testing
    let userData;
    let authMethod = 'Basic Auth';
    
    try {
      userData = await makeJiraRequest(jiraConfig, '/rest/api/2/myself', false);
    } catch (basicAuthError) {
      if (basicAuthError.message.includes('401')) {
        console.log('Basic Auth failed, trying Bearer token...');
        authMethod = 'Bearer Token';
        userData = await makeJiraRequest(jiraConfig, '/rest/api/2/myself', true);
      } else {
        throw basicAuthError;
      }
    }

    res.json({ 
      success: true, 
      message: 'Successfully connected to Jira',
      authMethod: authMethod,
      user: {
        name: userData.displayName,
        email: userData.emailAddress,
        username: userData.name
      }
    });
  } catch (error) {
    console.error('Error testing Jira connection:', error);
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

module.exports = router;


