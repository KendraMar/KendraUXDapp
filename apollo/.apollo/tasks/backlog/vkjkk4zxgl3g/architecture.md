# App Catalog Architecture

This document describes the technical architecture for the App Catalog system.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Apollo Application                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────────┐ │
│  │   Masthead   │  │   Sidebar    │  │      Content Area          │ │
│  │   (Fixed)    │  │   (Fixed)    │  │  ┌──────────────────────┐  │ │
│  │              │  │              │  │  │   App Container      │  │ │
│  │              │  │  - Core Nav  │  │  │  ┌────────────────┐  │  │ │
│  │              │  │  - Apps Nav  │  │  │  │  User App      │  │  │ │
│  │              │  │              │  │  │  │  (Sandboxed)   │  │  │ │
│  │              │  │              │  │  │  │                │  │  │ │
│  │              │  │              │  │  │  └────────────────┘  │  │ │
│  │              │  │              │  │  └──────────────────────┘  │ │
│  └──────────────┘  └──────────────┘  └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Application Isolation Model

Apps run in a sandboxed container within Apollo's content area:

1. **Visual Isolation**: Apps cannot modify masthead, sidebar, or other core UI
2. **Route Isolation**: All app routes prefixed with `/apps/{app-id}/`
3. **Data Isolation**: Apps have their own storage namespace
4. **API Isolation**: Apps access Apollo services through the Platform API only

## Component Architecture

