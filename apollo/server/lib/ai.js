const https = require('https');
const http = require('http');

/**
 * Strip thinking tags from AI response (for reasoning models)
 * Removes <think>...</think> blocks and any similar reasoning markers
 * @param {string} text - The raw AI response text
 * @returns {string} - The cleaned response text
 */
function stripThinkingTags(text) {
  if (!text) return '';
  
  // Remove <think>...</think> blocks (including multiline)
  let cleaned = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // Remove <thinking>...</thinking> blocks (alternative tag)
  cleaned = cleaned.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  
  // Clean up extra whitespace that might be left behind
  cleaned = cleaned.replace(/^\s+/, '').replace(/\s+$/, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  return cleaned.trim();
}

/**
 * Helper function to make AI API requests (OpenAI-compatible)
 * @param {Object} aiConfig - AI configuration with apiUrl and model
 * @param {string} prompt - The prompt to send to the AI
 * @param {Object} requestOptions - Optional configuration
 * @param {string} requestOptions.systemPrompt - Custom system prompt
 * @param {number} requestOptions.maxTokens - Maximum tokens for response (omit to let server decide)
 * @param {number} requestOptions.temperature - Temperature for response (default 0.7)
 * @returns {Promise<string>} - The AI's response text
 */
function makeAiRequest(aiConfig, prompt, requestOptions = {}) {
  const {
    systemPrompt = 'You are a helpful assistant.',
    maxTokens,
    temperature = 0.7
  } = requestOptions;

  return new Promise((resolve, reject) => {
    const url = new URL('/v1/chat/completions', aiConfig.apiUrl);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const requestPayload = {
      model: aiConfig.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature
    };
    
    // Only include max_tokens if explicitly provided
    if (maxTokens !== undefined) {
      requestPayload.max_tokens = maxTokens;
    }
    
    const requestBody = JSON.stringify(requestPayload);

    const httpOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = httpModule.request(httpOptions, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (response.statusCode >= 200 && response.statusCode < 300) {
            const rawContent = jsonData.choices?.[0]?.message?.content || '';
            // Strip any thinking tags from the response
            const cleanedContent = stripThinkingTags(rawContent);
            resolve(cleanedContent);
          } else {
            reject(new Error(jsonData.error?.message || `HTTP ${response.statusCode}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse AI response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(requestBody);
    req.end();
  });
}

/**
 * Summarize an RSS article using AI
 * Uses a specialized system prompt optimized for article summarization
 * @param {Object} aiConfig - AI configuration with apiUrl and model
 * @param {string} title - The article title
 * @param {string} content - The article content (plain text, HTML tags should be stripped)
 * @returns {Promise<string>} - The AI-generated summary
 */
async function summarizeRssItem(aiConfig, title, content) {
  const systemPrompt = `You are a skilled article summarizer. Your task is to create clear, informative summaries of articles that:

1. Extract and highlight the most important points and key information
2. Keep the summary concise but comprehensive - don't omit crucial details
3. If the article title poses a question or makes a claim, make sure your summary explicitly answers that question or addresses that claim
4. Preserve any important facts, statistics, dates, or names mentioned
5. Maintain a neutral, informative tone
6. Structure the summary in a readable way with clear flow

Provide a summary that gives readers a complete understanding of the article's content without needing to read the full text.`;

  const prompt = `Please summarize the following article:

Title: ${title}

Content:
${content}`;

  const rawSummary = await makeAiRequest(aiConfig, prompt, {
    systemPrompt,
    temperature: 0.8
  });
  
  // Ensure any thinking tags are stripped before returning
  return stripThinkingTags(rawSummary);
}

module.exports = {
  makeAiRequest,
  stripThinkingTags,
  summarizeRssItem
};


