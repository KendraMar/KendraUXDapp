---
id: k7m2p9x4q1n8
title: Enable app sharing and publishing via Git repos
type: feature
status: backlog
priority: medium
created: 2025-01-23T00:00:00.000Z
due: null
assignees: []
labels:
  - feature
  - architecture
  - sharing
  - apollo
parent: null
blocks: []
blocked_by:
  - r3v6w8y2t5s1
related:
  - r3v6w8y2t5s1
external: {}
estimate: null
component: core
starred: false
flag: null
---

# Enable app sharing and publishing via Git repos

## Description

Enable users to share the "apps" they create in Apollo with others. Each app typically consists of a side nav item, page component, and associated backend routes. The goal is to allow publishing apps to a GitLab or GitHub repo so others can install them into their Apollo instance.

## User Story

As an **Apollo user**, I want to **share apps I've built with other users**, so that **the community can benefit from and build upon each other's work**.

## Goals

1. Define a standard format for publishable Apollo apps
2. Enable installation of apps from a Git repo URL
3. Enable publishing/exporting an app to a Git repo
4. Support both public and private repos (GitLab and GitHub)

## Non-Goals

- Real-time synchronization or auto-updates from source repos
- App store/marketplace UI (for now - that could be future work)
- Version management beyond what Git provides
- Paid/commercial app distribution

## Acceptance Criteria

- [ ] Apps can be installed from a GitLab or GitHub repo URL
- [ ] Apps can be exported/published to a Git repo
- [ ] Installing an app automatically adds nav items, routes, and pages
- [ ] Uninstalling an app cleanly removes all its components
- [ ] Works with both HTTPS and SSH Git URLs
- [ ] Handles authentication for private repos
- [ ] Documentation for app format specification

## Technical Approach

### App Manifest

Each shareable app should include a manifest file (e.g., `apollo-app.json`) that defines:
- App name and description
- Version
- Author
- Required Apollo version
- Entry points (main page component, routes, nav items)
- Dependencies (npm packages, other apps)

### Installation Flow

1. User provides Git repo URL
2. Apollo clones/fetches the repo to a designated apps directory
3. Validates manifest and dependencies
4. Registers routes with Express
5. Adds nav items to sidebar configuration
6. Hot-reloads or prompts for restart

### Publishing Flow

1. User selects an app to publish
2. Generates/updates manifest
3. Packages app files
4. Creates or updates Git repo (or exports as zip)

## Open Questions

- [ ] How to handle app dependencies on specific Apollo core features?
- [ ] Should there be a registry/index of available community apps?
- [ ] How to handle app updates from source repos?
- [ ] Security considerations for running third-party code?

## References

- Related: r3v6w8y2t5s1 (App architecture refactor)
- Similar concepts: VSCode extensions, Obsidian plugins, Home Assistant integrations

## History

- 2025-01-23: Created
