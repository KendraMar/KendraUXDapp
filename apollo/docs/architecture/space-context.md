# Space Context

**Implementation:** `src/lib/SpaceContext.js` (React Context), consumed by all apps and pages

## Overview

Space Context is the mechanism by which Apollo propagates the active space's configuration — particularly its **sources** — down to every application and page rendered within that space. When a user selects a space (e.g., "Apollo" or "Ambient"), all child apps automatically receive that space's context, enabling them to scope their default views, filters, and data based on what's relevant to the space.

This is a foundational pattern. Every app in Apollo should be context-aware: if the user's active space has configured Jira projects, Slack channels, Figma files, or any other data sources, the apps that consume those source types should automatically adapt.

## Why This Exists

Previously, spaces controlled only **which nav items** appeared in the sidebar. The sources configured in a space (Jira projects, Slack channels, Google Drive folders, etc.) were stored but never propagated to the apps themselves. A user could configure an "Apollo" space with specific Jira projects, but when they clicked "Tasks," they would see all tasks from all projects — no scoping.

Space Context closes this gap: apps now know which space they're operating in and can automatically scope their behavior based on the space's configured sources.

## Architecture

### Data Flow

```
┌──────────────────────────────────────────────────────────┐
│  data/spaces.json                                        │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Space "Ambient"                                    │ │
│  │  sources: [                                         │ │
│  │    { type: "jira", url: ".../browse/RHOAIENG-..." } │ │
│  │    { type: "slack", url: ".../archives/C0123..." }  │ │
│  │    { type: "figma", url: ".../file/abc123" }        │ │
│  │  ]                                                  │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  AppSidebar → onSpaceChange(spaceId, items, spaceObj)    │
│  Passes full space object (including sources) to App.js  │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│  App.js                                                  │
│  ┌──────────────────────────────────────────────────┐    │
│  │  <SpaceContextProvider                           │    │
│  │    activeSpaceId={activeSpaceId}                  │    │
│  │    activeSpace={activeSpace}                      │    │
│  │  >                                               │    │
│  │    <Routes>                                      │    │
│  │      ... all app routes rendered here ...        │    │
│  │    </Routes>                                     │    │
│  │  </SpaceContextProvider>                         │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      ┌────────┐  ┌────────┐  ┌────────┐
      │ Tasks  │  │ Slack  │  │ Feed   │  ... any app
      │        │  │        │  │        │
      │ useSpaceContext()  │  │        │
      │ → scopes to       │  │        │
      │   Jira projects    │  │        │
      └────────┘  └────────┘  └────────┘
```

### Key Files

| File | Role |
|------|------|
| `src/lib/SpaceContext.js` | React Context definition, `SpaceContextProvider`, `useSpaceContext` hook |
| `src/App.js` | Stores `activeSpace` state, wraps routes in `SpaceContextProvider` |
| `src/components/AppSidebar/AppSidebar.js` | Passes full space object via `onSpaceChange` callback |
| `server/routes/spaces.js` | `GET /api/spaces/active/context` endpoint for server-side consumers |
| `data/spaces.json` | Source of truth for space definitions and their sources |

## Space Source Data Model

Each space can have a `sources` array. Each source entry looks like:

```json
{
  "id": "source-1769795259807",
  "url": "https://issues.redhat.com/browse/RHOAIENG-48120",
  "type": "jira",
  "typeName": "Jira",
  "label": "RHOAIENG-48120",
  "addedAt": "2026-01-30T17:47:39.808Z"
}
```

### Source Types

Sources are auto-detected when URLs are added in the Space Settings page (`/spaces/:spaceId/configure`). Supported types:

