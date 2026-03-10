# Apollo Implementation Plan: "The Commuter" Async-First Workflow

**Author:** AI Agent  
**Date:** January 27, 2026  
**Status:** Draft - Ready for Review  
**Source:** "The Commuter" Demo Script (Ambient Code Platform)

---

## Executive Summary

This document maps "The Commuter" demo concept to Apollo's current architecture and outlines enhancements needed to deliver an async-first, mobile-enabled workflow experience. The goal is transparent session mobility, agent work visibility, and intelligent notification management.

Apollo already aggregates context from Slack, Jira, Figma, Calendar, GitLab, and Confluence. This plan leverages those integrations while adding new capabilities for mobile workflows and agent coordination.

---

## Current Apollo Capabilities (Leverage These)

| Capability | Current Implementation | Commuter Feature Support |
|------------|----------------------|-------------------------|
| **Dashboard page** | `src/pages/Dashboard.js` | Foundation for "ACP Inbox" homescreen |
| **Tasks page** | `src/pages/Tasks.js` | Work queue, decision items |
| **Calendar integration** | `server/routes/calendar.js` | Context-aware presence, holiday detection |
| **Slack integration** | `server/routes/slack.js` | Collaboration notifications |
| **Jira integration** | `server/routes/jira.js` | RFE/issue tracking, triage |
| **Feed page** | `src/pages/Feed.js` | Notification-style awareness |
| **Local AI service** | `server/lib/ai.js` | Agent processing, summarization |
| **Bulletin/notifications** | `src/pages/Bulletin.js` | Notification display |
| **Settings page** | `src/pages/Settings.js` | User preferences |
| **PatternFly 6 UI** | Throughout | Responsive components available |

---

## Feature Mapping: Demo Script → Apollo Implementation

### Scene 1: Kitchen Table — Mobile RFE Review

**Demo Feature:** Maya gets a notification, reviews an RFE on mobile, adds a comment, and approves.

**Apollo Implementation:**

```
Current State:
├── Jira integration exists (server/routes/jira.js)
├── Can fetch issues/RFEs from Jira
└── No mobile-optimized view

Enhancements Needed:
├── PWA manifest + service worker for installable app
├── Mobile-responsive review cards
├── Quick comment + approve actions
└── Push notification support (Web Push API)
```

**Components to Create:**
- `src/pages/mobile/ReviewCard.js` - Compact review interface
- `src/components/QuickActions.js` - One-tap approve/comment/defer

**API Additions:**
```javascript
// server/routes/reviews.js
router.post('/reviews/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  // Update Jira issue status, add comment
  // Log to local activity stream
});
```

---

### Scene 2: Train — Overnight Agent Progress

**Demo Feature:** "While you slept..." dashboard showing agent activity with status cards.

**Apollo Implementation:**

```
Current State:
├── Dashboard.js exists (minimal)
├── Local AI can process tasks
└── No persistent agent job queue

Enhancements Needed:
├── Agent job queue system (server-side)
├── Job status tracking (complete, stuck, in-progress)
├── "Overnight Results" dashboard component
└── Stuck agent detection + guidance request
```

**Data Model:**
```javascript
// Agent Job Schema
{
  id: string,
  agent: string,           // 'archie', 'phoenix', 'taylor', etc.
  task: string,            // Human-readable task description
  status: 'queued' | 'running' | 'complete' | 'stuck' | 'needs-guidance',
  startedAt: timestamp,
  completedAt: timestamp,
  result: object,          // Task output
  stuckReason: string,     // Why the agent needs help
  attempts: number,        // Retry count
  guidance: string         // User-provided guidance when stuck
}
```

**Components to Create:**
- `src/pages/AgentQueue.js` - Full agent queue view
- `src/components/OvernightResults.js` - "While you slept" summary card
- `src/components/AgentCard.js` - Individual agent status card

---

### Scene 2b: Train — Mobile Reinforcement Learning

**Demo Feature:** When an agent is stuck, user provides guidance in 10 seconds. System remembers for future.

**Apollo Implementation:**

```
Current State:
├── Local AI exists
├── No preference storage system
└── No guided input UI

Enhancements Needed:
├── User preference storage (data/preferences.json)
├── Preference capture UI component
├── Integration with AI prompts
└── Preference replay in future agent runs
```

**Preference Storage Schema:**
```javascript
// data/user-preferences.json
{
  "schema-design": {
    "patterns": [
      {
        "context": "multi-tenant config with feature flags",
        "preference": "Use a single JSONB column with tenant_id composite key",
        "timestamp": "2026-01-27T08:35:00Z",
        "source": "mobile-guidance"
      }
    ]
  },
  "testing": {
    "framework": "jest",
    "notes": "Add Vitest to Q2 evaluation list"
  }
}
```

