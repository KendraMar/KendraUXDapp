---
id: x9k4m2p7n1q8
title: Design context sources visibility and customization within Spaces
type: feature
status: backlog
priority: medium
created: 2025-01-23T00:00:00.000Z
due: null
assignees: []
labels:
  - design
  - ux
  - spaces
  - feature
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: spaces
sprint: null
starred: false
flag: null
---

# Design context sources visibility and customization within Spaces

## Description

Each Space in Apollo can have context sources (Slack channels, Google Drive folders, Jira projects, Confluence spaces, etc.) associated with it. Currently there's no clear way for users to:

1. See which context sources are loaded/available within a given Space
2. Customize which sources are active vs. filtered out
3. Understand where this configuration lives in the UI

For example, a Space titled "Product X" might have all Product X-related context sources loaded by default (specific Slack channels, Drive folders, Jira boards), but users should be able to focus in on certain sources rather than everything.

## User Story

As a **designer or developer using Apollo**, I want to **see and customize which context sources are active in my current Space**, so that **I can focus on relevant information without noise from unrelated sources**.

## Goals

1. Surface visibility into what context sources are currently loaded in a Space
2. Allow users to customize/filter which sources are active
3. Provide clear navigation to where this configuration lives
4. Support per-Space default context sources that can be overridden

## Non-Goals

- Backend implementation of context source filtering (this is a design task)
- API changes for context source management
- Automatic context source suggestions (future enhancement)

## Design Questions to Explore

### Where should context sources be displayed?

- In the Space settings/configuration?
- In a dedicated panel or sidebar?
- As a collapsible section within the Space view?
- In the masthead/header when viewing a Space?

### How should customization work?

- Toggle individual sources on/off?
- Drag-and-drop prioritization?
- Preset filters (e.g., "Slack only", "Documents only")?
- Search/filter within sources?

### What information should be shown per source?

- Source type icon (Slack, Drive, Jira, etc.)
- Source name/identifier
- Last sync time?
- Item count?
- Status indicator (connected, error, syncing)?

### How do defaults vs. overrides work?

- Space-level defaults configured by Space owner
- User-level overrides that persist per-Space
- Session-only temporary filters?

## Acceptance Criteria

- [ ] Design proposal for context sources visibility location
- [ ] Wireframes/mockups for the visibility UI
- [ ] Design proposal for customization interaction patterns
- [ ] Decision on where configuration lives (navigation)
- [ ] Consider mobile/responsive behavior
- [ ] Document information architecture decisions

## Open Questions

- [ ] Should there be a global "all sources" view vs. Space-specific views?
- [ ] How does this interact with the existing Spaces configuration?
- [ ] Should sources be grouped by type or listed flat?
- [ ] What happens when a Space has many (10+) context sources?
- [ ] Should there be visual differentiation between "available" and "active" sources?
- [ ] How do we handle sources that are loading or have errors?

## References

- Spaces configuration: likely in `data/spaces.json`
- Context sources pattern: `.apollo/context-sources.md`
- Related components: `src/pages/` Space-related pages

## History

- 2025-01-23: Created - Initial design task for context sources visibility
