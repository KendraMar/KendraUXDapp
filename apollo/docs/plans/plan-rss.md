# RSS Page Implementation Plan

> **Prompt for Claude Opus 4.5**: Implement a complete RSS feed reader page for the Apollo UI application. This document provides all specifications needed for implementation.

---

## Overview

Create a fully functional RSS feed reader with a three-column layout, OPML import/export support, and subscription management. The page should follow existing patterns in the codebase (see `Slack.js`, `Feed.js` for layout patterns).

---

## Data Storage

### Subscriptions File: `/data/rss/subscriptions.opml`

Store feed subscriptions in standard OPML format for interoperability:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Apollo RSS Subscriptions</title>
    <dateCreated>2024-01-15T10:30:00Z</dateCreated>
    <dateModified>2024-01-15T10:30:00Z</dateModified>
  </head>
  <body>
    <outline text="Hacker News" title="Hacker News" type="rss" 
             xmlUrl="https://news.ycombinator.com/rss" 
             htmlUrl="https://news.ycombinator.com"
             description="Links for the intellectually curious"
             id="hn-001"
             customOrder="0" />
    <outline text="TechCrunch" title="TechCrunch" type="rss"
             xmlUrl="https://techcrunch.com/feed/"
             htmlUrl="https://techcrunch.com"
             description="Startup and technology news"
             id="tc-002"
             customOrder="1" />
  </body>
