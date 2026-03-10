# Laws

Laws are formal rules that have passed the approval process and are binding on all project contributors—both human and AI agent.

## Overview

Unlike informal conventions or guidelines, laws are:
- **Formally adopted** through a documented process
- **Version-controlled** with change history
- **Enforceable** through code, process, or social mechanisms
- **Amendable** through a defined amendment process
- **Archived** when superseded or repealed

## Directory Structure

```
laws/
├── README.md           # This file
├── active/             # Currently enforced laws
│   ├── LAW-001.md      # Example law
│   └── ...
├── proposed/           # Laws under community review
│   ├── PROP-001.md     # Example proposal
│   └── ...
├── archived/           # Superseded or repealed laws
│   └── ...
└── _templates/
    └── law-template.md # Template for new laws
```

## Law File Format

Each law is a Markdown file with YAML frontmatter:

```yaml
---
id: LAW-001
title: Short descriptive title
category: technical | process | behavioral | safety | governance
status: proposed | under-review | voting | active | amended | repealed
version: 1.0.0
proposed: 2025-01-23
enacted: 2025-02-06
last_amended: null
supersedes: null
superseded_by: null
sponsors:
  - contributor-name
votes:
  for: 15
  against: 2
  abstain: 3
enforcement: code | process | social | mixed
---

# LAW-001: Title

## Purpose
Why this law exists.

## Law
The actual rule, stated clearly and unambiguously.

## Rationale
Explanation of the reasoning behind this law.

## Enforcement
How this law is enforced.

## Exceptions
Any exceptions to this law.

## Examples
Concrete examples of compliance and violation.

## History
| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2025-02-06 | Initial enactment |
```

## Law Categories

### Technical Laws
Rules about code, architecture, and implementation.

**Examples:**
- Required code review before merge
- Security vulnerability disclosure process
- API backwards compatibility requirements

### Process Laws
Required workflows and procedures.

**Examples:**
- Release checklist requirements
- Documentation requirements for new features
- Accessibility compliance process

### Behavioral Laws
Conduct expectations for contributors.

**Examples:**
- Code of conduct provisions
- Communication standards
- Conflict of interest disclosure

### Safety Laws
AI guardrails, security, and privacy protections.

**Examples:**
- Required human approval for irreversible actions
- Data handling requirements
- Agent boundary definitions

### Governance Laws
Meta-rules about decision-making and governance.

**Examples:**
- Voting procedures
- Role eligibility requirements
- Amendment processes

## Law Lifecycle

### 1. Proposal

Anyone may propose a law:

1. Copy `_templates/law-template.md` to `proposed/PROP-XXX.md`
2. Fill in all sections
3. Identify at least one sponsor
4. Submit via pull request or discussion

### 2. Community Review

Proposed laws undergo public review:

- Minimum **14-day** review period
- Discussion in project channels
- Sponsors respond to feedback
- Proposal may be revised based on input

### 3. Voting

After review, eligible contributors vote:

- **7-day** voting period
- **Supermajority (67%)** required to pass
- Voting is public and recorded
- Abstentions do not count against threshold

### 4. Enactment

Upon passing:

1. Law moves to `active/` directory
2. Status updated to `active`
3. Enacted date recorded
4. Announcement to community
5. Enforcement begins after implementation period (if specified)

### 5. Amendment

Active laws may be amended:

1. Propose amendment following same process
2. Reference the law being amended
3. Show specific changes
4. Same voting threshold applies
5. Update version number upon passage

### 6. Repeal

Laws may be repealed:

1. Propose repeal with rationale
2. Same process as new law
3. If passed, law moves to `archived/`
4. Status updated to `repealed`

## Voting Eligibility

Eligible voters are **Active Contributors** as defined in the Constitution:
- At least one accepted contribution in the past 12 months
- Contribution may be code, documentation, design, or governance

## Emergency Laws

In case of immediate security or safety concerns:

1. Stewardship Council may enact temporary laws
2. Effective immediately upon announcement
3. Must undergo normal process within 30 days
4. Expire automatically if not ratified

## Enforcement Levels

### Code Enforcement
- Automated checks (CI/CD, linters)
- Git hooks
- Runtime permissions

### Process Enforcement
- Review checklists
- Required approvals
- Workflow gates

### Social Enforcement
- Community norms
- Peer review
- Reputation

### Mixed Enforcement
Combination of the above.

## Conflict Resolution

When laws conflict:

1. **Specificity** - More specific law takes precedence
2. **Recency** - Later law takes precedence (if explicit)
3. **Safety** - Safety laws take precedence
4. **Constitution** - Constitution supersedes all laws

Unresolved conflicts escalate to Stewardship Council.

## Current Laws

See `active/` directory for all currently enforced laws.

## Proposing Your First Law

1. Identify a need not covered by existing laws
2. Check if a similar proposal exists in `proposed/` or was previously rejected
3. Draft using the template
4. Seek feedback informally before formal proposal
5. Submit with clear rationale and enforcement plan

---

*Laws exist to codify community agreements, not to create bureaucracy. Propose laws when informal norms aren't sufficient.*
