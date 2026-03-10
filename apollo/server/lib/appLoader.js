/**
 * App Loader - Discovers and loads modular apps from data/apps/
 * 
 * This module scans the data/apps directory at server startup and
 * dynamically mounts API routes for each app.
 */

const fs = require('fs');
const path = require('path');

const APPS_DIR = path.join(__dirname, '..', '..', 'data', 'apps');

/**
 * Discover all apps in data/apps/ directory
 * @returns {Array} Array of app configurations
 */
function discoverApps() {
  const apps = [];
  
  // Check if apps directory exists
  if (!fs.existsSync(APPS_DIR)) {
    console.log('[AppLoader] Apps directory not found, creating:', APPS_DIR);
    fs.mkdirSync(APPS_DIR, { recursive: true });
    return apps;
  }
  
  // Read all directories in apps folder
  const entries = fs.readdirSync(APPS_DIR, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const appId = entry.name;
    const appDir = path.join(APPS_DIR, appId);
    const manifestPath = path.join(appDir, 'manifest.json');
    
    // Check for manifest.json
    if (!fs.existsSync(manifestPath)) {
      console.log(`[AppLoader] Skipping ${appId}: no manifest.json`);
      continue;
    }
    
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Skip disabled apps
      if (manifest.enabled === false) {
        console.log(`[AppLoader] Skipping disabled app: ${appId}`);
        continue;
      }
      
      // Check for routes.js
      const routesPath = path.join(appDir, 'routes.js');
      const hasRoutes = fs.existsSync(routesPath);
      
      apps.push({
        id: appId,
        manifest,
        appDir,
        routesPath: hasRoutes ? routesPath : null,
        apiPath: manifest.apiPath || `/api/${appId}`
      });
    } catch (error) {
      console.error(`[AppLoader] Failed to load manifest for ${appId}:`, error.message);
    }
  }
  
  return apps;
}

/**
 * Mount API routes for all discovered apps
 * @param {Express} app - Express application instance
 */
function mountAppRoutes(app) {
  const apps = discoverApps();
  let mountedCount = 0;
  
  for (const appConfig of apps) {
    if (!appConfig.routesPath) continue;
    
    try {
      // Clear require cache to allow hot reloading in development
      if (process.env.NODE_ENV === 'development') {
        delete require.cache[require.resolve(appConfig.routesPath)];
      }
      
      const routeModule = require(appConfig.routesPath);
      // Support both regular routers and factory functions (e.g., documents router needs app for WebSocket)
      const router = typeof routeModule === 'function' && routeModule.length > 0 && !routeModule.handle
        ? routeModule(app)
        : routeModule;
      app.use(appConfig.apiPath, router);
      mountedCount++;
    } catch (error) {
      console.error(`[AppLoader] Failed to mount routes for ${appConfig.id}:`, error.message);
    }
  }
  
  // Single summary line instead of per-app logging
  console.log(`  Loaded ${apps.length} apps (${mountedCount} with API routes)`);
  
  return apps;
}

/**
 * Get list of all discovered apps (for API endpoints)
 */
function getDiscoveredApps() {
  return discoverApps().map(app => ({
    id: app.id,
    displayName: app.manifest.displayName,
    description: app.manifest.description,
    icon: app.manifest.icon,
    version: app.manifest.version || '1.0.0',
    enabled: app.manifest.enabled !== false,
    hasApi: !!app.routesPath,
    apiPath: app.apiPath
  }));
}

module.exports = {
  discoverApps,
  mountAppRoutes,
  getDiscoveredApps,
  APPS_DIR
};
