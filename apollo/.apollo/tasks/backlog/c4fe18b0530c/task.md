---
id: c4fe18b0530c
title: 'Global Semantic Search with Timeline Visualization'
type: feature
status: backlog
priority: high
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - backend
  - search
  - ai
  - reveal-script
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: Search
sprint: null
starred: false
flag: null
---

# Global Semantic Search with Timeline Visualization

## Description

Implement semantic search and design archaeology features as described in the Apollo Reveal Script (Scenes 4.1-4.3):

> "Apollo isn't just about today's work. It's a living memory of our design system. Let me ask a question."
>
> User types: "When was the last time we made major changes to the OpenShift AI dashboard?"
>
> "Interesting. The last major dashboard update was in OpenShift AI 3.0 — almost a year ago."

The script describes:
- Natural language question search
- Timeline visualization of search results
- Design archaeology with linked artifacts
- AI-generated strategic suggestions

## Features to Implement

### Semantic Search Interface
- Global search bar supporting natural language queries
- Question-based search: "When did...", "Who worked on...", "What changed in..."
- Keyword-based fallback for simple queries
- Search across all artifact types

### Searchable Content
- Prototypes and their change history
- Documents and their revisions
- Recordings and transcripts
- Discussions and comments
- Tasks and their updates
- Slack threads and Jira tickets

### Timeline Visualization
- Display results on a visual timeline
- Group by time period (week, month, quarter)
- Show artifact type indicators
- Highlight significant changes/milestones

### Design Archaeology
- Link related artifacts across search results
- Show evolution of a feature/component over time
- Display connected prototypes, docs, and discussions
- Surface decision history for a topic

### AI Strategic Suggestions
As shown in Scene 4.3:
> "Apollo has access to our strategy documents, our shipped features, and our user feedback. It's synthesizing suggestions."

- Generate strategic recommendations based on context
- Link suggestions to source documents
- Create draft prototypes from suggestions (background generation)

## Acceptance Criteria

- [ ] Global search accepts natural language questions
- [ ] Search results include prototypes, docs, recordings, tasks
- [ ] Results display on a timeline view
- [ ] Timeline is interactive (zoom, filter by type)
- [ ] Related artifacts are linked in results
- [ ] AI can answer "when" and "what changed" questions
- [ ] Strategic suggestions appear for complex queries
- [ ] Suggestions link to source materials
- [ ] "Create prototype from suggestion" action exists

## Technical Notes

Current search capabilities:
- No global semantic search exists
- Individual pages have keyword search/filter
- Masthead has placeholder search input

New requirements:
- Search index across all Apollo content
- Semantic embedding for natural language matching
- Timeline UI component
- AI question-answering pipeline
- Background prototype generation queue

Indexable content sources:
- Prototypes: metadata, screenshots, descriptions
- Documents: full text content
- Recordings: transcripts
- Tasks: title, description, history
- External: cached Jira, Slack, Confluence content

Consider using:
- Vector database for semantic search (or local alternative)
- Local LLM for question understanding
- Incremental indexing on content changes

## References

- Apollo Reveal Script: Scenes 4.1-4.3 "Contextual Search", "Design Archaeology", "Strategic Suggestions"
- AppMasthead search: `src/components/AppMasthead.js`
- AI service: `server/lib/ai.js`

## History

- 2026-01-31: Created from reveal script gap analysis
