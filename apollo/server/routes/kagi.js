const express = require('express');
const { loadConfig } = require('../lib/config');

const router = express.Router();

// Helper to parse Kagi error responses
function parseKagiError(responseBody) {
  try {
    const data = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
    if (data.error && Array.isArray(data.error) && data.error.length > 0) {
      return {
        message: data.error[0].msg || 'Unknown Kagi API error',
        code: data.error[0].code,
        balance: data.meta?.api_balance
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Test Kagi connection
router.get('/test', async (req, res) => {
  try {
    const config = loadConfig();
    const apiKey = config.kagi?.apiKey;

    if (!apiKey) {
      return res.json({ success: false, error: 'No Kagi API key configured. Add your API key in Settings → Integrations.' });
    }

    // Do a simple search to verify the key works
    const response = await fetch('https://kagi.com/api/v0/search?q=test&limit=1', {
      headers: {
        'Authorization': `Bot ${apiKey}`
      }
    });

    const data = await response.json();

    // Check for Kagi-specific errors
    if (data.error && Array.isArray(data.error) && data.error.length > 0) {
      const kagiError = data.error[0];
      const balance = data.meta?.api_balance;
      let errorMsg = kagiError.msg || 'Unknown error';
      
      // Add helpful context for common errors
      if (kagiError.msg?.includes('beta') || kagiError.msg?.includes('Unauthorized')) {
        errorMsg = `Kagi Search API access required. The Search API is in closed beta — email support@kagi.com to request access.${balance !== undefined ? ` (API balance: $${balance.toFixed(2)})` : ''}`;
      } else if (balance !== undefined && balance <= 0) {
        errorMsg = `API key is valid but balance is $0.00. Add funds at kagi.com/settings/billing_api`;
      }
      
      return res.json({ success: false, error: errorMsg });
    }

    if (!response.ok) {
      return res.json({ success: false, error: `Kagi API returned status ${response.status}` });
    }

    const balance = data.meta?.api_balance;

    res.json({
      success: true,
      message: `Connected to Kagi successfully!${balance !== undefined ? ` API balance: $${balance.toFixed(2)}` : ''}`,
      balance
    });
  } catch (error) {
    res.json({ success: false, error: `Connection failed: ${error.message}` });
  }
});

// Check if Kagi is available (has API key configured)
router.get('/status', (req, res) => {
  try {
    const config = loadConfig();
    const hasApiKey = !!config.kagi?.apiKey;
    res.json({ success: true, available: hasApiKey });
  } catch (error) {
    res.json({ success: false, available: false });
  }
});

// Perform a Kagi search
router.get('/search', async (req, res) => {
  try {
    const config = loadConfig();
    const apiKey = config.kagi?.apiKey;

    if (!apiKey) {
      return res.status(401).json({ success: false, error: 'No Kagi API key configured' });
    }

    const { q, limit } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
    }

    const params = new URLSearchParams({ q });
    if (limit) {
      params.set('limit', limit);
    }

    const response = await fetch(`https://kagi.com/api/v0/search?${params.toString()}`, {
      headers: {
        'Authorization': `Bot ${apiKey}`
      }
    });

    const data = await response.json();

    // Check for Kagi-specific errors in the response body
    if (data.error && Array.isArray(data.error) && data.error.length > 0) {
      const kagiError = data.error[0];
      let errorMsg = kagiError.msg || 'Unknown Kagi error';
      
      if (kagiError.msg?.includes('beta') || kagiError.msg?.includes('Unauthorized')) {
        errorMsg = 'Kagi Search API is in closed beta. Email support@kagi.com to request access.';
      }
      
      return res.status(response.status || 401).json({ success: false, error: errorMsg });
    }

    if (!response.ok) {
      return res.status(response.status).json({ success: false, error: `Kagi API returned status ${response.status}` });
    }

    // Parse search results and related searches
    const results = [];
    const relatedSearches = [];

    if (data.data) {
      for (const item of data.data) {
        if (item.t === 0) {
          // Search result
          results.push({
            url: item.url,
            title: item.title,
            snippet: item.snippet || '',
            published: item.published || null,
            thumbnail: item.thumbnail || null
          });
        } else if (item.t === 1) {
          // Related searches
          relatedSearches.push(...(item.list || []));
        }
      }
    }

    res.json({
      success: true,
      meta: {
        id: data.meta?.id,
        ms: data.meta?.ms,
        apiBalance: data.meta?.api_balance
      },
      results,
      relatedSearches
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Search failed: ${error.message}` });
  }
});

module.exports = router;
