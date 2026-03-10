# Guardrails

Guardrails define the boundaries within which AI agents operate in the Apollo project. They ensure safety, predictability, and appropriate human oversight.

## Overview

Unlike general guidelines, guardrails are:
- **Constraints** - Hard limits on what agents can do
- **Enforceable** - Can be implemented at the code level
- **Auditable** - Agent actions can be checked against guardrails
- **Explicit** - No ambiguity about what's permitted

## Purpose

Guardrails exist to:

1. **Ensure Safety** - Prevent harmful or unintended actions
2. **Maintain Trust** - Users know what agents can/cannot do
3. **Enable Collaboration** - Clear boundaries allow agents to act confidently
4. **Support Oversight** - Humans can verify agent behavior
5. **Prevent Misuse** - Limit potential for malicious use

## Directory Structure

```
guardrails/
├── README.md               # This file
├── agent-boundaries.md     # What agents can/cannot do
├── api-permissions.md      # Required permissions for APIs
├── prompt-safety.md        # Constraints on system prompts
└── audit-requirements.md   # What must be logged
```

## Guardrail Categories

### 1. Action Boundaries

Define what agents can and cannot do:
- **Permitted actions** - Within scope, no approval needed
- **Gated actions** - Require explicit human approval
- **Prohibited actions** - Never allowed, even with approval

See `agent-boundaries.md` for full specification.

### 2. API Permissions

Define access controls for sensitive APIs:
- **Open APIs** - No special permission required
- **Consent APIs** - Require user acknowledgment
- **Restricted APIs** - Require explicit user approval per use
- **Blocked APIs** - Cannot be called by agents

See `api-permissions.md` for full specification.

### 3. Prompt Safety

Constraints on system prompts and agent configuration:
- Required safety language
- Prohibited instructions
- Transparency requirements

See `prompt-safety.md` for full specification.

### 4. Audit Requirements

What agent actions must be logged:
- Action type and timestamp
- Context and parameters
- Outcome and effects
- Attribution (which agent)

See `audit-requirements.md` for full specification.

## Guardrail Format

Each guardrail document uses this structure:

```markdown
# [Category] Guardrails

## Summary
Brief overview of this guardrail category.

## Guardrails

### GR-XXX: [Name]

**Level:** hard | soft
**Enforcement:** code | runtime | audit
**Rationale:** Why this guardrail exists

**Rule:**
[Clear, unambiguous statement of the constraint]

**Examples:**
- Compliant: [Example]
- Violation: [Example]
```

## Guardrail Levels

### Hard Guardrails

- Cannot be overridden
- Must be enforced at code level when possible
- Violations are critical failures

### Soft Guardrails

- Can be overridden with explicit human approval
- May use runtime checks
- Violations are warnings requiring acknowledgment

## Enforcement Mechanisms

### Code-Level Enforcement

Guardrails implemented in code:
- Permission checks before API calls
- Input validation
- Output filtering
- Capability restrictions

### Runtime Enforcement

Guardrails checked during execution:
- User consent flows
- Approval workflows
- Real-time monitoring

### Audit Enforcement

Guardrails verified through logging:
- Post-hoc analysis
- Anomaly detection
- Compliance reporting

## Future Integration Points

These guardrails are designed to integrate with Apollo at multiple levels:

### 1. System Prompts

Guardrails can be injected into agent system prompts:
```
You are operating under Apollo guardrails.
You MUST NOT: [list from prohibited actions]
You MUST request approval for: [list from gated actions]
```

### 2. API Middleware

Server routes can check guardrails before execution:
```javascript
// Example: Check guardrail before executing
if (guardrails.requiresConsent(action)) {
  await requestUserConsent(action);
}
```

### 3. Agent Framework

Agent initialization can enforce boundaries:
```javascript
const agent = new Agent({
  guardrails: loadGuardrails(),
  auditLog: true,
});
```

### 4. Audit Dashboard

UI to review agent actions against guardrails:
- Action history
- Guardrail compliance status
- Approval audit trail

## Modifying Guardrails

Guardrails are governed like other project rules:

1. **Loosening guardrails** - Requires law proposal process (supermajority)
2. **Tightening guardrails** - Can be done via standard PR process
3. **Adding guardrails** - Requires documentation and review
4. **Emergency guardrails** - Council can add immediately, ratify within 30 days

## Relationship to Laws

Guardrails are a specific type of Safety Law:
- They focus on AI agent behavior
- They are designed for technical enforcement
- They supplement broader behavioral laws

## Testing Guardrails

Guardrails should be tested:
- Unit tests for code-level enforcement
- Integration tests for runtime checks
- Audit log review for compliance
- Red-team exercises for edge cases

---

*Guardrails protect everyone—users, contributors, and the agents themselves.*
