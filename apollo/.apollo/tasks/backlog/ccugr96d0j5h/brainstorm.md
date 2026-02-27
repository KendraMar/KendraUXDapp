# Extended Displays — Brainstorming Document

> **Date**: 2026-02-10
> **Status**: Early exploration
> **Context**: Apollo is a local-first knowledge workspace. What happens when a user has multiple monitors, each running an Apollo window? Can we make these windows aware of each other and coordinate their behavior?

---

## The Core Insight

Most web applications treat each browser window as an isolated instance. But knowledge workers with multiple monitors don't *think* in isolated windows — they think in a continuous workspace. One screen has their research, another has their document, a third has their reference material. The physical arrangement has *meaning*.

Apollo's local-first architecture gives us a unique advantage here: the Express server running on `localhost` already knows about all connected clients. We're not trying to coordinate across the internet — we're coordinating across the same desk. This is fundamentally a **local-first multi-display** problem, and it's one that cloud-first applications can't solve as elegantly.

---

## What Does "Awareness" Mean?

At minimum, the system knows:

1. **How many Apollo windows are open** — a display registry
2. **What each window is showing** — which page, which space, which artifact
3. **The relationship between windows** — are they showing the same space? Related artifacts? Completely independent things?

At a deeper level, the system could know:

4. **Physical arrangement** — which monitor is left/right/above (via the Window Management API)
5. **User intent** — is this a "work" layout, a "presentation" layout, a "research" layout?
6. **Window roles** — is this the "primary" window, a "companion" window, an "ambient" display?

---

## Concept Categories

### 1. Coordinated Navigation

**The idea**: When windows are "linked," navigating in one window can influence what the others show.

- **Leader/Follower mode**: One window is the "driver." When you navigate to a different artifact, companion windows automatically show related content. Click on a Jira task in your primary window? The second window shows the related Figma design. The third shows the Slack thread where the team discussed it.

- **Space Sync**: All linked windows stay within the same Space. When you switch Spaces on one window, all windows switch together — but each shows a different *facet* of that Space (tasks on one, documents on another, chat on a third).

- **Breadcrumb Trail**: As you navigate through artifacts in your primary window, your secondary window maintains a visual history/trail — like a breadcrumb map showing how you got here and what's related to where you are now.

### 2. Distributed Interface

**The idea**: Instead of cramming everything into one viewport, spread the interface itself across monitors.

- **Navigation-Free Displays**: Your leftmost monitor shows the full Apollo interface with sidebar navigation. Your other monitors show *only content* — no sidebar, no masthead, just the artifact or page filling the entire viewport. Navigation happens on one screen; content fills the rest.

- **Panel Extraction**: Drag a panel (context panel, discussions sidebar, AI chat) out of one window and onto another monitor. It becomes a standalone companion window. Like how some IDEs let you pop out panels.

- **Expanded Canvas**: A JSON Canvas that spans multiple monitors. Nodes near the edge of one screen continue onto the adjacent screen. Your knowledge graph is no longer constrained to a single viewport — it's as large as your desk.

### 3. Context Radiator

**The idea**: Use peripheral displays to passively radiate relevant context, like an information dashboard you glance at rather than interact with.

- **Related Items Display**: While you work on an artifact in your primary window, a secondary display automatically shows related documents, prior art, similar designs, linked tasks — the *neighborhood* of whatever you're focused on. It updates as you navigate, no action required.

- **Activity Feed**: A secondary display becomes a live activity feed — team members' recent changes, new comments on artifacts in your Space, AI-generated summaries of what's happened since your last session. It's ambient awareness.

- **Knowledge Graph View**: One display permanently shows a knowledge graph centered on your current artifact. As you move through Apollo, the graph re-centers and highlights connections. You never have to explicitly open the graph — it's always there, always contextual.

- **Timeline/History View**: A secondary display shows the temporal history of the current artifact or project — when things were created, modified, discussed, decided. A living timeline that contextualizes your current work.

### 4. Presentation & Collaboration

**The idea**: Multi-display setups are natural for presentations and collaborative reviews.

- **Presenter/Audience Mode**: When presenting a prototype, your "presenter" monitor shows the prototype with notes, next steps, and controls. The "audience" monitor (or shared screen) shows only the clean prototype. Like PowerPoint's presenter view, but for any Apollo artifact.

- **Facilitator Dashboard**: During a design review or sprint planning, one display shows the artifact being discussed, another shows a facilitator view with agenda, time remaining, action items being captured in real-time, and AI-generated summary of the discussion so far.

- **Comparison View**: Put two versions of a prototype, document, or design side by side — each on its own monitor, synchronized to the same scroll position or page. Perfect for design reviews and before/after comparisons.

### 5. Saved Layouts & Workstations

**The idea**: A multi-window arrangement is itself an artifact worth saving and recalling.

- **Workstation Presets**: Save your current multi-display arrangement — which windows are open, what each is showing, their sizes and positions — as a named "Workstation." Examples: "Deep Research" (documents + knowledge graph + chat), "Sprint Planning" (backlog + timeline + discussion), "Design Review" (prototype + context panel + comments).

