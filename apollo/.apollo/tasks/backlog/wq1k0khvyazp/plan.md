# Implementation Plan: Real Artifact Change Notifications

## Overall Confidence Score: 7.5 / 10

The core architecture is straightforward and fits cleanly into the existing codebase. The main unknowns are around **how AI agents will report which artifacts they changed** (depends on the AI tooling layer) and **deep-linking into artifact-level highlights** (varies per app). The notification plumbing itself is well-scoped and low-risk.

---

## Executive Summary

Replace the current random blue-dot mock (`handleAgentConversationComplete`) with a real **Artifact Change Notification** system. When an AI agent modifies an artifact, it emits a structured change event. A lightweight notification store tracks these changes. The sidebar reads from this store to show blue dots on the correct nav items. Each app page reads from the store to highlight specific changed artifacts.

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Omnibar   │────▶│  AI Agent Work   │────▶│  Change Events  │
│  (trigger)  │     │ (modify artifact)│     │  (structured)   │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                       │
                                              ┌────────▼────────┐
                                              │  Notification   │
                                              │  Store (React   │
                                              │  Context)       │
                                              └──┬──────────┬───┘
                                                 │          │
                                        ┌────────▼──┐  ┌───▼──────────┐
                                        │  Sidebar  │  │  App Pages   │
                                        │  (nav dot)│  │  (item glow) │
                                        └───────────┘  └──────────────┘
```

---

## Phase 1: Notification Store & Context (Frontend Core)

**Confidence: 9/10** — Standard React Context pattern, no unknowns.

### What to Build

A new React Context (`ArtifactNotificationContext`) that holds a list of pending artifact change notifications.

### Data Model

```javascript
// A single artifact change notification
{
  id: 'notif-1707753600000-abc',   // Unique notification ID
  artifactType: 'documents',        // Matches the app/artifact type
  artifactId: 'doc-abc123',         // Specific artifact that changed
  artifactTitle: 'Q3 Roadmap',      // Human-readable title (optional)
  changeType: 'modified',           // 'created' | 'modified' | 'deleted'
  navItemId: 'documents',           // The nav item ID to badge
  navItemPath: '/documents',        // The path to navigate to
  timestamp: 1707753600000,         // When the change happened
  conversationId: 'conv-xyz',       // Which conversation triggered it
  acknowledged: false               // Cleared when user views it
}
```

### Key API (Hook)

```javascript
const {
  notifications,                    // All pending notifications
  getNavBadges,                     // () => Set<navItemId> — which nav items have dots
  getArtifactNotifications,         // (artifactType) => notifications for a specific page
  acknowledgeNavBadge,              // (navItemId) => clear nav dot
  acknowledgeArtifact,              // (artifactId) => clear artifact highlight
  addNotification,                  // (notification) => add a new one
  clearAll,                         // () => clear everything
} = useArtifactNotifications();
```

### Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `src/lib/ArtifactNotificationContext.js` | **Create** | New context + provider + hook |
| `src/App.js` | **Modify** | Wrap app in provider; replace `handleAgentConversationComplete` |
| `src/components/AppSidebar/AppSidebar.js` | **Modify** | Consume context instead of prop |
| `src/components/AppSidebar/components/NavigationList.js` | **Modify** | Use `getNavBadges()` instead of `agentSuggestedItems` |

### Persistence (Optional, Phase 1b)

Notifications should survive page refresh. Options:
- **localStorage** (simplest, recommended for Phase 1) — serialize notifications to `localStorage` on change, hydrate on mount
- **Server-side** (future) — store in `data/notifications/` for multi-tab support

---

## Phase 2: AI Agent Change Reporting (Backend Integration)

**Confidence: 6/10** — This is where the unknowns live. Depends on how AI agents produce side effects.

### The Problem

Currently, AI responses are streamed back as text. They don't report structured side effects like "I modified slide deck X." We need a mechanism for AI work to report what artifacts were changed.

### Approach A: Server-Side Change Manifest (Recommended)

When AI work modifies artifacts (via tool use, function calls, or file writes), the server returns a **change manifest** alongside the response.

```javascript
// Server response shape (added to existing SSE stream or conversation API)
{
  role: 'assistant',
  content: 'I updated the Q3 roadmap slide deck with the latest milestones.',
  artifactChanges: [
    {
      artifactType: 'slides',
      artifactId: 'slides-q3-roadmap',
      artifactTitle: 'Q3 Roadmap',
      changeType: 'modified'
    }
  ]
}
```

**How it works:**
1. AI tools that write to `data/<type>/<id>/` also log to a per-conversation change manifest
2. Conversation completion endpoint returns the manifest
3. Frontend reads the manifest and adds to notification store

**Server-side tracking:** Add middleware or a utility function to `server/lib/` that artifact-modifying routes call:

```javascript
// server/lib/artifactChanges.js
const changeLog = new Map(); // conversationId → changes[]

