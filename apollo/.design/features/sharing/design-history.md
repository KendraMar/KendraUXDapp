# Sharing / Dynamic Knowledge Repositories — Design History

Design history for Apollo's sharing and collaboration features, built around the concept of Dynamic Knowledge Repositories (DKRs).

## Inspiration

The DKR concept is directly inspired by [Doug Engelbart's vision](https://dougengelbart.org/content/view/190/) for dynamic knowledge repositories — living, breathing, rapidly evolving repositories that capture everything accumulating throughout the life of a project. Engelbart saw these as the foundation of a group's Collective IQ: the emerging record of concurrent development, integration, and application of knowledge (CoDIAK).

---

### 2026-02-10 — [Decision] Adopt "Dynamic Knowledge Repository" framing for shared repos

Formally named Apollo's shared Git repositories as **Dynamic Knowledge Repositories** (DKRs), inspired by Doug Engelbart. This framing emphasizes that shared repos are not static archives but living collaboration spaces — capturing successive drafts, commentary, design rationale, and the full evolution of a project's artifacts. Git provides versioning and history as invisible infrastructure; Apollo provides the human-friendly interface. Updated design principles, shared README, and project README to reflect this terminology and philosophy.

### 2026-02-09 — [Addition] Backlog spike for large binary file sharing strategy

Created task to investigate Git LFS vs external storage for large files (recordings, images, videos) in shared repositories. This is a key scalability concern for DKRs that contain media-rich artifacts.

### 2026-02-08 — [Addition] Artifact sharing via Git repositories

Implemented the core sharing mechanism. Artifacts (documents, slides, canvases, prototypes) can now be shared into Git repositories from any artifact list view. Shared artifacts are moved from local storage (`data/<type>/`) to shared storage (`data/shared/<repo>/<type>/`), committed, and pushed. Repos auto-sync every 5 minutes and auto-commit on save. Settings panel allows connecting and managing repositories.

Key components:
- `server/lib/sharing.js` — Core sharing service
- `server/routes/sharing.js` — REST API endpoints
- `src/components/ShareArtifactModal.js` — Share modal UI
- `src/pages/Settings/components/SharedReposSettings.js` — Repo management
