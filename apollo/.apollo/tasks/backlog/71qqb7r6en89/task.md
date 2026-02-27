---
id: 71qqb7r6en89
title: Decision Queue & Review Gates - Batched Decision Processing
type: feature
status: backlog
priority: high
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - decisions
  - frontend
  - backend
  - review
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

# Decision Queue & Review Gates - Batched Decision Processing

## Description

"The Commuter" demo script describes a decision queue system with review gates that prevent rubber-stamping. Decisions are batched and presented at natural break points, with engagement tracking to ensure proper review.

Currently:
- Governance docs define decision-making processes
- Tasks page exists but is not a decision queue
- **No decision queue data model**
- **No review flow with gates**
- **No engagement tracking**
- **No audit trail**

The demo describes:
- "Start Review" flow requiring proper engagement
- Section expansion tracking (can't complete until viewed)
- Comment prompts to encourage feedback
- Audit logging of review behavior

## Acceptance Criteria

- [ ] Design decision queue data model
- [ ] Create `server/routes/decisions.js` API
- [ ] Store decisions requiring human input
- [ ] Create `src/components/DecisionReviewFlow.js` - Multi-step review
- [ ] Create `src/components/ReviewProgress.js` - Track sections viewed
- [ ] Create `src/components/EngagementIndicator.js` - Show engagement level
- [ ] Create `src/components/dashboard/DecisionQueue.js` - Dashboard card
- [ ] Implement review gates (sections must be viewed before completion)
- [ ] Track time spent on each section
- [ ] Log audit trail with engagement metrics
- [ ] Add comment prompt before completion

## Technical Notes

### Review Flow States

```
1. Summary View - What changed, why, who requested
2. Key Sections - Expandable details (tracked)
3. Scroll/View Requirement - Can't complete until viewed
4. Comment Prompt - Optional but encouraged
5. Complete Review - Final action
```

### Audit Trail Schema

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

### Decision Data Model

```javascript
{
  id: string,
  title: string,
  type: 'rfe-review' | 'approval' | 'triage' | 'custom',
  source: { system: 'jira', id: 'PROJ-123' },
  requestedBy: string,
  requestedAt: timestamp,
  deadline: timestamp,
  status: 'pending' | 'in-review' | 'completed',
  sections: [
    { id: 'summary', title: 'Summary', content: '...' },
    { id: 'changes', title: 'Key Changes', content: '...' },
    { id: 'risks', title: 'Risks', content: '...' }
  ],
  urgency: 'low' | 'normal' | 'high' | 'critical'
}
```

### Files to Create

- `server/routes/decisions.js` - Decision API
- `src/components/DecisionReviewFlow.js` - Review flow
- `src/components/ReviewProgress.js` - Progress tracker
- `src/components/EngagementIndicator.js` - Engagement display
- `src/components/dashboard/DecisionQueue.js` - Dashboard card

### Files to Modify

- `server/index.js` - Mount decisions route
- `src/pages/Dashboard.js` - Add decision queue card
- `src/App.js` - Add decision review route

## References

- [The Commuter Plan - Scene 6](./gl320ae1erth/plan.md) - Review gates concept

## History

- 2026-01-31: Created as child task of The Commuter epic
