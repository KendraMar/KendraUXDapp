# Ambient Code Platform API Integration Guide

This document provides everything needed to integrate a local application with the Ambient Code Platform (ACP) REST API.

## Overview

The Ambient Code Platform is a Kubernetes-native AI automation platform that orchestrates agentic sessions (Claude-powered AI tasks). The backend exposes a REST API for programmatic access to create, manage, and monitor AI sessions.

## Base URL Configuration

```
# Production (replace with your cluster's apps domain)
https://vteam-backend.<apps-domain>/api

# Example
https://vteam-backend.apps.example.com/api
```

## Authentication

All API requests require a Bearer token in the `Authorization` header.

### Option 1: Access Key (Recommended)

Access keys are project-scoped ServiceAccount tokens with role-based permissions. Create one via the web UI at `/projects/<project-name>/keys` or via API if you already have a token.

```http
Authorization: Bearer <access-key-token>
```

**Roles:**
- `view` - Read-only access to sessions
- `edit` - Create, update, delete sessions (default)
- `admin` - Full project management including permissions

### Option 2: OpenShift OAuth Token

If connected to the cluster:
```bash
export TOKEN=$(oc whoami -t)
```

---

## Core API Endpoints

### Projects

#### List Projects
```http
GET /api/projects
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [
    {
      "name": "my-project",
      "displayName": "My Project",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

#### Create Project
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "new-project",
  "displayName": "New Project"
}
```

---

### Agentic Sessions

#### List Sessions
```http
GET /api/projects/:projectName/agentic-sessions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [
    {
      "name": "my-session",
      "displayName": "My Session",
      "status": {
        "phase": "Running",
        "startTime": "2025-01-20T14:30:00Z"
      },
      "spec": {
        "prompt": "Analyze this codebase",
        "repos": [...]
      }
    }
  ]
}
```

#### Create Session
```http
POST /api/projects/:projectName/agentic-sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "analyze-repo",
  "displayName": "Code Analysis Session",
  "spec": {
    "prompt": "Analyze this codebase and suggest improvements",
    "repos": [
      {
        "input": {
          "url": "https://github.com/myorg/myrepo",
          "branch": "main"
        },
        "output": {
          "url": "https://github.com/myorg/myrepo-fork",
          "branch": "ai-improvements"
        }
      }
    ],
    "interactive": false,
    "timeout": 3600
  }
}
```

**Spec Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | The task/instruction for Claude |
| `repos` | array | Yes | Repository configurations |
| `repos[].input.url` | string | Yes | Source repository URL |
| `repos[].input.branch` | string | Yes | Source branch |
| `repos[].output.url` | string | No | Fork/target repo for changes |
| `repos[].output.branch` | string | No | Target branch for changes |
| `interactive` | boolean | No | Enable chat mode (default: false) |
| `timeout` | integer | No | Timeout in seconds (default: 3600) |
| `mainRepoIndex` | integer | No | Which repo is the working directory (default: 0) |

**Response:**
```json
{
  "message": "Session created",
  "name": "analyze-repo",
  "uid": "abc123-def456"
}
```

#### Get Session
```http
GET /api/projects/:projectName/agentic-sessions/:sessionName
Authorization: Bearer <token>
```

**Response:**
```json
{
  "name": "analyze-repo",
  "displayName": "Code Analysis Session",
  "uid": "abc123-def456",
  "spec": {
    "prompt": "Analyze this codebase and suggest improvements",
    "repos": [...],
    "interactive": false,
    "timeout": 3600
  },
  "status": {
    "phase": "Completed",
    "startTime": "2025-01-20T14:30:00Z",
    "completionTime": "2025-01-20T14:45:00Z",
    "results": "Analysis complete. Found 3 areas for improvement...",
    "repoStatuses": [
      {"repoIndex": 0, "status": "pushed", "prUrl": "https://github.com/..."}
    ]
  }
}
```

**Status Phases:**
- `Pending` - Session created, not yet started
- `Creating` - Operator is provisioning resources
- `Running` - Claude is executing the task
- `Completed` - Task finished successfully
- `Failed` - Task failed with error
- `Stopped` - User stopped the session

#### Start Session
```http
POST /api/projects/:projectName/agentic-sessions/:sessionName/start
Authorization: Bearer <token>
```

#### Stop Session
```http
POST /api/projects/:projectName/agentic-sessions/:sessionName/stop
Authorization: Bearer <token>
```

#### Delete Session
```http
DELETE /api/projects/:projectName/agentic-sessions/:sessionName
Authorization: Bearer <token>
```

---

### Real-Time Streaming (AG-UI Protocol)

For real-time updates during session execution, use Server-Sent Events (SSE):

