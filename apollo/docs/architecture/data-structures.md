# Data Structures

Apollo's data model is organized around two primary concepts: **Artifacts** and **Sources**. This document describes each concept, the types currently supported, and their storage patterns.

## Overview

| Concept | Description | Examples |
|---------|-------------|----------|
| **Artifacts** | Creations or outputs from humans or the system that can be consumed and shared | Recordings, Documents, Prototypes, Discussions |
| **Sources** | External services/integrations/APIs that provide data to Apollo | Slack, RSS, GitLab, Figma, Calendar |

---

## Artifacts

Artifacts are things created within Apollo or imported into it. They represent outputs from design and development workflows that can be consumed, shared, referenced, and collaborated on. At the lowest level, most artifacts are ultimately stored as code (JSON or Markdown files).

### Shared Characteristics

All artifacts share common traits:
- **Local-first storage**: Stored as files in the `data/` directory
- **Unique IDs**: Generated using timestamp + random string patterns
- **Timestamps**: Include `createdAt` and/or `modifiedAt` fields
- **Shareable**: Can be referenced and linked across the system

### Artifact Types

#### Recordings

Audio and video recordings captured directly in Apollo or imported from external sources like Google Drive.

| Property | Description |
|----------|-------------|
| **Storage** | `data/recordings/{id}/` directory |
| **Format** | Metadata in `metadata.json`, media files (`.webm`, `.mp4`, etc.) |
| **Features** | Direct browser recording, Google Drive import, transcription support |

**Metadata Structure:**
```json
{
  "id": "2025-01-21_16-35-00-000-apollo-review-session",
  "title": "Apollo Review Session",
  "type": "screen",
  "duration": 1234,
  "createdAt": "2025-01-21T16:35:00.000Z",
  "hasTranscription": false
}
```

#### Documents

Rich text documents with real-time collaborative editing support via Yjs.

| Property | Description |
|----------|-------------|
| **Storage** | `data/documents/{id}/` directory |
| **Format** | Markdown with YAML frontmatter, Yjs binary state |
| **Features** | Real-time collaboration, revision history (up to 50 versions), tagging |

**Document Structure:**
```markdown
---
title: "Design Spec"
tags: ["design", "ux"]
created: "2025-01-20T10:00:00.000Z"
author: "user@example.com"
---

Document content in Markdown...
```

#### Discussions

Threaded conversation spaces for asynchronous collaboration and decision-making.

| Property | Description |
|----------|-------------|
| **Storage** | `data/discussions/{id}.json` |
| **Format** | JSON with messages and metadata |
| **Features** | Threaded replies, pinning, reactions, resolution status |

**Discussion Structure:**
```json
{
  "id": "abc123",
  "title": "API Design Discussion",
  "description": "Let's discuss the new API structure",
  "created": "2025-01-20T10:00:00.000Z",
  "lastActivity": "2025-01-21T14:30:00.000Z",
  "isPinned": false,
  "isResolved": false,
  "messages": [
    {
      "id": "msg1",
      "author": "user",
      "content": "What do you think about...",
      "timestamp": "2025-01-20T10:00:00.000Z",
      "replies": []
    }
  ]
}
```

#### Prototypes

Interactive prototype containers that embed external URLs (e.g., localhost dev servers, Figma prototypes).

| Property | Description |
|----------|-------------|
| **Storage** | `data/prototypes/{id}.json` |
| **Format** | JSON with metadata and discussions |
| **Features** | Embedded iframes, linked discussions, product/release tagging |

**Prototype Structure:**
```json
{
  "id": "proto123",
  "name": "New Onboarding Flow",
  "description": "Interactive prototype for the redesigned onboarding",
  "embedUrl": "http://localhost:3001",
  "product": "Apollo",
  "release": "v2.0",
  "createdAt": "2025-01-15T09:00:00.000Z",
  "modifiedAt": "2025-01-20T16:00:00.000Z",
  "discussions": []
}
```

#### Slides

Presentation slide decks for sharing designs, research, and proposals.

| Property | Description |
|----------|-------------|
| **Storage** | `data/slides/{id}/` directory |
| **Format** | JSON metadata with slide content |
| **Features** | Slide ordering, presenter notes, export support |

#### Canvas

Visual mapping and diagramming surfaces for information architecture and brainstorming.

| Property | Description |
|----------|-------------|
| **Storage** | `data/canvas/{id}.json` |
| **Format** | JSON with nodes and connections |
| **Features** | Freeform layout, node types, connections/relationships |

#### Code

Code snippets and examples stored in the system for reference and sharing.

| Property | Description |
|----------|-------------|
| **Storage** | `data/code/{id}/` directory |
| **Format** | Source files with metadata |
| **Features** | Syntax highlighting, language detection, versioning |

#### Chat Conversations

AI-assisted chat sessions that can be pinned and persisted.

| Property | Description |
|----------|-------------|
| **Storage** | `data/chats/` directory |
| **Format** | JSON with message history |
| **Features** | Multi-assistant support, pinning to sidebar, space association |

**Chat Structure:**
```json
{
  "id": "chat123",
  "query": "How do I implement...",
  "response": "Here's how you can...",
  "assistant": {
    "id": "apollo",
    "name": "Apollo",
    "avatar": "/assets/assistants/assistant-apollo.svg"
  },
  "history": [],
  "spaceId": "default",
  "createdAt": "2025-01-21T10:00:00.000Z"
}
```

#### Bulletin

News, announcements, and updates for the team or project.

| Property | Description |
|----------|-------------|
| **Storage** | `data/bulletins/` directory |
| **Format** | JSON or Markdown |
| **Features** | Categorization, pinning, read status |

---

