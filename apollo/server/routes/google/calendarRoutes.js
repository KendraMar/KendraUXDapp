const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { loadGoogleCalendarConfig, dataDir } = require('../../lib/config');
const { getCalendarAccessToken, CALENDAR_REDIRECT_URI, CALENDAR_SCOPES } = require('./oauthHelpers');

// Calendar cache directory
const calendarCacheDir = path.join(dataDir, 'cache', 'calendar');
if (!fs.existsSync(calendarCacheDir)) {
  fs.mkdirSync(calendarCacheDir, { recursive: true });
}

// Test Calendar connection
router.get('/calendar/test', async (req, res) => {
  try {
    const config = loadGoogleCalendarConfig();
    
    if (!config) {
      return res.json({
        success: false,
        error: 'Google Calendar integration not configured'
      });
    }
    
    const accessToken = await getCalendarAccessToken();
    
    // Get user info
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
    console.error('Google Calendar connection test failed:', error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Start Calendar OAuth flow
router.get('/calendar/oauth/authorize', (req, res) => {
  const config = loadGoogleCalendarConfig();
  
  if (!config || !config.clientId) {
    return res.status(400).json({
      success: false,
      error: 'Client ID not configured. Please add clientId to Google Calendar config first.'
    });
  }
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', config.clientId);
  authUrl.searchParams.set('redirect_uri', CALENDAR_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', CALENDAR_SCOPES.join(' '));
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  
  res.redirect(authUrl.toString());
});

// Calendar OAuth callback
router.get('/calendar/oauth/callback', async (req, res) => {
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
    const config = loadGoogleCalendarConfig();
    
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
        redirect_uri: CALENDAR_REDIRECT_URI,
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
    
    fullConfig.googleCalendar = fullConfig.googleCalendar || {};
    fullConfig.googleCalendar.refreshToken = tokens.refresh_token;
    
    fs.writeFileSync(configFile, JSON.stringify(fullConfig, null, 2));
    
    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1 style="color: #3e8635;">✓ Google Calendar Connected!</h1>
          <p>Your refresh token has been saved automatically.</p>
          <p>You can close this window and return to Apollo.</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Calendar OAuth callback error:', error);
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

// Get list of calendars
router.get('/calendar/calendars', async (req, res) => {
  try {
    const accessToken = await getCalendarAccessToken();
    
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch calendars: ${error}`);
    }
    
    const data = await response.json();
    
    res.json({
      success: true,
      calendars: data.items.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        primary: cal.primary || false,
        backgroundColor: cal.backgroundColor,
        foregroundColor: cal.foregroundColor,
        accessRole: cal.accessRole
      }))
    });
    
  } catch (error) {
    console.error('Error fetching calendars:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get calendar preferences (enabled calendars)
router.get('/calendar/preferences', (req, res) => {
  try {
    const prefsFile = path.join(calendarCacheDir, 'preferences.json');
    
    if (fs.existsSync(prefsFile)) {
      const prefs = JSON.parse(fs.readFileSync(prefsFile, 'utf-8'));
      res.json({ success: true, preferences: prefs });
    } else {
      res.json({ success: true, preferences: { enabledCalendars: {} } });
    }
  } catch (error) {
    console.error('Error loading calendar preferences:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save calendar preferences
router.put('/calendar/preferences', (req, res) => {
  try {
    const prefsFile = path.join(calendarCacheDir, 'preferences.json');
    const { enabledCalendars } = req.body;
    
    const prefs = { enabledCalendars: enabledCalendars || {} };
    fs.writeFileSync(prefsFile, JSON.stringify(prefs, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving calendar preferences:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get calendar events
router.get('/calendar/events', async (req, res) => {
  try {
    const accessToken = await getCalendarAccessToken();
    
    const { calendarIds, timeMin, timeMax, maxResults = 100 } = req.query;
    
    // Default to next 30 days if not specified
    const now = new Date();
    const defaultTimeMin = now.toISOString();
    const defaultTimeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // Parse calendar IDs (comma-separated) or default to primary
    const calendars = calendarIds ? calendarIds.split(',') : ['primary'];
    
    // Fetch events from all specified calendars
    const allEvents = [];
    
    for (const calendarId of calendars) {
      const params = new URLSearchParams({
        timeMin: timeMin || defaultTimeMin,
        timeMax: timeMax || defaultTimeMax,
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime'
      });
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );
      
      if (!response.ok) {
        console.error(`Failed to fetch events for calendar ${calendarId}:`, await response.text());
        continue; // Skip this calendar but continue with others
      }
      
      const data = await response.json();
      
      // Add calendar info to each event
      const eventsWithCalendar = (data.items || []).map(event => ({
        ...event,
        calendarId: calendarId
      }));
      
      allEvents.push(...eventsWithCalendar);
    }
    
    // Sort all events by start time
    allEvents.sort((a, b) => {
      const aStart = a.start?.dateTime || a.start?.date;
      const bStart = b.start?.dateTime || b.start?.date;
      return new Date(aStart) - new Date(bStart);
    });
    
    res.json({
      success: true,
      events: allEvents.map(event => ({
        id: event.id,
        calendarId: event.calendarId,
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: event.start,
        end: event.end,
        status: event.status,
        htmlLink: event.htmlLink,
        hangoutLink: event.hangoutLink,
        conferenceData: event.conferenceData,
        attendees: event.attendees?.map(att => ({
          email: att.email,
          displayName: att.displayName,
          responseStatus: att.responseStatus,
          self: att.self,
          organizer: att.organizer
        })),
        organizer: event.organizer,
        creator: event.creator,
        recurrence: event.recurrence,
        recurringEventId: event.recurringEventId
      }))
    });
    
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
