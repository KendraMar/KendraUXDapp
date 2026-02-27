---
id: wq1k0khvyazp
title: 'Real Artifact Change Notifications: Replace Mock Blue Dots with Actual Change Tracking'
type: feature
status: backlog
priority: high
created: 2026-02-12T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - backend
  - ux
  - ai
  - notifications
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: null
sprint: null
starred: true
flag: null
---

# Real Artifact Change Notifications: Replace Mock Blue Dots with Actual Change Tracking

## Description

Currently, when a user submits a command via the omnibar and an AI conversation completes, blue notification dots appear next to random navigation items in the sidebar. This is a mock/demo behavior (`handleAgentConversationComplete` in `src/App.js:227-245` randomly selects 2-4 nav items). The blue dots look great visually, but they don't reflect actual changes.

**Goal:** Make the blue dot system real. When an AI agent performs work that modifies an artifact (slide deck, document, prototype, canvas, etc.), the navigation item corresponding to that artifact type should show a blue dot. Clicking the dot should navigate the user directly to the changed artifact, with a visual highlight on the specific item that was modified.

### User Journey

1. User types a command in the omnibar (e.g., "Update the Q3 roadmap slide deck with the latest milestones")
2. AI agent processes the command and modifies one or more artifacts
3. The nav item for the artifact type (e.g., "Slides") shows a pulsing blue dot
4. User clicks the blue dot (or the nav item)
5. User is taken to the relevant page, and the specific changed artifact has a flashing blue indicator next to it
6. Blue dot on nav item clears when clicked; artifact-level indicator clears when the user views/interacts with it

## Acceptance Criteria

- [ ] Blue dots on nav items only appear when actual artifacts have changed
- [ ] Clicking a nav item with a blue dot navigates to the correct page
- [ ] On the destination page, the specific changed artifact has a visible "changed" indicator
- [ ] The notification persists until the user acknowledges it (clicks/views)
- [ ] Multiple simultaneous artifact changes across different types are supported
- [ ] The system works for all artifact types (documents, slides, prototypes, canvas, recordings, etc.)
- [ ] Notifications include metadata about what changed (artifact ID, type, timestamp)
- [ ] Mock random behavior is fully removed
- [ ] The system is extensible — new artifact types automatically participate

## Technical Notes

See [Implementation Plan](./plan.md) for the full technical proposal.

## References

- [Implementation Plan](./plan.md)
- Current mock behavior: `src/App.js:227-245`
- Badge rendering: `src/components/AppSidebar/components/NavigationList.js:143-171`
- Badge CSS: `src/styles/_navigation.css:223-268`
- App registry: `src/lib/appRegistry.js`
- Artifact storage: `data/<type>/<id>/`

## History

- 2026-02-12: Created — replacing mock blue dot behavior with real artifact change tracking
