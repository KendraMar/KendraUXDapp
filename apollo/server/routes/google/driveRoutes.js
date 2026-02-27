const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { 
  extractFileId, 
  getFileMetadata, 
  isValidGoogleDriveUrl,
  getAccessToken 
} = require('../../lib/google');
const { loadGoogleConfig, dataDir } = require('../../lib/config');

// OAuth configuration for Google Drive
const REDIRECT_URI = 'http://localhost:3001/api/google/oauth/callback';
// drive.readonly allows both metadata AND file download access
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// Check if Google integration is configured
router.get('/status', (req, res) => {
  const config = loadGoogleConfig();
  
  if (!config) {
    return res.json({
      configured: false,
      message: 'Google integration not configured. Add google config to data/config.json'
    });
  }
  
  const { clientId, clientSecret, refreshToken } = config;
  const hasCredentials = !!(clientId && clientSecret && refreshToken);
  
  res.json({
    configured: hasCredentials,
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    hasRefreshToken: !!refreshToken,
    message: hasCredentials 
      ? 'Google integration configured' 
      : 'Google integration partially configured'
  });
});

// Test Google connection by validating credentials
router.get('/test', async (req, res) => {
  try {
    const config = loadGoogleConfig();
    
    if (!config) {
      return res.json({
        success: false,
        error: 'Google integration not configured'
      });
    }
    
    // Try to get an access token - this validates the credentials
    const accessToken = await getAccessToken();
    
    // Try to get user info using the access token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }
    
    const userInfo = await userInfoResponse.json();
    
    res.json({
      success: true,
      user: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      }
    });
    
  } catch (error) {
    console.error('Google connection test failed:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Get file metadata from Google Drive URL
router.post('/drive/file', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    // Validate URL format
    if (!isValidGoogleDriveUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Google Drive URL. Expected format: https://drive.google.com/file/d/{fileId}/view'
      });
    }
    
    // Extract file ID
    const fileId = extractFileId(url);
    
    if (!fileId) {
      return res.status(400).json({
        success: false,
        error: 'Could not extract file ID from URL'
      });
    }
    
    // Get file metadata
    const metadata = await getFileMetadata(fileId);
    
    res.json({
      success: true,
      fileId,
      metadata
    });
    
  } catch (error) {
    console.error('Error fetching Google Drive file:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start OAuth flow - redirects to Google's consent screen
router.get('/oauth/authorize', (req, res) => {
  const config = loadGoogleConfig();
  
  if (!config || !config.clientId) {
    return res.status(400).json({
      success: false,
      error: 'Client ID not configured. Please add clientId to Google config first.'
    });
  }
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPES.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
  
  res.redirect(authUrl.toString());
});

// OAuth callback - exchanges code for tokens
router.get('/oauth/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.send(`
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1 style="color: #c9190b;">Authorization Failed</h1>
          <p>Error: ${error}</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  }
  
  if (!code) {
    return res.send(`
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1 style="color: #c9190b;">Authorization Failed</h1>
          <p>No authorization code received.</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  }
  
  try {
    const config = loadGoogleConfig();
    
    if (!config || !config.clientId || !config.clientSecret) {
      throw new Error('Client ID and Client Secret must be configured first');
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }
    
    const tokens = await tokenResponse.json();
    
    if (!tokens.refresh_token) {
      throw new Error('No refresh token received. Try revoking app access at https://myaccount.google.com/permissions and try again.');
    }
    
    // Save refresh token to config
    const configFile = path.join(dataDir, 'config.json');
    let fullConfig = {};
    
    if (fs.existsSync(configFile)) {
      fullConfig = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    }
    
    fullConfig.google = fullConfig.google || {};
    fullConfig.google.refreshToken = tokens.refresh_token;
    
    fs.writeFileSync(configFile, JSON.stringify(fullConfig, null, 2));
    
    // Success page
    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1 style="color: #3e8635;">✓ Google Drive Connected!</h1>
          <p>Your refresh token has been saved automatically.</p>
          <p>You can close this window and return to Apollo.</p>
          <script>
            // Try to close the window after a delay
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1 style="color: #c9190b;">Authorization Failed</h1>
          <p>${error.message}</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  }
});

module.exports = router;