#### Subscribe to Events
```http
GET /api/projects/:projectName/agentic-sessions/:sessionName/agui/events
Authorization: Bearer <token>
Accept: text/event-stream
```

**Event Stream Format:**
```
event: message
data: {"type": "text", "content": "Analyzing file structure..."}

event: tool_call
data: {"type": "tool_call", "name": "read_file", "input": {"path": "src/main.ts"}}

event: done
data: {"type": "done", "status": "completed"}
```

#### Run with Streaming Response
```http
POST /api/projects/:projectName/agentic-sessions/:sessionName/agui/run
Authorization: Bearer <token>
Content-Type: application/json
Accept: text/event-stream

{
  "message": "Now refactor the authentication module"
}
```

#### Interrupt Running Session
```http
POST /api/projects/:projectName/agentic-sessions/:sessionName/agui/interrupt
Authorization: Bearer <token>
```

#### Send Feedback (Interactive Mode)
```http
POST /api/projects/:projectName/agentic-sessions/:sessionName/agui/feedback
Authorization: Bearer <token>
Content-Type: application/json

{
  "feedback": "Yes, proceed with the refactoring"
}
```

#### Get Conversation History
```http
GET /api/projects/:projectName/agentic-sessions/:sessionName/agui/history
Authorization: Bearer <token>
```

---

### Access Keys Management

#### List Keys
```http
GET /api/projects/:projectName/keys
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [
    {
      "id": "ambient-key-cli-1705678900",
      "name": "cli-access",
      "description": "CLI tool access",
      "role": "edit",
      "createdAt": "2025-01-19T12:00:00Z",
      "lastUsedAt": "2025-01-20T09:30:00Z"
    }
  ]
}
```

#### Create Key
```http
POST /api/projects/:projectName/keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "my-app-key",
  "description": "Access key for my local app",
  "role": "edit"
}
```

**Response:**
```json
{
  "id": "ambient-key-my-app-key-1705765432",
  "name": "my-app-key",
  "key": "eyJhbGciOiJSUzI1NiIs...",
  "description": "Access key for my local app",
  "role": "edit"
}
```

> **Important:** The `key` field is only returned once at creation time. Store it securely.

#### Delete Key
```http
DELETE /api/projects/:projectName/keys/:keyId
Authorization: Bearer <token>
```

---

### Workspace File Access

Read and write files in a session's workspace:

#### List Workspace Files
```http
GET /api/projects/:projectName/agentic-sessions/:sessionName/workspace
Authorization: Bearer <token>
```

#### Get File Contents
```http
GET /api/projects/:projectName/agentic-sessions/:sessionName/workspace/src/main.ts
Authorization: Bearer <token>
```

#### Write File
```http
PUT /api/projects/:projectName/agentic-sessions/:sessionName/workspace/src/main.ts
Authorization: Bearer <token>
Content-Type: text/plain

<file contents>
```

---

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

### Error Response Format
```json
{
  "error": "Human-readable error message"
}
```

---

## Code Examples

### TypeScript/JavaScript

```typescript
const API_BASE = 'https://vteam-backend.apps.example.com/api';
const ACCESS_KEY = process.env.AMBIENT_ACCESS_KEY;

async function createSession(projectName: string, prompt: string, repoUrl: string) {
  const response = await fetch(
    `${API_BASE}/projects/${projectName}/agentic-sessions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `session-${Date.now()}`,
        spec: {
          prompt,
          repos: [{ input: { url: repoUrl, branch: 'main' } }],
          interactive: false,
          timeout: 3600,
        },
      }),
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  return response.json();
}

