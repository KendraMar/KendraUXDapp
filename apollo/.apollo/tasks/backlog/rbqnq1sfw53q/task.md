---
id: rbqnq1sfw53q
title: 'Per-Artifact Version Control and History System'
type: feature
status: backlog
priority: medium
created: 2026-02-02T00:00:00.000Z
due: null
assignees: []
labels:
  - feature
  - infrastructure
  - content-management
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

# Per-Artifact Version Control and History System

## Description

Apollo needs a version control system that tracks changes to individual artifacts (documents, files, folder contents) over time. This system should capture changes made by both human users and AI assistants, enabling history viewing, rollback, and change comparison without requiring explicit commits from users.

The system should feel invisible to users during normal editing, with changes captured automatically. AI assistants can later help summarize and organize the change history retroactively.

## User Story

As a **designer or developer using Apollo**, I want to **see the history of changes to any artifact and roll back to previous versions**, so that **I can understand how content evolved and recover earlier work without manual version management**.

## Goals

1. Track all changes to artifacts automatically (no manual commits required)
2. Support changes from both human users and AI assistants
3. Enable viewing the history of any file or folder
4. Allow rollback to any previous version
5. Show individual changes (diffs) between versions
6. Support retroactive AI-assisted summarization of changes

## Non-Goals

- Full branching and merging workflows (keep it simple initially)
- Reinventing version control - use existing standards where possible
- Custom/proprietary formats that don't integrate with standard tooling

## Key Constraints

### Multi-File Artifacts

Apollo artifacts are often **multi-file entities**:
- A document with its `meta.json` metadata file
- A prototype with HTML, CSS, JS, and assets
- A task folder with `task.md`, `plan.md`, and attachments

The versioning system must treat these as **atomic units** - rolling back a prototype means rolling back all its files together, not individually.

### CRDT Compatibility