function logArtifactChange(conversationId, change) {
  if (!changeLog.has(conversationId)) changeLog.set(conversationId, []);
  changeLog.get(conversationId).push({
    ...change,
    timestamp: Date.now()
  });
}

function getAndClearChanges(conversationId) {
  const changes = changeLog.get(conversationId) || [];
  changeLog.delete(conversationId);
  return changes;
}
```

**Files to Create/Modify:**

| File | Action | Notes |
|------|--------|-------|
| `server/lib/artifactChanges.js` | **Create** | Change tracking utility |
| `server/routes/conversations.js` | **Modify** | Return changes on conversation completion |
| App route files (e.g., `data/apps/documents/routes.js`) | **Modify** | Call `logArtifactChange()` on write operations |

### Approach B: File System Watcher (Alternative)

Use `fs.watch` or `chokidar` to watch `data/` for changes during an active conversation. Any file write under `data/<type>/` during a conversation window gets attributed to that conversation.

- **Pro:** Zero changes needed in artifact routes — any write is caught
- **Con:** Noisy (catches cache writes, temp files), harder to attribute to specific conversations, requires correlation logic

**Recommendation:** Start with Approach A. It's more explicit, more reliable, and scales better. Approach B could supplement it later for "catch-all" detection.

### Approach C: Client-Side Inference (Fallback)

Parse the AI's text response for mentions of artifact types and infer what changed. Fragile but could work as a temporary bridge.

```javascript
// Regex/keyword matching on AI response text
const artifactMentions = detectArtifactMentions(responseText);
// e.g., "I updated the slide deck" → { artifactType: 'slides' }
```

**Recommendation:** Only use as a fallback or interim solution while Approach A is being built.

---

## Phase 3: Nav-to-Artifact Deep Linking

**Confidence: 8/10** — Straightforward URL param pattern, but each app needs to implement it.

### How It Works

When the user clicks a badged nav item, the URL includes a query parameter indicating which artifact to highlight:

```
/documents?highlight=doc-abc123
```

or for multiple changes:

```
/slides?highlight=slides-q3-roadmap,slides-brand-guide
```

### Sidebar Click Handler Update

```javascript
// In NavigationList.js onClick
if (hasBadge) {
  const artifactNotifs = getArtifactNotifications(item.id);
  acknowledgeNavBadge(item.id);
  
  if (artifactNotifs.length === 1) {
    // Single change — deep link to specific artifact
    navigate(`${item.path}?highlight=${artifactNotifs[0].artifactId}`);
  } else {
    // Multiple changes — navigate to page, highlight all
    const ids = artifactNotifs.map(n => n.artifactId).join(',');
    navigate(`${item.path}?highlight=${ids}`);
  }
}
```

### Per-App Highlight Integration

Each app page reads the `highlight` query param and visually indicates the changed artifact(s). This uses a shared utility hook:

```javascript
// src/lib/useArtifactHighlight.js
function useArtifactHighlight() {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightIds = searchParams.get('highlight')?.split(',') || [];
  
  const isHighlighted = (artifactId) => highlightIds.includes(artifactId);
  
  const clearHighlight = (artifactId) => {
    const remaining = highlightIds.filter(id => id !== artifactId);
    if (remaining.length === 0) {
      searchParams.delete('highlight');
    } else {
      searchParams.set('highlight', remaining.join(','));
    }
    setSearchParams(searchParams, { replace: true });
  };
  
  const clearAll = () => {
    searchParams.delete('highlight');
    setSearchParams(searchParams, { replace: true });
  };
  
  return { highlightIds, isHighlighted, clearHighlight, clearAll };
}
```

### Artifact-Level CSS

```css
/* Pulsing blue border/glow on highlighted artifact cards */
.apollo-artifact-highlighted {
  box-shadow: 0 0 0 2px var(--pf-t--global--color--brand--default);
  animation: apollo-artifact-highlight-pulse 2s ease-in-out 3;
}

