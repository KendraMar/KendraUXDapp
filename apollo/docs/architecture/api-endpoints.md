# API Endpoints

**Implementation:** Express routes in `server.js`

## Overview

The application provides RESTful API endpoints for managing cached component data. All endpoints are prefixed with `/api/cache`.

## Endpoints

### POST `/api/cache/:filename`

Saves component data to a JSON file in the cache directory.

**Request:**
- **Method**: POST
- **Path Parameter**: `filename` - The name of the cache file (e.g., `MyComponent.json`)
- **Body**: JSON object with component data
  ```json
  {
    "name": "ComponentName",
    "code": "component code...",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
  ```

**Response:**
- **Success (200)**: 
  ```json
  {
    "success": true,
    "message": "Cached data saved to filename.json"
  }
  ```
- **Error (500)**:
  ```json
  {
    "success": false,
    "error": "Error message"
  }
  ```

**Usage:** Used by the Playground page to save component code.

### GET `/api/cache/:filename`

Retrieves cached component data from a JSON file.

**Request:**
- **Method**: GET
- **Path Parameter**: `filename` - The name of the cache file

**Response:**
- **Success (200)**: JSON object containing cached data
- **Not Found (404)**:
  ```json
  {
    "success": false,
    "error": "File not found"
  }
  ```
- **Error (500)**:
  ```json
  {
    "success": false,
    "error": "Error message"
  }
  ```

### GET `/api/cache`

Lists all cached files in the cache directory.

**Request:**
- **Method**: GET
- **No Parameters**

**Response:**
- **Success (200)**:
  ```json
  {
    "files": ["file1.json", "file2.json", ...]
  }
  ```
- **Error (500)**:
  ```json
  {
    "success": false,
    "error": "Error message"
  }
  ```

**Usage:** Used by the Settings page to display all cached files.

## Error Handling

All endpoints include try-catch blocks to handle:
- File system errors
- JSON parsing errors
- Missing files
- Invalid file operations

## File Storage

- **Location**: `./cache/` directory
- **Format**: JSON files
- **Naming**: User-specified filenames (with `.json` extension)

## Related Components

- [Express Server](./express-server.md) - Server implementation
- [Cache Storage](./cache-storage.md) - Storage details
- [Pages](./pages.md) - Frontend consumers (Playground, Settings)


