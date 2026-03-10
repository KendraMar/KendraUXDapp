# Design History

## 2026-02-08

### [Addition] Custom dashboard configuration system
- Full widget-based dashboard with drag-and-drop repositioning and resizable cards via react-grid-layout v2
- Multiple dashboards via PatternFly Tabs with create, rename, duplicate, and delete support
- Widget catalog drawn from app manifests: 10 apps declare widgets (tasks, feed, gitlab, slack, figma, kubernetes, homeassistant, rss, documents, discussions)
- Five generic widget renderers: Stats (big number/metric), List (scrollable items), Feed (timestamped activity), Chart (horizontal bars), Note (editable text)
- Add Widget drawer with search/filter, grouped by app
- Edit/Done mode toggle controls drag, resize, and remove affordances
- Persistent layout configuration saved to data/dashboards.json via /api/dashboard endpoints

## 2026-02-07

### [Addition] Dashboard overview page
- Central landing page providing an overview of recent activity across all integrated tools
- Designed to orient users quickly on project status
