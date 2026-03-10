---
id: w9k4m2r8v5x3
title: Agent-Friendly Web Endpoint Specification
type: feature
status: backlog
priority: medium
created: 2025-01-23T00:00:00.000Z
due: null
assignees: []
labels:
  - specification
  - standards
  - open-source
  - agents
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

# Agent-Friendly Web Endpoint Specification

## Description

Create an open source specification/standard for how websites can expose their content to AI agents in a scalable, licensed, and trackable way. Rather than agents scraping full websites with heavy JavaScript payloads (hammering infrastructure), sites would provide a lightweight, structured endpoint specifically designed for agent consumption.

This specification aims to solve the tension between:
- **Content creators** who want their work respected, tracked, and potentially compensated
- **AI agents** (like Apollo) that need efficient access to web content to assist users
- **Infrastructure** that shouldn't be overwhelmed by agent traffic

Think of it as "robots.txt evolved for the AI agent era" combined with "funding.yml for content creators."

## User Story

As a **content creator/website owner**, I want to **provide my content to AI agents in a controlled, trackable way**, so that **my infrastructure isn't hammered, my content is used according to my terms, and I can see anonymous usage metrics**.

As an **AI agent developer**, I want to **access web content efficiently with clear licensing terms**, so that **I can help users with their tasks while respecting content creators' wishes**.

As a **user being assisted by an AI agent**, I want to **agents to access information quickly and legally**, so that **I can get help with my tasks without ethical concerns**.

## Goals

1. Define a specification for an agent-friendly endpoint (`/.well-known/agent-api` or similar)
2. Include licensing information (what uses are permitted)
3. Include usage tracking mechanism (anonymous hit metrics for content creators)
4. Include optional funding/compensation request metadata (similar to npm funding)
5. Support enforceable access controls for compliant agents
6. Keep the format lightweight and easy to implement

## Non-Goals

- Payment processing integration (out of scope, future work)
- Full DRM or content protection
- Replacing existing web standards (RSS, sitemaps, etc.)
- Mandatory adoption - this is opt-in for websites

## Design

- Specification document (markdown/RFC-style)
- Example endpoint implementations
- Reference client implementation for Apollo

## Acceptance Criteria

- [ ] Draft specification document outlining the endpoint format
- [ ] Define licensing schema (permitted uses, restrictions)
- [ ] Define tracking/metrics schema (anonymous usage reporting)
- [ ] Define funding request schema (optional compensation metadata)
- [ ] Define agent identification requirements (how agents identify themselves)
- [ ] Create example endpoint JSON/YAML format
- [ ] Document compliance requirements for agents
- [ ] Create reference implementation notes for website owners
- [ ] Documentation updated

## Technical Approach

### Proposed Endpoint Structure

```
/.well-known/agent-content
```

### Proposed Response Format

```json
{
  "version": "1.0",
  "site": {
    "name": "Example Blog",
    "url": "https://example.com"
  },
  "license": {
    "type": "agent-assist",
    "permits": ["summarization", "citation", "individual-use"],
    "prohibits": ["training", "bulk-export", "commercial-redistribution"],
    "attribution_required": true
  },
  "tracking": {
    "endpoint": "https://example.com/agent-metrics",
    "anonymous": true,
    "required": true,
    "data_collected": ["content_id", "timestamp", "agent_id"]
  },
  "funding": {
    "enabled": true,
    "message": "This blog is independently maintained",
    "links": [
      {"type": "github_sponsors", "url": "https://github.com/sponsors/author"},
      {"type": "ko-fi", "url": "https://ko-fi.com/author"}
    ]
  },
  "content": {
    "format": "structured",
    "endpoint": "/.well-known/agent-content/feed",
    "content_type": "application/json"
  },
  "rate_limits": {
    "requests_per_minute": 10,
    "daily_quota": 1000
  }
}
```

### Agent Compliance Requirements

1. Agents MUST identify themselves with a standard User-Agent
2. Agents MUST report usage to tracking endpoint if required
3. Agents MUST respect license restrictions
4. Agents SHOULD display funding information to users when relevant
5. Agents MUST respect rate limits

### Future Integration Points

- Payment processing for micropayments
- Verified agent registry
- Content creator dashboards

## Subtasks

- [ ] Research existing standards (robots.txt, well-known URIs, RSS, sitemaps)
- [ ] Draft initial specification document
- [ ] Define JSON schema for endpoint
- [ ] Create example implementations for common platforms (static sites, WordPress, etc.)
- [ ] Implement support in Apollo's RSS/Feed functionality
- [ ] Create documentation for website owners
- [ ] Seek community feedback on specification

## Open Questions

- [ ] What should the well-known path be? (`agent-content`, `agent-api`, `ai-access`?)
- [ ] Should there be a central registry of compliant agents?
- [ ] How to handle verification that an agent is actually compliant?
- [ ] What level of tracking is acceptable (privacy vs. metrics)?
- [ ] Should this integrate with or extend existing standards like robots.txt?
- [ ] How to handle different content types (articles, images, data)?

## References

- [Well-Known URIs (RFC 8615)](https://www.rfc-editor.org/rfc/rfc8615)
- [robots.txt Standard](https://www.robotstxt.org/)
- [npm funding](https://docs.npmjs.com/cli/v10/commands/npm-fund)
- [Creative Commons Licenses](https://creativecommons.org/licenses/)
- [RSS 2.0 Specification](https://www.rssboard.org/rss-specification)

## History

- 2025-01-23: Created - Initial specification concept for agent-friendly web endpoints
