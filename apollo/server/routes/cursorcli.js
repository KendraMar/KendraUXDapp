const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const { loadConfig } = require('../lib/config');

const execAsync = promisify(exec);
const router = express.Router();

// Cache for models (refreshed periodically)
let cachedModels = null;
let modelsCacheTime = 0;
const MODELS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get the path to the agent command
 */
function getAgentPath() {
  const os = require('os');
  const path = require('path');
  
  // Common installation paths
  const possiblePaths = [
    path.join(os.homedir(), '.local', 'bin', 'agent'),
    '/usr/local/bin/agent',
    '/opt/homebrew/bin/agent',
    'agent' // Try PATH as fallback
  ];
  
  return possiblePaths;
}

/**
 * Check if Cursor CLI (agent) is installed
 */
async function isCursorCliInstalled() {
  const paths = getAgentPath();
  
  // Try each path
  for (const agentPath of paths) {
    try {
      // Try to execute agent --version to verify it works
      await execAsync(`"${agentPath}" --version 2>&1`, { timeout: 5000 });
      return true;
    } catch {
      // Try next path
      continue;
    }
  }
  
  return false;
}

/**
 * Find the working agent command path
 */
async function findAgentCommand() {
  const paths = getAgentPath();
  
  for (const agentPath of paths) {
    try {
      await execAsync(`"${agentPath}" --version 2>&1`, { timeout: 5000 });
      return agentPath;
    } catch {
      continue;
    }
  }
  
  return null;
}

/**
 * Check if user is authenticated with Cursor CLI
 */
async function checkAuthStatus() {
  const agentCmd = await findAgentCommand();
  if (!agentCmd) {
    return { authenticated: false, output: 'Agent command not found' };
  }
  
  try {
    const { stdout } = await execAsync(`"${agentCmd}" status 2>&1`, { timeout: 10000 });
    // Check if output indicates logged in
    const isLoggedIn = stdout.toLowerCase().includes('logged in') || 
                       stdout.toLowerCase().includes('authenticated') ||
                       !stdout.toLowerCase().includes('not logged in');
    return { authenticated: isLoggedIn, output: stdout.trim() };
  } catch (error) {
    return { authenticated: false, output: error.message };
  }
}

/**
 * Fetch available models from Cursor CLI dynamically
 */
async function fetchModelsFromCli() {
  // Return cache if still valid
  if (cachedModels && (Date.now() - modelsCacheTime) < MODELS_CACHE_TTL) {
    return cachedModels;
  }

  const agentCmd = await findAgentCommand();
  if (!agentCmd) {
    return getDefaultModels();
  }

  try {
    const { stdout } = await execAsync(`"${agentCmd}" models 2>&1`, { timeout: 15000 });
    
    // Parse the models output - format varies but typically lists model names
    const lines = stdout.split('\n').filter(line => line.trim());
    const models = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip header/info lines
      if (trimmed.startsWith('-') || trimmed.startsWith('=') || 
          trimmed.toLowerCase().includes('available') ||
          trimmed.toLowerCase().includes('model') && trimmed.includes(':')) {
        continue;
      }
      
      // Extract model name - could be in various formats
      // "claude-4-opus" or "  claude-4-opus  - description" or similar
      const match = trimmed.match(/^[\s*-]*([a-zA-Z0-9._-]+)/);
      if (match && match[1].length > 2) {
        const modelId = match[1];
        models.push({
          id: modelId,
          name: formatModelName(modelId),
          provider: 'cursorcli',
          description: `Available via Cursor CLI`
        });
      }
    }

    if (models.length > 0) {
      cachedModels = models;
      modelsCacheTime = Date.now();
      return models;
    }
  } catch (error) {
    console.log('Could not fetch models from CLI:', error.message);
  }

  // Fallback to common model names if CLI fetch fails
  return getDefaultModels();
}

/**
 * Format model ID to display name
 */
