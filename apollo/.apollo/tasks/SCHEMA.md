# Task Schema Specification

This document defines the schema for task folders and files, enabling tools to reliably parse and manipulate tasks.

## Folder Structure

**Every task is a folder** with the task ID as the folder name. The folder contains at minimum a `task.md` file.

```
{status}/{task-id}/
├── task.md          # Required: Main task file with frontmatter
├── meta.json        # Optional: Structured metadata for fast parsing
└── {associated-files}  # Optional: Plans, architecture docs, research, etc.
```

### Example

```
backlog/k7m2p9x4q1w8/
├── task.md
├── meta.json
├── plan.md
└── architecture.md
```

## File Format

The main task file (`task.md`) is a Markdown file with YAML frontmatter:

```markdown
---
# YAML frontmatter
---

# Markdown content
```

## Frontmatter Schema

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique task identifier (e.g., `a1b2c3d4e5f6`) |
| `title` | string | Short descriptive title (max 100 chars) |
| `type` | enum | Task type (see below) |
| `status` | enum | Current status (see below) |
| `priority` | enum | Priority level (see below) |
| `created` | date | Creation date (YYYY-MM-DD) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `due` | date | Due date (YYYY-MM-DD) |
| `completed` | date | Completion date (YYYY-MM-DD) |
| `assignees` | string[] | List of assignee usernames |
| `labels` | string[] | List of labels/tags |
| `starred` | boolean | Whether the task is starred/favorited (default: false) |
| `flag` | enum | Color flag for visual categorization (see below) |
| `parent` | string | Parent task ID (for subtasks) |
| `children` | string[] | Child task IDs (for epics/parent tasks) |
| `blocks` | string[] | Task IDs this task blocks |
| `blocked_by` | string[] | Task IDs blocking this task |
| `related` | string[] | Related task IDs |
| `external` | object | External tracker references |
| `estimate` | string | Time estimate (e.g., "2h", "1d", "1w") |
| `sprint` | string | Sprint or milestone name |
| `component` | string | Component or area |
| `reporter` | string | Who reported/created the task |

## Enums

### type

| Value | Description |
|-------|-------------|
| `task` | General task or to-do item |
| `bug` | Bug report or defect |
| `feature` | New feature request |
| `epic` | Large feature containing subtasks |
| `story` | User story |
| `chore` | Maintenance, refactoring, or housekeeping |
| `spike` | Research or investigation task |
| `doc` | Documentation task |

### status

| Value | Description | Directory |
|-------|-------------|-----------|
| `backlog` | Not yet prioritized | `backlog/` |
| `open` | Ready to be worked on | `open/` |
| `in-progress` | Currently being worked on | `in-progress/` |
| `blocked` | Blocked by dependency | `in-progress/` |
| `review` | In review/QA | `in-progress/` |
| `done` | Completed | `done/` |
| `cancelled` | Will not be done | `archive/` |
| `duplicate` | Duplicate of another task | `archive/` |

### priority

| Value | Weight | Description |
|-------|--------|-------------|
| `critical` | 1 | Highest priority, do immediately |
| `high` | 2 | Important, do soon |
| `medium` | 3 | Normal priority |
| `low` | 4 | Lower priority, do when possible |

### flag

Color flags for visual categorization (similar to Apple Mail flags).

| Value | Color | Description |
|-------|-------|-------------|
| `red` | Red | Urgent or important |
| `orange` | Orange | Needs attention |
| `yellow` | Yellow | Under review |
| `green` | Green | Good to go |
| `blue` | Blue | Information |
| `purple` | Purple | Personal or special |
| `gray` | Gray | Low priority or on hold |
| `null` | None | No flag (default) |

## Markdown Content Structure

### Recommended Sections

```markdown
# {Title}

## Description

Detailed description of the task. Can include:
- Background context
- Problem statement
- Goals

## Acceptance Criteria

Checkboxes for completion criteria:
- [ ] Criterion 1
- [ ] Criterion 2
- [x] Completed criterion

## Technical Notes

Implementation details, approach, or constraints.

## References

- [Related document](url)
- [Design spec](url)

## History

Chronological log of significant events:
- YYYY-MM-DD: Event description
```

### Optional Sections

- `## Reproduction Steps` - For bugs
- `## Expected Behavior` - For bugs
- `## Actual Behavior` - For bugs
- `## Screenshots` - Visual references
- `## Dependencies` - External dependencies
- `## Subtasks` - Inline subtask list
- `## Discussion` - Comments or notes

## External References

The `external` field maps to external issue trackers:

