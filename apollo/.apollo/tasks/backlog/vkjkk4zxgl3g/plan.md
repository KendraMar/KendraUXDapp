# App Catalog Implementation Plan

This document breaks down the App Catalog epic into detailed implementation phases and subtasks.

## Phase 1: Foundation (Critical Path)

### 1.1 Application Bundle Format Specification (vkjkk4zxgl3g-03)

**Priority:** Critical  
**Estimate:** 2-3 sessions

Define the standard structure for Apollo applications:

```
app-name/
├── manifest.json          # App metadata, permissions, entry points
├── src/
│   ├── index.js          # Main app component
│   ├── routes.js         # App-internal routing
│   ├── components/       # App components
│   └── hooks/            # Custom hooks for Apollo APIs
├── templates/
│   ├── default/          # Default UI templates
│   └── user/             # User customization folder (initially empty)
├── api/
│   ├── schema.json       # API requirements declaration
│   └── handlers/         # Custom API handlers (optional)
├── assets/               # Static assets
└── README.md             # App documentation
```

**Manifest Schema:**
```json
{
  "id": "unique-app-id",
  "name": "Human Readable Name",
  "version": "1.0.0",
  "description": "What the app does",
  "author": {
    "name": "Publisher Name",
    "email": "optional@email.com"
  },
  "entryPoint": "src/index.js",
  "routePrefix": "/apps/app-name",
  "permissions": {
    "dataSources": ["google-drive", "jira"],
    "apis": ["ai", "cache"],
    "capabilities": ["notifications"]
  },
  "minApolloVersion": "1.0.0"
}
```

**Acceptance Criteria:**
- [ ] Manifest schema defined and documented
- [ ] Directory structure specification complete
- [ ] Validation rules for bundle integrity
- [ ] Example application bundle created
- [ ] Security constraints documented

---

### 1.2 Apollo Platform API Layer (vkjkk4zxgl3g-06)

**Priority:** Critical  
**Estimate:** 3-4 sessions

Create a standardized API layer that applications use to access Apollo capabilities:

**API Categories:**

1. **Data Sources** - Access to connected services
   - `apollo.dataSources.google.drive.list()`
   - `apollo.dataSources.jira.getIssues()`
   - `apollo.dataSources.slack.getChannels()`

2. **AI Services** - Local AI model access
   - `apollo.ai.complete(prompt, options)`
   - `apollo.ai.summarize(text)`
   - `apollo.ai.embed(text)`

3. **Storage** - App-specific persistent storage
   - `apollo.storage.get(key)`
   - `apollo.storage.set(key, value)`
   - `apollo.storage.list(prefix)`

4. **Cache** - Caching layer
   - `apollo.cache.get(key)`
   - `apollo.cache.set(key, value, ttl)`

5. **UI Services** - Notifications, modals, etc.
   - `apollo.ui.notify(message, options)`
   - `apollo.ui.confirm(message)`
   - `apollo.ui.openModal(component)`

**Implementation:**
- Create `server/lib/appPlatform.js` - Backend API implementations
- Create `server/routes/appPlatform.js` - REST endpoints for apps
- Create `src/lib/ApolloAppContext.js` - React context for frontend API access

**Acceptance Criteria:**
- [ ] Core API categories implemented
- [ ] Permission checking for each API call
- [ ] API versioning system
- [ ] Error handling and rate limiting
- [ ] Documentation and examples

---

### 1.3 Security Validation & Sandboxing (vkjkk4zxgl3g-09)

**Priority:** Critical  
**Estimate:** 2-3 sessions

Ensure applications cannot access data or capabilities they haven't been granted:

**Security Measures:**

1. **Bundle Validation**
   - Scan for hardcoded secrets, API keys, tokens
   - Validate manifest permissions
   - Check for prohibited file patterns
   - Verify bundle integrity (checksums)

2. **Runtime Sandboxing**
   - Apps only access Apollo APIs, not raw fetch
   - Permission checks on every API call
   - App-scoped storage (can't access other apps' data)
   - No direct filesystem access

3. **Permission Model**
   - User must approve permissions on install
   - Permissions can be revoked
   - Audit log of API access

**Acceptance Criteria:**
- [ ] Bundle scanner implemented
- [ ] Runtime permission checking
- [ ] Secret detection (regex patterns for common tokens)
- [ ] Permission approval UI
- [ ] Audit logging

