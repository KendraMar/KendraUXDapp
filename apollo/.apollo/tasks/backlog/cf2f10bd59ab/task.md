---
id: cf2f10bd59ab
title: 'Recordings: AI Topic Segmentation'
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
  - ai
  - reveal-script
  - apollo
parent: null
blocks: []
blocked_by: []
related:
  - c5p8k2m7w3x9
  - e914ef9e7b2c
external: {}
estimate: null
component: Recordings
sprint: null
starred: false
flag: null
---

# Recordings: AI Topic Segmentation

## Description

Implement AI-powered topic segmentation for recordings as described in the Apollo Reveal Script (Scene 2.1):

> "Yesterday there was a 90-minute architecture meeting I couldn't attend. But Apollo doesn't just give me the full recording — it identified a 5-minute segment specifically about Models as a Service."

Currently, the Recordings page and RecordingDetail page support:
- Video/audio playback
- VTT transcript parsing and display
- Clickable transcript timestamps
- Basic transcription via Whisper

What's missing is automatic topic-based segmentation that creates "smart clips" based on discussion topics.

## Features to Implement

### Automatic Segment Detection
- Analyze transcript to identify topic changes
- Create named segments with start/end timestamps
- Prioritize segments based on user's known interests/projects
- Generate segment titles and brief descriptions

### Segment Display
- Show highlighted segments in the recording detail view
- Display segment cards with: title, duration, speakers, key topics
- Allow playback of just the segment
- Show "relevance score" based on user's current work context

### Context-Aware Highlighting
- Match segments to user's active projects/epics
- Surface recordings with relevant segments in other views (Feed, Dashboard)
- Example: "MaaS Discussion (5:12)" appears because user is working on MaaS

### Segment Metadata
For each segment, store:
- Start/end timestamps
- Title (AI-generated)
- Summary (AI-generated)
- Speakers (extracted from transcript)
- Topics/keywords
- Relevance score

## Acceptance Criteria

- [ ] After transcription, AI analyzes and creates topic segments
- [ ] Segments appear as cards above the transcript
- [ ] Each segment shows title, duration, and key speakers
- [ ] Clicking a segment jumps to that timestamp
- [ ] Segments can be played in isolation (mini-player)
- [ ] User's active projects affect segment prioritization
- [ ] Segments are searchable by topic/keyword
- [ ] Segment data persists in recording metadata

## Technical Notes

Current recording infrastructure:
- RecordingDetail.js handles playback and transcript display
- Transcripts stored as VTT files
- Whisper transcription available via `/api/recordings/:id/transcribe`

New requirements:
- Post-transcription AI analysis pipeline
- Segment detection algorithm (speaker diarization + topic modeling)
- API endpoint `/api/recordings/:id/segments`
- Segment storage in recording metadata JSON
- Background processing for long recordings

Consider using:
- Local LLM for topic classification
- Sliding window analysis on transcript
- Keyword extraction for segment tagging

## References

- Apollo Reveal Script: Scene 2.1 "The Recording That Matters"
- RecordingDetail: `src/pages/RecordingDetail.js`
- Recordings API: `server/routes/recordings.js`
- Related task: `c5p8k2m7w3x9` (clip functionality)

## History

- 2026-01-31: Created from reveal script gap analysis
