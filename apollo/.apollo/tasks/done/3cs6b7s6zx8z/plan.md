# Artifact Sharing via Git Repositories

## Architecture Overview

The core idea: introduce a `data/shared/` directory where each subdirectory is a **cloned Git repository**. Artifacts that users want to share get moved into the appropriate shared repo. Everything else in `data/` remains local and private.

```
data/
├── documents/              # Local-only artifacts (private)
├── slides/                 # Local-only artifacts (private)
├── canvas/                 # Local-only artifacts (private)
├── ...
├── shared/                 # Shared artifact repositories
│   ├── repos.json          # Registry of connected repos
│   ├── team-design/        # Git clone of a shared repo
│   │   ├── .git/
│   │   ├── documents/      # Shared documents
│   │   ├── slides/         # Shared slide decks
│   │   ├── prototypes/     # Shared prototypes
│   │   └── manifest.json   # Repo metadata (name, description, etc.)
│   └── project-alpha/      # Another shared repo
│       ├── .git/
│       ├── canvas/
│       └── manifest.json
├── config.json             # Private (already gitignored)
└── spaces.json             # Private
```

### Why this approach

- **Clean separation**: Local artifacts stay in `data/<type>/`, shared artifacts live in `data/shared/<repo>/<type>/`. No ambiguity about what is private vs shared.
- **Standard Git repos**: Each shared repo is a normal Git repository. Anyone with access can clone it outside Apollo too -- no vendor lock-in.
- **Multiple repos**: A user can connect to several repos (e.g., one per team or project). Different artifacts can go to different repos.
- **No dual-source-of-truth**: When you share an artifact, it **moves** from the local folder to the shared repo folder. It lives in one place.
- **Minimal changes to existing apps**: Artifact apps (Documents, Slides, Canvas, etc.) need a small update to also scan `data/shared/*/` for their artifact type, plus a provenance indicator in the UI.

## Data Model

### `data/shared/repos.json` -- Repository Registry

```json
{
  "repositories": [
    {
      "id": "team-design",
      "name": "Team Design Assets",
      "url": "git@github.com:myorg/design-assets.git",
      "branch": "main",
      "lastSync": "2026-02-08T12:00:00Z",
      "status": "synced",
      "autoSync": true
    }
  ]
}
```

### `manifest.json` inside each shared repo

```json
{
  "name": "Team Design Assets",
  "description": "Shared design artifacts for the UXD team",
  "createdBy": "user@example.com",
  "artifactTypes": ["documents", "slides", "prototypes", "canvas"]
}
```

## User Flows

### 1. Connect a shared repository (Settings UI)

- User goes to Settings > Repositories
- Enters a Git repo URL + optional branch
- Apollo clones the repo to `data/shared/<repo-id>/`
- Repo appears in `repos.json`

### 2. Share an artifact

- User is viewing a document/slide/canvas/etc.
- Clicks "Share" action in the toolbar or context menu
- A modal shows available shared repos
- On confirm: the artifact folder is **moved** from `data/<type>/<id>/` to `data/shared/<repo>/<type>/<id>/`
- Apollo commits the addition and pushes to the remote

### 3. Unshare (bring back to local)

- User clicks "Unshare" on a shared artifact
- Artifact folder is moved back from `data/shared/<repo>/<type>/<id>/` to `data/<type>/<id>/`
- Apollo commits the removal from the shared repo and pushes

### 4. Sync (pull/push)

- **Auto-sync**: Periodic fetch + pull on a timer (configurable)
- **Manual sync**: "Sync" button in the shared repos panel
- **On edit**: When a user saves changes to a shared artifact, Apollo auto-commits and pushes
- **Conflict detection**: If pull has conflicts, surface them in the UI with options to resolve

### 5. Browse shared artifacts

- Each artifact app (Documents, Slides, etc.) scans both `data/<type>/` and `data/shared/*/<type>/`
- Shared artifacts show a badge/icon indicating which repo they belong to
- Filtering: user can toggle "Show local only" / "Show shared only" / "Show all"

## Key Files Created/Modified

### New files

