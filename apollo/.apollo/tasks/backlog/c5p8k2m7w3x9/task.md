---
id: c5p8k2m7w3x9
title: Add clip functionality for audio and video recordings
type: feature
status: backlog
priority: medium
created: 2025-01-23T00:00:00.000Z
due: null
assignees: []
labels:
  - feature
  - recordings
  - frontend
  - backend
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: recordings
sprint: null
starred: false
flag: null
---

# Add clip functionality for audio and video recordings

## Description

Add support for creating shareable clips from any audio or video recording. Similar to Twitch.tv clips, users should be able to select a start and end timestamp on a recording and create a named clip that can be shared via a unique URL. Clips are lightweight references to segments of existing recordings rather than separate video files.

## User Story

As a **user reviewing recordings**, I want to **create clips from specific moments in a recording**, so that **I can easily share highlights or important segments with others without sending the entire recording**.

## Goals

1. Allow users to create clips by selecting start/end timestamps on any recording
2. Store clip metadata in a structured format alongside the recording
3. Provide unique shareable URLs for each clip
4. Enable clip playback that automatically seeks to the clip segment
5. Support both audio and video recordings

## Non-Goals

- Transcoding or creating separate video files for clips (clips are references, not copies)
- Real-time clip creation during live streams
- Automatic clip suggestions based on AI analysis (could be future enhancement)

## Design

### Folder Structure

Each recording folder should have a `clips/` subfolder:

```
data/recordings/
  2025-01-21_16-35-00-000-apollo-review-session/
    metadata.json
    recording.mp4  (or .webm, .mp3, etc.)
    transcript.json
    clips/
      highlight-design-feedback.yaml
      question-about-roadmap.yaml
```

### Clip YAML Format

```yaml
id: a1b2c3d4e5f6
name: "Great feedback on navigation"
description: "Daniel shares insightful feedback about the sidebar navigation design"
createdAt: 2025-01-23T10:30:00-04:00
createdBy: "Andy Braren"
startTime: "00:18:45"
startTimeSeconds: 1125
endTime: "00:20:30"
endTimeSeconds: 1230
duration: 105
tags:
  - feedback
  - navigation
  - ux
shareUrl: "/recordings/2025-01-21_16-35-00-000-apollo-review-session/clips/a1b2c3d4e5f6"
thumbnail: null  # Optional: timestamp for thumbnail generation
```

### URL Structure

- Recording detail: `/recordings/:recordingId`
- Clip view: `/recordings/:recordingId/clips/:clipId`
- Alternative short URL: `/clips/:clipId` (redirects to full path)

## Acceptance Criteria

- [ ] Clips subfolder structure is created when first clip is added
- [ ] Clip YAML files contain all required metadata fields
- [ ] Users can select start/end times via UI (click-drag on timeline or input fields)
- [ ] Clips have unique IDs and shareable URLs
- [ ] Clip URLs play the recording starting at the clip's start time
- [ ] Clip playback optionally stops at end time or continues
- [ ] Recording detail page shows list of clips
- [ ] Clips can be edited (name, description, timestamps)
- [ ] Clips can be deleted
- [ ] API endpoints exist for CRUD operations on clips
- [ ] Documentation updated

## Technical Approach

### Backend (Express.js)

1. Create `server/routes/clips.js` for clip CRUD operations:
   - `GET /api/recordings/:recordingId/clips` - List clips for a recording
   - `GET /api/recordings/:recordingId/clips/:clipId` - Get single clip
   - `POST /api/recordings/:recordingId/clips` - Create new clip
   - `PUT /api/recordings/:recordingId/clips/:clipId` - Update clip
   - `DELETE /api/recordings/:recordingId/clips/:clipId` - Delete clip

2. Use `js-yaml` for parsing/writing YAML files

3. Generate unique clip IDs (12-char alphanumeric like task IDs)

### Frontend (React + PatternFly)

1. Add clip creation UI to `RecordingDetail.js`:
   - Timeline component with range selection
   - Form for clip name, description, tags
   - Preview functionality

2. Create `ClipDetail.js` page for viewing individual clips:
   - Player auto-seeks to start time
   - Display clip metadata
   - Share button with copy-to-clipboard

3. Add clips list panel to recording detail view

4. Update `App.js` with clip routes

## Subtasks

- [ ] Create `clips/` folder structure and YAML schema
- [ ] Implement backend CRUD API for clips
- [ ] Add clip creation UI with timeline selection
- [ ] Create clip detail/playback page
- [ ] Add clips list to recording detail page
- [ ] Implement share functionality with unique URLs
- [ ] Add clip editing and deletion
- [ ] Write API documentation

## Open Questions

- [ ] Should clips have their own generated thumbnail from the video frame at start time?
- [ ] Should there be a maximum clip duration limit?
- [ ] Should clips be public by default or require explicit sharing?
- [ ] Do we want to support clip embedding (iframe/embed code)?
- [ ] Should clips have view counts?

## References

- [Twitch Clips](https://help.twitch.tv/s/article/how-to-use-clips) - Reference implementation
- [YouTube Clip feature](https://support.google.com/youtube/answer/10332730) - Alternative approach
- Current recording metadata structure: `data/recordings/*/metadata.json`

## History

- 2025-01-23: Created
