---
id: 784c281ada5c
title: Add Terminal Panel component
type: task
status: backlog
priority: high
created: 2025-01-30T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - code-editor
  - terminal
  - feature
  - apollo
parent: j7n4x9m2k5p8
blocks:
  - 56f4fd7a85b8
blocked_by: []
related:
  - a39f8f7ebe14
  - b0449c9bec6d
  - ff03058a62ec
external: {}
estimate: null
component: code
starred: false
flag: null
---

# Add Terminal Panel component

## Description

Add an integrated terminal panel at the bottom of the code editor, similar to VS Code's integrated terminal. This allows developers to run commands without leaving the editor context.

The terminal should support:
- Multiple terminal sessions with tabs
- Standard terminal functionality (input, output, ANSI colors)
- Resizable panel height
- Session persistence during the editing session

## Acceptance Criteria

- [ ] Terminal panel at bottom of editor
- [ ] Uses xterm.js for terminal emulation
- [ ] WebSocket connection for PTY backend
- [ ] Tab interface for multiple terminals
- [ ] "+" button to create new terminal
- [ ] "x" button to close terminal tab
- [ ] Resizable panel height (drag border)
- [ ] Toggleable panel (show/hide with button or keyboard)
- [ ] Proper ANSI color rendering
- [ ] Working directory set to project root
- [ ] Basic terminal commands work (ls, cd, npm, etc.)

## Technical Approach

### Frontend
1. Create `TerminalPanel.js` component
2. Use xterm.js with addons:
   - @xterm/xterm (core)
   - @xterm/addon-fit (auto-resize)
   - @xterm/addon-web-links (clickable URLs)
3. WebSocket connection per terminal session
4. Tab state management for multiple terminals

### Backend
1. New route: `server/routes/terminal.js`
2. WebSocket upgrade handler
3. Use node-pty for pseudo-terminal
4. Session management (create, destroy, list)

### Terminal Session API
```
WS /api/terminal/session/:id
  - Connect to terminal session
  - Bidirectional: input from client, output from PTY
  
POST /api/terminal/sessions
  - Create new terminal session
  
DELETE /api/terminal/sessions/:id
  - Destroy terminal session
```

### xterm.js Setup
```javascript
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';

const terminal = new Terminal({
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    // ... VS Code dark theme colors
  }
});

const fitAddon = new FitAddon();
terminal.loadAddon(fitAddon);
terminal.open(containerRef.current);
fitAddon.fit();
```

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│ [bash ×] [node ×] [+]                    [↕] [−] [□]   │
├─────────────────────────────────────────────────────────┤
│ user@machine:~/project$ npm run dev                     │
│ > project@1.0.0 dev                                     │
│ > webpack serve                                         │
│ ...                                                     │
│ █                                                       │
└─────────────────────────────────────────────────────────┘
```

## Dependencies

- @xterm/xterm
- @xterm/addon-fit
- @xterm/addon-web-links
- node-pty (server)
- ws (WebSocket, or use existing socket.io)

## Notes

- Terminal should resize properly when panel is resized
- Consider keyboard shortcuts (Ctrl+` to toggle)
- Copy/paste should work naturally
- Handle terminal close gracefully (cleanup PTY process)

## History

- 2025-01-30: Created as subtask of j7n4x9m2k5p8
- 2026-01-30: Assigned unique ID 784c281ada5c
