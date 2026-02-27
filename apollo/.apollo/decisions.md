# Decision Log

This file documents key design and architectural decisions made for Apollo.

---

## Decision Template

When adding a new decision, use this format:

```markdown
## DEC-XXX: {Title}

**Date**: YYYY-MM-DD
**Status**: Proposed | Decided | Implemented | Superseded
**Deciders**: Who made this decision

### Context
What is the issue that we're seeing that is motivating this decision?

### Decision
What is the change that we're proposing and/or doing?

### Consequences
What becomes easier or more difficult to do because of this change?

### Alternatives Considered
What other options were evaluated?
```

---

## Decisions

### DEC-001: .apollo Folder Structure

**Date**: 2025-01-21
**Status**: Implemented
**Deciders**: Project Team

#### Context
Apollo needs a standardized way to store and consume design metadata that can be shared across projects and displayed in the Prototypes viewer context sidebar.

#### Decision
Adopt a `.apollo` folder convention with a defined structure including:
- Root-level `config.yaml` for Apollo integration settings
- `history.md` for chronological design events
- `context-sources.md` for external resource links
- `stakeholders.md` for RACI-style team documentation
- `decisions.md` for this decision log
- `features/` subfolder for feature-specific design work
- `releases/` subfolder for version-specific content
- `team/` subfolder for team-level context
- `_templates/` subfolder for reusable templates

#### Consequences
- **Easier**: Consistent structure across all projects using Apollo
- **Easier**: AI assistant can reliably find and use design context
- **Easier**: Context sidebar knows where to look for information
- **Harder**: Requires discipline to maintain the structure
- **Harder**: Initial setup overhead for new projects

#### Alternatives Considered
1. **Single markdown file**: Too limiting for complex projects
2. **Database/JSON approach**: Less human-readable and editable
3. **No standard structure**: Makes Apollo integration unreliable

---

### DEC-002: YAML Configuration Over JSON

**Date**: 2025-01-21
**Status**: Implemented
**Deciders**: Project Team

#### Context
The `.apollo` folder needs a configuration file to control Apollo's behavior when consuming design metadata.

#### Decision
Use YAML (`config.yaml`) instead of JSON for the configuration file.

#### Consequences
- **Easier**: YAML supports comments for documentation
- **Easier**: More readable for human editors
- **Easier**: Better for nested configuration structures
- **Harder**: Requires YAML parser (most environments have this)

#### Alternatives Considered
1. **JSON**: Standard but no comments, less readable
2. **TOML**: Good but less widely known
3. **JavaScript/TypeScript config**: Too powerful, harder to parse safely

---

### DEC-003: Git-Native Task Tracking System

**Date**: 2025-01-21
**Status**: Implemented
**Deciders**: Project Team

#### Context
As Linus Torvalds (creator of Git) has observed, nearly every Git platform (GitHub, GitLab, Bitbucket, etc.) has created its own proprietary task/issue management system. This creates vendor lock-in and makes it difficult to migrate between platforms or work offline. There should be a standard, portable format for tracking tasks that lives alongside the code in the repository.

#### Decision
Implement a `tasks/` directory within `.apollo` that provides git-native task tracking:

- **One task per file** - Markdown files with YAML frontmatter
- **Status as directories** - `backlog/`, `open/`, `in-progress/`, `done/`, `archive/`
- **Portable format** - Can sync to/from external trackers via `external` field
- **Human-readable** - Easy to edit in any text editor
- **Git-friendly** - Works offline, can branch/merge tasks with code
- **Standardized schema** - Documented in `SCHEMA.md` for tool compatibility

Task file structure:
```yaml
---
id: TASK-001
title: Task title
type: task | bug | feature | epic
status: open | in-progress | done
priority: critical | high | medium | low
created: 2025-01-21
assignees: []
labels: []
external:
  jira: PROJ-123
  github: org/repo#456
---
# Markdown description and acceptance criteria
```

#### Consequences
- **Easier**: Tasks version-controlled with code
- **Easier**: Works offline without any external service
- **Easier**: Tasks can be branched, reviewed, and merged like code
- **Easier**: Full history of task changes in git log
- **Easier**: Portable between Git platforms
- **Harder**: No real-time collaboration (requires commits)
- **Harder**: No built-in notifications (would need external tooling)
- **Harder**: Merge conflicts possible when multiple people edit tasks

#### Alternatives Considered
1. **GitHub Issues only**: Vendor lock-in, no offline access
2. **Jira integration only**: Heavy, expensive, external dependency
3. **Database in repo**: Not human-readable, complex to manage
4. **No task tracking**: Forces use of external tools
