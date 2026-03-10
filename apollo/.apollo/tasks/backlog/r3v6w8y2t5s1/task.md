---
id: r3v6w8y2t5s1
title: Refactor app architecture to self-contained app folders
type: feature
status: backlog
priority: medium
created: 2025-01-23T00:00:00.000Z
due: null
assignees: []
labels:
  - feature
  - architecture
  - refactor
  - apollo
parent: null
blocks:
  - k7m2p9x4q1n8
blocked_by: []
related:
  - k7m2p9x4q1n8
external: {}
estimate: null
component: core
starred: false
flag: null
---

# Refactor app architecture to self-contained app folders

## Description

Re-architect how pages/apps are organized in Apollo. Currently, each app lives as a standalone `.js` file in `/src/pages/` with corresponding backend routes in `/server/routes/`. This makes it difficult to add, remove, or share apps as cohesive units.

The goal is to restructure apps so everything related to an app (frontend page, backend routes, assets, styles, config) lives in a single folder that can be easily added or removed without breaking other parts of the system.

## User Story

As a **developer**, I want to **keep all app-related files in a single folder**, so that **I can easily add, remove, or share apps without affecting the rest of the system**.

## Goals

1. Each app is self-contained in its own folder
2. Removing an app folder doesn't break Apollo
3. Adding an app folder automatically registers it with Apollo
4. Clear separation between core Apollo and user/community apps

## Non-Goals

- Changing the actual functionality of existing apps
- Plugin sandbox/isolation (security boundary)
- Breaking API compatibility for existing integrations

## Current Structure

```
src/pages/
  Feed.js
  Tasks.js
  Slack.js
  Wiki.js
  ...

server/routes/
  feed.js
  tasks.js
  slack.js
  confluence.js
  ...
```

## Proposed Structure

```
apps/
  feed/
    index.js          # Main page component (React)
    routes.js         # Backend API routes (Express)
    manifest.json     # App metadata, nav config
    assets/           # App-specific assets
    styles.css        # App-specific styles (optional)
  slack/
    index.js
    routes.js
    manifest.json
    lib/              # App-specific utilities
  wiki/
    index.js
    routes.js
    manifest.json

src/pages/            # Core pages that aren't apps
  Welcome.js
  Settings.js
  Profile.js

server/routes/        # Core routes
  config.js
  cache.js
```

## Acceptance Criteria

- [ ] Define app folder structure and manifest format
- [ ] Create app loader that auto-discovers and registers apps
- [ ] Migrate at least 3 existing apps to new structure as proof of concept
- [ ] App removal doesn't cause errors (graceful fallback)
- [ ] Dynamic route registration from app folders
- [ ] Dynamic nav item registration from app manifests
- [ ] Update build process (webpack) to handle new structure
- [ ] Document the new app architecture

## Technical Approach

### App Discovery

On startup, Apollo scans the `apps/` directory for valid app folders (those with a `manifest.json`). Each app is registered:

1. **Frontend**: Dynamic import of `index.js` component
2. **Backend**: Load and mount `routes.js` under `/api/{app-name}/`
3. **Navigation**: Add nav items from manifest to sidebar

### Manifest Format

```json
{
  "name": "slack",
  "displayName": "Slack",
  "description": "Slack integration for Apollo",
  "version": "1.0.0",
  "icon": "SlackIcon",
  "route": "/slack",
  "apiPrefix": "/api/slack",
  "navSection": "integrations",
  "navOrder": 100
}
```

### Graceful Degradation

If an app folder is removed:
- Nav item disappears (no broken links)
- API routes return 404 (not 500)
- No console errors on page load
- Other apps continue to function

### Migration Path

1. Create new structure alongside existing
2. Migrate apps one by one
3. Update imports in `App.js` to use dynamic loading
4. Remove old files once migration complete

## Subtasks

- [ ] Design manifest.json schema
- [ ] Implement app discovery/loader module
- [ ] Create app registration hooks for React Router
- [ ] Create app registration hooks for Express
- [ ] Update webpack config for dynamic imports
- [ ] Migrate Feed app as proof of concept
- [ ] Migrate Slack app
- [ ] Migrate Tasks app
- [ ] Update documentation

## Open Questions

- [ ] Should core pages (Settings, Profile) also use this pattern?
- [ ] How to handle shared components between apps?
- [ ] Hot module replacement for app development?
- [ ] Should apps be able to extend other apps?

## References

- Related: k7m2p9x4q1n8 (App sharing/publishing)
- Inspiration: Next.js app router, Nuxt modules, Obsidian plugins

## History

- 2025-01-23: Created
