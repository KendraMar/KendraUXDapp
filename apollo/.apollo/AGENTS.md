# AGENTS.md - Apollo Metadata

Instructions for AI coding agents on using the `.apollo` and `.design` folders.

## Overview

Apollo uses two metadata folders:

### `.design/` — Design Context (dotdesign spec v1.0.0)

Design history, decisions, stakeholders, open questions, and feature mapping live here, following the open [`.design` folder specification](https://github.com/dotdesign/dotdesign).

- **Design history** - Per-feature chronological record of design decisions (`.design/features/*/design-history.md`)
- **Feature mapping** - Maps code paths to design features (`.design/feature-mapping.md`)
- **Design questions** - Open questions and resolved answers (`.design/features/*/design-questions.md`)
- **Stakeholders** - RACI documentation per feature (`.design/features/*/design-stakeholders.md`)
- **Design guidelines** - Product-wide design standards (`.design/product/`)
- **Agent guidance** - Design-specific rules and skills (`.design/agents/`)

When making UI/UX changes, always check `.design/feature-mapping.md` first, then read the relevant feature's design history and open questions. See `.design/README.md` for full guidance.

### `.apollo/` — Project Operations

Task tracking, governance, architectural decisions, and Apollo-specific configuration live here.

- **Task tracking** - Git-native issue management (`.apollo/tasks/`)
- **Decision log** - Architectural Decision Records (`.apollo/decisions.md`)
- **Context sources** - Links to external resources (`.apollo/context-sources.md`)
- **Governance** - Constitution, laws, guardrails, and processes (`.apollo/governance/`)
- **Configuration** - Apollo integration settings (`.apollo/config.yaml`)

**Always read both folders** when working on Apollo to understand context, find existing tasks, and document your work.

## Task Tracking System

### Location: `.apollo/tasks/`

This is a git-native task tracking system. Tasks are markdown files with YAML frontmatter, organized by status.

### Directory Structure

**Every task is a folder** with the task ID as the folder name. Each task folder contains at minimum a `task.md` file, and can include associated files like plans, architecture docs, etc.

```
tasks/
├── backlog/                # Not yet prioritized
│   └── {task-id}/          # Task folder
│       ├── task.md         # Main task file (required)
│       ├── meta.json       # Structured metadata (optional)
│       └── plan.md         # Implementation plan (optional)
├── open/                   # Ready to work on
├── in-progress/            # Currently being worked on
├── done/                   # Completed
├── archive/                # Cancelled/obsolete
├── _templates/             # Task templates
├── index.md                # Task overview
├── README.md               # Full documentation
└── SCHEMA.md               # Task format specification
```

### Before Starting Work

1. **Check for existing tasks**: Look in `open/` and `in-progress/` for relevant tasks
2. **Check the backlog**: The task you need might already exist in `backlog/`
3. **Read related tasks**: Check `related` and `blocked_by` fields

### Finding Tasks

```bash
# List all open tasks
ls .apollo/tasks/open/

# Search for tasks by keyword
grep -r "authentication" .apollo/tasks/

# Find tasks by label
grep -r "labels:.*frontend" .apollo/tasks/
```

### Creating a New Task

1. Generate a random 12-character alphanumeric ID (e.g., `k7m2p9x4q1n8`)
2. Create a folder in the appropriate status directory: `tasks/backlog/{id}/`
3. Copy appropriate template from `_templates/` to `{id}/task.md`:
   - `task.md` - General task
   - `bug.md` - Bug report
   - `feature.md` - Feature request
   - `epic.md` - Large feature with subtasks
   - `spike.md` - Research/investigation
4. Update the `id` field in frontmatter to match the folder name
5. Fill in the rest of the frontmatter and description
6. Optionally create `meta.json` for fast metadata access
7. Commit the new task

### Task File Format (task.md)

**IMPORTANT:** The YAML frontmatter must follow specific formatting rules for Apollo to parse tasks correctly.

```yaml
---
id: k7m2p9x4q1n8
title: Short descriptive title
type: task
status: backlog
priority: medium
created: 2025-01-21T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - feature
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

# Short descriptive title

## Description
What needs to be done.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## References
- [Implementation Plan](./plan.md)
```

### Critical YAML Formatting Rules

**Apollo uses gray-matter to parse YAML frontmatter. Incorrect formatting will cause tasks to be silently skipped.**

1. **Use explicit `null` for empty values** - NOT empty strings or omitted values
   ```yaml
   # CORRECT
   due: null
   parent: null
   component: null
   
   # WRONG - will cause parsing issues
   due: 
   parent: 
   component: 
   ```

2. **Use full ISO timestamps for dates**
   ```yaml
   # CORRECT
   created: 2025-01-21T00:00:00.000Z
   
   # ACCEPTABLE but less precise
   created: 2025-01-21
   ```

3. **Field ordering matters** - Follow this order:
   ```yaml
   id, title, type, status, priority, created, due, assignees, labels,
   parent, blocks, blocked_by, related, external, estimate, component,
   sprint, starred, flag
   ```

4. **Escape special characters in titles** - Titles with quotes, hyphens, or colons need single-quote escaping:
   ```yaml
   # CORRECT
   title: 'My Feature - With Hyphen'
   title: 'Title with "quotes" inside'
   title: 'Title: With Colon'
   
   # WRONG - YAML parsing will fail
   title: "My Feature" - With Hyphen
   title: Title: With Colon
   ```

5. **Use YAML arrays properly** - Multi-value fields should use list syntax:
   ```yaml
   # CORRECT
   labels:
     - frontend
     - feature
   blocked_by:
     - a1b2c3d4e5f6
   
   # ALSO CORRECT (inline)
   labels: []
   blocked_by: []
   ```

### Parent-Child Relationships (Epics)

To group tasks under an epic:

1. **Child tasks reference the parent** - Set `parent: {epic-id}` in each child task
2. **Epics don't need a children array** - Apollo builds the relationship from child `parent` fields

```yaml
# In child task (e.g., feature under an epic)
parent: gl320ae1erth  # ID of the parent epic

# In epic task
parent: null  # Epics typically have no parent
```

The epic will automatically display its child tasks in the Tasks UI based on which tasks reference it as their parent.

### Associated Files

Task folders can contain additional files:
- `plan.md` - Detailed implementation plan
- `architecture.md` - Technical architecture
- `research.md` - Research notes
- Any other relevant files

### Updating Task Status

Move the entire task folder to the new status directory:
```bash
# Start working on a task
mv .apollo/tasks/open/k7m2p9x4q1n8/ .apollo/tasks/in-progress/

# Complete a task
mv .apollo/tasks/in-progress/k7m2p9x4q1n8/ .apollo/tasks/done/
```

Also update the `status` field in the frontmatter (task.md) to match.

### Linking Tasks to Commits

Reference tasks in commit messages:
```
feat(auth): implement login flow

Implements TASK-001
Refs TASK-002
```

## Design History

> **Moved to `.design/`** — Design history is now tracked per-feature in `.design/features/*/design-history.md`, following the [dotdesign specification](https://github.com/dotdesign/dotdesign). The previous `.apollo/history.md` file is deprecated.

### When to Update

When making significant UI/UX changes:
1. Check `.design/feature-mapping.md` to find the relevant feature
2. Add an entry to that feature's `design-history.md`
3. Follow the format in `.design/README.md`

### Entry Format

```markdown
## YYYY-MM-DD

### [Type] Brief description
- 1-2 sentences about the change and why
```

Entry types: `[Meeting]`, `[Decision]`, `[Update]`, `[Addition]`, `[Removal]`, `[Descoped]`, `[Feedback]`, `[Enhancement]`, `[Bugfix]`

## Decision Log

### Location: `.apollo/decisions.md`

Architectural Decision Records (ADRs) documenting key choices.

### When to Add Decisions

Document decisions when:
- Choosing between multiple approaches
- Making architectural changes
- Establishing new patterns or conventions
- Deprecating existing approaches

### Decision Format

```markdown
### DEC-XXX: Title

**Date**: 2025-01-21
**Status**: Proposed | Decided | Implemented | Superseded
**Deciders**: Names

#### Context
Why this decision was needed.

#### Decision
What was decided.

#### Consequences
What becomes easier or harder.

#### Alternatives Considered
What else was evaluated.
```

## Feature Documentation

> **Moved to `.design/`** — Per-feature design context (history, stakeholders, questions) is now in `.design/features/*/`. The previous `.apollo/features/` folder is deprecated for design context.

### Location: `.design/features/{feature-name}/`

Each feature has its own folder containing:
- `design-history.md` — Chronological design decisions (required)
- `design-stakeholders.md` — RACI documentation (recommended)
- `design-questions.md` — Open and resolved questions (recommended)

See `.design/feature-mapping.md` to find which feature folder maps to a given code path.

## Context Sources

### Location: `.apollo/context-sources.md`

Links to external resources relevant to the project.

### When to Update

Add sources when:
- Finding useful reference documentation
- Creating new design files
- Setting up new integrations
- Discovering relevant prior art

## Stakeholders

> **Moved to `.design/`** — Stakeholder info is now per-feature in `.design/features/*/design-stakeholders.md`. The previous `.apollo/stakeholders.md` file is deprecated.

## Configuration

### Location: `.apollo/config.yaml`

Controls how Apollo consumes this metadata folder.

## Governance

### Location: `.apollo/governance/`

The governance folder defines how the Apollo project is governed by humans and AI agents working together.

### Key Documents

- `CONSTITUTION.md` - Foundational document defining project values and governance structure
- `laws/` - Formally adopted rules binding on all contributors
- `guardrails/` - AI agent safety constraints and permissions
- `roles/` - Defined governance roles and responsibilities
- `processes/` - Standard operating procedures

### For AI Agents

AI agents operating in Apollo must:
1. Read and follow `governance/guardrails/agent-boundaries.md`
2. Respect API permissions in `governance/guardrails/api-permissions.md`
3. Request human approval for gated actions
4. Never attempt prohibited actions

See `governance/README.md` for complete documentation.

## Quick Reference

| What | Where |
|------|-------|
| Design history for a feature | `.design/features/{name}/design-history.md` |
| Map code path to feature | `.design/feature-mapping.md` |
| Open design questions | `.design/features/{name}/design-questions.md` |
| Feature stakeholders | `.design/features/{name}/design-stakeholders.md` |
| Design guidelines | `.design/product/design-guidelines/` |
| Create a task | `.apollo/tasks/backlog/{id}/task.md` |
| Find open tasks | `.apollo/tasks/open/` |
| Read a task | `.apollo/tasks/{status}/{id}/task.md` |
| Log an architectural decision | `.apollo/decisions.md` |
| Add external link | `.apollo/context-sources.md` |
| Project constitution | `.apollo/governance/CONSTITUTION.md` |
| Propose a law | `.apollo/governance/laws/proposed/` |
| Agent guardrails | `.apollo/governance/guardrails/` |
| Governance roles | `.apollo/governance/roles/README.md` |

## Best Practices

1. **Check `.design/` first** - Before UI changes, read the feature's design history and open questions
2. **Update design history** - After significant UI/UX changes, add entries to `.design/features/*/design-history.md`
3. **Check before creating tasks** - Search for existing tasks before making new ones
4. **Update task status** - Move tasks between directories as work progresses
5. **Link everything** - Reference tasks in commits, link related tasks together
6. **Be specific** - Use descriptive titles and clear acceptance criteria
7. **Document architectural decisions** - ADRs in `.apollo/decisions.md` help future contributors understand why
8. **Follow guardrails** - AI agents must operate within defined boundaries
9. **Request approval** - Gated actions require explicit human approval

## Skills

### Location: `.cursor/skills/`

Skills are structured instructions for AI agents to perform specific tasks correctly. Cursor automatically discovers skills in this folder.

| Skill | Description |
|-------|-------------|
| `apollo-tasks` | Create and manage tasks in `.apollo/tasks/` |
| `create-prototype` | Create HTML prototypes in `data/prototypes/` with proper structure and metadata |

When performing a task covered by a skill, **read the skill first** to ensure you follow the correct process and file structure.

## Schema References

- Design spec: `.design/.schema-version` (dotdesign v1.0.0)
- Design folder guide: `.design/README.md`
- Task format: `.apollo/tasks/SCHEMA.md`
- Overall structure: `.apollo/SCHEMA.md`
- Configuration: `.apollo/config.yaml`
- Skills: `.cursor/skills/*/SKILL.md`