- **Space-Linked Layouts**: When you enter a Space, Apollo can automatically arrange your windows into the layout associated with that Space. Your "Platform Team" Space might always open with tasks on the left monitor and the team's Figma board on the right.

- **Quick Recall**: A keyboard shortcut (or voice command) to instantly recall a saved Workstation. "Apollo, switch to research mode." All windows rearrange themselves.

- **Shareable Layouts**: Export a Workstation configuration as JSON and share it with your team. "Here's the layout I use for customer interview synthesis" — a teammate imports it and their three monitors arrange themselves the same way.

### 6. AI-Augmented Display Management

**The idea**: Let AI help decide what to show on your secondary displays.

- **Proactive Context**: AI notices you're writing a requirements document and proactively surfaces related user research, prior discussions, and similar features on your secondary displays. You don't have to ask — it anticipates what you'll need to reference.

- **Focus Mode**: Tell Apollo "I'm focusing on this task" and AI dims/minimizes everything on secondary displays that isn't directly relevant. It becomes a distraction reducer across your entire desk, not just one window.

- **Smart Suggestions**: A small panel on a secondary display shows AI suggestions: "You might want to look at this related document," "This Slack thread from last week is relevant," "The team discussed a similar problem here." Unobtrusive, always there, always contextual.

- **Meeting Preparation**: Before a meeting, AI auto-populates your secondary displays with the artifacts, notes, and context you'll need based on the meeting agenda and participants. You sit down and everything is already there.

### 7. Knowledge Explorer Extensions

**The idea**: Apollo's core vision is seeing connections between entities. Multiple displays amplify this.

- **Entity Deep Dive**: Click on any entity (person, project, technology, concept) in your primary window. Secondary windows explode outward to show all the *facets* of that entity — documents they authored, meetings they attended, tasks they're involved in, Slack channels they're active in, designs they commented on. One click, total context.

- **Connection Visualization**: Primary window shows Entity A. Secondary window shows Entity B. A third window shows the *connections* between them — shared documents, meetings they both attended, threads where they interacted, artifacts they both touched. The relationship becomes spatial.

- **Lateral Exploration**: As you explore a topic, related-but-tangential items appear on secondary displays. You might be looking at a design spec, and a peripheral display shows the customer feedback that inspired it, the competitive analysis that framed it, and the engineering constraints that shaped it. It's like peripheral vision for knowledge.

### 8. Development & Debugging

**The idea**: For developers and power users building Apollo apps or debugging workflows.

- **Live Component Inspector**: One display shows the running app, another shows a live component tree, props, and state — like React DevTools but spatially separated and always visible.

- **API Monitor**: A secondary display shows live API calls, WebSocket messages, and data flow in real-time as you interact with the primary window. No need to open/close DevTools.

- **Multi-App Preview**: When developing a modular Apollo app, see the app's manifest, code, and live preview simultaneously across three displays.

---

## Technical Exploration

### How Windows Find Each Other

**Option A: BroadcastChannel (simplest)**
```
Window A ──┐
Window B ──┼── BroadcastChannel('apollo-displays') ──► All windows hear all messages
Window C ──┘
```
- Browser-native, no server needed
- Same-origin only (which is fine for localhost)
- Simple pub/sub messaging
- No persistence — if all windows close, state is lost

**Option B: WebSocket Hub (most capable)**
```
Window A ──┐                    ┌── Display Registry
Window B ──┼── WebSocket ──► Express Server ──┤── State Coordination
Window C ──┘                    └── AI Suggestions
```
- Server maintains the display registry
- Can persist layout state
- AI service can participate in coordination decisions
- Server already exists — just add a WebSocket endpoint

**Option C: SharedWorker (middle ground)**
```
Window A ──┐
Window B ──┼── SharedWorker ──► Single coordination thread
Window C ──┘
```
- Runs in-browser, no server changes needed
- Survives page reloads (the worker persists)
- More capable than BroadcastChannel (can maintain state)
- Not supported in all browsers