**Components to Create:**
- `src/components/ReinforcementPanel.js` - Quick preference input
- `src/components/GuidanceInput.js` - Structured guidance form

---

### Scene 3: Elevator — Contextual Triage Swarm

**Demo Feature:** Multi-lens triage running in parallel (Technical Feasibility, Test Strategy, Timeline Risk, etc.)

**Apollo Implementation:**

```
Current State:
├── Jira integration for issues
├── Calendar integration for dates
├── Local AI for analysis
└── No multi-agent orchestration

Enhancements Needed:
├── Triage lens definitions
├── Parallel AI analysis jobs
├── Calendar/holiday integration for timeline
├── Aggregated triage view
```

**Triage Lens Model:**
```javascript
const triageLenses = [
  { id: 'technical', name: 'Technical Feasibility', agent: 'archie' },
  { id: 'testing', name: 'Test Strategy', agent: 'phoenix' },
  { id: 'timeline', name: 'Timeline Risk', agent: 'parker' },
  { id: 'security', name: 'Security Review', agent: 'morgan' },
  { id: 'dependencies', name: 'Dependencies', agent: 'taylor' },
  { id: 'capacity', name: 'Team Capacity', agent: 'parker' }
];
```

**Calendar Context Integration:**
```javascript
// server/lib/triageContext.js
async function getTimelineContext(startDate, endDate) {
  const events = await calendarService.getEvents(startDate, endDate);
  const holidays = await calendarService.getHolidays(startDate, endDate);
  const teamPTO = await calendarService.getTeamPTO(startDate, endDate);
  
  return {
    conflicts: findConflicts(events, holidays, teamPTO),
    recommendations: generateTimelineRecommendations()
  };
}
```

---

### Scene 5: ACP Inbox — The Homescreen

**Demo Feature:** Command center with Overnight Results, Decision Queue, Today's Forecast, Quick Stats.

**Apollo Implementation:**

```
Current State:
├── Dashboard.js exists (basic)
├── Welcome.js has greeting
└── No modular widget system

Enhancements Needed:
├── Widget-based dashboard layout
├── User-configurable sections
├── Persistent layout storage
└── Real-time data refresh
```

**Dashboard Sections (Configurable):**

```jsx
// src/pages/Dashboard.js enhanced structure
const defaultSections = [
  { id: 'greeting', component: 'Greeting', order: 0 },
  { id: 'overnight', component: 'OvernightResults', order: 1 },
  { id: 'decisions', component: 'DecisionQueue', order: 2 },
  { id: 'forecast', component: 'TodaysForecast', order: 3 },
  { id: 'stats', component: 'QuickStats', order: 4 }
];

// User can reorder, hide, add sections via Settings
```

**Components to Create:**
- `src/components/dashboard/Greeting.js` - Personalized greeting with date
- `src/components/dashboard/OvernightResults.js` - Agent work summary
- `src/components/dashboard/DecisionQueue.js` - Pending decisions count + ETA
- `src/components/dashboard/TodaysForecast.js` - Deep work windows, review predictions
- `src/components/dashboard/QuickStats.js` - Week's reviews, time saved

---

### Scene 6: Processing the Decision Queue — Review Gates

**Demo Feature:** "Start Review" flow that prevents rubber-stamping.

**Apollo Implementation:**

```
Current State:
├── No decision queue concept
├── No review tracking
└── No engagement audit

Enhancements Needed:
├── Decision queue data model
├── Review flow component with gates
├── Section expansion tracking
├── Engagement audit logging
```

**Review Flow States:**
```
1. Summary View - What changed, why, who requested
2. Key Sections - Expandable details (tracked)
3. Scroll/View Requirement - Can't complete until viewed
4. Comment Prompt - Optional but encouraged
5. Complete Review - Final action
```

**Components to Create:**
- `src/components/DecisionReviewFlow.js` - Multi-step review interface
- `src/components/ReviewProgress.js` - Tracks sections viewed
- `src/components/EngagementIndicator.js` - Shows engagement level

**Audit Trail Schema:**
```javascript
{
  reviewId: string,
  userId: string,
  decisionId: string,
  startedAt: timestamp,
  completedAt: timestamp,
  sectionsViewed: ['summary', 'changes', 'risks'],
  timeSpentSeconds: number,
  outcome: 'approved' | 'rejected' | 'deferred',
  comment: string
}
```

---

### Scene 7: Deep Work Block — Context-Aware Presence

**Demo Feature:** System infers focus state and routes notifications accordingly.

**Apollo Implementation:**

```
Current State:
├── No presence detection
├── Notifications not context-aware
└── Calendar integration exists

Enhancements Needed:
├── Activity monitoring (optional, privacy-respecting)
├── Calendar-based presence inference
├── Notification queue with smart delivery
└── Focus mode integration
```

