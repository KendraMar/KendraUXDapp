const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { loadConfig, dataDir } = require('../lib/config');

const execAsync = promisify(exec);
const router = express.Router();

// Directory for storing Claude Code conversations
const chatsDir = path.join(dataDir, 'chats');

// Ensure chats directory exists
if (!fs.existsSync(chatsDir)) {
  fs.mkdirSync(chatsDir, { recursive: true });
}

/**
 * Get Google Cloud access token using gcloud CLI
 */
async function getGcloudAccessToken() {
  try {
    const { stdout } = await execAsync('gcloud auth print-access-token');
    return stdout.trim();
  } catch (error) {
    throw new Error(`Failed to get gcloud access token: ${error.message}. Make sure you've run 'gcloud auth application-default login'.`);
  }
}

/**
 * Check if Claude Code is configured (either API key or Vertex AI)
 */
function isConfigured(claudeConfig) {
  if (!claudeConfig) return false;
  if (claudeConfig.authType === 'vertex') {
    return claudeConfig.vertexProjectId && claudeConfig.vertexRegion;
  }
  return !!claudeConfig.apiKey;
}

/**
 * Get the default model based on auth type
 */
function getDefaultModel(claudeConfig) {
  if (claudeConfig?.model) return claudeConfig.model;
  if (claudeConfig?.authType === 'vertex') {
    return 'claude-sonnet-4@20250514';
  }
  return 'claude-sonnet-4-20250514';
}

/**
 * Helper function to make requests to the Anthropic API (direct)
 */
const makeAnthropicRequest = (apiKey, body, onData, onEnd, onError) => {
  const requestBody = JSON.stringify(body);

  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(requestBody)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
      if (onData) onData(chunk.toString(), res.statusCode);
    });

    res.on('end', () => {
      if (onEnd) onEnd(data, res.statusCode);
    });
  });

  req.on('error', (error) => {
    if (onError) onError(error);
  });

  req.write(requestBody);
  req.end();

  return req;
};

/**
 * Helper function for streaming Anthropic requests (direct API)
 */
const makeAnthropicStreamRequest = (apiKey, body) => {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({ ...body, stream: true });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      resolve(res);
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
};

/**
 * Helper function to make requests to Vertex AI Claude
 */
