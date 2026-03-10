---
id: 88ce36e38e26
title: 'Dashboard: Activity Status Overview'
type: feature
status: backlog
priority: medium
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - dashboard
  - reveal-script
  - apollo
parent: null
blocks: []
blocked_by: []
related:
  - ovjcmlilo6nx
external: {}
estimate: null
component: Dashboard
sprint: null
starred: false
flag: null
---

# Dashboard: Activity Status Overview

## Description

Implement a functional dashboard showing activity status as described in the Apollo Reveal Script (Scene 7.1):

> "Let's see what we accomplished this morning."
>
> On screen:
> - Show completed tasks
> - Show updated prototypes
> - Show new discussions started
> - Show pending items for later

Currently, the Dashboard page (`src/pages/Dashboard.js`) is a placeholder showing "Custom Dashboards Coming Soon". This task implements the first functional version focused on activity tracking.

## Features to Implement

### Activity Summary
- **Completed Tasks** - Tasks marked done today/this session
- **Updated Prototypes** - Prototypes modified recently with change summary
- **New Discussions** - Discussion threads started or participated in
- **Pending Items** - Deferred tasks and items for follow-up

### Time-Based Views
- "This Session" - Activity since login
- "Today" - Day's accomplishments
- "This Week" - Weekly summary
- Quick date range selector

### Activity Cards
For each activity type, show:
- Count and list of items
- Preview of each item (title, brief context)
- Timestamp of activity
- Quick actions (view details, continue working)

### Progress Indicators
- Tasks: X of Y completed today
- Prototype updates: N changes made
- Discussions: N threads active
- Feed items: N processed / N pending

### "Continue Where You Left Off"
- Most recent work context
- One-click return to last active item
- Session restoration across devices (links to session sync task)

## Acceptance Criteria

- [ ] Dashboard shows completed tasks section
- [ ] Dashboard shows updated prototypes section
- [ ] Dashboard shows new discussions section
- [ ] Dashboard shows pending items section
- [ ] Each section has item count and list
- [ ] Items are clickable to navigate to details
- [ ] Time range can be toggled (session/today/week)
- [ ] "Continue" action returns to last active item
- [ ] Dashboard refreshes automatically

## Technical Notes

Current Dashboard:
- Empty placeholder component
- No data fetching

New requirements:
- API endpoint `/api/dashboard/activity` for aggregated data
- Activity tracking across pages (completed tasks, prototype saves, discussions)
- Session-based tracking for "this session" view
- Local storage for cross-page activity collection

Data sources:
- Tasks API for completed tasks
- Prototypes API for recent modifications
- Discussions API for thread activity
- Feed API for processed items

Consider integration with:
- The Commuter epic's inbox dashboard (`ovjcmlilo6nx`)
- Session state sync service (`cqjb649gn9wb`)

## UI Design

Consider a card-based layout with:
- Summary row at top (quick stats)
- Main grid of activity sections
- Timeline view option for chronological display
- Collapsible sections for focus

Use PatternFly components:
- Card, CardBody, CardTitle
- DescriptionList for activity items
- Progress for completion indicators
- Badge for counts

## References

- Apollo Reveal Script: Scene 7.1 "Status Overview"
- Current Dashboard: `src/pages/Dashboard.js`
- Related: `ovjcmlilo6nx` (ACP Inbox Dashboard)
- Related: `cqjb649gn9wb` (Session State Sync)

## History

- 2026-01-31: Created from reveal script gap analysis