function formatModelName(modelId) {
  const nameMap = {
    'claude-4.5-opus-high': 'Claude 4.5 Opus (High)',
    'claude-4.5-opus': 'Claude 4.5 Opus',
    'claude-4.5-sonnet': 'Claude 4.5 Sonnet',
    'claude-4-opus': 'Claude 4 Opus',
    'claude-4-sonnet': 'Claude 4 Sonnet',
    'claude-3.5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3-opus': 'Claude 3 Opus',
    'gpt-4o': 'GPT-4o',
    'gpt-4': 'GPT-4',
    'o3': 'OpenAI o3',
    'o3-mini': 'OpenAI o3 mini',
    'o1': 'OpenAI o1',
    'o1-mini': 'OpenAI o1 mini',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
    'gemini-2.0-flash': 'Gemini 2.0 Flash',
    'gemini-pro': 'Gemini Pro'
  };

  if (nameMap[modelId]) return nameMap[modelId];
  
  // Auto-format: replace dashes with spaces and capitalize
  return modelId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get default models (fallback when CLI fetch fails)
 * These are common Cursor model identifiers
 */
function getDefaultModels() {
  return [
    {
      id: 'claude-4.5-opus-high',
      name: 'Claude 4.5 Opus (High)',
      provider: 'cursorcli',
      description: 'Anthropic\'s most capable model via Cursor'
    },
    {
      id: 'claude-4.5-sonnet',
      name: 'Claude 4.5 Sonnet',
      provider: 'cursorcli',
      description: 'Balanced performance and speed via Cursor'
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'cursorcli',
      description: 'OpenAI\'s latest model via Cursor'
    },
    {
      id: 'o3',
      name: 'OpenAI o3',
      provider: 'cursorcli',
      description: 'OpenAI\'s reasoning model via Cursor'
    },
    {
      id: 'gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'cursorcli',
      description: 'Google\'s advanced model via Cursor'
    }
  ];
}

/**
 * Get Cursor CLI configuration status and available models
 * GET /api/cursorcli/models
 */
router.get('/models', async (req, res) => {
  try {
    const config = loadConfig();
    const cursorConfig = config.cursorCli;

    // Check if CLI is installed
    const installed = await isCursorCliInstalled();
    
    if (!installed) {
      return res.json({
        success: false,
        error: 'Cursor CLI is not installed. Install it with: curl https://cursor.com/install -fsS | bash',
        models: [],
        configured: false
      });
    }

    // If not enabled in config, return early
    if (!cursorConfig?.enabled) {
      return res.json({
        success: false,
        error: 'Cursor CLI is not enabled. Enable it in Settings > Integrations.',
        models: [],
        configured: false
      });
    }

    // Check authentication status
    const authStatus = await checkAuthStatus();
    
    // Try to fetch models from CLI (will use cache or fallback)
    const models = await fetchModelsFromCli();
    const defaultModel = cursorConfig?.defaultModel || 'claude-4.5-sonnet';

    return res.json({
      success: true,
      models,
      defaultModel,
      configured: true,
      installed: true,
      authenticated: authStatus.authenticated,
      authMessage: authStatus.authenticated ? 'Logged in' : 'Run "agent login" to authenticate'
    });
  } catch (error) {
    console.error('Error fetching Cursor CLI models:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch models: ${error.message}`,
      models: []
    });
  }
});

/**
 * Test Cursor CLI connection/installation
 * GET /api/cursorcli/test
 */
router.get('/test', async (req, res) => {
  try {
    const installed = await isCursorCliInstalled();
    
    if (!installed) {
      return res.json({
        success: false,
        error: 'Cursor CLI is not installed. Install it from cursor.com/cli'
      });
    }

    const agentCmd = await findAgentCommand();
    
    // Check version
    let version = 'Unknown';
    try {
      const { stdout } = await execAsync(`"${agentCmd}" --version 2>&1`, { timeout: 5000 });
      version = stdout.trim();
    } catch {
      // Version might not be available
    }

    // Check authentication status
    const authStatus = await checkAuthStatus();

    if (!authStatus.authenticated) {
      return res.json({
        success: false,
        error: 'Cursor CLI is installed but not authenticated. Run "agent login" in your terminal to authenticate.',
        version,
        authenticated: false,
        agentPath: agentCmd
      });
    }

    return res.json({
      success: true,
      message: `Cursor CLI is installed and authenticated`,
      version,
      authenticated: true,
      authDetails: authStatus.output,
      agentPath: agentCmd
    });
  } catch (error) {
    console.error('Error testing Cursor CLI:', error);
    return res.status(500).json({
      success: false,
      error: `Test failed: ${error.message}`
    });
  }
});

