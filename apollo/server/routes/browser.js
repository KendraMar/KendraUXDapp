const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Path to browser data
const dataDir = path.join(__dirname, '..', '..', 'data', 'browser');
const configFile = path.join(dataDir, 'config.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Read config (registered extension ID)
function readConfig() {
  ensureDataDir();
  
  if (!fs.existsSync(configFile)) {
    return { registeredExtensionId: null };
  }
  
  try {
    return JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  } catch (error) {
    return { registeredExtensionId: null };
  }
}

// Save config
function saveConfig(config) {
  ensureDataDir();
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

// Extract extension ID from origin (e.g., "chrome-extension://abc123def456")
function extractExtensionId(origin) {
  if (!origin) return null;
  const match = origin.match(/^(?:chrome|moz|safari)-extension:\/\/([a-z0-9]+)/i);
  return match ? match[1] : null;
}

// CORS and authentication middleware
router.use((req, res, next) => {
  const origin = req.headers.origin;
  const extensionId = extractExtensionId(origin);
  
  // Only allow browser extension origins
  const isExtensionOrigin = origin && (
    origin.startsWith('chrome-extension://') ||
    origin.startsWith('moz-extension://') ||
    origin.startsWith('safari-extension://')
  );
  
  if (!isExtensionOrigin) {
    // Allow non-browser requests (curl, etc.) for testing - they don't have Origin header
    if (origin) {
      return res.status(403).json({ error: 'Only browser extensions are allowed' });
    }
  }
  
  // Set CORS headers for extension origins
  if (isExtensionOrigin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  // For registration endpoint, allow any extension
  if (req.path === '/register') {
    req.extensionId = extensionId;
    return next();
  }
  
  // For all other endpoints, verify the extension is registered
  if (extensionId) {
    const config = readConfig();
    
    if (!config.registeredExtensionId) {
      return res.status(403).json({ 
        error: 'No extension registered. Please register first.',
        needsRegistration: true
      });
    }
    
    if (config.registeredExtensionId !== extensionId) {
      return res.status(403).json({ 
        error: 'Extension not authorized. A different extension is already registered.',
        registeredId: config.registeredExtensionId,
        yourId: extensionId
      });
    }
  }
  
  next();
});

// POST /api/browser/register - Register the extension
router.post('/register', (req, res) => {
  const extensionId = req.extensionId;
  
  if (!extensionId) {
    return res.status(400).json({ error: 'Could not determine extension ID' });
  }
  
  const config = readConfig();
  
  // If already registered to this extension, just confirm
  if (config.registeredExtensionId === extensionId) {
    return res.json({ 
      success: true, 
      message: 'Extension already registered',
      extensionId 
    });
  }
  
  // If registered to a different extension, reject
  if (config.registeredExtensionId) {
    return res.status(403).json({ 
      error: 'A different extension is already registered',
      registeredId: config.registeredExtensionId,
      yourId: extensionId
    });
  }
  
  // Register this extension
  config.registeredExtensionId = extensionId;
  saveConfig(config);
  
  console.log(`Apollo Capture: Registered extension ${extensionId}`);
  
  res.json({ 
    success: true, 
    message: 'Extension registered successfully',
    extensionId 
  });
});

// GET /api/browser/status - Check registration status
router.get('/status', (req, res) => {
  const config = readConfig();
  res.json({
    registered: !!config.registeredExtensionId,
    extensionId: config.registeredExtensionId
  });
});

// DELETE /api/browser/register - Unregister extension (to allow re-registration)
router.delete('/register', (req, res) => {
  const config = readConfig();
  const oldId = config.registeredExtensionId;
  config.registeredExtensionId = null;
  saveConfig(config);
  
  console.log(`Apollo Capture: Unregistered extension ${oldId}`);
  
  res.json({ success: true, message: 'Extension unregistered' });
});

// Path to browser history data
const historyFile = path.join(dataDir, 'history.json');
const tabsFile = path.join(dataDir, 'tabs.json');

// Read history from file
function readHistory() {
  ensureDataDir();
  
  if (!fs.existsSync(historyFile)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(historyFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading browser history:', error);
    return [];
  }
}

// Write history to file
function writeHistory(history) {
  ensureDataDir();
  
  try {
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error writing browser history:', error);
    throw error;
  }
}

// POST /api/browser/capture - Capture a page visit
router.post('/capture', (req, res) => {
  try {
    const { timestamp, url, title } = req.body;
    
    if (!timestamp || !url || !title) {
      return res.status(400).json({ error: 'Missing required fields: timestamp, url, title' });
    }
    
    const history = readHistory();
    
    // Add new entry at the beginning
    history.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      timestamp,
      url,
      title
    });
    
    // Keep only the last 10000 entries to prevent file from growing too large
    const trimmedHistory = history.slice(0, 10000);
    
    writeHistory(trimmedHistory);
    
    res.json({ success: true, count: trimmedHistory.length });
  } catch (error) {
    console.error('Error capturing page visit:', error);
    res.status(500).json({ error: 'Failed to capture page visit' });
  }
});

// GET /api/browser/history - Get browsing history
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const history = readHistory();
    const paginatedHistory = history.slice(offset, offset + limit);
    
    res.json({
      history: paginatedHistory,
      total: history.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error reading browser history:', error);
    res.status(500).json({ error: 'Failed to read browser history' });
  }
});

// GET /api/browser/search - Search browsing history
router.get('/search', (req, res) => {
  try {
    const query = (req.query.q || '').toLowerCase();
    const limit = parseInt(req.query.limit) || 50;
    
    if (!query) {
      return res.status(400).json({ error: 'Missing search query parameter: q' });
    }
    
    const history = readHistory();
    const results = history.filter(item => 
      item.title.toLowerCase().includes(query) || 
      item.url.toLowerCase().includes(query)
    ).slice(0, limit);
    
    res.json({
      results,
      count: results.length,
      query
    });
  } catch (error) {
    console.error('Error searching browser history:', error);
    res.status(500).json({ error: 'Failed to search browser history' });
  }
});

// DELETE /api/browser/history - Clear all history
router.delete('/history', (req, res) => {
  try {
    writeHistory([]);
    res.json({ success: true, message: 'History cleared' });
  } catch (error) {
    console.error('Error clearing browser history:', error);
    res.status(500).json({ error: 'Failed to clear browser history' });
  }
});

// DELETE /api/browser/history/:id - Delete a specific entry
router.delete('/history/:id', (req, res) => {
  try {
    const { id } = req.params;
    const history = readHistory();
    const filteredHistory = history.filter(item => item.id !== id);
    
    if (filteredHistory.length === history.length) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    writeHistory(filteredHistory);
    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    console.error('Error deleting browser history entry:', error);
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// ==================== TABS ====================

// Read tabs from file
function readTabs() {
  ensureDataDir();
  
  if (!fs.existsSync(tabsFile)) {
    return { timestamp: null, tabs: [] };
  }
  
  try {
    const data = fs.readFileSync(tabsFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading tabs:', error);
    return { timestamp: null, tabs: [] };
  }
}

// Write tabs to file
function writeTabs(tabsData) {
  ensureDataDir();
  
  try {
    fs.writeFileSync(tabsFile, JSON.stringify(tabsData, null, 2));
  } catch (error) {
    console.error('Error writing tabs:', error);
    throw error;
  }
}

// POST /api/browser/tabs - Save current open tabs snapshot
router.post('/tabs', (req, res) => {
  try {
    const { tabs } = req.body;
    
    if (!Array.isArray(tabs)) {
      return res.status(400).json({ error: 'tabs must be an array' });
    }
    
    const tabsData = {
      timestamp: new Date().toISOString(),
      tabs: tabs.map((tab, index) => ({
        id: tab.id || index,
        windowId: tab.windowId,
        index: tab.index,
        url: tab.url,
        title: tab.title || 'Untitled',
        active: tab.active || false,
        pinned: tab.pinned || false
      }))
    };
    
    writeTabs(tabsData);
    
    res.json({ 
      success: true, 
      count: tabsData.tabs.length,
      timestamp: tabsData.timestamp
    });
  } catch (error) {
    console.error('Error saving tabs:', error);
    res.status(500).json({ error: 'Failed to save tabs' });
  }
});

// GET /api/browser/tabs - Get current tabs snapshot
router.get('/tabs', (req, res) => {
  try {
    const tabsData = readTabs();
    res.json(tabsData);
  } catch (error) {
    console.error('Error reading tabs:', error);
    res.status(500).json({ error: 'Failed to read tabs' });
  }
});

module.exports = router;
