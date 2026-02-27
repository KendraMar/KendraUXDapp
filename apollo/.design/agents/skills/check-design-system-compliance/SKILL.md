---
name: check-design-system-compliance
description: Reviews a page or component to verify PatternFly 6 design system compliance in Apollo.
---

# Check Design System Compliance

## When to Use

- Verifying a new page or component follows PatternFly 6 standards
- Checking component usage in specific files
- Ensuring consistency across Apollo's UI

## Inputs

Provide a file or directory path to check.

## Context

Apollo uses PatternFly 6 as its design system:
- Components from `@patternfly/react-core`
- Icons from `@patternfly/react-icons`
- AI/chat components from `@patternfly/chatbot`
- Design tokens for spacing, colors, and typography

## Checklist

**Components**
- [ ] Using PatternFly components instead of custom implementations
- [ ] Components used for their intended purpose
- [ ] Not reinventing something PatternFly provides
- [ ] PatternFly Chatbot used for AI/chat interfaces

**Visual Consistency**
- [ ] Using PatternFly design tokens for colors
- [ ] Using PatternFly spacing variables
- [ ] Typography follows PatternFly scale

**Configuration**
- [ ] Component variants set properly
- [ ] No custom CSS overriding PatternFly component styles
- [ ] Accessibility features not removed or overridden

**Layout**
- [ ] Using PatternFly layout components (PageSection, Gallery, Grid, etc.)
- [ ] Responsive breakpoints handled via PatternFly

## Output Format

1. **Summary** — Overall compliance status
2. **Issues Found** — What, where, why, the PatternFly way, priority
3. **Recommendations** — Components to use instead, better patterns
