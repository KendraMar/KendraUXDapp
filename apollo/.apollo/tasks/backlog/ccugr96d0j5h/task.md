---
id: ccugr96d0j5h
title: 'Extended Displays: Multi-Window Awareness and Coordination'
type: spike
status: backlog
priority: medium
created: 2026-02-10T00:00:00.000Z
due: null
assignees: []
labels:
  - concept
  - ux
  - architecture
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: null
sprint: null
starred: false
flag: null
updated: '2026-02-12'
---
# Extended Displays: Multi-Window Awareness and Coordination

## Description

## Description

Explore the concept of "Extended Displays" — the idea that when a user has multiple Apollo windows open on the same machine (e.g., across two or three monitors), those windows should be **aware of each other** and capable of **coordinating** their content, navigation, and layout.

Today, each Apollo browser window is an island. If you open three windows pointing at the same URL, you get three identical, independent experiences. Extended Displays would transform this into a **unified, multi-viewport workspace** — where the system recognizes that multiple displays exist, knows what each one is showing, and can intelligently distribute content across them.

This concept aligns deeply with Apollo's core principles:
- **User Control** — users choose how to arrange their multi-display workspace
- **Signal Over Noise** — more real estate means more room for context without clutter
- **Local-First** — the local server can coordinate windows without cloud dependencies
- **AI as Augmentation** — AI can suggest what to show on peripheral displays
- **Composable Artifacts** — artifacts can span or complement each other across displays

## Acceptance Criteria

- [ ] Brainstorming document completed (see [brainstorm.md](./brainstorm.md))
- [ ] Core use cases identified and prioritized
- [ ] Technical feasibility assessed (web APIs, server coordination)
- [ ] Decision on whether to promote to a full feature/epic

## Technical Notes

Potential technical approaches:
- **BroadcastChannel API** — browser-native cross-tab/window communication (same origin)
- **SharedWorker** — a shared JavaScript worker that all windows connect to
- **WebSocket hub** — the local Express server acts as a coordinator, all windows connect via WebSocket
- **Window Management API** — emerging web standard for multi-screen window placement
- **Service Worker** — could coordinate as a background process

The local-first architecture is a significant advantage here — the Express server already runs on the same machine and can serve as the coordination layer without any cloud dependency.

## References

- [Brainstorming Document](./brainstorm.md)
- [Apollo Design Principles](../../../../docs/design/principles.md)
- [Window Management API (W3C)](https://www.w3.org/TR/window-management/)
- [BroadcastChannel API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)

## History

- 2026-02-10: Created — spike to explore multi-window awareness concept

## Acceptance Criteria

- [ ] Brainstorming document completed (see [brainstorm.md](./brainstorm.md))
- [ ] Core use cases identified and prioritized
- [ ] Technical feasibility assessed (web APIs, server coordination)
- [ ] Decision on whether to promote to a full feature/epic

## Technical Notes

Potential technical approaches:
- **BroadcastChannel API** — browser-native cross-tab/window communication (same origin)
- **SharedWorker** — a shared JavaScript worker that all windows connect to
- **WebSocket hub** — the local Express server acts as a coordinator, all windows connect via WebSocket
- **Window Management API** — emerging web standard for multi-screen window placement
- **Service Worker** — could coordinate as a background process

The local-first architecture is a significant advantage here — the Express server already runs on the same machine and can serve as the coordination layer without any cloud dependency.

## References

- [Brainstorming Document](./brainstorm.md)
- [Apollo Design Principles](../../../../docs/design/principles.md)
- [Window Management API (W3C)](https://www.w3.org/TR/window-management/)
- [BroadcastChannel API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)

## History

- 2026-02-10: Created — spike to explore multi-window awareness concept
