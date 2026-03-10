---
id: jo3i6dzeq16q
title: 'Inline Document Discussions (Google Docs-style commenting)'
type: feature
status: done
priority: high
created: 2026-02-10T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - backend
  - feature
  - documents
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: documents
sprint: null
starred: false
flag: null
---

# Inline Document Discussions (Google Docs-style commenting)

## Description

Add the ability to start discussions and leave comments directly alongside documents, similar to Google Docs commenting. Users can highlight text in a document, click a button to start a discussion thread, and a sidebar panel opens to display and manage the conversation.

This brings collaborative review capabilities to Apollo's document editor, allowing team members to leave contextual feedback anchored to specific text passages.

## Acceptance Criteria

- [x] Users can select text in the rich editor and click a "Comment" button to start a discussion
- [x] A floating tooltip/popover appears near the text selection with a "Comment" action
- [x] Discussions are displayed in a collapsible sidebar panel on the right side of the document
- [x] Each discussion thread is anchored to a specific text range in the document
- [x] Anchored text is highlighted in the editor to indicate an active discussion
- [x] Clicking highlighted text opens and scrolls to the corresponding discussion in the sidebar
- [x] Users can type comments with basic formatting (bold, italic, code)
- [x] Users can reply to existing discussion threads (threaded comments)
- [x] Discussions can be resolved/reopened
- [x] Discussion data is stored in a `discussions/` folder inside the document directory
- [x] Each thread is a separate JSON file for easy management
- [x] Anchoring uses selected text + surrounding context for reliable re-matching even after document edits

## Technical Notes

### Data Storage
- Path: `data/documents/{docId}/discussions/{threadId}.json`
- Each thread is a separate JSON file containing the anchor info, status, and array of comments
- Anchor strategy: store selected text + prefix/suffix context for fuzzy re-matching

### Anchor Format
```json
{
  "text": "exact selected text",
  "prefix": "~30 chars before selection",
  "suffix": "~30 chars after selection"
}
```

### Frontend Components
- `DiscussionsSidebar` - Drawer panel showing all threads for the document
- `DiscussionThread` - Individual thread with comment list and reply composer
- Integration into `DocumentDetail.js` via PatternFly Drawer
- TipTap `CommentHighlight` extension for marking anchored ranges
- Floating tooltip on text selection for "Add Comment" action

### API Endpoints
- `GET /api/documents/:id/discussions` - List threads
- `POST /api/documents/:id/discussions` - Create thread
- `PUT /api/documents/:id/discussions/:threadId` - Update thread (resolve/reopen)
- `DELETE /api/documents/:id/discussions/:threadId` - Delete thread
- `POST /api/documents/:id/discussions/:threadId/comments` - Add reply
- `PUT /api/documents/:id/discussions/:threadId/comments/:commentId` - Edit comment
- `DELETE /api/documents/:id/discussions/:threadId/comments/:commentId` - Delete comment

## References

- Existing pattern: `data/apps/prototypes/pages/components/PrototypeDiscussionsPanel.js`
- Google Docs commenting UX as inspiration

## History

- 2026-02-10: Created
- 2026-02-10: Implemented
