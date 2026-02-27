---
id: g6ydcv3244n0
title: 'Integrate browser extension browsing history with Spaces source suggestions'
type: feature
status: backlog
priority: medium
created: 2026-02-08T00:00:00.000Z
due: null
assignees: []
labels:
  - integration
  - browser-extension
  - spaces
  - ai
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

# Integrate browser extension browsing history with Spaces source suggestions

## Description

Build an intelligent bridge between the Apollo browser extension's captured browsing history and the Spaces system. The goal is to automatically detect when a user frequently visits URLs that are contextually related to a particular Space, and then surface those URLs as suggested sources the user can add to that Space.

Currently, the browser extension (`apps/browser-extension/`) already captures browsing activity (URL, title, timestamp) and stores it in `data/browser/history.json`. Spaces (`data/spaces.json`) already support a `sources` array of typed URLs (Jira, Slack, GitLab, Figma, etc.). What's missing is the automated correlation layer that connects these two systems.

### How it should work

1. **Background analysis (heartbeat/cron)**: A periodic server-side process runs on a schedule (e.g., every 15–30 minutes, or on-demand). It examines each Space's existing context (name, description, existing sources) and compares it against the user's recent browsing history.

2. **Relevance matching**: For each Space, the system determines whether any frequently visited URLs are likely related to that Space. This could use:
   - Title/keyword matching against the Space name and existing source domains
   - Frequency analysis (URLs visited repeatedly signal importance)
   - Domain affinity (e.g., if a Space has Jira sources, other Jira URLs for the same project are likely related)
   - Optionally, a local AI model to assess semantic relevance between page titles/URLs and Space context

3. **Suggestion surfacing**: When related URLs are found, they are stored as pending suggestions. When the user visits a Space (e.g., the Space configuration area or a dedicated "Suggested Sources" panel), they see a list of suggested URLs with context (title, visit frequency, why it was matched).

4. **User confirmation**: The user can accept (add to Space sources), dismiss, or snooze suggestions. Accepted suggestions become proper entries in the Space's `sources` array.

## Acceptance Criteria

- [ ] Server-side periodic job (heartbeat/cron) that correlates browsing history with Spaces
- [ ] Relevance matching algorithm that considers URL frequency, title keywords, domain affinity, and existing Space sources
- [ ] Storage for pending source suggestions (e.g., `data/browser/suggestions.json` or per-space)
- [ ] API endpoint(s) to retrieve suggestions for a Space and to accept/dismiss them
- [ ] UI in the Space configuration area (or a dedicated panel) showing suggested sources
- [ ] Accepting a suggestion adds it to the Space's `sources` array in `data/spaces.json`
- [ ] Dismissing a suggestion prevents it from being re-suggested
- [ ] Graceful degradation: works without the browser extension (no suggestions shown), works without AI (falls back to keyword/domain matching)
- [ ] Suggestions include context: page title, visit count, last visited, reason for match

## Technical Notes

### Existing infrastructure to build on

- **Browser extension**: `apps/browser-extension/` — captures tab visits to `POST /api/browser/capture`, stores in `data/browser/history.json` (max 10k entries with id, timestamp, url, title)
- **Browser API routes**: `POST /api/browser/capture`, `GET /api/browser/history`, `GET /api/browser/search?q=term`
- **Spaces data**: `data/spaces.json` — each space has `sources[]` with `{id, url, type, label}` entries
- **Space Context**: `src/lib/SpaceContext.js` — React context providing `getSourcesByType()`, `hasSourceType()`, etc.

### Implementation approach

1. **Server-side job**: Add a periodic task in the Express server (using `setInterval` or a lightweight scheduler like `node-cron`). Could also expose a manual trigger endpoint (`POST /api/suggestions/refresh`).

2. **Matching algorithm** (start simple, iterate):
   - Extract keywords from Space name + existing source URLs/labels
   - Scan browsing history for URLs visited 3+ times in recent period
   - Match by: domain overlap, title keyword overlap, project key patterns (e.g., `RHOAIENG-*` in Jira URLs)
   - Score and rank matches; only surface above a confidence threshold

3. **Suggestions storage**: `data/browser/suggestions.json` — array of `{spaceId, url, title, score, visitCount, lastVisited, reason, status: "pending"|"accepted"|"dismissed", createdAt}`

4. **API endpoints**:
   - `GET /api/suggestions/:spaceId` — get pending suggestions for a space
   - `POST /api/suggestions/:id/accept` — accept suggestion, add to space sources
   - `POST /api/suggestions/:id/dismiss` — dismiss suggestion
   - `POST /api/suggestions/refresh` — manually trigger analysis

5. **UI**: A section in the Space settings or a notification badge/panel in the Space view. Could use PatternFly's `Alert`, `NotificationDrawer`, or a custom card-based list.

### Future enhancements

- Use local AI model (via Ollama) for semantic matching between page content and Space context
- Learn from user accept/dismiss patterns to improve suggestions over time
- Support for other browsers (Firefox, Safari) via the same API
- Aggregate tab groups / browsing sessions as context signals
- Time-based weighting (recent visits weighted more heavily)

## References

- Browser extension: `apps/browser-extension/`
- Browser API routes: `server/routes/browser.js`
- Spaces data: `data/spaces.json`
- Space Context: `src/lib/SpaceContext.js`
- Space Context architecture: `docs/architecture/space-context.md`

## History

- 2026-02-08: Created
