---
name: create-app
description: Create modular applications in Apollo's data/apps folder. Use when the user asks to create a new app, module, plugin, integration, or page that should be self-contained and easily removable.
---

# Creating Modular Apps in Apollo

Apps are self-contained modules stored in `data/apps/`. Each app is a folder containing frontend pages, optional API routes, and a manifest file. Deleting an app's folder completely removes it from Apollo.

## Quick Start

1. Generate a kebab-case ID: `my-new-app`
2. Create folder: `data/apps/my-new-app/`
3. Create `manifest.json` with app configuration
4. Create `pages/MyNewApp.js` with the React component
5. Optionally create `routes.js` for backend API
6. Restart Apollo - the app auto-registers

## Directory Structure

```
data/apps/{app-id}/
├── manifest.json                # Required: App configuration
├── pages/                       # Required: React page components
│   ├── {AppName}.js            # Main page component
│   └── {AppName}Detail.js      # Detail/sub pages (optional)
├── routes.js                    # Optional: Express API routes
└── styles.css                   # Optional: App-specific CSS
```

## Manifest File (manifest.json)

**CRITICAL: This file must be valid JSON. The app will not load if parsing fails.**

```json
{
  "id": "my-new-app",
  "displayName": "My New App",
  "description": "Brief description of what this app does",
  "icon": "CubesIcon",
  "version": "1.0.0",
  "enabled": true,
  "navItem": {
    "path": "/my-new-app",
    "displayName": "My New App",
    "icon": "CubesIcon"
  },
  "routes": [
    {
      "path": "/my-new-app",
      "page": "MyNewApp"
    },
    {
      "path": "/my-new-app/:id",
      "page": "MyNewAppDetail"
    }
  ],
  "apiPath": "/api/my-new-app"
}
```

### Manifest Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (lowercase, kebab-case, matches folder name) |
| `displayName` | string | Yes | Human-readable name for UI |
| `description` | string | No | Brief description |
| `icon` | string | Yes | PatternFly icon name |
| `version` | string | No | Semantic version (default: "1.0.0") |
| `enabled` | boolean | No | Set to `false` to disable without deleting |
| `navItem` | object | No | Navigation sidebar configuration |
| `navItem.path` | string | Yes | URL path for nav link |
| `navItem.displayName` | string | No | Nav label (defaults to app displayName) |
| `navItem.icon` | string | No | Nav icon (defaults to app icon) |
| `routes` | array | Yes | Frontend route definitions |
| `routes[].path` | string | Yes | React Router path pattern |
| `routes[].page` | string | Yes | Component filename in `pages/` (without .js) |
| `apiPath` | string | No | API route prefix (required if routes.js exists) |

## Page Components

Create React components in `pages/` using PatternFly 6.

### Main Page Template

```javascript
// pages/MyNewApp.js
import React, { useState, useEffect } from 'react';
import {
  PageSection,
  Title,
  Content,
  Card,
  CardBody,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Alert
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';

const MyNewApp = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/my-new-app/items');
      const result = await res.json();
      if (result.success) {
        setData(result.items || []);
      } else {
        setError(result.error || 'Failed to load data');
      }
    } catch (err) {
      setError('Failed to fetch data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <Title headingLevel="h2" size="lg" style={{ marginTop: '1rem' }}>
            Loading...
          </Title>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Alert variant="danger" title="Error">
          {error}
        </Alert>
      </PageSection>
    );
  }

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">My New App</Title>
        <Content>Description of what this app does.</Content>
      </PageSection>

      <PageSection>
        {data.length === 0 ? (
          <EmptyState>
            <CubesIcon size="xl" />
            <Title headingLevel="h3" size="lg">No items found</Title>
            <EmptyStateBody>
              Get started by adding your first item.
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <Card>
            <CardBody>
              {/* Render your data here */}
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </CardBody>
          </Card>
        )}
      </PageSection>
    </>
  );
};

export default MyNewApp;
```

### Detail Page Template

