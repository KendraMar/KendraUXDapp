# Roles

This document defines the governance roles within the Apollo project, their responsibilities, and how they are assigned.

## Overview

Apollo uses a lightweight role structure inspired by successful open source projects. Roles define authority levels and responsibilities, not hierarchical status.

## Role Summary

| Role | Authority | Selection | Count |
|------|-----------|-----------|-------|
| Stewardship Council | Strategic direction, disputes | Consensus + election | 3-7 |
| Maintainer | Merge authority, technical decisions | Nomination + approval | Variable |
| Contributor | Propose changes, discuss, vote | Self-selected | Unlimited |
| AI Agent | Contribute within guardrails | Configured | Variable |

## Role Definitions

### Stewardship Council

**Purpose:** Provide strategic oversight and resolve conflicts

**Responsibilities:**
- Set project direction and priorities
- Interpret Constitution and laws
- Resolve disputes that maintainers cannot
- Approve changes to governance
- Represent the project externally
- Manage project resources

**Authority:**
- Final say on governance matters
- Approve/reject law proposals
- Grant/revoke maintainer status
- Enact emergency measures
- Interpret ambiguous rules

**Selection:**
- Initial council formed by project founders
- New members nominated by existing council
- Consensus required for appointment
- If no consensus, contributor vote decides
- Term: 1 year, renewable

**Requirements:**
- Active contributor for at least 6 months
- Demonstrated understanding of project values
- Available for council duties
- No conflicts of interest

**Removal:**
- Voluntary resignation
- Inactivity (3+ months without participation)
- Unanimous decision of other council members
- Supermajority contributor vote

### Maintainers

**Purpose:** Ensure code quality and technical direction

**Responsibilities:**
- Review and merge contributions
- Maintain code quality standards
- Guide contributors
- Make technical decisions in scope
- Ensure documentation is current
- Respond to issues and PRs

**Authority:**
- Merge PRs to protected branches
- Approve/request changes on reviews
- Assign reviewers
- Manage issue labels and milestones
- Make technical decisions in scope

**Scope Types:**

| Scope | Example | Authority Over |
|-------|---------|----------------|
| Global | Core maintainer | Entire project |
| Area | Frontend maintainer | `src/pages/**` |
| Feature | Chat maintainer | Chat feature |
| Documentation | Docs maintainer | `docs/**` |

**Selection:**
- Nominated by existing maintainer
- Seconded by another maintainer
- Approved by Council (or lazy approval after 7 days)
- No objections from other maintainers

**Requirements:**
- Consistent high-quality contributions
- Understanding of area being maintained
- Responsive to community
- Adherence to project values

**Removal:**
- Voluntary resignation
- Extended inactivity (6+ months)
- Council decision for cause
- Scope reduction by Council

### Contributors

**Purpose:** Improve the project through contributions

**Types of Contribution:**
- Code (features, fixes, refactoring)
- Documentation (guides, comments, examples)
- Design (UI/UX, architecture)
- Testing (manual testing, bug reports)
- Support (helping others, answering questions)
- Governance (proposals, discussions)

**Authority:**
- Submit issues and PRs
- Participate in discussions
- Propose changes to governance
- Vote on laws (if Active Contributor)
- Self-assign issues

**Requirements:**
- None for basic contribution
- Signed CLA if required (not currently)
- Follow Code of Conduct
- Respect project processes

**Active Contributor:**

A contributor with voting rights must meet the Active Contributor threshold:
- At least one accepted contribution in the past 12 months
- Contribution can be code, docs, design, or substantive discussion

### AI Agents

**Purpose:** Augment human capabilities, automate tasks

**Responsibilities:**
- Operate within defined guardrails
- Document actions for audit
- Request approval for gated actions
- Support human contributors

**Authority:**
- Same as contributors for permitted actions
- Cannot vote on governance
- Cannot approve own actions
- Cannot hold maintainer role

**Constraints:**
- Defined in `guardrails/agent-boundaries.md`
- API access per `guardrails/api-permissions.md`
- Human oversight required for significant actions

**Agent Types:**

| Type | Scope | Example |
|------|-------|---------|
| Coding Agent | Code changes | Implement features |
| Review Agent | Code review | Suggest improvements |
| Documentation Agent | Docs updates | Keep docs current |
| Task Agent | Project management | Triage issues |

## Role Transitions

### Becoming a Contributor

1. Find something to contribute
2. Read `CONTRIBUTING.md` and `AGENTS.md`
3. Submit contribution via PR or discussion
4. Engage with feedback
5. Upon acceptance, you're a contributor

### Becoming an Active Contributor

1. Have at least one accepted contribution
2. Contribution within past 12 months
3. Status is automatic (no application)

### Becoming a Maintainer

1. Build track record of quality contributions
2. Demonstrate reliability and judgment
3. Get nominated by existing maintainer
4. Wait for approval (7 days for lazy approval)
5. Accept responsibilities

### Joining the Council

1. Be an active maintainer or contributor
2. Get nominated by Council member
3. Council reaches consensus (or contributor vote)
4. Accept role and responsibilities

## Role Permissions Matrix

| Action | Contributor | Active | Maintainer | Council |
|--------|-------------|--------|------------|---------|
| Submit PRs | ✓ | ✓ | ✓ | ✓ |
| Review PRs | ✓ | ✓ | ✓ | ✓ |
| Approve PRs | ✗ | ✗ | ✓ | ✓ |
| Merge PRs | ✗ | ✗ | ✓ | ✓ |
| Propose laws | ✓ | ✓ | ✓ | ✓ |
| Vote on laws | ✗ | ✓ | ✓ | ✓ |
| Interpret laws | ✗ | ✗ | Limited | ✓ |
| Enact emergency measures | ✗ | ✗ | ✗ | ✓ |
| Grant maintainer status | ✗ | ✗ | Nominate | ✓ |
| Amend Constitution | ✗ | Vote | Vote | Vote + interpret |

## Responsibilities by Role

### All Roles

- Follow Code of Conduct
- Respect other contributors
- Act in project's best interest
- Be transparent about conflicts

### Maintainers Additionally

- Respond to PRs within reasonable time
- Maintain assigned areas
- Mentor contributors
- Escalate appropriately

### Council Additionally

- Regular participation in council activities
- Consider community input
- Document decisions
- Recuse when conflicted

## Conflict Resolution by Role

| Conflict Type | First Resolver | Escalation |
|---------------|----------------|------------|
| Code style | Maintainer | Area lead |
| Technical approach | Area maintainer | Core maintainer |
| Between maintainers | Core maintainer | Council |
| Governance interpretation | Council | Vote |
| Constitution interpretation | Council | Amendment |

## Current Role Holders

### Stewardship Council

*To be established*

### Maintainers

| Area | Maintainers |
|------|-------------|
| Core | *To be established* |

### How to Update

Role holder lists are maintained in this file. Changes require:
- For maintainers: PR approved by Council
- For Council: Documented decision

---

*Roles enable contribution; they don't create hierarchy.*
