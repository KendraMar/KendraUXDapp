---
id: 56f4fd7a85b8
title: Integrate resizable panel layout
type: task
status: backlog
priority: medium
created: 2025-01-30T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - code-editor
  - layout
  - ui
  - apollo
parent: j7n4x9m2k5p8
blocks: []
blocked_by:
  - a39f8f7ebe14
  - b0449c9bec6d
  - 784c281ada5c
related:
  - ff03058a62ec
external: {}
estimate: null
component: code
starred: false
flag: null
---

# Integrate resizable panel layout

## Description

Create a flexible, resizable panel layout system for the code editor that allows users to resize the chat panel, explorer, editor, and terminal panels by dragging borders between them.

The layout should:
- Persist panel sizes across sessions (localStorage)
- Support minimum/maximum panel sizes
- Handle panel collapse/expand
- Resize smoothly without performance issues

## Target Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Header Bar                                                            │
├─────────────┬──────────────┬─────────────────────────────────────────┤
│             │              │                                          │
│    Chat     │   Explorer   │           Editor/Preview                 │
│   Panel     │    Panel     │              Panel                       │
│             │              │                                          │
│   (width    │   (width     │           (flex: 1)                     │
│   resizable)│   resizable) │                                          │
│             │              ├──────────────────────────────────────────┤
│             │              │         Terminal Panel                   │
│             │              │        (height resizable)                │
├─────────────┴──────────────┴──────────────────────────────────────────┤
│ Status Bar                                                            │
└──────────────────────────────────────────────────────────────────────┘
```

## Acceptance Criteria

- [ ] Horizontal resize between Chat and Explorer panels
- [ ] Horizontal resize between Explorer and Editor panels
- [ ] Vertical resize between Editor and Terminal panels
- [ ] Drag handles with proper cursor indication
- [ ] Minimum panel widths/heights enforced
- [ ] Panel sizes saved to localStorage
- [ ] Panel sizes restored on page load
- [ ] Collapse buttons for each panel
- [ ] Smooth resize without jank
- [ ] Monaco editor resizes properly when panels change

## Technical Approach

### Option 1: react-split-pane
```javascript
import SplitPane from 'react-split-pane';

<SplitPane split="vertical" minSize={200} defaultSize={300}>
  <ChatPanel />
  <SplitPane split="vertical" minSize={200} defaultSize={250}>
    <ExplorerPanel />
    <SplitPane split="horizontal" minSize={100}>
      <EditorPanel />
      <TerminalPanel />
    </SplitPane>
  </SplitPane>
</SplitPane>
```

### Option 2: Custom implementation
- Use CSS resize handles
- Track mouse drag events
- Update panel widths with state
- Use requestAnimationFrame for smooth updates

### Persistence
```javascript
// Save
localStorage.setItem('codePanelSizes', JSON.stringify({
  chat: chatWidth,
  explorer: explorerWidth,
  terminal: terminalHeight
}));

// Restore
const savedSizes = JSON.parse(localStorage.getItem('codePanelSizes'));
```

## Panel Behaviors

| Panel | Default Size | Min | Max | Can Collapse |
|-------|-------------|-----|-----|--------------|
| Chat | 280px | 200px | 500px | Yes |
| Explorer | 250px | 150px | 400px | Yes |
| Editor | flex: 1 | 300px | - | No |
| Terminal | 200px | 100px | 50% | Yes |

## Notes

- Test resize performance with large files in editor
- Monaco editor has `automaticLayout: true` but may need manual trigger
- Consider debouncing resize events for localStorage saves
- Handle window resize events to recalculate proportions

## History

- 2025-01-30: Created as subtask of j7n4x9m2k5p8
- 2026-01-30: Assigned unique ID 56f4fd7a85b8