```javascript
// pages/MyNewAppDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Button,
  Card,
  CardBody,
  Spinner,
  EmptyState,
  Alert
} from '@patternfly/react-core';
import { ArrowLeftIcon } from '@patternfly/react-icons';

const MyNewAppDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/my-new-app/items/${id}`);
      const result = await res.json();
      if (result.success) {
        setItem(result.item);
      } else {
        setError(result.error || 'Item not found');
      }
    } catch (err) {
      setError('Failed to fetch item: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection>
        <Button
          variant="link"
          icon={<ArrowLeftIcon />}
          onClick={() => navigate('/my-new-app')}
        >
          Back
        </Button>
        <Alert variant="danger" title="Error" style={{ marginTop: '1rem' }}>
          {error}
        </Alert>
      </PageSection>
    );
  }

  return (
    <>
      <PageSection variant="light">
        <Button
          variant="link"
          icon={<ArrowLeftIcon />}
          onClick={() => navigate('/my-new-app')}
          style={{ marginBottom: '1rem' }}
        >
          Back to My New App
        </Button>
        <Title headingLevel="h1" size="2xl">{item?.name || 'Item Detail'}</Title>
      </PageSection>

      <PageSection>
        <Card>
          <CardBody>
            <pre>{JSON.stringify(item, null, 2)}</pre>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};

export default MyNewAppDetail;
```

## API Routes (routes.js)

Create Express routes if your app needs a backend API.

```javascript
// routes.js
const express = require('express');
const router = express.Router();

// In-memory storage (replace with proper data storage)
let items = [];

