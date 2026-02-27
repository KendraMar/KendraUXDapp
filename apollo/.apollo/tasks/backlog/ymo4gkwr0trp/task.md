---
id: ymo4gkwr0trp
title: User Preference Storage for Agent Steering
type: feature
status: backlog
priority: medium
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - agents
  - ai
  - preferences
  - mobile
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

# User Preference Storage for Agent Steering

## Description

"The Commuter" demo script describes mobile reinforcement learning: when an agent is stuck or goes sideways, the user provides guidance in seconds, and the system remembers for future decisions. This creates a feedback loop that improves agent behavior over time.

Currently:
- User preferences exist for UI/calendar in Settings
- `server/routes/google.js` has calendar preferences
- **No agent preference storage**
- **No preference capture UI for agent decisions**
- **No integration with AI prompts**
- **No preference replay in future runs**

The demo describes:
- Quick preference input when agent asks
- Preferences stored and surfaced in future agent runs
- Categories like "schema-design", "testing", "architecture"
- Mobile-friendly guidance input

## Acceptance Criteria

- [ ] Design preference storage schema (`data/user-preferences.json`)
- [ ] Create `server/routes/preferences.js` - Preferences API
- [ ] Create `src/components/ReinforcementPanel.js` - Quick preference input
- [ ] Create `src/components/GuidanceInput.js` - Structured guidance form
- [ ] Store preferences by category with context
- [ ] Include preferences in AI prompt context
- [ ] Surface relevant preferences when agents make decisions
- [ ] Show preference history and allow editing
- [ ] Mobile-optimized input for quick guidance

## Technical Notes

### Preference Storage Schema

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
    "patterns": [
      {
        "context": "integration tests",
        "preference": "Prefer testcontainers over mocking databases",
        "timestamp": "2026-01-25T14:20:00Z",
        "source": "stuck-agent-response"
      }
    ],
    "notes": "Add Vitest to Q2 evaluation list"
  },
  "code-style": {
    "patterns": [
      {
        "context": "error handling",
        "preference": "Use Result types over exceptions when possible",
        "timestamp": "2026-01-20T09:15:00Z",
        "source": "manual-entry"
      }
    ]
  }
}
```

### Integration with AI

When an agent runs a task:
1. Load relevant preferences from storage
2. Include as context in AI prompt
3. AI considers preferences when making decisions
4. If stuck, ask for guidance and store response

### Reinforcement Panel

Quick input UI for when agent asks:
- Shows agent's question/confusion
- Dropdown for preference category
- Text input for guidance
- "Remember this" checkbox (default on)
- One-tap submit

### Files to Create

- `server/routes/preferences.js` - Preferences API
- `src/components/ReinforcementPanel.js` - Quick input
- `src/components/GuidanceInput.js` - Structured form

### Files to Modify

- `server/index.js` - Mount preferences route
- `server/lib/ai.js` - Include preferences in prompts
- `src/pages/Settings.js` - Preference management view

## Dependencies

- Blocked by: Agent Work Queue System (i6qht3mlvrvf) - needs stuck agent detection

## References

- [The Commuter Plan - Scene 2b](./gl320ae1erth/plan.md) - Mobile reinforcement learning

## History

- 2026-01-31: Created as child task of The Commuter epic
