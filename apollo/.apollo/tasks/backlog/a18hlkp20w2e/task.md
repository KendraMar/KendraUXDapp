---
id: a18hlkp20w2e
title: Reorganize Artifacts page with file type grouping
type: feature
status: backlog
priority: medium
created: 2025-01-21T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - ux
  - navigation
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: artifacts
starred: false
flag: null
---

# Reorganize Artifacts page with file type grouping

## Description

Reduce left navigation clutter by consolidating file format types within the Artifacts page. This could be implemented as either:

1. A vertical subnav within Artifacts
2. A horizontal subnav/tabs within the Artifacts page

The goal is to simplify the main sidebar navigation by grouping related artifact types together.

## User Story

As a **user**, I want to **access different artifact types through a consolidated Artifacts page**, so that **the main navigation is less cluttered and easier to navigate**.

## Design Options

1. **Vertical subnav** - Secondary navigation column within Artifacts page
2. **Tabs/horizontal subnav** - Tab bar at top of Artifacts content area

## Acceptance Criteria

- [ ] Determine which file types should be grouped under Artifacts
- [ ] Choose subnav approach (vertical vs horizontal)
- [ ] Implement grouping UI
- [ ] Update main sidebar to remove individual file type entries
- [ ] Ensure navigation state is preserved

## Open Questions

- [ ] Which specific file types should be grouped?
- [ ] Vertical subnav vs tabs - which provides better UX?
- [ ] Should this support customization/configuration?

## History

- 2025-01-21: Created - migrated from docs/TASKS.md