---

## Phase 2: Application Runtime

### 2.1 Application Namespace & Routing (vkjkk4zxgl3g-05)

**Priority:** High  
**Estimate:** 2 sessions

Isolate application routes from core Apollo pages:

**Routing Structure:**
```
/apps/{app-id}/*        # All app routes under /apps/ prefix
/apps/{app-id}/         # App home/index
/apps/{app-id}/settings # App-specific settings
```

**Implementation:**
- Add catch-all route in `App.js` for `/apps/*`
- Create `AppContainer` component that:
  - Loads app bundle dynamically
  - Wraps app in Apollo Platform Context
  - Handles app-internal routing
  - Provides error boundaries

**Acceptance Criteria:**
- [ ] Route isolation implemented
- [ ] Dynamic app loading
- [ ] App container with context
- [ ] Error boundaries for app crashes
- [ ] Navigation doesn't break core UI

---

### 2.2 Application Installation & Management (vkjkk4zxgl3g-04)

**Priority:** High  
**Estimate:** 2-3 sessions

Handle downloading, installing, and managing applications:

**Installed App Storage:**
```
data/apps/
├── installed.json        # Registry of installed apps
├── {app-id}/
│   ├── manifest.json
│   ├── bundle/           # Downloaded app files
│   └── user-data/        # App-specific user data
```

**Operations:**
- Install from catalog (download bundle, validate, register)
- Uninstall (remove files, cleanup storage)
- Enable/disable (without uninstalling)
- View installed apps

**API Endpoints:**
- `POST /api/apps/install` - Install an app
- `DELETE /api/apps/{id}` - Uninstall an app
- `GET /api/apps` - List installed apps
- `PUT /api/apps/{id}/enabled` - Enable/disable

**Acceptance Criteria:**
- [ ] Install from bundle
- [ ] Uninstall with cleanup
- [ ] Enable/disable toggle
- [ ] Installed apps listing
- [ ] Version tracking

---

### 2.3 User Customization System (vkjkk4zxgl3g-07)

**Priority:** Medium  
**Estimate:** 2 sessions

Allow users to customize the UI of installed applications:

**Customization Layers:**
1. **Default Templates** - Provided by app publisher
2. **User Templates** - Override specific components
3. **Theme Integration** - Apps respect Apollo theme

**Customization Folder:**
```
data/apps/{app-id}/user-data/
├── templates/            # User template overrides
├── settings.json         # User-specific settings
└── styles.css            # User CSS overrides
```

**UI:**
- Settings page for each app
- Template editor (for power users)
- Reset to default option

**Acceptance Criteria:**
- [ ] Template override mechanism
- [ ] Per-app settings storage
- [ ] Reset to defaults
- [ ] Theme integration

---

## Phase 3: Catalog & Discovery

### 3.1 Catalog Source Configuration (vkjkk4zxgl3g-02)

**Priority:** High  
**Estimate:** 1-2 sessions

Configure where to fetch applications from:

**Initial Source:** UXD App Catalog Repository (GitLab)

**Catalog Source Schema:**
```json
{
  "sources": [
    {
      "id": "uxd-catalog",
      "name": "UXD App Catalog",
      "type": "gitlab",
      "url": "https://gitlab.internal/uxd/app-catalog",
      "branch": "main",
      "indexPath": "catalog.json",
      "enabled": true
    }
  ]
}
```

**Implementation:**
- Settings page for catalog sources
- GitLab integration for fetching catalog index
- Support for multiple sources (future)

**Acceptance Criteria:**
- [ ] Catalog source configuration UI
- [ ] GitLab catalog fetching
- [ ] Source enable/disable
- [ ] Error handling for unreachable sources

---

### 3.2 App Catalog Page - Browse & Search UI (vkjkk4zxgl3g-01)

**Priority:** High  
**Estimate:** 2-3 sessions

The main catalog browsing experience:

**Features:**
- Grid/list view of available apps
- Search by name, description, category
- Filter by category, author, etc.
- App detail view with screenshots, description
- Install/update buttons
- Show installed status

**Page Location:** `/catalog` or `/apps/catalog`

**Components:**
- `src/pages/AppCatalog.js` - Main catalog page
- App card component with metadata
- App detail modal/page
- Search and filter controls