```yaml
external:
  jira: PROJECT-123        # Jira issue key
  github: org/repo#456     # GitHub issue
  gitlab: group/project#789 # GitLab issue
  linear: TEAM-123         # Linear issue
  asana: 1234567890        # Asana task ID
  trello: abc123           # Trello card ID
```

## ID Generation

### Format

- 12-character random alphanumeric string
- Characters: lowercase letters and numbers only (`[a-z0-9]`)
- Example: `a1b2c3d4e5f6`, `x9y8z7w6v5u4`

### Generation

Generate a random ID using any method that produces 12 random alphanumeric characters:

```bash
# Shell example
cat /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | head -c 12

# Or use: openssl rand -hex 6
```

### Why Random IDs?

- **No coordination required** - Multiple people can create tasks simultaneously without conflicts
- **Distributed-friendly** - Works offline, no central counter needed
- **Collision-resistant** - 36^12 ≈ 4.7 × 10^18 possible combinations

## Validation Rules

### Required Validations

1. `id` must be unique across all tasks
2. `id` must match the task folder name (e.g., folder `a1b2c3d4e5f6/` contains `task.md` with `id: a1b2c3d4e5f6`)
3. `title` must not be empty
4. `status` must match containing status directory (backlog, open, in-progress, done, archive)
5. `created` must be valid date
6. `due` must be >= `created` if specified
7. Task folder must contain a `task.md` file

### Recommended Validations

1. `parent` must reference existing task
2. `blocks` and `blocked_by` must reference existing tasks
3. `assignees` should be valid usernames
4. `labels` should be from defined set (if enforced)
5. `meta.json` (if present) should match frontmatter in `task.md`

## meta.json Schema

Optional JSON file for fast metadata parsing. If present, should mirror key frontmatter fields.

```json
{
  "id": "k7m2p9x4q1w8",
  "title": "Short descriptive title",
  "type": "task",
  "status": "backlog",
  "priority": "medium",
  "created": "2025-01-21",
  "due": null,
  "assignees": ["username"],
  "labels": ["frontend", "urgent"],
  "component": "auth"
}
```

### meta.json Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Must match folder name and task.md frontmatter |
| `title` | string | Task title |
| `type` | string | Task type (task, bug, feature, epic, etc.) |
| `status` | string | Current status |
| `priority` | string | Priority level |
| `created` | string | Creation date (YYYY-MM-DD) |
| `due` | string/null | Due date if set |
| `assignees` | string[] | List of assignees |
| `labels` | string[] | List of labels |
| `component` | string/null | Component or area |
| `starred` | boolean | Whether the task is starred (default: false) |
| `flag` | string/null | Color flag (red, orange, yellow, green, blue, purple, gray) |

## Parsing Notes

### YAML Frontmatter

- Delimited by `---` on its own line
- First `---` must be on line 1
- Content between delimiters is YAML

### Date Handling

- All dates are ISO 8601 format: `YYYY-MM-DD`
- Times are optional: `YYYY-MM-DDTHH:MM:SS`
- Timezone assumed local unless specified

### Checkbox Parsing

- Unchecked: `- [ ] Text`
- Checked: `- [x] Text` or `- [X] Text`
- Used for acceptance criteria tracking

### Folder Structure Parsing

When parsing tasks:
1. Scan status directories (backlog, open, in-progress, done, archive)
2. For each subdirectory (task folder), look for `task.md`
3. Parse `task.md` frontmatter and content
4. Optionally use `meta.json` for fast metadata access

## Example Task

```markdown
---
id: k7m2p9x4q1w8
title: Implement user authentication
type: feature
status: in-progress
priority: high
created: 2025-01-21
due: 2025-02-01
assignees:
  - jsmith
  - mjones
labels:
  - backend
  - security
  - sprint-1
parent: j3n5r8t2y6z0
blocks:
  - a1b2c3d4e5f6
  - g7h8i9j0k1l2
related:
  - m3n4o5p6q7r8
external:
  jira: AUTH-123
  github: myorg/myrepo#45
estimate: 3d
component: auth
---

# Implement user authentication

## Description

Implement JWT-based authentication for the API. Users should be able to:
- Register with email/password
- Login and receive a token
- Use token for authenticated requests

## Acceptance Criteria

- [ ] User registration endpoint works
- [ ] Login returns valid JWT
- [ ] Protected routes require valid token
- [ ] Token expiration is handled
- [x] Database schema designed

## Technical Notes

Using bcrypt for password hashing, jsonwebtoken for JWT.
Token expiry set to 24 hours with refresh token support.

## References

- [Auth design doc](../features/auth/README.md)
- [JWT best practices](https://example.com/jwt-guide)

## History

- 2025-01-21: Created by @jsmith
- 2025-01-22: Started implementation
- 2025-01-23: Database schema complete
```
