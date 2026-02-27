const express = require('express');
const https = require('https');
const http = require('http');
const { loadConfig } = require('../lib/config');

const router = express.Router();

/**
 * Helper function to make HTTP requests to the Ambient AI API
 */
const makeAmbientRequest = (method, path, accessKey, apiBaseUrl, body = null) => {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(path, apiBaseUrl);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Authorization': `Bearer ${accessKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Skip SSL verification for internal Red Hat services
        rejectUnauthorized: false
      };

      const req = httpModule.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, data: jsonData });
          } catch (parseError) {
            // If not JSON, return raw data
            resolve({ status: res.statusCode, data: data });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Test connection to Ambient AI
 * GET /api/ambient/test
 */
router.get('/test', async (req, res) => {
  try {
    const config = loadConfig();
    const ambientConfig = config.ambientAi;

    if (!ambientConfig || !ambientConfig.apiUrl || !ambientConfig.accessKey) {
      return res.status(400).json({
        success: false,
        error: 'Ambient AI is not configured. Please provide API URL and Access Key.'
      });
    }

    // Test connection by listing projects
    const result = await makeAmbientRequest(
      'GET',
      '/api/projects',
      ambientConfig.accessKey,
      ambientConfig.apiUrl
    );

    if (result.status === 200) {
      // Debug: log the actual API response structure
      console.log('[Ambient AI] Test connection response:', JSON.stringify(result.data, null, 2));

      // Handle different response formats:
      // - { items: [...] } (documented format)
      // - [...] (plain array)
      // - { projects: [...] }
      // - { data: [...] } or { data: { items: [...] } }
      let projects = [];
      if (Array.isArray(result.data)) {
        projects = result.data;
      } else if (result.data && Array.isArray(result.data.items)) {
        projects = result.data.items;
      } else if (result.data && Array.isArray(result.data.projects)) {
        projects = result.data.projects;
      } else if (result.data && result.data.data) {
        if (Array.isArray(result.data.data)) {
          projects = result.data.data;
        } else if (Array.isArray(result.data.data.items)) {
          projects = result.data.data.items;
        }
      }

      return res.json({
        success: true,
        projectCount: projects.length,
        projects: projects.map(p => ({ name: p.name || p.metadata?.name, displayName: p.displayName || p.metadata?.displayName || p.name || p.metadata?.name }))
      });
    } else if (result.status === 401) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed. Please check your access key.'
      });
    } else if (result.status === 403) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Your access key may not have the required permissions.'
      });
    } else {
      return res.status(result.status).json({
        success: false,
        error: result.data.error || `Unexpected response: ${result.status}`
      });
    }
  } catch (error) {
    console.error('Error testing Ambient AI connection:', error);
    return res.status(500).json({
      success: false,
      error: `Connection failed: ${error.message}`
    });
  }
});

/**
 * Get available models from Ambient AI
 * The Ambient Code Platform uses Claude models internally.
 * We return the list of available Claude models for the chat interface.
 * GET /api/ambient/models
 */
router.get('/models', async (req, res) => {
  try {
    const config = loadConfig();
    const ambientConfig = config.ambientAi;

    if (!ambientConfig || !ambientConfig.apiUrl || !ambientConfig.accessKey) {
      return res.json({
        success: false,
        error: 'Ambient AI is not configured',
        models: []
      });
    }

    // Verify connection is valid by testing
    try {
      const testResult = await makeAmbientRequest(
        'GET',
        '/api/projects',
        ambientConfig.accessKey,
        ambientConfig.apiUrl
      );

      if (testResult.status !== 200) {
        return res.json({
          success: false,
          error: 'Ambient AI connection is not valid',
          models: []
        });
      }
    } catch (testError) {
      return res.json({
        success: false,
        error: `Ambient AI connection failed: ${testError.message}`,
        models: []
      });
    }

    // Ambient Code Platform is powered by Claude
    // Return the Claude models that are typically available
    const ambientModels = [
      {
        id: 'ambient:claude-sonnet-4',
        name: 'Claude Sonnet 4',
        provider: 'ambient',
        description: 'Anthropic Claude Sonnet 4 via Ambient AI'
      },
      {
        id: 'ambient:claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'ambient',
        description: 'Anthropic Claude 3.5 Sonnet via Ambient AI'
      },
      {
        id: 'ambient:claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'ambient',
        description: 'Anthropic Claude 3 Opus via Ambient AI'
      }
    ];

    return res.json({
      success: true,
      models: ambientModels,
      projectName: ambientConfig.projectName || null
    });
  } catch (error) {
    console.error('Error fetching Ambient AI models:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch models: ${error.message}`,
      models: []
    });
  }
});

/**
 * List projects from Ambient AI
 * GET /api/ambient/projects
 */
router.get('/projects', async (req, res) => {
  try {
    const config = loadConfig();
    const ambientConfig = config.ambientAi;

    if (!ambientConfig || !ambientConfig.apiUrl || !ambientConfig.accessKey) {
      return res.status(400).json({
        success: false,
        error: 'Ambient AI is not configured'
      });
    }

    const result = await makeAmbientRequest(
      'GET',
      '/api/projects',
      ambientConfig.accessKey,
      ambientConfig.apiUrl
    );

    if (result.status === 200) {
      // Handle different response formats
      let projects = [];
      if (Array.isArray(result.data)) {
        projects = result.data;
      } else if (result.data && Array.isArray(result.data.items)) {
        projects = result.data.items;
      } else if (result.data && Array.isArray(result.data.projects)) {
        projects = result.data.projects;
      } else if (result.data && result.data.data) {
        if (Array.isArray(result.data.data)) {
          projects = result.data.data;
        } else if (Array.isArray(result.data.data.items)) {
          projects = result.data.data.items;
        }
      }

      return res.json({
        success: true,
        projects: projects
      });
    } else {
      return res.status(result.status).json({
        success: false,
        error: result.data.error || 'Failed to fetch projects'
      });
    }
  } catch (error) {
    console.error('Error fetching Ambient AI projects:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch projects: ${error.message}`
    });
  }
});

/**
 * List agentic sessions for a project
 * GET /api/ambient/projects/:projectName/sessions
 */
router.get('/projects/:projectName/sessions', async (req, res) => {
  try {
    const config = loadConfig();
    const ambientConfig = config.ambientAi;
    const { projectName } = req.params;

    if (!ambientConfig || !ambientConfig.apiUrl || !ambientConfig.accessKey) {
      return res.status(400).json({
        success: false,
        error: 'Ambient AI is not configured'
      });
    }

    const result = await makeAmbientRequest(
      'GET',
      `/api/projects/${encodeURIComponent(projectName)}/agentic-sessions`,
      ambientConfig.accessKey,
      ambientConfig.apiUrl
    );

    if (result.status === 200) {
      // Handle different response formats
      let sessions = [];
      if (Array.isArray(result.data)) {
        sessions = result.data;
      } else if (result.data && Array.isArray(result.data.items)) {
        sessions = result.data.items;
      } else if (result.data && Array.isArray(result.data.sessions)) {
        sessions = result.data.sessions;
      } else if (result.data && result.data.data) {
        if (Array.isArray(result.data.data)) {
          sessions = result.data.data;
        } else if (Array.isArray(result.data.data.items)) {
          sessions = result.data.data.items;
        }
      }

      return res.json({
        success: true,
        sessions: sessions
      });
    } else {
      return res.status(result.status).json({
        success: false,
        error: result.data.error || 'Failed to fetch sessions'
      });
    }
  } catch (error) {
    console.error('Error fetching Ambient AI sessions:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch sessions: ${error.message}`
    });
  }
});

module.exports = router;
