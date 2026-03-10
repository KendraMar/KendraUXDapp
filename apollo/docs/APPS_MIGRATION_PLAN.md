# Apollo: Migration Plan — Baked-in Pages to Modular Apps

This document is the plan to move all non-core pages from the main Apollo codebase into modular applications under `data/apps/`, so each area can eventually live in a centralized catalog and be published as its own repository (extension of the Apollo framework).

## Goals

1. **Decompose** every migratable page/feature into a self-contained app in `data/apps/{app-id}/`.
2. **Preserve behavior**: Same URLs, same APIs, same nav; only the source of truth moves from `src/` and `server/routes/` to `data/apps/`.
3. **Catalog-ready**: Structure each app so it can later be extracted to its own repo and published to a central catalog as an Apollo extension.

## Out of Scope (Stay in Core)

These remain in `src/pages/` and `src/routes.js`:

| Page           | Path(s)                      | Reason |
|----------------|------------------------------|--------|
| Welcome        | `/welcome`                   | Landing; core identity |
| Dashboard      | `/dashboard`                 | Core shell |
| Settings       | `/settings`                  | App-wide configuration |
| Profile        | `/profile`                   | User identity |
| SpaceSettings  | `/spaces/:spaceId/configure` | Space configuration |

Navigation for these stays in `coreNavItems` in `src/components/AppSidebar/constants.js`. Everything else below should move to apps.

## Current State

- **Already modular:** `data/apps/kubernetes/`, `data/apps/catalog/`.
- **Still baked-in:** All other pages listed in `src/routes.js` and their nav entries in `coreNavItems`, plus API routes in `server/routes/` and mounts in `server/index.js`.

After migration:

- Each migrated feature will live under `data/apps/{app-id}/` with its own `manifest.json`, `pages/`, and optional `routes.js`.
- `src/routes.js` will only import and list core pages (Welcome, Dashboard, Settings, Profile, SpaceSettings).
- `coreNavItems` will only list those same core pages; all other nav items will come from `getAppNavItems()` (manifests in `data/apps/`).
- `server/index.js` will only mount core API routes (e.g. config, spaces, cache, agents, chats, etc.) and `mountAppRoutes(app)`; app-specific APIs will be mounted via app loader.

## Migration Phases

Phases are ordered by complexity and dependency risk: simple pages first, then integrations, then content/feature apps with subfolders and shared context.

---

### Phase 1: Simple pages (no API routes)

Single-component pages with no backend. Easiest to move; no server changes.

| App ID      | Display Name | Path       | Source Page   | Icon           |
|-------------|--------------|------------|---------------|----------------|
| `wiki`      | Wiki         | `/wiki`    | Wiki.js       | BookOpenIcon   |
| `designs`   | Designs      | `/designs` | Designs.js    | PaintBrushIcon |
| `components`| Components   | `/components` | Components.js | CubesIcon   |
| `artifacts` | Artifacts    | `/artifacts` | Artifacts.js | ArchiveIcon  |

**Steps per app (template):**

1. Create `data/apps/{app-id}/` and `data/apps/{app-id}/pages/`.
2. Add `manifest.json` (id, displayName, description, icon, navItem, routes; no apiPath).
3. Copy `src/pages/{Page}.js` → `data/apps/{app-id}/pages/{Page}.js`; fix any imports that reference `../` outside the app (see “Shared dependencies” below).
4. Remove route from `src/routes.js` and remove nav item from `coreNavItems` in `src/components/AppSidebar/constants.js`.
5. Test: nav, route, and page load.
6. Delete `src/pages/{Page}.js` once stable.

---

### Phase 2: Integration pages (one page + one server route file)

One main page and one flat server route file. Straightforward copy of page + routes.

