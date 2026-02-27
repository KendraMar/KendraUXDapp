const { loadGoogleCalendarConfig, loadGoogleTasksConfig } = require('../../lib/config');

// OAuth configuration for Google Calendar
const CALENDAR_REDIRECT_URI = 'http://localhost:3001/api/google/calendar/oauth/callback';
const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

// OAuth configuration for Google Tasks
const TASKS_REDIRECT_URI = 'http://localhost:1226/api/google/tasks/oauth/callback';
const TASKS_SCOPES = ['https://www.googleapis.com/auth/tasks.readonly'];

// Helper function to get Calendar access token
async function getCalendarAccessToken() {
  const config = loadGoogleCalendarConfig();
  
  if (!config) {
    throw new Error('Google Calendar configuration not found');
  }
  
  const { clientId, clientSecret, refreshToken } = config;
  
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Calendar configuration incomplete');
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
    throw new Error(`Failed to refresh Calendar access token: ${error}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// Helper function to get Tasks access token
async function getTasksAccessToken() {
  const config = loadGoogleTasksConfig();
  
  if (!config) {
    throw new Error('Google Tasks configuration not found');
  }
  
  const { clientId, clientSecret, refreshToken } = config;
  
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Tasks configuration incomplete');
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
    throw new Error(`Failed to refresh Tasks access token: ${error}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

module.exports = {
  CALENDAR_REDIRECT_URI,
  CALENDAR_SCOPES,
  TASKS_REDIRECT_URI,
  TASKS_SCOPES,
  getCalendarAccessToken,
  getTasksAccessToken
};
