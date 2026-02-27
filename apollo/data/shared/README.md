# Dynamic Knowledge Repositories

This directory contains **Dynamic Knowledge Repositories** (DKRs) — Git repositories connected for artifact sharing and collaboration. Each subdirectory is a cloned Git repo that syncs with a remote, providing a living, breathing, rapidly evolving repository of all the artifacts accumulating throughout the life of a project.

This concept is directly inspired by [Doug Engelbart's vision for Dynamic Knowledge Repositories](https://dougengelbart.org/content/view/190/), where a DKR is not a static archive of published documents but the emerging collective record of a project's evolution — successive drafts, commentary, design rationale, research, meeting notes, emerging issues, and all the artifacts that teams produce moment to moment.

In Apollo, a DKR is a Git repository that serves as a shared collaboration space. Git is a background detail — it's the invisible infrastructure that provides versioning, history, and synchronization. What matters is the experience: a place where your team stores and evolves artifacts together, where you can go back in time and see how things developed, and where the collective knowledge of a project is captured as it unfolds.

## How it works

```
data/shared/
├── .gitkeep              # Keeps this directory in version control
├── repos.json            # Registry of connected repositories (created automatically)
├── README.md             # This file
└── <repo-id>/            # Each connected repo is a Git clone
    ├── .git/
    ├── documents/         # Shared documents
    ├── slides/            # Shared slide decks
    ├── canvas/            # Shared canvases
    ├── prototypes/        # Shared prototypes
    └── manifest.json      # Repo metadata
```

## Connecting a repository

1. Go to **Settings > Repositories** in Apollo
2. Click **Connect Repository** and enter a Git repo URL
3. Apollo clones the repo into this directory as a new DKR

Or via API:

```bash
curl -X POST http://localhost:1225/api/sharing/repos \
  -H "Content-Type: application/json" \
  -d '{"url": "git@github.com:org/shared-artifacts.git", "name": "Team Assets"}'
```

## Sharing an artifact

From any artifact list (Documents, Slides, Canvas, Prototypes), click the **Share** button on an artifact card. Select a repository and the artifact will be moved into the DKR, committed, and pushed.

Shared artifacts appear in the same list views as local artifacts, marked with a purple repository badge. Once shared, they become part of the project's collective knowledge — versioned, browsable, and available to anyone with access to the repository.

## Sync

- **Auto-sync**: Repos with auto-sync enabled are pulled/pushed every 5 minutes
- **Manual sync**: Click **Sync** on a repo card in Settings, or call `POST /api/sharing/repos/:id/sync`
- **On save**: Editing a shared artifact auto-commits and pushes the change

## Local vs Shared

Everything in `data/` outside of this `shared/` directory is **local and private** — it never leaves your machine. Only artifacts explicitly moved into a DKR are visible to others.

| Location | Visibility | Sync |
|----------|-----------|------|
| `data/documents/`, `data/slides/`, etc. | Private (local only) | None |
| `data/shared/<repo>/documents/`, etc. | Shared via DKR (Git) | Auto or manual |
| `data/config.json` | Private (gitignored) | None |
| `data/apps/` | Part of Apollo codebase | Main repo |

## Why "Dynamic Knowledge Repository"?

The term comes from [Doug Engelbart](https://dougengelbart.org/content/view/190/), who envisioned repositories that capture everything accumulating throughout a project — not just polished final documents, but the successive drafts, commentary, design rationale, brainstorming notes, meeting minutes, and emerging issues that represent a team's collective intelligence.

A truly effective DKR means that when your team hits a brick wall due to an earlier design decision, you can instantly access the documents from several versions back, revisit the alternatives that were discussed, review the rationale, and make a course correction — all without digging through emails or chat archives to piece together what happened.

Apollo's DKRs bring this vision to life through Git repositories as the underlying infrastructure: every change is versioned, every artifact has a full history, and the repository evolves as a living record of the project. Git provides the time-travel mechanics; Apollo provides the human-friendly interface for navigating, contributing to, and making sense of the collective knowledge.
