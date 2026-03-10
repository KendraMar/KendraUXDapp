const express = require('express');
const expressWs = require('express-ws');
const path = require('path');
const fs = require('fs');

// Import route modules
const cacheRoutes = require('./routes/cache');
const jiraRoutes = require('./routes/jira');
const chatsRoutes = require('./routes/chats');
const configRoutes = require('./routes/config');
const peopleRoutes = require('./routes/people');
const googleRoutes = require('./routes/google');
const spacesRoutes = require('./routes/spaces');
const confluenceRoutes = require('./routes/confluence');
const agentsRoutes = require('./routes/agents');
const ambientRoutes = require('./routes/ambient');
const claudecodeRoutes = require('./routes/claudecode');
const cursorcliRoutes = require('./routes/cursorcli');
const chatHistoryRoutes = require('./routes/chatHistory');
const browserRoutes = require('./routes/browser');
const kagiRoutes = require('./routes/kagi');
const conversationsRoutes = require('./routes/conversations');
const dashboardRoutes = require('./routes/dashboard');
const createSpeechRouter = require('./routes/speech');
const sharingRoutes = require('./routes/sharing');
const updatesRoutes = require('./routes/updates');
const { startPeriodicChecks } = require('./routes/updates');

// Import config to ensure directories are created
const { cacheDir } = require('./lib/config');

// Import sharing service for auto-sync
const { startAutoSync } = require('./lib/sharing');

// Import app loader for modular applications
const { mountAppRoutes, getDiscoveredApps } = require('./lib/appLoader');

const app = express();
// Enable WebSocket support for real-time collaboration
const wsInstance = expressWs(app);
// Use port 1226 when running with webpack-dev-server (which uses 1225)
const PORT = process.env.PORT || (process.env.NODE_ENV === 'development' ? 1226 : 1225);

// Middleware to parse JSON bodies
// App-specific body limits and timeouts are handled in each app's own routes.js
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Serve prototype static files from data/prototypes
app.use('/data/prototypes', express.static(path.join(__dirname, '..', 'data', 'prototypes')));

// Mount API routes
app.use('/api/cache', cacheRoutes);
app.use('/api/jira', jiraRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/config', configRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/spaces', spacesRoutes);
app.use('/api/confluence', confluenceRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/ambient', ambientRoutes);
app.use('/api/claudecode', claudecodeRoutes);
app.use('/api/cursorcli', cursorcliRoutes);
app.use('/api/chat-history', chatHistoryRoutes);
app.use('/api/browser', browserRoutes);
app.use('/api/kagi', kagiRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sharing', sharingRoutes);
app.use('/api/updates', updatesRoutes);

// Speech-to-text route (needs app for WebSocket support)
const speechRouter = createSpeechRouter(app);
app.use('/api/speech', speechRouter);

// Mount modular app routes from data/apps/
mountAppRoutes(app);

// API endpoint to list all discovered apps
app.get('/api/apps', (req, res) => {
  const apps = getDiscoveredApps();
  res.json({ success: true, apps });
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  if (!fs.existsSync(indexPath)) {
    // In dev, dist may not exist yet (webpack still compiling). Redirect to webpack dev server.
    if (process.env.NODE_ENV === 'development') {
      return res.redirect('http://localhost:1225' + req.url);
    }
    return res.status(503).send('Build in progress. Run "npm run build" first.');
  }
  res.sendFile(indexPath);
});

const server = app.listen(PORT, () => {
  console.log(`  Server ready on :${PORT}`);

  // Start auto-sync for shared repositories (every 5 minutes)
  startAutoSync(5 * 60 * 1000);

  // Start periodic update checks (3x per day)
  startPeriodicChecks();
});

// Configure server timeouts for large file uploads (recordings up to 5GB)
// These settings prevent connection drops during long uploads
server.timeout = 2 * 60 * 60 * 1000;        // 2 hours - overall request timeout
server.keepAliveTimeout = 10 * 60 * 1000;   // 10 minutes - keep connection alive between requests
server.headersTimeout = 2 * 60 * 60 * 1000; // 2 hours - time to receive headers (includes upload)
server.requestTimeout = 0;                   // Disable default 5-minute timeout (Node 18+)