| Type ID | Service | Example URL Pattern |
|---------|---------|-------------------|
| `jira` | Jira | `*.atlassian.net/browse/*`, `jira.*/browse/*`, `issues.*/browse/*` |
| `confluence` | Confluence | `*.atlassian.net/wiki/*` |
| `slack` | Slack | `*.slack.com/*`, `#channel-name` |
| `google-drive` | Google Drive | `drive.google.com/*`, `docs.google.com/*` |
| `gitlab` | GitLab | `gitlab.com/*`, `gitlab.*/*` |
| `github` | GitHub | `github.com/*` |
| `figma` | Figma | `figma.com/*` |
| `notion` | Notion | `notion.so/*`, `notion.site/*` |
| `other` | Unknown | Any URL not matching the above |

Source type detection is implemented in `src/pages/SpaceSettings.js` via the `sourceTypes` array and `detectSourceType()` function.

## Consuming Space Context in Apps

### The `useSpaceContext()` Hook

Any component rendered under the `SpaceContextProvider` (which includes all routes) can access the current space context:

```javascript
import { useSpaceContext } from '../../../../src/lib/SpaceContext';

const MyApp = () => {
  const {
    activeSpaceId,     // string - current space ID
    activeSpace,       // object - full space object (name, emoji, description, sources, items, etc.)
    sources,           // array  - the space's sources array
    spaceName,         // string - convenience: activeSpace.name
    spaceDescription,  // string - convenience: activeSpace.description
    getSourcesByType,  // function(type) → array of sources matching that type
    getSourceUrls,     // function(type) → array of URL strings for that type
    hasSourceType,     // function(type) → boolean, whether space has any sources of this type
  } = useSpaceContext();

  // Example: get all Jira sources for this space
  const jiraSources = getSourcesByType('jira');

  // Example: check if space has Slack context
  if (hasSourceType('slack')) {
    // Auto-scope to those Slack channels
  }

  // Example: get Figma file URLs
  const figmaUrls = getSourceUrls('figma');
};
```

### Import Path

From modular apps in `data/apps/{app-id}/pages/`:

```javascript
import { useSpaceContext } from '../../../../src/lib/SpaceContext';
```

From core pages in `src/pages/`:

```javascript
import { useSpaceContext } from '../lib/SpaceContext';
```

### What Context Provides

The context value is recalculated (via `useMemo`) whenever `activeSpaceId` or `activeSpace` changes. This means:

- When the user switches spaces, all consuming components re-render with the new context
- Helper functions (`getSourcesByType`, etc.) are stable references within the same space
- If the space has no sources, `sources` is an empty array and helper functions return empty results

## Integration Pattern

When adding space context awareness to an app, follow this pattern:

### 1. Determine Relevant Source Types

What source types does your app care about?

| App | Relevant Sources | Scoping Behavior |
|-----|-----------------|-------------------|
| Tasks | `jira` | Filter by Jira project keys extracted from URLs |
| Slack | `slack` | Default to channels from space sources |
| Wiki | `confluence` | Default to Confluence spaces from sources |
| GitLab | `gitlab` | Default to GitLab repos from sources |
| Feed | `rss`, `slack`, `jira` | Aggregate feeds from space-relevant sources |
| Designs | `figma` | Show Figma files from sources |

### 2. Extract Identifiers from Source URLs

Source URLs need to be parsed to extract the identifiers your app uses for filtering. Example from the Tasks app:

```javascript
const spaceJiraProjectKeys = useMemo(() => {
  if (!spaceSources || spaceSources.length === 0) return [];

  const projectKeys = new Set();

  spaceSources.forEach(source => {
    const url = source.url || '';

    // Match /browse/PROJECT-123 → PROJECT
    const browseMatch = url.match(/\/browse\/([A-Z][A-Z0-9]+-)\d+/i);
    if (browseMatch) {
      projectKeys.add(browseMatch[1].replace(/-$/, '').toUpperCase());
      return;
    }

    // Match /projects/PROJECT → PROJECT
    const projectMatch = url.match(/\/projects?\/([A-Z][A-Z0-9]+)/i);
    if (projectMatch) {
      projectKeys.add(projectMatch[1].toUpperCase());
      return;
    }
  });

  return Array.from(projectKeys);
}, [spaceSources]);
```