Apollo plans to adopt CRDTs (Conflict-free Replicated Data Types) for distributed collaboration. The versioning approach must:
- Not conflict with CRDT-based sync
- Ideally leverage CRDT native history where available
- Work alongside CRDTs for multi-file atomic operations (which CRDTs don't naturally support)

## Technical Recommendation

### Options Evaluated and Ruled Out

| Option | Verdict | Reason |
|--------|---------|--------|
| **Embedded Git per folder** | Ruled out | Massive overhead, submodule complexity, doesn't support auto-tracking |
| **Custom SQLite snapshot store** | Ruled out | Reinvents the wheel, not a standard format |
| **Pure CRDT-based** | Insufficient alone | CRDTs track per-document; no native "atomic multi-file commit" |

### Recommended Approach: Git-Based with CRDT Layer

Use **standard Git** for multi-file artifact versioning, with future CRDT integration for individual file collaboration.

#### Why Git

- Industry standard, battle-tested
- Native multi-file atomic commits (exactly what we need for artifact folders)
- Rich tooling for diffs, history, rollback
- Content-addressable storage with deduplication
- Exportable/portable format

#### Architecture

```
data/
├── artifacts/              # Working directory (current state)
│   ├── prototypes/
│   │   └── my-website/
│   │       ├── meta.json
│   │       ├── index.html
│   │       ├── styles.css
│   │       └── app.js
│   └── documents/
│       └── reveal-script/
│           ├── meta.json
│           └── content.md
└── .git/                   # Single Git repo for all artifacts
```

#### How It Works

1. **Automatic versioning**: Background watcher detects file changes
2. **Batched commits**: Group changes within a time window (e.g., 5 min of inactivity)
3. **Per-artifact commits**: Commit changes scoped to artifact folders when possible
4. **AI-generated messages**: Queue commits for AI summarization of what changed
5. **Queryable index**: SQLite index for fast artifact history queries (mirrors git log)

#### SQLite Index (Not Storage)

SQLite serves as a **queryable cache** of Git history, not the source of truth:

```sql
versions:
  - id (commit SHA)
  - artifact_path (folder path)
  - timestamp
  - actor (user | assistant:{name})
  - change_summary (AI-generated)
  - files_changed (JSON array)

pending_summaries:
  - commit_id
  - status (pending | processing | complete)
```

This enables fast queries like "show history for `/prototypes/my-website/`" without walking Git commits.

### CRDT Integration Strategy

CRDTs and Git serve different purposes and can coexist:

| Concern | Solution |
|---------|----------|
| **Real-time collaboration on single files** | CRDT (Automerge/Yjs) |
| **Atomic multi-file snapshots** | Git commits |
| **Distributed sync** | CRDT for docs, Git for structure |

#### Layered Architecture

```
┌─────────────────────────────────────────────┐
│           Unified Version History UI         │
├─────────────────────────────────────────────┤
│  Git Backend          │  CRDT Backend        │
│  (multi-file atoms)   │  (per-doc history)   │
├─────────────────────────────────────────────┤
│              Artifact Storage                │
└─────────────────────────────────────────────┘
```

- **Git layer**: Tracks folder structure, multi-file relationships, named versions
- **CRDT layer**: Tracks fine-grained edits within collaborative documents
- **UI layer**: Presents unified history regardless of backend

#### Future: Pijul Consideration

**Pijul** is a CRDT-based version control system that could eventually replace Git:
- Patches commute (order-independent) - true CRDT semantics
- Conflicts never reappear after resolution
- Mathematically sound merging

Worth evaluating once Pijul matures further, but Git is the pragmatic choice today.

### AI Summarization Queue

1. On commit creation, add entry to `pending_summaries` queue
2. Background process runs AI to analyze diffs
3. AI generates human-readable change descriptions
4. Update SQLite index with `change_summary`

This provides "instant capture, eventual meaning" - no lag during editing.

## Acceptance Criteria

- [ ] Changes to multi-file artifacts are captured as atomic units
- [ ] Version history UI shows timeline of changes for any artifact (file or folder)
- [ ] Each version shows who/what made the change (user vs AI assistant)
- [ ] Users can view diff between any two versions (per-file and aggregate)
- [ ] Users can roll back an entire artifact folder to any previous version
- [ ] AI can retroactively summarize changes via background queue
- [ ] System uses Git as the version store (standard format, exportable)
- [ ] SQLite index enables fast history queries without walking Git log
- [ ] Architecture is compatible with future CRDT adoption

## Subtasks

- [ ] Initialize Git repo for artifact storage (`data/.git`)
- [ ] Design SQLite index schema for version metadata cache
- [ ] Create file watcher service to detect artifact changes
- [ ] Implement batched auto-commit logic (time-based grouping)
- [ ] Build mechanism to identify artifact boundaries (folder = atom)
- [ ] Sync Git commits to SQLite index for fast querying
- [ ] Build version history API endpoints
- [ ] Implement diff generation between versions (file + folder level)
- [ ] Build version history UI component
- [ ] Implement rollback functionality (git checkout + index update)
- [ ] Add AI summarization queue and processing
- [ ] Handle actor attribution (user vs AI assistant in commit metadata)
- [ ] Document CRDT integration points for future implementation

## Open Questions

- [ ] How do we identify which AI assistant made a change? (Custom Git author? Commit trailer?)
- [ ] What's the retention policy for versions? (Git gc settings? Keep all?)
- [ ] How do we handle artifacts that span both Git-tracked files and CRDT docs?
- [ ] Should we support "named versions" / tags for important milestones?
- [ ] How do we handle large binary files? (Git LFS? Exclude from versioning?)
- [ ] What's the migration path if we switch to Pijul in the future?
- [ ] How does this interact with Apollo's existing cache and data directories?

## References

- **Git internals**: content-addressable storage, plumbing commands
- **Pijul**: CRDT-based VCS - https://pijul.org/
- **Automerge**: CRDT library with document linking - https://automerge.org/
- **Yjs**: CRDT for collaborative editing - https://docs.yjs.dev/
- **Local-first software**: https://www.inkandswitch.com/local-first/
- Similar systems: Dropbox version history, Google Docs revision history, Notion page history, Figma version history

## History

- 2026-02-02: Created
- 2026-02-02: Updated with multi-file artifact requirements and CRDT compatibility considerations