**Recommendation**: Start with **BroadcastChannel** for basic awareness (it's trivial to implement), then add **WebSocket coordination** when we need server-side intelligence (AI suggestions, persistent layouts).

### The Display Registry

Every Apollo window, on load, announces itself:
```json
{
  "windowId": "w-abc123",
  "page": "/spaces/platform-team/tasks",
  "space": "platform-team",
  "role": "primary",
  "viewport": { "width": 2560, "height": 1440 },
  "screen": { "index": 1, "left": 0, "top": 0 }
}
```

The server (or SharedWorker) maintains a live registry:
```json
{
  "displays": [
    { "windowId": "w-abc123", "page": "/tasks", "role": "primary", "screen": 1 },
    { "windowId": "w-def456", "page": "/documents", "role": "companion", "screen": 2 },
    { "windowId": "w-ghi789", "page": "/canvas", "role": "companion", "screen": 3 }
  ],
  "layout": "research-deep-dive",
  "linked": true
}
```

### Window Management API

The [Window Management API](https://developer.chrome.com/docs/capabilities/web-apis/window-management) (Chrome 100+) enables:
- Detecting all connected screens and their geometry
- Requesting permission to place windows on specific screens
- Opening new windows at exact positions on specific monitors

This could enable "one-click setup" — Apollo opens and arranges all the windows for you when you activate a Workstation preset.

---

## Design Questions

1. **Opt-in or automatic?** Should display coordination be automatic when multiple windows are detected, or should the user explicitly "link" their windows?
   - *Leaning*: Automatic detection with an easy toggle to disable. Show a subtle indicator when other windows are detected.

2. **How prominent should the multi-display UI be?** Should there be a visible "display manager" panel, or should it be mostly invisible and contextual?
   - *Leaning*: Mostly invisible. A small icon in the masthead showing the number of connected displays, with a popover to manage them.

3. **What's the MVP?** What's the simplest useful version of this concept?
   - *Candidate MVP*: BroadcastChannel-based awareness + "open related" action that opens a related artifact in a new window + a display indicator in the masthead.

4. **Should windows have explicit roles?** (primary, companion, ambient) Or should roles emerge from behavior?
   - *Leaning*: Start with implicit roles based on which window the user is actively interacting with. Allow explicit role assignment later.

5. **How does this interact with Spaces?** If I switch Spaces on one window, should all linked windows switch too?
   - *Leaning*: Yes, by default. But with a toggle to "unlink" a window so it stays in its current Space.

6. **Privacy of peripheral displays?** In an open office, what if I don't want my secondary displays broadcasting information to passersby?
   - *Consideration*: A "privacy mode" that dims or blurs peripheral displays when you're not looking at them (could use the Idle Detection API or simply a hotkey).

---

## Connections to Apollo's Existing Concepts

### Spaces
Extended Displays are a natural evolution of Spaces. Today, a Space filters what you see *within a single viewport*. Extended Displays let a Space *fill your entire physical workspace*. Your Space isn't just a filter — it's a *room* you step into, where every monitor shows a different wall of context.

### Composable Artifacts
If artifacts are composable, they should be composable across displays too. An extended canvas where nodes on monitor 1 connect to nodes on monitor 2. A document on one screen with its discussion thread on another. Composability isn't just about data formats — it's about spatial arrangement.

### Dynamic Knowledge Repositories
A DKR is a living, evolving record of a project. Extended Displays let you see more of that record at once — the current state on one screen, the timeline on another, the discussions on a third. You're not looking at the DKR through a keyhole anymore; you're stepping inside it.

### AI as Augmentation
AI can be far more helpful when it has more real estate. Instead of competing with your primary work for screen space, AI suggestions can live on a dedicated companion display — always visible, never intrusive. This is the "proactive but reviewed" philosophy taken to its spatial conclusion.

### Home-Cooked Software
Workstation presets could be shared as JSON files — another open-format artifact. A team lead could share their "sprint planning layout" with the team. A researcher could share their "literature review layout." These layouts become recipes — home-cooked configurations for specific workflows.

### Local-First Advantage
This whole concept is dramatically simpler when everything is local. No latency in cross-window coordination. No cloud service needed to track window state. The local Express server is the perfect coordination hub — it's already running, it already knows about the user's data, and it's on the same machine as all the displays.

---

## Inspirations & Prior Art

- **Bloomberg Terminal** — The canonical multi-display knowledge workspace. Traders have 4-6 monitors showing different data feeds, all coordinated. Bloomberg's success proves that multi-display coordination creates enormous productivity gains for information-heavy work.

- **Mission Control Centers** — NASA, SpaceX, power grid operators — these environments are designed around multi-display awareness. Different displays show different facets of the same system. Apollo (the project) could learn from Apollo (the program).

- **Oblong Industries / g-speak** — John Underkofts' (Minority Report UI designer) company built spatial operating environments where content flows between screens with hand gestures. The concept of spatial computing without the VR headset.

- **Figma's Multi-Window** — Figma allows opening a file in multiple windows/tabs that stay synced. But each window is still independent — there's no coordination between what they show.

- **VS Code Multi-Window** — VS Code lets you open multiple windows, and recent versions added some cross-window awareness. The concept of "workspaces" that span windows is similar to Workstation presets.

- **macOS Spaces / Mission Control** — OS-level window management that groups applications into virtual desktops. Extended Displays is like this but *within* Apollo — a knowledge-aware, content-aware window manager.

- **Bret Victor's "Seeing Spaces"** — The idea that creators need *rooms* filled with tools and visualizations, not single-window applications. "The tool doesn't define the workspace; the workspace defines the tools."

---

## Next Steps

1. **Prototype BroadcastChannel communication** between two Apollo windows — just have them announce their presence and current page to each other
2. **Design the display indicator** — a masthead icon showing connected displays
3. **Pick one use case** (probably "open related on secondary display") and build a minimal version
4. **User research** — talk to multi-monitor users about their actual workflows and pain points
5. **Evaluate Window Management API** browser support and permissions model

---

*This is a living document. Ideas should be added, challenged, and refined as the concept develops.*
