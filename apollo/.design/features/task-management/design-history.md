# Design History

## 2026-02-07

### [Addition] Task management UI
- Tasks page displays and manages items from the git-native task system in `.apollo/tasks/`
- Supports status directories (backlog, open, in-progress, done, archive)

### [Decision] Git-native task tracking
- Tasks stored as markdown files with YAML frontmatter, organized by status directories
- Portable, works offline, and versions with the code
- See `.apollo/decisions.md` DEC-003 for full rationale