</opml>
```

**Note**: Use custom `id` and `customOrder` attributes for internal tracking. Generate UUIDs for `id`.

### Alternative: `/data/rss/subscriptions.json`

For easier programmatic access, you may also maintain a JSON version:

```json
{
  "version": "1.0",
  "lastUpdated": "2024-01-15T10:30:00Z",
  "feeds": [
    {
      "id": "hn-001",
      "title": "Hacker News",
      "xmlUrl": "https://news.ycombinator.com/rss",
      "htmlUrl": "https://news.ycombinator.com",
      "description": "Links for the intellectually curious",
      "customOrder": 0,
      "lastFetched": "2024-01-15T10:30:00Z",
      "errorCount": 0,
      "lastError": null
    }
  ]
}
```

### Cached Feed Items: `/data/cache/rss/`

Cache structure:
```
/data/cache/rss/
├── feed_hn-001.json          # Cached items for feed hn-001
├── feed_tc-002.json          # Cached items for feed tc-002
├── images/                   # Cached preview images
│   ├── abc123.jpg
│   └── def456.png
└── metadata.json             # Cache metadata (last refresh times, etc.)
```

**Cached feed file format** (`feed_{id}.json`):

```json
{
  "feedId": "hn-001",
  "feedTitle": "Hacker News",
  "lastFetched": "2024-01-15T10:30:00Z",
  "items": [
    {
      "id": "item-guid-or-hash",
      "title": "Article Title",
      "link": "https://example.com/article",
      "description": "Full article description or summary...",
      "descriptionTruncated": "First 200 characters of description...",
      "content": "Full HTML content if available (content:encoded)...",
      "pubDate": "2024-01-15T08:00:00Z",
      "author": "Author Name",
      "categories": ["tech", "programming"],
      "imageUrl": "/api/rss/images/abc123.jpg",
      "originalImageUrl": "https://example.com/image.jpg",
      "state": "unseen",
      "seenAt": null,
      "saved": false,
      "archived": false
    }
  ]
}
```

### Item States

Each item has independent state properties:

| Property | Type | Description |
|----------|------|-------------|
| `state` | `"unseen"` \| `"seen"` | Whether the user has viewed this item |
| `seenAt` | `ISO timestamp` \| `null` | When the item was first viewed (null if unseen) |
| `saved` | `boolean` | User has starred/bookmarked this for later |
| `archived` | `boolean` | User has cleared this from main feed view |

**State Transitions:**
- **Unseen → Seen**: Automatically when item is clicked/selected in column 2. Records `seenAt` timestamp.
- **Saved toggle**: User clicks star icon. Independent of seen/unseen state.
- **Archived toggle**: User clicks archive button. Item disappears from main feed but remains accessible via Archive filter.

**Important**: `saved` and `archived` are independent boolean flags, NOT mutually exclusive with `state`. An item can be:
- Unseen + Saved (saved without reading)
- Seen + Saved (read and bookmarked)
- Seen + Archived (read and cleared)
- etc.

---

## Frontend Implementation

### File: `src/pages/Rss.js`

Create a React component with a three-column layout following the patterns in `Slack.js` and `Feed.js`.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Header: "RSS" title + badge (unseen count) + Refresh All button         │
├──────────────┬───────────────────────────┬──────────────────────────────┤
│              │                           │                              │
│ COLUMN 1     │ COLUMN 2                  │ COLUMN 3                     │
│ (280px)      │ (350px flex)              │ (flex: 1)                    │
│              │                           │                              │
│ ┌──────────┐ │ Items sorted by date      │ Article Content              │
│ │ Search   │ │ (newest first)            │                              │
│ │ Input    │ │                           │ - Title                      │
│ └──────────┘ │ ┌───────────────────────┐ │ - Source + Date              │
│ ┌──────────┐ │ │ • Title          ☆ 📥 │ │ - Author                     │
│ │ Sort     │ │ │   Description...      │ │ - Categories                 │
│ │ Dropdown │ │ │   [img] Feed · 2h ago │ │ - Full Content (sanitized)   │
│ └──────────┘ │ └───────────────────────┘ │ - Action buttons:            │
│              │ ┌───────────────────────┐ │   [Open Original]            │
│ State Filter:│ │   Another Article ☆ 📥│ │   [Save] [Unseen] [Archive]  │
│ [All|Unseen| │ │   Preview text...     │ │                              │
│  Saved|     ││ │   [img] Feed · 5h ago │ │                              │
│  Archive]   ││ └───────────────────────┘ │                              │
│              │                           │                              │
│ Feed List:   │ (• = unseen indicator)    │                              │
│ ┌──────────┐ │ (☆ = save toggle)         │                              │
│ │ All Feeds│ │ (📥 = archive button)     │                              │
│ │      (42)│ │                           │                              │
│ └──────────┘ │                           │                              │
│ ┌──────────┐ │                           │                              │
│ │ Feed 1   │ │                           │                              │
│ │      (15)│ │                           │                              │
│ └──────────┘ │                           │                              │
│ ┌──────────┐ │                           │                              │
│ │ Feed 2   │ │                           │                              │
│ │       (8)│ │                           │                              │
│ └──────────┘ │                           │                              │
│              │                           │                              │
│ ┌──────────┐ │                           │                              │
│ │+ Add Feed│ │                           │                              │
│ └──────────┘ │                           │                              │
│ ┌──────────┐ │                           │                              │
│ │Import    │ │                           │                              │
│ │OPML      │ │                           │                              │
│ └──────────┘ │                           │                              │
├──────────────┴───────────────────────────┴──────────────────────────────┤
```

**Legend:**
- `(42)` = Unseen item count badge
- `•` = Blue dot indicator for unseen items
- `☆` = Star icon (outline=not saved, filled=saved)
- `📥` = Archive button

### Column 1: Feed List

**Components needed:**

1. **Search/filter input** (TextInput with SearchIcon)

2. **Sort dropdown** (Select) with options:
   - Alphabetical (A-Z)
   - Alphabetical (Z-A)  
   - Custom order
   - Most items
   - Recently updated

3. **State Filter Tabs/Buttons** - Filter items by state:
   - **All** (default) - Shows all non-archived items
   - **Unseen** - Only items with `state: "unseen"`
   - **Saved** - Only items with `saved: true`
   - **Archive** - Only items with `archived: true`

4. **Feed List Section:**
   - "All Feeds" special entry (shows combined view from all feeds)
   - Individual feed entries using Nav/NavList/NavItem (like Slack.js)
   - Each feed shows:
     - Feed icon (RssIcon) or favicon
     - Feed name
     - Unseen count badge (number of unseen, non-archived items)
   - Right-click context menu or kebab menu for each feed:
     - Rename
     - Edit description
     - Reorder (move up/down)
     - Refresh this feed
     - Mark all as seen
     - Archive all seen items
     - Delete feed