// List all items
router.get('/items', async (req, res) => {
  try {
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single item
router.get('/items/:id', async (req, res) => {
  try {
    const item = items.find(i => i.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create item
router.post('/items', async (req, res) => {
  try {
    const item = {
      id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    items.push(item);
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update item
router.put('/items/:id', async (req, res) => {
  try {
    const index = items.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    items[index] = { ...items[index], ...req.body, updatedAt: new Date().toISOString() };
    res.json({ success: true, item: items[index] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete item
router.delete('/items/:id', async (req, res) => {
  try {
    const index = items.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    items.splice(index, 1);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
```

## Available PatternFly Icons

Common icons for the `icon` field:

| Icon Name | Use For |
|-----------|---------|
| `CubesIcon` | Kubernetes, containers, modules |
| `ServerIcon` | Servers, infrastructure |
| `NetworkIcon` | Networking, connections |
| `StorageDomainIcon` | Storage, data |
| `ClusterIcon` | Clusters, groups |
| `ShieldAltIcon` | Security |
| `HomeIcon` | Home, dashboard |
| `CogIcon` | Settings, configuration |
| `CodeIcon` | Code, development |
| `CommentsIcon` | Chat, discussions, messaging |
| `CalendarAltIcon` | Calendar, scheduling |
| `SlackHashIcon` | Slack |
| `GitlabIcon` | GitLab |
| `ObjectGroupIcon` | Figma, design tools |
| `BookOpenIcon` | Documentation, wiki |
| `VideoIcon` | Video, recordings, media |
| `InboxIcon` | Feed, inbox |
| `ListIcon` | Lists, tasks |
| `PaintBrushIcon` | Design, creativity |
| `FlaskIcon` | Experiments, playground |
| `ArchiveIcon` | Archives, artifacts |
| `RssIcon` | RSS, feeds |
| `PaletteIcon` | Assets, colors |
| `UserIcon` | Profile, users |
| `CameraIcon` | Screenshots, images |

## Naming Conventions

- **App ID**: lowercase kebab-case matching folder name (`my-new-app`)
- **Component names**: PascalCase matching the `page` field in manifest (`MyNewApp`)
- **Route paths**: lowercase with hyphens (`/my-new-app`)
- **API paths**: lowercase with hyphens (`/api/my-new-app`)

## Complete Example: Creating a "Bookmarks" App

### 1. Create the folder structure

```
data/apps/bookmarks/
├── manifest.json
├── pages/
│   ├── Bookmarks.js
│   └── BookmarkDetail.js
└── routes.js
```

### 2. Create manifest.json

```json
{
  "id": "bookmarks",
  "displayName": "Bookmarks",
  "description": "Save and organize bookmarks",
  "icon": "BookOpenIcon",
  "version": "1.0.0",
  "enabled": true,
  "navItem": {
    "path": "/bookmarks",
    "displayName": "Bookmarks",
    "icon": "BookOpenIcon"
  },
  "routes": [
    { "path": "/bookmarks", "page": "Bookmarks" },
    { "path": "/bookmarks/:id", "page": "BookmarkDetail" }
  ],
  "apiPath": "/api/bookmarks"
}
```

### 3. Create pages/Bookmarks.js

Use the Main Page Template above, customized for bookmarks.

### 4. Create routes.js

Use the API Routes template above, customized for bookmark operations.

### 5. Restart Apollo

The app will automatically appear in the navigation and be fully functional.

## Space Context Integration

**All apps should be space-context-aware.** The active space may have configured sources (Jira projects, Slack channels, Figma files, etc.) that your app should use to scope its default view.

### Adding Space Context to Your App

Add this import and hook call to your page component:

```javascript
import { useSpaceContext } from '../../../../src/lib/SpaceContext';

const MyNewApp = () => {
  const {
    activeSpaceId,
    spaceName,
    sources,
    getSourcesByType,
    hasSourceType,
  } = useSpaceContext();

  // Check for sources relevant to your app
  const jiraSources = getSourcesByType('jira');
  const slackSources = getSourcesByType('slack');

  // Apply space scoping as a default filter (with user toggle)
  // ...
};
```

### Source Types

| Type ID | Service | What to extract from URL |
|---------|---------|------------------------|
| `jira` | Jira | Project key (e.g., `RHOAIENG` from `/browse/RHOAIENG-123`) |
| `slack` | Slack | Channel ID or name |
| `confluence` | Confluence | Space key |
| `gitlab` | GitLab | Project path |
| `github` | GitHub | Repository path |
| `figma` | Figma | File ID |
| `google-drive` | Google Drive | Folder/file ID |
| `notion` | Notion | Page ID |

### Best Practices

1. **Default on, toggleable off** — Apply space scoping by default but let users "show all"
2. **Visual indicator** — Show a banner/badge when scoping is active (see Tasks app for example)
3. **Graceful degradation** — If no relevant sources, show everything as normal
4. **Reset on space change** — Re-apply scoping when `activeSpaceId` changes

### Reference Implementation

See `data/apps/tasks/pages/Tasks.js` for a complete working example.

Full architecture docs: `docs/architecture/space-context.md`

## Checklist

- [ ] Folder created at `data/apps/{app-id}/`
- [ ] `manifest.json` is valid JSON with all required fields
- [ ] `manifest.json` `id` matches folder name
- [ ] `pages/` folder exists with at least one component
- [ ] Component filenames match `routes[].page` values in manifest
- [ ] Components export default (not named exports)
- [ ] If API needed: `routes.js` exists and `apiPath` is set in manifest
- [ ] PatternFly imports are correct (from `@patternfly/react-core`)
- [ ] Space Context: App consumes `useSpaceContext()` and scopes views when relevant sources exist

## Troubleshooting

| Issue | Solution |
|-------|----------|
| App not appearing | Check manifest.json is valid JSON, check `enabled: true` |
| 404 on routes | Verify `routes[].path` matches URL, component exports default |
| API not working | Check `apiPath` in manifest, verify `routes.js` exports router |
| Icon not showing | Use exact PatternFly icon name from list above |
| Build errors | Check component imports, ensure PatternFly packages are correct |

## Removing an App

Simply delete the app's folder:

```bash
rm -rf data/apps/my-new-app
```

Restart Apollo - the app is completely removed from navigation, routing, and API.