## Sources

Sources are external services and integrations that bring data into Apollo. They provide read access (and sometimes write access) to external systems, allowing Apollo to aggregate context from the user's existing tools.

### Shared Characteristics

All sources share common traits:
- **API-driven**: Data fetched via REST or GraphQL APIs
- **Caching**: Responses cached locally in `data/cache/` for offline access
- **Sync status**: Track last sync time and support manual refresh
- **Configuration**: API keys/tokens stored in `data/config.json`

### Source Types

#### Slack

Team messaging and communication from Slack workspaces.

| Property | Description |
|----------|-------------|
| **Data Types** | Channels, direct messages, threads, users |
| **API Endpoint** | `/api/slack/*` |
| **Features** | Unread tracking, thread expansion, user info lookup |

**Supported Operations:**
- List channels with unread counts
- Fetch channel messages
- Expand thread replies
- Resolve user information

#### RSS / Atom Feeds

Web content syndication from blogs, news sites, and YouTube channels.

| Property | Description |
|----------|-------------|
| **Data Types** | Feeds, articles/entries |
| **API Endpoint** | `/api/rss/*` |
| **Features** | Multi-feed management, read/unread tracking, favorites, YouTube support |

**Feed Structure:**
```json
{
  "id": "feed123",
  "title": "Tech Blog",
  "url": "https://example.com/feed.xml",
  "siteUrl": "https://example.com",
  "lastFetched": "2025-01-21T12:00:00.000Z",
  "items": []
}
```

#### GitLab

Source code management and CI/CD from GitLab instances.

| Property | Description |
|----------|-------------|
| **Data Types** | User profile, projects, merge requests |
| **API Endpoint** | `/api/gitlab/*` |
| **Features** | Project filtering (contributed/member), MR status, cache with manual sync |

**Supported Operations:**
- Fetch user profile
- List projects (contributed or member)
- List merge requests (all or assigned)
- Sync/refresh from GitLab API

#### Figma

Design files and collaboration from Figma.

| Property | Description |
|----------|-------------|
| **Data Types** | User profile, projects, files, versions, comments |
| **API Endpoint** | `/api/figma/*` |
| **Features** | Project browsing, version history, comment tracking, cache with manual sync |

**Supported Operations:**
- Fetch user profile
- List team projects and files
- Get file versions and comments
- Sync/refresh from Figma API

#### Google Calendar

Calendar events and scheduling.

| Property | Description |
|----------|-------------|
| **Data Types** | Calendars, events, attendees |
| **API Endpoint** | `/api/google/calendar/*` |
| **Features** | Multi-calendar support, event filtering, meeting links |

**Supported Operations:**
- List available calendars
- Fetch events with date range filtering
- Toggle calendar visibility

#### Confluence (Wiki)

Team documentation and knowledge base from Confluence.

| Property | Description |
|----------|-------------|
| **Data Types** | Spaces, pages, page hierarchy |
| **API Endpoint** | `/api/confluence/*` |
| **Features** | Tree navigation, page content rendering, search |

**Supported Operations:**
- List spaces
- Browse page hierarchy
- Fetch page content
- Search pages

#### Jira

Issue tracking and project management from Jira.

| Property | Description |
|----------|-------------|
| **Data Types** | Projects, issues, sprints, users |
| **API Endpoint** | `/api/jira/*` |
| **Features** | Issue browsing, status tracking, assignment |

#### Kubernetes

Container orchestration cluster information.

| Property | Description |
|----------|-------------|
| **Data Types** | Clusters, namespaces, workloads, pods, services, config |
| **API Endpoint** | `/api/kubernetes/*` |
| **Features** | Multi-resource browsing, status monitoring, YAML viewing |

**Supported Resource Types:**
- Deployments
- Pods
- Services
- ConfigMaps
- Secrets
- Ingresses
- And more...

#### Home Assistant

Smart home automation and IoT integration.

| Property | Description |
|----------|-------------|
| **Data Types** | Entities, states, domains, automations |
| **API Endpoint** | `/api/homeassistant/*` |
| **Features** | Entity state display, domain grouping, Apollo activity tracking |

**Supported Domains:**
- Lights
- Switches
- Sensors
- Binary sensors
- Automations
- And more...

---

## Storage Architecture

### Directory Structure

```
data/
├── cache/              # Cached API responses
├── chats/              # Saved chat conversations
├── config.json         # API keys and settings
├── discussions/        # Discussion JSON files
├── documents/          # Document directories with revisions
├── prototypes/         # Prototype JSON files
├── recordings/         # Recording directories with media
├── slides/             # Slide deck directories
└── spaces.json         # Workspace navigation configuration
```

### Caching Strategy

Source data is cached to enable:
1. **Offline access**: View previously fetched data without network
2. **Performance**: Reduce API calls and load times
3. **Rate limit compliance**: Respect external API limits

Cache files are stored in `data/cache/` with timestamps for freshness tracking.

### Configuration

Integration credentials and settings are stored in `data/config.json`:

```json
{
  "slack": {
    "token": "xoxb-..."
  },
  "gitlab": {
    "url": "https://gitlab.com",
    "token": "glpat-..."
  },
  "figma": {
    "token": "..."
  },
  "homeassistant": {
    "url": "http://homeassistant.local:8123",
    "token": "..."
  }
}
```

**Security Note:** Never commit `data/config.json` to version control. Use `examples/config.example.json` as a template.

---

## Related Documentation

- [API Endpoints](./api-endpoints.md) - Backend API reference
- [Components](./components.md) - UI component patterns
- [Express Server](./express-server.md) - Backend architecture
- [Cache Storage](./cache-storage.md) - Caching implementation details