5. **Action Buttons:**
   - "Add Feed" button
   - "Import OPML" button
   - "Export OPML" button (optional, in kebab menu)

**State:**
- `feeds[]` - list of subscribed feeds
- `selectedFeedId` - currently selected feed (null = all feeds)
- `searchQuery` - search filter text
- `sortOrder` - current sort order
- `stateFilter` - current state filter: `"all"` | `"unseen"` | `"saved"` | `"archive"`

### Column 2: Items List

**Display:**
- Chronological list (newest first by default, sorted by `pubDate`)
- Each item card shows:
  - **Unseen indicator**: Blue dot if `state: "unseen"`, no dot if `state: "seen"`
  - **Title**: Bold if unseen, normal weight if seen
  - **Truncated description**: 150-200 characters
  - **Preview image thumbnail**: If available, 60x60px (cached locally)
  - **Source feed name**: Small label showing which feed this is from
  - **Relative timestamp**: "2h ago", "1d ago", etc. (from `pubDate`)
  - **Save icon**: Filled star if `saved: true`, outline star if `saved: false`
  - **Archive button**: Small icon to archive the item (removes from main list)

**Filtering (combines feed filter + state filter from Column 1):**
- **Feed filter**: "All Feeds" shows items from all feeds; specific feed shows only that feed's items
- **State filter**:
  - `"all"`: All items where `archived: false`
  - `"unseen"`: Items where `state: "unseen"` AND `archived: false`
  - `"saved"`: Items where `saved: true` AND `archived: false`
  - `"archive"`: Items where `archived: true`

**Behavior:**
- **Click item**: Select it, display in Column 3, and mark as seen (set `state: "seen"`, record `seenAt` timestamp)
- **Click star icon**: Toggle `saved` state (does not select the item)
- **Click archive icon**: Set `archived: true` (item disappears from current view unless in Archive filter)
- Virtual scrolling for large lists (optional enhancement)

**State:**
- `items[]` - list of feed items (all or filtered)
- `selectedItemId` - currently selected item
- `loadingItems` - loading state

### Column 3: Article Content

**Display:**
- Empty state when no item selected ("Select an article to read")
- When item selected:
  - **Article title** (h2)
  - **Source feed name + publication date** (formatted nicely)
  - **Author name** (if available)
  - **Category labels** (if available, as PatternFly Labels)
  - **Full content** rendered as sanitized HTML
  - **Action buttons row:**
    - "Open Original Article" button (opens `link` in new tab)
    - Save/Unsave toggle button (star icon)
    - "Mark as Unseen" button (resets `state` to "unseen", clears `seenAt`)
    - "Archive" button (sets `archived: true`)

