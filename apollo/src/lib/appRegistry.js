/**
 * App Registry - Discovers and registers modular apps from data/apps/
 * 
 * This module uses webpack's require.context to discover apps at build time,
 * making them available for routing and navigation.
 */

// Discover all manifest.json files in data/apps/
const manifestContext = require.context(
  '../../data/apps',
  true,
  /^\.\/[^/]+\/manifest\.json$/
);

// Discover all page components in data/apps/*/pages/
const pageContext = require.context(
  '../../data/apps',
  true,
  /^\.\/[^/]+\/pages\/[^/]+\.js$/
);

// Discover all stylesheets in data/apps/
const styleContext = require.context(
  '../../data/apps',
  true,
  /^\.\/[^/]+\/styles\.css$/
);

/**
 * Parse manifest files and build the app registry
 */
function buildRegistry() {
  const apps = [];
  
  manifestContext.keys().forEach((manifestPath) => {
    try {
      const manifest = manifestContext(manifestPath);
      const appId = manifestPath.split('/')[1]; // Extract app folder name
      
      // Skip disabled apps
      if (manifest.enabled === false) {
        console.log(`[AppRegistry] Skipping disabled app: ${appId}`);
        return;
      }
      
      // Load page components for this app
      const pages = {};
      const pagePrefix = `./${appId}/pages/`;
      
      pageContext.keys().forEach((pagePath) => {
        if (pagePath.startsWith(pagePrefix)) {
          const pageName = pagePath
            .replace(pagePrefix, '')
            .replace('.js', '');
          pages[pageName] = pageContext(pagePath).default || pageContext(pagePath);
        }
      });
      
      // Load styles if they exist
      const stylePath = `./${appId}/styles.css`;
      if (styleContext.keys().includes(stylePath)) {
        styleContext(stylePath);
      }
      
      // Build route configurations with actual components
      const routes = (manifest.routes || []).map((route) => {
        const Component = pages[route.page];
        if (!Component) {
          console.warn(`[AppRegistry] Page component "${route.page}" not found for app "${appId}"`);
        }
        return {
          path: route.path,
          component: Component,
          pageName: route.page
        };
      }).filter(route => route.component);
      
      // Build nav item configuration
      const navItem = manifest.navItem ? {
        id: appId,
        path: manifest.navItem.path || manifest.routes?.[0]?.path || `/${appId}`,
        displayName: manifest.navItem.displayName || manifest.displayName,
        icon: manifest.navItem.icon || manifest.icon
      } : null;
      
      apps.push({
        id: appId,
        manifest,
        routes,
        navItem,
        pages
      });
      
      console.log(`[AppRegistry] Registered app: ${manifest.displayName} (${routes.length} routes)`);
    } catch (error) {
      console.error(`[AppRegistry] Failed to load app from ${manifestPath}:`, error);
    }
  });
  
  return apps;
}

// Build the registry once at module load time
const registeredApps = buildRegistry();

/**
 * Get all registered apps
 */
export function getApps() {
  return registeredApps;
}

/**
 * Get all routes from registered apps (for React Router)
 */
export function getAppRoutes() {
  return registeredApps.flatMap(app => app.routes);
}

/**
 * Get all nav items from registered apps (for AppSidebar)
 */
export function getAppNavItems() {
  return registeredApps
    .filter(app => app.navItem)
    .map(app => app.navItem);
}

/**
 * Get a specific app by ID
 */
export function getApp(appId) {
  return registeredApps.find(app => app.id === appId);
}

/**
 * Check if an app is registered
 */
export function hasApp(appId) {
  return registeredApps.some(app => app.id === appId);
}

export default {
  getApps,
  getAppRoutes,
  getAppNavItems,
  getApp,
  hasApp
};