const makeVertexRequest = async (projectId, region, model, body, accessToken) => {
  return new Promise((resolve, reject) => {
    // Vertex AI uses a different request format
    const vertexBody = {
      anthropic_version: 'vertex-2023-10-16',
      messages: body.messages,
      max_tokens: body.max_tokens || 4096,
      stream: body.stream || false
    };
    
    if (body.system) {
      vertexBody.system = body.system;
    }

    const requestBody = JSON.stringify(vertexBody);
    const endpoint = body.stream ? 'streamRawPredict' : 'rawPredict';

    const options = {
      hostname: `${region}-aiplatform.googleapis.com`,
      port: 443,
      path: `/v1/projects/${projectId}/locations/${region}/publishers/anthropic/models/${model}:${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      if (body.stream) {
        resolve(res);
      } else {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({ data, statusCode: res.statusCode });
        });
      }
    });

    req.on('error', reject);
    req.write(requestBody);
    req.end();
  });
};

/**
 * Fetch available models from Vertex AI
 */
async function fetchVertexModels(projectId, region, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: `${region}-aiplatform.googleapis.com`,
      port: 443,
      path: `/v1/projects/${projectId}/locations/${region}/publishers/anthropic/models`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ data, statusCode: res.statusCode });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Parse model name to create a friendly display name
 */
function getModelDisplayName(modelId) {
  // Common mappings for Claude models
  const nameMap = {
    'claude-sonnet-4': 'Claude Sonnet 4',
    'claude-3-7-sonnet': 'Claude 3.7 Sonnet',
    'claude-3-5-sonnet-v2': 'Claude 3.5 Sonnet v2',
    'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
    'claude-3-5-haiku': 'Claude 3.5 Haiku',
    'claude-3-opus': 'Claude 3 Opus',
    'claude-3-sonnet': 'Claude 3 Sonnet',
    'claude-3-haiku': 'Claude 3 Haiku'
  };

  // Extract base name (before @ or version date)
  const baseName = modelId.split('@')[0].split('-202')[0];
  
  for (const [key, name] of Object.entries(nameMap)) {
    if (baseName.includes(key) || modelId.includes(key)) {
      return name;
    }
  }
  
  // Fallback: capitalize and format
  return modelId.replace(/@.*$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Get Claude Code configuration status and available models
 * GET /api/claudecode/models
 */
router.get('/models', async (req, res) => {
  try {
    const config = loadConfig();
    const claudeConfig = config.claudeCode;

    if (!isConfigured(claudeConfig)) {
      return res.json({
        success: false,
        error: 'Claude Code is not configured. Please configure it in Settings.',
        models: []
      });
    }

    const isVertex = claudeConfig.authType === 'vertex';
    let claudeModels = [];

    if (isVertex) {
      // Try to fetch available models from Vertex AI
      try {
        const accessToken = await getGcloudAccessToken();
        const result = await fetchVertexModels(
          claudeConfig.vertexProjectId,
          claudeConfig.vertexRegion,
          accessToken
        );

        if (result.statusCode === 200) {
          const data = JSON.parse(result.data);
          const models = data.models || data.publisherModels || [];
          
          if (models.length > 0) {
            claudeModels = models.map(model => {
              // Model name format can be full path or just the model ID
              const modelId = model.name?.split('/').pop() || model.modelId || model;
              return {
                id: modelId,
                name: getModelDisplayName(modelId),
                provider: 'claudecode',
                description: model.description || `Claude model via Vertex AI`
              };
            });
            
            // Sort to put newer/better models first
            const priority = ['sonnet-4', '3-7-sonnet', '3-5-sonnet', 'opus', 'haiku'];
            claudeModels.sort((a, b) => {
              const aIdx = priority.findIndex(p => a.id.includes(p));
              const bIdx = priority.findIndex(p => b.id.includes(p));
              return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
            });
          }
        }
      } catch (fetchError) {
        console.log('Could not fetch Vertex AI models dynamically:', fetchError.message);
      }

      // Fallback to static list if dynamic fetch failed or returned empty
      if (claudeModels.length === 0) {
        claudeModels = [
          {
            id: 'claude-sonnet-4@20250514',
            name: 'Claude Sonnet 4',
            provider: 'claudecode',
            description: 'Anthropic\'s latest balanced model (Vertex AI)'
          },
          {
            id: 'claude-3-5-sonnet-v2@20241022',
            name: 'Claude 3.5 Sonnet v2',
            provider: 'claudecode',
            description: 'Fast and capable model (Vertex AI)'
          },
          {
            id: 'claude-3-5-haiku@20241022',
            name: 'Claude 3.5 Haiku',
            provider: 'claudecode',
            description: 'Fastest model for quick tasks (Vertex AI)'
          },
          {
            id: 'claude-3-opus@20240229',
            name: 'Claude 3 Opus',
            provider: 'claudecode',
            description: 'Most capable model (Vertex AI)'
          }
        ];
      }
    } else {
      // Direct Anthropic API - static list of available models
      claudeModels = [
        {
          id: 'claude-sonnet-4-20250514',
          name: 'Claude Sonnet 4',
          provider: 'claudecode',
          description: 'Anthropic\'s latest balanced model'
        },
        {
          id: 'claude-3-7-sonnet-20250219',
          name: 'Claude 3.7 Sonnet',
          provider: 'claudecode',
          description: 'High-performance balanced model'
        },
        {
          id: 'claude-3-5-sonnet-20241022',
          name: 'Claude 3.5 Sonnet',
          provider: 'claudecode',
          description: 'Fast and capable model'
        },
        {
          id: 'claude-3-5-haiku-20241022',
          name: 'Claude 3.5 Haiku',
          provider: 'claudecode',
          description: 'Fastest model for quick tasks'
        },
        {
          id: 'claude-3-opus-20240229',
          name: 'Claude 3 Opus',
          provider: 'claudecode',
          description: 'Most capable model'
        }
      ];
    }

    const defaultModel = getDefaultModel(claudeConfig);

    return res.json({
      success: true,
      models: claudeModels,
      defaultModel,
      configured: true,
      authType: claudeConfig.authType || 'apiKey'
    });
  } catch (error) {
    console.error('Error fetching Claude Code models:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch models: ${error.message}`,
      models: []
    });
  }
});

