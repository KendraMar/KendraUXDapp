# Apollo Modular Apps

This directory contains modular applications for Apollo. Each app is a self-contained folder that can be added or removed independently.

**For complete instructions on creating apps, see:** `.cursor/skills/create-app/SKILL.md`

## Quick Reference

### App Structure

```
data/apps/{app-id}/
├── manifest.json       # Required: App configuration
├── pages/              # Required: React page components
│   ├── AppName.js      # Main page (PascalCase)
│   └── AppNameDetail.js # Detail pages (optional)
├── routes.js           # Optional: Express API routes
└── styles.css          # Optional: App-specific CSS
```

### Minimal manifest.json

```json
{
  "id": "my-app",
  "displayName": "My App",
  "description": "What this app does",
  "icon": "CubesIcon",
  "version": "1.0.0",
  "enabled": true,
  "navItem": {
    "path": "/my-app",
    "displayName": "My App",
    "icon": "CubesIcon"
  },
  "routes": [
    { "path": "/my-app", "page": "MyApp" }
  ],
  "apiPath": "/api/my-app"
}
```

### Manifest Fields Reference

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique ID (kebab-case, matches folder name) |
| `displayName` | Yes | Human-readable name |
| `description` | No | Brief description |
| `icon` | Yes | PatternFly icon name |
| `version` | No | Semantic version (default: "1.0.0") |
| `enabled` | No | Set `false` to disable (default: true) |
| `navItem` | No | Navigation configuration |
| `navItem.path` | Yes* | URL path for nav item |
| `navItem.displayName` | No | Nav label (defaults to displayName) |
| `navItem.icon` | No | Nav icon (defaults to icon) |
| `routes` | Yes | Array of route definitions |
| `routes[].path` | Yes | React Router path pattern |
| `routes[].page` | Yes | Component name in pages/ (no .js) |
| `apiPath` | No | API prefix (required if routes.js exists) |

### Common Icons

| Icon | Use For |
|------|---------|
| `CubesIcon` | Containers, modules |
| `ServerIcon` | Servers |
| `NetworkIcon` | Networking |
| `HomeIcon` | Home, dashboard |
| `CogIcon` | Settings |
| `CodeIcon` | Development |
| `CommentsIcon` | Chat, messaging |
| `CalendarAltIcon` | Calendar |
| `BookOpenIcon` | Documentation |
| `VideoIcon` | Media, recordings |
| `ListIcon` | Tasks, lists |
| `InboxIcon` | Feed, inbox |

## How It Works

### Discovery

1. **Frontend (build time):** `src/lib/appRegistry.js` uses webpack's `require.context` to discover all apps
2. **Backend (startup):** `server/lib/appLoader.js` scans for apps and mounts API routes

### Auto-Registration

- Routes are added to React Router from `manifest.routes`
- Nav items appear in sidebar from `manifest.navItem`
- API routes mount at `manifest.apiPath`

### Removal

Delete the app folder. On restart, the app is completely gone:
- Routes removed
- Nav item removed
- API routes removed

## Space Context Integration

**All apps should be space-context-aware.** When a user is in a space that has configured sources (Jira projects, Slack channels, Figma files, etc.), your app should automatically scope its default view based on those sources.

### Quick Example

```javascript
import { useSpaceContext } from '../../../../src/lib/SpaceContext';

const MyApp = () => {
  const { spaceName, sources, getSourcesByType, hasSourceType } = useSpaceContext();

  // Check if the space has sources relevant to your app
  const jiraSources = getSourcesByType('jira');
  const slackSources = getSourcesByType('slack');

  // Use source data to scope your default filters
  // Always allow users to toggle scoping off
};
```

### Integration Steps

1. Import `useSpaceContext` from `../../../../src/lib/SpaceContext`
2. Determine which source types your app cares about (e.g., `jira`, `slack`, `figma`)
3. Extract identifiers from source URLs (e.g., project keys from Jira URLs)
4. Apply as a **default filter** with a toggle to "show all"
5. Show a **visual indicator** when space scoping is active

### Reference Implementation

See `data/apps/tasks/pages/Tasks.js` for a complete example that:
- Extracts Jira project keys from space sources
- Auto-filters the task list by those project keys
- Shows a toggleable "Scoped to [Space Name]" banner

### Full Documentation

See `docs/architecture/space-context.md` for the complete architecture guide, data flow diagrams, and design principles.

## Example Apps

### Kubernetes (`data/apps/kubernetes/`)

A complete example with:
- Multiple page components
- Complex API routes
- Full manifest configuration

## Creating a New App

1. Create folder: `mkdir -p data/apps/my-app/pages`
2. Create manifest: `data/apps/my-app/manifest.json`
3. Create main page: `data/apps/my-app/pages/MyApp.js`
4. Create routes (optional): `data/apps/my-app/routes.js`
5. Restart Apollo

See `.cursor/skills/create-app/SKILL.md` for complete templates.

## Troubleshooting

| Issue | Check |
|-------|-------|
| App not loading | Is `manifest.json` valid JSON? Is `enabled: true`? |
| 404 on page | Does `routes[].page` match filename? Does component export default? |
| API not working | Is `apiPath` set? Does `routes.js` export an Express router? |
| Nav not showing | Is `navItem` defined with valid `path`? |
| Icon missing | Is icon name exact match from PatternFly? |

## API Reference

List discovered apps via API:
```
GET /api/apps
```

Response:
```json
{
  "success": true,
  "apps": [
    {
      "id": "kubernetes",
      "displayName": "Kubernetes",
      "description": "...",
      "icon": "CubesIcon",
      "version": "1.0.0",
      "enabled": true,
      "hasApi": true,
      "apiPath": "/api/kubernetes"
    }
  ]
}
```
