# Decision-Making Process

This document describes how decisions are made in the Apollo project.

## Philosophy

Apollo uses **consensus-seeking** as its primary decision-making model. We prefer:
- Discussion over voting
- Understanding over winning
- Consent over unanimity
- Progress over perfection

Voting is a fallback, not the default.

## Decision Types

| Type | Examples | Process | Approval |
|------|----------|---------|----------|
| **Routine** | Bug fixes, small features | PR review | Maintainer |
| **Significant** | Architecture, dependencies | ADR + review | Maintainer(s) |
| **Policy** | New laws, processes | Proposal + vote | Supermajority (67%) |
| **Constitutional** | Amendments | Proposal + vote | Supermajority (80%) |

## Consensus Process

### Step 1: Discussion

Open a discussion about the decision:
- Describe the situation
- Present options if you have them
- Invite input

**Duration:** Until sufficient input received (typically 2-7 days)

### Step 2: Proposal

Formulate a concrete proposal:
- Clear statement of what will change
- Rationale for the choice
- Acknowledgment of tradeoffs

**Duration:** Immediate after discussion synthesis

### Step 3: Feedback Period

Seek feedback on the proposal:
- Post in appropriate channel
- Tag relevant stakeholders
- Address questions and concerns

**Duration:** 
- Routine: 1-3 days
- Significant: 3-7 days
- Policy: 14+ days
- Constitutional: 30+ days

### Step 4: Revision

Update the proposal based on feedback:
- Incorporate suggestions where possible
- Explain why some feedback wasn't incorporated
- Seek to address objections

**Duration:** As needed

### Step 5: Consent Check

Check for blocking objections:
- "Does anyone have a blocking objection?"
- Blocking = "I cannot live with this decision"
- Concerns without blocks are noted but don't stop progress

**Duration:** 24-72 hours

### Step 6: Decision

If no blocking objections:
- Decision is made
- Document the outcome
- Proceed with implementation

If blocking objections:
- Attempt to address the block
- If unresolvable, escalate or vote

## Lazy Approval

For Routine and some Significant decisions:

1. Proposal is posted
2. Appropriate waiting period
3. If no objections, proposal passes
4. Silence = consent

**Waiting Periods:**
- Minor code changes: 24 hours
- Significant code changes: 72 hours
- Documentation: 24 hours
- Dependencies: 72 hours

## Voting

When consensus fails or is impractical:

### Eligibility

- Active Contributors (contribution in past 12 months)
- One vote per person
- No proxy voting
- AI agents cannot vote

### Voting Period

- 7 days for policy decisions
- 14 days for constitutional amendments
- Can be extended if turnout is low

### Thresholds

| Decision Type | Threshold | Quorum |
|---------------|-----------|--------|
| Routine (rare) | Simple majority (>50%) | None |
| Significant | Simple majority | 3 voters |
| Policy | Supermajority (≥67%) | 5 voters |
| Constitutional | Supermajority (≥80%) | 10 voters |

### Abstentions

- Abstentions don't count toward threshold
- E.g., 7 for, 3 against, 2 abstain = 70% approval

### Recording Votes

Votes are recorded in:
- PR comments (for code decisions)
- Discussion threads (for policy decisions)
- Law files (for law votes)

## Emergency Decisions

For urgent security or safety issues:

1. Council (or any 2 maintainers) can act immediately
2. Action must be documented within 24 hours
3. Normal process follows within 30 days
4. Emergency actions expire if not ratified

## Escalation Path

When decisions get stuck:

1. **Contributor → Maintainer:** If you can't resolve, ask a maintainer
2. **Maintainer → Core Maintainer:** If area expertise isn't enough
3. **Maintainers → Council:** If maintainers disagree
4. **Council → Vote:** If Council can't reach consensus

## Decision Documentation

All significant decisions should be documented:

### For Code Decisions

- Clear commit message
- PR description with rationale
- ADR for architectural decisions

### For Policy Decisions

- Decision record in `governance/`
- Announcement in project channels
- Update to relevant documentation

### ADR Format

See `.apollo/decisions.md` for Architectural Decision Records.

## Common Scenarios

### "Should we add this dependency?"

1. **Type:** Significant
2. **Process:** Open PR with dependency, explain rationale
3. **Approval:** Maintainer review, 72-hour window
4. **Lazy approval** applies

### "Should we change our code style?"

1. **Type:** Policy
2. **Process:** Open discussion, draft proposal, feedback period
3. **Approval:** Supermajority vote if no consensus
4. **Duration:** 14+ day feedback period

### "Someone is blocking every proposal"

1. Ensure their concerns are genuinely heard
2. If concerns are procedural, find compromise
3. If concerns are fundamental, Council may override
4. Document the decision and dissent

### "We need to act now"

1. Council (or 2+ maintainers) can act
2. Document the action and rationale
3. Open for community review
4. Ratify through normal process

## Decision Anti-Patterns

**Avoid:**

- **Bike-shedding:** Endless debate on minor issues
- **Authority creep:** Deciding beyond your scope
- **Consensus theater:** Pretending to seek input after deciding
- **Voting everything:** Voting when discussion would work
- **Analysis paralysis:** Never deciding

**Instead:**

- Set time limits for discussions
- Escalate when stuck
- Trust people in their roles
- Make reversible decisions quickly
- Make irreversible decisions carefully

---

*Good decisions come from good processes, not perfect information.*
