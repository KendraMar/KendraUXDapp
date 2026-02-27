---
id: e8uwdocqxnq3
title: 'Peer-to-Peer Video Conferencing App (Common Room)'
type: feature
status: backlog
priority: medium
created: 2026-02-10T00:00:00.000Z
due: null
assignees: []
labels:
  - feature
  - frontend
  - backend
  - networking
  - webrtc
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: null
sprint: null
starred: false
flag: null
---

# Peer-to-Peer Video Conferencing App (Common Room)

## Description

Build a self-contained Apollo app (`data/apps/videocall/`) that provides peer-to-peer, encrypted video and audio calling between two people on the same network or reachable via a signaling server. The app presents a "common room" experience: when you navigate to the page, you see which of your contacts (from the People data) are also online and available. You can click on an available person to initiate a direct video call, similar to FaceTime but using WebRTC for a direct peer-to-peer connection.

### Core Concept

The page acts as a **digital common room**. Instead of scheduling meetings, you open the room and see who's around. If someone is available, you click their name/avatar to start a call. The call displays in a **floating panel** with the other person's video feed and standard controls (mute audio, pause video, end call).

### Key Design Principles

- **Peer-to-peer first**: After the initial signaling handshake, all audio/video streams flow directly between the two computers — no media server in the middle.
- **Encrypted**: WebRTC provides SRTP encryption by default for media streams; DTLS for the data channel. No additional encryption layer needed for the transport.
- **Minimal dependencies**: Use the browser's built-in WebRTC APIs. The only server-side need is a lightweight signaling mechanism (WebSocket on the existing Express server).
- **Local network awareness**: Ideally discover peers on the local network without a centralized server. Fallback to the Express server as a signaling relay.
- **Integration with People**: Pull contact data from `data/people/people.json` to display names and avatars of known contacts.

## Acceptance Criteria

- [ ] New modular app at `data/apps/videocall/` with manifest, pages, and routes
- [ ] App appears in left nav with a video/phone icon
- [ ] Common room page shows a list of contacts from People data
- [ ] Online/available status is displayed for each contact (green dot, "available" badge, etc.)
- [ ] Presence system: users broadcast availability when on the common room page
- [ ] Clicking an available contact initiates a WebRTC peer-to-peer call
- [ ] Callee receives an incoming call notification with accept/decline
- [ ] Active call displays remote video in a floating, draggable panel
- [ ] Local video preview (small picture-in-picture style)
- [ ] Mute/unmute microphone control
- [ ] Enable/disable camera control
- [ ] End call button
- [ ] Call is encrypted via WebRTC's built-in DTLS-SRTP
- [ ] Signaling server (WebSocket) on the Express backend for SDP/ICE exchange
- [ ] Graceful handling of call failures, disconnects, and network issues
- [ ] Works between two browsers on the same local network
- [ ] No external dependencies beyond what's available in the browser and Node.js standard library (aim for zero new npm packages; evaluate if a STUN/TURN helper is truly needed)

## Technical Notes

See the detailed implementation plan: [plan.md](./plan.md)

### Architecture Summary

1. **Signaling Server** — WebSocket endpoint on the existing Express server (`/ws/videocall`) for exchanging SDP offers/answers and ICE candidates between peers.
2. **Presence System** — When a user opens the common room page, they register with the signaling server. The server broadcasts the updated list of online users to all connected clients.
3. **WebRTC Connection** — After signaling, a direct `RTCPeerConnection` is established between the two browsers. Media streams flow peer-to-peer.
4. **STUN/TURN** — For local network use, STUN is typically unnecessary (local IPs are directly routable). For cross-network calls, Google's public STUN servers can be used as a default, with an option to configure a TURN server if needed.
5. **People Integration** — The presence system maps connected user IDs to entries in `data/people/people.json` for display names and avatars.

### Technology Choices

- **WebRTC** (browser-native) — No library needed for basic peer connections
- **WebSocket** (`ws` npm package, likely already available or express-ws) — For signaling
- **React** + **PatternFly 6** — Consistent with Apollo's UI stack

## References

- [Implementation Plan](./plan.md)
- [WebRTC API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC Signaling and Video Calling](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)
- [People Data](../../../data/people/people.json)

## History

- 2026-02-10: Created — Peer-to-peer video conferencing as a "common room" experience