### 3. Apply as Default Filter

Apply the space context as a **default filter** that users can toggle off. Don't lock users into the scoped view — always provide a way to "show all."

```javascript
// State: whether space-based scoping is active (default: true)
const [spaceFilterActive, setSpaceFilterActive] = useState(true);

// Reset to active when space changes
useEffect(() => {
  setSpaceFilterActive(true);
}, [activeSpaceId]);

// Apply in your filter logic
const filteredItems = allItems.filter(item => {
  if (hasSpaceContext && spaceFilterActive) {
    // Apply space-based filtering
    if (!spaceProjectKeys.includes(item.projectKey)) {
      return false;
    }
  }
  // ... other filters ...
});
```

### 4. Show UI Indicator

Always show a clear visual indicator when space context is being applied. Users should understand why they're seeing a scoped view and how to change it.

The Tasks app uses a banner pattern:

```
┌─────────────────────────────────────────────────────────┐
│ 🔍 Scoped to 🚀 Ambient  [RHOAIENG]    [Show all tasks]│
└─────────────────────────────────────────────────────────┘
```

Key principles:
- Show the space name and emoji
- Show the extracted identifiers (project keys, channel names, etc.) as labels
- Provide a toggle button to switch between scoped and unscoped views
- Use a distinct background color when scoping is active (e.g., light blue)

## Server-Side Context

For backend routes that need space context, use the API endpoint:

```
GET /api/spaces/active/context
```

Response:

```json
{
  "success": true,
  "spaceId": "design-mode",
  "spaceName": "Ambient",
  "sources": [
    {
      "id": "source-1769795259807",
      "url": "https://issues.redhat.com/browse/RHOAIENG-48120",
      "type": "other",
      "typeName": "Other",
      "label": "https://issues.redhat.com/browse/RHOAIENG-48120",
      "addedAt": "2026-01-30T17:47:39.808Z"
    }
  ],
  "sourcesByType": {
    "other": [{ ... }],
    "jira": [{ ... }]
  }
}
```

This enables backend routes to also filter data based on the current space context, e.g., a tasks API could accept a `spaceId` query parameter and auto-filter server-side.

## Design Principles

1. **Default scoping, optional override.** When a space has relevant sources, apps should scope by default — but always let users toggle to "show all."

2. **Graceful degradation.** If a space has no sources, or no sources relevant to the current app, the app should behave exactly as before (show everything).

3. **Clear communication.** Always tell the user when data is being scoped. Use visual indicators (banners, labels, badges) so there's no confusion about why they're seeing a subset of data.

4. **Per-app interpretation.** Each app decides how to interpret sources. The context provides raw source data; the app is responsible for parsing URLs, extracting identifiers, and applying filters.

5. **Reactive to space changes.** When the user switches spaces, all apps should immediately reflect the new context. This happens automatically via React's context re-rendering.

## Future Considerations

- **Source validation:** Currently sources are just URLs. Future work could validate that configured sources are accessible and resolve to specific entities (e.g., verify a Jira project exists and return its name).

- **Richer source metadata:** Sources could carry additional metadata like display names, icons, or cached entity data to avoid repeated parsing in each app.

- **Server-side scoping:** Backend API routes could accept space context and do the filtering server-side, reducing the amount of data sent to the frontend.

- **Cross-app source awareness:** A space-level dashboard widget could show which apps are currently scoped and to what, giving users an overview of their active context.

- **Source type registry:** A centralized registry of source types with standard URL parsers, so apps don't each need to implement their own URL-to-identifier extraction.

## Related Documentation

- [Data Structures](./data-structures.md) - Artifacts and sources data model
- [Routing](./routing.md) - How routes are configured
- [App Component](./app-component.md) - Main app component architecture
- [Modular Apps](../../data/apps/README.md) - How to create modular apps
- [Create App Skill](../../.cursor/skills/create-app/SKILL.md) - Step-by-step app creation guide
