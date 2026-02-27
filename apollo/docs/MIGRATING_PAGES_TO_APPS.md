# Migrating Core Pages to Modular Apps

This is a **one-time migration guide** for converting existing pages in `src/pages/` into modular apps in `data/apps/`. Once all pages are migrated, this document can be archived.

**See also:** [APPS_MIGRATION_PLAN.md](./APPS_MIGRATION_PLAN.md) for the full phased plan (order, catalog readiness, shared dependencies).

For creating **new** apps from scratch, see `.cursor/skills/create-app/SKILL.md`.

## Overview

Apollo is transitioning from hardcoded pages to a modular app architecture. Each app becomes a self-contained folder in `data/apps/` that can be independently added or removed.

### Before (Hardcoded)
```
src/pages/Kubernetes.js              # Page component
src/pages/KubernetesResourceDetail.js
server/routes/kubernetes.js          # API routes
src/App.js                           # Route registration
src/components/AppSidebar.js         # Nav item registration
server/index.js                      # API route mounting
```

### After (Modular)
```
data/apps/kubernetes/
├── manifest.json
├── pages/
│   ├── Kubernetes.js
│   └── KubernetesResourceDetail.js
└── routes.js
```

## Migration Process

### Step 1: Create the App Folder Structure

```bash
mkdir -p data/apps/{app-id}/pages
```

Use kebab-case for the folder name (e.g., `home-assistant` not `homeAssistant`).

### Step 2: Create the Manifest

Create `data/apps/{app-id}/manifest.json`:

```json
{
  "id": "{app-id}",
  "displayName": "{Display Name}",
  "description": "Brief description",
  "icon": "{IconName}",
  "version": "1.0.0",
  "enabled": true,
  "navItem": {
    "path": "/{url-path}",
    "displayName": "{Nav Label}",
    "icon": "{IconName}"
  },
  "routes": [
    { "path": "/{url-path}", "page": "{ComponentName}" },
    { "path": "/{url-path}/:id", "page": "{ComponentName}Detail" }
  ],
  "apiPath": "/api/{api-path}"
}
```

**Important:** Match the existing URL paths and API paths exactly to avoid breaking links.

### Step 3: Copy Page Components

Copy the page files from `src/pages/` to `data/apps/{app-id}/pages/`:

```bash
cp src/pages/{ComponentName}.js data/apps/{app-id}/pages/
cp src/pages/{ComponentName}Detail.js data/apps/{app-id}/pages/  # if exists
```

**Note:** The components usually don't need modification - they work as-is.

### Step 4: Copy Server Routes (if applicable)

If the page has backend API routes:

```bash
cp server/routes/{route-file}.js data/apps/{app-id}/routes.js
```

**Note:** The routes file usually works as-is since it already exports an Express router.

### Step 5: Remove from Core Codebase

#### 5a. Remove from `src/App.js`

Find and comment out or remove the import:
```javascript
// Before
import Kubernetes from './pages/Kubernetes';
import KubernetesResourceDetail from './pages/KubernetesResourceDetail';

// After
// Kubernetes is now loaded as a modular app from data/apps/kubernetes/
```

Find and comment out or remove the routes:
```javascript
// Before
<Route path="/kubernetes" element={<Kubernetes />} />
<Route path="/kubernetes/:resourceType/:namespace/:name" element={<KubernetesResourceDetail />} />

// After
{/* Kubernetes routes are now loaded dynamically from data/apps/kubernetes/ */}
```

#### 5b. Remove from `src/components/AppSidebar.js`

Find the nav item in `coreNavItems` array and comment it out:
```javascript
// Before
{ id: 'kubernetes', path: '/kubernetes', displayName: 'Kubernetes', icon: 'CubesIcon' },

// After
// Kubernetes is now loaded as a modular app from data/apps/kubernetes/
```

#### 5c. Remove from `server/index.js`

Find and comment out the route import:
```javascript
// Before
const kubernetesRoutes = require('./routes/kubernetes');

// After
// Kubernetes routes are now loaded dynamically from data/apps/kubernetes/
```

Find and comment out the route mounting:
```javascript
// Before
app.use('/api/kubernetes', kubernetesRoutes);

// After
// Kubernetes routes are now loaded dynamically from data/apps/kubernetes/
```

### Step 6: Test

1. Restart Apollo (`npm run dev`)
2. Verify the app appears in navigation
3. Verify the page loads correctly
4. Verify API endpoints work (if applicable)
5. Verify all sub-routes work (detail pages, etc.)

### Step 7: Clean Up (Optional)

Once confirmed working, you can delete the original files:
- `src/pages/{ComponentName}.js`
- `src/pages/{ComponentName}Detail.js`
- `server/routes/{route-file}.js`

**Recommendation:** Keep the original files commented out for a while before deleting, in case rollback is needed.

## Pages to Migrate

Below is the current state of pages. Check off as each is migrated.

### Already Migrated
- [x] Kubernetes (`data/apps/kubernetes/`)

### Integration Pages (Have API Routes)
These pages have both frontend components and backend API routes:

