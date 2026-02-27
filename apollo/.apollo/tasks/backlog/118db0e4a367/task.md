---
id: 118db0e4a367
title: 'Calendar: Meeting Prep Cards with Context'
type: feature
status: backlog
priority: medium
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - calendar
  - ai
  - context
  - reveal-script
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: Calendar
sprint: null
starred: false
flag: null
---

# Calendar: Meeting Prep Cards with Context

## Description

Enhance the Calendar page with AI-generated meeting preparation cards as described in the Apollo Reveal Script (Scene 1.3):

> "I can see my calendar inline. Two meetings today — but more importantly, I can see what Apollo has prepared for each meeting. Context is pre-loaded."

Currently, the Calendar page (`src/pages/Calendar.js`) shows basic event information from Google Calendar (title, time, location, attendees, video link). It lacks contextual meeting preparation.

## Features to Implement

### Meeting Prep Cards
For each upcoming meeting, display:
- **Related Documents** - Documents mentioning meeting topic or attendees
- **Previous Meeting Notes** - Notes/recordings from prior meetings with same attendees or topic
- **Relevant Jira Items** - Active tickets related to meeting subject
- **Recent Slack Discussions** - Relevant thread excerpts from the past week
- **Suggested Talking Points** - AI-generated agenda items based on context

### Context Gathering
- Parse meeting title and description for keywords
- Match attendees to their recent activity in Apollo
- Find documents edited or viewed in relation to meeting topic
- Surface recordings from meetings with similar participants

### Pre-Meeting Actions
- "View all context" - Expand to see full preparation materials
- "Add to notes" - Start meeting notes document pre-filled with context
- "Share prep" - Send context summary to meeting attendees

## Acceptance Criteria

- [ ] Each calendar event shows a "Meeting Prep" expansion panel
- [ ] Prep cards show related documents (if any exist)
- [ ] Prep cards show previous meeting notes with same attendees
- [ ] Prep cards show relevant Jira tickets
- [ ] Prep cards show recent Slack discussions (when available)
- [ ] AI-generated talking points appear for recurring meetings
- [ ] Users can create meeting notes pre-filled with context
- [ ] Prep data is cached and refreshed on calendar sync

## Technical Notes

Current Calendar implementation:
- Fetches events from Google Calendar API
- Groups events by date
- Shows basic event details in cards

New requirements:
- API endpoint `/api/calendar/meeting-prep/:eventId` to gather context
- Integration with Documents, Recordings, Jira, and Slack APIs
- AI service call to generate talking points
- Consider background pre-computation for upcoming meetings

Data sources to query:
- `/api/documents` - search by meeting title keywords
- `/api/recordings` - find recordings with matching attendees
- `/api/jira` - search tickets by keywords
- `/api/slack` - search messages by keywords and participants

## References

- Apollo Reveal Script: Scene 1.3 "Calendar Glance"
- Current Calendar implementation: `src/pages/Calendar.js`
- Google Calendar API integration: `server/lib/google.js`

## History

- 2026-01-31: Created from reveal script gap analysis
