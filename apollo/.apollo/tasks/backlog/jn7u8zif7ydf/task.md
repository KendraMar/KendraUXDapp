---
id: jn7u8zif7ydf
title: 'Sharing strategy for large binary files (images, videos, recordings)'
type: spike
status: backlog
priority: medium
created: 2026-02-09T00:00:00.000Z
due: null
assignees: []
labels:
  - sharing
  - infrastructure
  - spike
  - apollo
parent: null
blocks: []
blocked_by: []
related:
  - 3cs6b7s6zx8z
external: {}
estimate: null
component: null
sprint: null
starred: false
flag: null
---

# Sharing strategy for large binary files (images, videos, recordings)

## Description

The artifact sharing system (implemented in `3cs6b7s6zx8z`) uses Git repositories for syncing shared artifacts. This works well for text-based content -- documents (Markdown), slide decks (Markdown + JSON metadata), canvases (JSON), prototypes (JSON/HTML), and code. However, several artifact types contain large binary files that Git handles poorly:

- **Recordings** -- audio/video files (potentially gigabytes)
- **Moodboard images** -- collections of reference images
- **Screenshots** -- PNG/JPG screenshot captures
- **Slide assets** -- embedded images in presentations
- **Prototype assets** -- images, fonts, media in HTML prototypes

Git stores full copies of every version of every file. A 500MB video that gets re-encoded once becomes 1GB in the repo. Over time this makes clones slow, repos bloated, and sync painful.

### What needs to be figured out

1. **Which approach for large files?**
   - **Git LFS** -- Git extension that stores large files on a separate server, keeping only pointers in the repo. Well-supported by GitHub/GitLab. Requires LFS server.
   - **Separate storage backend** -- Store binaries in Google Drive, S3, or similar, with only references/pointers in the Git repo. More flexible but more complex.
   - **Hybrid approach** -- Use Git for text artifacts and a different sync mechanism for binary-heavy artifact types entirely.
   - **Size threshold** -- Maybe files under a certain size (e.g., 10MB) go into Git directly, and larger files use an alternative.

2. **Which artifact types should be shareable at all?**
   - Recordings are very large and personal -- do they even make sense to share via this system?
   - Moodboards are image-heavy but the images themselves may be URLs, not local files.
   - Should we limit sharing to text-based artifact types and handle binary sharing separately?

3. **How does this affect the existing implementation?**
   - The `shareArtifact()` function in `server/lib/sharing.js` does a simple `fs.renameSync` + git commit. For LFS, we'd need to configure `.gitattributes` in shared repos.
   - The auto-sync timer would need to handle larger transfer times.
   - Conflict resolution for binary files is always "pick one" -- there's no merge.

## Acceptance Criteria

- [ ] Evaluate Git LFS vs external storage vs hybrid approach -- document trade-offs
- [ ] Determine which artifact types / file extensions should use the large file strategy
- [ ] Define a size threshold policy (what goes in Git directly vs alternative storage)
- [ ] Prototype the chosen approach and validate it works with the existing sharing flow
- [ ] Update `server/lib/sharing.js` to handle large files appropriately
- [ ] Document the chosen strategy in `data/shared/README.md`

## Technical Notes

### Current file sizes by artifact type

| Artifact type | Typical file types | Typical size | Git-friendly? |
|---------------|-------------------|-------------|---------------|
| Documents | `.md` | < 100KB | Yes |
| Slides | `.md`, `.json` | < 500KB | Yes |
| Canvas | `.json` | < 1MB | Yes |
| Prototypes | `.json`, `.html` | < 2MB | Mostly |
| Moodboard | `.jpg`, `.png` | 1-50MB each | No |
| Screenshots | `.png`, `.jpg` | 1-10MB each | No |
| Recordings | `.mp4`, `.webm`, `.wav` | 50MB-5GB | No |
| Code | `.js`, `.py`, etc. | < 1MB | Yes |

### Git LFS quick reference

```bash
# Initialize LFS in a shared repo
git lfs install

# Track large file types
git lfs track "*.mp4" "*.wav" "*.webm" "*.png" "*.jpg"

# This creates .gitattributes:
# *.mp4 filter=lfs diff=lfs merge=lfs -text
```

LFS requires a server that supports it (GitHub, GitLab, Gitea all do). Self-hosted repos would need a separate LFS server.

### Google Drive as binary storage

The codebase already has Google Drive integration (`server/lib/google.js`) with download/upload capabilities. A hybrid approach could store a manifest in Git:

```json
{
  "assets": [
    { "name": "hero-image.png", "driveId": "1abc...", "size": 4200000, "hash": "sha256:..." }
  ]
}
```

## References

- Parent feature: [Artifact sharing via Git repositories](../../done/3cs6b7s6zx8z/task.md)
- Sharing service: `server/lib/sharing.js`
- Google Drive integration: `server/lib/google.js`
- Git LFS docs: https://git-lfs.com

## History

- 2026-02-09: Created as follow-up to artifact sharing implementation
