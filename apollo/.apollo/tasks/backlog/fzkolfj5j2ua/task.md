---
id: fzkolfj5j2ua
title: Context-Aware Presence Detection - Smart Notification Routing
type: feature
status: backlog
priority: medium
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - notifications
  - presence
  - calendar
  - focus
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

# Context-Aware Presence Detection - Smart Notification Routing

## Description

"The Commuter" demo script describes a system that infers focus state and routes notifications accordingly. During deep work, notifications are held; during meetings, they're queued for after; when available, real-time delivery.

Currently:
- Activity tracking exists for Home Assistant (`src/lib/homeAssistantActivity.js`)
- Calendar integration exists (`server/routes/google.js`)
- **No presence detection service**
- **No focus mode**
- **No smart notification routing**
- **Notifications not context-aware**

The demo describes:
- Calendar-based presence inference (in meeting = busy)
- Manual focus mode toggle
- Activity-based inference (optional)
- Notification routing based on presence state

## Acceptance Criteria

- [ ] Create `server/lib/presenceService.js` - Presence detection service
- [ ] Implement calendar-based presence (meetings = busy)
- [ ] Add manual focus mode toggle in Settings
- [ ] Define presence states: available, light-focus, deep-focus, meeting, away
- [ ] Route notifications based on presence state
- [ ] Queue held notifications for delivery when available
- [ ] Show current presence state in UI
- [ ] Optionally track app activity for auto-inference
- [ ] Allow presence state overrides

## Technical Notes

### Presence Signals (Privacy-Respecting)

```javascript
const presenceSignals = {
  // Opt-in signals only
  calendarBusy: 'Check Google Calendar for meetings',
  appActive: 'Apollo tab/window is active',
  lastActivity: 'Time since last interaction',
  userSetFocus: 'Manual focus mode toggle'
};
```

### Presence States

```javascript
const presenceStates = {
  'available': 'Real-time notifications',
  'light-focus': 'Low-priority only',
  'deep-focus': 'Hold all notifications',
  'meeting': 'Queue for after',
  'away': 'Batch for return'
};
```

### Notification Routing Rules

| Presence | Critical | High | Normal | Low |
|----------|----------|------|--------|-----|
| available | immediate | immediate | immediate | immediate |
| light-focus | immediate | immediate | queue | queue |
| deep-focus | queue | queue | queue | queue |
| meeting | queue | queue | queue | queue |
| away | batch | batch | batch | batch |

### Implementation Approach

1. Start with calendar-based presence (meetings = busy)
2. Add manual focus mode toggle in Settings
3. Optionally track app activity for auto-inference
4. Integrate with notification delivery

### Files to Create

- `server/lib/presenceService.js` - Presence service
- `src/components/PresenceIndicator.js` - Show current state
- `src/components/FocusModeToggle.js` - Manual toggle

### Files to Modify

- `src/pages/Settings.js` - Add focus mode preferences
- `server/routes/notifications.js` - Route based on presence
- `src/components/AppMasthead.js` - Show presence indicator

## Dependencies

- Blocked by: Service Worker & Push Notifications (exw1o75kwa2a) - needs notification system
- Leverages existing calendar integration

## References

- [The Commuter Plan - Scene 7](./gl320ae1erth/plan.md) - Context-aware presence

## History

- 2026-01-31: Created as child task of The Commuter epic