**Presence Signals (Privacy-Respecting):**
```javascript
const presenceSignals = {
  // Opt-in signals only
  calendarBusy: 'Check Google Calendar for meetings',
  appActive: 'Apollo tab/window is active',
  lastActivity: 'Time since last interaction',
  userSetFocus: 'Manual focus mode toggle'
};

// Inferred states
const presenceStates = {
  'available': 'Real-time notifications',
  'light-focus': 'Low-priority only',
  'deep-focus': 'Hold all notifications',
  'meeting': 'Queue for after',
  'away': 'Batch for return'
};
```

**Implementation Approach:**
1. Start with calendar-based presence (meetings = busy)
2. Add manual focus mode toggle in Settings
3. Optionally track app activity for auto-inference

---

### Scene 7b: Notification Recovery — Zero-Stress Dismissal

**Demo Feature:** Dismissed notifications can be restored in 2 taps.

**Apollo Implementation:**

```
Current State:
├── Bulletin.js for notifications
├── No notification history
└── No recovery mechanism

Enhancements Needed:
├── Notification event storage (90-day retention)
├── History view with restore action
├── Undo toast for recent dismissals
└── State machine: active → dismissed → restored
```

**Notification Schema:**
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
  actionTaken: string
}
```

**Components to Create:**
- `src/pages/NotificationHistory.js` - Full history view
- `src/components/UndoToast.js` - 5-second undo for actions
- `src/components/NotificationRow.js` - Row with restore action

---

### Scene 8: Async Standup Replacement

**Demo Feature:** No meeting. Inbox shows overnight results. Team shares async updates in a feed.

**Apollo Implementation:**

```
Current State:
├── Feed.js exists
├── Slack integration exists
└── No structured async updates

Enhancements Needed:
├── Team activity feed aggregation
├── Structured status update format
├── Integration with overnight results
└── Optional: Auto-post to Slack
```

**Async Update Format:**
```javascript
{
  userId: string,
  date: '2026-01-27',
  sections: {
    completed: ['Reviewed PR #67', 'Fixed schema issue'],
    inProgress: ['Payment module tests'],
    blockers: [],
    notes: 'Will be heads-down on deep work 10-1'
  },
  autoGenerated: true,  // From agent activity
  userEdited: false
}
```

---

### Scene 10: End of Day — Evening Handoff

**Demo Feature:** Queue overnight work for agents, see preview of tomorrow.

**Apollo Implementation:**

```
Current State:
├── Tasks.js exists
├── No overnight queue concept
└── No handoff workflow

Enhancements Needed:
├── Evening handoff view
├── Agent task queue management
├── Estimated completion times
├── Next-day preview
```

**Components to Create:**
- `src/components/EveningHandoff.js` - End-of-day workflow
- `src/components/OvernightQueue.js` - Tasks queued for overnight
- `src/components/TomorrowPreview.js` - What will need input tomorrow

---

## Session Mobility Architecture

**Key Requirement:** Transparent session continuity across devices.

### Session State Model

```javascript
// Synced session state
{
  userId: string,
  deviceId: string,
  lastActiveDevice: string,
  lastActiveAt: timestamp,
  
  // Synced state
  currentView: '/dashboard',
  dashboardLayout: [...],
  decisionQueuePosition: 2,
  draftComments: { 'review-123': 'Need to check...' },
  
  // Device-specific
  notificationPreference: 'push' | 'silent',
  theme: 'light' | 'dark'
}
```

### Sync Strategy

1. **Real-time sync** for critical state (current view, drafts)
2. **Eventual sync** for preferences and history
3. **Conflict resolution:** Last-write-wins with optional conflict UI

### Implementation Options

| Option | Pros | Cons |
|--------|------|------|
| **LocalStorage + Server Sync** | Simple, works offline | Requires custom sync logic |
| **Firebase/Supabase** | Real-time built-in | External dependency |
| **Apollo Server + WebSocket** | Full control, local-first | More implementation work |

**Recommendation:** Start with LocalStorage + periodic server sync. Add WebSocket for real-time later.

---

## Mobile Implementation Approach

### Option A: Progressive Web App (PWA) — Recommended

```
Pros:
├── Uses existing React/PatternFly codebase
├── Installable on mobile home screen
├── Works offline with service worker
├── Push notifications via Web Push API
└── Single codebase for all platforms

Cons:
├── Some native features unavailable
├── iOS PWA limitations
└── No App Store presence
```

### Option B: React Native (Future)

```
Pros:
├── Full native experience
├── App Store distribution
├── Access to native APIs
└── Better performance

