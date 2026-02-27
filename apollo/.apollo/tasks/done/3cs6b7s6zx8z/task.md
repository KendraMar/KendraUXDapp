---
id: 3cs6b7s6zx8z
title: 'Artifact sharing via Git repositories'
type: feature
status: done
priority: high
created: 2026-02-08T00:00:00.000Z
due: null
assignees: []
labels:
  - sharing
  - collaboration
  - git
  - infrastructure
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

# Artifact sharing via Git repositories

## Description

Implemented a system for sharing Apollo artifacts (documents, slides, canvases, prototypes) with team members via external Git repositories, while keeping unshared artifacts fully local and private.

### Problem

Apollo's `data/` folder is local-only (gitignored). There was no way to collaborate on artifacts like documents, slide decks, or canvases with other people. Users needed a mechanism to selectively share specific artifacts through a sync-able channel.

### Solution

Introduced a `data/shared/` directory where each subdirectory is a cloned Git repository. Users connect remote Git repos in Settings, then share individual artifacts by moving them into a shared repo. Apollo handles committing, pushing, pulling, and conflict detection automatically.

**Key design choices:**

- **Git as the sync layer** -- standard, decentralized, works offline, no vendor lock-in. Anyone with access can clone shared repos outside Apollo too.
- **Move, not copy** -- when an artifact is shared, it moves from `data/<type>/` to `data/shared/<repo>/<type>/`. This avoids dual-source-of-truth problems.
- **Implicit privacy** -- everything in `data/` is private by default. Only artifacts explicitly moved to `shared/` become visible to others. This mirrors how file systems work (your files are private until you share them).
- **Multiple repos** -- users can connect several repos (e.g., one per team or project), and different artifacts can go to different repos.

### Alternatives explored

1. **`data/private/` subfolder** -- Considered reorganizing to have `data/private/` for local content and `data/shared/` for shared content. Rejected because it would require a massive refactoring of every file path in the codebase (~50+ files), and the implicit-private model is simpler and safer.
2. **Google Drive as a storage backend** -- Discussed using Google Drive APIs as an alternative to Git. Feasible for binary-heavy assets, but lacks atomic versioned sync, offline support, and conflict resolution that Git provides. Could be added as an additional provider type in the future, but Git is the right choice for structured text artifacts.
3. **Copy-with-sync** -- Keeping artifacts in both local and shared locations with a sync layer. Rejected due to dual-source-of-truth complexity.
4. **Stacked diffs workflow** -- Evaluated whether stacked diffs (a la Graphite/Phabricator) would help reduce merge conflicts. Concluded that stacked diffs solve a different problem (sequential dependent code changes in review workflows) and don't apply to concurrent artifact editing.

## What was built

### Backend (server)

- **`server/lib/sharing.js`** -- Core sharing service: Git operations (clone, pull, push, commit, status), artifact move logic (share/unshare), shared artifact scanning across repos, auto-sync timer, auto-commit-on-save, and conflict resolution with "ours"/"theirs" strategies.
- **`server/routes/sharing.js`** -- 9 REST API endpoints for repo management, sync operations, and artifact sharing.
- **`server/index.js`** -- Mounted sharing routes, starts 5-minute auto-sync on boot.
- **`server/lib/config.js`** -- Added `sharedDir` path, ensures `data/shared/` exists on startup.

### Frontend (React)

- **`src/components/ShareArtifactModal.js`** -- Reusable modal with repo picker for sharing artifacts.
- **`src/components/UnshareArtifactModal.js`** -- Confirmation modal for moving artifacts back to local.
- **`src/components/SyncStatusPanel.js`** -- Real-time sync status display with ahead/behind counts, conflict listing, and resolution buttons.
- **`src/pages/Settings/components/SharedReposSettings.js`** -- Full settings panel: repo listing, connect/edit/delete modals, per-repo sync, status indicators.
- **Settings page** -- Added "Repositories" tab (eventKey 9).

