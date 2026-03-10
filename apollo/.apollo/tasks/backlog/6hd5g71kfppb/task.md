---
id: 6hd5g71kfppb
title: 'Canvas Whiteboard Enhancement: Miro/Excalidraw-Style Tools'
type: feature
status: backlog
priority: high
created: 2026-02-12T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - feature
  - canvas
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: canvas
sprint: null
starred: false
flag: null
---

# Canvas Whiteboard Enhancement: Miro/Excalidraw-Style Tools

## Description

Transform the Canvas application into a more feature-rich whiteboard tool inspired by Miro and Excalidraw. The current Canvas supports basic node types (text, file, link, group) with a top toolbar. This enhancement adds a left-hand side tool palette, a sticky note node type, a freehand drawing/pencil tool, and emoji reactions on any node — all while maintaining JSON Canvas specification compatibility.

Key motivations:
- Make Canvas feel like a real collaborative whiteboard rather than just a node editor
- Sticky notes are a natural fit for brainstorming and ideation workflows
- Freehand drawing enables quick sketches and annotations
- Emoji reactions add lightweight feedback without requiring comments

## Acceptance Criteria

- [ ] Left-side vertical tool palette replaces the "Add Node" dropdown as the primary tool selection UI
- [ ] Tool modes: Select, Text, Sticky Note, Draw, Image, Link, Group
- [ ] Sticky note node type with post-it visual style (colored background, shadow, square-ish shape)
- [ ] Freehand drawing tool that captures mouse strokes and creates drawing nodes
- [ ] Drawing nodes render as inline SVG within their bounding box
- [ ] Emoji reactions on any node: hover to show "+" button, click to open emoji picker
- [ ] Custom emoji picker (no external dependencies) with categories, search, and recently-used
- [ ] Reaction data (emoji, user, timestamp) saved in the JSON Canvas file
- [ ] All new features use JSON Canvas extension properties (extra fields on nodes) for compatibility
- [ ] Keyboard shortcuts for tool switching (V=select, T=text, S=sticky, D=draw, Escape=back to select)
- [ ] Top toolbar simplified to: Back, Title, Undo/Redo, Zoom, Grid toggle, Save
- [ ] Existing functionality (select, drag, connect, resize, groups, edges) continues to work

## Technical Notes

### JSON Canvas Compatibility

The JSON Canvas spec is extensible — unknown properties on nodes are ignored by other tools. We use:
- `subtype: 'sticky'` on text nodes for sticky notes
- `subtype: 'drawing'` + `drawingData` on text nodes for drawings
- `reactions: [{emoji, user, addedAt}]` on any node for reactions

### File Structure

New files:
- `data/apps/canvas/pages/components/CanvasSidebar.js` — Vertical tool palette
- `data/apps/canvas/pages/components/EmojiPicker.js` — Custom emoji picker
- `data/apps/canvas/pages/components/DrawingLayer.js` — SVG drawing overlay

Modified files:
- `data/apps/canvas/pages/CanvasDetail.js` — Layout, tool modes, drawing capture, emoji CRUD
- `data/apps/canvas/pages/components/CanvasNode.js` — Sticky rendering, drawing rendering, reaction UI
- `data/apps/canvas/pages/components/CanvasToolbar.js` — Simplified top bar
- `data/apps/canvas/pages/canvasConstants.js` — New defaults, tool modes, emoji data

## References

- [Implementation Plan](./plan.md)

## History

- 2026-02-12: Created
