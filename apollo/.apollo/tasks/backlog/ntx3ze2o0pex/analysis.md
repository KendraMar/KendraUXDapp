# Apollo x Open Decision Framework: A Systems Analysis

> Initial exploration of how Apollo could operationalize the Open Decision Framework using AI and agent technologies, connecting to Doug Engelbart's vision for augmenting collective intelligence.

## Table of Contents

- [The Core Insight](#the-core-insight)
- [Where the ODF Breaks Down (and Where Apollo Fills the Gap)](#where-the-odf-breaks-down-in-practice-and-where-apollo-fills-the-gap)
  - [The Common Fact Base Problem](#1-the-common-fact-base-problem)
  - [The Diverse Perspectives Problem](#2-the-diverse-perspectives-problem)
  - [The Transparency Problem](#3-the-transparency-problem)
  - [The "Release Early, Release Often" Problem](#4-the-release-early-release-often-problem-for-decisions)
- [The Engelbart Connection](#the-engelbart-connection)
- [What an ODF App Could Look Like](#what-an-odf-app-for-apollo-could-look-like)
- [The Scale That Wasn't Possible Before](#the-scale-that-wasnt-possible-before)
- [Concrete Next Steps](#concrete-next-steps)
- [The Bigger Picture](#the-bigger-picture)

---

## The Core Insight

The Open Decision Framework (ODF) is a *process framework* — it describes **what** open decision-making looks like across four phases (Ideate → Research → Develop → Launch), but it relies entirely on humans to do the heavy lifting: gathering perspectives, synthesizing feedback, maintaining transparency, building the "common fact base," and tracking how decisions evolve. It was designed in 2012–2014, when the best available tool for this was a Google Calendar memo-list.

Apollo is already, almost by accident, an **operational substrate** for exactly this kind of work. The overlap is not superficial — it's structural.

---

## Where the ODF Breaks Down in Practice (and Where Apollo Fills the Gap)

### 1. The Common Fact Base Problem

The ODF's most powerful artifact is the **Common Fact Base** — a living document that gives all stakeholders (past, present, future) a shared understanding of facts about a decision. The [template](https://github.com/open-organization/open-decision-framework/blob/master/common-fact-base-template/CommonFactBase_Master_External.md) includes: problem statement, stakeholders, timeline, requirements, constraints, assumptions, risks, decision criteria, tradeoffs, feedback gathered, and research.

**In practice, these documents rot.** They're created once, shared in a wiki, and become stale within days because maintaining them is manual labor that competes with the actual work of making the decision.

**Apollo already has the primitives to make a Common Fact Base self-maintaining:**

- The **Space Context system** (`src/lib/SpaceContext.js`) aggregates sources (Jira projects, Slack channels, Figma files, Confluence pages, GitLab repos) into a single scoped view. A "decision space" could automatically pull in every artifact relevant to a decision.
- The **Feed system** with AI summarization ("skim" and "summarize" endpoints) can continuously synthesize activity from those sources into a digestible stream.
- The **Dashboard data transforms** (`src/pages/components/dashboard/dataTransforms.js`) already normalize data from Jira, Slack, GitLab, Figma, and more into widget-friendly shapes.
- The **.apollo/tasks system** tracks work items with relationships (`blocks`, `blocked_by`, `related`, `parent`) — exactly the dependency graph a complex decision needs.

**What AI agents could do:** Continuously update a Common Fact Base by watching the sources configured in a decision space, summarizing new developments, flagging when assumptions are invalidated by new data, and maintaining a living timeline. The Common Fact Base becomes a *derived artifact* — always current, never needing manual updates.

### 2. The Diverse Perspectives Problem

The ODF repeatedly emphasizes seeking out "diverse and underrepresented perspectives" and engaging "potential detractors." But in practice, decision-makers don't know who to ask, forget to ask, or ask too late.

**Apollo's architecture could make this structural rather than aspirational:**

- The **Discussions app** (`data/apps/discussions/`) already supports threaded conversations with voting (thumbs up/down), pinning, and resolution status. But it's currently disconnected from the decision-making process.
- The **governance system** (`.apollo/governance/`) already defines decision types, voting thresholds, and roles (maintainers, stewards, contributors). This is remarkably close to the ODF's OPT model (Owner, Participant, Team).
- An agent could **analyze the stakeholder map** for a decision (who's affected based on the sources and teams involved) and **proactively invite relevant voices** that haven't been heard yet. It could notice: *"This decision affects the infrastructure team, but no one from infrastructure has commented."*

### 3. The Transparency Problem

The ODF says to "publish your ideation process," "publish decision factors and their relative importance," and "publish progress in an open place." Most organizations fail at this because the overhead of documentation is high and the incentive is low (transparency creates vulnerability).

**Apollo's `.design/` system is already a transparency engine:**

- Design history entries are timestamped, typed (`[Decision]`, `[Feedback]`, `[Meeting]`), and linked to code paths via `feature-mapping.md`.
- The `.apollo/decisions.md` ADR log captures context, decision, consequences, and alternatives considered.
- An AI agent could **automatically generate transparency artifacts** by observing conversations in Discussions, synthesizing positions, and publishing a "state of the decision" that shows who participated, what was debated, what changed as a result of feedback, and what was decided and why.

### 4. The "Release Early, Release Often" Problem for Decisions

The ODF borrows "release early, release often" from open source and applies it to decisions — share your thinking early, iterate based on feedback. But organizations default to "decide then announce" because sharing half-formed ideas feels risky.

**Apollo's prototype system + AI could lower the cost of early sharing:**

- The **Prototypes app** (`data/apps/prototypes/`) already supports creating prototypes with linked discussions and design context.
- An agent could help decision-makers draft **"release candidates" of a decision** — structured proposals that explicitly mark assumptions, invite feedback on specific questions, and track how the proposal evolves through iterations. Each iteration is versioned (the Documents app already has revision history via Yjs).
- The Feed could surface these decision drafts to relevant stakeholders with AI-generated "what changed since you last looked" summaries.

---

## The Engelbart Connection

Doug Engelbart's vision wasn't just about individual augmentation — it was about **augmenting the collective IQ of organizations**. His NLS/Augment system was designed for exactly this: structured argumentation, linked knowledge, collaborative editing of shared understanding. He called it the "improvement infrastructure" — systems that help groups get better at getting better.

The ODF is, in essence, an *analog* version of what Engelbart envisioned. It's a process for structured collective intelligence. But it operates at human speed and human scale.

**Apollo + AI agents could operationalize Engelbart's vision in three ways the ODF alone cannot:**

1. **Continuous Synthesis**: Instead of periodic human summarization, agents can maintain a real-time synthesis of all inputs — the "common fact base" becomes a living thing that reflects the latest state of knowledge. When someone from Tokyo adds a comment at 3am, the fact base updates before the New York team wakes up.

2. **Bridge-Building Between Perspectives**: The hardest part of inclusive decision-making is that people express themselves differently, use different jargon, and frame problems from different angles. An agent that has read all the inputs can identify: *"Person A and Person C are actually making the same point in different language"* or *"Person B's concern about timeline directly conflicts with Person D's assumption about scope — this tension needs resolution."*

3. **Institutional Memory Across Decisions**: The ODF's "Contribute upstream" phase asks teams to publish lessons learned so future decisions can benefit. In practice, these archives are write-only. With Apollo's `.apollo/decisions.md` ADR log and AI retrieval, an agent could surface: *"A similar decision was made 6 months ago about X — here's what was learned, here's what went well, here's what was regretted."*

---

## What an ODF App for Apollo Could Look Like

Given Apollo's modular app architecture (`data/apps/`), this could be a self-contained app.

**Core concept: A "Decision Room" — a space-like construct purpose-built for an open decision.**

| ODF Concept | Apollo Implementation |
|---|---|
| **Common Fact Base** | Auto-generated from Space sources + AI synthesis; living document |
| **Stakeholder Map** | Derived from source integrations (who's in the Slack channels, Jira projects, etc.) |
| **Decision Phases** | Kanban-style progression: Ideate → Research → Develop → Launch |
| **Feedback Channels** | Discussions app, threaded per phase, with voting |
| **Transparency** | Auto-generated decision timeline showing what was shared, when, with whom |
| **Premortem** | AI-facilitated exercise: "What could go wrong?" with structured risk capture |
| **Decision Criteria** | Weighted criteria with stakeholder visibility into how they're applied |
| **Maturity Assessment** | Self-assessment against ODF maturity model, tracked over time |
| **"Contribute Upstream"** | Auto-archive to `.apollo/decisions.md` with searchable lessons learned |

### Potential Manifest Structure

```json
{
  "id": "decisions",
  "displayName": "Decisions",
  "description": "Open decision-making powered by the Open Decision Framework",
  "enabled": true,
  "navItem": {
    "path": "/decisions",
    "displayName": "Decisions",
    "icon": "UsersIcon"
  },
  "routes": [
    { "path": "/decisions", "page": "Decisions" },
    { "path": "/decisions/:id", "page": "DecisionRoom" }
  ],
  "apiRoutes": true,
  "widgets": [
    {
      "id": "active-decisions",
      "type": "list",
      "displayName": "Active Decisions",
      "dataEndpoint": "/api/decisions/active",
      "dataTransform": "decisionList"
    }
  ]
}
```

### Decision Room Components

1. **Overview Panel** — Problem statement, objectives, phase indicator, stakeholder map
2. **Common Fact Base** — AI-maintained, continuously updated from linked sources
3. **Perspectives Board** — Threaded feedback organized by stakeholder group, with AI-generated synthesis
4. **Criteria Matrix** — Weighted evaluation criteria with transparency into how options score
5. **Timeline** — Chronological view of all activity, contributions, and changes
6. **Premortem Tool** — Structured "what could go wrong?" exercise with risk aggregation
7. **Decision Archive** — When closed, auto-generates an ADR and lessons-learned document

---

## The Scale That Wasn't Possible Before

The ODF was designed for a single organization (Red Hat) making decisions among associates. With AI agents:

- **Cross-organizational decisions** become tractable. An agent can synthesize perspectives from different organizations with different cultures, terminologies, and processes — acting as a translator and bridge-builder.

- **Asynchronous global participation** becomes first-class. The agent maintains the synthesis; participants contribute when they can; nobody has to attend a meeting at 3am to have their voice heard.

- **Historical pattern recognition** becomes possible. *"Decisions like this one tend to fail when X perspective is excluded"* — learned from the archive of past decisions.

- **The "didn't know to ask" problem** dissolves. An agent monitoring the decision space can identify affected parties that the decision-makers didn't think of, based on the dependency graph of the organization's systems, projects, and people.

- **Language and framing barriers** diminish. An agent can translate not just between natural languages, but between professional vocabularies, framings, and levels of abstraction — making an engineer's concern legible to a designer and vice versa.

---

## Concrete Next Steps

1. **Read the ODF maturity model** (only available as PDF/ODT) and map its dimensions to measurable signals in Apollo's data model.

2. **Prototype a "Decision" entity type** in `.apollo/tasks/` — extend the task system with decision-specific metadata (criteria, stakeholders, phases, feedback channels). Alternatively, a new `data/decisions/` store.

3. **Create an ODF app** in `data/apps/decisions/` that provides a structured decision-making workflow backed by Space Context.

4. **Build an AI agent prompt** that can maintain a Common Fact Base by watching a decision space's sources and generating periodic synthesis.

5. **Connect the Discussions app** to decision phases — make it so feedback on a decision is threaded, tracked, and explicitly shows what changed as a result.

6. **Design a "Decision Room" UI** using PatternFly 6 components — the overview panel, fact base, perspectives board, criteria matrix, and timeline.

7. **Explore upstream contribution** — could Apollo's implementation of the ODF be contributed back to the Open Organization as a reference implementation or case study?

---

## The Bigger Picture

The relationship isn't just "Apollo could implement the ODF." It's that **the ODF describes the *process* and Apollo provides the *system* — and AI agents are the missing connective tissue that makes the process executable at a scale and speed that wasn't possible when the framework was written in 2014.**

The ODF was aspirational in many ways — it asked organizations to do things (maintain common fact bases, seek diverse perspectives, be transparent about tradeoffs, learn from past decisions) that are genuinely hard for humans to sustain. Apollo's architecture — particularly the space context system, the governance model, the AI synthesis capabilities, and the modular app system — creates the possibility of making those aspirations *structural*: baked into the system rather than dependent on individual discipline.

This is precisely the Engelbart vision: not replacing human judgment, but building an "improvement infrastructure" that amplifies the collective intelligence of groups making decisions together. The ODF provides the philosophy. Apollo provides the substrate. AI provides the connective tissue that makes it work at scale.

---

## References

- [Open Decision Framework (GitHub)](https://github.com/open-organization/open-decision-framework)
- [ODF Community Markdown](https://github.com/open-organization/open-decision-framework/blob/master/ODF-community.md)
- [Common Fact Base Template](https://github.com/open-organization/open-decision-framework/blob/master/common-fact-base-template/CommonFactBase_Master_External.md)
- [The Open Organization](https://theopenorganization.org/)
- [Doug Engelbart's "Augmenting Human Intellect" (1962)](https://www.dougengelbart.org/content/view/138)
- [Apollo Space Context Architecture](../../docs/architecture/space-context.md)
- [Apollo Governance System](../../governance/)