### Artifact app updates

Updated 4 artifact apps to scan `data/shared/*/` in addition to local folders:

- **Documents** -- listing, GET, PUT endpoints; auto-commit on save; purple shared badge; Share/Unshare buttons.
- **Slides** -- listing endpoint; shared badge; Share/Unshare buttons.
- **Canvas** -- listing endpoint; shared badge; Share/Unshare buttons.
- **Prototypes** -- listing endpoint (JSON file-based); shared badge; Share/Unshare buttons.

### Documentation and structure

- **`data/shared/.gitkeep`** -- Stub so directory exists in the repo before any repos are connected.
- **`data/shared/README.md`** -- Documents the sharing system, directory structure, and sync behavior.
- **`data/README.md`** -- Documents the entire `data/` folder structure, categorizing every subdirectory as LOCAL, SHARED, PRIVATE CONFIG, EPHEMERAL, or APPLICATION CODE.
- **`.gitignore`** -- Exempts `data/shared/` and `data/README.md` from the `data/*` ignore rule.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sharing/repos` | List connected repositories |
| POST | `/api/sharing/repos` | Add (clone) a new repository |
| GET | `/api/sharing/repos/:id` | Get a single repository |
| PATCH | `/api/sharing/repos/:id` | Update repository settings |
| DELETE | `/api/sharing/repos/:id` | Remove a repository |
| POST | `/api/sharing/repos/:id/sync` | Pull + push a repository |
| GET | `/api/sharing/repos/:id/status` | Get sync status |
| POST | `/api/sharing/artifacts/share` | Move artifact to shared repo |
| POST | `/api/sharing/artifacts/unshare` | Move artifact back to local |
| POST | `/api/sharing/artifacts/commit` | Auto-commit a shared artifact |
| GET | `/api/sharing/artifacts/:type` | List shared artifacts by type |

## Acceptance Criteria

- [x] Users can connect external Git repositories in Settings
- [x] Users can share individual artifacts to a connected repo
- [x] Users can unshare artifacts (move back to local)
- [x] Shared artifacts appear in the same list views as local artifacts with a visual indicator
- [x] Auto-sync pulls and pushes changes periodically (5-minute interval)
- [x] Saving a shared artifact auto-commits and pushes
- [x] Conflict detection surfaces issues in the UI with resolution options
- [x] `data/shared/` directory has documentation and stub files for discoverability
- [x] `data/README.md` documents the local vs shared convention

## Technical Notes

- Git operations reuse the `runGit()` helper pattern from the existing Code app (`data/apps/code/routes.js`).
- Artifact load functions (`loadDocument`, `loadCanvasMetadata`, `loadSlideMetadata`) were updated to accept an optional base directory parameter for loading from shared repo paths.
- The `resolveArtifactLocation()` helper checks both local and all shared repos to find where an artifact lives.
- Conflict resolution supports "ours" (keep local, force push) and "theirs" (reset to remote) strategies.

## Future considerations

- **Google Drive provider** -- Could be added as an additional sync provider type alongside Git, particularly useful for binary-heavy assets (images, recordings). The `repos.json` registry supports a `type` field for this.
- **File locking** -- Lightweight "I'm editing this" indicator to prevent concurrent edits on the same shared artifact.
- **Space integration** -- Associate shared repos with Spaces so space-scoped views automatically include shared artifacts from the relevant repo.
- **Activity feed** -- Surface shared repo changes (new artifacts, updates by others) in the activity feed.
- **Git LFS** -- For large binary files in shared repos.

## References

- [Implementation plan](./plan.md)
- Sharing service: `server/lib/sharing.js`
- Sharing routes: `server/routes/sharing.js`
- Share modal: `src/components/ShareArtifactModal.js`
- Settings panel: `src/pages/Settings/components/SharedReposSettings.js`
- Data README: `data/README.md`
- Shared README: `data/shared/README.md`

## History

- 2026-02-08: Created task, implemented full feature across 4 phases