- **`server/lib/sharing.js`** -- Core sharing service: clone, pull, push, commit, move artifacts, conflict detection.
- **`server/routes/sharing.js`** -- API endpoints for the sharing feature
- **`src/components/ShareArtifactModal.js`** -- Reusable share modal with repo picker
- **`src/components/UnshareArtifactModal.js`** -- Unshare confirmation modal
- **`src/components/SyncStatusPanel.js`** -- Real-time sync status and conflict resolution UI
- **`src/pages/Settings/components/SharedReposSettings.js`** -- Settings panel for repo management
- **`data/shared/README.md`** -- Sharing system documentation
- **`data/shared/.gitkeep`** -- Stub for empty directory
- **`data/README.md`** -- Data directory documentation

### Modified files

- **`server/index.js`** -- Mount sharing routes, start auto-sync timer
- **`server/lib/config.js`** -- Add `data/shared/` to managed directories
- **`data/apps/documents/routes.js`** -- Scan shared repos, auto-commit on save
- **`data/apps/documents/pages/Documents.js`** -- Share/Unshare buttons, shared badge
- **`data/apps/slides/server/slideRoutes.js`** + **`slideHelpers.js`** -- Scan shared repos
- **`data/apps/slides/pages/Slides.js`** -- Share/Unshare buttons, shared badge
- **`data/apps/canvas/routes.js`** -- Scan shared repos
- **`data/apps/canvas/pages/Canvas.js`** -- Share/Unshare buttons, shared badge
- **`data/apps/prototypes/routes.js`** -- Scan shared repos
- **`data/apps/prototypes/pages/Prototypes.js`** -- Share/Unshare buttons, shared badge
- **`src/pages/Settings/Settings.js`** -- Added "Repositories" tab
- **`src/pages/Settings/constants.js`** -- Added "repositories" to tab hash map
- **`.gitignore`** -- Exempted `data/shared/` and `data/README.md`

### API Endpoints (`/api/sharing/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sharing/repos` | List connected repositories |
| POST | `/api/sharing/repos` | Add (clone) a new repository |
| GET | `/api/sharing/repos/:id` | Get a single repository |
| PATCH | `/api/sharing/repos/:id` | Update repository settings |
| DELETE | `/api/sharing/repos/:id` | Remove a repository |
| POST | `/api/sharing/repos/:id/sync` | Pull + push a repository |
| GET | `/api/sharing/repos/:id/status` | Get sync status (ahead/behind/conflicts) |
| POST | `/api/sharing/artifacts/share` | Move an artifact to a shared repo |
| POST | `/api/sharing/artifacts/unshare` | Move an artifact back to local |
| POST | `/api/sharing/artifacts/commit` | Auto-commit a shared artifact |
| GET | `/api/sharing/artifacts/:type` | List shared artifacts by type |

## Implementation Phases

### Phase 1: Core infrastructure

- Create `server/lib/sharing.js` with Git operations (clone, pull, push, commit)
- Create `server/routes/sharing.js` with repo management endpoints
- Create `data/shared/repos.json` structure
- Mount routes in `server/index.js`
- Add `data/shared/` to `.gitignore`

### Phase 2: Share/Unshare actions

- Add share/unshare API endpoints (move artifact, commit, push)
- Update artifact listing endpoints to scan shared repos
- Build the "Share" modal component (repo picker)
- Add provenance badges to artifact list views

### Phase 3: Sync and collaboration

- Implement auto-sync (periodic pull)
- Auto-commit-and-push on artifact save
- Conflict detection and resolution UI
- Sync status indicators in the masthead or sidebar

### Phase 4: Polish

- Shared Repos settings panel (manage connections)
- Activity feed for shared repo changes
- Space integration (associate shared repos with Spaces)
- Notifications when shared artifacts are updated by others

## Design Decisions / Open Questions

1. **Move vs Copy**: Recommended approach is **move** (artifact lives in one place). An alternative is copy-with-sync, but that creates a dual-source-of-truth problem.
2. **Auto-commit granularity**: Should every save auto-commit, or should users explicitly "publish" changes? Auto-commit is simpler but creates noisy history. A "publish" action is cleaner but adds friction.
3. **Large binary files**: Git is not great for large binaries (images, recordings). Should we use Git LFS for shared repos, or exclude certain artifact types from sharing?
4. **Authentication**: Git SSH keys or HTTPS tokens for repo access. Apollo could store credentials in `data/config.json` (already gitignored) or rely on the system's SSH/credential configuration.
5. **Conflict resolution**: For text-based artifacts (documents, slides markdown), Git's merge can work. For JSON-based artifacts (canvas, moodboards), a "theirs wins" or "ours wins" strategy with manual override may be simpler.
