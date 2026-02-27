---
id: a39f8f7ebe14
title: Refactor Explorer to VS Code-like tree
type: task
status: backlog
priority: high
created: 2025-01-30T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - code-editor
  - ui
  - apollo
parent: j7n4x9m2k5p8
blocks: []
blocked_by: []
related:
  - b0449c9bec6d
  - ff03058a62ec
  - 784c281ada5c
  - 56f4fd7a85b8
external: {}
estimate: null
component: code
starred: false
flag: null
---

# Refactor Explorer to VS Code-like tree

## Description

The current file explorer in `CodeDetail.js` uses PatternFly's TreeView component which renders with excessive vertical spacing and doesn't match the compact, efficient layout of VS Code's file explorer.

This task refactors the explorer panel to closely match VS Code's appearance:
- Compact row height (~22px)
- Chevron icons for expand/collapse (not folder icons that change)
- File-type specific icons
- Proper indent guides
- Hover states with subtle background

## Current State

The explorer currently uses:
```javascript
<TreeView
  data={fileTree}
  onSelect={handleTreeSelect}
  hasGuides
  variant="compact"
/>
```

This results in:
- Rows that are too tall
- Folder icons that switch between open/closed states
- Spacing that doesn't match VS Code

## Acceptance Criteria

- [ ] Row height matches VS Code (~22px per row)
- [ ] Chevron icons (▶/▼) for folder expand/collapse
- [ ] Folder icon remains static (doesn't change when expanded)
- [ ] File icons based on file extension (JS, TS, JSON, MD, etc.)
- [ ] Hover state with subtle background highlight
- [ ] Proper indent guides for nested items
- [ ] Click on chevron toggles expand, click on name opens folder or file
- [ ] Active file has distinct background color
- [ ] Smooth expand/collapse animation (optional)

## Technical Approach

1. Create custom `FileTree.js` component to replace TreeView
2. Use recursive rendering for nested structure
3. CSS styles to match VS Code:
   ```css
   .file-tree-item {
     height: 22px;
     padding-left: calc(var(--depth) * 16px);
     display: flex;
     align-items: center;
   }
   ```
4. Use `@patternfly/react-icons` or custom SVG icons for file types
5. Consider using react-window for virtualization if tree is large

## Notes

Reference VS Code's file explorer for exact styling. The goal is that a user familiar with VS Code feels immediately at home.

## History

- 2025-01-30: Created as subtask of j7n4x9m2k5p8
- 2026-01-30: Assigned unique ID a39f8f7ebe14
