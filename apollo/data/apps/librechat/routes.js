const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

const CONFIG_PATH = path.join(__dirname, '../../data/config.json');
const COMPOSE_DIR = path.join(__dirname, '../../data/librechat');
const COMPOSE_FILE = path.join(COMPOSE_DIR, 'docker-compose.yml');

// Helper to load config
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return {};
}

// Helper to save config
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

// Get LibreChat config
router.get('/config', (req, res) => {
  const config = loadConfig();
  res.json({
    url: config.librechat?.url || 'http://localhost:3080',
    enabled: config.librechat?.enabled !== false
  });
});

// Update LibreChat config
router.put('/config', (req, res) => {
  const { url, enabled } = req.body;
  const config = loadConfig();
  
  config.librechat = {
    ...config.librechat,
    url: url || config.librechat?.url || 'http://localhost:3080',
    enabled: enabled !== undefined ? enabled : true
  };
  
  if (saveConfig(config)) {
    res.json({ success: true, config: config.librechat });
  } else {
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// Detect which compose command is available - strongly prefer podman-compose
async function getComposeCommand() {
  return new Promise((resolve) => {
    // First check for podman-compose
    exec('which podman-compose 2>/dev/null', (error, stdout) => {
      if (!error && stdout.trim()) {
        resolve('podman-compose');
      } else {
        // Only fall back to docker if podman-compose is not available
        // and user explicitly has docker running
        resolve(null); // For now, require podman-compose
      }
    });
  });
}

// Check if LibreChat container is running
router.get('/container-status', async (req, res) => {
  try {
    // Check for apollo-librechat container specifically using podman
    const checkCommand = 'podman ps --filter "name=apollo-librechat" --format "{{.ID}} {{.Status}}" 2>/dev/null';
    
    exec(checkCommand, (error, stdout, stderr) => {
      if (error || !stdout.trim()) {
        // Also check for stopped containers
        exec('podman ps -a --filter "name=apollo-librechat" --format "{{.ID}} {{.Status}}" 2>/dev/null', (err2, stdout2) => {
          if (stdout2 && stdout2.trim()) {
            const parts = stdout2.trim().split(' ');
            res.json({ 
              running: false, 
              containerId: parts[0],
              status: parts.slice(1).join(' '),
              exists: true
            });
          } else {
            res.json({ running: false, containerId: null, exists: false });
          }
        });
      } else {
        const parts = stdout.trim().split(' ');
        res.json({ 
          running: true, 
          containerId: parts[0],
          status: parts.slice(1).join(' ')
        });
      }
    });
  } catch (error) {
    res.json({ running: false, error: error.message });
  }
});

// Get container logs
router.get('/logs', async (req, res) => {
  const lines = req.query.lines || 50;
  try {
    exec(`podman logs --tail ${lines} apollo-librechat 2>&1`, (error, stdout, stderr) => {
      res.json({ 
        success: true, 
        logs: stdout || stderr || 'No logs available'
      });
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Start LibreChat using compose
router.post('/start', async (req, res) => {
  const config = loadConfig();
  const port = config.librechat?.port || 3080;
  
  try {
    const composeCmd = await getComposeCommand();
    
    if (!composeCmd) {
      return res.status(500).json({
        success: false,
        error: 'podman-compose is not installed. Please install it with: pip install podman-compose'
      });
    }
    
    // Check if compose file exists
    if (!fs.existsSync(COMPOSE_FILE)) {
      return res.status(500).json({
        success: false,
        error: 'Compose file not found. Please ensure data/librechat/docker-compose.yml exists.'
      });
    }
    
    // Start with compose
    const startCompose = () => new Promise((resolve, reject) => {
      const env = { ...process.env, LIBRECHAT_PORT: port.toString() };
      exec(`${composeCmd} -f "${COMPOSE_FILE}" up -d`, { cwd: COMPOSE_DIR, env }, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || stdout || error.message));
        } else {
          resolve({ output: stdout + stderr, runtime: composeCmd });
        }
      });
    });
    
    const result = await startCompose();
    
    res.json({
      success: true,
      message: `LibreChat started successfully with ${result.runtime}`,
      output: result.output,
      port: port,
      url: `http://localhost:${port}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Stop LibreChat using compose
router.post('/stop', async (req, res) => {
  try {
    const composeCmd = await getComposeCommand();
    
    if (!composeCmd) {
      // Fallback to stopping containers directly with podman
      exec('podman stop apollo-librechat apollo-librechat-mongo 2>/dev/null', (error) => {
        res.json({ success: true, message: 'LibreChat stopped' });
      });
      return;
    }
    
    exec(`${composeCmd} -f "${COMPOSE_FILE}" stop`, { cwd: COMPOSE_DIR }, (error, stdout, stderr) => {
      if (error) {
        // Try direct stop as fallback
        exec('podman stop apollo-librechat apollo-librechat-mongo 2>/dev/null', () => {
          res.json({ success: true, message: 'LibreChat stopped' });
        });
      } else {
        res.json({ success: true, message: 'LibreChat stopped', output: stdout + stderr });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove LibreChat containers and volumes (for cleanup)
router.delete('/container', async (req, res) => {
  try {
    const composeCmd = await getComposeCommand();
    
    if (composeCmd) {
      exec(`${composeCmd} -f "${COMPOSE_FILE}" down -v`, { cwd: COMPOSE_DIR }, (error, stdout, stderr) => {
        res.json({ success: true, message: 'LibreChat containers and volumes removed', output: stdout + stderr });
      });
    } else {
      // Fallback to direct removal with podman
      exec('podman rm -f apollo-librechat apollo-librechat-mongo 2>/dev/null', () => {
        res.json({ success: true, message: 'Containers removed' });
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check - verify LibreChat is reachable
router.post('/health', async (req, res) => {
  const { url } = req.body;
  const targetUrl = url || loadConfig().librechat?.url || 'http://localhost:3080';
  
  try {
    const parsedUrl = new URL(targetUrl);
    const httpModule = parsedUrl.protocol === 'https:' ? https : http;
    
    const healthCheck = new Promise((resolve, reject) => {
      const request = httpModule.get(targetUrl, { timeout: 5000 }, (response) => {
        resolve({ connected: response.statusCode < 400 });
      });
      
      request.on('error', (err) => {
        reject(err);
      });
      
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Connection timeout'));
      });
    });
    
    const result = await healthCheck;
    res.json(result);
  } catch (error) {
    res.json({ connected: false, error: error.message });
  }
});

// ==========================================
// OpenAI-Compatible API Proxy for LibreChat
// ==========================================
// This allows LibreChat to connect to Apollo's AI providers

// List available models from all providers
router.get('/v1/models', async (req, res) => {
  const models = [];
  const config = loadConfig();
  
  // Add local models
  try {
    const localUrl = config.ai?.apiUrl || 'http://localhost:11434';
    const localModels = await fetchLocalModels(localUrl);
    localModels.forEach(model => {
      models.push({
        id: `local/${model}`,
        object: 'model',
        created: Date.now(),
        owned_by: 'local',
        permission: [],
        root: model,
        parent: null
      });
    });
  } catch (err) {
    console.log('Local AI not available');
  }
  
  // Add Ambient AI models
  if (config.ambientAi?.apiUrl) {
    try {
      const ambientModels = await fetchAmbientModels(config.ambientAi);
      ambientModels.forEach(model => {
        models.push({
          id: `ambient/${model.id}`,
          object: 'model',
          created: Date.now(),
          owned_by: 'ambient-ai',
          permission: [],
          root: model.id,
          parent: null
        });
      });
    } catch (err) {
      console.log('Ambient AI not available');
    }
  }
  
  // Add Claude models
  if (config.claudeCode?.vertexProjectId || config.claudeCode?.apiKey) {
    models.push({
      id: 'claude/claude-sonnet-4',
      object: 'model',
      created: Date.now(),
      owned_by: 'anthropic',
      permission: [],
      root: 'claude-sonnet-4',
      parent: null
    });
    models.push({
      id: 'claude/claude-opus-4',
      object: 'model',
      created: Date.now(),
      owned_by: 'anthropic',
      permission: [],
      root: 'claude-opus-4',
      parent: null
    });
  }
  
  // Add Cursor CLI models if enabled
  if (config.cursorCli?.enabled) {
    models.push({
      id: 'cursor/claude-4.5-opus',
      object: 'model',
      created: Date.now(),
      owned_by: 'cursor',
      permission: [],
      root: 'claude-4.5-opus',
      parent: null
    });
    models.push({
      id: 'cursor/claude-sonnet-4',
      object: 'model',
      created: Date.now(),
      owned_by: 'cursor',
      permission: [],
      root: 'claude-sonnet-4',
      parent: null
    });
  }
  
  res.json({
    object: 'list',
    data: models
  });
});

// Chat completions endpoint - routes to appropriate provider
router.post('/v1/chat/completions', async (req, res) => {
  const { model, messages, stream, temperature, max_tokens } = req.body;
  const config = loadConfig();
  
  try {
    // Parse model to determine provider
    const [provider, modelName] = model.includes('/') ? model.split('/') : ['local', model];
    
    let response;
    
    switch (provider) {
      case 'local':
        response = await handleLocalRequest(config, modelName, messages, { temperature, max_tokens, stream });
        break;
      case 'ambient':
        response = await handleAmbientRequest(config, modelName, messages, { temperature, max_tokens });
        break;
      case 'claude':
        response = await handleClaudeRequest(config, modelName, messages, { temperature, max_tokens });
        break;
      case 'cursor':
        response = await handleCursorRequest(config, modelName, messages, { temperature, max_tokens });
        break;
      default:
        // Default to local
        response = await handleLocalRequest(config, model, messages, { temperature, max_tokens, stream });
    }
    
    // Return OpenAI-compatible response
    res.json({
      id: `chatcmpl-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    });
  } catch (error) {
    console.error('Error in chat completion:', error);
    res.status(500).json({
      error: {
        message: error.message,
        type: 'server_error',
        code: 'internal_error'
      }
    });
  }
});

// Helper functions for different providers

async function fetchLocalModels(apiUrl) {
  return new Promise((resolve, reject) => {
    const url = new URL('/v1/models', apiUrl);
    const httpModule = url.protocol === 'https:' ? https : http;
    
    const request = httpModule.get(url.toString(), { timeout: 5000 }, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const models = parsed.data?.map(m => m.id) || [];
          resolve(models);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function fetchAmbientModels(ambientConfig) {
  return new Promise((resolve, reject) => {
    const url = new URL('/models', ambientConfig.apiUrl);
    const httpModule = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ambientConfig.accessKey}`,
        'X-Project-Name': ambientConfig.projectName
      },
      timeout: 5000
    };
    
    const request = httpModule.request(options, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.models || []);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Timeout'));
    });
    request.end();
  });
}

async function handleLocalRequest(config, model, messages, options) {
  const apiUrl = config.ai?.apiUrl || 'http://localhost:11434';
  
  return new Promise((resolve, reject) => {
    const url = new URL('/v1/chat/completions', apiUrl);
    const httpModule = url.protocol === 'https:' ? https : http;
    
    const requestBody = JSON.stringify({
      model: model,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens
    });
    
    const httpOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };
    
    const request = httpModule.request(httpOptions, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.choices?.[0]?.message?.content || '');
        } catch (e) {
          reject(e);
        }
      });
    });
    
    request.on('error', reject);
    request.write(requestBody);
    request.end();
  });
}

async function handleAmbientRequest(config, model, messages, options) {
  const ambientConfig = config.ambientAi;
  if (!ambientConfig?.apiUrl) {
    throw new Error('Ambient AI not configured');
  }
  
  return new Promise((resolve, reject) => {
    const url = new URL('/chat/completions', ambientConfig.apiUrl);
    const httpModule = url.protocol === 'https:' ? https : http;
    
    const requestBody = JSON.stringify({
      model: model,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens
    });
    
    const httpOptions = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
        'Authorization': `Bearer ${ambientConfig.accessKey}`,
        'X-Project-Name': ambientConfig.projectName
      }
    };
    
    const request = httpModule.request(httpOptions, (response) => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.choices?.[0]?.message?.content || parsed.content || '');
        } catch (e) {
          reject(e);
        }
      });
    });
    
    request.on('error', reject);
    request.write(requestBody);
    request.end();
  });
}

async function handleClaudeRequest(config, model, messages, options) {
  // Route through the existing Claude Code endpoint
  const port = process.env.PORT || (process.env.NODE_ENV === 'development' ? 1226 : 1225);
  const response = await fetch(`http://localhost:${port}/api/claudecode/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model.includes('opus') ? 'claude-opus-4@20250514' : 'claude-sonnet-4@20250514',
      messages: messages
    })
  });
  
  const data = await response.json();
  return data.content || '';
}

async function handleCursorRequest(config, model, messages, options) {
  // Route through the existing Cursor CLI endpoint
  const port = process.env.PORT || (process.env.NODE_ENV === 'development' ? 1226 : 1225);
  const response = await fetch(`http://localhost:${port}/api/cursorcli/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      messages: messages
    })
  });
  
  const data = await response.json();
  return data.content || '';
}

module.exports = router;