**Content Rendering:**
- Use `dangerouslySetInnerHTML` with **DOMPurify** sanitized content
- Handle relative image URLs (resolve against article's `link`)
- Style content with readable typography (good line-height, max-width for readability)
- Images within content should be responsive (max-width: 100%)

**State:**
- Content display comes from `selectedItem` object
- All state changes (save, archive, mark unseen) should optimistically update UI and persist via API

---

## Backend API Implementation

### File: `server/routes/rss.js`

### Required npm packages

Add to package.json:
```json
{
  "dependencies": {
    "rss-parser": "^3.13.0",
    "uuid": "^9.0.0",
    "xml2js": "^0.6.2",
    "dompurify": "^3.0.6",
    "jsdom": "^23.0.0"
  }
}
```

**Note**: `jsdom` is needed for DOMPurify to work on the server side. On the frontend, DOMPurify uses the browser's DOM.

### Refresh Behavior

**IMPORTANT**: Feeds should only refresh manually, never automatically.
- No auto-refresh on page load
- No background refresh intervals
- User must click "Refresh" button to fetch new items
- On first add of a feed, fetch items immediately (one-time)

### API Endpoints

#### `GET /api/rss/feeds`
Returns list of subscribed feeds with metadata.

**Response:**
```json
{
  "success": true,
  "feeds": [
    {
      "id": "hn-001",
      "title": "Hacker News",
      "xmlUrl": "https://news.ycombinator.com/rss",
      "htmlUrl": "https://news.ycombinator.com",
      "description": "Links for the intellectually curious",
      "customOrder": 0,
      "unseenCount": 15,
      "totalCount": 50,
      "lastFetched": "2024-01-15T10:30:00Z",
      "hasError": false
    }
  ]
}
```

**Note**: `unseenCount` = items where `state: "unseen"` AND `archived: false`

#### `POST /api/rss/feeds`
Add a new feed subscription.

**Request:**
```json
{
  "xmlUrl": "https://example.com/feed.xml",
  "title": "Optional custom title",
  "description": "Optional description"
}
```

**Behavior:**
1. Validate URL format
2. Fetch the feed to verify it's valid RSS/Atom
3. Auto-detect title if not provided
4. Generate unique ID
5. Add to subscriptions
6. Cache initial items
7. Return new feed object

**Response:**
```json
{
  "success": true,
  "feed": { /* feed object */ }
}
```

#### `PUT /api/rss/feeds/:id`
Update feed (rename, description, order).

**Request:**
```json
{
  "title": "New Title",
  "description": "New description",
  "customOrder": 5
}
```

#### `DELETE /api/rss/feeds/:id`
Remove a feed subscription.

**Behavior:**
1. Remove from subscriptions
2. Delete cached items file
3. Clean up orphaned images (optional)

#### `POST /api/rss/import`
Import feeds from OPML file.

**Request:** multipart/form-data with OPML file

**Behavior:**
1. Parse OPML XML
2. Extract all feed outlines (handle nested folders if present)
3. For each feed:
   - Check if already subscribed (by xmlUrl)
   - If not, add as new subscription
4. Optionally trigger refresh of new feeds
5. Return import summary

**Response:**
```json
{
  "success": true,
  "imported": 15,
  "skipped": 3,
  "errors": []
}
```

#### `GET /api/rss/export`
Export subscriptions as OPML file.

**Response:** OPML XML file with `Content-Disposition: attachment`

#### `GET /api/rss/items`
Get items from all feeds or specific feed, with filtering.

**Query params:**
- `feedId` (optional): filter to specific feed
- `limit` (optional): max items to return (default 100)
- `offset` (optional): pagination offset
- `stateFilter` (optional): one of `"all"`, `"unseen"`, `"saved"`, `"archive"`
  - `"all"` (default): items where `archived: false`
  - `"unseen"`: items where `state: "unseen"` AND `archived: false`
  - `"saved"`: items where `saved: true` AND `archived: false`
  - `"archive"`: items where `archived: true`

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "id": "item-guid-or-hash",
      "feedId": "hn-001",
      "feedTitle": "Hacker News",
      "title": "Article Title",
      "link": "https://example.com/article",
      "descriptionTruncated": "First 200 characters...",
      "pubDate": "2024-01-15T08:00:00Z",
      "author": "Author Name",
      "imageUrl": "/api/rss/images/abc123.jpg",
      "state": "unseen",
      "seenAt": null,
      "saved": false,
      "archived": false
    }
  ],
  "total": 500,
  "offset": 0,
  "limit": 100
}
```

#### `GET /api/rss/items/:id`
Get full item details including content (for Column 3).

**Response:**
```json
{
  "success": true,
  "item": {
    "id": "item-guid-or-hash",
    "feedId": "hn-001",
    "feedTitle": "Hacker News",
    "title": "Article Title",
    "link": "https://example.com/article",
    "description": "Full description...",
    "content": "Full sanitized HTML content...",
    "pubDate": "2024-01-15T08:00:00Z",
    "author": "Author Name",
    "categories": ["tech", "programming"],
    "imageUrl": "/api/rss/images/abc123.jpg",
    "state": "seen",
    "seenAt": "2024-01-15T10:30:00Z",
    "saved": true,
    "archived": false
  }
}
```

#### `POST /api/rss/refresh`
Refresh all feeds or specific feed. **Manual trigger only - never auto-refresh.**

**Request:**
```json
{
  "feedId": "optional-specific-feed-id"
}
```

**Behavior:**
1. Fetch RSS/Atom feed(s) from their `xmlUrl`
2. Parse items using `rss-parser`
3. For each new item:
   - Generate unique `id` from GUID or hash of link+title
   - Set initial state: `state: "unseen"`, `seenAt: null`, `saved: false`, `archived: false`
   - Extract preview image URL from content/enclosure/media
   - Download and cache preview image to `/data/cache/rss/images/`
   - Store `imageUrl` as local path: `/api/rss/images/{hash}.{ext}`
4. Merge with existing cached items:
   - Keep existing items' state (`state`, `seenAt`, `saved`, `archived`)
   - Add new items
   - Optionally: remove items older than X days (configurable)
5. Update `lastFetched` timestamp on the feed

**Response:**
```json
{
  "success": true,
  "refreshed": 5,
  "newItems": 23,
  "errors": []
}
```

#### `PATCH /api/rss/items/:id`
Update item state (seen/unseen, saved, archived).

**Request (all fields optional):**
```json
{
  "state": "seen",
  "saved": true,
  "archived": false
}
```

**Behavior:**
- If `state` is set to `"seen"` and item was previously `"unseen"`, auto-set `seenAt` to current timestamp
- If `state` is set to `"unseen"`, clear `seenAt` to null
- `saved` and `archived` are independent boolean toggles

**Response:**
```json
{
  "success": true,
  "item": { /* updated item object */ }
}
```

#### `POST /api/rss/feeds/:id/mark-all-seen`
Mark all items in a feed as seen.

**Behavior:**
- Set `state: "seen"` and `seenAt: <current timestamp>` for all unseen items in the feed
- Does not affect `saved` or `archived` states

#### `POST /api/rss/feeds/:id/archive-all-seen`
Archive all seen items in a feed.

**Behavior:**
- Set `archived: true` for all items where `state: "seen"` and `archived: false`
- Useful for clearing out read items from the main feed view

#### `GET /api/rss/images/:filename`
Serve cached preview images.

---

## Server Library

### File: `server/lib/rss.js`

Helper functions:

```javascript
const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize parser with custom fields
const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure']
    ]
  }
});

