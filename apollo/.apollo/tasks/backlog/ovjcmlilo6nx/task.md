---
id: ovjcmlilo6nx
title: ACP Inbox Dashboard - Widget-Based Command Center
type: feature
status: backlog
priority: high
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - dashboard
  - frontend
  - widgets
  - commuter
  - apollo
parent: gl320ae1erth
blocks: []
blocked_by: []
related:
  - i6qht3mlvrvf
  - 71qqb7r6en89
external: {}
estimate: null
component: frontend
sprint: null
starred: false
flag: null
---

# ACP Inbox Dashboard - Widget-Based Command Center

## Description

"The Commuter" demo script describes the ACP Inbox as a command center homescreen with configurable widgets: Greeting, Overnight Results, Decision Queue, Today's Forecast, Quick Stats. Users can customize layout and content.

Currently:
- `src/pages/Dashboard.js` exists but is basic
- `src/pages/Welcome.js` has greeting
- **No modular widget system**
- **No user-configurable layout**
- **No persistent layout storage**
- **No real-time data refresh**

The demo describes:
- Widget-based configurable layout
- Overnight Results showing agent work
- Decision Queue with pending count and ETA
- Today's Forecast with deep work windows
- Quick Stats with week's metrics

## Acceptance Criteria

- [ ] Design widget architecture with standard interface
- [ ] Create `src/components/dashboard/Greeting.js` - Personalized greeting
- [ ] Create `src/components/dashboard/OvernightResults.js` - Agent work summary
- [ ] Create `src/components/dashboard/DecisionQueue.js` - Pending decisions
- [ ] Create `src/components/dashboard/TodaysForecast.js` - Day prediction
- [ ] Create `src/components/dashboard/QuickStats.js` - Week's metrics
- [ ] Implement drag-and-drop widget reordering
- [ ] Store layout configuration persistently
- [ ] Add widget visibility toggles in Settings
- [ ] Implement real-time data refresh with loading states

## Technical Notes

### Widget Interface

```javascript
// Standard widget interface
const Widget = {
  id: string,
  component: React.Component,
  title: string,
  defaultOrder: number,
  minWidth: number,  // Grid units
  minHeight: number,
  refreshInterval: number,  // Seconds, 0 = no refresh
  settings: {}  // Widget-specific settings
};
```

### Default Layout

```jsx
const defaultSections = [
  { id: 'greeting', component: 'Greeting', order: 0, visible: true },
  { id: 'overnight', component: 'OvernightResults', order: 1, visible: true },
  { id: 'decisions', component: 'DecisionQueue', order: 2, visible: true },
  { id: 'forecast', component: 'TodaysForecast', order: 3, visible: true },
  { id: 'stats', component: 'QuickStats', order: 4, visible: true }
];
```

### Widget Content

**Greeting:**
- Personalized message with time of day
- Current date and day of week
- Quick status (unread count, pending decisions)

**Overnight Results:**
- Summary of agent work since last session
- Status counts (complete, stuck, in-progress)
- Link to full Agent Queue

**Decision Queue:**
- Number of pending decisions
- Next decision preview
- Estimated time to complete queue
- "Start Review" action

**Today's Forecast:**
- Deep work windows (gaps in calendar)
- Reviews predicted based on agent progress
- Key meetings or deadlines

**Quick Stats:**
- Reviews completed this week
- Time saved by agents (estimated)
- Decisions made
- Tasks completed

### Files to Create

- `src/components/dashboard/Greeting.js`
- `src/components/dashboard/OvernightResults.js`
- `src/components/dashboard/DecisionQueue.js`
- `src/components/dashboard/TodaysForecast.js`
- `src/components/dashboard/QuickStats.js`
- `src/components/dashboard/WidgetContainer.js` - Layout manager

### Files to Modify

- `src/pages/Dashboard.js` - Implement widget layout
- `src/pages/Settings.js` - Widget configuration

## Dependencies

- Related to: Agent Work Queue (i6qht3mlvrvf) - Overnight Results needs queue data
- Related to: Decision Queue (71qqb7r6en89) - DecisionQueue widget needs decisions

## References

- [The Commuter Plan - Scene 5](./gl320ae1erth/plan.md) - ACP Inbox homescreen

## History

- 2026-01-31: Created as child task of The Commuter epic
