---
id: e914ef9e7b2c
title: 'Recordings: Task Extraction from Transcripts'
type: feature
status: backlog
priority: high
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - backend
  - recordings
  - tasks
  - ai
  - reveal-script
  - apollo
parent: null
blocks: []
blocked_by: []
related:
  - cf2f10bd59ab
  - 4f43af5fb2b1
external: {}
estimate: null
component: Recordings
sprint: null
starred: false
flag: null
---

# Recordings: Task Extraction from Transcripts

## Description

Implement AI-powered task extraction from meeting recordings as described in the Apollo Reveal Script (Scene 2.2):

> "Apollo extracted a suggested task from this discussion. The team agreed we should update the model deployment flow to show estimated costs before confirmation. That's valuable feedback — let me approve this."

The script shows:
- Suggested task card below the recording
- Task: "Add cost estimation to model deployment confirmation dialog"
- Source: "Architecture meeting, 57:23 — discussed by Marcus and Sarah"
- "Approve & Add to Backlog" action

## Features to Implement

### Task Extraction Engine
- Analyze transcripts for action items, decisions, and agreements
- Identify task descriptions from conversational context
- Extract assignees/owners when mentioned
- Capture source timestamp and speaker(s)
- Assign confidence score to each extraction

### Task Suggestion UI
- Display suggested tasks below recording player
- Show task title, description preview, and source
- Include timestamp link to jump to that moment
- List speakers who discussed/agreed to the task
- Provide confidence indicator

### Task Actions
- **Approve & Add to Backlog** - Create task in Apollo task system
- **Approve & Assign** - Create task and assign to mentioned person
- **Edit & Approve** - Modify task details before creating
- **Dismiss** - Mark as not actionable (hidden but recoverable)

### Task Metadata
For each extracted task:
- Title (AI-generated)
- Description (context from transcript)
- Source recording ID and timestamp
- Speakers involved
- Confidence score
- Status (pending, approved, dismissed)

## Acceptance Criteria

- [ ] After transcription, AI extracts potential tasks
- [ ] Suggested tasks appear in RecordingDetail view
- [ ] Each suggestion shows source timestamp and speakers
- [ ] Clicking timestamp plays the relevant segment
- [ ] "Approve & Add" creates task linked to recording
- [ ] Created tasks include source reference
- [ ] Dismissed suggestions are hidden but recoverable
- [ ] Suggestions sync to Feed's suggested tasks

## Technical Notes

Current infrastructure:
- Transcripts available as VTT
- Local AI service for text analysis
- Tasks page exists with task management

New requirements:
- Post-transcription task extraction pipeline
- API endpoint `/api/recordings/:id/extract-tasks`
- Suggested tasks storage in recording metadata
- Integration with Apollo task system
- Link from task back to recording moment

Extraction patterns to detect:
- "We should...", "Let's...", "Action item:..."
- "X will take care of...", "Y is responsible for..."
- "Agreed to...", "Decided to..."
- Deadline mentions: "by end of sprint", "before release"

## References

- Apollo Reveal Script: Scene 2.2 "Actionable Insight"
- RecordingDetail: `src/pages/RecordingDetail.js`
- Tasks page: `src/pages/Tasks.js`
- Related: `cf2f10bd59ab` (topic segmentation)
- Related: `4f43af5fb2b1` (suggested tasks in Feed)

## History

- 2026-01-31: Created from reveal script gap analysis