**Acceptance Criteria:**
- [ ] Catalog browse page
- [ ] Search functionality
- [ ] App detail view
- [ ] Install/update actions
- [ ] Installed status indicator

---

## Phase 4: Publishing Ecosystem

### 4.1 Application Publishing Workflow (vkjkk4zxgl3g-08)

**Priority:** Medium  
**Estimate:** 2-3 sessions

Enable users to publish their applications:

**Publishing Steps:**
1. **Validate Bundle** - Run security checks
2. **Create Release** - Version, changelog
3. **Package** - Create distributable bundle
4. **Submit** - Push to catalog repository

**Pre-publish Checklist:**
- [ ] No secrets or API keys in bundle
- [ ] Manifest complete and valid
- [ ] README documentation present
- [ ] Screenshots/icons provided
- [ ] Version number incremented

**Implementation:**
- Publishing wizard UI
- Bundle validator
- GitLab MR creation (for catalog PRs)

**Acceptance Criteria:**
- [ ] Bundle validation pre-publish
- [ ] Version management
- [ ] Changelog generation
- [ ] Catalog submission workflow
- [ ] Documentation requirements enforced

---

### 4.2 Update Detection & Distribution (vkjkk4zxgl3g-10)

**Priority:** Medium  
**Estimate:** 1-2 sessions

Keep installed applications up to date:

**Features:**
- Check for updates on catalog sync
- Show available updates in UI
- One-click update
- Changelog display
- Rollback capability (future)

**Implementation:**
- Version comparison logic
- Update notification badge
- Update installation process
- Preserve user customizations during update

**Acceptance Criteria:**
- [ ] Update detection
- [ ] Update installation
- [ ] Changelog display
- [ ] User customizations preserved
- [ ] Update notification

---

## Technical Considerations

### File System Layout

```
data/
├── config.json              # Add catalog sources config
├── apps/
│   ├── installed.json       # Installed apps registry
│   ├── {app-id}/
│   │   ├── manifest.json
│   │   ├── bundle/
│   │   └── user-data/
│   └── cache/
│       └── catalogs/        # Cached catalog indexes
```

### API Endpoints Summary

```
# Catalog
GET  /api/catalog/sources      # List configured sources
POST /api/catalog/sources      # Add catalog source
GET  /api/catalog/apps         # List apps from all sources
GET  /api/catalog/apps/:id     # Get app details

# Installed Apps
GET  /api/apps                 # List installed apps
POST /api/apps/install         # Install an app
DELETE /api/apps/:id           # Uninstall
PUT  /api/apps/:id/enabled     # Enable/disable
GET  /api/apps/:id/updates     # Check for updates
POST /api/apps/:id/update      # Apply update

# App Platform (used by apps)
POST /api/platform/:appId/*    # Proxied API calls with permission checking
```

### React Components

```
src/
├── pages/
│   ├── AppCatalog.js         # Catalog browsing
│   ├── AppDetail.js          # Single app detail page
│   └── InstalledApps.js      # Manage installed apps
├── components/
│   └── apps/
│       ├── AppCard.js        # App listing card
│       ├── AppContainer.js   # Runtime container for apps
│       └── PermissionGate.js # Permission approval UI
└── lib/
    └── ApolloAppContext.js   # App platform API context
```

---

## Implementation Order

**Phase 1 (Foundation) - Must complete first:**
1. Application Bundle Format Specification
2. Apollo Platform API Layer  
3. Security Validation & Sandboxing

**Phase 2 (Runtime) - Enable running apps:**
4. Application Namespace & Routing
5. Application Installation & Management
6. User Customization System

**Phase 3 (Discovery) - Catalog experience:**
7. Catalog Source Configuration
8. App Catalog Page

**Phase 4 (Ecosystem) - Publishing:**
9. Application Publishing Workflow
10. Update Detection & Distribution

---

## Open Questions

1. **Bundle format:** Should apps be distributed as single files (zip) or as Git repos?
2. **Transpilation:** Do apps need to be pre-built, or should Apollo build them on install?
3. **Shared dependencies:** How do apps share React/PatternFly to reduce bundle sizes?
4. **Offline support:** How do apps work when catalog sources are unavailable?
5. **Inter-app communication:** Should apps be able to communicate with each other?

---

## Related Documentation

- [Epic Overview](./README.md)
- [Architecture Details](./architecture.md)
- Apollo Design Principles: `docs/design/principles.md`
