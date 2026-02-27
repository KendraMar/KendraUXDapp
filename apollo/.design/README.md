# .design Folder

**Specification Version:** 1.0.0

This folder captures design context and history for Apollo.

Specification: https://github.com/dotdesign/dotdesign

## Purpose

The `.design` folder provides:
- Design decision history and rationale
- Open design questions tracking and resolution
- Stakeholder context for features
- Links to design artifacts and meetings
- Feature mapping from code paths to design areas

## Structure

```
.design/
├── README.md
├── feature-mapping.md
├── features/
│   ├── chat/
│   ├── feed/
│   ├── sidebar-navigation/
│   ├── integrations/
│   ├── prototypes/
│   ├── catalog/
│   └── task-management/
├── product/
│   ├── design-guidelines/
│   └── ux-research/
└── agents/
    ├── rules/
    └── skills/
```

## Relationship to .apollo

Apollo also has an `.apollo/` folder that serves as the project's internal metadata store (task tracking, governance, configuration). The `.design/` folder follows the open `.design` folder specification and focuses specifically on design decisions, history, and feature context in a standardized, portable format.

| Concern | Location |
|---------|----------|
| Design history and decisions | `.design/features/*/design-history.md` |
| Feature mapping (code → design) | `.design/feature-mapping.md` |
| Design questions | `.design/features/*/design-questions.md` |
| Task tracking | `.apollo/tasks/` |
| Governance | `.apollo/governance/` |
| Apollo configuration | `.apollo/config.yaml` |

## AI Assistant Guidelines

When making design-related changes:
1. Check `feature-mapping.md` to find the relevant feature
2. Review the feature's `design-history.md` for context
3. Check `design-questions.md` for any open questions relevant to your work
4. After significant design changes, add an entry to design history

### Entry Format

```markdown
## YYYY-MM-DD

### [Type] Brief description
- 1-2 sentences about the change and why
```

**Entry types:** `[Meeting]`, `[Decision]`, `[Update]`, `[Addition]`, `[Removal]`, `[Descoped]`, `[Feedback]`, `[Enhancement]`, `[Bugfix]`

**Keep entries concise** — focus on the design impact, not implementation details.

## Custom Entry Types

This repository uses these custom entry types:

- `[X-Integration]` - New external service integration or changes to existing integrations
- `[X-Research]` - User research findings specific to a feature
