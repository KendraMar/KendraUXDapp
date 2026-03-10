/**
 * Widget Registry - Discovers widgets declared in app manifests
 * 
 * Uses webpack's require.context to read manifest.json files at build time,
 * extracting the "widgets" array from each. Also provides a fetchWidgets()
 * function that calls the server API for runtime discovery.
 */

// Discover all manifest.json files at build time
const manifestContext = require.context(
  '../../../../data/apps',
  true,
  /^\.\/[^/]+\/manifest\.json$/
);

/**
 * Build a map of all available widgets from app manifests (build-time)
 */
function buildWidgetCatalog() {
  const widgets = [];

  manifestContext.keys().forEach((manifestPath) => {
    try {
      const manifest = manifestContext(manifestPath);
      const appId = manifestPath.split('/')[1];

      if (manifest.enabled === false) return;
      if (!manifest.widgets || !Array.isArray(manifest.widgets)) return;

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
      console.error(`[WidgetRegistry] Error processing ${manifestPath}:`, err);
    }
  });

  return widgets;
}

// Build catalog at module load time
const widgetCatalog = buildWidgetCatalog();

/**
 * Get all available widgets (build-time catalog)
 */
export function getAvailableWidgets() {
  return widgetCatalog;
}

/**
 * Get a specific widget definition by its full ID (e.g. "tasks-task-summary")
 */
export function getWidgetById(widgetId) {
  return widgetCatalog.find(w => w.id === widgetId) || null;
}

/**
 * Get widgets grouped by app
 */
export function getWidgetsByApp() {
  const grouped = {};
  for (const widget of widgetCatalog) {
    if (!grouped[widget.appId]) {
      grouped[widget.appId] = {
        appId: widget.appId,
        appName: widget.appName,
        appIcon: widget.appIcon,
        widgets: []
      };
    }
    grouped[widget.appId].widgets.push(widget);
  }
  return Object.values(grouped);
}

/**
 * Fetch widgets from the server API (runtime discovery)
 */
export async function fetchWidgets() {
  try {
    const res = await fetch('/api/dashboard/widgets');
    const data = await res.json();
    if (data.success) return data.widgets;
    return widgetCatalog;
  } catch {
    return widgetCatalog;
  }
}

export default {
  getAvailableWidgets,
  getWidgetById,
  getWidgetsByApp,
  fetchWidgets
};
