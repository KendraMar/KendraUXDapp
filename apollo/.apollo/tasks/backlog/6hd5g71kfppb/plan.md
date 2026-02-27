# Canvas Whiteboard Enhancement Plan

## Architecture Overview

The current canvas has a **top toolbar** with all controls. We will restructure to:

- **Left sidebar**: Vertical tool palette (Miro/Excalidraw style) with tool mode selection
- **Top bar**: Simplified to Back, Title, Undo/Redo, Zoom, Save
- **Canvas area**: Gains drawing layer (SVG overlay) and emoji reaction UI on nodes

```
+--------------------------------------------------+
| Top Bar (Back | Title | Undo/Redo | Zoom | Save) |
+------+-------------------------------------------+
| Side | Canvas Area                                |
| bar  |                                            |
| 48px |                                            |
+------+-------------------------------------------+
```

## JSON Canvas Compatibility Strategy

The JSON Canvas spec (`nodes[]` and `edges[]`) is extensible -- unknown properties are ignored by other tools. We will:

- **Sticky notes**: Store as `type: 'text'` with added `subtype: 'sticky'` property. Other JSON Canvas tools will render them as normal text nodes (graceful degradation).
- **Drawings**: Store as nodes with `type: 'text'`, `subtype: 'drawing'`, and a `drawingData` property containing an array of SVG path point arrays. They appear in the node list and can be selected/moved/deleted like any node.
- **Emoji reactions**: Store as a `reactions` array on any node: `[{emoji: "...", user: "You", addedAt: "..."}]`. Ignored by other tools.

## Implementation Steps

### 1. Update Constants (`canvasConstants.js`)

- Add `TOOL_MODES` enum: `select`, `text`, `sticky`, `draw`
- Add `DEFAULT_STICKY_WIDTH = 200`, `DEFAULT_STICKY_HEIGHT = 200`
- Add `STICKY_COLORS` map (default yellow)
- Add `EMOJI_CATEGORIES` with hand-picked emoji lists (~150 total)

### 2. Create Left Sidebar (`CanvasSidebar.js`)

Vertical strip (~48px wide), dark background, icon buttons with tooltips:

- **Select** (default) — Cursor icon, current behavior
- **Text** — Font icon, click canvas to place text node
- **Sticky Note** — Note icon, click canvas to place sticky
- **Draw** — Pencil icon, click+drag for freehand
- **Image** — Image icon, opens file picker
- **Link** — Link icon, opens modal
- **Group** — Layer icon, places group
- Divider
- **Color** — Palette swatch for selection
- **Delete** — Trash icon for selection

Active tool highlighted. Escape returns to Select.

### 3. Simplify Top Toolbar (`CanvasToolbar.js`)

Remove: Add Node dropdown, Color picker (moved to sidebar).
Keep: Back button, Title, Undo/Redo, Zoom controls, Grid toggle, Delete, Save.

### 4. Sticky Note Rendering (`CanvasNode.js`)

When `node.subtype === 'sticky'`:
- Colored background at ~0.85 opacity (default yellow `#e0de71`)
- Subtle box shadow (`0 4px 12px rgba(0,0,0,0.3)`)
- 12px border-radius
- Default 200x200 (square)
- Larger font, centered text
- No visible border (shadow provides definition)

### 5. Drawing Tool

**Capture (in `CanvasDetail.js`):**
- When `activeTool === 'draw'`, mouse handlers change to stroke capture mode
- mouseDown: start collecting points `[{x, y}]`
- mouseMove: append points (throttle at ~3px distance)
- mouseUp: calculate bounding box, create drawing node

**Rendering (in `CanvasNode.js`):**
- When `node.subtype === 'drawing'`:
- Render `<svg>` inside node at full width/height
- Convert `drawingData.paths[].points` to SVG `<path>` elements
- Points are stored relative to node origin (0,0 = top-left of node)
- Transparent background, no border

### 6. Emoji Picker (`EmojiPicker.js`)

Custom, no dependencies:
- ~280px wide popover
- Category tabs: Smileys, Gestures, Hearts, Objects, Nature, Food
- ~150 hand-picked emojis
- Search input filters by keyword
- Recently Used section (localStorage)
- Click to select, picker closes

### 7. Emoji Reactions on Nodes (`CanvasNode.js`)

- On hover: show "+" circle at bottom-left corner of node
- Click "+": open EmojiPicker positioned near button
- Selected emoji added to `node.reactions[]`
- Reactions render as small pills at bottom of node content
- Click existing reaction: toggle (add/remove)
- Data: `{emoji: "👍", user: "You", addedAt: "2026-02-12T..."}`

### 8. Layout Integration (`CanvasDetail.js`)

- Main content area: `flex-direction: row` (sidebar + canvas)
- Add `activeTool` state
- Tool click handlers: set active tool, modify canvas mouse behavior
- Text/Sticky tools: canvas click creates node at click position, returns to select
- Draw tool: canvas mouse handlers switch to stroke capture
- Wire emoji reaction CRUD to `updateCanvasData`

### 9. Keyboard Shortcuts

- `V` — Select tool
- `T` — Text tool
- `S` — Sticky note tool
- `D` — Draw tool
- `Escape` — Return to Select, cancel current operation

## Scope Exclusions

- Comment tool (future annotation layer)
- Shape tools (rectangle/ellipse) beyond existing nodes
- Eraser tool for drawings (delete the node instead)
- Multi-stroke drawing editing (each stroke is a single node)
