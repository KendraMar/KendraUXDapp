---
id: 4f43af5fb2b1
title: 'Feed: Suggested Tasks & Today''s Docket'
type: feature
status: backlog
priority: high
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - feed
  - tasks
  - ai
  - reveal-script
  - apollo
parent: null
blocks: []
blocked_by: []
related:
  - ezlh5yu3ym9m
external: {}
estimate: null
component: Feed
sprint: null
starred: false
flag: null
---

# Feed: Suggested Tasks & Today's Docket

## Description

Implement the "Task Triage" functionality from the Apollo Reveal Script (Scene 1.2). The Feed page should include a suggested tasks section that aggregates potential tasks from various sources and allows quick triage.

Currently, the Feed page shows messages from Slack, Jira, and email with AI summarization. However, it lacks the ability to surface and manage suggested tasks as described in the reveal script:

> "Here are tasks suggested for today. Some came from Jira, some were extracted from discussions, some are follow-ups the AI identified. I can quickly triage — yes, no, later."

## Features to Implement

### Suggested Tasks Section
- Display task suggestions with clear source attribution (meeting, Slack, Jira, AI extraction)
- Show task preview with enough context to make a decision
- Include confidence score from AI extraction when applicable

### Quick Triage Actions
- **Approve** - Add task to "Today's Docket" or backlog
- **Defer** - Snooze with optional note ("Need to check with X first")
- **Dismiss** - Mark as not actionable with optional reason

### Today's Docket
- Persistent section showing tasks approved for today
- Ability to reorder priority
- Quick status updates (in progress, done, moved to tomorrow)

### Task Source Types
- Tasks extracted from meeting transcripts (requires integration with Recordings)
- Tasks from Slack thread mentions/action items
- Jira tickets assigned or mentioned
- AI-identified follow-ups from email/discussions

## Acceptance Criteria

- [ ] Feed page has a "Suggested Tasks" section
- [ ] Tasks show their source (meeting, Slack, Jira, AI)
- [ ] Users can approve/defer/dismiss tasks with single click
- [ ] Approved tasks appear in "Today's Docket" section
- [ ] Deferred tasks can have a note attached
- [ ] Dismissed tasks are hidden but recoverable
- [ ] Tasks persist across sessions

## Technical Notes

The Feed page (`src/pages/Feed.js`) already has:
- Data fetching from `/api/feed`
- AI summarization with skim functionality
- Filtering by urgency and topic

New components needed:
- `SuggestedTaskCard` - Individual task suggestion with triage actions
- `TodaysDocket` - Persistent task list for the day
- API endpoint `/api/feed/suggested-tasks` for task suggestions
- API endpoint `/api/tasks/triage` for approve/defer/dismiss actions

Consider integrating with the existing Tasks page (`src/pages/Tasks.js`) for task management.

## References

- Apollo Reveal Script: Scene 1.2 "Task Triage"
- Current Feed implementation: `src/pages/Feed.js`
- Tasks page: `src/pages/Tasks.js`

## History

- 2026-01-31: Created from reveal script gap analysis
