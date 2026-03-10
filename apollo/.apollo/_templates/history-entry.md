# History Entry Template

Use this template when adding entries to `history.md` or `design-history.md` files.

---

## Standard Entry Format

```markdown
### YYYY-MM-DD
- **Title of event or change**
- Context: Brief explanation of why this happened
- Links: [Recording](url), [Notes](url), [Jira](url)
- Summary: What was decided or implemented
- TASKS:
  - [ ] Follow-up action 1
  - [ ] Follow-up action 2
```

---

## Entry Types

### Meeting Entry

```markdown
### 2025-01-21
- **Title: Meeting Name**
- [Recording](url)
- [Chat transcript](url)
- [AI Notes](url)
- Summary: Key discussion points and outcomes
- Attendees: Name1, Name2
- TASKS:
  - [ ] @name to do thing by date
```

### Implementation Entry

```markdown
### 2025-01-21
- **Implemented: Feature Name**
- Branch: `feature-branch`
- PR: [#123](url)
- Summary: What was built and why
- Files changed:
  - `path/to/file.js` - description
```

### Decision Entry

```markdown
### 2025-01-21
- **Decision: Topic**
- See [DEC-XXX](../decisions.md#dec-xxx-title) for full details
- Summary: Brief summary of what was decided
- Impact: Who/what is affected
```

### Prototype Update Entry

```markdown
### 2025-01-21
- **Prototype Updates**
- Based on: [Meeting](url) or feedback from [Source]
- Changes:
  - [x] Change 1 - completed
  - [x] Change 2 - completed
  - [ ] Change 3 - pending
```

### Research Entry

```markdown
### 2025-01-21
- **Research: Study Name**
- [Full Report](url)
- [Recordings](url)
- Key Findings:
  1. Finding 1
  2. Finding 2
- Recommendations:
  - Recommendation 1
```

---

## Best Practices

1. **Be specific** - Include enough detail that someone unfamiliar can understand
2. **Link everything** - Always include URLs to recordings, documents, Jira tickets
3. **Use checkboxes for tasks** - Makes follow-ups trackable
4. **Attribute actions** - Use @mentions for assigned tasks
5. **Most recent first** - New entries at the top of the History section
