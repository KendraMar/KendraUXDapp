---
name: apollo-tasks
description: Create and manage tasks in Apollo's .apollo/tasks folder. Use when the user asks to create a task, issue, todo, ticket, or wants to track work items in the project.
---

# Apollo Task Management

Create tasks in `.apollo/tasks/` using this git-native task tracking system.

## Task Structure

**Every task is a folder** containing at minimum a `task.md` file. This allows tasks to have associated files like plans, architecture docs, research notes, etc.

```
.apollo/tasks/{status}/{task-id}/
├── task.md          # Required: Main task file with frontmatter
├── meta.json        # Optional: Structured metadata for fast parsing
├── plan.md          # Optional: Implementation plan
├── architecture.md  # Optional: Technical architecture
└── {other-files}    # Optional: Research, notes, images, etc.
```

## Quick Start

1. Generate a 12-char random alphanumeric ID (lowercase): `k7m2p9x4q1n8`
2. Create folder: `.apollo/tasks/backlog/{id}/`
3. Create `task.md` inside with frontmatter + markdown format below
4. Optionally create `meta.json` for fast metadata access

## Task File Format (task.md)

**CRITICAL: Follow this exact YAML format. Incorrect formatting causes tasks to be silently skipped.**

```markdown
---
id: k7m2p9x4q1n8
title: Short descriptive title
type: task
status: backlog
priority: medium
created: 2025-01-23T00:00:00.000Z
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

Detailed description of what needs to be done and why.

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2

## Technical Notes

Implementation details, approach, or constraints.

## References

- [Related document](./plan.md)
- [External resource](https://example.com)

## History

- 2025-01-23: Created
```

## Critical YAML Formatting Rules

**Apollo uses gray-matter to parse YAML. Incorrect formatting silently breaks parsing.**

### 1. Use explicit `null` for empty values

```yaml
# CORRECT
due: null
parent: null
component: null

# WRONG - causes parsing issues or missing data
due: 
parent: 
component: 
```

### 2. Use full ISO timestamps for dates

```yaml
# CORRECT
created: 2025-01-23T00:00:00.000Z

# ACCEPTABLE
created: 2025-01-23
```

### 3. Escape special characters in titles

Titles with quotes, hyphens after quotes, or colons need single-quote escaping:

```yaml
# CORRECT
title: 'My Feature - With Hyphen'
title: 'Title with "quotes" inside'
title: 'Config: Setup Guide'

# WRONG - YAML parsing will FAIL
title: "My Feature" - With Hyphen
title: Title: Setup Guide
```

### 4. Follow the correct field order

```yaml
id, title, type, status, priority, created, due, assignees, labels,
parent, blocks, blocked_by, related, external, estimate, component,
sprint, starred, flag
```

### 5. Use proper YAML array syntax

```yaml
# CORRECT - multi-line
labels:
  - frontend
  - feature
blocked_by:
  - a1b2c3d4e5f6

# CORRECT - inline empty
labels: []
blocked_by: []

# WRONG
labels: [frontend, feature]  # May work but less reliable
```

## Parent-Child Relationships (Epics)

To group tasks under an epic:

1. **Child tasks set `parent: {epic-id}`** in their frontmatter
2. **Epics don't need a children array** - Apollo builds relationships from child `parent` fields

```yaml
# In child task (feature under an epic)
parent: gl320ae1erth  # ID of parent epic

# In epic task
parent: null  # Epics typically have no parent
```

## Metadata File (meta.json)

Optional JSON file for fast parsing without reading the full markdown:

```json
{
  "id": "k7m2p9x4q1n8",
  "title": "Short descriptive title",
  "type": "task",
  "status": "backlog",
  "priority": "medium",
  "created": "2025-01-23T00:00:00.000Z",
  "due": null,
  "assignees": [],
  "labels": ["frontend", "feature"],
  "component": null,
  "starred": false,
  "flag": null
}
```

## Status Folders

| Folder | Purpose |
|--------|---------|
| `backlog/` | Not yet prioritized |
| `open/` | Ready to work on |
| `in-progress/` | Currently being worked on |
| `done/` | Completed |
| `archive/` | Cancelled or obsolete |

Move entire task folders between status directories to change status.

## Task Types

| Type | Use For |
|------|---------|
| `task` | General work items |
| `bug` | Defects to fix |
| `feature` | New functionality |
| `epic` | Large initiatives with subtasks |
| `spike` | Research or investigation |

## Creating a Task

```bash
# 1. Generate ID
ID=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | head -c 12)

# 2. Create task folder
mkdir -p .apollo/tasks/backlog/$ID

# 3. Create task.md (use template from _templates/ or the format above)
# 4. Optionally create meta.json
```

## Associated Files

Tasks can have additional files for complex work:

| File | Purpose |
|------|---------|
| `plan.md` | Detailed implementation plan |
| `architecture.md` | Technical architecture documentation |
| `research.md` | Research notes and findings |
| `notes.md` | General notes and discussion |
| `*.png/jpg` | Diagrams, screenshots, mockups |

Reference these files from task.md using relative paths: `[Plan](./plan.md)`

## Linking Tasks

- `parent: id` - Parent epic/task (child references parent)
- `blocks: [id1, id2]` - This task blocks others
- `blocked_by: [id1]` - This task is blocked by others  
- `related: [id1]` - Related but not blocking

## Commit References

Reference tasks in commits:
```
feat(auth): implement login flow

Implements k7m2p9x4q1n8
Refs a1b2c3d4e5f6
```
