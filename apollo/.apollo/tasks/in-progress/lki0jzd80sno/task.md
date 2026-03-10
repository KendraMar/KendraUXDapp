---
id: lki0jzd80sno
title: Screen Annotation & Screenshots Feature
type: feature
status: in-progress
priority: high
created: 2025-01-30T00:00:00.000Z
due: null
assignees: []
labels:
  - feature
  - frontend
  - backend
  - masthead
  - screenshots
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: 'masthead, screenshots'
sprint: null
starred: false
flag: null
---

# Screen Annotation & Screenshots Feature

## Description

Add a screen annotation capability to Apollo that allows users to mark up and annotate any page content directly in the browser. A new pencil icon in the masthead activates an overlay canvas mode where users can draw, highlight, and annotate the current view. Annotations can be saved as screenshots to a new Screenshots gallery page.

## User Story

As a **designer or developer**, I want to **annotate and mark up any screen in Apollo**, so that **I can capture feedback, highlight important elements, and share visual notes with my team**.

## Goals

1. Enable in-context screen annotation without leaving the current page
2. Provide intuitive drawing tools (pencil, highlighter) with color selection
3. Save annotated screenshots to a persistent gallery
4. Create a browsable Screenshots page for reviewing saved captures

## Non-Goals

- Video recording or screen capture of interactions
- Collaborative real-time annotation (future enhancement)
- Export to external tools (e.g., Figma, Jira) in this iteration
- OCR or text extraction from screenshots

## Design

- Figma: [TBD - create mockups]
- Prototype: [TBD - create prototype]

## Acceptance Criteria

- [x] Pencil icon appears in masthead next to paperclip and microphone icons
- [x] Clicking pencil icon activates canvas overlay mode
- [x] Tool palette appears with pencil, highlighter, and color picker
- [x] User can draw with pencil tool (freehand lines)
- [x] User can highlight with highlighter tool (semi-transparent strokes)
- [x] Color picker allows selecting colors for pencil and highlighter
- [x] Cancel button closes annotation mode without saving
- [x] Save button (floppy icon) captures the annotated screenshot
- [x] Saved screenshots appear in the Screenshots gallery page
- [x] Screenshots page displays a gallery of all saved screenshots
- [x] Each screenshot includes metadata: title, description, date taken
- [x] Screenshots are stored in `data/screenshots/` with proper structure
- [ ] Documentation updated
- [ ] Tests passing

## Technical Approach

### 1. Masthead Pencil Icon

Add a pencil icon button in `src/components/AppMasthead.js` next to the existing microphone and paperclip buttons. Use PatternFly's `PencilAltIcon` or similar.

```javascript
import { PencilAltIcon } from '@patternfly/react-icons';

<button
  className="masthead-annotate-button"
  onClick={onAnnotateClick}
  aria-label="Annotate screen"
>
  <PencilAltIcon />
</button>
```

### 2. Canvas Overlay Component

Create `src/components/ScreenAnnotation.js`:

- Full-viewport canvas overlay (`position: fixed`, `z-index: 9999`)
- HTML5 Canvas API for drawing
- Capture current page as background image using `html2canvas`
- Pointer events for drawing while allowing visibility of underlying content

Key state:
```javascript
const [isAnnotating, setIsAnnotating] = useState(false);
const [currentTool, setCurrentTool] = useState('pencil'); // 'pencil' | 'highlighter'
const [currentColor, setCurrentColor] = useState('#FF0000');
const [strokes, setStrokes] = useState([]);
```

### 3. Annotation Tools Palette

Floating toolbar component with:

| Tool | Icon | Behavior |
|------|------|----------|
| Pencil | PencilAltIcon | Freehand drawing, solid stroke |
| Highlighter | HighlighterIcon | Semi-transparent wide stroke |
| Color Picker | Input type="color" | Select stroke color |
| Cancel | TimesIcon | Exit without saving |
| Save | SaveIcon (floppy) | Capture and save screenshot |

### 4. Drawing Implementation

```javascript
// Pencil: solid stroke
ctx.strokeStyle = currentColor;
ctx.lineWidth = 3;
ctx.lineCap = 'round';
ctx.globalAlpha = 1.0;

// Highlighter: semi-transparent wide stroke
ctx.strokeStyle = currentColor;
ctx.lineWidth = 20;
ctx.lineCap = 'round';
ctx.globalAlpha = 0.3;
```

### 5. Screenshot Capture

Use `html2canvas` library to capture the annotated view:

```javascript
import html2canvas from 'html2canvas';

const captureScreenshot = async () => {
  const canvas = await html2canvas(document.body);
  const imageData = canvas.toDataURL('image/png');
  // Overlay annotation canvas onto captured image
  // Send to backend API
};
```

### 6. Backend API - Screenshots

Create `server/routes/screenshots.js`:

```javascript
// GET /api/screenshots - List all screenshots
// POST /api/screenshots - Save new screenshot
// GET /api/screenshots/:id - Get single screenshot
// DELETE /api/screenshots/:id - Delete screenshot
// PATCH /api/screenshots/:id - Update metadata
```

### 7. Data Storage Structure

