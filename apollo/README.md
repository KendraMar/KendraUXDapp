![A photograph of Earth taken from the surface of the moon by William Anders during the Apollo 8 mission, resembling a blue marble floating in the darkness of space.](src/assets/banner-earthrise.png)

# Apollo

**A system for augmented knowledge work.**

<!-- Tagline options — pick one, delete the rest -->
<!-- An augmentation system for dynamic knowledge work.
- A system for collective wisdom.
- A tool for collaborative knowledge work
- A system for working with collective wisdom.
- A system for building collective wisdom.
- A system for collective problem-solving tool that turns collective wisdom into...
- A tool that turns collective wisdom into...
- A system to turn collective wisdom into  for working with collective wisdom.
- A tool to augment collaboration through collective wisdom.
- An open source system for augmented knowledge work.
- An open system for augmented collaboration.
- An open workspace for augmented knowledge work.
- An augmented workspace for knowledge teams.
- An augmented system for collaborative knowledge work.
- An open source system for augmented teamwork.
- Where scattered context becomes shared knowledge.
- Open tools for people who make things.
-->

## Overview

Apollo is a local-first, fully-customizable system for knowledge workers who need to gather information from many different sources and collaborate with others on digital artifacts. It's an "integrated design environment" that leverages AI to filter noise, surface signal, and augment the way you work.

Just as GitHub became the place for developers to collaborate on code, Apollo aims to become the place for multidisciplinary teams to collaborate on all kinds of artifacts — prototypes, slide decks, documents, research, and more.

### The Problem

Modern knowledge work means drowning in fragmented information. Your context is scattered across Slack, Jira, email, Figma, Google Docs, meeting recordings, and a sea of browser tabs. Each tool has its own interface, its own prescribed workflow, its own way of demanding your attention.

**The key scenario**: You return from a week of PTO. Catching up takes another full week — wading through your inbox, unread Slack messages, Jira notifications, meeting recordings you missed. And if you were gone for two weeks? Good luck. You may never fully catch up.

### Apollo's Approach

Apollo is your **firehose filter**. It pulls information from all your sources into one place, then uses AI to:

- **Know your interests** and filter accordingly
- **Summarize what's relevant** so you can scan instead of read
- **Surface what matters** — "This recording mentioned something you care about at minute 57"
- **Show changes per-artifact** — "Here's what changed in this slide deck while you were gone"

The result: Instead of adapting your brain to each tool's interface, Apollo presents information in the format that makes sense to *you*. Everything related to a topic is one click away — all context at your fingertips.

### A Shared Space for Humans and Agents

Apollo is a collaborative environment where humans and AI agents work together. Agents proactively suggest tasks, identify relevant items, and can even modify artifacts — but nothing is applied without your explicit review. It's a **controllable algorithm**: you control the filtering, review the suggestions, and stay in the loop. See [AI as Augmentation](docs/design/principles.md#ai-as-augmentation) for the full philosophy.

## The Vision

Apollo unifies scattered context into a single workspace where teams can:

- **See the full picture** — All relevant artifacts, conversations, and context in one place
- **Move faster together** — AI-powered summarization reduces cognitive overhead
- **Build on collective wisdom** — Cross-link insights, prototypes, and decisions
- **Remix and transform** — Translate between formats (docs → slides, research → journey maps, specs → prototypes)
- **Ship with confidence** — Maintain alignment from discovery to delivery

### Dynamic Knowledge Repositories

