const https = require('https');
const fs = require('fs');
const path = require('path');
const { slackCacheDir } = require('./config');

/**
 * Helper function to make Slack API requests
 * Supports both GET with query params and POST with form data (better for enterprise)
 * @param {Object} slackConfig - Slack configuration with xoxcToken and xoxdToken
 * @param {string} endpoint - API endpoint path
 * @param {string} method - HTTP method (GET or POST)
 * @param {Object} formData - Form data for POST requests
 * @returns {Promise<Object>} - Parsed JSON response
 */
function makeSlackRequest(slackConfig, endpoint, method = 'GET', formData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, 'https://slack.com');
    
    // For POST requests, use form-urlencoded which works better with enterprise Slack
    let postBody = null;
    let contentType = 'application/json; charset=utf-8';
    
    if (method === 'POST' && formData) {
      const params = new URLSearchParams();
      params.append('token', slackConfig.xoxcToken);
      for (const [key, value] of Object.entries(formData)) {
        params.append(key, value);
      }
      postBody = params.toString();
      contentType = 'application/x-www-form-urlencoded';
    }
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${slackConfig.xoxcToken}`,
        'Cookie': `d=${slackConfig.xoxdToken}`,
        'Content-Type': contentType,
        'Accept': 'application/json'
      }
    };
    
    if (postBody) {
      options.headers['Content-Length'] = Buffer.byteLength(postBody);
    }

    const req = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.ok) {
            resolve(jsonData);
          } else {
            reject(new Error(jsonData.error || 'Slack API error'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse Slack response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postBody) {
      req.write(postBody);
    }
    req.end();
  });
}

/**
 * Helper to make Slack POST request with form data
 * @param {Object} slackConfig - Slack configuration
 * @param {string} endpoint - API endpoint path
 * @param {Object} formData - Form data to post
 * @returns {Promise<Object>} - Parsed JSON response
 */
function makeSlackPostRequest(slackConfig, endpoint, formData) {
  return makeSlackRequest(slackConfig, endpoint, 'POST', formData);
}

/**
 * Get the local cache path for a user's profile image
 * @param {string} userId - Slack user ID
 * @returns {string} - Path to cached image file
 */
function getUserImageCachePath(userId) {
  return path.join(slackCacheDir, `user_${userId}.jpg`);
}

/**
 * Check if a user's profile image is cached locally
 * @param {string} userId - Slack user ID
 * @returns {boolean} - True if cached image exists
 */
function isUserImageCached(userId) {
  const cachePath = getUserImageCachePath(userId);
  if (!fs.existsSync(cachePath)) {
    return false;
  }
  // Check if cache is older than 7 days
  const stats = fs.statSync(cachePath);
  const ageMs = Date.now() - stats.mtimeMs;
  const maxAgeMs = 7 * 24 * 60 * 60 * 1000; // 7 days
  return ageMs < maxAgeMs;
}

/**
 * Download and cache a user's profile image
 * @param {string} imageUrl - URL to the profile image
 * @param {string} userId - Slack user ID
 * @returns {Promise<string>} - Path to cached image
 */
function cacheUserImage(imageUrl, userId) {
  return new Promise((resolve, reject) => {
    if (!imageUrl) {
      reject(new Error('No image URL provided'));
      return;
    }

    const cachePath = getUserImageCachePath(userId);
    const file = fs.createWriteStream(cachePath);

    // Handle both http and https URLs
    const protocol = imageUrl.startsWith('https') ? https : require('http');
    
    protocol.get(imageUrl, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        cacheUserImage(response.headers.location, userId)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(cachePath);
      });
    }).on('error', (err) => {
      fs.unlink(cachePath, () => {}); // Clean up partial file
      reject(err);
    });
  });
}

/**
 * Get cached user image path or download and cache it
 * @param {string} imageUrl - URL to the profile image
 * @param {string} userId - Slack user ID
 * @returns {Promise<string|null>} - Local path to serve or null if failed
 */
async function getCachedUserImage(imageUrl, userId) {
  if (!userId) return null;
  
  if (isUserImageCached(userId)) {
    return `/api/slack/images/${userId}`;
  }
  
  if (imageUrl) {
    try {
      await cacheUserImage(imageUrl, userId);
      return `/api/slack/images/${userId}`;
    } catch (err) {
      console.error(`Failed to cache image for user ${userId}:`, err.message);
      return imageUrl; // Fall back to original URL
    }
  }
  
  return null;
}

module.exports = {
  makeSlackRequest,
  makeSlackPostRequest,
  getUserImageCachePath,
  isUserImageCached,
  cacheUserImage,
  getCachedUserImage
};


