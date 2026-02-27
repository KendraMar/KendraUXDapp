---
id: 6t6imf0c4cp0
title: Incorporate agents from Ambient inline
type: feature
status: backlog
priority: medium
created: 2025-01-21T00:00:00.000Z
due: null
assignees: []
labels:
  - ai
  - integration
  - ambient
  - agentic-sessions
  - apollo
parent: null
blocks: []
blocked_by: []
related:
  - o6ry98jxw194
external: {}
estimate: null
component: ai
starred: false
flag: null
---

# Incorporate agents from Ambient inline

## Description

Integrate the Ambient Code Platform (ACP) into Apollo's inline workflows. ACP is a Kubernetes-native AI automation platform that orchestrates agentic sessions (Claude-powered AI tasks). Apollo can leverage the ACP REST API to create, manage, and monitor AI sessions directly within the application.

This integration would enable:
- Launching agentic coding sessions from within Apollo
- Monitoring session progress via real-time SSE streaming
- Interacting with AI agents in interactive mode
- Accessing and managing AI-generated code changes

## Acceptance Criteria

- [x] Research Ambient agent API/integration points
- [ ] Implement API client for Ambient Code Platform
- [ ] Add configuration for ACP base URL and access key
- [ ] Create UI for launching agentic sessions
- [ ] Implement SSE streaming for real-time session updates
- [ ] Support interactive mode for chat-style sessions
- [ ] Display session status and results
- [ ] Test agent responses within Apollo context

## Technical Notes

The Ambient Code Platform exposes a REST API for:
- **Projects**: List and create projects
- **Agentic Sessions**: Create, start, stop, and monitor AI-powered coding sessions
- **Real-Time Streaming**: SSE (AG-UI protocol) for live updates
- **Access Keys**: Project-scoped ServiceAccount tokens with RBAC
- **Workspace Access**: Read/write files in session workspaces

Authentication uses Bearer tokens (access keys or OpenShift OAuth tokens).

## Implementation Approach

1. **Backend**: Create `server/routes/ambient.js` with endpoints that proxy to ACP
2. **Frontend**: Add Ambient integration page or integrate into existing Code page
3. **Config**: Store ACP base URL and access key in `data/config.json`
4. **Streaming**: Use EventSource for SSE in frontend

## Resources

- [Ambient API Integration Guide](./ambient-api-guide.md) - Complete API documentation with examples

## References

- [Ambient API Guide](./ambient-api-guide.md) - REST API endpoints, authentication, and code examples
- Related: [o6ry98jxw194](../o6ry98jxw194.md) - Investigate connecting to Claude Code locally

## History

- 2025-01-21: Created - migrated from docs/TASKS.md
- 2026-01-23: Added Ambient API integration guide; updated task with technical details