// Fetch and parse RSS feed
async function fetchFeed(url) { ... }

// Parse OPML file
function parseOpml(opmlContent) { ... }

// Generate OPML from feeds
function generateOpml(feeds, title) { ... }

// Extract first image from content
function extractImageFromContent(htmlContent) { ... }

// Truncate description to specified length
function truncateDescription(text, maxLength = 200) { ... }

// Generate item ID from GUID or hash of link+title
function generateItemId(item) { ... }

// Sanitize HTML content
function sanitizeContent(html) { ... }

// Save subscriptions to OPML and JSON
function saveSubscriptions(feeds) { ... }

// Load subscriptions
function loadSubscriptions() { ... }

// Cache feed items
function cacheFeedItems(feedId, items) { ... }

// Load cached items
function loadCachedItems(feedId) { ... }

// Download and cache image
async function cacheImage(imageUrl, feedId) { ... }
```

---

## Navigation Update

### Update: `/data/nav.json`

Add RSS entry:
```json
{
  "id": "rss",
  "path": "/rss",
  "displayName": "RSS",
  "icon": "RssIcon",
  "order": 2
}
```

### Update: `src/App.js`

Add imports and route:
```javascript
import Rss from './pages/Rss';

// In Routes:
<Route path="/rss" element={<Rss />} />
```

### Update: `server/index.js`

Register the route:
```javascript
const rssRoutes = require('./routes/rss');
app.use('/api/rss', rssRoutes);
```

---

## PatternFly Components to Use

Import from `@patternfly/react-core`:
- PageSection, PageSectionVariants
- Title, Content
- Flex, FlexItem
- Nav, NavItem, NavList
- Badge
- Button
- TextInput
- Select, SelectOption, SelectList, MenuToggle
- Card, CardBody, CardHeader
- DataList, DataListItem, DataListItemRow, DataListItemCells, DataListCell
- Label
- Spinner, Skeleton
- EmptyState, EmptyStateBody, EmptyStateFooter, EmptyStateActions
- Alert
- Modal, ModalVariant
- Form, FormGroup, FormHelperText
- Dropdown, DropdownItem, DropdownList, MenuToggle (for kebab menus)
- Divider
- Tooltip

Icons from `@patternfly/react-icons`:
- RssIcon
- SearchIcon
- PlusCircleIcon
- SyncAltIcon
- TrashIcon
- EditAltIcon
- StarIcon, OutlinedStarIcon (for saved toggle)
- ExternalLinkAltIcon
- CheckCircleIcon
- ExclamationCircleIcon
- ImportIcon, ExportIcon
- SortAlphaDownIcon, SortAlphaUpIcon
- EllipsisVIcon (kebab menu)
- ArchiveIcon or InboxIcon (for archive action)
- EyeIcon, EyeSlashIcon (for seen/unseen toggle)
- FilterIcon (for state filter)

---

## User Experience Details

### Add Feed Modal

When user clicks "Add Feed":
1. Show modal with form:
   - URL input (required) - validate as URL
   - Title input (optional) - placeholder: "Auto-detected from feed"
   - Description input (optional) - textarea
2. On submit:
   - Show loading state
   - Validate and fetch feed
   - If success: add to list, close modal, select the new feed
   - If error: show inline error message

### Import OPML Flow

1. Click "Import OPML" button
2. File picker opens (accept .opml, .xml)
3. Show progress/loading state
4. On complete: show summary modal
   - "Imported 15 feeds, skipped 3 duplicates"
5. Refresh feed list

### Keyboard Navigation

- Up/Down arrows: navigate items in column 2
- Enter: select highlighted item
- J/K: vim-style navigation (optional enhancement)
- R: refresh current feed
- M: mark as read/unread
- S: star/unstar

### Error States

- Feed fetch error: show error badge on feed, allow retry
- Network error: show alert at top of page
- Invalid feed URL: show error in Add Feed modal
- OPML parse error: show error in import summary

### Empty States (Column 2)

Display appropriate messages based on current filters:
- **No feeds subscribed**: "Add a feed to get started" with Add Feed button
- **All filter, no items**: "No articles yet. Click Refresh to fetch new items."
- **Unseen filter, no items**: "All caught up! 🎉 No unseen articles."
- **Saved filter, no items**: "No saved articles. Star items to save them for later."
- **Archive filter, no items**: "Archive is empty. Archived items will appear here."
- **Specific feed, no items**: "No articles from this feed. Try refreshing."

### Loading States

- Initial page load: show skeletons for all columns
- Feed list loading: show spinner in column 1
- Refreshing: show spinner in header, disable refresh button, optionally show progress
- Item loading: show skeleton in column 3 while fetching full content

---

## File Structure Summary

Create these new files:

```
src/pages/
└── Rss.js                    # Main RSS page component

