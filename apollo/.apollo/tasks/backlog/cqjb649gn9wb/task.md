---
id: cqjb649gn9wb
title: Session State Sync Service - Cross-Device Continuity
type: feature
status: backlog
priority: high
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - mobile
  - sync
  - frontend
  - backend
  - commuter
  - apollo
parent: gl320ae1erth
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: null
sprint: null
starred: false
flag: null
---

# Session State Sync Service - Cross-Device Continuity

## Description

"The Commuter" demo script's core premise is transparent session mobility: start work on phone at breakfast, continue on desktop at work without friction. This requires session state to sync across devices.

Currently:
- Document sync exists via Yjs (for collaborative editing)
- WebSocket support for document collaboration
- **No general session state sync**
- **No cross-device session continuity**
- **No draft preservation**
- **No view state sync**

The demo describes:
- Reviewing an RFE on mobile, adding a comment
- Arriving at desk and seeing that work continue seamlessly
- Draft comments preserved across devices
- Current view/position synced

## Acceptance Criteria

- [ ] Design session state model (view, drafts, layout, preferences)
- [ ] Create `src/lib/sessionSync.js` - Client-side sync service
- [ ] Create `server/routes/session.js` - Server-side session API
- [ ] Store session state in localStorage with server backup
- [ ] Implement real-time sync for critical state (drafts, current view)
- [ ] Implement eventual sync for preferences and layout
- [ ] Add conflict resolution (last-write-wins with optional UI)
- [ ] Sync dashboard layout configuration
- [ ] Sync decision queue position
- [ ] Preserve draft comments across devices

## Technical Notes

### Session State Model

```javascript
{
  userId: string,
  deviceId: string,
  lastActiveDevice: string,
  lastActiveAt: timestamp,
  
  // Synced state (real-time)
  currentView: '/dashboard',
  dashboardLayout: [...],
  decisionQueuePosition: 2,
  draftComments: { 'review-123': 'Need to check...' },
  
  // Synced preferences (eventual)
  notificationPreference: 'push' | 'silent',
  theme: 'light' | 'dark'
}
```

### Sync Strategy

1. **Real-time sync** for critical state (current view, drafts)
2. **Eventual sync** for preferences and history
3. **Conflict resolution:** Last-write-wins with optional conflict UI

### Implementation Approach

Start with LocalStorage + periodic server sync:
1. Write state to localStorage immediately
2. Debounce sync to server every 5 seconds
3. On page load, merge server state with local
4. Use timestamps to resolve conflicts

### Files to Create

- `src/lib/sessionSync.js` - Sync service
- `server/routes/session.js` - Session API

### Files to Modify

- `server/index.js` - Mount session route
- `src/App.js` - Initialize session sync
- `src/pages/Dashboard.js` - Save/restore layout

## Dependencies

- Needs device identification (could use fingerprint or generated UUID)
- User authentication concept (for user-level sync)

## References

- [The Commuter Plan - Session Mobility](./gl320ae1erth/plan.md) - Architecture details

## History

- 2026-01-31: Created as child task of The Commuter epic
