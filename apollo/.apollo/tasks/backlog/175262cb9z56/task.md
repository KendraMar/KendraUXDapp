---
id: 175262cb9z56
title: 'Prototype Forward-Looking Version Timeline'
type: feature
status: backlog
priority: medium
created: 2026-02-12T00:00:00.000Z
due: null
assignees: []
labels:
  - prototype
  - design-tooling
  - ux
  - feature
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: prototypes
sprint: null
starred: false
flag: null
---

# Prototype Forward-Looking Version Timeline

## Description

Designers need a way to work on a code-based prototype artifact and simultaneously maintain forward-looking variants representing future releases. Today, when locking up a design, there's a "current state" (e.g. v3.4) and then proposals or agreed-upon directions for what's next (v3.5, v3.6, future). There's no sustainable mechanism in Apollo to express this.

The core idea: when viewing a prototype, you should be able to see the current version as the source of truth, and then seamlessly switch to see what future releases could look like — what's been agreed to for 3.5, what's proposed for 3.6, what's speculative for "future."

This goes beyond a simple version dropdown. It should feel like a **forward-looking timeline** where you can visualize how the experience evolves across upcoming releases.

## Problem Statement

- Designers always have a "current state" and "what's next" when working on prototypes
- The existing version switcher in prototypes (e.g. OpenShift AI dashboard) is functional but uncreative — just a basic dropdown
- There's no first-class way to maintain multiple forward-looking variants of a prototype simultaneously
- Need to distinguish between: current (shipped), agreed/committed (next release), proposed (future release), speculative (exploration)

## Design Direction

- A persistent bar or timeline UI at the top of a prototype showing the current version and future versions
- Clear visual distinction between the current/live version and forward-looking variants
- Ability to quickly switch between versions to compare current vs. proposed experiences
- Status indicators for each version: shipped, committed, proposed, exploratory
- Should feel like looking down a timeline into the future — not just a version picker

## Acceptance Criteria

- [ ] Prototypes can have multiple named variants representing future release versions
- [ ] A timeline or version bar UI lets users see and switch between current and future versions
- [ ] Each version has a status (e.g. current, committed, proposed, exploratory)
- [ ] The current/shipped version is clearly distinguished as the source of truth
- [ ] Switching between versions is fast and seamless (no full page reload)
- [ ] The mechanism works sustainably with how prototypes are stored and managed

## Technical Notes

- Need to determine how variants are stored: separate files? branching within a single file? folder-per-version?
- Consider how this interacts with the existing prototype system in `data/apps/prototypes/`
- The version timeline UI should be a reusable component that any prototype can opt into
- Consider git-based branching or folder conventions (e.g. `v3.4/`, `v3.5/`, `future/`)
- Explore how the artifact builder (AI-assisted prototype creation) can target a specific version variant

## References

- Existing prototype system: `data/apps/prototypes/`
- Existing version switcher pattern in OpenShift AI dashboard prototype
- Design pattern: product release timelines, feature flagging UIs, Figma branch-like workflows

## History

- 2026-02-12: Created — captured need for forward-looking prototype versioning mechanism
