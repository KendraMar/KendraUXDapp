# .apollo Folder Specification

The `.apollo` folder is a structured metadata store for design-related context, history, decisions, tasks, and artifacts. It provides a standardized way to capture and share design knowledge that can be consumed by Apollo.

## Purpose

1. **Design History** - Chronological record of design decisions, discussions, and iterations
2. **Context Preservation** - Links to external sources (Figma, Google Docs, recordings, Jira)
3. **Relationship Mapping** - Connections between artifacts, stakeholders, and features
4. **Task Tracking** - Git-native, platform-agnostic task management
5. **Apollo Integration** - Structured data for display in Apollo's Prototypes viewer context sidebar

## Folder Structure

```
.apollo/
├── README.md                    # This file - specification overview
├── SCHEMA.md                    # Parsing schema for Apollo
├── config.yaml                  # Configuration for Apollo integration
├── context-sources.md           # External resources and references
├── decisions.md                 # Decision log (ADR-style)
├── history.md                   # Project-level design history
├── stakeholders.md              # People involved in design decisions
│
├── tasks/                       # Git-native task tracking
│   ├── README.md                # Task system documentation
│   ├── SCHEMA.md                # Task format specification
│   ├── index.md                 # Task overview/dashboard
│   ├── next-id.txt              # Next available task ID
│   ├── _templates/              # Task templates
│   ├── backlog/                 # Unprioritized tasks
│   ├── open/                    # Ready to work on
│   ├── in-progress/             # Currently being worked on
│   ├── done/                    # Completed tasks
│   └── archive/                 # Cancelled/obsolete tasks
│
├── features/                    # Feature-specific design work
│   └── {feature-name}/
│       ├── README.md            # Feature overview
│       ├── design-history.md    # Feature-specific history
│       └── {date}-{iteration}/  # Dated iteration folders
│
├── releases/                    # Release/version-specific design
│   └── {version}/
│
├── team/                        # Team-level context
│   ├── guidelines/              # Design guidelines
│   ├── research/                # UX research artifacts
│   ├── personas/                # User personas
│   └── context-sources.md       # Team resources
│
└── _templates/                  # Templates for new entries
    ├── feature.md
    ├── iteration.md
    ├── decision.md
    └── history-entry.md
```

## Key File Types

### history.md / design-history.md
Chronological entries of design events. Format:

```markdown
## History

2025-01-21
- Event title or summary
- Links: [Recording](url), [Notes](url)
- Summary: What happened and what was decided
- TASKS:
  - [ ] Follow-up action items
```

### context-sources.md
External resources organized by type:

```markdown
## Calendars
source: url
- description: What this calendar contains

## Slack
source: url
- title: Channel name
- description: Purpose

## Figma / Google Drive / Jira
(similar format)
```

### stakeholders.md
People involved using RACI format:

```markdown
## Product Management
Responsible: Name
Accountable: Name
Consulted: Name
Informed: Name

## Engineering
(similar format)
```

### decisions.md
Key decisions with context:

```markdown
## Decision: {Title}
**Date**: YYYY-MM-DD
**Status**: Proposed | Decided | Superseded
**Context**: Why this decision was needed
**Decision**: What was decided
**Consequences**: Impact and trade-offs
```

## Apollo Integration

The `.apollo` folder is designed to be consumed by Apollo's various features:

### Prototypes Viewer Context Sidebar
When viewing a prototype in Apollo, the context sidebar can display:
- Design history from `design-history.md`
- Related decisions from `decisions.md`
- Stakeholder information from `stakeholders.md`
- Links to external sources from `context-sources.md`

### AI Assistant Context
Apollo's AI assistant can use `.apollo` data to:
- Answer questions about design history
- Provide context for current design decisions
- Suggest related artifacts and discussions

### config.yaml
The `config.yaml` file controls how Apollo reads and displays `.apollo` data:

```yaml
apollo:
  version: 1
  project:
    name: "Project Name"
    description: "Brief description"
  features:
    history_panel: true
    context_sidebar: true
    ai_context: true
  sync:
    auto_update: false
    sources:
      - type: git_commits
      - type: jira
      - type: slack
```

## Best Practices

1. **Date everything** - Use ISO 8601 format (YYYY-MM-DD)
2. **Link liberally** - Include URLs to recordings, documents, and discussions
3. **Be specific** - Use clear titles and summaries
4. **Keep it current** - Update history as decisions are made
5. **Use templates** - Start from `_templates/` for consistency
6. **Organize by feature** - Put feature-specific content in `features/`

## Future Enhancements

- Automatic history updates from git commits
- AI-generated summaries from meeting recordings
- Bi-directional sync with Jira and other tools
- Relationship graph visualization in Apollo
- Team-wide sharing and permissions

---

**Maintained by**: Apollo Project
**Last Updated**: 2025-01-21