When teams collaborate in Apollo, their shared artifacts live in **Dynamic Knowledge Repositories** (DKRs) — a concept directly inspired by [Doug Engelbart's vision](https://dougengelbart.org/content/view/190/) for living, rapidly evolving repositories that capture everything accumulating throughout a project's life. A DKR isn't a static archive — it's the emerging collective record of successive drafts, design rationale, commentary, research, and all the artifacts a team produces together.

Under the hood, DKRs are Git repositories — but Git is a background detail. What you experience is a shared collaboration space where artifacts are versioned, browsable, and always current. You can go back in time, trace decisions to the discussions that produced them, and understand how your project's knowledge evolved. See [Dynamic Knowledge Repositories](docs/design/principles.md#dynamic-knowledge-repositories) for the full philosophy.

### Spaces: Your Lenses on Information

Apollo organizes work into **Spaces** — project or topic containers that act as pre-configured filters. When you're in a Space devoted to a specific feature, the recordings page shows meetings about that feature. The tasks page shows relevant tasks. Everything is automatically scoped to what you care about right now.

> [!IMPORTANT]
> Apollo is a highly experimental work-in-progress exploring what an agentic, AI-augmented design environment could look like. It is not production-ready. The code and documentation are evolving rapidly.

## Core Capabilities

### 🏠 Unified Workspace

Apollo pulls together context from the tools your team already uses:

| Integration | What it provides |
|-------------|-----------------|
| **Slack** | Channels, DMs, and threads with unread tracking |
| **Jira** | Tasks assigned to you with AI-powered summaries |
| **Figma** | Design files, version history, and comments |
| **Google Calendar** | Upcoming meetings and events |
| **GitLab** | Repositories, merge requests, and pipelines |
| **Confluence** | Wiki pages and documentation |
| **Google Drive** | Video recordings of meetings and user sessions |
| **RSS Feeds** | Industry news, YouTube channels, and blogs |

### 🤖 AI Augmentation

Apollo uses local AI models (via ramalama) to augment your workflow while keeping data private:

- **Feed Summarization** — AI-generated "skims" of emails and messages
- **Task Analysis** — Understand Jira issues at a glance with generated summaries
- **Chat Assistant** — Conversational AI with reasoning transparency (collapsible think blocks)
- **Multi-Modal Input** — Voice, typing, drawing — work however you prefer

AI in Apollo is [proactive but reviewed](docs/design/principles.md#ai-as-augmentation) — agents suggest, you decide.

### 🔄 Artifact Remixing

People prefer to receive information in different formats. Executives want a slide deck. Engineers want a spec. Designers want a journey map. Stakeholders want a prototype they can click through. This is why so much of knowledge work is *translation* — taking content in one format and transforming it into another. Apollo makes this nearly instant:

| From | To | Use Case |
|------|-----|----------|
| **Document** | Slides | Turn a proposal or research summary into a presentation |
| **Research Notes** | Journey Map | Synthesize user interviews into a visual customer journey |
| **Requirements** | Prototype | Generate an interactive mockup from a spec or user story |
| **Meeting Recording** | Tasks | Distill a long discussion into actionable steps in Jira |
| **Slides** | Document | Expand a deck into detailed documentation |
| **Journey Map** | User Stories | Extract backlog items from a mapped experience |

This "translational knowledge work" traditionally consumes significant effort. With AI augmentation, these transformations become immediate. See [Composable Artifacts](docs/design/principles.md#composable-artifacts) for how Apollo's open-format approach enables this.

### 🎨 Prototype Viewer

An integrated environment for reviewing and discussing interactive prototypes. Apollo can download and run any code repository with a properly-formatted `.design` folder included within it:

- **Embedded Prototypes** — View live prototypes directly within Apollo
- **Product & Release Switching** — Toggle between different product lines and versions
- **Context Panel** — Per-page descriptions, design rationale, and iteration history
- **Threaded Discussions** — Collaborate with inline comments and decision tracking

### 📊 Visual Canvases

Create and explore node-based diagrams using the open [JSON Canvas](https://jsoncanvas.org/) format:

- **Mind Maps** — Organize ideas and relationships visually
- **Flowcharts** — Document user flows and system architectures
- **Obsidian Compatible** — Works with canvases created in Obsidian

### 📹 Recordings Library

Manage and transcribe related video/audio recordings:

- **Google Drive Import** — Pull recordings directly from Drive
- **Video & Audio Support** — MP4, WebM, MP3, WAV, and more
- **Local Transcription** — Transcribe using whisper.cpp (coming soon)

### 📰 Intelligent Feed — The Firehose Filter

The Feed is Apollo's central nervous system — where all your information sources flow through and get filtered:

- **Multi-Source Aggregation** — Email, Slack, Jira, and more in one stream
- **Interest-Aware Filtering** — The system learns what you care about and surfaces it
- **AI Summaries** — Quick AI-generated previews so you can scan instead of read
- **Per-Artifact Updates** — See exactly what changed while you were away
- **Deep Links** — Jump directly to the relevant moment ("minute 57 of this recording")
- **Full Context** — Expand to see complete message content when needed

## Getting Started

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **ramalama** (for AI features) — [Install ramalama](https://ramalama.ai)

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd apollo

# Launch Apollo
./start.sh
```

That's it. The start script handles dependency installation, preflight checks, and launches the dev server. Apollo will be available at **http://localhost:1225**.

> [!TIP]
> If you prefer running things manually: `npm install && npm run dev`

### Configuration

Edit `data/config.json` to connect your integrations:

```json
{
  "ai": {
    "apiUrl": "http://localhost:11434/api",
    "model": "llama3.2"
  },
  "jira": {
    "baseUrl": "https://your-jira-instance.atlassian.net",
    "email": "you@company.com",
    "apiToken": "your-api-token"
  },
  "slack": {
    "xoxc": "your-xoxc-token",
    "xoxd": "your-xoxd-token"
  },
  "figma": {
    "accessToken": "your-figma-token",
    "teamId": "your-team-id"
  },
  "google": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret"
  }
}
```

See the individual integration guides in `/docs` for detailed setup instructions.

## Design Principles

Apollo is guided by core principles that shape every design decision. For the full philosophy, see [Design Principles](docs/design/principles.md).

| Principle | Summary |
|-----------|---------|
| [**User Control**](docs/design/principles.md#user-control) | You control your interface and data. Nothing happens without your intent. |
| [**Multi-Modal & Customizable**](docs/design/principles.md#multi-modal--fully-customizable) | Every input method, every UI element, every feature is configurable. |
| [**Local-First**](docs/design/principles.md#local-first) | Instant responsiveness, offline capability, and AI-ready architecture. |
| [**Signal Over Noise**](docs/design/principles.md#signal-over-noise) | Consolidate fragmented information into one coherent interface. |
| [**AI as Augmentation**](docs/design/principles.md#ai-as-augmentation) | Proactive but reviewed—AI suggests, you decide. |
| [**Home-Cooked Software**](docs/design/principles.md#home-cooked-software--barefoot-developers) | Empowering barefoot developers to build local, purpose-built tools. |
| [**Dynamic Knowledge Repositories**](docs/design/principles.md#dynamic-knowledge-repositories) | Shared repos as living records of a project's collective knowledge, inspired by Engelbart. |
| [**Composable Artifacts**](docs/design/principles.md#composable-artifacts) | Open formats (HTML, JSON, Markdown) enable seamless interoperability. |

## Roadmap

Apollo is actively evolving. Planned capabilities include:

### Artifact Remixing
- [ ] **Doc → Slides** — Generate presentation decks from documents
- [ ] **Research → Journey Maps** — Synthesize interviews into visual journeys
- [ ] **Spec → Prototype** — Create interactive mockups from requirements
- [ ] **Recording → Summary** — AI-generated meeting notes and action items
- [ ] **Multi-Format Export** — One-click transformation to any supported format
- [ ] **Remix Templates** — Customizable transformation rules and styles

### Research & Insights
- [ ] **Leaderboard of Pain** — AI-ranked user needs across products
- [ ] **Deep Research Interface** — Ad-hoc query capabilities for user research
- [ ] **Cross-Product Insight Mining** — Pattern detection across product lines
- [ ] **Automated Research Synthesis** — Real-time processing of user feedback

### Media & Prototypes
- [ ] **Local Transcription** — Whisper.cpp integration for meeting recordings
- [ ] **Component Palette** — Drag-and-drop component addition to prototypes
- [ ] **Fidelity Modes** — Toggle prototype fidelity (wireframe, high-fidelity)
- [ ] **Design History** — Version tracking and diff visualization

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Support

For questions, issues, or contributions, please refer to the project's issue tracker or contact the maintainers listed in [OWNERS](OWNERS).

## Citations

*Earthrise photograph taken by astronaut William Anders during the Apollo 8 mission on December 24, 1968. Image source: [Wikipedia - Earthrise](https://en.wikipedia.org/wiki/Earthrise)*