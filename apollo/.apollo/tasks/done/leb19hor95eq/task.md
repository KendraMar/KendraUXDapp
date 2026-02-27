---
id: leb19hor95eq
title: Implement the Claude Code integration
type: task
status: done
priority: medium
created: '2025-01-21'
due: null
assignees: []
labels:
  - ai
  - integration
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: apollo
starred: false
flag: null
---
# Implement the Claude Code integration

## Description

Flesh out the integration with Claude Code. From the masthead search/task bar I should be able to send a message to a Claude Code agent, with the current page that's on my screen provided as context, and give it tasks. The message that appears in the chat panel that appears should also stream in from Claude Code. Claude Code agent should also be available from the Chat page as an option in the models dropdown, and all conversations with Claude Code through Apollo should be recorded and saved within the data/chats folder as subfolders, probably in a JSON file within it, so that we can have a record of previous conversations with that agent to display in the Chat page as well.

## Research Questions

- [x] How does Claude Code expose local functionality? - Uses Anthropic API directly
- [x] What authentication/authorization is needed? - Anthropic API key in config
- [x] Can it work alongside existing Ollama/ramalama setup? - Yes, implemented as separate model provider

## Acceptance Criteria

- [x] Document findings on Claude Code local connectivity
- [x] Masthead search/task bar can send messages to Claude Code agent
- [x] Current page context is provided to Claude Code
- [x] Chat panel displays streaming responses from Claude Code
- [x] Claude Code available as option in Chat page models dropdown
- [x] Conversations saved to data/chats folder as JSON
- [x] Previous conversations displayed in Chat page

## Technical Notes

This task incorporates the research/investigation phase to understand Claude Code's local execution model and integration points with Apollo before implementing the full integration.

### Implementation Details

- Created `server/routes/claudecode.js` with full Anthropic API integration
- Added streaming support via SSE for real-time response display
- Claude Code appears as an agent in the masthead assistant dropdown
- Chat page model selector includes Claude Code models (Sonnet 4, 3.7 Sonnet, 3.5 Sonnet, 3.5 Haiku, Opus)
- Conversations are saved to `data/chats/{conversationId}/chat.json`
- API provides endpoints for listing and retrieving past conversations

### Configuration

Add to `data/config.json`:
```json
{
  "claudeCode": {
    "apiKey": "your-anthropic-api-key-here",
    "model": "claude-sonnet-4-20250514"
  }
}
```

## References

- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference/messages)

## History

- 2025-01-21: Created - migrated from docs/TASKS.md (originally spike task o6ry98jxw194)
- 2026-01-25: Merged with implementation task, added specific requirements
- 2026-01-26: Implemented Claude Code integration with Anthropic API
