---
id: 3mb38er9brcj
title: Notification History & Recovery - Zero-Stress Dismissal
type: feature
status: backlog
priority: medium
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - notifications
  - frontend
  - backend
  - commuter
  - apollo
parent: gl320ae1erth
blocks: []
blocked_by:
  - exw1o75kwa2a
related: []
external: {}
estimate: null
component: null
sprint: null
starred: false
flag: null
---

# Notification History & Recovery - Zero-Stress Dismissal

## Description

"The Commuter" demo script emphasizes "hard to make a mistake, easy to recover." Dismissed notifications can be restored in 2 taps, eliminating notification anxiety.

Currently:
- `src/pages/Bulletin.js` exists as bulletin board for announcements
- `server/routes/bulletins.js` provides CRUD for bulletins
- **No notification history storage**
- **No recovery mechanism**
- **No undo functionality**
- **No notification state machine**

The demo describes:
- 90-day notification retention
- Restore dismissed notifications easily
- Undo toast for recent dismissals
- State machine: active → dismissed → restored

## Acceptance Criteria

- [ ] Design notification schema with state machine
- [ ] Create `server/routes/notifications.js` - Notification history API
- [ ] Store notifications in `data/notifications/` with 90-day retention
- [ ] Implement notification states: active, dismissed, restored, actioned
- [ ] Create `src/pages/NotificationHistory.js` - Full history view
- [ ] Create `src/components/UndoToast.js` - 5-second undo for dismissals
- [ ] Create `src/components/NotificationRow.js` - Row with restore action
- [ ] Add search and filter to history view
- [ ] Implement periodic cleanup of old notifications
- [ ] Integrate with push notification system

## Technical Notes

### Notification Schema

```javascript
{
  id: string,
  type: 'agent-complete' | 'decision-ready' | 'mention' | 'reminder',
  title: string,
  body: string,
  source: { type: 'agent', name: 'phoenix' },
  createdAt: timestamp,
  state: 'active' | 'dismissed' | 'restored' | 'actioned',
  dismissedAt: timestamp,
  restoredAt: timestamp,
  actionedAt: timestamp,
  actionTaken: string,
  link: string  // Deep link to relevant content
}
```

### State Transitions

```
active → dismissed (user swipes away)
dismissed → restored (user taps restore)
active → actioned (user clicks through)
restored → actioned (user clicks through)
```

### Undo Toast Behavior

1. Show toast for 5 seconds after dismissal
2. "Undo" button restores notification
3. Multiple dismissals stack in undo queue
4. After 5 seconds, dismissal is permanent

### Files to Create

- `server/routes/notifications.js` - Notification API
- `src/pages/NotificationHistory.js` - History view
- `src/components/UndoToast.js` - Undo component
- `src/components/NotificationRow.js` - List row

### Files to Modify

- `server/index.js` - Mount notifications route
- `src/App.js` - Add notification history route
- `src/components/AppSidebar.js` - Add history nav item

## Dependencies

- Blocked by: Service Worker & Push Notifications (exw1o75kwa2a)

## References

- [The Commuter Plan - Scene 7b](./gl320ae1erth/plan.md) - Notification recovery

## History

- 2026-01-31: Created as child task of The Commuter epic