async function startSession(projectName: string, sessionName: string) {
  const response = await fetch(
    `${API_BASE}/projects/${projectName}/agentic-sessions/${sessionName}/start`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ACCESS_KEY}` },
    }
  );
  return response.json();
}

async function pollSessionStatus(projectName: string, sessionName: string) {
  while (true) {
    const response = await fetch(
      `${API_BASE}/projects/${projectName}/agentic-sessions/${sessionName}`,
      { headers: { 'Authorization': `Bearer ${ACCESS_KEY}` } }
    );
    const session = await response.json();
    
    console.log(`Status: ${session.status.phase}`);
    
    if (['Completed', 'Failed', 'Stopped'].includes(session.status.phase)) {
      return session;
    }
    
    await new Promise(r => setTimeout(r, 5000)); // Poll every 5 seconds
  }
}

// SSE streaming example
function subscribeToEvents(projectName: string, sessionName: string) {
  const eventSource = new EventSource(
    `${API_BASE}/projects/${projectName}/agentic-sessions/${sessionName}/agui/events`,
    { headers: { 'Authorization': `Bearer ${ACCESS_KEY}` } }
  );
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Event:', data);
  };
  
  eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
    eventSource.close();
  };
  
  return eventSource;
}
```

### Python

```python
import os
import time
import requests

API_BASE = "https://vteam-backend.apps.example.com/api"
ACCESS_KEY = os.environ.get("AMBIENT_ACCESS_KEY")

headers = {
    "Authorization": f"Bearer {ACCESS_KEY}",
    "Content-Type": "application/json",
}

def create_session(project_name: str, prompt: str, repo_url: str) -> dict:
    response = requests.post(
        f"{API_BASE}/projects/{project_name}/agentic-sessions",
        headers=headers,
        json={
            "name": f"session-{int(time.time())}",
            "spec": {
                "prompt": prompt,
                "repos": [{"input": {"url": repo_url, "branch": "main"}}],
                "interactive": False,
                "timeout": 3600,
            },
        },
    )
    response.raise_for_status()
    return response.json()

def start_session(project_name: str, session_name: str) -> dict:
    response = requests.post(
        f"{API_BASE}/projects/{project_name}/agentic-sessions/{session_name}/start",
        headers=headers,
    )
    response.raise_for_status()
    return response.json()

def get_session(project_name: str, session_name: str) -> dict:
    response = requests.get(
        f"{API_BASE}/projects/{project_name}/agentic-sessions/{session_name}",
        headers=headers,
    )
    response.raise_for_status()
    return response.json()

def wait_for_completion(project_name: str, session_name: str) -> dict:
    while True:
        session = get_session(project_name, session_name)
        phase = session.get("status", {}).get("phase", "Unknown")
        print(f"Status: {phase}")
        
        if phase in ["Completed", "Failed", "Stopped"]:
            return session
        
        time.sleep(5)

# SSE streaming with sseclient-py
def stream_events(project_name: str, session_name: str):
    import sseclient
    
    response = requests.get(
        f"{API_BASE}/projects/{project_name}/agentic-sessions/{session_name}/agui/events",
        headers={**headers, "Accept": "text/event-stream"},
        stream=True,
    )
    client = sseclient.SSEClient(response)
    
    for event in client.events():
        print(f"Event: {event.data}")

# Usage
if __name__ == "__main__":
    project = "my-project"
    
    # Create and run a session
    result = create_session(project, "Analyze this codebase", "https://github.com/myorg/myrepo")
    session_name = result["name"]
    print(f"Created session: {session_name}")
    
    start_session(project, session_name)
    print("Session started")
    
    final_state = wait_for_completion(project, session_name)
    print(f"Results: {final_state.get('status', {}).get('results', 'No results')}")
```

### cURL

```bash
#!/bin/bash
API_BASE="https://vteam-backend.apps.example.com/api"
PROJECT="my-project"

# Create session
curl -X POST "$API_BASE/projects/$PROJECT/agentic-sessions" \
  -H "Authorization: Bearer $AMBIENT_ACCESS_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-session",
    "spec": {
      "prompt": "Analyze this codebase",
      "repos": [{"input": {"url": "https://github.com/myorg/myrepo", "branch": "main"}}],
      "timeout": 3600
    }
  }'

# Start session
curl -X POST "$API_BASE/projects/$PROJECT/agentic-sessions/my-session/start" \
  -H "Authorization: Bearer $AMBIENT_ACCESS_KEY"

# Get status
curl "$API_BASE/projects/$PROJECT/agentic-sessions/my-session" \
  -H "Authorization: Bearer $AMBIENT_ACCESS_KEY"

# Stream events (SSE)
curl -N "$API_BASE/projects/$PROJECT/agentic-sessions/my-session/agui/events" \
  -H "Authorization: Bearer $AMBIENT_ACCESS_KEY" \
  -H "Accept: text/event-stream"
```

---

## Health Check

Verify API connectivity:

```http
GET /health
```

**Response:**
```json
{"status": "ok"}
```

---

## Tips

1. **Session Names**: Must be valid Kubernetes DNS-1123 labels (lowercase alphanumeric and hyphens, max 63 chars)

2. **Token in Query String**: For WebSocket/SSE connections that don't support headers, you can pass the token as a query parameter:
   ```
   GET /api/projects/my-project/agentic-sessions/my-session/agui/events?token=<access-key>
   ```

3. **Interactive Mode**: Set `interactive: true` for chat-style sessions where you can send follow-up messages via the `/agui/run` endpoint.

4. **Multi-Repo Sessions**: You can include multiple repos in the `repos` array. Use `mainRepoIndex` to specify which one is the primary working directory.

5. **Timeouts**: Default timeout is 1 hour (3600 seconds). Adjust based on task complexity.
