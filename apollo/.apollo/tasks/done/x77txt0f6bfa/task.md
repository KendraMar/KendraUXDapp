---
id: x77txt0f6bfa
title: Ask me questions to clarify the goals and purpose of Apollo and its artifacts
type: task
status: done
priority: medium
created: '2026-01-25'
due: null
assignees: []
labels:
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: null
starred: false
flag: null
---
# Ask me questions to clarify the goals and purpose of Apollo and its artifacts

## Description

Based on the documentation, design philosophy, and other files in this repo ask me some additional questions about the goals of this project and what it's trying to become to help us refine this project together. After I answer your questions please update the docs, philosophy, Intro to Apollo slide deck, etc. accordingly.

## Acceptance Criteria

- [x] Interview stakeholder (Andy Braren) about Apollo's vision and goals
- [x] Document key insights in this task
- [x] Update README with clearer positioning
- [x] Review and update design principles
- [x] Create Intro to Apollo slide deck
- [x] Review CONSTITUTION (no changes needed - already aligned)

## Technical Notes



## References



## History

- 2026-01-25: Created
- 2026-01-30: Conducted vision interview with Andy Braren
- 2026-01-30: Updated README, design principles, created Intro to Apollo slide deck

---

## Interview Summary: Apollo Vision & Goals

**Date**: 2026-01-30  
**Interviewee**: Andy Braren (Creator/Lead)  
**Interviewer**: AI Agent

### 1. Target Users & Use Cases

**Primary User**: Knowledge workers broadly — anyone who deals with lots of information from various sources, needs to understand context, collaborate with others, and work together on digital artifacts.

**Scale**: Apollo is designed to scale from individual practitioners to small teams to large enterprise organizations. The system scales with the amount of information it processes.

**Killer Workflow**: Catching up from PTO (or any absence). Today, returning from a week off might take another full week to catch up — wading through inbox, Slack, meetings, etc. Apollo's Feed:
- Looks across all information sources
- Summarizes what's actually still relevant
- Knows your interests and filters accordingly
- Points to specific moments (e.g., "minute 57 of this recording mentioned something you care about")
- Presents updates on a per-artifact basis (e.g., "these slides changed while you were gone")

The core value: **A system that knows your interests and filters noise to amplify signal.**

### 2. The "Integrated Design Environment" Concept

**Integration Model**: Apollo is a **hub that connects** various data sources (Slack, Jira, Figma, email, etc.) and pulls information together into one spot.

**Key Design Principle**: Unlike adapting to each tool's prescribed workflow and interface, Apollo pulls data into **the format and interface that makes sense to you**. The user can customize how information is presented.

**End State**: Users won't need to navigate to Slack/Jira/etc. nearly as often. Everything related to a topic is one click away — all context at your fingertips in a single, navigable space.

**Integration is primarily read-based** (pulling from sources), with some write-back capabilities (e.g., syncing tasks to Jira).

### 3. AI Agent Collaboration

**Proactivity**: Agents should proactively suggest things:
- Suggest tasks based on what they're seeing in the feed
- Identify relevant conversations and items to review
- Eventually: cron-job-like scanning of the feed waterfall

**Autonomy with Guardrails**:
- Agents can modify artifacts, but changes are **not applied/saved/shared without explicit human review**
- User sees original + suggested changes side-by-side
- Human always stays in the loop as the owner/maintainer
- The level of proactivity is customizable

**Multi-Agent**: Users may work with multiple agents simultaneously (like multiple Slack conversations). Expected to increase over time as the experience becomes more streamlined.

**What Makes Apollo's AI Unique**:
- This is your **workspace**, but collaborative with humans AND agents
- Not just a summary view — it's a **controllable algorithm** you control
- Filter noise, focus on signal, plan tasks, execute tasks, review artifacts
- **Dashboard-like experience**: review, approve (yes/yes/yes/no/no), provide feedback
- Multi-modal input: voice, drawing, sketching, typing
- Way less manual effort while keeping you in the loop and in control

### 4. Artifacts & Apps

**Apps**:
- Can include reusable page templates
- May include backend processors (not necessarily visible in nav, but have Settings pages)
- Like Obsidian plugins — installable from an application catalog (GitLab-based registry, not yet implemented)
- Settings page in Settings area for all installed apps

**Artifact Model**:
- Universal artifact formats for each type (slides, documents, canvas, recordings, etc.)
- Each artifact is a **bundle (folder)** containing:
  - JSON metadata
  - HTML/CSS/JS for visual presentation
  - Open, version-controlled formats
- Artifacts are shareable, collaborative entities
- Compatible with Apollo and potentially other applications
- Enables transformation/remixing between formats

### 5. Local-First & Privacy

**Spectrum of Options**:
1. **Fully local** — no cloud at all, local AI processing, stays on your computer
2. **Cloud-optional** — sync/share via Git repos (GitHub/GitLab) as the sharing mechanism
3. **Enterprise cloud** — controlled access, data lakes, immediate access revocation capabilities

**Collaboration Approaches**:
- Git repositories for version-controlled, review-gated artifacts
- CRDTs (Conflict-free Replicated Data Types) for real-time sync without centralized servers
- Selective sharing of specific documents

**UX Benefits of Local-First**:
- Immediate loading, super fast
- Works offline
- Privacy by default
- Reconnect and sync when ready

### 6. Differentiation & Positioning

**Most Similar To**: Obsidian
- Open data formats, file-based, local-first
- Plugin/app ecosystem
- User controls their data

**But Broader**: Can potentially replace many tools (Notion, Linear, Figma-like capabilities) through its customizable nature and app ecosystem.

**Category**: "IDE for knowledge work" (working title)
- Initially targeting designers
- Broader vision includes all knowledge workers
- Could also be described as "IDE for knowledge work and human-AI collaboration"

### 7. Success & Priorities

**6-Month Success Criteria**:
- UX design team actively using Apollo
- Some PMs and engineers onboard
- Robust internal product with multiple contributors
- Foundations for app ecosystem (build, share, download, collaborate)
- Less focus on underlying code/Git — more focus on knowledge work
- **Fewer meetings**
- **Less burnout**
- Feeling of coordination and productive collaboration
- Eventually: applying to other communities beyond Red Hat

**Most Important Problem to Solve First**:
1. **Core flow for designers** (initial target market):
   - Feed connecting to data sources
   - Feed → Tasks derivation
   - Tasks → Jira sync (automated, reduce toil)
2. **Key artifacts**:
   - **Prototypes** (first priority — lots of HTML/CSS/JS prototypes being built)
   - Slide decks
   - Recordings processing

### 8. Additional Clarifications

**Feed**: The "firehose filter" — central nervous system where all sources flow through, where AI summarization/prioritization happens.

**Spaces vs Apps**:
- **Space** = project/workspace container (like a lens or pre-canned filter)
- **Apps** = provide page templates, can be installed into spaces
- Spaces control default filters/context for pages within them
- Example: A feature-specific space shows only recordings/tasks/artifacts related to that feature

**Discussions/Conversations**:
- "Conversations" section in left nav = AI agent chats
- "Discussions" on artifacts = async comment threads with humans and AI on specific artifacts (not fully implemented yet)
- These may eventually merge/connect

**Tagline (working)**: "An IDE for knowledge work"
