---
id: vkjkk4zxgl3g
title: App Catalog - Local Application Store & Publishing Platform
type: epic
status: backlog
priority: high
created: 2025-01-30T00:00:00.000Z
due: null
assignees: []
labels:
  - epic
  - platform
  - applications
  - user-generated
  - extensibility
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
sprint: null
starred: false
flag: null
---

# App Catalog - Local Application Store & Publishing Platform

## Overview

The App Catalog is a core platform feature that transforms Apollo from a standalone integrated design environment into an extensible application platform. It enables users to:

1. **Browse and install applications** from catalog sources (initially the UXD App Catalog Repository on GitLab)
2. **Develop their own applications** using Apollo's standardized APIs and data sources
3. **Publish applications** to catalogs for other users to discover and install

This creates a local-first "app store" experience where applications feel like SaaS web apps but run entirely locally, maintaining Apollo's privacy-first philosophy.

## Goals

1. Enable users to extend Apollo's functionality through installable applications
2. Provide a secure, standardized way for apps to access Apollo platform APIs
3. Create a publishing ecosystem where users can share their creations
4. Maintain Apollo's design principles: local-first, privacy-respecting, user-controlled UI

## Design Principles

### Application Isolation
- Applications are **self-contained in the content area** - they never modify the left nav, masthead, or core Apollo UI
- Apps run in their own namespace with isolated routing that doesn't conflict with core pages
- Each app is essentially a miniature application with its own presentation layer and API hooks

### User Control
- The **UI layer is always user-customizable** - users can modify templates, layouts, and presentation
- A standard "user customization" folder exists in every app for user overrides
- The data structures, APIs, and hooks are defined by the app publisher but UI remains user-controlled

### Security & Privacy
- **No API keys or secrets in application bundles** - apps must use Apollo's standardized API layer
- Application bundles contain only: templates, default UI, API structure definitions, custom hooks
- Sensitive data (API keys, tokens) stored separately in user's Apollo system
- Apps request access to data sources; Apollo mediates all API access

### Catalog Sources
- Initial source: UXD App Catalog Repository (GitLab, private VPN)
- Support for multiple catalog sources (future)
- Each catalog source provides: application listings, metadata, version history, downloads

## Success Metrics

- Number of applications published to catalog
- Application installation/update success rate
- User engagement with installed applications
- Time to develop and publish a new application

## Scope

### In Scope

- App Catalog browsing page with source configuration
- Application installation and update mechanism
- Standardized application structure and templates
- Apollo Platform API layer for apps
- Application namespace and routing isolation
- User customization layer for installed apps
- Publishing workflow for user-created apps
- Security validation for application bundles

### Out of Scope

- Cross-user real-time collaboration within apps
- Monetization or payment processing
- Public internet distribution (local/VPN only for now)
- Mobile app packaging

## User Stories

1. As a **designer**, I want to **browse available applications in the catalog**, so that I can **extend Apollo with new functionality**

2. As a **developer**, I want to **create my own application using Apollo's APIs**, so that I can **build custom workflows for my team**

3. As an **app publisher**, I want to **publish my application to the catalog**, so that **other users can install and benefit from my work**

4. As a **user**, I want to **customize the UI of installed applications**, so that **they fit my personal workflow and preferences**

5. As an **admin**, I want to **control which API permissions apps can request**, so that **sensitive data access is properly gated**

6. As a **user**, I want to **receive updates for installed applications**, so that **I get bug fixes and new features automatically**

## Child Tasks

| ID | Title | Status | Priority |
|----|-------|--------|----------|
| vkjkk4zxgl3g-01 | App Catalog Page - Browse & Search UI | pending | high |
| vkjkk4zxgl3g-02 | Catalog Source Configuration | pending | high |
| vkjkk4zxgl3g-03 | Application Bundle Format Specification | pending | critical |
| vkjkk4zxgl3g-04 | Application Installation & Management | pending | high |
| vkjkk4zxgl3g-05 | Application Namespace & Routing | pending | high |
| vkjkk4zxgl3g-06 | Apollo Platform API Layer | pending | critical |
| vkjkk4zxgl3g-07 | User Customization System | pending | medium |
| vkjkk4zxgl3g-08 | Application Publishing Workflow | pending | medium |
| vkjkk4zxgl3g-09 | Security Validation & Sandboxing | pending | critical |
| vkjkk4zxgl3g-10 | Update Detection & Distribution | pending | medium |

## Dependencies

- GitLab API access for UXD App Catalog Repository
- Existing Apollo routing infrastructure (React Router)
- Apollo data sources and API routes
- File system access for application storage

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Security vulnerabilities in user apps | Medium | High | Bundle validation, API sandboxing, no direct filesystem access |
| Routing conflicts with core pages | Low | Medium | Strict namespace isolation, reserved route prefixes |
| API version compatibility | Medium | Medium | Versioned API layer, deprecation policy |
| Performance impact of many apps | Low | Medium | Lazy loading, app isolation |

## Architecture

See [architecture.md](./architecture.md) for detailed technical architecture.

## References

- [Detailed Plan](./plan.md) - Comprehensive implementation plan with subtask breakdown
- [Architecture](./architecture.md) - Technical architecture documentation
- Apollo Design Principles: `docs/design/principles.md`

## History

- 2025-01-30: Epic created - App Catalog concept defined
