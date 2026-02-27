---
id: p8jf3akywwkw
title: Design System Abstraction - Swappable UI Systems
type: epic
status: backlog
priority: high
created: 2026-01-23T00:00:00.000Z
due: null
assignees: []
labels:
  - epic
  - architecture
  - frontend
  - design-system
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: 8-12 weeks
sprint: null
starred: false
flag: null
---

# Design System Abstraction - Swappable UI Systems

## Overview

Re-architect Apollo from a PatternFly 6-specific implementation to a **design system agnostic** application that can swap between different UI design systems (PatternFly, Material Design, Carbon, custom systems) at runtime with a single click.

This is a major architectural refactor affecting ~40+ page files and core components, following **Brad Frost's Atomic Design** methodology with a provider-based abstraction layer.

## Goals

1. **Runtime Design System Switching** - Users can change the entire UI look and feel with a click
2. **Canonical Token System** - Apollo defines the design token API; systems adapt to it
3. **Declarative Component API** - Pages declare what they need; the selected system provides it
4. **User Customization** - Support user-level `custom.css` and component overrides
5. **Future-Proof Architecture** - Easy to add new design systems later

## Success Metrics

- Application runs fully with PatternFly through the abstraction layer
- All ~40 pages render correctly after migration
- Design system switching works at runtime via Settings
- User's `custom.css` applies across any design system
- No significant performance regression
- Clean developer experience (simple imports, good error messages)

## Scope

### In Scope

- Create `src/systems/` directory structure following Atomic Design
- Implement DesignSystemProvider and useDesignSystem hook
- Create canonical token schema (JSON)
- Wrap all PatternFly components (~150) in abstraction layer
- Migrate all pages to use the abstraction
- Add design system switcher to Settings
- Support user CSS overrides

### Out of Scope (Future Work)

- Material Design implementation
- Carbon Design implementation
- Custom design system builder UI
- Visual theme editor

## User Stories

1. As a **user**, I want **to switch design systems at runtime**, so that **I can use my preferred visual style**
2. As a **developer**, I want **a clean component API**, so that **I can build pages without knowing which design system is active**
3. As a **user**, I want **my custom CSS to apply across any design system**, so that **I can maintain my personal customizations**

## Child Tasks

| ID | Title | Status | Phase |
|----|-------|--------|-------|
| (pending) | Create systems/ directory structure | backlog | Phase 1 |
| (pending) | Implement DesignSystemProvider | backlog | Phase 1 |
| (pending) | Create canonical token schema | backlog | Phase 1 |
| (pending) | Create PatternFly token mapping | backlog | Phase 1 |
| (pending) | Create PatternFly atoms (~35) | backlog | Phase 2 |
| (pending) | Create PatternFly molecules (~45) | backlog | Phase 3 |
| (pending) | Create PatternFly organisms (~55) | backlog | Phase 4 |
| (pending) | Create PatternFly templates (~15) | backlog | Phase 5 |
| (pending) | Modify App.js for DesignSystemProvider | backlog | Phase 6 |
| (pending) | Migrate AppMasthead.js | backlog | Phase 6 |
| (pending) | Migrate AppSidebar.js | backlog | Phase 6 |
| (pending) | Migrate Priority 1 pages (Welcome, Chat, Settings, Dashboard) | backlog | Phase 7 |
| (pending) | Migrate Priority 2 pages (Tasks, Feed, Bulletin, etc.) | backlog | Phase 7 |
| (pending) | Migrate remaining ~30 pages | backlog | Phase 7 |
| (pending) | Full testing & optimization | backlog | Phase 8 |

*Note: Individual child tasks to be created as work progresses*

## Dependencies

- PatternFly 6 component library documentation (via MCP)
- React Context API
- Dynamic imports for runtime loading

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking changes during migration | Medium | High | Migrate incrementally, keep old imports until page fully converted |
| Performance regression from runtime loading | Low | Medium | Lazy load systems, code split, preload active system |
| Missing component mappings | Medium | Low | Fallback components, log warnings in dev |
| Complex PF-specific features incompatible | Low | Medium | Allow documented exceptions for unique components |

## Timeline (Estimated)

| Phase | Milestone | Target | Status |
|-------|-----------|--------|--------|
| 1 | Foundation (Provider, tokens, structure) | Week 1-2 | pending |
| 2 | Core Atoms (~35 components) | Week 2-3 | pending |
| 3 | Molecules (~45 components) | Week 3-4 | pending |
| 4 | Organisms (~55 components) | Week 4-5 | pending |
| 5 | Templates (~15 components) | Week 5 | pending |
| 6 | App Integration (App.js, Masthead, Sidebar) | Week 5-6 | pending |
| 7 | Page Migration (~40 pages) | Week 6-10 | pending |
| 8 | Testing & Polish | Week 10-11 | pending |

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Switching Mechanism | Runtime | Hot-swap with a click as requested |
| Token Strategy | Canonical schema | Apollo defines API, systems adapt |
| Prop API | Rich with graceful degradation | Inspired by PatternFly, flexible |
| CSS Strategy | Complete replacement per system | Clean separation, user overrides via custom.css |
| Migration | Incremental page-by-page | Lower risk, continuous integration |

## Technical Architecture

### Directory Structure

```
src/systems/
├── index.js                    # Main exports
├── DesignSystemProvider.js     # React Context provider
├── useDesignSystem.js          # Consumer hooks
├── tokens/
│   ├── schema.json             # Canonical token schema
│   └── tokens.js               # Token utilities
└── ui-systems/
    └── patternfly/
        ├── index.js            # System manifest
        ├── tokens.json         # Token mapping
        ├── atoms/              # ~35 components
        ├── molecules/          # ~45 components
        ├── organisms/          # ~55 components
        └── templates/          # ~15 components
```

### Component Classification (Atomic Design)

| Level | Count | Examples |
|-------|-------|----------|
| Atoms | ~35 | Button, Icon, TextInput, Checkbox, Badge, Spinner |
| Molecules | ~45 | SearchInput, FormGroup, Dropdown, Tabs, Pagination |
| Organisms | ~55 | Modal, Table, Card, EmptyState, Chatbot, Masthead |
| Templates | ~15 | Page, PageSection, Grid, Flex, Stack |

## References

- [Full Architecture Plan](./p8jf3akywwkw-plan.md) - Detailed implementation guide
- [Brad Frost - Atomic Design](https://atomicdesign.bradfrost.com/)
- [PatternFly 6 Documentation](https://www.patternfly.org/v6/)

## History

- 2026-01-23: Epic created with full architecture plan