/**
 * Test Claude Code connection
 * GET /api/claudecode/test
 */
router.get('/test', async (req, res) => {
  try {
    const config = loadConfig();
    const claudeConfig = config.claudeCode;

    if (!isConfigured(claudeConfig)) {
      return res.status(400).json({
        success: false,
        error: 'Claude Code is not configured. Please configure it in Settings.'
      });
    }

    const isVertex = claudeConfig.authType === 'vertex';
    const testModel = getDefaultModel(claudeConfig);

    if (isVertex) {
      // Test Vertex AI connection
      try {
        const accessToken = await getGcloudAccessToken();
        const result = await makeVertexRequest(
          claudeConfig.vertexProjectId,
          claudeConfig.vertexRegion,
          testModel,
          {
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 10
          },
          accessToken
        );

        if (result.statusCode === 200) {
          return res.json({ 
            success: true, 
            message: `Vertex AI connection successful (Project: ${claudeConfig.vertexProjectId}, Region: ${claudeConfig.vertexRegion})`
          });
        } else {
          try {
            const errorData = JSON.parse(result.data);
            return res.status(result.statusCode).json({
              success: false,
              error: errorData.error?.message || `Vertex AI returned status ${result.statusCode}`
            });
          } catch {
            return res.status(result.statusCode).json({
              success: false,
              error: `Vertex AI returned status ${result.statusCode}`
            });
          }
        }
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
    } else {
      // Test direct Anthropic API connection
      const testBody = {
        model: testModel,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      };

      makeAnthropicRequest(
        claudeConfig.apiKey,
        testBody,
        null,
        (data, statusCode) => {
          if (statusCode === 200) {
            return res.json({ success: true, message: 'Anthropic API connection successful' });
          } else {
            try {
              const errorData = JSON.parse(data);
              return res.status(statusCode).json({
                success: false,
                error: errorData.error?.message || `API returned status ${statusCode}`
              });
            } catch {
              return res.status(statusCode).json({
                success: false,
                error: `API returned status ${statusCode}`
              });
            }
          }
        },
        (error) => {
          return res.status(500).json({
            success: false,
            error: `Connection failed: ${error.message}`
          });
        }
      );
    }
  } catch (error) {
    console.error('Error testing Claude Code connection:', error);
    return res.status(500).json({
      success: false,
      error: `Test failed: ${error.message}`
    });
  }
});

/**
 * Send a message to Claude Code (non-streaming)
 * POST /api/claudecode/message
 */
router.post('/message', async (req, res) => {
  try {
    const config = loadConfig();
    const claudeConfig = config.claudeCode;

    if (!isConfigured(claudeConfig)) {
      return res.status(400).json({
        success: false,
        error: 'Claude Code is not configured'
      });
    }

    const { messages, model, pageContext, conversationId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'messages field is required and must be an array'
      });
    }

    // Build system prompt with page context if provided
    let systemPrompt = 'You are Claude Code, an AI assistant integrated into Apollo. You help users with coding tasks, design discussions, and general questions. Be helpful, concise, and provide actionable advice.';
    
    if (pageContext) {
      systemPrompt += `\n\nThe user is currently viewing the following page in Apollo:\n${pageContext}`;
    }

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map(msg => ({
      role: msg.role === 'bot' || msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const isVertex = claudeConfig.authType === 'vertex';
    const selectedModel = model || getDefaultModel(claudeConfig);

    if (isVertex) {
      try {
        const accessToken = await getGcloudAccessToken();
        const result = await makeVertexRequest(
          claudeConfig.vertexProjectId,
          claudeConfig.vertexRegion,
          selectedModel,
          {
            messages: anthropicMessages,
            system: systemPrompt,
            max_tokens: 4096
          },
          accessToken
        );

        if (result.statusCode === 200) {
          try {
            const responseData = JSON.parse(result.data);
            const content = responseData.content?.[0]?.text || '';
            
            if (conversationId) {
              saveConversation(conversationId, messages, content);
            }

            return res.json({
              success: true,
              content,
              model: selectedModel,
              usage: responseData.usage
            });
          } catch (parseError) {
            return res.status(500).json({
              success: false,
              error: 'Failed to parse Vertex AI response'
            });
          }
        } else {
          try {
            const errorData = JSON.parse(result.data);
            return res.status(result.statusCode).json({
              success: false,
              error: errorData.error?.message || `Vertex AI returned status ${result.statusCode}`
            });
          } catch {
            return res.status(result.statusCode).json({
              success: false,
              error: `Vertex AI returned status ${result.statusCode}`
            });
          }
        }
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
    } else {
      const requestBody = {
        model: selectedModel,
        max_tokens: 4096,
        system: systemPrompt,
        messages: anthropicMessages
      };

      makeAnthropicRequest(
        claudeConfig.apiKey,
        requestBody,
        null,
        (data, statusCode) => {
          if (statusCode === 200) {
            try {
              const responseData = JSON.parse(data);
              const content = responseData.content?.[0]?.text || '';
              
              if (conversationId) {
                saveConversation(conversationId, messages, content);
              }

              return res.json({
                success: true,
                content,
                model: responseData.model,
                usage: responseData.usage
              });
            } catch (parseError) {
              return res.status(500).json({
                success: false,
                error: 'Failed to parse API response'
              });
            }
          } else {
            try {
              const errorData = JSON.parse(data);
              return res.status(statusCode).json({
                success: false,
                error: errorData.error?.message || `API returned status ${statusCode}`
              });
            } catch {
              return res.status(statusCode).json({
                success: false,
                error: `API returned status ${statusCode}`
              });
            }
          }
        },
        (error) => {
          return res.status(500).json({
            success: false,
            error: `Request failed: ${error.message}`
          });
        }
      );
    }
  } catch (error) {
    console.error('Error sending message to Claude Code:', error);
    return res.status(500).json({
      success: false,
      error: `Message failed: ${error.message}`
    });
  }
});

/**
 * Send a message to Claude Code with streaming
 * POST /api/claudecode/stream
 */
router.post('/stream', async (req, res) => {
  try {
    const config = loadConfig();
    const claudeConfig = config.claudeCode;

    if (!isConfigured(claudeConfig)) {
      return res.status(400).json({
        success: false,
        error: 'Claude Code is not configured'
      });
    }

    const { messages, model, pageContext, conversationId } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'messages field is required and must be an array'
      });
    }

    // Build system prompt with page context if provided
    let systemPrompt = 'You are Claude Code, an AI assistant integrated into Apollo. You help users with coding tasks, design discussions, and general questions. Be helpful, concise, and provide actionable advice.';
    
    if (pageContext) {
      systemPrompt += `\n\nThe user is currently viewing the following page in Apollo:\n${pageContext}`;
    }

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map(msg => ({
      role: msg.role === 'bot' || msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    const isVertex = claudeConfig.authType === 'vertex';
    const selectedModel = model || getDefaultModel(claudeConfig);

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    let fullContent = '';

    try {
      let stream;

      if (isVertex) {
        const accessToken = await getGcloudAccessToken();
        stream = await makeVertexRequest(
          claudeConfig.vertexProjectId,
          claudeConfig.vertexRegion,
          selectedModel,
          {
            messages: anthropicMessages,
            system: systemPrompt,
            max_tokens: 4096,
            stream: true
          },
          accessToken
        );
      } else {
        const requestBody = {
          model: selectedModel,
          max_tokens: 4096,
          system: systemPrompt,
          messages: anthropicMessages
        };
        stream = await makeAnthropicStreamRequest(claudeConfig.apiKey, requestBody);
      }
      
      if (stream.statusCode !== 200) {
        let errorData = '';
        stream.on('data', chunk => { errorData += chunk; });
        stream.on('end', () => {
          try {
            const parsed = JSON.parse(errorData);
            res.write(`data: ${JSON.stringify({ error: parsed.error?.message || 'API error' })}\n\n`);
          } catch {
            res.write(`data: ${JSON.stringify({ error: `API returned status ${stream.statusCode}` })}\n\n`);
          }
          res.end();
        });
        return;
      }

      let buffer = '';

      stream.on('data', (chunk) => {
        buffer += chunk.toString();
        
        // Process complete events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                fullContent += parsed.delta.text;
                res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
              } else if (parsed.type === 'message_stop') {
                // Save conversation when complete
                if (conversationId) {
                  saveConversation(conversationId, messages, fullContent);
                }
                res.write(`data: ${JSON.stringify({ done: true, content: fullContent })}\n\n`);
              } else if (parsed.type === 'error') {
                res.write(`data: ${JSON.stringify({ error: parsed.error?.message || 'Stream error' })}\n\n`);
              }
            } catch (parseError) {
              // Skip invalid JSON
            }
          }
        }
      });

      stream.on('end', () => {
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      });

      stream.on('error', (error) => {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      });

    } catch (streamError) {
      res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('Error streaming from Claude Code:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

/**
 * Save a conversation to the data/chats folder
 */
function saveConversation(conversationId, messages, assistantResponse) {
  try {
    const conversationDir = path.join(chatsDir, conversationId);
    
    if (!fs.existsSync(conversationDir)) {
      fs.mkdirSync(conversationDir, { recursive: true });
    }

    const chatFile = path.join(conversationDir, 'chat.json');
    
    let conversation = {
      id: conversationId,
      provider: 'claudecode',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    // Load existing conversation if it exists
    if (fs.existsSync(chatFile)) {
      try {
        conversation = JSON.parse(fs.readFileSync(chatFile, 'utf-8'));
      } catch {
        // Use default if parse fails
      }
    }

    // Add new messages
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage) {
      conversation.messages.push({
        role: 'user',
        content: lastUserMessage.content,
        timestamp: new Date().toISOString()
      });
    }

    conversation.messages.push({
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date().toISOString()
    });

    conversation.updatedAt = new Date().toISOString();

    fs.writeFileSync(chatFile, JSON.stringify(conversation, null, 2));
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

/**
 * List all Claude Code conversations
 * GET /api/claudecode/conversations
 */
router.get('/conversations', async (req, res) => {
  try {
    if (!fs.existsSync(chatsDir)) {
      return res.json({ success: true, conversations: [] });
    }

    const conversations = [];
    const dirs = fs.readdirSync(chatsDir);

    for (const dir of dirs) {
      const chatFile = path.join(chatsDir, dir, 'chat.json');
      if (fs.existsSync(chatFile)) {
        try {
          const data = JSON.parse(fs.readFileSync(chatFile, 'utf-8'));
          if (data.provider === 'claudecode') {
            conversations.push({
              id: data.id,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              messageCount: data.messages?.length || 0,
              preview: data.messages?.[0]?.content?.substring(0, 100) || ''
            });
          }
        } catch {
          // Skip invalid files
        }
      }
    }

    // Sort by most recent
    conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.json({ success: true, conversations });
  } catch (error) {
    console.error('Error listing conversations:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to list conversations: ${error.message}`
    });
  }
});

/**
 * Get a specific conversation
 * GET /api/claudecode/conversations/:id
 */
router.get('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chatFile = path.join(chatsDir, id, 'chat.json');

    if (!fs.existsSync(chatFile)) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    const data = JSON.parse(fs.readFileSync(chatFile, 'utf-8'));
    return res.json({ success: true, conversation: data });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch conversation: ${error.message}`
    });
  }
});

/**
 * Delete a conversation
 * DELETE /api/claudecode/conversations/:id
 */
router.delete('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conversationDir = path.join(chatsDir, id);

    if (!fs.existsSync(conversationDir)) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Remove the directory and its contents
    fs.rmSync(conversationDir, { recursive: true });

    return res.json({ success: true, message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to delete conversation: ${error.message}`
    });
  }
});

module.exports = router;
