---
id: sb929qo1n6q1
title: Multi-Lens Triage Swarm - Parallel AI Analysis
type: feature
status: backlog
priority: medium
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - agents
  - ai
  - triage
  - parallel
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

# Multi-Lens Triage Swarm - Parallel AI Analysis

## Description

"The Commuter" demo script describes a triage swarm that runs multiple analysis lenses in parallel: Technical Feasibility, Test Strategy, Timeline Risk, Security Review, Dependencies, Team Capacity. Each lens provides a focused perspective to help make better decisions.

Currently:
- Jira integration for issues exists
- Calendar integration for dates exists
- Local AI for analysis exists
- **No multi-agent orchestration**
- **No triage lens definitions**
- **No parallel analysis**
- **No aggregated triage view**

The demo describes:
- Multiple lenses running in parallel on same item
- Each lens handled by specific agent persona
- Calendar/holiday integration for timeline analysis
- Aggregated view showing all perspectives

## Acceptance Criteria

- [ ] Define triage lens model with agent assignments
- [ ] Create `server/lib/triageService.js` - Orchestrate parallel analysis
- [ ] Implement parallel AI calls for multiple lenses
- [ ] Create `src/components/TriageSwarm.js` - Aggregated view
- [ ] Create `src/components/TriageLensCard.js` - Individual lens result
- [ ] Integrate calendar/holiday data for timeline analysis
- [ ] Allow triggering triage on Jira issues
- [ ] Show analysis progress for each lens
- [ ] Combine lens results into unified recommendation

## Technical Notes

### Triage Lens Model

```javascript
const triageLenses = [
  { id: 'technical', name: 'Technical Feasibility', agent: 'archie', 
    prompt: 'Analyze technical complexity, architecture impact, and implementation approach' },
  { id: 'testing', name: 'Test Strategy', agent: 'phoenix',
    prompt: 'Define testing approach, coverage requirements, and QA considerations' },
  { id: 'timeline', name: 'Timeline Risk', agent: 'parker',
    prompt: 'Assess timeline feasibility considering holidays, dependencies, and team capacity' },
  { id: 'security', name: 'Security Review', agent: 'morgan',
    prompt: 'Identify security implications, required reviews, and compliance needs' },
  { id: 'dependencies', name: 'Dependencies', agent: 'taylor',
    prompt: 'Map upstream/downstream dependencies and coordination needs' },
  { id: 'capacity', name: 'Team Capacity', agent: 'parker',
    prompt: 'Assess team availability and skill requirements' }
];
```

### Calendar Context Integration

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

### Parallel Execution

```javascript
// Run all lenses in parallel
const results = await Promise.all(
  triageLenses.map(lens => 
    runTriageLens(lens, itemContext, calendarContext)
  )
);

// Aggregate results
const recommendation = aggregateTriageResults(results);
```

### Files to Create

- `server/lib/triageService.js` - Triage orchestration
- `server/lib/triageContext.js` - Context gathering
- `src/components/TriageSwarm.js` - Aggregated view
- `src/components/TriageLensCard.js` - Lens result card

### Files to Modify

- `src/pages/Jira.js` - Add triage trigger button
- `server/routes/jira.js` - Add triage endpoint

## Dependencies

- Blocked by: Agent Work Queue System (i6qht3mlvrvf) - needs agent coordination

## References

- [The Commuter Plan - Scene 3](./gl320ae1erth/plan.md) - Contextual triage swarm

## History

- 2026-01-31: Created as child task of The Commuter epic