server/routes/
└── rss.js                    # API routes

server/lib/
└── rss.js                    # RSS parsing utilities (optional, can be inline)

data/rss/
└── subscriptions.json        # Feed subscriptions

data/cache/rss/
├── feed_*.json              # Cached feed items
├── images/                  # Cached images
└── metadata.json            # Cache metadata
```

---

## Implementation Checklist

### Phase 1: Basic Structure
- [ ] Install npm dependencies: `rss-parser`, `uuid`, `xml2js`, `dompurify`, `jsdom`
- [ ] Create `/data/rss/` directory structure
- [ ] Create `/data/cache/rss/` and `/data/cache/rss/images/` directories
- [ ] Create `server/routes/rss.js` with basic endpoints
- [ ] Create `server/lib/rss.js` with helper functions
- [ ] Register routes in `server/index.js`
- [ ] Create `src/pages/Rss.js` with three-column layout
- [ ] Add route in `src/App.js`
- [ ] Add entry in `data/nav.json`

### Phase 2: Feed Management
- [ ] Implement GET /api/rss/feeds
- [ ] Implement POST /api/rss/feeds (add feed + initial fetch)
- [ ] Implement DELETE /api/rss/feeds/:id
- [ ] Implement PUT /api/rss/feeds/:id (rename/edit)
- [ ] Create Add Feed modal in frontend
- [ ] Create edit/delete functionality with kebab menu

### Phase 3: Item Display & State Management
- [ ] Implement GET /api/rss/items (with stateFilter support)
- [ ] Implement GET /api/rss/items/:id (full item with content)
- [ ] Implement POST /api/rss/refresh (with image caching)
- [ ] Implement GET /api/rss/images/:filename (serve cached images)
- [ ] Display items in column 2 with unseen indicators
- [ ] Display sanitized article content in column 3
- [ ] Implement PATCH /api/rss/items/:id (state, saved, archived)
- [ ] Auto-mark as seen when item is selected
- [ ] Implement save toggle (star icon)
- [ ] Implement archive button
- [ ] Implement POST /api/rss/feeds/:id/mark-all-seen
- [ ] Implement POST /api/rss/feeds/:id/archive-all-seen

### Phase 4: Filtering & State Filters
- [ ] Add state filter tabs in column 1 (All, Unseen, Saved, Archive)
- [ ] Filter items based on selected state filter
- [ ] Show correct counts per feed (unseen, non-archived items)

### Phase 5: OPML Import/Export
- [ ] Implement POST /api/rss/import
- [ ] Implement GET /api/rss/export
- [ ] Create import UI with file picker
- [ ] Add export button

### Phase 6: Polish
- [ ] Add search/filter functionality for feeds
- [ ] Add sort options for feeds
- [ ] Add keyboard navigation (optional)
- [ ] Handle all error states
- [ ] Add loading skeletons
- [ ] Add empty states for each scenario

---

## Example Feeds for Testing

Include these in a sample OPML for testing:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Test Feeds</title>
  </head>
  <body>
    <outline text="Hacker News" type="rss" xmlUrl="https://news.ycombinator.com/rss" />
    <outline text="Lobsters" type="rss" xmlUrl="https://lobste.rs/rss" />
    <outline text="CSS Tricks" type="rss" xmlUrl="https://css-tricks.com/feed/" />
    <outline text="Smashing Magazine" type="rss" xmlUrl="https://www.smashingmagazine.com/feed/" />
    <outline text="A List Apart" type="rss" xmlUrl="https://alistapart.com/main/feed/" />
  </body>
</opml>
```

