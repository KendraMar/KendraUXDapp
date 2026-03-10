# .apollo Schema Reference

This document defines the expected structure and format for files in the `.apollo` folder, enabling Apollo to reliably parse and display the content.

---

## File Formats

All text content uses **Markdown** format with specific conventions for each file type.

Configuration uses **YAML** format.

---

## config.yaml

```yaml
# Required fields
apollo:
  version: 1  # Schema version
  project:
    name: string        # Project name
    description: string # Brief description

# Optional fields
apollo:
  project:
    repository: string  # Git repository URL
  
  features:
    history_panel: boolean      # Default: true
    context_sidebar: boolean    # Default: true
    ai_context: boolean         # Default: true
    stakeholders_panel: boolean # Default: true
    decisions_panel: boolean    # Default: true
  
  panels:
    history:
      title: string           # Default: "Design History"
      max_entries: number     # Default: 50
      date_format: string     # "relative" | "absolute" | "both"
    context:
      title: string           # Default: "Context & Sources"
      group_by: string        # "type" | "date" | "none"
    decisions:
      title: string           # Default: "Decisions"
      show_status: boolean    # Default: true
    stakeholders:
      title: string           # Default: "Stakeholders"
      show_raci: boolean      # Default: true
  
  sync:
    enabled: boolean
    auto_update: boolean
    sources: array  # See sync sources schema

  relationships:
    auto_detect: boolean
    types: array    # Relationship type strings

prototypes:
  patterns: array   # Glob patterns for prototype files
  feature_mapping:  # Map of feature name to file path
    feature_name: string

export:
  formats: array    # ["markdown", "json"]
  include_history: boolean
  include_sources: boolean
  include_stakeholders: boolean
```

---

## history.md / design-history.md

```markdown
# {Title}

Optional description paragraph.

---

## History

### YYYY-MM-DD
- **Event title** (bold)
- Context or additional information
- Links: [Label](url)
- Summary: Text description
- TASKS:
  - [ ] Uncompleted task
  - [x] Completed task
```

### Parsing Rules

1. Look for `## History` heading
2. Parse `### YYYY-MM-DD` as date entries (descending order)
3. Parse bullet points as entry content
4. Detect `TASKS:` section for task items
5. Parse checkbox syntax `- [ ]` and `- [x]`

---

## context-sources.md

```markdown
# {Title}

## {Category}

source: {url or path}
- title: {string}
- description: {string}
- type: {optional: slack | figma | gdrive | jira | repository | documentation}
- last_updated: {optional: YYYY-MM-DD}
```

### Parsing Rules

1. Parse `## {Category}` as section headers
2. For each `source:` line:
   - Extract URL/path after `source:`
   - Parse following `- key: value` lines as metadata
   - Continue until next `source:` or section

### Supported Types

- `slack` - Slack channels
- `figma` - Figma files/projects
- `gdrive` - Google Drive documents
- `jira` - Jira projects/issues
- `repository` - Git repositories
- `documentation` - Documentation sites
- `calendar` - Calendar feeds
- `recording` - Meeting recordings

---

## stakeholders.md

```markdown
# Stakeholders

## {Group Name}

### {Role Name}
{RACI Level}: {Person Name}
{RACI Level}: {Person Name}
```

### RACI Levels

- `Responsible` - Does the work
- `Accountable` - Makes final decisions
- `Consulted` - Provides input
- `Informed` - Kept updated

### Parsing Rules

1. Parse `## {Group}` as stakeholder groups
2. Parse `### {Role}` as roles within groups (optional)
3. Parse `{RACI}: {Name}` lines for assignments

---

## decisions.md

```markdown
## DEC-{number}: {Title}

**Date**: YYYY-MM-DD
**Status**: Proposed | Decided | Implemented | Superseded | Deprecated
**Deciders**: {names}

### Context
{paragraph}

### Decision
{paragraph}

### Consequences
{paragraph}

### Alternatives Considered
{optional paragraph or list}
```

### Parsing Rules

1. Parse `## DEC-{id}: {Title}` as decision headers
2. Extract metadata from `**Key**: Value` lines
3. Parse `### {Section}` for decision content
4. Link decisions by ID references

---

## Feature README

```markdown
# {Feature Name}

## Overview
{paragraph}

## Status
**Current Phase**: {Discovery | Design | Development | Released}
**Target Release**: {version}
**Priority**: {Critical | High | Medium | Low}

## Goals
1. {goal}

## Non-Goals
{paragraph or list}

## User Stories
As a {user}, I want to {action}, so that {benefit}.

## Success Metrics
- {metric}

## Design Artifacts
- {type}: [{label}]({url})

## Technical Approach
{paragraph}

## Open Questions
- [ ] {question}

## Related
- {relationship}: [{label}]({url})
```

### Parsing Rules

1. Parse `## {Section}` headings
2. Extract status metadata from `**Key**: {Value}` format
3. Parse checkbox items for open questions
4. Parse link syntax for artifacts and related items

---

## Relationships

Relationships can be defined inline or in a dedicated file.

### Inline Format

```markdown
- Implements: [Feature Name](path)
- References: [Document](url)
- Supersedes: [DEC-001](decisions.md#dec-001)
- Related to: [Other Feature](path)
```

### Relationship Types

| Type | Direction | Meaning |
|------|-----------|---------|
| `implements` | A → B | A implements the design in B |
| `references` | A → B | A links to or cites B |
| `supersedes` | A → B | A replaces B |
| `relates_to` | A ↔ B | A and B are related |
| `blocks` | A → B | A must complete before B |
| `child_of` | A → B | A is a sub-item of B |

---

## Date Formats

All dates should use ISO 8601 format:

- Full date: `YYYY-MM-DD` (e.g., `2025-01-21`)
- Date with time: `YYYY-MM-DDTHH:MM:SS` (e.g., `2025-01-21T14:30:00`)

---

## Path Conventions

- Use forward slashes for paths: `features/context-sidebar/`
- Relative paths from `.apollo` folder: `../src/pages/`
- External URLs: Full URL with protocol

---

## Extending the Schema

When adding new file types or fields:

1. Document the format in this schema
2. Update `config.yaml` if configuration is needed
3. Add a template to `_templates/`
4. Update Apollo parsing code to handle new format
