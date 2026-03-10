# Express Server

**File:** `server.js`

## Overview

The Express.js server provides the backend infrastructure for the Apollo Dashboard application. It serves static files, provides API endpoints for cache management, and handles all HTTP requests.

## Server Configuration

- **Port**: 1225 (configurable via `PORT` environment variable)
- **Framework**: Express.js 4.18.2
- **Static Files**: Served from `dist/` directory

## Middleware

### JSON Body Parser
```javascript
app.use(express.json());
```
Parses JSON request bodies for API endpoints.

### Static File Serving
```javascript
app.use(express.static(path.join(__dirname, 'dist')));
```
Serves compiled React application and assets from the `dist/` directory.

## Cache Directory Management

The server automatically creates a `cache/` directory if it doesn't exist:
- Location: `./cache/` (relative to server.js)
- Purpose: Stores cached component data as JSON files
- Auto-creation: Creates directory on server startup if missing

## API Endpoints

See [API Endpoints](./api-endpoints.md) for detailed endpoint documentation.

## Fallback Route

All non-API routes serve the React application's `index.html`:
```javascript
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
```

This enables client-side routing to work properly for all routes.

## Server Startup

```javascript
app.listen(PORT, () => {
  console.log(`🚀 Apollo Dashboard server running at http://localhost:${PORT}`);
  console.log(`📁 Cache directory: ${cacheDir}`);
});
```

## Development vs Production

- **Development**: Run with `npm run dev` (concurrently runs webpack watch + server)
- **Production**: Run with `npm run build` then `npm run server`

## Dependencies

- **express**: Web server framework
- **path**: Node.js path utilities
- **fs**: Node.js file system utilities

## Related Components

- [API Endpoints](./api-endpoints.md) - API route handlers
- [Static Serving](./static-serving.md) - Static file serving
- [Cache Storage](./cache-storage.md) - Cache directory management


