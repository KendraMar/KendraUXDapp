const https = require('https');

/**
 * Helper function to make Confluence API requests
 * @param {Object} config - Confluence configuration with url, username, token
 * @param {string} endpoint - API endpoint path
 * @param {boolean} useBearer - Use Bearer auth instead of Basic auth
 * @returns {Promise<Object>} - Parsed JSON response
 */
function makeConfluenceRequest(config, endpoint, useBearer = false) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, config.url);
    
    // Create auth header - try Basic Auth first, then Bearer if specified
    let authHeader;
    if (useBearer) {
      authHeader = `Bearer ${config.token}`;
    } else {
      const auth = Buffer.from(`${config.username}:${config.token}`).toString('base64');
      authHeader = `Basic ${auth}`;
    }
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          // Check if response is HTML (common for auth errors)
          if (data.trim().startsWith('<')) {
            // Extract error message from HTML if possible
            const titleMatch = data.match(/<title>(.*?)<\/title>/i);
            const h1Match = data.match(/<h1>(.*?)<\/h1>/i);
            const errorMsg = titleMatch?.[1] || h1Match?.[1] || 'Confluence returned an HTML error page';
            reject(new Error(`HTTP ${response.statusCode}: ${errorMsg}. Check your Confluence URL, username, and token.`));
            return;
          }

          const jsonData = JSON.parse(data);
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject(new Error(jsonData.message || jsonData.errorMessages?.[0] || `HTTP ${response.statusCode}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response (HTTP ${response.statusCode}): ${error.message}. Response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

/**
 * Parse space key from a Confluence URL
 * @param {string} urlString - Full Confluence URL
 * @returns {Object} - Parsed space key and page id if available
 */
function parseConfluenceUrl(urlString) {
  try {
    const url = new URL(urlString);
    const pathParts = url.pathname.split('/');
    
    // Handle new Confluence Cloud URLs like /spaces/SPACEKEY/pages/PAGEID/Title
    const spacesIndex = pathParts.indexOf('spaces');
    if (spacesIndex !== -1 && pathParts[spacesIndex + 1]) {
      const spaceKey = pathParts[spacesIndex + 1];
      const pagesIndex = pathParts.indexOf('pages');
      let pageId = null;
      
      if (pagesIndex !== -1 && pathParts[pagesIndex + 1]) {
        pageId = pathParts[pagesIndex + 1];
      }
      
      return { spaceKey, pageId };
    }
    
    // Handle older Confluence URLs like /display/SPACEKEY/Page+Title
    const displayIndex = pathParts.indexOf('display');
    if (displayIndex !== -1 && pathParts[displayIndex + 1]) {
      return { 
        spaceKey: pathParts[displayIndex + 1],
        pageId: null
      };
    }
    
    // Handle wiki URLs like /wiki/spaces/SPACEKEY/...
    const wikiIndex = pathParts.indexOf('wiki');
    if (wikiIndex !== -1) {
      const afterWiki = pathParts.slice(wikiIndex + 1);
      const spacesIdx = afterWiki.indexOf('spaces');
      if (spacesIdx !== -1 && afterWiki[spacesIdx + 1]) {
        const spaceKey = afterWiki[spacesIdx + 1];
        const pagesIdx = afterWiki.indexOf('pages');
        let pageId = null;
        
        if (pagesIdx !== -1 && afterWiki[pagesIdx + 1]) {
          pageId = afterWiki[pagesIdx + 1];
        }
        
        return { spaceKey, pageId };
      }
    }
    
    return { spaceKey: null, pageId: null };
  } catch (error) {
    return { spaceKey: null, pageId: null };
  }
}

/**
 * Extract base Confluence URL from a page URL
 * @param {string} urlString - Full Confluence URL
 * @returns {string} - Base Confluence URL
 */
function getBaseUrl(urlString) {
  try {
    const url = new URL(urlString);
    // For Confluence Cloud, the base is typically just the origin
    return url.origin;
  } catch (error) {
    return null;
  }
}

/**
 * Determine the API prefix based on the Confluence instance type
 * Confluence Cloud uses /wiki/rest/api, Data Center uses /rest/api
 * @param {string} urlString - Confluence URL
 * @returns {string} - API prefix path
 */
function getApiPrefix(urlString) {
  try {
    const url = new URL(urlString);
    // Check if URL contains /wiki/ - indicates Cloud
    // Data Center instances like spaces.redhat.com don't have /wiki/ prefix
    if (url.pathname.includes('/wiki/')) {
      return '/wiki/rest/api';
    }
    // Check if hostname suggests it's an Atlassian Cloud instance
    if (url.hostname.includes('.atlassian.net')) {
      return '/wiki/rest/api';
    }
    // Default to Data Center format (no /wiki prefix)
    return '/rest/api';
  } catch (error) {
    return '/rest/api';
  }
}

/**
 * Get the URL prefix for viewing pages in the browser
 * @param {string} urlString - Confluence URL
 * @returns {string} - View prefix path
 */
function getViewPrefix(urlString) {
  try {
    const url = new URL(urlString);
    if (url.pathname.includes('/wiki/') || url.hostname.includes('.atlassian.net')) {
      return '/wiki';
    }
    return '';
  } catch (error) {
    return '';
  }
}

module.exports = {
  makeConfluenceRequest,
  parseConfluenceUrl,
  getBaseUrl,
  getApiPrefix,
  getViewPrefix
};
