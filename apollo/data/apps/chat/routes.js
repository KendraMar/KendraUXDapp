const express = require('express');
const https = require('https');
const http = require('http');
const { loadAiConfig } = require('../../../server/lib/config');

const router = express.Router();

// API endpoint to fetch available models from the AI server
router.get('/models', async (req, res) => {
  const aiConfig = loadAiConfig();
  
  if (!aiConfig || !aiConfig.apiUrl) {
    return res.status(400).json({ 
      success: false, 
      error: 'AI is not configured. Please edit data/config.json with your AI API settings.',
      models: []
    });
  }

  try {
    const url = new URL('/v1/models', aiConfig.apiUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const proxyReq = httpModule.request(options, (proxyRes) => {
      let data = '';

      proxyRes.on('data', (chunk) => {
        data += chunk;
      });

      proxyRes.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          // OpenAI-compatible API returns { data: [...models] }
          const models = jsonData.data || jsonData.models || [];
          res.json({
            success: true,
            models: models,
            currentModel: aiConfig.model
          });
        } catch (error) {
          console.error('Error parsing models response:', error);
          res.status(500).json({
            success: false,
            error: `Failed to parse models response: ${error.message}`,
            models: []
          });
        }
      });
    });

    proxyReq.on('error', (error) => {
      console.error('Error fetching models:', error);
      res.status(500).json({
        success: false,
        error: `Failed to fetch models: ${error.message}`,
        models: []
      });
    });

    proxyReq.end();
  } catch (error) {
    console.error('Error in models endpoint:', error);
    res.status(500).json({
      success: false,
      error: `Models fetch failed: ${error.message}`,
      models: []
    });
  }
});

// API endpoint for chat completions (proxy to AI model)
router.post('/completions', async (req, res) => {
  const aiConfig = loadAiConfig();
  
  if (!aiConfig || !aiConfig.apiUrl || !aiConfig.model) {
    return res.status(400).json({ 
      success: false, 
      error: 'AI is not configured. Please edit data/config.json with your AI API settings.'
    });
  }

  try {
    const { messages, temperature, max_tokens, model, top_p, frequency_penalty, presence_penalty } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'messages field is required and must be an array'
      });
    }

    // Use model from request body if provided, otherwise use config default
    const selectedModel = model || aiConfig.model;

    const url = new URL('/v1/chat/completions', aiConfig.apiUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    // Build request body with optional parameters
    const bodyObj = {
      model: selectedModel,
      messages: messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 2000
    };
    if (top_p !== undefined) bodyObj.top_p = top_p;
    if (frequency_penalty !== undefined) bodyObj.frequency_penalty = frequency_penalty;
    if (presence_penalty !== undefined) bodyObj.presence_penalty = presence_penalty;

    const requestBody = JSON.stringify(bodyObj);

    console.log('Proxying chat request to AI model:', {
      url: url.toString(),
      model: selectedModel,
      messageCount: messages.length
    });

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const proxyReq = httpModule.request(options, (proxyRes) => {
      let data = '';

      proxyRes.on('data', (chunk) => {
        data += chunk;
      });

      proxyRes.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          res.status(proxyRes.statusCode).json(jsonData);
        } catch (error) {
          console.error('Error parsing AI response:', error);
          res.status(500).json({
            success: false,
            error: `Failed to parse AI response: ${error.message}`
          });
        }
      });
    });

    proxyReq.on('error', (error) => {
      console.error('Error connecting to AI model:', error);
      res.status(500).json({
        success: false,
        error: `Failed to connect to AI model: ${error.message}`
      });
    });

    proxyReq.write(requestBody);
    proxyReq.end();
  } catch (error) {
    console.error('Error in chat completion proxy:', error);
    res.status(500).json({
      success: false,
      error: `Chat completion failed: ${error.message}`
    });
  }
});

// API endpoint for streaming chat completions (SSE proxy to AI model)
router.post('/stream', async (req, res) => {
  const aiConfig = loadAiConfig();
  
  if (!aiConfig || !aiConfig.apiUrl || !aiConfig.model) {
    return res.status(400).json({ 
      success: false, 
      error: 'AI is not configured. Please edit data/config.json with your AI API settings.'
    });
  }

  try {
    const { messages, temperature, max_tokens, model, top_p, frequency_penalty, presence_penalty } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'messages field is required and must be an array'
      });
    }

    // Use model from request body if provided, otherwise use config default
    const selectedModel = model || aiConfig.model;

    const url = new URL('/v1/chat/completions', aiConfig.apiUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    // Build request body with optional parameters
    const bodyObj = {
      model: selectedModel,
      messages: messages,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 2000,
      stream: true
    };
    if (top_p !== undefined) bodyObj.top_p = top_p;
    if (frequency_penalty !== undefined) bodyObj.frequency_penalty = frequency_penalty;
    if (presence_penalty !== undefined) bodyObj.presence_penalty = presence_penalty;

    const requestBody = JSON.stringify(bodyObj);

    console.log('Streaming chat request to AI model:', {
      url: url.toString(),
      model: selectedModel,
      messageCount: messages.length
    });

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const proxyReq = httpModule.request(options, (proxyRes) => {
      if (proxyRes.statusCode !== 200) {
        let errorData = '';
        proxyRes.on('data', chunk => { errorData += chunk; });
        proxyRes.on('end', () => {
          try {
            const parsed = JSON.parse(errorData);
            res.write(`data: ${JSON.stringify({ error: parsed.error?.message || 'AI API error' })}\n\n`);
          } catch {
            res.write(`data: ${JSON.stringify({ error: `AI API returned status ${proxyRes.statusCode}` })}\n\n`);
          }
          res.end();
        });
        return;
      }

      let buffer = '';

      proxyRes.on('data', (chunk) => {
        buffer += chunk.toString();
        
        // Process complete lines from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              // OpenAI-compatible streaming format: choices[0].delta.content
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
              }
              // Check for finish_reason to signal completion
              const finishReason = parsed.choices?.[0]?.finish_reason;
              if (finishReason === 'stop') {
                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
              }
            } catch (parseError) {
              // Skip invalid JSON lines
            }
          }
        }
      });

      proxyRes.on('end', () => {
        // Process any remaining buffer
        if (buffer.trim()) {
          const lines = buffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
                }
              } catch {
                // Skip
              }
            }
          }
        }
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      });

      proxyRes.on('error', (error) => {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      });
    });

    proxyReq.on('error', (error) => {
      console.error('Error connecting to AI model for streaming:', error);
      res.write(`data: ${JSON.stringify({ error: `Failed to connect to AI model: ${error.message}` })}\n\n`);
      res.end();
    });

    // Handle client disconnect
    req.on('close', () => {
      proxyReq.destroy();
    });

    proxyReq.write(requestBody);
    proxyReq.end();
  } catch (error) {
    console.error('Error in streaming chat completion proxy:', error);
    res.write(`data: ${JSON.stringify({ error: `Chat stream failed: ${error.message}` })}\n\n`);
    res.end();
  }
});

module.exports = router;
