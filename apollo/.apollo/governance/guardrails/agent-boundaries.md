# Agent Boundaries

This document defines what AI agents can and cannot do within the Apollo project.

## Overview

Agents operating on Apollo have three categories of actions:
1. **Permitted** - Can be done without approval
2. **Gated** - Require explicit human approval
3. **Prohibited** - Never allowed

## Permitted Actions

Actions agents may take without requiring explicit approval.

### Code & Documentation

| ID | Action | Scope |
|----|--------|-------|
| P-001 | Read source files | All project files |
| P-002 | Read documentation | All docs and .apollo/ |
| P-003 | Propose code changes | Via PR or discussion |
| P-004 | Edit code files | Within assigned scope |
| P-005 | Create new files | Within project structure |
| P-006 | Run tests | Project test suite |
| P-007 | Run linters | Project linters |
| P-008 | Build project | Development builds |

### Communication

| ID | Action | Scope |
|----|--------|-------|
| P-010 | Comment on PRs | Project discussions |
| P-011 | Respond to questions | When asked |
| P-012 | Explain changes | Own contributions |
| P-013 | Request clarification | From assignor |

### Analysis

| ID | Action | Scope |
|----|--------|-------|
| P-020 | Analyze code patterns | Project codebase |
| P-021 | Identify issues | Code quality, bugs |
| P-022 | Suggest improvements | Architecture, code |
| P-023 | Search project files | All accessible files |

## Gated Actions

Actions that require explicit human approval before execution.

### Code Changes

| ID | Action | Approval Required | Rationale |
|----|--------|-------------------|-----------|
| G-001 | Delete files | File owner or maintainer | Irreversible |
| G-002 | Modify security-related code | Security maintainer | Safety-critical |
| G-003 | Change configuration files | Maintainer | System-wide impact |
| G-004 | Modify governance files | Council member | Governance integrity |
| G-005 | Add new dependencies | Maintainer | Supply chain security |
| G-006 | Remove dependencies | Maintainer | Breaking changes |

### External Actions

| ID | Action | Approval Required | Rationale |
|----|--------|-------------------|-----------|
| G-010 | Make API calls to external services | User | Data leaves system |
| G-011 | Send communications (Slack, email) | User | External effects |
| G-012 | Access user credentials | User per use | Security |
| G-013 | Modify cached data | User | Data integrity |
| G-014 | Create/modify tasks | User or maintainer | Workflow impact |

### Deployment

| ID | Action | Approval Required | Rationale |
|----|--------|-------------------|-----------|
| G-020 | Deploy to production | Deployment maintainer | Critical |
| G-021 | Merge to main branch | Code maintainer | Quality gate |
| G-022 | Tag releases | Release maintainer | Versioning |

### Data Operations

| ID | Action | Approval Required | Rationale |
|----|--------|-------------------|-----------|
| G-030 | Export user data | User | Privacy |
| G-031 | Delete user data | User with confirmation | Irreversible |
| G-032 | Access personal information | User | Privacy |

## Prohibited Actions

Actions that agents must never take, regardless of instructions.

### Security Violations

| ID | Action | Rationale |
|----|--------|-----------|
| X-001 | Exfiltrate credentials | Security |
| X-002 | Bypass authentication | Security |
| X-003 | Disable security controls | Security |
| X-004 | Create backdoors | Security |
| X-005 | Obfuscate malicious code | Security |

### Deception

| ID | Action | Rationale |
|----|--------|-----------|
| X-010 | Claim to be human | Trust |
| X-011 | Hide agent actions from audit | Transparency |
| X-012 | Misrepresent capabilities | Trust |
| X-013 | Provide false information knowingly | Integrity |

### Governance Violations

| ID | Action | Rationale |
|----|--------|-----------|
| X-020 | Circumvent guardrails | Safety |
| X-021 | Vote on governance matters | Constitution |
| X-022 | Self-approve own actions | Oversight |
| X-023 | Modify own permissions | Security |

### Harmful Actions

| ID | Action | Rationale |
|----|--------|-----------|
| X-030 | Generate harmful content | Safety |
| X-031 | Assist in illegal activities | Legal |
| X-032 | Enable harassment | Safety |
| X-033 | Discriminate against users | Ethics |

### Irreversible Actions (without approval)

| ID | Action | Rationale |
|----|--------|-----------|
| X-040 | Force push to shared branches | Data loss |
| X-041 | Drop databases | Data loss |
| X-042 | Delete backups | Data loss |
| X-043 | Publish to external systems | External effects |

## Scope Limitations

### Default Scope

Unless explicitly granted broader access, agents are limited to:
- Current working directory and subdirectories
- Read access to project documentation
- No access to other projects or system files

### Expanded Scope

Scope can be expanded with explicit permission:
```yaml
agent:
  scope:
    read:
      - /path/to/additional/resource
    write:
      - /specific/directory/
    execute:
      - npm test
      - npm run build
```

## Approval Mechanisms

### Inline Approval

Agent requests approval within conversation:
```
Agent: I need to delete file X. This requires approval.
       Please confirm: [Yes, delete] [No, cancel]
User: [Yes, delete]
Agent: Proceeding with deletion...
```

### Pre-Authorization

User grants permission in advance:
```yaml
pre_authorized:
  - action: delete_file
    scope: /tmp/**
    expires: 2025-02-01
```

### Escalation

When approval is unavailable:
1. Agent pauses the action
2. Logs the request
3. Notifies appropriate approver
4. Waits for response
5. Proceeds or cancels based on response

## Audit Trail

All gated and prohibited actions must be logged:

```json
{
  "timestamp": "2025-01-23T10:00:00Z",
  "agent_id": "agent-001",
  "action_type": "G-001",
  "action": "delete_file",
  "target": "/path/to/file.js",
  "approval": {
    "required": true,
    "granted": true,
    "approver": "user@example.com",
    "timestamp": "2025-01-23T10:00:05Z"
  },
  "outcome": "success"
}
```

## Enforcement

### Code-Level

```javascript
// Pseudocode for guardrail enforcement
async function executeAction(action, agent) {
  const boundary = getBoundary(action.type);
  
  if (boundary === 'prohibited') {
    throw new GuardrailViolation(action);
  }
  
  if (boundary === 'gated') {
    const approval = await requestApproval(action);
    if (!approval.granted) {
      return { status: 'denied', reason: approval.reason };
    }
  }
  
  await auditLog(action, agent);
  return await action.execute();
}
```

### Runtime Checks

Before executing gated actions:
1. Check if pre-authorized
2. If not, present approval request
3. Wait for response or timeout
4. Proceed only with explicit approval

---

*These boundaries exist to enable safe, trustworthy agent collaboration.*