### Frontend Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         App.js (Router)                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Route: /apps/:appId/*                                      │ │
│  │  ┌─────────────────────────────────────────────────────┐   │ │
│  │  │ AppContainer                                         │   │ │
│  │  │  ┌────────────────────────────────────────────────┐  │   │ │
│  │  │  │ ApolloAppContext.Provider                      │  │   │ │
│  │  │  │  ┌─────────────────────────────────────────┐   │  │   │ │
│  │  │  │  │ ErrorBoundary                           │   │  │   │ │
│  │  │  │  │  ┌──────────────────────────────────┐   │   │  │   │ │
│  │  │  │  │  │ DynamicAppLoader                 │   │   │  │   │ │
│  │  │  │  │  │  ┌───────────────────────────┐   │   │   │  │   │ │
│  │  │  │  │  │  │ User Application          │   │   │   │  │   │ │
│  │  │  │  │  │  │ (from bundle)             │   │   │   │  │   │ │
│  │  │  │  │  │  └───────────────────────────┘   │   │   │  │   │ │
│  │  │  │  │  └──────────────────────────────────┘   │   │  │   │ │
│  │  │  │  └─────────────────────────────────────────┘   │  │   │ │
│  │  │  └────────────────────────────────────────────────┘  │   │ │
│  │  └─────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Express Server                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ /api/catalog/*  │  │ /api/apps/*     │  │ /api/platform/* │  │
│  │                 │  │                 │  │                 │  │
│  │ - List sources  │  │ - Install       │  │ - Data sources  │  │
│  │ - Browse apps   │  │ - Uninstall     │  │ - AI services   │  │
│  │ - App details   │  │ - List installed│  │ - Storage       │  │
│  │                 │  │ - Updates       │  │ - Cache         │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                     │           │
│  ┌────────▼────────────────────▼─────────────────────▼────────┐  │
│  │                    lib/appPlatform.js                      │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │ Permission Checker                                   │  │  │
│  │  │ - Validates app permissions for each API call        │  │  │
│  │  │ - Enforces rate limits                               │  │  │
│  │  │ - Audit logging                                      │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                Existing Apollo Routes                       │  │
│  │  /api/jira, /api/slack, /api/google, /api/ai, etc.         │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### App Installation Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐     ┌────────────┐
│  User    │────▶│ App Catalog  │────▶│ Bundle Download │────▶│ Validation │
│ clicks   │     │   Page       │     │ from GitLab     │     │  & Scan    │
│ install  │     └──────────────┘     └─────────────────┘     └─────┬──────┘
└──────────┘                                                        │
                                                                    ▼
┌──────────────┐     ┌─────────────────┐     ┌─────────────────────────────┐
│ App Ready    │◀────│ Register in     │◀────│ Permission Approval Dialog  │
│ to Use       │     │ installed.json  │     │ (if new permissions)        │
└──────────────┘     └─────────────────┘     └─────────────────────────────┘
```

### App Runtime API Flow

```
┌──────────────┐     ┌───────────────────┐     ┌─────────────────────┐
│  User App    │────▶│ apollo.dataSources│────▶│ Platform API        │
│              │     │ .jira.getIssues() │     │ (permission check)  │
└──────────────┘     └───────────────────┘     └──────────┬──────────┘
                                                          │
                                                          ▼
┌──────────────┐     ┌───────────────────┐     ┌─────────────────────┐
│  Response    │◀────│ Sanitized         │◀────│ /api/jira/issues    │
│  to App      │     │ Response          │     │ (existing route)    │
└──────────────┘     └───────────────────┘     └─────────────────────┘
```

## Security Model

### Permission Levels

| Level | Description | Examples |
|-------|-------------|----------|
| **read** | Read-only access to data | View Jira issues, read calendar |
| **write** | Create/update data | Create Jira comments, update events |
| **admin** | Full access including delete | Delete issues, modify settings |

### Data Source Permissions

Each data source has its own permission scope:

```json
{
  "permissions": {
    "dataSources": {
      "jira": ["read", "write"],
      "google-drive": ["read"],
      "slack": ["read"]
    },
    "apis": {
      "ai": ["complete", "summarize"],
      "storage": ["read", "write"]
    }
  }
}
```

### Bundle Validation Rules

1. **No Secrets**: Scan for patterns matching:
   - API keys: `[a-zA-Z0-9]{32,}`
   - JWT tokens: `eyJ...`
   - Private keys: `-----BEGIN.*PRIVATE KEY-----`
   - Environment variables: `process.env.SECRET_`

2. **No Direct HTTP**: Apps should not make direct fetch calls
   - Scan for `fetch(`, `axios`, `XMLHttpRequest`
   - Allow only Apollo Platform API calls

3. **Manifest Validation**:
   - Required fields present
   - Valid permission format
   - No reserved route prefixes

4. **File Integrity**:
   - Checksum validation
   - No executable files
   - No symlinks outside bundle

## Storage Architecture

```
data/
├── config.json                 # Apollo config (add catalog sources)
├── apps/
│   ├── installed.json          # Registry of installed apps
│   │   {
│   │     "apps": [
│   │       {
│   │         "id": "app-id",
│   │         "version": "1.0.0",
│   │         "installedAt": "2025-01-30T...",
│   │         "enabled": true,
│   │         "grantedPermissions": {...}
│   │       }
│   │     ]
│   │   }
│   │
│   ├── my-app/                 # Installed app directory
│   │   ├── manifest.json       # App manifest
│   │   ├── bundle/             # App source files
│   │   │   ├── src/
│   │   │   ├── templates/
│   │   │   └── assets/
│   │   └── user-data/          # User customizations & data
│   │       ├── templates/      # User template overrides
│   │       ├── settings.json   # User settings
│   │       └── storage/        # App-specific storage (via API)
│   │
│   └── cache/
│       └── catalogs/           # Cached catalog indexes
│           └── uxd-catalog.json
```

## API Reference

### Platform API (for apps)

```javascript
// Available via ApolloAppContext

const apollo = useApolloApp();

// Data Sources
await apollo.dataSources.jira.getIssues(query);
await apollo.dataSources.slack.getChannels();
await apollo.dataSources.google.drive.list(folderId);

// AI Services  
await apollo.ai.complete(prompt, { model: 'default' });
await apollo.ai.summarize(text);

// Storage (app-scoped)
await apollo.storage.get('key');
await apollo.storage.set('key', value);
await apollo.storage.delete('key');

// Cache
await apollo.cache.get('key');
await apollo.cache.set('key', value, ttlSeconds);

// UI Services
apollo.ui.notify('Message', { type: 'success' });
const confirmed = await apollo.ui.confirm('Are you sure?');
```

### Catalog API (for Apollo)

```
GET  /api/catalog/sources
POST /api/catalog/sources
PUT  /api/catalog/sources/:id
DELETE /api/catalog/sources/:id

GET  /api/catalog/apps
GET  /api/catalog/apps/:appId
GET  /api/catalog/apps/:appId/versions
```

### App Management API (for Apollo)

```
GET    /api/apps
POST   /api/apps/install  { sourceId, appId, version? }
DELETE /api/apps/:appId
PUT    /api/apps/:appId/enabled  { enabled: boolean }
GET    /api/apps/:appId/updates
POST   /api/apps/:appId/update
```

## Routing Implementation

### App Router Setup

```javascript
// In App.js

<Route path="/apps/:appId/*" element={<AppContainer />} />
```

### AppContainer Component

```javascript
// Conceptual implementation

function AppContainer() {
  const { appId } = useParams();
  const app = useInstalledApp(appId);
  
  if (!app) return <NotFound />;
  if (!app.enabled) return <AppDisabled />;
  
  return (
    <ApolloAppContext.Provider value={createAppContext(app)}>
      <ErrorBoundary fallback={<AppError />}>
        <Suspense fallback={<AppLoading />}>
          <DynamicAppLoader app={app} />
        </Suspense>
      </ErrorBoundary>
    </ApolloAppContext.Provider>
  );
}
```

## User Customization

### Template Override System

Apps define default templates that users can override:

```
bundle/templates/
├── default/
│   ├── Layout.js
│   ├── Card.js
│   └── List.js

user-data/templates/
├── Card.js          # User's custom Card component
└── styles.css       # User's custom styles
```

### Resolution Order

1. Check `user-data/templates/{component}` 
2. Fall back to `bundle/templates/default/{component}`
3. Fall back to PatternFly default

## Future Considerations

### Module Federation

For larger apps, consider Webpack Module Federation to:
- Share React and PatternFly between Apollo and apps
- Enable runtime loading of app bundles
- Reduce overall bundle sizes

### App Signing

Implement bundle signing for:
- Publisher verification
- Tamper detection
- Trusted source identification

### Versioned APIs

```javascript
// Version-specific API access
await apollo.v1.dataSources.jira.getIssues();
await apollo.v2.dataSources.jira.search(jql);
```

### App Dependencies

Allow apps to declare dependencies on other apps:

```json
{
  "dependencies": {
    "shared-components": "^1.0.0"
  }
}
```