@keyframes apollo-artifact-highlight-pulse {
  0%, 100% {
    box-shadow: 0 0 0 2px var(--pf-t--global--color--brand--default);
  }
  50% {
    box-shadow: 0 0 8px 2px rgba(var(--pf-t--global--color--brand--default-rgb, 0, 102, 204), 0.4);
  }
}
```

**Files to Create/Modify:**

| File | Action | Notes |
|------|--------|-------|
| `src/lib/useArtifactHighlight.js` | **Create** | Shared highlight hook |
| `src/styles/_navigation.css` | **Modify** | Add artifact highlight CSS |
| Each app's main page component | **Modify** | Consume `useArtifactHighlight()` and apply class |

---

## Phase 4: Nav Item ↔ Artifact Type Mapping

**Confidence: 9/10** — Clean extension of existing app registry.

### The Problem

We need a reliable mapping from artifact type (e.g., `documents`, `slides`, `prototypes`) to the correct nav item ID and path. Currently, the app registry knows about routes and nav items, but doesn't have an "artifact type" concept.

### Solution: Extend Manifest Schema

Add an optional `artifactTypes` field to app manifests:

```json
// data/apps/documents/manifest.json
{
  "displayName": "Documents",
  "routes": [{ "path": "/documents", "page": "Documents" }],
  "navItem": { "displayName": "Documents", "icon": "FileAlt" },
  "artifactTypes": ["documents"]
}
```

Then `appRegistry.js` builds a reverse map:

```javascript
// artifactType → { navItemId, navItemPath }
const artifactTypeMap = {
  'documents': { navItemId: 'documents', path: '/documents' },
  'slides': { navItemId: 'slides', path: '/slides' },
  'prototypes': { navItemId: 'prototypes', path: '/prototypes' },
  // ...
};
```

This is used by the notification store to resolve which nav item to badge when an artifact change comes in.

**Files to Modify:**

| File | Action | Notes |
|------|--------|-------|
| `src/lib/appRegistry.js` | **Modify** | Build artifactType → navItem mapping |
| Each app's `manifest.json` | **Modify** | Add `artifactTypes` field |

---

## Phased Rollout Plan

### Phase 1 (1-2 days) — Notification Store
- Create `ArtifactNotificationContext`
- Wire up sidebar to read from context
- Add `useArtifactHighlight` hook
- Remove mock `handleAgentConversationComplete`
- **Testable:** Manually add notifications via dev tools, verify dots appear on correct items

### Phase 2 (2-3 days) — Server-Side Change Tracking
- Create `server/lib/artifactChanges.js`
- Instrument artifact-modifying routes
- Return change manifests in conversation API
- Frontend reads manifests and populates notification store
- **Testable:** AI commands that modify artifacts show correct dots

### Phase 3 (1-2 days) — Deep Linking & Highlights
- Update sidebar click handler for deep linking
- Add `useArtifactHighlight` consumption to each app page
- Add artifact-level highlight CSS
- **Testable:** Click dot → land on page → see highlighted artifact

### Phase 4 (0.5 days) — Manifest Extensions & Polish
- Add `artifactTypes` to all app manifests
- Ensure new apps auto-participate
- localStorage persistence for notifications
- Edge cases (multiple changes, deleted artifacts, etc.)

---

## Risk Assessment & Unknowns

### Low Risk (High Confidence)

| Area | Confidence | Notes |
|------|-----------|-------|
| Notification Context (React) | 9/10 | Standard pattern, no deps |
| Sidebar integration | 9/10 | Clean replacement of existing mock |
| CSS/visual treatment | 9/10 | Extends existing working styles |
| Manifest extensions | 9/10 | Additive, backward-compatible |
| Deep-link URL params | 8/10 | Standard React Router pattern |

### Medium Risk (Moderate Confidence)

| Area | Confidence | Notes |
|------|-----------|-------|
| Per-app highlight integration | 7/10 | Each app needs individual work; some apps may have complex list rendering |
| Artifact ID consistency | 7/10 | Need consistent ID scheme across all artifact types |
| localStorage persistence | 7/10 | Tab-sync edge cases, storage limits |

### Higher Risk (Lower Confidence)

| Area | Confidence | Notes |
|------|-----------|-------|
| AI agent change reporting | 6/10 | **Biggest unknown.** Depends on how AI tools report side effects. If using Cursor CLI or Claude Code, we may not have structured tool-use output. May need a hybrid approach: server watches for file changes during active conversations. |
| Multi-agent scenarios | 5/10 | If multiple conversations are running, attributing changes to the right conversation gets complex. |
| External tool integration | 5/10 | If AI modifies something via an external tool (e.g., directly editing a file via CLI), the server may not know about it. Need a reconciliation strategy. |

---

## Scalability Assessment

### What Scales Well

- **New artifact types:** Adding a new app with `artifactTypes` in its manifest automatically participates — zero changes needed elsewhere
- **Notification volume:** The store is a simple array; even hundreds of notifications are trivial for React
- **Multiple spaces:** Notifications are keyed by artifact type + ID, so space context naturally scopes them

### What Needs Care

- **AI tool diversity:** Different AI backends (Cursor CLI, Claude Code, local Ollama, Kagi) have different capabilities for reporting side effects. A unified abstraction layer is needed.
- **Stale notifications:** Need a TTL or auto-clear strategy so old notifications don't pile up
- **Real-time sync:** If the app is open in multiple tabs, notifications should sync (future: use BroadcastChannel API or SharedWorker)

---

## Alternative Approaches Considered

### 1. WebSocket Push (Rejected for Phase 1)
A WebSocket server could push change notifications to the client in real-time. More robust but significantly more infrastructure. Consider for a future phase if polling/SSE isn't sufficient.

### 2. Polling-Based (Rejected)
Frontend polls a `/api/notifications` endpoint. Adds unnecessary latency and server load. The conversational flow already has a natural "completion" event to piggyback on.

### 3. Service Worker (Rejected for Phase 1)
A service worker could intercept fetch requests and detect artifact mutations. Over-engineered for the current local-first architecture. Worth revisiting if Apollo becomes multi-user.

---

## Summary

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Implementation confidence** | 7.5/10 | Frontend plumbing is straightforward; AI reporting is the main unknown |
| **Scalability** | 8/10 | Manifest-driven, auto-participatory for new apps |
| **UX impact** | 9/10 | Transforms a demo feature into a genuinely useful workflow signal |
| **Effort estimate** | 5-8 days | Across all 4 phases |
| **Risk** | Medium | Primarily in Phase 2 (AI change reporting) |

The recommended approach is to **start with Phase 1** (notification store + sidebar wiring) as it delivers immediate value by cleaning up the mock behavior and establishing the infrastructure. Phase 2 can then be iterated on as the AI tooling layer matures.
