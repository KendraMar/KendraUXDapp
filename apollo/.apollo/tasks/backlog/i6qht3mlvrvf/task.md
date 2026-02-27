---
id: i6qht3mlvrvf
title: Agent Work Queue System - "While You Slept" Visibility
type: feature
status: backlog
priority: high
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - agents
  - backend
  - frontend
  - dashboard
  - commuter
  - apollo
parent: gl320ae1erth
blocks: []
blocked_by: []
related:
  - sb929qo1n6q1
external: {}
estimate: null
component: null
sprint: null
starred: false
flag: null
---

# Agent Work Queue System - "While You Slept" Visibility

## Description

"The Commuter" demo script describes a core feature: users wake up to see what their agents accomplished overnight in a "While you slept..." dashboard. This requires a complete agent work queue system that doesn't currently exist in Apollo.

Currently:
- `server/routes/agents.js` handles agent templates/config only
- Agent templates exist in `templates/agents/`
- **No persistent agent job queue**
- **No job status tracking**
- **No stuck agent detection**
- **No overnight results view**

The demo describes:
- Agents running tasks overnight
- Status cards showing complete/stuck/in-progress work
- Stuck detection with guidance request
- "While you slept" summary in the morning

## Acceptance Criteria

- [ ] Design and implement agent job queue data model
- [ ] Create `server/routes/agent-queue.js` API for queue management
- [ ] Store queue in `data/agent-queue/` with 30-day retention
- [ ] Track job states: queued, running, complete, stuck, needs-guidance
- [ ] Implement stuck detection (no progress for configurable timeout)
- [ ] Create `src/pages/AgentQueue.js` - Full queue view page
- [ ] Create `src/components/dashboard/OvernightResults.js` component
- [ ] Create `src/components/AgentCard.js` for individual agent status
- [ ] Add overnight summary to Dashboard
- [ ] Enable guidance input when agent is stuck

## Technical Notes

### Agent Job Schema

```javascript
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
  guidance: string,        // User-provided guidance when stuck
  priority: 'low' | 'normal' | 'high',
  source: 'user' | 'evening-handoff' | 'scheduled'
}
```

### API Endpoints

```
GET  /api/agent-queue                - List all jobs
GET  /api/agent-queue/overnight      - Jobs completed since last check-in
POST /api/agent-queue                - Create new job
PUT  /api/agent-queue/:id/guidance   - Provide guidance for stuck job
DELETE /api/agent-queue/:id          - Cancel job
```

### Files to Create

- `server/routes/agent-queue.js` - Queue API
- `src/pages/AgentQueue.js` - Full queue view
- `src/components/dashboard/OvernightResults.js` - Summary component
- `src/components/AgentCard.js` - Status card

### Files to Modify

- `server/index.js` - Mount new route
- `src/pages/Dashboard.js` - Add overnight results
- `src/components/AppSidebar.js` - Add Agent Queue nav item

## Dependencies

- Related to Evening Handoff task (o99jqo9rgpm2) - where jobs get queued
- Related to Triage Swarm task (sb929qo1n6q1) - parallel agent coordination

## References

- [The Commuter Plan - Scene 2](./gl320ae1erth/plan.md) - Overnight agent progress
- [The Commuter Plan - Scene 2b](./gl320ae1erth/plan.md) - Mobile reinforcement learning

## History

- 2026-01-31: Created as child task of The Commuter epic
