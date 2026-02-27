const path = require('path');
const fs = require('fs');
const { dataDir, loadGoogleSlidesConfig } = require('../../../../server/lib/config');

const SLIDES_REDIRECT_URI = 'http://localhost:3001/api/slides/google/oauth/callback';
const SLIDES_SCOPES = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive.file'
];

// Helper function to get Google Slides access token
async function getSlidesAccessToken() {
  const config = loadGoogleSlidesConfig();
  
  if (!config) {
    throw new Error('Google Slides configuration not found');
  }
  
  const { clientId, clientSecret, slidesRefreshToken } = config;
  const refreshToken = slidesRefreshToken || config.refreshToken;
  
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Slides configuration incomplete');
  }
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Slides access token: ${error}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// Check Google Slides connection status
function checkGoogleSlidesStatus() {
  const config = loadGoogleSlidesConfig();
  
  if (!config) {
    return {
      configured: false,
      message: 'Google Slides integration not configured'
    };
  }
  
  const { clientId, clientSecret, slidesRefreshToken } = config;
  const refreshToken = slidesRefreshToken || config.refreshToken;
  const hasCredentials = !!(clientId && clientSecret && refreshToken);
  
  return {
    configured: hasCredentials,
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    hasRefreshToken: !!refreshToken,
    message: hasCredentials 
      ? 'Google Slides integration configured' 
      : 'Google Slides integration partially configured. Authorize to complete setup.'
  };
}

// Get OAuth authorization URL
function getOAuthUrl() {
  const config = loadGoogleSlidesConfig();
  
  if (!config || !config.clientId) {
    throw new Error('Client ID not configured. Please add clientId to Google config first.');
  }
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', SLIDES_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SLIDES_SCOPES.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  
  return authUrl.toString();
}

// Handle OAuth callback
async function handleOAuthCallback(code) {
  const config = loadGoogleSlidesConfig();
  
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
      redirect_uri: SLIDES_REDIRECT_URI,
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
  
  // Save refresh token to config under googleSlides
  const configFile = path.join(dataDir, 'config.json');
  let fullConfig = {};
  
  if (fs.existsSync(configFile)) {
    fullConfig = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  }
  
  fullConfig.googleSlides = fullConfig.googleSlides || {};
  fullConfig.googleSlides.clientId = config.clientId;
  fullConfig.googleSlides.clientSecret = config.clientSecret;
  fullConfig.googleSlides.slidesRefreshToken = tokens.refresh_token;
  
  fs.writeFileSync(configFile, JSON.stringify(fullConfig, null, 2));
  
  return true;
}

// Export to Google Slides
async function exportToGoogleSlides(slideDeck, slides) {
  const accessToken = await getSlidesAccessToken();
  
  // Create a new presentation
  const createResponse = await fetch('https://slides.googleapis.com/v1/presentations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: slideDeck.title || 'Untitled Presentation'
    })
  });
  
  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Failed to create presentation: ${error}`);
  }
  
  const presentation = await createResponse.json();
  const presentationId = presentation.presentationId;
  
  // Build batch update requests to add content
  const requests = [];
  
  // Delete the default blank slide first
  if (presentation.slides && presentation.slides.length > 0) {
    requests.push({
      deleteObject: {
        objectId: presentation.slides[0].objectId
      }
    });
  }
  
  // Add each slide
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const slideId = `slide_${i}`;
    const titleId = `title_${i}`;
    const bodyId = `body_${i}`;
    
    // Create slide
    requests.push({
      createSlide: {
        objectId: slideId,
        insertionIndex: i,
        slideLayoutReference: {
          predefinedLayout: slide.type === 'title' ? 'TITLE' : 'TITLE_AND_BODY'
        },
        placeholderIdMappings: [
          {
            layoutPlaceholder: { type: 'TITLE', index: 0 },
            objectId: titleId
          },
          ...(slide.type !== 'title' ? [{
            layoutPlaceholder: { type: 'BODY', index: 0 },
            objectId: bodyId
          }] : [])
        ]
      }
    });
    
    // Insert title text
    if (slide.heading) {
      requests.push({
        insertText: {
          objectId: titleId,
          text: slide.heading,
          insertionIndex: 0
        }
      });
    }
    
    // Insert body content
    if (slide.type !== 'title' && slide.content && slide.content.length > 0) {
      let bodyText = '';
      if (slide.subheading) {
        bodyText += slide.subheading + '\n\n';
      }
      for (const item of slide.content) {
        if (item.type === 'bullet') {
          bodyText += '• ' + item.text + '\n';
        } else if (item.type === 'paragraph' || item.type === 'h3') {
          bodyText += item.text + '\n';
        } else if (item.type === 'quote') {
          bodyText += '"' + item.text + '"\n';
        }
      }
      
      if (bodyText.trim()) {
        requests.push({
          insertText: {
            objectId: bodyId,
            text: bodyText.trim(),
            insertionIndex: 0
          }
        });
      }
    } else if (slide.type === 'title' && slide.subheading) {
      // For title slides, add subtitle
      const subtitleId = `subtitle_${i}`;
      requests.push({
        createShape: {
          objectId: subtitleId,
          shapeType: 'TEXT_BOX',
          elementProperties: {
            pageObjectId: slideId,
            size: {
              width: { magnitude: 600, unit: 'PT' },
              height: { magnitude: 50, unit: 'PT' }
            },
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: 50,
              translateY: 300,
              unit: 'PT'
            }
          }
        }
      });
      requests.push({
        insertText: {
          objectId: subtitleId,
          text: slide.subheading,
          insertionIndex: 0
        }
      });
    }
  }
  
  // Apply batch update
  if (requests.length > 0) {
    const updateResponse = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });
    
    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.error('Batch update error:', error);
      // Continue anyway - the presentation was created
    }
  }
  
  const presentationUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
  
  return {
    presentationId,
    url: presentationUrl,
    title: slideDeck.title,
    slideCount: slides.length
  };
}

module.exports = {
  SLIDES_REDIRECT_URI,
  getSlidesAccessToken,
  checkGoogleSlidesStatus,
  getOAuthUrl,
  handleOAuthCallback,
  exportToGoogleSlides
};
