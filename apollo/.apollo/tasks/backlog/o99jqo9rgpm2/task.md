---
id: o99jqo9rgpm2
title: Evening Handoff Workflow - Queue Overnight Agent Work
type: feature
status: backlog
priority: medium
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - agents
  - workflow
  - frontend
  - commuter
  - apollo
parent: gl320ae1erth
blocks: []
blocked_by:
  - i6qht3mlvrvf
related: []
external: {}
estimate: null
component: null
sprint: null
starred: false
flag: null
---

# Evening Handoff Workflow - Queue Overnight Agent Work

## Description

"The Commuter" demo script describes an end-of-day workflow where users hand off work to overnight agents, queue tasks for processing while they sleep, and see a preview of what will need their input tomorrow.

Currently:
- Tasks page exists for work items
- **No overnight queue concept**
- **No handoff workflow**
- **No tomorrow preview**
- **No estimated completion times**

The demo describes:
- Evening handoff UI to queue work for agents
- Overnight queue showing what agents will work on
- Tomorrow preview showing what will need input
- Confirmation flow before leaving

## Acceptance Criteria

- [ ] Create `src/components/EveningHandoff.js` - End-of-day workflow
- [ ] Create `src/components/OvernightQueue.js` - Tasks queued for overnight
- [ ] Create `src/components/TomorrowPreview.js` - What will need input tomorrow
- [ ] Allow selecting tasks to hand off to agents
- [ ] Show estimated completion times based on task complexity
- [ ] Provide confirmation summary before handoff
- [ ] Integrate with agent queue system
- [ ] Trigger evening handoff based on time/calendar
- [ ] Add "End of Day" action in masthead or dashboard

## Technical Notes

### Evening Handoff Flow

```
1. Trigger handoff (button or scheduled time)
2. Show current work-in-progress
3. Allow selecting tasks for overnight processing
4. Select agents for each task
5. Set priorities and constraints
6. Show tomorrow preview (what will need input)
7. Confirm handoff
8. Queue tasks to agent queue
```

### Handoff Data Model

```javascript
{
  id: string,
  handoffAt: timestamp,
  tasksQueued: [
    {
      taskId: string,
      agent: string,
      priority: 'low' | 'normal' | 'high',
      estimatedCompletion: timestamp,
      constraints: string
    }
  ],
  tomorrowPreview: [
    {
      type: 'decision' | 'review' | 'guidance',
      title: string,
      estimatedReadyAt: timestamp,
      source: string
    }
  ]
}
```

### Tomorrow Preview Logic

Predict what will need user input tomorrow:
- Decisions that will be ready for review
- Agents that might get stuck (based on history)
- Scheduled meetings that might spawn tasks
- Recurring deadlines

### Files to Create

- `src/components/EveningHandoff.js` - Main workflow
- `src/components/OvernightQueue.js` - Queue view
- `src/components/TomorrowPreview.js` - Preview component

### Files to Modify

- `src/pages/Dashboard.js` - Add handoff trigger
- `src/components/AppMasthead.js` - Add "End Day" action
- `server/routes/agent-queue.js` - Accept handoff tasks

## Dependencies

- Blocked by: Agent Work Queue System (i6qht3mlvrvf) - needs queue to accept tasks

## References

- [The Commuter Plan - Scene 10](./gl320ae1erth/plan.md) - Evening handoff

## History

- 2026-01-31: Created as child task of The Commuter epic