/**
 * Send a message to Cursor CLI using the print mode (-p)
 * POST /api/cursorcli/message
 * 
 * Based on Cursor CLI docs:
 * - agent -p "prompt" or agent --print "prompt" for non-interactive mode
 * - agent -m <model> to select model
 * - agent --output-format text for plain text output
 */
router.post('/message', async (req, res) => {
  try {
    const config = loadConfig();
    const cursorConfig = config.cursorCli;

    if (!cursorConfig?.enabled) {
      return res.status(400).json({
        success: false,
        error: 'Cursor CLI is not enabled'
      });
    }

    // Check authentication first
    const authStatus = await checkAuthStatus();
    if (!authStatus.authenticated) {
      return res.status(401).json({
        success: false,
        error: 'Cursor CLI is not authenticated. Please run "agent login" in your terminal first.'
      });
    }

    const { messages, model } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'messages field is required and must be a non-empty array'
      });
    }

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      return res.status(400).json({
        success: false,
        error: 'No user message found'
      });
    }

    const selectedModel = model || cursorConfig.defaultModel || 'claude-4.5-sonnet';
    
    // Find the agent command
    const agentCmd = await findAgentCommand();
    if (!agentCmd) {
      return res.status(500).json({
        success: false,
        error: 'Cursor CLI (agent) command not found. Please ensure it is installed.'
      });
    }
    
    try {
      // Use spawn for better control over the process
      const { spawn } = require('child_process');
      
      console.log('Executing Cursor CLI with model:', selectedModel);
      console.log('Agent command:', agentCmd);
      console.log('Prompt:', lastUserMessage.content.substring(0, 100) + '...');

      // Build args array
      const args = [
        lastUserMessage.content,
        '-p',
        '--model', selectedModel,
        '--output-format', 'text'
      ];

      const result = await new Promise((resolve, reject) => {
        const child = spawn(agentCmd, args, {
          env: { ...process.env, TERM: 'dumb', CI: '1' },
          timeout: 120000 // 2 minute timeout
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        // Close stdin immediately to prevent waiting for input
        child.stdin.end();

        child.on('close', (code) => {
          console.log('Cursor CLI exited with code:', code);
          resolve({ stdout, stderr, code });
        });

        child.on('error', (error) => {
          reject(error);
        });

        // Timeout after 2 minutes
        setTimeout(() => {
          child.kill();
          reject(new Error('Cursor CLI request timed out after 2 minutes'));
        }, 120000);
      });

      const { stdout, stderr } = result;

      const content = stdout || stderr || 'No response from Cursor CLI';

      // Check for common error patterns
      if (content.includes('not logged in') || content.includes('not authenticated')) {
        return res.status(401).json({
          success: false,
          error: 'Cursor CLI session expired. Please run "agent login" in your terminal.'
        });
      }

      if (content.includes('command not found') || content.includes('not recognized')) {
        return res.status(500).json({
          success: false,
          error: 'Cursor CLI (agent) command not found. Please install it from cursor.com/cli'
        });
      }

      if (content.includes('model not found') || content.includes('invalid model')) {
        return res.status(400).json({
          success: false,
          error: `Model "${selectedModel}" not found. Run "agent models" to see available models.`
        });
      }

      return res.json({
        success: true,
        content: content.trim(),
        model: selectedModel
      });
    } catch (execError) {
      console.error('Cursor CLI execution error:', execError);
      
      // Extract useful error message
      let errorMsg = execError.message || 'Failed to execute Cursor CLI';
      const errorOutput = execError.stderr || execError.stdout || '';
      
      // Check for common issues
      if (errorMsg.includes('command not found') || errorOutput.includes('command not found')) {
        errorMsg = 'Cursor CLI (agent) is not installed or not in PATH. Install from cursor.com/cli';
      } else if (errorMsg.includes('ENOENT')) {
        errorMsg = 'Cursor CLI (agent) command not found. Please install it first.';
      } else if (execError.killed) {
        errorMsg = 'Cursor CLI request timed out after 2 minutes';
      } else if (errorOutput.includes('not logged in') || errorOutput.includes('authentication')) {
        errorMsg = 'Cursor CLI is not authenticated. Run "agent login" first.';
      }
      
      return res.status(500).json({
        success: false,
        error: errorMsg,
        details: errorOutput || null
      });
    }
  } catch (error) {
    console.error('Error sending message to Cursor CLI:', error);
    return res.status(500).json({
      success: false,
      error: `Message failed: ${error.message}`
    });
  }
});

