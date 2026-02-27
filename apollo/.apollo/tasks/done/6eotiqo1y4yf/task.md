---
id: 6eotiqo1y4yf
title: Add the ability to edit or delete recordings
type: task
status: done
priority: medium
created: '2026-01-25'
due: null
assignees: []
labels:
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: apollo
starred: false
flag: null
---
# Add the ability to edit or delete recordings

## Description

In the Recordings page we need to be able to edit or delete things. Add actions to do so in a kebab menu on the right-hand side of the details view for one, similar to what we did for tasks.

## Acceptance Criteria

- [x] Kebab menu with Edit and Delete options in recording detail view
- [x] Edit modal to update recording title, description, presenter, and tags
- [x] Delete confirmation modal with warning message
- [x] DELETE API endpoint for recordings

## Technical Notes

Implementation details:
- Added DELETE endpoint to `server/routes/recordings.js` - removes entire recording folder
- Updated PATCH endpoint to return the full recording object after update
- Added kebab menu dropdown next to the recording title in `RecordingDetail.js`
- Added edit modal with form fields for title, description, presenter, and tags
- Added delete confirmation modal with danger styling and warning text
- After successful delete, navigates back to recordings list

## References



## History

- 2026-01-25: Created
- 2026-01-25: Completed - Added kebab menu, edit/delete modals, and DELETE API endpoint
