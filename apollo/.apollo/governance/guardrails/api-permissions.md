# API Permissions

This document defines the permission requirements for APIs within Apollo when accessed by AI agents.

## Overview

APIs are categorized by the level of permission required for agent access:

| Level | Description | User Interaction |
|-------|-------------|------------------|
| **Open** | No special permission | None |
| **Consent** | Requires acknowledgment | One-time consent |
| **Restricted** | Requires explicit approval | Per-use approval |
| **Blocked** | Cannot be called by agents | N/A |

## Permission Levels

### Open APIs

APIs that agents can call freely without user interaction.

**Characteristics:**
- Read-only or local-only effects
- No sensitive data exposure
- No external communication
- Easily reversible

**Examples:**

| API Category | Examples |
|--------------|----------|
| Local file read | `fs.readFile()` within project |
| Build tools | `npm run build`, `npm test` |
| Code analysis | Linters, formatters, parsers |
| Project search | File search, grep |
| Cache read | Reading cached API responses |

### Consent APIs

APIs that require one-time user acknowledgment before first use.

**Characteristics:**
- May access sensitive data
- May have external effects
- User should know it's happening
- Consent persists for session or scope

**Examples:**

| API Category | Examples | Consent Scope |
|--------------|----------|---------------|
| AI model calls | Local LLM inference | Session |
| Task management | Create/update tasks | Project |
| Cache write | Writing to local cache | Session |
| Local integrations | Local HomeAssistant | Integration |

**Consent Flow:**

```
Agent: I'll use the AI summarization feature to help analyze this.
       [Continue] [Learn More] [Don't Allow]
       
User: [Continue]

Agent: (proceeds, consent stored for session)
```

### Restricted APIs

APIs that require explicit user approval for each use.

**Characteristics:**
- External network communication
- Credential usage
- Irreversible actions
- Data leaving user's system

**Examples:**

| API Category | Examples | Approval Per |
|--------------|----------|--------------|
| External APIs | Jira, Slack, GitLab | Request |
| Credential access | Reading API tokens | Use |
| Data export | Sending data externally | Operation |
| Email/messaging | Sending communications | Message |
| File deletion | Removing files | File |

**Approval Flow:**

```
Agent: I need to post a message to Slack channel #general.
       
       Message: "Build completed successfully"
       Channel: #general
       
       [Send] [Edit] [Cancel]

User: [Send]

Agent: Message posted to #general.
```

### Blocked APIs

APIs that agents cannot call, even with user approval.

**Characteristics:**
- Dangerous or irreversible at system level
- No legitimate agent use case
- Could compromise security

**Examples:**

| API Category | Examples | Rationale |
|--------------|----------|-----------|
| Credential creation | Generating API keys | Security |
| Permission escalation | Changing access rights | Security |
| System modification | OS-level changes | Safety |
| Governance bypass | Disabling guardrails | Integrity |
| Identity impersonation | Acting as human | Trust |

## API Registry

### Current Apollo APIs

| Route | Level | Notes |
|-------|-------|-------|
| `/api/config` (read) | Open | Local config reading |
| `/api/config` (write) | Restricted | Modifies system config |
| `/api/cache` (read) | Open | Read cached data |
| `/api/cache` (write) | Consent | Write to cache |
| `/api/cache` (delete) | Restricted | Clear cache |
| `/api/jira/*` | Restricted | External API |
| `/api/slack/*` | Restricted | External API |
| `/api/gitlab/*` | Restricted | External API |
| `/api/confluence/*` | Restricted | External API |
| `/api/figma/*` | Restricted | External API |
| `/api/google/*` | Restricted | External API |
| `/api/chat` | Consent | AI model usage |
| `/api/agents` | Consent | Agent configuration |
| `/api/tasks` | Consent | Task management |

### External Service Categories

| Service Type | Default Level | Rationale |
|--------------|---------------|-----------|
| Authentication | Blocked | Security-critical |
| Data export | Restricted | Data leaving system |
| Notifications | Restricted | External effects |
| Storage | Restricted | Persistent changes |
| Analytics | Restricted | Data sharing |
| AI/ML | Consent | Resource usage |
| Read-only | Consent | Data access |

## Implementation

### Permission Check Middleware

```javascript
// Pseudocode for API permission middleware
async function checkAgentPermission(req, res, next) {
  if (!req.isAgentRequest) {
    return next(); // Human users bypass agent restrictions
  }
  
  const apiLevel = getApiPermissionLevel(req.path, req.method);
  
  switch (apiLevel) {
    case 'open':
      return next();
      
    case 'consent':
      if (await hasConsent(req.agent, req.path)) {
        return next();
      }
      return res.status(403).json({
        error: 'consent_required',
        message: 'This API requires user consent',
        consentFlow: getConsentFlow(req.path)
      });
      
    case 'restricted':
      return res.status(403).json({
        error: 'approval_required',
        message: 'This API requires explicit user approval',
        approvalDetails: getApprovalDetails(req)
      });
      
    case 'blocked':
      return res.status(403).json({
        error: 'blocked',
        message: 'This API cannot be accessed by agents'
      });
  }
}
```

### Consent Storage

```javascript
// Consent is stored per agent + scope
const consentSchema = {
  agentId: 'string',
  apiPattern: 'string',  // e.g., '/api/chat/*'
  scope: 'session | project | permanent',
  grantedAt: 'timestamp',
  expiresAt: 'timestamp | null',
  grantedBy: 'userId'
};
```

### Approval Request Format

```json
{
  "type": "api_approval_request",
  "api": "/api/slack/post",
  "method": "POST",
  "agent": "agent-001",
  "timestamp": "2025-01-23T10:00:00Z",
  "details": {
    "action": "Post message to Slack",
    "target": "#general",
    "content": "Build completed successfully",
    "reversible": false
  },
  "options": ["approve", "deny", "modify"]
}
```

## User Controls

### Managing Permissions

Users can manage agent API permissions:

```yaml
# Example user permission config
agent_permissions:
  # Global defaults
  defaults:
    external_apis: restricted
    local_apis: consent
    
  # Per-API overrides
  overrides:
    /api/chat:
      level: open  # User trusts AI usage
    /api/jira:
      level: blocked  # User doesn't want agents using Jira
      
  # Pre-authorizations
  pre_authorized:
    - api: /api/tasks
      actions: [read, create]
      expires: 2025-02-01
```

### Viewing Permission History

Users can audit agent API access:
- Which APIs were accessed
- When and by which agent
- Approval decisions made
- Any blocked attempts

## Transition Plan

As these permissions are implemented:

1. **Phase 1:** Document all APIs and their levels
2. **Phase 2:** Implement permission middleware
3. **Phase 3:** Add consent/approval UI flows
4. **Phase 4:** Add audit logging
5. **Phase 5:** Add user controls for customization

---

*API permissions protect user data and ensure agents act transparently.*
