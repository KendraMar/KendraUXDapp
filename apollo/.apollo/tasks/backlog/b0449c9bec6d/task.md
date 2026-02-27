---
id: b0449c9bec6d
title: Add AI Chat Panel component
type: task
status: backlog
priority: high
created: 2025-01-30T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - code-editor
  - ai
  - feature
  - apollo
parent: j7n4x9m2k5p8
blocks:
  - ff03058a62ec
blocked_by: []
related:
  - a39f8f7ebe14
  - 784c281ada5c
  - 56f4fd7a85b8
external: {}
estimate: null
component: code
starred: false
flag: null
---

# Add AI Chat Panel component

## Description

Add an AI chat panel to the left side of the code editor, positioned to the left of the file explorer. This panel should function similarly to Cursor's AI panel, providing an integrated chat interface for AI assistance while coding.

The chat should:
- Connect to local AI models (Ollama/ramalama)
- Be context-aware of the current repository and active file
- Allow users to ask questions and get AI responses
- Support file editing operations triggered by AI responses

## Acceptance Criteria

- [ ] Chat panel positioned to the left of the explorer
- [ ] Collapsible/resizable panel
- [ ] Text input area at the bottom for prompts
- [ ] Message history with user/assistant distinction
- [ ] Connects to existing `/api/ai` endpoints
- [ ] Passes current file path and content as context
- [ ] Loading states while waiting for AI response
- [ ] Markdown rendering in AI responses
- [ ] Code blocks in responses are properly formatted
- [ ] "Apply" button for code suggestions that edits the active file

## Technical Approach

1. Create `ChatPanel.js` component in `src/pages/components/`
2. Consider reusing components from existing `Chat.js` page
3. Use PatternFly Chatbot components for message display
4. Integrate with existing AI service endpoints
5. Add context payload structure:
   ```javascript
   {
     prompt: "user message",
     context: {
       repository: projectName,
       filePath: activeFile,
       fileContent: fileContents[activeFile],
       language: getLanguageFromPath(activeFile)
     }
   }
   ```

## UI Layout

```
┌─────────────────┐
│  Chat Header    │
├─────────────────┤
│                 │
│  Message        │
│  History        │
│  (scrollable)   │
│                 │
├─────────────────┤
│ 🎤 [Input...]   │
│ [Send]          │
└─────────────────┘
```

## Notes

- Consider lazy loading the chat panel to reduce initial bundle size
- Messages should persist during the session
- Option to clear chat history
- Model selector dropdown (if multiple models available)

## History

- 2025-01-30: Created as subtask of j7n4x9m2k5p8
- 2026-01-30: Assigned unique ID b0449c9bec6d
