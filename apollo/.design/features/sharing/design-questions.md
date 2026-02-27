# Sharing / Dynamic Knowledge Repositories — Design Questions

## Open

### How should DKRs surface version history in the UI?
- **Raised**: 2026-02-10
- **Context**: Engelbart's DKR vision emphasizes being able to instantly access earlier versions, design rationale, and the dialog that led to decisions. Currently, Git history exists but isn't surfaced in the Apollo UI. How should we expose this — a timeline view, inline version diffs, a "time travel" mode?

### Should DKRs support structured metadata beyond file contents?
- **Raised**: 2026-02-10
- **Context**: Engelbart envisioned DKRs with tagged content, tracked issues, and connected discussions — not just files. Should Apollo's DKRs include a manifest or metadata layer (e.g., tags, relationships between artifacts, decision records) beyond what Git alone provides?

### How should DKRs handle large binary files?
- **Raised**: 2026-02-09
- **Context**: Backlog spike (`jn7u8zif7ydf`) exploring Git LFS vs external storage. Recordings, images, and video assets don't fit well in standard Git repos. Need a strategy that preserves the DKR's role as a single source of truth while handling binaries efficiently.

## Resolved

(none yet)