```
data/screenshots/
├── {id}/
│   ├── screenshot.png        # The actual screenshot image
│   └── metadata.json         # Screenshot metadata
```

**metadata.json schema:**
```json
{
  "id": "abc123xyz",
  "title": "Homepage feedback",
  "description": "Annotated comments on header layout",
  "dateTaken": "2025-01-30T14_23_45_123",
  "sourceUrl": "/feed",
  "width": 1920,
  "height": 1080,
  "fileSize": 245678,
  "annotations": {
    "strokeCount": 5,
    "tools": ["pencil", "highlighter"]
  }
}
```

**Date format:** ISO 8601 variant: `YYYY-MM-DDTHH_MM_SS_mmm` (using underscores for filesystem safety)

### 8. Screenshots Page

Create `src/pages/Screenshots.js`:

- Gallery grid layout using PatternFly Gallery component
- Card for each screenshot showing thumbnail, title, date
- Click to view full-size with metadata
- Delete functionality
- Edit title/description

Add route in `src/App.js`:
```javascript
<Route path="/screenshots" element={<Screenshots />} />
```

Add nav item in `src/components/AppSidebar.js`.

## Subtasks

### Phase 1: Masthead & Canvas Infrastructure
- [x] Add pencil icon to masthead (AppMasthead.js)
- [x] Create ScreenAnnotation component shell
- [x] Implement canvas overlay with fixed positioning
- [x] Add page capture using html2canvas
- [x] Wire up activation/deactivation flow

### Phase 2: Drawing Tools
- [x] Implement pencil tool (freehand drawing)
- [x] Implement highlighter tool (semi-transparent)
- [x] Create color picker component
- [x] Add tool palette UI with icons
- [x] Handle touch events for tablet support

### Phase 3: Save/Cancel Flow
- [x] Add cancel button (close without saving)
- [x] Add save button (floppy disk icon)
- [x] Merge annotation canvas with background capture
- [x] Generate screenshot ID and prepare payload
- [x] Create backend POST /api/screenshots endpoint

### Phase 4: Backend & Storage
- [x] Create screenshots route file
- [x] Implement folder structure creation
- [x] Save screenshot image to disk
- [x] Save metadata.json with proper schema
- [x] Implement GET endpoints for listing/fetching

### Phase 5: Screenshots Page
- [x] Create Screenshots.js page component
- [x] Implement gallery grid layout
- [x] Fetch and display screenshots from API
- [x] Add click-to-view modal
- [x] Add delete functionality
- [x] Add edit title/description
- [x] Add to sidebar navigation
- [x] Add route in App.js

### Phase 6: Polish & Testing
- [x] Add loading states
- [x] Add error handling
- [x] Keyboard shortcuts (Escape to cancel, Ctrl+S to save)
- [ ] Mobile responsive adjustments
- [ ] Manual testing across browsers
- [ ] Documentation updates

## Dependencies

- `html2canvas` - NPM package for capturing DOM as canvas
- PatternFly icons for toolbar

## Open Questions

- [x] Should we support undo/redo for strokes? **Yes - undo implemented**
- [ ] Should annotations be editable after saving?
- [ ] Should we add text annotation tool in v1?
- [ ] What's the maximum storage limit for screenshots?
- [ ] Should we add tags/labels to screenshots?

## References

- PatternFly Gallery: https://www.patternfly.org/components/gallery
- html2canvas: https://html2canvas.hertzen.com/
- Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

## Implementation Notes

### Files Created
- `src/components/ScreenAnnotation.js` - Full-featured annotation overlay with canvas, tools, and save modal
- `src/pages/Screenshots.js` - Gallery page for viewing/managing saved screenshots
- `server/routes/screenshots.js` - Backend API for screenshot CRUD operations

### Files Modified
- `src/components/AppMasthead.js` - Added pencil icon button and annotation state
- `src/components/AppSidebar.js` - Added Screenshots nav item with CameraIcon
- `src/App.js` - Added /screenshots route
- `src/custom.css` - Added styles for annotation overlay, toolbar, and gallery
- `server/index.js` - Mounted screenshots API route

### Dependencies Added
- `html2canvas` - For capturing DOM as canvas image

### Known Limitations
- `html2canvas` does not support modern CSS `color()` function (used in PatternFly). Implemented graceful fallback:
  - Attempts to clean problematic CSS during clone phase
  - Falls back to transparent overlay mode if capture fails
  - Re-attempts capture at save time with overlay hidden

### Features Implemented
- Pencil tool with configurable colors
- Highlighter tool (semi-transparent wide strokes)
- Color picker with 8 preset colors
- Undo functionality (Ctrl+Z)
- Keyboard shortcuts (Escape to cancel, Ctrl+S to save)
- Save modal with title/description fields
- Screenshots gallery with thumbnails
- View, edit metadata, and delete screenshots
- Empty state when no screenshots exist

## History

- 2025-01-30: Feature task created
- 2025-01-31: Implementation completed
  - Created ScreenAnnotation component with full drawing capabilities
  - Created Screenshots gallery page with CRUD operations
  - Added backend API for screenshot storage
  - Fixed html2canvas compatibility issue with PatternFly CSS
  - Fixed modal z-index issue so save dialog appears above canvas
