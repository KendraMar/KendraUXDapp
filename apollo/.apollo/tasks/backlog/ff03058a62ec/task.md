---
id: ff03058a62ec
title: Implement voice recording with local LLM
type: task
status: backlog
priority: medium
created: 2025-01-30T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - code-editor
  - ai
  - audio
  - feature
  - apollo
parent: j7n4x9m2k5p8
blocks: []
blocked_by:
  - b0449c9bec6d
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

# Implement voice recording with local LLM

## Description

Add voice input capability to the AI chat panel. Users should be able to click a microphone button to record their voice, which is then transcribed using a local LLM (Whisper or similar), and the transcribed text is placed into the chat input for submission.

This enables a natural, hands-free way to interact with the AI assistant while coding.

## Acceptance Criteria

- [ ] Microphone button in chat input area
- [ ] Click to start recording, click again to stop
- [ ] Visual indicator while recording (pulsing icon, waveform, timer)
- [ ] Audio sent to backend for local transcription
- [ ] Transcribed text appears in input field
- [ ] User can edit transcription before submitting
- [ ] Error handling for microphone permission denied
- [ ] Works with Whisper model via Ollama or similar

## Technical Approach

### Frontend
1. Use Web Audio API / MediaRecorder for audio capture
2. Create `VoiceInput.js` component
3. States: idle, recording, processing, error
4. Send audio blob to backend endpoint

### Backend
1. New endpoint: `POST /api/ai/transcribe`
2. Accept audio file (webm, wav, or mp3)
3. Pass to local Whisper model
4. Return transcribed text

### Audio Processing
```javascript
const mediaRecorder = new MediaRecorder(stream);
mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
mediaRecorder.onstop = () => {
  const blob = new Blob(chunks, { type: 'audio/webm' });
  sendToBackend(blob);
};
```

## UI States

| State | Icon | Visual |
|-------|------|--------|
| Idle | 🎤 | Grey microphone |
| Recording | 🔴 | Red pulsing dot + timer |
| Processing | ⏳ | Spinner |
| Error | ⚠️ | Error message tooltip |

## Dependencies

- Local Whisper model (whisper.cpp, faster-whisper, or via Ollama)
- Browser permissions for microphone
- Potentially ffmpeg for audio format conversion

## Notes

- Respect privacy: audio is processed locally, never sent to cloud
- Consider adding keyboard shortcut for voice input
- Max recording length limit to prevent huge uploads

## History

- 2025-01-30: Created as subtask of j7n4x9m2k5p8
- 2026-01-30: Assigned unique ID ff03058a62ec