- [ ] Slack (`src/pages/Slack.js`, `server/routes/slack.js`)
- [ ] GitLab (`src/pages/GitLab.js`, `server/routes/gitlab.js`)
- [ ] Figma (`src/pages/Figma.js`, `server/routes/figma.js`)
- [ ] Calendar (`src/pages/Calendar.js`, `server/routes/google.js`)
- [ ] Home Assistant (`src/pages/HomeAssistant.js`, `server/routes/homeassistant.js`)
- [ ] RSS (`src/pages/Rss.js`, `server/routes/rss.js`)
- [ ] LibreChat (`src/pages/LibreChat.js`, `server/routes/librechat.js`)
- [ ] Music (`src/pages/Music.js`, `server/routes/applemusic.js`)

### Content Pages (Have API Routes)
- [ ] Recordings + RecordingDetail (`server/routes/recordings.js`)
- [ ] Slides + SlideDetail (`server/routes/slides.js`)
- [ ] Canvas + CanvasDetail (`server/routes/canvas.js`)
- [ ] Prototypes + PrototypeDetail (`server/routes/prototypes.js`)
- [ ] Code + CodeDetail (`server/routes/code.js`)
- [ ] Documents + DocumentDetail (`server/routes/documents.js`)
- [ ] Discussions + DiscussionDetail (`server/routes/discussions.js`)
- [ ] Bulletin + BulletinDetail (`server/routes/bulletins.js`)
- [ ] Screenshots (`server/routes/screenshots.js`)
- [ ] MoodBoard (`server/routes/moodboard.js`)
- [ ] Assets (uses various routes)

### Feature Pages (Have API Routes)
- [ ] Tasks (`server/routes/tasks.js`)
- [ ] Chat (`server/routes/chat.js`, `server/routes/chats.js`)
- [ ] Feed (`server/routes/feed.js`)
- [ ] Research (may use AI routes)
- [ ] Playground (may use AI routes)

### Simple Pages (No API Routes)
- [ ] Wiki
- [ ] Designs
- [ ] Components
- [ ] Artifacts

### Core Pages (Should NOT Migrate)
These are core to Apollo and should remain in `src/pages/`:

- Welcome - Initial landing page
- Dashboard - Core dashboard
- Settings - App settings
- Profile - User profile
- SpaceSettings - Space configuration

## Mapping Reference

| Page | URL Path | API Path | Icon |
|------|----------|----------|------|
| Slack | /slack | /api/slack | SlackHashIcon |
| GitLab | /gitlab | /api/gitlab | GitlabIcon |
| Figma | /figma | /api/figma | ObjectGroupIcon |
| Calendar | /calendar | /api/google | CalendarAltIcon |
| HomeAssistant | /homeassistant | /api/homeassistant | HomeIcon |
| RSS | /rss | /api/rss | RssIcon |
| LibreChat | /librechat | /api/librechat | CommentsIcon |
| Music | /music | /api/applemusic | VideoIcon |
| Recordings | /recordings | /api/recordings | VideoIcon |
| Slides | /slides | /api/slides | ScreenIcon |
| Canvas | /canvas | /api/canvas | TopologyIcon |
| Prototypes | /prototypes | /api/prototypes | CubesIcon |
| Code | /code | /api/code | CodeIcon |
| Documents | /documents | /api/documents | BookOpenIcon |
| Discussions | /discussions | /api/discussions | CommentsIcon |
| Bulletin | /bulletin | /api/bulletins | ClipboardIcon |
| Screenshots | /screenshots | /api/screenshots | CameraIcon |
| MoodBoard | /moodboard | /api/moodboard | PaletteIcon |
| Tasks | /tasks | /api/tasks | ListIcon |
| Chat | /chat | /api/chat | CommentsIcon |
| Feed | /feed | /api/feed | InboxIcon |
| Research | /research | - | BookIcon |
| Playground | /playground | - | FlaskIcon |
| Wiki | /wiki | - | BookOpenIcon |
| Designs | /designs | - | PaintBrushIcon |
| Components | /components | - | CubesIcon |
| Artifacts | /artifacts | - | ArchiveIcon |
| Assets | /assets | - | PaletteIcon |

## Common Issues During Migration

### Issue: App not appearing in navigation
**Solution:** Check that `manifest.json` has valid JSON syntax and `navItem` is properly defined.

### Issue: Routes not working
**Solution:** Ensure `routes[].page` matches the exact filename (without .js) and the component has a default export.

### Issue: API calls failing
**Solution:** Verify `apiPath` in manifest matches the original API path exactly (e.g., `/api/kubernetes`).

### Issue: Detail pages not loading
**Solution:** Check that the route path pattern matches (e.g., `/kubernetes/:resourceType/:namespace/:name`).

### Issue: Duplicate routes
**Solution:** Make sure you removed the routes from both `src/App.js` AND commented out the old import.

## Notes

- The dynamic route loading happens after static routes, so if you forget to remove a static route, it will take precedence
- Apps with `enabled: false` in their manifest won't load
- The server must be restarted for route changes to take effect
- The webpack dev server hot-reloads page component changes but not manifest changes
