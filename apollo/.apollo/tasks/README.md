# Tasks Directory

A git-native, platform-agnostic task tracking system designed to be portable across Git clients (GitHub, GitLab, Bitbucket, etc.) while remaining human-readable and editable.

## Philosophy

Inspired by the observation that every Git platform has created its own task management system (GitHub Issues, GitLab Issues, Jira, etc.), this format aims to:

1. **Be git-native** - Tasks are files that can be versioned, branched, and merged
2. **Be human-readable** - Markdown with YAML frontmatter is easy to read and edit
3. **Be portable** - Can sync to/from any issue tracker
4. **Be offline-first** - Works without network access
5. **Enable collaboration** - Tasks can be discussed via commits and PRs

## Structure

**Every task is a folder** with the task ID as the folder name. This allows tasks to have associated files like plans, architecture docs, research notes, etc.

```
tasks/
├── README.md           # This file
├── SCHEMA.md           # Task format specification
├── index.md            # Task overview/dashboard
├── _templates/         # Task templates
│   ├── task.md
│   ├── bug.md
│   ├── feature.md
│   └── epic.md
├── open/               # Open tasks
│   └── a1b2c3d4e5f6/   # Task folder
│       ├── task.md     # Main task file (required)
│       ├── meta.json   # Structured metadata (optional)
│       └── plan.md     # Implementation plan (optional)
├── in-progress/        # Tasks being worked on
│   └── m3n4o5p6q7r8/
│       ├── task.md
│       └── architecture.md
├── done/               # Completed tasks
│   └── s9t0u1v2w3x4/
│       └── task.md
├── backlog/            # Future tasks (not prioritized)
│   └── y5z6a7b8c9d0/
│       ├── task.md
│       ├── meta.json
│       └── research.md
└── archive/            # Cancelled or obsolete tasks
```

## Quick Start

### Create a new task

1. Generate a random 12-character alphanumeric ID (e.g., `a1b2c3d4e5f6`)
2. Create a folder: `backlog/{id}/`
3. Copy a template from `_templates/` to `{id}/task.md`
4. Update the `id` field in frontmatter to match the folder name
5. Fill in the rest of the frontmatter and description
6. Optionally create `meta.json` for fast metadata access
7. Commit the new task

### Update task status

Move the entire task folder to the appropriate status directory:
- `backlog/` → Not yet prioritized
- `open/` → Ready to work on
- `in-progress/` → Currently being worked on
- `done/` → Completed
- `archive/` → Cancelled or no longer relevant

### Link tasks to commits

Reference tasks in commit messages:
```
feat: Add user authentication

Implements a1b2c3d4e5f6
Refs g7h8i9j0k1l2
```

## Task Folder Contents

### Required: task.md

The main task file with YAML frontmatter:

```markdown
---
id: a1b2c3d4e5f6
title: Short descriptive title
type: task | bug | feature | epic
status: open | in-progress | blocked | done | cancelled
priority: critical | high | medium | low
created: 2025-01-21
due: 2025-02-01  # optional
assignees:
  - username
labels:
  - frontend
  - urgent
parent: x9y8z7w6v5u4  # optional, for subtasks
blocks: []            # tasks this blocks
blocked_by: []        # tasks blocking this
related: []           # related tasks
external:             # links to external trackers
  jira: PROJECT-123
  github: org/repo#456
---

# Short descriptive title

## Description

Detailed description of the task...

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Technical Notes

Implementation details, approach, or constraints.

## References

- [Implementation Plan](./plan.md)
- [Architecture](./architecture.md)

## History

- 2025-01-21: Created by @username
- 2025-01-22: Moved to in-progress
```

### Optional: meta.json

Structured metadata for fast parsing without reading the full markdown:

```json
{
  "id": "a1b2c3d4e5f6",
  "title": "Short descriptive title",
  "type": "task",
  "status": "backlog",
  "priority": "medium",
  "created": "2025-01-21",
  "due": null,
  "assignees": ["username"],
  "labels": ["frontend", "urgent"],
  "component": null
}
```

### Optional: Associated Files

| File | Purpose |
|------|---------|
| `plan.md` | Detailed implementation plan |
| `architecture.md` | Technical architecture documentation |
| `research.md` | Research notes and findings |
| `notes.md` | General notes and discussion |
| `*.png/jpg` | Diagrams, screenshots, mockups |

Reference these from task.md using relative paths: `[Plan](./plan.md)`

## Conventions

### Task IDs

- Format: 12-character random alphanumeric string (e.g., `a1b2c3d4e5f6`)
- Generated randomly to avoid coordination/conflicts
- Use lowercase letters and numbers only (`[a-z0-9]`)
- IDs are never reused
- The folder name must match the `id` field in task.md frontmatter

### Priorities

| Priority | Description |
|----------|-------------|
| critical | Production down, security issue, blocking release |
| high | Important for current sprint/milestone |
| medium | Should be done soon |
| low | Nice to have, do when time permits |

### Labels

Labels are free-form but some common ones:
- `bug`, `feature`, `enhancement`, `docs`
- `frontend`, `backend`, `api`, `infrastructure`
- `urgent`, `blocked`, `needs-review`
- `good-first-issue`, `help-wanted`

## Integration with Apollo

Apollo reads the `tasks/` directory to:
- Display tasks in a kanban or list view
- Show task status in the sidebar
- Link tasks to prototypes and features
- Provide AI-assisted task management
- Access associated files (plans, architecture docs, etc.)

## Syncing with External Trackers

The `external` field in frontmatter maps to external issue trackers:

```yaml
external:
  jira: PROJ-123
  github: org/repo#456
  gitlab: group/project#789
```

Future tooling can sync tasks bidirectionally with these systems.

## Best Practices

1. **One task per folder** - Easier to track changes and keep related files together
2. **Descriptive titles** - Should be understandable without reading the description
3. **Update status promptly** - Move task folders between directories as work progresses
4. **Link to commits** - Reference tasks in commit messages
5. **Use templates** - Ensures consistent formatting
6. **Archive don't delete** - Maintain history of cancelled tasks
7. **Keep associated files together** - Plans, research, and notes live with the task