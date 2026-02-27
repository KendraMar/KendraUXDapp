# Law Proposal Process

This document describes how to propose, debate, and enact new laws for the Apollo project.

## Overview

Laws are formal rules that bind all contributors (human and agent). This process ensures laws are:
- Well-considered before adoption
- Debated openly
- Approved by the community
- Documented and enforceable

## Before Proposing

### Check Existing Laws

1. Review `governance/laws/active/` for existing coverage
2. Check `governance/laws/proposed/` for pending proposals
3. Search `governance/laws/archived/` for previously rejected ideas

### Consider Alternatives

- Is a law needed, or would a guideline suffice?
- Could an existing law be amended instead?
- Is this better as a code convention than a law?

### Gather Support

- Discuss the idea informally
- Find at least one sponsor (can be yourself)
- Understand potential objections

## Proposal Process

### Step 1: Draft the Proposal

1. Copy `governance/laws/_templates/law-template.md`
2. Place in `governance/laws/proposed/`
3. Name as `PROP-XXX-short-name.md`

**Required sections:**
- Purpose (why the law is needed)
- Law (the actual rule)
- Rationale (reasoning)
- Enforcement (how it will be enforced)
- Examples (compliant and non-compliant)

### Step 2: Submit for Review

Submit via PR or discussion:

```markdown
## Law Proposal: [Title]

**Proposal:** [Link to PROP-XXX.md]
**Sponsor(s):** [Names]
**Category:** [technical/process/behavioral/safety/governance]

### Summary
[2-3 sentence summary]

### Key Points
- Point 1
- Point 2

### Discussion Questions
- Question for community input
```

### Step 3: Community Feedback Period

**Duration:** Minimum 14 days

During this period:
- Community members provide feedback
- Sponsors respond to questions
- Proposal may be revised
- Objections are documented

**Good feedback includes:**
- Support or opposition with rationale
- Suggestions for improvement
- Questions about edge cases
- Implementation concerns

### Step 4: Revision

Based on feedback:
- Update the proposal
- Note changes in the history section
- Address major objections
- Seek consensus where possible

**If major changes:**
- Restart feedback period (7 days minimum)
- Note "Revised" in proposal status

### Step 5: Call for Vote

After feedback period:

1. Announce intent to vote
2. Publish final proposal (7 days before vote)
3. Clearly state voting period and threshold

```markdown
## Call for Vote: PROP-XXX

The feedback period for [proposal title] is complete.

**Final Proposal:** [Link]
**Voting Period:** [Date] to [Date] (7 days)
**Threshold:** Supermajority (≥67%)
**Eligible Voters:** Active Contributors

Vote by commenting: ✓ Approve / ✗ Reject / ○ Abstain
```

### Step 6: Voting

**Duration:** 7 days

**Voting options:**
- ✓ **Approve** - Support the law
- ✗ **Reject** - Oppose the law
- ○ **Abstain** - No position (doesn't count toward threshold)

**Threshold:** ≥67% of non-abstaining votes

### Step 7: Outcome

#### If Approved

1. Move file from `proposed/` to `active/`
2. Rename to `LAW-XXX.md`
3. Update status to `active`
4. Record enacted date and votes
5. Announce to community
6. Begin enforcement (after any transition period)

#### If Rejected

1. Move file to `archived/` or delete
2. Update status to `rejected`
3. Document the vote outcome
4. May be re-proposed after 3 months with changes

## Fast-Track Process

For urgent safety or security laws:

1. Council may propose with shortened timeline
2. Minimum 7-day feedback (vs 14)
3. Minimum 3-day voting (vs 7)
4. Must still meet supermajority threshold
5. Document urgency rationale

## Amendment Process

To amend an existing law:

1. Follow the same proposal process
2. Reference the law being amended
3. Show specific changes (diff-style if helpful)
4. Explain why the change is needed
5. Same voting threshold applies

**Minor Clarifications:**
- Can be done via standard PR process
- Must not change substantive meaning
- Maintainer approval sufficient

## Withdrawal

Sponsors may withdraw a proposal:
- Before vote: Simply announce withdrawal
- During vote: Announce withdrawal, vote stops
- Document withdrawal reason

## Re-Proposal

A rejected proposal may be re-proposed if:
- At least 3 months have passed
- Substantive changes address previous objections
- Or circumstances have significantly changed

## Examples

### Example Timeline

| Day | Activity |
|-----|----------|
| 0 | Draft submitted |
| 1-14 | Community feedback |
| 15 | Revisions made |
| 16 | Call for vote posted |
| 17-23 | Voting period |
| 24 | Results announced |
| 24-30 | Transition period (if specified) |
| 31 | Enforcement begins |

### Example Vote Count

```
PROP-007 Voting Results:

Approve: 15
Reject: 4
Abstain: 3

Total: 22 votes cast
Non-abstaining: 19 votes
Approval rate: 15/19 = 79%

Threshold: 67%
Result: APPROVED ✓
```

## Template

See `governance/laws/_templates/law-template.md`

## FAQ

**Q: Who can propose a law?**
A: Any contributor (human).

**Q: Can I propose anonymously?**
A: Proposals must have at least one named sponsor.

**Q: What if no one votes?**
A: If quorum (5 voters) isn't met, voting period extends 7 days.

**Q: Can the Council override a vote?**
A: Only for constitutional violations or emergency safety concerns.

**Q: How do I know if I'm an Active Contributor?**
A: If you have an accepted contribution in the past 12 months.

---

*Laws should be few, clear, and meaningful.*
