# Design Guidelines for AI Agents

## Design History Updates

**When updating `.design/features/*/design-history.md`, be concise.**

- 1-2 sentences per entry maximum
- Focus on the user-facing change, not implementation details
- No technical specifics (API fields, component names, CSS)
- Group related changes into single entries
- Skip rationale unless the decision is non-obvious

### Good

```markdown
### [Enhancement] Search with filters
- Added filter panel with date, category, and status filters
```

### Too detailed

```markdown
### [Enhancement] Enhanced Search with Multiple Filter Types
- Added FilterPanel component with three filter categories:
  - Date filter with calendar picker using DatePicker component
  - Category filter with dropdown from backend API
  - Status filter with radio buttons for active/inactive/all
- Filter state managed with React hooks and URL query parameters
```

## Finding the Right Feature

Before updating design history:
1. Check `.design/feature-mapping.md` to find which feature the code path maps to
2. Update the corresponding feature's `design-history.md`
3. If no mapping exists, add one to `feature-mapping.md`

## Design System

Apollo uses **PatternFly 6** for all UI components:
- Use PatternFly components as-is — don't create custom components when PatternFly provides them
- Don't add custom styling on top of PatternFly components
- Use PatternFly design tokens for any custom styling needed
- Use PatternFly Chatbot components for AI/chat interfaces

## Accessibility

- WCAG 2.1 AA: 4.5:1 contrast for text, 3:1 for large text
- Keyboard navigation for all interactive elements
- Proper ARIA labels and roles
- Visible focus indicators

## When to Update Design History

**Do add entries for:** Major UI changes, design decisions with rationale, features added/removed/descoped, new user flows, new integrations.

**Don't add entries for:** Code refactoring, bug fixes unrelated to design, linting, test updates, dependency updates.

## Design Questions

When you encounter an unresolved design question during implementation:
1. Check if it's already in the feature's `design-questions.md`
2. If not, add it to the `## Open` section with a `Raised` date
3. When a question is resolved, move it to `## Resolved` with an `Answer` and `Resolved` date
