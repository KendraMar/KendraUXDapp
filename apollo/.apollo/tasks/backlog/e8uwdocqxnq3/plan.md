# Implementation Plan: Peer-to-Peer Video Conferencing (Common Room)

**Task:** e8uwdocqxnq3
**Created:** 2026-02-10

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Phase 1 — Signaling Server & Presence](#phase-1--signaling-server--presence)
4. [Phase 2 — Common Room UI](#phase-2--common-room-ui)
5. [Phase 3 — WebRTC Peer Connection](#phase-3--webrtc-peer-connection)
6. [Phase 4 — Call UI (Floating Panel)](#phase-4--call-ui-floating-panel)
7. [Phase 5 — Polish & Edge Cases](#phase-5--polish--edge-cases)
8. [Dependency Analysis](#dependency-analysis)
9. [File Structure](#file-structure)
10. [Security Considerations](#security-considerations)
11. [Future Enhancements](#future-enhancements)

---

## Overview

This plan describes how to build a modular Apollo app that provides peer-to-peer video conferencing through a "common room" metaphor. The system has three core layers:

1. **Presence** — Know who's online and available
2. **Signaling** — Exchange connection metadata (SDP offers/answers, ICE candidates) so two browsers can find each other
3. **Media** — Stream encrypted audio/video directly between two peers via WebRTC

After the signaling handshake, the server is no longer in the media path. All audio and video flows directly between the two machines.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser A                         │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │ Common Room   │    │ RTCPeerConnection         │   │
│  │ React UI      │───▶│ - getUserMedia()          │   │
│  │ (PatternFly)  │    │ - addTrack(audio, video)  │   │
│  └──────┬───────┘    │ - ontrack (remote media)   │   │
│         │            └──────────┬───────────────┘   │
│         │ WebSocket             │ DTLS-SRTP          │
│         │ (signaling)           │ (encrypted media)  │
└─────────┼───────────────────────┼───────────────────┘
          │                       │
          ▼                       │ Direct P2P
┌─────────────────────┐          │
│   Express Server     │          │
│  ┌────────────────┐ │          │
│  │ WebSocket       │ │          │
│  │ /ws/videocall   │ │          │
│  │                 │ │          │
│  │ - Presence      │ │          │
│  │ - SDP relay     │ │          │
│  │ - ICE relay     │ │          │
│  └────────────────┘ │          │
└─────────────────────┘          │
          │                       │
          │ WebSocket             │ DTLS-SRTP
          │ (signaling)           │ (encrypted media)
┌─────────┼───────────────────────┼───────────────────┐
│         │            ┌──────────┴───────────────┐   │
│  ┌──────┴───────┐    │ RTCPeerConnection         │   │
│  │ Common Room   │    │ - getUserMedia()          │   │
│  │ React UI      │───▶│ - addTrack(audio, video)  │   │
│  │ (PatternFly)  │    │ - ontrack (remote media)   │   │
│  └──────────────┘    └──────────────────────────┘   │
│                    Browser B                         │
└─────────────────────────────────────────────────────┘
```

### Key Insight: Server Is Only for Signaling

The Express server's WebSocket endpoint serves two purposes:
1. **Presence** — Track who is on the common room page and broadcast that list
2. **Signaling** — Relay SDP offers/answers and ICE candidates between two peers trying to connect

Once the WebRTC connection is established, the server plays no role in the call. If the server goes down mid-call, the call continues uninterrupted.

---

## Phase 1 — Signaling Server & Presence

### Goal
Stand up a WebSocket server on the existing Express backend that tracks connected users and relays signaling messages.

### Tasks

1. **Add WebSocket support to Express server**
   - Use the `ws` npm package (lightweight, no external dependencies beyond Node.js)
   - Attach a WebSocket server to the existing HTTP server on a specific path (`/ws/videocall`)
   - This avoids needing a separate port

2. **Implement the signaling protocol**

   Messages are JSON with a `type` field:

   | Type | Direction | Purpose |
   |------|-----------|---------|
   | `register` | Client → Server | Register with a user ID and display name |
   | `presence` | Server → Client | Broadcast updated list of online users |
   | `offer` | Client → Server → Client | SDP offer relayed to target peer |
   | `answer` | Client → Server → Client | SDP answer relayed back to caller |
   | `ice-candidate` | Client → Server → Client | ICE candidate relayed to target peer |
   | `call-invite` | Client → Server → Client | Notify target that someone wants to call |
   | `call-accept` | Client → Server → Client | Target accepts the call |
   | `call-decline` | Client → Server → Client | Target declines the call |
   | `call-end` | Client → Server → Client | Either party ends the call |
   | `ping` / `pong` | Bidirectional | Keepalive for presence accuracy |

3. **Presence tracking**
   - Maintain an in-memory Map of connected users: `Map<userId, { ws, displayName, status }>`
   - On `register`: add user to map, broadcast updated presence to all clients
   - On disconnect: remove user, broadcast updated presence
   - Heartbeat: send `ping` every 30s, remove users that don't respond within 10s

4. **User identity**
   - For v1, the user identifies themselves by selecting their name from the People list on first visit (stored in localStorage)
   - The server trusts this identity (no auth in v1 — the system is designed for trusted local networks)
   - The user ID maps to entries in `data/people/people.json`

### Files

- `data/apps/videocall/routes.js` — WebSocket upgrade handler and signaling logic
- Modification to `server/index.js` — Pass the HTTP server instance to route setup (if not already available for WebSocket upgrade)

---

## Phase 2 — Common Room UI

### Goal
Build the React page that shows who's online and available.

### Tasks

1. **Common Room layout**
   - Page title: "Common Room" (or "Video Call" in nav)
   - Subtitle: "See who's around and start a conversation"
   - Grid/list of contacts from People data
   - Each contact card shows: avatar (initials fallback), name, role, online status indicator

2. **Presence integration**
   - On mount: open WebSocket connection to `/ws/videocall`
   - Send `register` message with the user's chosen identity
   - Listen for `presence` messages to update online status of contacts
   - On unmount: close WebSocket (server detects disconnect, updates presence)

3. **Contact cards**
   - **Online & available**: Green dot, full color, clickable "Call" button
   - **Offline**: Greyed out, no call button
   - Show all contacts from People data, with online ones sorted to top

4. **Identity selection**
   - First-time setup: modal to select "Who are you?" from the People list
   - Stored in localStorage, can be changed from a settings dropdown
   - Displayed in the page header: "You are signed in as [Name]"

5. **PatternFly components to use**
   - `PageSection`, `Title`, `Text` for layout
   - `Card`, `CardBody` for contact cards
   - `Avatar` for user avatars
   - `Label` or `Badge` for online/offline status
   - `Button` for call initiation
   - `Modal` for identity selection
   - `EmptyState` when no contacts are online

### Files

- `data/apps/videocall/pages/VideoCall.js` — Main common room page component
- `data/apps/videocall/pages/components/ContactCard.js` — Individual contact card
- `data/apps/videocall/pages/components/IdentityModal.js` — "Who are you?" selector

---

## Phase 3 — WebRTC Peer Connection

### Goal
Implement the actual peer-to-peer connection logic.

### Tasks

1. **WebRTC helper hook: `useWebRTC`**

   A custom React hook that encapsulates:
   - Creating an `RTCPeerConnection`
   - Getting local media via `navigator.mediaDevices.getUserMedia({ video: true, audio: true })`
   - Adding local tracks to the connection
   - Handling `ontrack` to capture remote media streams
   - Creating and setting SDP offers/answers
   - Handling ICE candidates
   - Connection state monitoring (`oniceconnectionstatechange`, `onconnectionstatechange`)

2. **Call flow (Caller side)**
   ```
   1. User clicks "Call" on a contact
   2. Send `call-invite` via WebSocket (with caller info)
   3. Wait for `call-accept` or `call-decline`
   4. On accept: create RTCPeerConnection
   5. Get local media (camera + mic)
   6. Add tracks to connection
   7. Create SDP offer → set as local description
   8. Send `offer` via WebSocket
   9. Receive `answer` via WebSocket → set as remote description
   10. Exchange ICE candidates via WebSocket
   11. Connection established → media flows directly
   ```

3. **Call flow (Callee side)**
   ```
   1. Receive `call-invite` via WebSocket
   2. Show incoming call notification (accept/decline)
   3. On accept: send `call-accept` via WebSocket
   4. Create RTCPeerConnection
   5. Get local media (camera + mic)
   6. Add tracks to connection
   7. Receive `offer` via WebSocket → set as remote description
   8. Create SDP answer → set as local description
   9. Send `answer` via WebSocket
   10. Exchange ICE candidates via WebSocket
   11. Connection established → media flows directly
   ```

4. **ICE configuration**
   ```javascript
   const iceConfig = {
     iceServers: [
       // For local network: no STUN needed, but include as fallback
       { urls: 'stun:stun.l.google.com:19302' },
       // TURN server can be configured in data/config.json if needed
     ]
   };
   ```

   On a local network, WebRTC will discover local IP candidates via the host candidate type, which requires no STUN server. The Google STUN server is included as a fallback for cross-network scenarios.

5. **Media stream management**
   - Store local and remote `MediaStream` objects in React state
   - Attach to `<video>` elements via refs
   - Handle track muting/unmuting without renegotiation (just `track.enabled = false`)

### Files

- `data/apps/videocall/pages/hooks/useWebRTC.js` — Core WebRTC logic
- `data/apps/videocall/pages/hooks/useSignaling.js` — WebSocket signaling abstraction

---

## Phase 4 — Call UI (Floating Panel)

### Goal
Display the active call in a floating, draggable panel with controls.

### Tasks

1. **Floating call panel**
   - Appears when a call is active (either as caller or callee)
   - Positioned in the bottom-right corner by default
   - Draggable to any position on screen
   - Contains:
     - Remote video (main area, ~320x240 or responsive)
     - Local video preview (small PiP overlay, ~120x90)
     - Caller/callee name
     - Call duration timer
     - Control bar at bottom

2. **Call controls**
   - **Mute/Unmute mic**: Toggle `audioTrack.enabled`; icon switches between mic/mic-off
   - **Camera on/off**: Toggle `videoTrack.enabled`; icon switches between video/video-off; when off, show avatar placeholder
   - **End call**: Close `RTCPeerConnection`, stop local media tracks, send `call-end` via WebSocket, hide panel

3. **Incoming call notification**
   - When a `call-invite` is received, show a toast/modal with:
     - Caller's name and avatar
     - Accept (green) and Decline (red) buttons
     - Optional: ring sound effect (can be added later)
   - Auto-decline after 30 seconds of no response

4. **Call states**
   - `idle` — No active call
   - `ringing-out` — Waiting for callee to accept
   - `ringing-in` — Incoming call, waiting for user to accept/decline
   - `connecting` — WebRTC handshake in progress
   - `connected` — Call active, media flowing
   - `ended` — Call just ended (brief state before returning to idle)

### PatternFly components

- Custom floating panel (no direct PF equivalent — use a styled `div` with `position: fixed` and drag handling)
- `Button` for controls
- `Icon` from `@patternfly/react-icons` for mic, video, phone-end icons
- `Modal` or `AlertGroup` for incoming call notification

### Files

- `data/apps/videocall/pages/components/CallPanel.js` — Floating video call panel
- `data/apps/videocall/pages/components/IncomingCallModal.js` — Incoming call notification
- `data/apps/videocall/pages/components/CallControls.js` — Mute/video/end buttons

---

## Phase 5 — Polish & Edge Cases

### Tasks

1. **Connection failure handling**
   - If ICE gathering fails (no candidates found): show error message
   - If connection drops mid-call: attempt to reconnect with ICE restart
   - If peer closes browser: detect via `oniceconnectionstatechange` → `disconnected` → `failed`, end call gracefully

2. **Browser permissions**
   - Handle camera/mic permission denied gracefully
   - Show instructions if permissions are blocked
   - Support audio-only calls if camera is unavailable

3. **Multiple tabs**
   - If user opens common room in two tabs, the second connection should replace the first (or show a warning)
   - Use `BroadcastChannel` API or localStorage events to detect duplicate tabs

4. **Responsive design**
   - Call panel should work on different screen sizes
   - Contact grid should be responsive (grid → list on small screens)

5. **Accessibility**
   - Keyboard navigation for call controls
   - ARIA labels on video elements and buttons
   - Screen reader announcements for incoming calls

---

## Dependency Analysis

### Required: None (ideal)

WebRTC is built into all modern browsers. The `MediaStream` and `RTCPeerConnection` APIs require no polyfills.

### Potentially Required

| Package | Purpose | Can We Avoid It? |
|---------|---------|------------------|
| `ws` | WebSocket server for Node.js | **Likely needed** — Node.js doesn't have a built-in WebSocket server. This is a zero-dependency package, very lightweight. Check if Apollo already uses it. |
| `simple-peer` | WebRTC wrapper | **Yes, avoid** — The browser's native `RTCPeerConnection` API is sufficient for 1:1 calls. A wrapper adds unnecessary abstraction. |
| `socket.io` | WebSocket abstraction | **Yes, avoid** — `ws` is simpler and lighter. We don't need rooms, namespaces, or auto-reconnect logic for v1. |
| `peerjs` | WebRTC + signaling service | **Yes, avoid** — Uses a centralized PeerJS server. We want our own signaling. |

### Verdict

The only new dependency that may be needed is `ws` (WebSocket server for Node.js). Check if the project already has WebSocket support — if Express is running on an HTTP server, we can attach `ws` to it directly. If `express-ws` or `socket.io` is already a dependency, use that instead.

**If `ws` is already in `node_modules`** (as a transitive dependency), we might be able to require it without adding to `package.json`. But it's better to add it explicitly.

---

## File Structure

```
data/apps/videocall/
├── manifest.json                          # App registration
├── routes.js                              # WebSocket signaling server
├── pages/
│   ├── VideoCall.js                       # Main common room page
│   ├── hooks/
│   │   ├── useSignaling.js                # WebSocket connection management
│   │   └── useWebRTC.js                   # RTCPeerConnection management
│   └── components/
│       ├── ContactCard.js                 # Contact display card
│       ├── IdentityModal.js               # "Who are you?" selector
│       ├── CallPanel.js                   # Floating video call panel
│       ├── IncomingCallModal.js           # Incoming call notification
│       └── CallControls.js               # Mute/video/end controls
└── styles.css                             # App-specific styles (if needed)
```

### manifest.json

```json
{
  "id": "videocall",
  "displayName": "Common Room",
  "description": "Peer-to-peer video calling — see who's around and start a conversation",
  "icon": "VideoIcon",
  "version": "1.0.0",
  "enabled": true,
  "navItem": {
    "path": "/videocall",
    "displayName": "Common Room",
    "icon": "VideoIcon"
  },
  "routes": [
    {
      "path": "/videocall",
      "page": "VideoCall"
    }
  ],
  "apiPath": "/api/videocall"
}
```

---

## Security Considerations

1. **Media encryption**: WebRTC mandates DTLS-SRTP — all audio/video is encrypted in transit. This is non-optional in the WebRTC spec.

2. **Signaling encryption**: The WebSocket connection runs over the same Express server. In production, this should be served over HTTPS/WSS. For local development on `localhost`, this is inherently trusted.

3. **Identity**: v1 uses a trust-based model (user self-identifies from the People list). This is appropriate for a local/trusted network tool. Future versions could add authentication.

4. **Network exposure**: The signaling server only runs on the Apollo Express server (localhost:1225 by default). It's not exposed to the internet unless the user explicitly forwards ports.

5. **ICE candidates**: ICE candidates can reveal local IP addresses. On a trusted local network, this is expected and necessary. For cross-network use, TURN servers with credentials would mask this.

---

## Future Enhancements

These are explicitly **out of scope** for v1 but worth noting:

- **Group calls** (3+ participants) — Requires an SFU (Selective Forwarding Unit) or mesh topology
- **Screen sharing** — `getDisplayMedia()` API, straightforward to add
- **Chat during calls** — WebRTC DataChannel for text alongside media
- **Call history** — Log calls to a local JSON file
- **Local network discovery (mDNS/Bonjour)** — Discover peers without the signaling server using `dns-sd` or Bonjour. Browsers can't do this natively, but a Node.js service could broadcast presence via mDNS
- **Recording** — Capture call audio/video locally using `MediaRecorder`
- **Virtual backgrounds** — Use `CanvasRenderingContext2D` or ML models to replace background
- **Push notifications** — Notify when someone comes online even when not on the common room page
- **Authentication** — Proper user auth instead of trust-based identity
- **TURN server configuration** — For calls that need to traverse NATs/firewalls beyond local networks
