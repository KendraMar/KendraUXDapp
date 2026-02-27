/**
 * Dashboard API Routes
 * 
 * Provides endpoints for loading/saving dashboard configurations
 * and listing available widgets from app manifests.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DASHBOARDS_FILE = path.join(DATA_DIR, 'dashboards.json');
const APPS_DIR = path.join(DATA_DIR, 'apps');

/**
 * Read dashboards config from file, or return defaults
 */
function readDashboardsConfig() {
  try {
    if (fs.existsSync(DASHBOARDS_FILE)) {
      const raw = fs.readFileSync(DASHBOARDS_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[Dashboard] Error reading config:', err.message);
  }
  // Return default config
  return {
    dashboards: [
      {
        id: 'default',
        name: 'My Dashboard',
        layouts: { lg: [], md: [], sm: [] },
        widgets: []
      }
    ],
    activeTab: 'default'
  };
}

/**
 * Write dashboards config to file
 */
function writeDashboardsConfig(config) {
  fs.writeFileSync(DASHBOARDS_FILE, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * Discover widgets from all app manifests
 */
function discoverWidgets() {
  const widgets = [];

  if (!fs.existsSync(APPS_DIR)) return widgets;

  const entries = fs.readdirSync(APPS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const appId = entry.name;
    const manifestPath = path.join(APPS_DIR, appId, 'manifest.json');

    if (!fs.existsSync(manifestPath)) continue;

    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

      if (manifest.enabled === false) continue;
      if (!manifest.widgets || !Array.isArray(manifest.widgets)) continue;

      for (const widget of manifest.widgets) {
        widgets.push({
          ...widget,
          id: `${appId}-${widget.id}`,
          appId,
          appName: manifest.displayName,
          appIcon: manifest.icon
        });
      }
    } catch (err) {
      console.error(`[Dashboard] Error reading manifest for ${appId}:`, err.message);
    }
  }

  return widgets;
}

// GET /api/dashboard/config - Load dashboard configuration
router.get('/config', (req, res) => {
  try {
    const config = readDashboardsConfig();
    res.json({ success: true, ...config });
  } catch (err) {
    console.error('[Dashboard] Error loading config:', err);
    res.status(500).json({ success: false, error: 'Failed to load dashboard config' });
  }
});

// PUT /api/dashboard/config - Save dashboard configuration
router.put('/config', (req, res) => {
  try {
    const { dashboards, activeTab } = req.body;

    if (!dashboards || !Array.isArray(dashboards)) {
      return res.status(400).json({ success: false, error: 'Invalid config: dashboards array required' });
    }

    const config = { dashboards, activeTab: activeTab || 'default' };
    writeDashboardsConfig(config);
    res.json({ success: true });
  } catch (err) {
    console.error('[Dashboard] Error saving config:', err);
    res.status(500).json({ success: false, error: 'Failed to save dashboard config' });
  }
});

// GET /api/dashboard/widgets - List available widgets from all apps
router.get('/widgets', (req, res) => {
  try {
    const widgets = discoverWidgets();
    res.json({ success: true, widgets });
  } catch (err) {
    console.error('[Dashboard] Error discovering widgets:', err);
    res.status(500).json({ success: false, error: 'Failed to discover widgets' });
  }
});

module.exports = router;
