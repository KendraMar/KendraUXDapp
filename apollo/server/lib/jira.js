const https = require('https');

/**
 * Helper function to make Jira API requests
 * @param {Object} config - Jira configuration with url, username, token
 * @param {string} endpoint - API endpoint path
 * @param {boolean} useBearer - Use Bearer auth instead of Basic auth
 * @returns {Promise<Object>} - Parsed JSON response
 */
function makeJiraRequest(config, endpoint, useBearer = false) {
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
            const errorMsg = titleMatch?.[1] || h1Match?.[1] || 'Jira returned an HTML error page';
            reject(new Error(`HTTP ${response.statusCode}: ${errorMsg}. Check your Jira URL, username, and token.`));
            return;
          }

          const jsonData = JSON.parse(data);
          if (response.statusCode >= 200 && response.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject(new Error(jsonData.errorMessages?.[0] || `HTTP ${response.statusCode}`));
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

module.exports = {
  makeJiraRequest
};


