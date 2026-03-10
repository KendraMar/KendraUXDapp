---
id: gl320ae1erth
title: 'The Commuter - Async-First Mobile Workflow Experience'
type: epic
status: backlog
priority: high
created: 2026-01-27T00:00:00.000Z
due: null
assignees: []
labels:
  - epic
  - mobile
  - async-workflow
  - agent-integration
  - ux
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
---

# The Commuter - Async-First Mobile Workflow Experience

## Overview

Implement an async-first workflow experience in Apollo inspired by the "Ambient Code Platform" demo concept. The core premise: **async is the default mode; sync is the exception**. This epic covers transparent session mobility, agent queue visibility, mobile reinforcement learning, and context-aware presence detection.

The narrative: Morning (kick off work at breakfast) → Commute (monitor from train, handle agent steering) → Arrival (triage swarm activates) → Desk (deep work with session continuity).

## Goals

1. **Transparent Session Mobility** - Start work on desktop, continue on mobile without friction
2. **Agent Queue + Visibility** - See work queue, agent faults, dispatch handling, child task spawning
3. **Mobile Reinforcement Learning** - Users teach agent preferences in seconds when things go sideways
4. **Context-Aware Notifications** - Smart routing based on inferred focus state
5. **Notification Recovery** - "Hard to make a mistake, easy to recover" philosophy
6. **Decision Batching** - Process decisions at natural break points, not as interruptions
7. **Coordination Compression** - Agents handle back-and-forth, humans steer at decision points

## Success Metrics

- Users can start a task on phone at breakfast and continue on desktop at work
- Agent overnight work is visible in a morning "inbox" view
- Preferences taught on mobile persist and influence future agent decisions
- Notification dismissal is always recoverable within 90 days
- Decision queue can be cleared in batches with proper review gates
- Calendar/context integration prevents interruptions during focus time

## Scope

### In Scope

- Mobile-responsive PWA experience for Apollo
- Session state persistence across devices
- Agent work queue dashboard ("While you slept...")
- Decision queue with review gates
- Notification management with history/recovery
- Evening handoff workflow
- Basic preference capture for agent steering

### Out of Scope (Future Work)

- Native iOS/Android apps
- Full reinforcement learning system
- Advanced presence detection (CLI active, meeting detection)
- Team collaboration features
- Async standup replacement

## User Stories

1. As a **knowledge worker**, I want **to review overnight agent work from my phone at breakfast**, so that **I can steer work before arriving at my desk**
2. As a **reviewer**, I want **decisions batched and presented at natural breaks**, so that **I can maintain focus during deep work**
3. As a **mobile user**, I want **to quickly teach preferences when an agent goes sideways**, so that **future decisions improve**
4. As a **user who dismissed a notification**, I want **to restore it easily**, so that **mistakes don't cause stress**
5. As a **knowledge worker leaving for the day**, I want **to hand off work to overnight agents**, so that **progress continues while I sleep**

## Child Tasks

| ID | Title | Status | Phase |
|----|-------|--------|-------|
| exw1o75kwa2a | Service Worker & Push Notifications for PWA | backlog | Phase 1 |
| cqjb649gn9wb | Session State Sync Service - Cross-Device Continuity | backlog | Phase 1 |
| i6qht3mlvrvf | Agent Work Queue System - "While You Slept" Visibility | backlog | Phase 2 |
| ovjcmlilo6nx | ACP Inbox Dashboard - Widget-Based Command Center | backlog | Phase 2 |
| 71qqb7r6en89 | Decision Queue & Review Gates - Batched Decision Processing | backlog | Phase 3 |
| sb929qo1n6q1 | Multi-Lens Triage Swarm - Parallel AI Analysis | backlog | Phase 3 |
| 3mb38er9brcj | Notification History & Recovery - Zero-Stress Dismissal | backlog | Phase 4 |
| ymo4gkwr0trp | User Preference Storage for Agent Steering | backlog | Phase 5 |
| o99jqo9rgpm2 | Evening Handoff Workflow - Queue Overnight Agent Work | backlog | Phase 6 |
| fzkolfj5j2ua | Context-Aware Presence Detection - Smart Notification Routing | backlog | Phase 7 |

## Dependencies

- Apollo's existing Jira, Slack, Calendar integrations
- Local AI service (Ollama/ramalama)
- PWA/service worker capabilities
- Session storage mechanism (localStorage + server sync)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Mobile UX complexity | Medium | High | Start with essential flows only, iterate based on feedback |
| Session sync conflicts | Medium | Medium | Implement last-write-wins with conflict resolution UI |
| Agent queue model unclear | Medium | Medium | Start with mock data, refine as agent integration matures |
| Performance on mobile | Low | Medium | Progressive loading, minimal bundle for mobile views |

## References

- [Full Implementation Plan](./gl320ae1erth-plan.md) - Detailed architecture and mapping to Apollo
- Original Demo Script: "The Commuter" Demo Script (ACP)

## History

- 2026-01-27: Epic created with full implementation plan
- 2026-01-31: Created 10 child tasks based on gap analysis of The Commuter demo script vs current implementation