---

## Notes for Implementation

1. **Follow existing patterns**: Look at `Slack.js` for the three-column layout pattern and state management approach.

2. **PatternFly v6**: This project uses PatternFly v6. Check component APIs match v6.

3. **Error handling**: Always return `{ success: true/false, error?: string }` pattern.

4. **Data directory**: Use `path.join(dataDir, 'rss')` - see how other routes use `dataDir` from config.

5. **Cache directory**: Use `path.join(cacheDir, 'rss')` - create if not exists.

6. **Styling**: Use inline styles following existing patterns, or PatternFly CSS variables like `var(--pf-v6-global--Color--200)`.

7. **Image caching (REQUIRED)**: 
   - Download all preview images to `/data/cache/rss/images/` during refresh
   - Use a hash of the original URL as the filename to avoid duplicates
   - Serve via `/api/rss/images/:filename` endpoint
   - This avoids CORS issues and enables offline viewing

8. **Content sanitization (REQUIRED)**: 
   - Use **DOMPurify** to sanitize all HTML content before rendering
   - On server: use `jsdom` to create a window for DOMPurify
   - On client: DOMPurify uses browser DOM directly
   - Example server usage:
     ```javascript
     const { JSDOM } = require('jsdom');
     const createDOMPurify = require('dompurify');
     const window = new JSDOM('').window;
     const DOMPurify = createDOMPurify(window);
     const cleanHtml = DOMPurify.sanitize(dirtyHtml);
     ```

9. **Rate limiting**: Be polite when fetching feeds. Don't hammer servers.

10. **UUID generation**: Use `uuid` package or `crypto.randomUUID()` for feed IDs.

11. **Manual refresh only**: 
    - NO auto-refresh on page load
    - NO background refresh intervals
    - User must explicitly click "Refresh" to fetch new items

12. **Item state persistence**:
    - All state changes (seen, saved, archived) must persist immediately via API
    - Use optimistic updates in the UI for responsiveness
    - The `seenAt` timestamp should record when the user first viewed the item
