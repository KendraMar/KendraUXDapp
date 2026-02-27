# Context Sidebar Feature

## Overview

The Context Sidebar is a key feature of Apollo's Prototypes viewer that displays design context, history, and related artifacts alongside prototype views. It consumes data from `.apollo` folders to provide rich contextual information.

## Status

**Current Phase**: Design
**Target Release**: TBD
**Priority**: High

## Goals

1. Display design history chronologically for the current prototype/page
2. Show related context sources (Figma, Jira, recordings, etc.)
3. Surface stakeholder information for the current feature area
4. Display relevant decisions and their rationale
5. Enable AI assistant to answer questions using context sidebar data

## Non-Goals

- Real-time collaboration (future consideration)
- Editing .apollo content from the sidebar (v1)
- Automatic sync with external tools (v1)

## User Stories

As a **designer**, I want to see the history of design decisions for a prototype, so that I can understand why things are the way they are.

As a **developer**, I want to quickly access related Jira tickets and Figma files, so that I can understand the requirements.

As a **product manager**, I want to see who the stakeholders are for a feature, so that I know who to contact.

As a **new team member**, I want to browse design history, so that I can get up to speed quickly.

## Success Metrics

- Time to find design context reduced by 50%
- New team member onboarding time reduced
- Fewer "why did we do this?" questions in Slack

## Design Artifacts

- Prototype: See `src/pages/PrototypeDetail.js` with `PrototypeContextPanel.js`
- Component: `src/pages/components/PrototypeContextPanel.js`

## Technical Approach

The Context Sidebar reads from `.apollo` folders using these patterns:

1. **History Tab**: Parses `history.md` or `design-history.md` files
2. **Sources Tab**: Parses `context-sources.md` files
3. **Stakeholders Tab**: Parses `stakeholders.md` files
4. **Decisions Tab**: Parses `decisions.md` files

The sidebar determines which content to show based on:
- The current prototype/page being viewed
- Feature mapping in `.apollo/config.yaml`
- Path-based matching

## Open Questions

- [ ] How should the sidebar handle multiple matching features?
- [ ] Should we cache parsed .apollo content or read on-demand?
- [ ] What's the best UX for showing long history entries?
- [ ] How do we handle missing or incomplete .apollo data gracefully?

## Related

- Component: `src/pages/components/PrototypeContextPanel.js`
- Related feature: AI Assistant (uses same context)
- Decision: [DEC-001 .apollo Folder Structure](../../decisions.md)