| App ID         | Display Name   | Path          | Page      | Server Route      | Icon             |
|----------------|----------------|---------------|-----------|-------------------|------------------|
| `slack`        | Slack          | `/slack`      | Slack.js  | slack.js          | SlackHashIcon    |
| `gitlab`       | GitLab         | `/gitlab`     | GitLab.js  | gitlab.js         | GitlabIcon       |
| `figma`        | Figma          | `/figma`      | Figma.js  | figma.js          | ObjectGroupIcon  |
| `rss`          | RSS            | `/rss`        | Rss/*     | rss.js            | RssIcon          |
| `librechat`    | LibreChat      | `/librechat`  | LibreChat.js | librechat.js  | CommentsIcon     |
| `screenshots`  | Screenshots    | `/screenshots`| Screenshots.js | screenshots.js | CameraIcon   |

**Steps per app:**

1. Create app folder and `pages/`.
2. Add `manifest.json` (include `apiPath` matching current mount, e.g. `/api/slack`).
3. Copy page(s): single file or whole folder (e.g. `Rss/` → `data/apps/rss/pages/`). Fix imports (paths, shared libs).
4. Copy `server/routes/{name}.js` → `data/apps/{app-id}/routes.js`. If the current route uses submodules, either inline or require from a `lib/` inside the app folder (app loader only loads one `routes.js` per app; that file can require other modules under the app).
5. Remove from `src/routes.js`, `coreNavItems`, and `server/index.js` (require + `app.use(...)`).
6. Test nav, page, and API.
7. Remove original `src/pages/...` and `server/routes/...`.

**Note:** Calendar uses `server/routes/google/` (calendar + drive + OAuth). Treat as Phase 3 or a dedicated “google” app with a single `routes.js` that requires the existing `google/` modules from a path relative to the app (or move a copy of calendar-only logic into the app).

---

### Phase 3: Content and feature apps (multi-page or multi-file server routes)

Multiple pages (list + detail), or server routes split across multiple files/folders. Move entire trees and keep structure under the app.

| App ID        | Display Name | Paths                    | Pages / Structure              | Server Routes           |
|---------------|--------------|--------------------------|--------------------------------|-------------------------|
| `recordings`   | Recordings   | /recordings, /recordings/:id | Recordings/, RecordingDetail/ | recordings/ (folder)   |
| `slides`       | Slides       | /slides, /slides/:id     | Slides.js, SlideDetail/       | slides/ (folder)        |
| `canvas`       | Canvas       | /canvas, /canvas/:id    | Canvas.js, CanvasDetail/       | canvas.js               |
| `prototypes`   | Prototypes   | /prototypes, /prototypes/:id | Prototypes.js, PrototypeDetail.js | prototypes.js   |
| `code`         | Code         | /code, /code/:id        | Code.js, CodeDetail.js         | code.js                 |
| `documents`    | Documents    | /documents, /documents/:id | Documents.js, DocumentDetail/ | documents.js (factory)  |
| `discussions`  | Discussions  | /discussions, /discussions/:id | Discussions.js, DiscussionDetail.js | discussions.js |
| `bulletin`     | Bulletin     | /bulletin, /bulletin/:id | Bulletin.js, BulletinDetail.js | bulletins.js            |
| `moodboard`    | Mood Board   | /moodboard              | MoodBoard/                     | moodboard.js            |
| `tasks`        | Tasks        | /tasks                  | Tasks/                         | tasks.js                |
| `feed`         | Feed         | /feed                   | Feed.js                        | feed.js                 |
| `chat`         | Chat         | /chat                   | Chat.js                        | chat.js, chats.js       |

**Steps per app:**

1. Create app folder and `pages/`.
2. Copy all page files/folders into `data/apps/{app-id}/pages/`. Preserve internal structure (e.g. `pages/Recordings/`, `pages/RecordingDetail/`) and update internal imports. For entry points used in routes, ensure the file that the manifest references (e.g. `Recordings` → `Recordings/index.js` or `Recordings.js`) exists and exports default.
3. Add `manifest.json` with all routes and correct `apiPath`.
4. Backend: either  
   - single `routes.js` that `require()`s the existing server module from a path (e.g. copy `server/routes/recordings/` into `data/apps/recordings/server/` and from `routes.js` do `require('./server')`), or  
   - flatten/inline into one `routes.js` if small. Document in plan that app loader currently supports one `routes.js` per app; multi-file server code can live under the app directory and be required by that single entry.
5. **Shared context:** Recordings uses `RecordingContext`, Music uses `MusicContext`; both are provided in `App.js`. For apps that stay in-repo, options: (a) keep context in core and add a webpack alias so app code can `import from 'apollo/RecordingContext'` or similar, or (b) pass context via React context from core and document that as the host contract. For catalog/publish, the host (Apollo) will provide these; apps declare dependency on the host and use the same import contract. Plan: keep providers in App.js; add a small “core API” alias so that `data/apps/*/pages/**` can import `RecordingContext` / `MusicContext` from the host. Implement when migrating Recordings/Music.
6. Remove from `src/routes.js`, `coreNavItems`, and `server/index.js`.
7. Test all list/detail routes and API endpoints.
8. Remove original `src/pages/...` and `server/routes/...`.

---

### Phase 4: Integrations with more complex backend or shared code

| App ID          | Display Name   | Path         | Notes |
|-----------------|----------------|-------------|-------|
| `calendar`      | Calendar       | `/calendar` | Uses `server/routes/google/` (calendar + drive + OAuth). Either new app with `routes.js` requiring shared google routes, or copy only calendar-related routes into app. |
| `homeassistant` | Home Assistant | `/homeassistant` | homeassistant.js. Optional: HomeAssistantActivityTracker in App.js could stay in core and remain global. |
| `music`         | Music          | `/music`    | Uses MusicContext in App.js; same shared-context approach as Recordings. |
| `research`      | Research       | `/research` | May use AI routes; confirm and either keep API in core or move into app. |
| `playground`    | Playground     | `/playground` | Same as Research. |
| `assets`        | Assets         | `/assets`   | “Uses various routes”; map which APIs and move or re-export from app. |

Handle each with the same pattern: move pages, one `routes.js` (or re-export of existing route module), then remove from core. Document any remaining core dependency (e.g. OAuth callback URL, global tracker).

---

## Shared Dependencies and Core Contract

- **PatternFly / React:** Apps already use the same stack; no change.
- **Contexts provided by core:** `RecordingContext`, `MusicContext` (and any future host-provided context) stay in `src/lib/`. Options:
  - Add a webpack alias (e.g. `@apollo/core` or `apollo/lib`) so that `data/apps/*/pages/**` can import from core. Then Recordings/Music apps import from that alias.
  - Or keep these apps’ entry components in core and only the “content” part in the app; that’s more coupled. Prefer the alias so the app stays one place.
- **Shared page components:** `src/pages/components/` (e.g. PrototypeContextPanel, DataDisplay) are used by several pages. Options: (a) copy into each app that needs them, (b) move to a shared `src/components/` or `lib/` and have apps import via alias, or (c) create a small “design system” app that exports components and is not a nav app. For catalog, (b) or (c) keeps a single place for shared UI. Plan: when migrating a page that uses `src/pages/components/*`, introduce an alias (e.g. `@apollo/components`) and move those components to a core path; then apps import via alias.
- **Server shared libs:** Some `server/routes/*` use `server/lib/*`. When moving a route into an app, either copy the minimal lib code into the app or keep the lib in core and require it from app `routes.js` (e.g. `require('../../../server/lib/xyz')`). Prefer keeping one copy in core and requiring from app to avoid drift; document in app README.

## Catalog and Repo Readiness

So that each app can later live in its own repo and be published to a central catalog:

1. **Manifest:** Keep and extend as needed: `id`, `displayName`, `description`, `icon`, `version`, `enabled`, `navItem`, `routes`, `apiPath`. For catalog, consider adding: `repository`, `license`, `author`, `keywords`, `apolloMinVersion`.
2. **App layout:** Each app is self-contained under `data/apps/{id}/`. When extracting to a repo, the repo root can mirror that (e.g. `manifest.json`, `pages/`, `routes.js` at root). Catalog can install by copying this tree into `data/apps/{id}/`.
3. **Dependencies on Apollo:** Document in each app’s README (or in manifest) which “core” imports it uses (e.g. `@apollo/core` for RecordingContext). Catalog can enforce `apolloMinVersion` and list required host capabilities.
4. **Versioning:** Use semantic versioning in manifest; catalog can use this for updates and compatibility.

No code change required for catalog beyond optional manifest fields; the current structure is already catalog-ready.

## Execution Checklist (Per App)

- [ ] Create `data/apps/{app-id}/` and `pages/` (and optional `server/` or `lib/` under app if needed).
- [ ] Write `manifest.json` (paths and apiPath match existing).
- [ ] Copy and adapt page component(s); fix imports; ensure default export for route entry.
- [ ] Copy or wire server routes into `routes.js`; ensure mount path matches `apiPath`.
- [ ] Remove route from `src/routes.js`.
- [ ] Remove nav item from `coreNavItems` in `src/components/AppSidebar/constants.js`.
- [ ] Remove require and `app.use` from `server/index.js`.
- [ ] Test: nav, all routes, all API endpoints.
- [ ] Remove original files from `src/pages/` and `server/routes/`.
- [ ] Optional: add short README under app folder for catalog/repo.

## Order of Work Summary

1. **Phase 1** — Wiki, Designs, Components, Artifacts (4 apps).
2. **Phase 2** — Slack, GitLab, Figma, RSS, LibreChat, Screenshots (6 apps); then Calendar if treated as a single app.
3. **Phase 3** — Recordings, Slides, Canvas, Prototypes, Code, Documents, Discussions, Bulletin, MoodBoard, Tasks, Feed, Chat (12 apps). Implement shared-context alias when doing Recordings/Music.
4. **Phase 4** — Calendar (if not in Phase 2), Home Assistant, Music, Research, Playground, Assets (6 apps).

Total: ~28 migratable apps (excluding Kubernetes and Catalog already done).

## Open Decisions

- **Google/Calendar:** One “calendar” app that depends on shared `server/routes/google/` vs. a self-contained copy of calendar-only logic.
- **Chat:** Chat uses `chat.js` and `chats.js`; either one app that mounts both under one `apiPath` (e.g. `/api/chat` and `/api/chats` as sub-routers from one `routes.js`) or keep one in core. Prefer one app with one `routes.js` that mounts both routers under the same or two prefixes if the loader supports it (currently one apiPath per app — so one router that mounts both at `/api/chat` and `/api/chats` from the same app may require server loader change to allow multiple mounts per app, or merge into a single prefix).
- **Assets:** Clarify which APIs it uses and whether to move them into an `assets` app or keep in core.

---

Once this plan is approved, migration can proceed phase by phase; each app can be done in a single PR or batched by phase.