/**
 * Get installation instructions
 * GET /api/cursorcli/install-instructions
 */
router.get('/install-instructions', (req, res) => {
  res.json({
    success: true,
    instructions: {
      macos: 'curl https://cursor.com/install -fsS | bash',
      linux: 'curl https://cursor.com/install -fsS | bash',
      windows: "irm 'https://cursor.com/install?win32=true' | iex",
      docs: 'https://cursor.com/docs/cli/overview'
    }
  });
});

/**
 * Trigger the login flow for Cursor CLI
 * POST /api/cursorcli/login
 * 
 * This runs `agent login` which opens a browser for OAuth authentication
 */
router.post('/login', async (req, res) => {
  try {
    const installed = await isCursorCliInstalled();
    
    if (!installed) {
      return res.status(400).json({
        success: false,
        error: 'Cursor CLI is not installed. Install it first with: curl https://cursor.com/install -fsS | bash'
      });
    }

    const agentCmd = await findAgentCommand();
    if (!agentCmd) {
      return res.status(400).json({
        success: false,
        error: 'Cursor CLI command not found'
      });
    }

    // Run agent login - this opens a browser for OAuth
    // We use spawn instead of exec to not wait for completion
    const { spawn } = require('child_process');
    
    const loginProcess = spawn(agentCmd, ['login'], {
      detached: true,
      stdio: 'ignore',
      shell: true
    });

    // Don't wait for the process - it will open browser and handle auth
    loginProcess.unref();

    // Give it a moment to start, then check if it launched
    await new Promise(resolve => setTimeout(resolve, 500));

    return res.json({
      success: true,
      message: 'Login flow started. A browser window should open for authentication. Complete the login there, then return here and test the connection.'
    });
  } catch (error) {
    console.error('Error starting Cursor CLI login:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to start login: ${error.message}`
    });
  }
});

/**
 * Logout from Cursor CLI
 * POST /api/cursorcli/logout
 */
router.post('/logout', async (req, res) => {
  try {
    const installed = await isCursorCliInstalled();
    
    if (!installed) {
      return res.status(400).json({
        success: false,
        error: 'Cursor CLI is not installed'
      });
    }

    const agentCmd = await findAgentCommand();
    if (!agentCmd) {
      return res.status(400).json({
        success: false,
        error: 'Cursor CLI command not found'
      });
    }

    await execAsync(`"${agentCmd}" logout 2>&1`, { timeout: 10000 });

    return res.json({
      success: true,
      message: 'Logged out from Cursor CLI'
    });
  } catch (error) {
    console.error('Error logging out from Cursor CLI:', error);
    return res.status(500).json({
      success: false,
      error: `Logout failed: ${error.message}`
    });
  }
});

/**
 * List models directly from CLI (raw output)
 * GET /api/cursorcli/list-models
 * 
 * This returns the raw output from `agent models` to help identify correct model names
 */
router.get('/list-models', async (req, res) => {
  try {
    const installed = await isCursorCliInstalled();
    
    if (!installed) {
      return res.json({
        success: false,
        error: 'Cursor CLI is not installed'
      });
    }

    const agentCmd = await findAgentCommand();
    if (!agentCmd) {
      return res.json({
        success: false,
        error: 'Cursor CLI command not found'
      });
    }

    try {
      const { stdout, stderr } = await execAsync(`"${agentCmd}" models 2>&1`, { timeout: 15000 });
      const output = stdout || stderr;
      
      return res.json({
        success: true,
        rawOutput: output,
        message: 'Use the model IDs shown above in your configuration'
      });
    } catch (execError) {
      return res.json({
        success: false,
        error: execError.message,
        rawOutput: execError.stdout || execError.stderr || null
      });
    }
  } catch (error) {
    console.error('Error listing models:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to list models: ${error.message}`
    });
  }
});

/**
 * Get current authentication status
 * GET /api/cursorcli/auth-status
 */
