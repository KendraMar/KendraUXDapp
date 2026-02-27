# Apollo Capture

A browser extension that captures your browsing history and sends it to Apollo for tracking and analysis.

## Features

- **Automatic Capture**: Records every page you visit (URL, title, timestamp)
- **Clean URLs**: Automatically strips query parameters and tracking codes
- **Domain Exclusions**: Configure domains to ignore (localhost, browser internal pages, etc.)
- **Recent History**: View your recent browsing history in the popup
- **Privacy-Focused**: All data stays local on your Apollo server

## Installation

### Prerequisites

1. Apollo server must be running locally on port 1226 (development mode)
2. Generate PNG icons from the SVG (see below)

### Generate Icons

Before installing, convert the SVG icon to required PNG sizes:

```bash
# Using ImageMagick (brew install imagemagick)
cd apps/browser-extension/icons
convert -background none icon.svg -resize 16x16 icon-16.png
convert -background none icon.svg -resize 32x32 icon-32.png
convert -background none icon.svg -resize 48x48 icon-48.png
convert -background none icon.svg -resize 128x128 icon-128.png
```

Or use any image editor to export the SVG at 16x16, 32x32, 48x48, and 128x128 pixels.

### Chrome / Edge / Brave

1. Open your browser and go to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `apps/browser-extension` folder
5. The Apollo Capture icon should appear in your toolbar

### Firefox

1. Open Firefox and go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select the `manifest.json` file in `apps/browser-extension`

**Note**: Firefox requires Manifest V2 for permanent installation. This extension uses Manifest V3 which works as a temporary add-on in Firefox.

### Safari

Safari requires additional steps to convert the extension:
1. Run `xcrun safari-web-extension-converter apps/browser-extension`
2. Open the generated Xcode project
3. Build and install

## Configuration

Click the Apollo Capture icon in your browser toolbar to:

1. **Enable/Disable Capture**: Toggle browsing history capture on/off
2. **Excluded Domains**: Add domains you don't want to track (one per line)
3. **View History**: See your recent browsing history

Default excluded domains:
- `localhost`
- `chrome://`
- `chrome-extension://`
- `about:`
- `edge://`
- `moz-extension://`

## API Endpoints

The extension communicates with Apollo's backend:

- `POST /api/browser/capture` - Record a page visit
- `GET /api/browser/history` - Get browsing history
- `GET /api/browser/search?q=term` - Search history
- `DELETE /api/browser/history` - Clear all history
- `DELETE /api/browser/history/:id` - Delete a specific entry

## Data Storage

History is stored in `data/browser/history.json` within the Apollo project directory.

Each entry contains:
```json
{
  "id": "unique-id",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "url": "https://example.com/page",
  "title": "Page Title"
}
```

The history is limited to 10,000 entries to prevent the file from growing too large.

## Troubleshooting

### Extension not capturing

1. Check that Apollo server is running (`npm run dev`)
2. Click the extension icon and verify "Capture Enabled" is on
3. Check browser console for errors

### "Could not connect to Apollo server"

1. Ensure Apollo is running on port 1226 (development) or 1225 (production)
2. Update the `API_BASE` in `background.js` and `popup.js` if using a different port

### History not showing

1. Visit a few pages first
2. Check `data/browser/history.json` exists
3. Verify the API works: `curl http://localhost:1226/api/browser/history`
