# Cache Storage

**Location:** `./cache/` directory

## Overview

The cache storage system provides local-first persistence for user-created components and data. All data is stored as JSON files in the local file system.

## Storage Location

- **Directory**: `./cache/` (relative to project root)
- **Auto-creation**: Directory is created automatically if it doesn't exist
- **Format**: JSON files (`.json` extension)

## Data Structure

Each cached file contains:

```json
{
  "name": "ComponentName",
  "code": "component code or data...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Operations

### Write Operation
- **Endpoint**: `POST /api/cache/:filename`
- **Process**: 
  1. Receives JSON data from client
  2. Writes to `cache/:filename.json`
  3. Returns success/error response

### Read Operation
- **Endpoint**: `GET /api/cache/:filename`
- **Process**:
  1. Reads file from `cache/:filename.json`
  2. Parses JSON
  3. Returns data to client

### List Operation
- **Endpoint**: `GET /api/cache`
- **Process**:
  1. Reads directory contents
  2. Returns list of filenames

## Use Cases

- **Playground**: Saves user-created component code
- **Settings**: Lists and manages cached files
- **Local-First**: No cloud dependencies, all data stored locally

## File Management

- Files are created on-demand when users save data
- No automatic cleanup (files persist until manually deleted)
- File names are user-specified (via API endpoint)

## Security Considerations

- Files are stored in project directory (not user home)
- No validation on file names (potential path traversal risk)
- No authentication/authorization (local-only application)

## Related Components

- [API Endpoints](./api-endpoints.md) - API for cache operations
- [Express Server](./express-server.md) - Server managing cache directory
- [Pages](./pages.md) - Frontend using cache (Playground, Settings)


