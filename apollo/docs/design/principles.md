# Apollo Design Principles

These principles guide how Apollo is designed and built—not from a technical perspective, but from a human-centered one.

## User Control

Apollo puts you in control of your interface and your data. You can customize navigation order, choose which features to use, and decide when to invoke AI-powered tools. The application adapts to your workflow rather than forcing you into a prescribed way of working. Nothing happens without your intent.

## Multi-Modal & Fully Customizable

Apollo is not an opinionated application—it's a framework. Every interaction modality is supported: keyboard, voice input, touch, stylus, drawing on screen, or any combination that works for you. The masthead includes a microphone for voice input. Mobile, desktop, tablet—Apollo meets you where you are.

But it goes deeper than input methods. Every element of Apollo is customizable: the navigation structure, the logo, the feature set, even the onboarding experience. The very first time you launch Apollo, you can reshape its fundamental structure. This isn't configuration-as-afterthought—it's configuration-as-architecture.

At its core, Apollo is an API-level framework that provides steady access to integrations (Slack, Jira, Figma, Calendar, and more) while remaining radically unopinionated about how you present and interact with that data. It's not "use the system like this"—it's "build the system you need."

## Local-First

Inspired by the [Local-First Software](https://www.inkandswitch.com/local-first/) movement, Apollo is designed to run entirely on your machine. But local-first isn't just about privacy—it's fundamentally about providing a **better user experience**.

### Instant Responsiveness

The most important reason for local-first is **speed**. When your data lives locally, everything loads in [under 100 milliseconds](https://www.nngroup.com/articles/response-times-3-important-limits/). There are no loading spinners. No waiting for network round-trips. No "Jira is taking forever to load" moments. No anxiety about whether your crappy internet connection will hold up long enough to save your work.

This instant responsiveness transforms how you interact with information. Navigation feels immediate. Search results appear as you type. Context switches happen without friction. The interface gets out of the way and lets you focus on the work itself.

Compare this to typical cloud-first tools: every click requires a network request, every action introduces latency, and the entire experience degrades when your connection is slow, unstable, or offline entirely. Local-first eliminates this entire class of problems.

### Private AI-Ready Architecture

With all your data stored locally in open formats, it becomes immediately accessible to AI systems and agents. Local models can read your files, understand your context, and assist your work—without sending your data to external servers, waiting for API rate limits, or depending on third-party service availability.

This is a key enabler for the kind of AI augmentation Apollo provides: agents that can proactively surface relevant information, suggest tasks, and help you navigate your knowledge base—all running locally, all instantly responsive.

### Privacy by Default

Your data stays with you—stored locally in your filesystem, not on someone else's server. This ensures privacy by default and means the application works offline, without dependencies on external services you don't control.

### Collaboration Without Compromise

Local-first and real-time collaboration are **not mutually exclusive**. Technologies like CRDTs (Conflict-free Replicated Data Types) enable synchronization between devices and users while maintaining the local-first experience. You can have both: the instant responsiveness of local data *and* the ability to collaborate with others in real-time, seeing the same cursors and working together on documents.

The cloud becomes a synchronization layer rather than the source of truth. Your local copy is authoritative; the network is just for sharing changes when convenient.

## Signal Over Noise

Modern knowledge work means drowning in fragmented information across email, chat, task trackers, documents, and recordings. Apollo consolidates these disparate sources into one coherent interface, reducing context-switching and helping you focus on what matters. The goal is less noise, more signal.

## Accessible by Design

Apollo is built on PatternFly, a design system with accessibility baked in from the ground up. This means keyboard navigation, screen reader support, and WCAG 2.1 compliance come standard—not as an afterthought. Good design should work for everyone.

## AI as Augmentation

When AI features are present, they serve to assist—not replace—human judgment. Apollo's AI is a **controllable algorithm**: it can proactively suggest tasks, identify relevant information, and even propose modifications to artifacts—but nothing is applied without your explicit review and approval.

This isn't passive AI that waits to be asked, nor is it autonomous AI that acts without permission. It's something in between: proactive enough to surface what matters, constrained enough that you remain the owner of your work. Changes are presented as suggestions with clear diffs. You approve, reject, or refine. The human stays in the loop—always.

## File-based, local

Similar to the philosophy of Obsidian and Kirby. Files and folders that can easily be moved around and copied, very portable, very understandable by humans and AI to navigate the folder tree if they so choose. Not some database file that's impossible to browse or navigate.

## Open Data Formats

Every artifact Apollo generates—and every piece of internal state it maintains—uses open, standardized data formats. Prototypes are HTML, CSS, and JavaScript. Documents are Markdown. Configurations are JSON. Tasks are plain text files in folders. There is no proprietary file format anywhere in the system, and that's by design.

This is a long-term bet. We believe that open data formats, rooted in widely adopted standards, will ultimately win—not because of ideology, but because of pragmatism. A prototype built today as an HTML file will be openable in 10 years, 50 years, 100 years. The web standards that underpin HTML, CSS, and JavaScript have proven remarkably durable precisely because they are open, widely implemented, and not controlled by any single vendor. The same is true for plain text, Markdown, and JSON. These formats have a half-life measured in decades, not product cycles.

Proprietary formats, by contrast, are bets on the continued existence and goodwill of specific companies. When the company pivots, gets acquired, or shuts down, your data becomes hostage to abandoned tooling. We've seen this pattern play out countless times—from Flash to proprietary design file formats that require specific software just to open. Apollo refuses to participate in that cycle.

This commitment extends beyond user-facing artifacts to everything Apollo touches. Configuration files, cached data, task tracking, design metadata, AI conversation logs—all of it is stored in formats that any text editor can open, any script can parse, and any future system can ingest. If you delete Apollo tomorrow, every piece of data it ever created remains fully accessible and useful without it.

### Why This Matters for AI

Open data formats are also how AI systems actually consume and understand information. When everything is plain text in a standard structure, local models can read, index, and reason about your entire workspace without format-specific parsers or proprietary APIs. As AI capabilities evolve—and they will evolve in ways none of us can predict—your data will be ready for whatever comes next, because it's already in the most universally understood formats that exist.

### No Lock-In, By Default

This isn't a feature we advertise—it's a constraint we build around. Apollo should never produce an artifact that requires Apollo to open. Every output should be portable, shareable, and self-contained. If someone receives a prototype you built in Apollo, they should be able to open it in any browser. If someone clones your `.apollo` folder, they should be able to read every task and decision record with nothing more than a file browser.

The licensing of formats matters here too. We lean toward formats with permissive, open specifications—not formats that are technically open but encumbered by patents or restrictive licensing. The goal is zero friction, zero lock-in, zero dependency on any single vendor or tool—including Apollo itself.

## Home-Cooked Software & Barefoot Developers

Apollo is designed with a radical premise: the future of software isn't just about professional developers building industrial-scale applications. It's about everyone being empowered to create small, personal, purpose-built tools for themselves and the people around them.

This vision is deeply inspired by Maggie Appleton's essay ["Home-Cooked Software and Barefoot Developers"](https://maggieappleton.com/home-cooked-software), which articulates a distinction that shapes Apollo's entire approach:

**Industrial software** is built by large teams for mass audiences—standardized, one-size-fits-all applications designed to solve the most common needs of the most users. It's made by people in San Francisco trying to understand problems faced by homemakers in Tokyo or doctors in Tunisia. It can never address the long tail of specific, local, contextual needs.

**Home-cooked software** is different. Like a home-cooked meal, it's made with care for people you know. It solves local problems for local people. It doesn't need to scale to millions of users or make billions in profit. It just needs to work for your team, your family, your community.

The people who create this kind of software aren't necessarily professional developers. They're what Appleton calls **barefoot developers**—technically savvy individuals who understand the needs of their communities intimately. They're the teachers making elaborate Notion spreadsheets, the operations managers building complex Airtable workflows, the small business owners who would love to scratch their own itch if only they had the tools to do so.

Apollo is built to serve these barefoot developers. The Catalog isn't just a feature library—it's a marketplace of shareable applets, templates, and extensions that anyone can create, distribute, improve upon, and adapt. When someone builds a useful workflow for their design team, they can share it. Others can fork it, refine it, comment on it, and contribute back. This is collaborative software development without requiring everyone to be a software engineer.

### The Challenges We're Still Figuring Out

This vision comes with hard problems we don't yet have complete answers for:

- **Security**: How do we let non-developers create and share applets without introducing vulnerabilities? What sandboxing, permissions, and review mechanisms are needed?
- **Distribution**: What does a trusted extension ecosystem look like? How do we enable easy sharing while maintaining safety?
- **Compliance**: What automated pipelines, checks, and review systems ensure an Apollo extension meets baseline standards before being "approved" or "vetted"?

These questions will require solutions involving automated CI/CD pipelines, security scanning, community review processes, and clear compliance standards for what an Apollo extension should be. We're building toward a world where the infrastructure handles the complexity so barefoot developers can focus on solving problems for their people.

### Why This Matters

The industrial age of software has created incredible tools, but it has also created a monoculture—a world where everyone uses the same handful of applications built by the same handful of companies. Home-cooked software offers an alternative: a rich ecosystem of small, local, purpose-built tools that solve real problems for real people.

As Appleton writes, citing Ivan Illich: "People need not only to obtain things; they need above all the freedom to make things among which they can live, to give shape to them according to their own tastes, and to put them to use in caring for and about others."

Apollo is designed to be that freedom—a framework that lowers the barrier to creation so that more people can build the software they need, for the people they care about.

## Dynamic Knowledge Repositories

Apollo's sharing model is built around the concept of **Dynamic Knowledge Repositories** (DKRs), directly inspired by [Doug Engelbart's vision](https://dougengelbart.org/content/view/190/) for how teams should capture and evolve collective knowledge.

Most people think of a repository as a static archive of published documents. A Dynamic Knowledge Repository is something fundamentally different — it's a living, breathing, rapidly evolving repository of *all the stuff* accumulating moment to moment throughout the life of a project or pursuit. This includes successive drafts, commentary, design rationale, brainstorming notes, work lists, meeting notes, research collected and commented on, emerging issues, timelines, and more.

In Apollo, DKRs are Git repositories that serve as collaboration spaces. Git is a background detail — invisible infrastructure that provides versioning, history, and synchronization. What users experience is simply a shared place to store and evolve artifacts together. You can go back in time, see how things developed, trace a decision to the discussion that produced it, and understand the full arc of a project's evolution.

### Why This Matters

Engelbart identified that the key determining factor of any group's *Collective IQ* is how effectively it can develop, integrate, and apply iterating knowledge from concurrent contributions. He called this the **CoDIAK process** — the Concurrent Development, Integration, and Application of Knowledge. The DKR is the emerging collective record of all this activity, captured on the fly.

A litmus test for a good DKR: when a project team hits a brick wall due to an earlier design flaw, they can instantly get their hands on the design documents several versions back, access the corresponding dialog and design rationale, revisit the alternatives discussed, and make a course correction — all pieces of the puzzle instantly accessible, no digging through scattered emails or chat archives.

### Apollo's Implementation

Apollo implements DKRs through Git repositories with a human-friendly interface layer:

- **Artifacts are shared into DKRs** — Documents, slides, canvases, and prototypes move from local storage into shared repositories
- **Every change is versioned** — Git provides the time-travel mechanics; Apollo provides the UI for navigating history
- **Sync is automatic** — Changes are committed and pushed transparently, so the repository is always current
- **Open formats throughout** — Because every artifact is HTML, Markdown, or JSON, the DKR is readable and useful even without Apollo (see [Open Data Formats](#open-data-formats))
- **AI can traverse the history** — Local models can read, index, and reason about the full evolution of a project's artifacts

This is a long-term architectural commitment. As collaboration features evolve — real-time editing via CRDTs, activity feeds, annotation layers — the DKR remains the foundational concept: a shared, versioned, living record of everything a team produces and learns together.

## Composable Artifacts

Apollo artifacts are designed to interoperate freely because they're built on open, human-readable formats—HTML, JSON, Markdown, and structured code. A Canvas can embed a Prototype alongside Documents and Designs because there are no proprietary boundaries between them. Each artifact type is simply structured data that other artifacts can reference, embed, or transform.

This stands in contrast to past attempts at cross-artifact linking. Google Wave (2009-2012) attempted to embed "gadgets" and live objects within collaborative documents, but struggled with state synchronization—its simple key-value model couldn't handle concurrent edits without "lost update" problems. Google's Smart Canvas (2021) introduced "smart chips" to link Docs, Sheets, and Calendar, but these connections remain proprietary, tethered to Google's ecosystem, and limited to preview cards rather than true embedding. OpenSocial's Embedded Experiences tried to create a standard for embedding third-party content, but failed because it depended on deprecated gadget frameworks rather than open web standards.

The Block Protocol (blockprotocol.org) represents a more promising direction—an open standard for interoperable UI components. But Apollo sidesteps the need for a protocol entirely. When your Prototypes are just HTML files, your Documents are Markdown, your configurations are JSON, and your Canvases are structured manifests, interoperability is intrinsic. There's no API to negotiate, no format to convert, no protocol to implement. Artifacts compose naturally because they're all just files—open, inspectable, and infinitely remixable.

This composability extends to AI as well. Because every artifact is readable text in a standard format, AI models can understand, traverse, and operate on the relationships between artifacts without special tooling. The data model enables cross-connection not through clever engineering, but through the elegant simplicity of open formats.

