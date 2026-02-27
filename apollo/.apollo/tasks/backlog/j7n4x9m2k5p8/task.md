---
id: j7n4x9m2k5p8
title: Code Editor IDE Enhancement - VS Code-like Layout
type: epic
status: backlog
priority: high
created: 2025-01-30T00:00:00.000Z
due: null
assignees: []
labels:
  - epic
  - frontend
  - code-editor
  - feature
  - apollo
parent: null
children:
  - a39f8f7ebe14
  - b0449c9bec6d
  - ff03058a62ec
  - 784c281ada5c
  - 56f4fd7a85b8
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: code
starred: false
flag: null
---

# Code Editor IDE Enhancement - VS Code-like Layout

## Overview

Enhance the Apollo Code Editor (`CodeDetail.js`) to provide a complete IDE-like experience similar to VS Code and Cursor. The current implementation has a basic editor with file explorer, but needs significant improvements to match modern IDE patterns including a proper file tree, AI chat panel, and integrated terminal.

## Goals

1. Create a VS Code-like file explorer with proper collapsible folders and compact layout
2. Add an AI chat panel for local model integration with voice input support
3. Implement an integrated terminal panel with multi-session support
4. Maintain the existing preview/editor functionality on the right side

## Target Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Header Bar                                                            │
├────────────┬─────────────────────────────────────────┬───────────────┤
│            │                                         │               │
│   Chat     │         Explorer                        │    Editor/    │
│   Panel    │       (File Tree)                       │    Preview    │
│            │                                         │               │
│  - AI Chat │  - Collapsible folders                 │  - Monaco     │
│  - Voice   │  - VS Code-like compact                │  - Tab bar    │
│  - Models  │  - File icons                          │  - Minimap    │
│            │                                         │               │
│            ├─────────────────────────────────────────┴───────────────┤
│            │                    Terminal Panel                       │
│            │  - Multiple sessions  - Tabs  - Resizable               │
├────────────┴─────────────────────────────────────────────────────────┤
│ Status Bar                                                            │
└──────────────────────────────────────────────────────────────────────┘
```

## User Stories

1. As a **developer**, I want **a compact file explorer like VS Code**, so that **I can quickly navigate large codebases without excessive vertical scrolling**
2. As a **developer**, I want **an AI chat panel integrated into the editor**, so that **I can get AI assistance while coding without switching contexts**
3. As a **developer**, I want **to use voice input for AI prompts**, so that **I can interact naturally without typing**
4. As a **developer**, I want **an integrated terminal**, so that **I can run commands without leaving the editor**
5. As a **developer**, I want **multiple terminal sessions with tabs**, so that **I can manage different processes simultaneously**

## Child Tasks

| ID | Title | Status | Priority |
|----|-------|--------|----------|
| a39f8f7ebe14 | Refactor Explorer to VS Code-like tree | backlog | high |
| b0449c9bec6d | Add AI Chat Panel component | backlog | high |
| ff03058a62ec | Implement voice recording with local LLM | backlog | medium |
| 784c281ada5c | Add Terminal Panel component | backlog | high |
| 56f4fd7a85b8 | Integrate resizable panel layout | backlog | medium |

## Scope

### In Scope

- **Explorer Panel Improvements**
  - Compact, VS Code-like file tree layout
  - Proper folder expand/collapse icons (chevrons)
  - File-type specific icons
  - Reduced vertical spacing to match VS Code density
  - Indent guides for nested items
  
- **AI Chat Panel (left of Explorer)**
  - Chat interface similar to Cursor's AI panel
  - Connect to local models (Ollama/ramalama)
  - Optionally embed existing Chat page component
  - Context-aware: knows current repo and active file
  - Submit prompts and receive AI responses
  - Responses can trigger file edits in the explorer
  
- **Voice Input Feature**
  - Microphone button for voice recording
  - Local LLM processing of audio to text
  - Populate text box with transcribed voice input
  - Submit voice-generated prompts

- **Terminal Panel (bottom)**
  - Integrated terminal at bottom of editor
  - Multiple terminal sessions
  - Tab interface for switching between terminals
  - Resizable/movable panel
  - Standard terminal features (input, output, ANSI colors)

### Out of Scope

- Remote/cloud model integration (local only for now)
- Git integration in explorer
- Search panel
- Extensions system

## Technical Approach

### Explorer Refactor
- Replace PatternFly TreeView with custom VS Code-style tree
- Use CSS Grid or Flexbox for compact layout
- Add chevron icons for folder expand/collapse
- Reduce row height to ~22px (VS Code standard)
- Add indent guides with proper CSS

### Chat Panel
- Create `ChatPanel.js` component
- Consider reusing/embedding parts of existing `Chat.js` page
- Use PatternFly Chatbot components
- Connect to `/api/ai` endpoints for model communication
- Pass current file context with each request

### Voice Input
- Use Web Audio API for microphone access
- Send audio to local Whisper model via backend
- Display transcription in chat input
- Add recording indicator UI

### Terminal Panel
- Use xterm.js for terminal emulation
- Create WebSocket connection for PTY backend
- Add new backend endpoint for terminal sessions
- Implement tab interface for multiple terminals
- Add resize handles using CSS resize or a library like react-split

### Layout System
- Use react-split-pane or similar for resizable panels
- Store panel sizes in localStorage
- Support dragging panels to reorder (stretch goal)

## Dependencies

- xterm.js (terminal emulation)
- node-pty (server-side PTY)
- @xterm/xterm, @xterm/addon-fit, @xterm/addon-web-links
- Web Audio API (built-in)
- react-split-pane or similar

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| WebSocket terminal complexity | Medium | High | Start with single terminal, add multi-session later |
| Voice transcription latency | Medium | Medium | Use local Whisper model, show loading states |
| Panel resize performance | Low | Medium | Use virtualized rendering for file tree |

## Success Metrics

- File explorer matches VS Code visual density
- Chat panel provides useful AI assistance during coding
- Terminal supports basic shell operations
- Voice input correctly transcribes speech
- All panels resize smoothly without layout bugs

## References

- Current implementation: `src/pages/CodeDetail.js`
- Existing Chat page: `src/pages/Chat.js`
- AI backend: `server/lib/ai.js`
- VS Code UI reference: https://code.visualstudio.com/
- Cursor UI reference: https://cursor.sh/
- xterm.js docs: https://xtermjs.org/

## History

- 2025-01-30: Epic created - comprehensive code editor IDE enhancement
- 2026-01-30: Child tasks migrated to unique IDs (a39f8f7ebe14, b0449c9bec6d, ff03058a62ec, 784c281ada5c, 56f4fd7a85b8)
