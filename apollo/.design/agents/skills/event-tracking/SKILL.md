---
name: event-tracking
description: Track design events and update the appropriate design-history.md files in Apollo.
---

# Event Tracking

## When to Use

- After making significant UI/UX changes
- After design meetings or decisions
- When features are added, removed, or descoped
- When user feedback leads to design changes

## Process

1. **Identify the feature area**
   - Read `.design/feature-mapping.md`
   - Match the code path to a design feature
   - If no mapping exists, add one

2. **Determine the entry type**
   - `[Meeting]` — Stakeholder meetings, syncs, reviews
   - `[Decision]` — Significant design choices with rationale
   - `[Update]` — UI/UX changes to the design
   - `[Addition]` — New capabilities added
   - `[Removal]` — Features removed
   - `[Descoped]` — Features deferred or removed from plan
   - `[Feedback]` — User research or stakeholder input
   - `[Enhancement]` — Improvements to existing features
   - `[Bugfix]` — Design-related bug fixes
   - `[X-Integration]` — New or changed external service integration
   - `[X-Research]` — User research findings

3. **Write the entry**
   - Add to the top of the feature's `design-history.md` (newest first)
   - Use today's date in ISO 8601 format (YYYY-MM-DD)
   - Keep it to 1-2 sentences
   - Focus on the "why" and user impact, not implementation

4. **Update related files if needed**
   - Resolve questions in `design-questions.md` if applicable
   - Update `design-stakeholders.md` if team changes
   - Update `feature-mapping.md` for new code paths

## Entry Template

```markdown
## YYYY-MM-DD

### [Type] Brief description
- 1-2 sentences about the change and its design impact
```

## Example

```markdown
## 2026-02-07

### [Enhancement] Improved feed item cards
- Redesigned feed cards with clearer visual hierarchy and action buttons
- Better separation between read and unread items
```