router.get('/auth-status', async (req, res) => {
  try {
    const installed = await isCursorCliInstalled();
    
    if (!installed) {
      return res.json({
        success: true,
        installed: false,
        authenticated: false,
        message: 'Cursor CLI is not installed'
      });
    }

    const authStatus = await checkAuthStatus();

    return res.json({
      success: true,
      installed: true,
      authenticated: authStatus.authenticated,
      message: authStatus.output
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return res.status(500).json({
      success: false,
      error: `Status check failed: ${error.message}`
    });
  }
});

/**
 * Stream a message response from Cursor CLI using Server-Sent Events
 * POST /api/cursorcli/stream
 * 
 * This endpoint streams the response as it's generated, providing a better UX
 * than waiting for the complete response.
 */
router.post('/stream', async (req, res) => {
  try {
    const config = loadConfig();
    const cursorConfig = config.cursorCli;

    if (!cursorConfig?.enabled) {
      return res.status(400).json({
        success: false,
        error: 'Cursor CLI is not enabled'
      });
    }

    // Check authentication first
    const authStatus = await checkAuthStatus();
    if (!authStatus.authenticated) {
      return res.status(401).json({
        success: false,
        error: 'Cursor CLI is not authenticated. Please run "agent login" in your terminal first.'
      });
    }

    const { messages, model } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'messages field is required and must be a non-empty array'
      });
    }

    // Get the last user message
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      return res.status(400).json({
        success: false,
        error: 'No user message found'
      });
    }

    const selectedModel = model || cursorConfig.defaultModel || 'claude-4.5-sonnet';
    
    // Find the agent command
    const agentCmd = await findAgentCommand();
    if (!agentCmd) {
      return res.status(500).json({
        success: false,
        error: 'Cursor CLI (agent) command not found. Please ensure it is installed.'
      });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    const { spawn } = require('child_process');
    
    console.log('Streaming Cursor CLI with model:', selectedModel);

    // Build args array
    const args = [
      lastUserMessage.content,
      '-p',
      '--model', selectedModel,
      '--output-format', 'text'
    ];

    const child = spawn(agentCmd, args, {
      env: { ...process.env, TERM: 'dumb', CI: '1' },
      timeout: 120000
    });

    let hasError = false;

    // Stream stdout data as SSE events
    child.stdout.on('data', (data) => {
      const text = data.toString();
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    });

    // Capture stderr but don't immediately treat as error
    // (some tools output progress info to stderr)
    let stderrBuffer = '';
    child.stderr.on('data', (data) => {
      stderrBuffer += data.toString();
    });

    // Close stdin immediately to prevent waiting for input
    child.stdin.end();

    child.on('close', (code) => {
      console.log('Cursor CLI stream exited with code:', code);
      
      if (code !== 0 && stderrBuffer) {
        // Check for auth errors
        if (stderrBuffer.includes('not logged in') || stderrBuffer.includes('not authenticated')) {
          res.write(`data: ${JSON.stringify({ error: 'Session expired. Please run "agent login" to re-authenticate.' })}\n\n`);
        } else if (stderrBuffer.includes('model not found') || stderrBuffer.includes('invalid model')) {
          res.write(`data: ${JSON.stringify({ error: `Model "${selectedModel}" not available.` })}\n\n`);
        } else if (!hasError) {
          // Only send stderr as error if we haven't sent any content
          res.write(`data: ${JSON.stringify({ error: stderrBuffer.trim() })}\n\n`);
        }
      }
      
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });

    child.on('error', (error) => {
      console.error('Cursor CLI stream error:', error);
      hasError = true;
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
      console.log('Client disconnected, killing Cursor CLI process');
      child.kill();
    });

    // Timeout after 2 minutes
    const timeout = setTimeout(() => {
      console.log('Cursor CLI stream timed out');
      child.kill();
      res.write(`data: ${JSON.stringify({ error: 'Request timed out after 2 minutes' })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }, 120000);

    child.on('close', () => {
      clearTimeout(timeout);
    });

  } catch (error) {
    console.error('Error streaming from Cursor CLI:', error);
    
    // If headers haven't been sent yet, send JSON error
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: `Stream failed: ${error.message}`
      });
    }
    
    // Otherwise send SSE error
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
});

module.exports = router;
