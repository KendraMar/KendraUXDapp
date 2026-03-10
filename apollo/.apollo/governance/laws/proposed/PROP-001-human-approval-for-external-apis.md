---
id: PROP-001
title: Human Approval Required for External API Calls
category: safety
status: proposed
version: 1.0.0
proposed: 2025-01-23
enacted: null
last_amended: null
supersedes: null
superseded_by: null
sponsors:
  - Apollo Governance System (initial)
votes:
  for: 0
  against: 0
  abstain: 0
enforcement: code
---

# PROP-001: Human Approval Required for External API Calls

## Purpose

This law ensures that AI agents cannot send data to external services without explicit human approval. It protects user privacy, prevents unintended data sharing, and maintains user control over their information.

## Law

**All AI agents operating within Apollo must obtain explicit human approval before making any API call that transmits data to external services.**

Specifically:

1. Before executing any API call to a service outside the user's local environment, agents must:
   - Present the intended action to the user
   - Clearly describe what data will be sent
   - Identify the destination service
   - Wait for explicit approval

2. Approval must be:
   - Active (not assumed from silence)
   - Specific to the action (not blanket permission)
   - Revocable at any time

3. Agents must not:
   - Proceed without approval
   - Combine multiple external calls into single approval
   - Misrepresent the nature or destination of the call

## Rationale

Apollo is designed as a local-first application that respects user privacy. External API calls inherently involve sending user data outside their control. This creates risks:

- **Privacy:** User data could be exposed to third parties
- **Security:** Credentials could be transmitted unexpectedly
- **Trust:** Users should know what their tools are doing
- **Control:** Users should decide when their data leaves their system

By requiring explicit approval, we ensure:
- Users maintain sovereignty over their data
- Agents act transparently
- Mistakes are caught before they have external effects
- Trust in the system is preserved

## Enforcement

### Code Enforcement

```javascript
// All external API calls must use the approval middleware
async function callExternalApi(request) {
  if (isAgentContext()) {
    const approval = await requestUserApproval({
      action: 'external_api_call',
      destination: request.url,
      data: summarizeData(request.body),
      message: `Send data to ${request.host}?`
    });
    
    if (!approval.granted) {
      throw new ApprovalDeniedError(request);
    }
    
    await auditLog.record({
      type: 'external_api',
      destination: request.url,
      approval: approval.id,
      timestamp: Date.now()
    });
  }
  
  return await fetch(request);
}
```

### Process Enforcement

- Code reviews must verify external API calls use approval flow
- New integrations must include approval documentation
- Tests must cover approval denial path

### Audit Enforcement

- All external API calls are logged with approval ID
- Logs reviewable by user
- Anomaly detection for unusual patterns

## Exceptions

1. **Cached data retrieval:** Reading from local cache of previously-approved external data does not require new approval.

2. **User-initiated actions:** If the user explicitly triggers an action via the UI (e.g., clicking "Sync with Jira"), that constitutes approval for that specific action.

3. **Pre-authorized services:** Users may pre-authorize specific services via configuration, but must be explicitly informed they are doing so.

## Examples

### Compliant

```
User: Summarize my Jira tickets

Agent: I'll need to fetch tickets from Jira. This will send your 
       authentication token to jira.atlassian.com.
       
       [Proceed] [Cancel]

User: [Proceed]

Agent: (fetches tickets, provides summary)
```

### Non-Compliant

```
User: Summarize my Jira tickets

Agent: (silently fetches tickets from Jira)
       Here are your tickets...
```

### Non-Compliant (Misleading)

```
User: Summarize my Jira tickets

Agent: I'll analyze your project data.
       [OK]

User: [OK]

Agent: (fetches from Jira, but didn't clearly state that)
```

## Impact

### Who is affected?

- AI agents operating in Apollo
- Agent developers
- Users (positively - more control)

### Implementation effort

**Medium**

- New approval UI component
- Middleware for external calls
- Audit logging infrastructure
- Updates to existing integrations

### Transition period

30 days after enactment for existing integrations to comply.

## Related

- `governance/guardrails/api-permissions.md` - API permission levels
- `governance/guardrails/agent-boundaries.md` - Agent action boundaries
- Constitution Article V - AI Agent Governance

## History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2025-01-23 | Initial proposal |

## Discussion

*To be linked when discussion thread is created*

---

*This is a foundational safety law that establishes the baseline for human-agent trust.*
