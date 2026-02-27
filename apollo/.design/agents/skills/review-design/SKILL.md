---
name: review-design
description: Comprehensive design review covering usability, visual design, accessibility, and PatternFly compliance for Apollo.
---

# Review Design

## When to Use

- Before sharing a prototype or feature with stakeholders
- When you want a fresh perspective on a UI implementation
- To catch usability or accessibility issues early

## Inputs

Provide a file or directory path to review.

## Context

Before reviewing, read:
1. `.design/feature-mapping.md` to identify the feature area
2. The feature's `design-history.md` for recent decisions and context
3. The feature's `design-questions.md` for known open questions

## What Gets Reviewed

### User Experience
- Is it intuitive? Can users figure out what to do?
- Is the hierarchy clear? Do important things stand out?
- Are interactions obvious? Do controls look interactive?
- Does it handle empty states and errors well?

### Visual Design
- Is spacing consistent with PatternFly design tokens?
- Is the typography hierarchy clear?
- Are colors used meaningfully and consistently?

### Accessibility
- Can everyone use it with keyboard and screen readers?
- Is contrast sufficient (WCAG 2.1 AA)?
- Are interactive elements clearly identifiable?
- Are ARIA labels and roles properly used?

### PatternFly Compliance
- Are PatternFly 6 components used correctly?
- Are custom components avoided when PatternFly provides alternatives?
- Is it consistent with the rest of Apollo's UI?

## Output Format

1. **Overall Assessment** — Good / Concerns / Verdict
2. **Detailed Feedback** — What, where, why, how to fix, priority
3. **Recommendations** — Fix now / Fix soon / Consider later
4. **Design History Update** — Suggest entry for `design-history.md` if changes are made