Cons:
├── Separate codebase
├── Significant development effort
├── Maintenance burden
```

**Recommendation:** Start with PWA. Evaluate React Native if PWA limitations become blockers.

### PWA Implementation Tasks

1. **Create `public/manifest.json`:**
```json
{
  "name": "Apollo",
  "short_name": "Apollo",
  "description": "Async-first integrated design environment",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#151515",
  "theme_color": "#0066cc",
  "icons": [...]
}
```

2. **Create service worker** for offline support
3. **Add mobile-responsive breakpoints** to all key views
4. **Implement touch-friendly interactions**

---

## Implementation Phases

### Phase 1: Foundation (Mobile + Session)
1. PWA manifest and service worker
2. Mobile-responsive layout for key pages
3. Session state sync service
4. Basic push notification support

**Pages to make mobile-responsive first:**
- Dashboard (ACP Inbox)
- Feed (notifications)
- Tasks (decision queue)
- Settings

### Phase 2: Agent Queue Visibility
1. Agent job queue data model
2. "While you slept" dashboard component
3. Agent status cards
4. Stuck agent detection

### Phase 3: Decision Queue + Review Gates
1. Decision queue component
2. Review flow with engagement tracking
3. Comment/approval actions
4. Audit logging

### Phase 4: Notification Management
1. Notification history storage
2. History view with search/filter
3. Restore functionality
4. Undo toast component

### Phase 5: Preference Capture
1. Preference storage schema
2. Reinforcement panel UI
3. Integration with AI prompts
4. Preference surfacing in future runs

### Phase 6: Evening Handoff
1. Handoff workflow UI
2. Overnight queue management
3. Tomorrow preview component
4. Confirmation flow

### Phase 7: Context-Aware Presence
1. Calendar-based presence
2. Manual focus mode
3. Smart notification routing
4. Activity-based inference (optional)

---

## Files to Create

| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service worker |
| `src/lib/sessionSync.js` | Session state synchronization |
| `src/pages/AgentQueue.js` | Full agent queue view |
| `src/pages/NotificationHistory.js` | Notification history |
| `src/components/dashboard/OvernightResults.js` | Overnight summary |
| `src/components/dashboard/DecisionQueue.js` | Decision queue card |
| `src/components/dashboard/TodaysForecast.js` | Day forecast |
| `src/components/dashboard/QuickStats.js` | Stats summary |
| `src/components/DecisionReviewFlow.js` | Review gate flow |
| `src/components/ReinforcementPanel.js` | Preference capture |
| `src/components/EveningHandoff.js` | Handoff workflow |
| `src/components/UndoToast.js` | Undo for actions |
| `server/routes/agent-queue.js` | Agent queue API |
| `server/routes/notifications.js` | Notification history API |
| `server/routes/preferences.js` | User preferences API |
| `server/routes/session.js` | Session sync API |
| `server/lib/presenceService.js` | Presence detection |
| `server/lib/triageService.js` | Multi-lens triage |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Dashboard.js` | Add widget-based layout |
| `src/pages/Settings.js` | Add focus mode, notification preferences |
| `src/pages/Feed.js` | Add async update support |
| `src/components/AppMasthead.js` | Mobile menu, notification badge |
| `src/components/AppSidebar.js` | Collapsible for mobile |
| `public/index.html` | Add PWA meta tags |
| `server/index.js` | Mount new routes |
| `webpack.config.js` | PWA/service worker config |

---

## Data Storage Considerations

| Data Type | Storage | Retention |
|-----------|---------|-----------|
| Session state | localStorage + server | Current session |
| User preferences | `data/preferences.json` | Indefinite |
| Notification history | `data/notifications/` | 90 days |
| Agent job queue | `data/agent-queue/` | 30 days |
| Review audit trail | `data/audit/` | Indefinite |
| Async updates | `data/updates/` | 90 days |

---

## Open Questions

1. **Agent Identity:** How do we name/brand the agent personas (Archie, Phoenix, Taylor)? Or use generic names?
2. **Push Notifications:** Self-hosted push service or use a provider (OneSignal, Firebase)?
3. **Team Features:** Is this single-user or should we plan for team collaboration from the start?
4. **Integration Depth:** How much should we rely on external systems (Jira, Slack) vs. building in Apollo?
5. **Privacy:** How do we communicate about activity tracking for presence detection?

---

## Success Criteria

1. ✅ User can install Apollo as PWA on mobile device
2. ✅ Session continues seamlessly from mobile to desktop
3. ✅ "While you slept" shows overnight agent activity
4. ✅ Decision queue processes with proper review gates
5. ✅ Dismissed notifications can be restored from history
6. ✅ User preferences captured on mobile influence future agent runs
7. ✅ Evening handoff queues work for overnight processing
8. ✅ Notifications respect calendar/focus state

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Prioritize phases** based on available effort
3. **Create detailed child tasks** for Phase 1
4. **Prototype PWA** with Dashboard mobile view
5. **Design agent queue data model** in detail

---

*This document maps "The Commuter" demo concept to Apollo's architecture. It should guide implementation of async-first mobile workflows.*
