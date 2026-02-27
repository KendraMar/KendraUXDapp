# The Apollo Constitution

*Foundational document governing the Apollo project*

**Version:** 1.0.0  
**Ratified:** 2025-01-23  
**Status:** Active

---

## Preamble

Apollo is a local-first integrated design environment that brings together humans and AI agents to improve design and development workflows. This Constitution establishes the foundational principles, governance structure, and decision-making processes that guide the project's evolution.

We recognize that software development is increasingly collaborative between humans and AI systems. This Constitution explicitly addresses this reality, establishing a framework where both can contribute meaningfully while ensuring human oversight of critical decisions and AI safety.

---

## Article I: Mission & Values

### Section 1.1: Mission

Apollo exists to create an integrated environment where designers, developers, and AI agents collaborate effectively, with full transparency about how the system works and respect for user privacy and autonomy.

### Section 1.2: Core Values

These values guide all project decisions:

1. **User Sovereignty** - Users control their data and workflow; the system serves them, not the reverse
2. **Transparency** - How the system works should be understandable and inspectable
3. **Privacy** - Local-first architecture; data stays with users unless they choose otherwise
4. **Collaboration** - Enable effective human-human and human-agent teamwork
5. **Quality** - Craft software that is reliable, maintainable, and delightful to use
6. **Openness** - Open source code, open governance, open to contributions
7. **Safety** - AI agents operate within defined boundaries with human oversight

### Section 1.3: Immutable Principles

The following principles cannot be changed without supermajority (80%) approval:

1. The project shall remain open source under an OSI-approved license
2. Users shall always be able to run Apollo without external network dependencies
3. AI agents shall not take irreversible actions without explicit human approval
4. Governance decisions shall be made transparently and documented publicly
5. No single entity shall have unilateral control over the project's direction

---

## Article II: Governance Structure

### Section 2.1: Governance Bodies

#### The Stewardship Council

**Composition:** 3-7 members drawn from active contributors  
**Authority:** Strategic direction, dispute resolution, constitutional interpretation  
**Term:** 1 year, renewable  
**Selection:** Consensus of existing Council; in deadlock, contributor vote

#### Maintainers

**Composition:** Contributors with demonstrated expertise in specific areas  
**Authority:** Code review, merge authority, technical decisions within scope  
**Term:** Indefinite, subject to activity requirements  
**Selection:** Nominated by existing maintainers, approved by Council

#### Contributors

**Composition:** Anyone who contributes to the project  
**Authority:** Propose changes, participate in discussions, vote on laws  
**Requirements:** Signed contribution agreement (when applicable)

#### AI Agents

**Status:** Contributors with special constraints  
**Authority:** Same as human contributors, minus voting rights and within guardrails  
**Oversight:** Actions auditable; significant actions require human approval

### Section 2.2: Hierarchy of Authority

For matters not explicitly decided:

1. This Constitution (highest authority)
2. Active Laws in `governance/laws/active/`
3. Architectural Decision Records in `.apollo/decisions.md`
4. Maintainer judgment within scope
5. Established conventions in documentation

### Section 2.3: Scope of Authority

| Body | Can Decide | Cannot Decide |
|------|------------|---------------|
| Stewardship Council | Strategic direction, disputes, law interpretation | Unilaterally change Constitution |
| Maintainers | Technical implementation, code standards | Project direction, governance |
| Contributors | Propose anything, vote on laws | Merge without review |
| AI Agents | Implementation within approved scope | Irreversible actions, governance |

---

## Article III: Decision Making

### Section 3.1: Decision Types

#### Type A: Routine Decisions
- **Examples:** Code style, minor features, bug fixes
- **Process:** Maintainer approval via standard review
- **Timeline:** As needed

#### Type B: Significant Decisions  
- **Examples:** New dependencies, architectural changes, new integrations
- **Process:** Architectural Decision Record (ADR) + maintainer approval
- **Timeline:** Minimum 3-day review period

#### Type C: Policy Decisions
- **Examples:** New laws, governance changes, project direction
- **Process:** Formal proposal + community feedback + vote
- **Timeline:** Minimum 14-day feedback period

#### Type D: Constitutional Amendments
- **Examples:** Changes to Articles I-V of this document
- **Process:** Proposal + 30-day period + supermajority (80%) approval
- **Timeline:** Minimum 30 days

### Section 3.2: Consensus Model

The project prefers **consensus-seeking** over voting:

1. **Discussion** - Explore options and concerns openly
2. **Proposal** - A concrete proposal is made
3. **Feedback** - Stakeholders provide input
4. **Revision** - Proposal updated based on feedback
5. **Consent** - Check for blocking objections
6. **Decision** - If no blocks, proposal passes; otherwise, revise or escalate

**Lazy Approval:** For Type A and some Type B decisions, silence after 72 hours implies consent.

### Section 3.3: Voting

When consensus cannot be reached:

- **Simple majority** (>50%): Type B decisions after failed consensus
- **Supermajority** (≥67%): Type C decisions (laws, policies)
- **Constitutional supermajority** (≥80%): Type D decisions (amendments)

**Eligible voters:** Active contributors (human) as defined in `roles/README.md`

---

## Article IV: Laws

### Section 4.1: Nature of Laws

Laws are formal rules that:
- Have passed the approval process defined in `processes/law-proposal.md`
- Are binding on all contributors (human and agent)
- Are stored in `governance/laws/active/`
- Include enforcement mechanisms

### Section 4.2: Law Categories

1. **Technical Laws** - Code standards, API contracts, architecture constraints
2. **Process Laws** - Required workflows, review standards, release procedures
3. **Behavioral Laws** - Conduct expectations, communication standards
4. **Safety Laws** - AI guardrails, security requirements, privacy protections
5. **Governance Laws** - Procedures for decision-making and dispute resolution

### Section 4.3: Law Lifecycle

```
Proposed → Under Review → Voting → Active → (Amended/Repealed) → Archived
```

See `laws/README.md` for detailed lifecycle documentation.

### Section 4.4: Enforcement

Laws may be enforced through:
- Code-level controls (automated enforcement)
- Process requirements (review checklists)
- Social enforcement (community norms)
- Escalation procedures (for violations)

### Section 4.5: Conflict Resolution

When laws conflict:
1. More specific law takes precedence over general
2. Later-enacted law takes precedence (if explicit)
3. Safety Laws take precedence over non-safety laws
4. Constitution takes precedence over all laws

---

## Article V: AI Agent Governance

### Section 5.1: Agent Rights and Responsibilities

AI agents contributing to Apollo:

**May:**
- Propose code changes via standard processes
- Suggest improvements to documentation
- Execute approved tasks within scope
- Access public project resources

**Must:**
- Operate within defined guardrails
- Document significant actions
- Respect human decisions
- Fail safely when uncertain

**Must Not:**
- Take irreversible actions without human approval
- Access resources beyond their permitted scope
- Circumvent safety controls
- Represent themselves as human

### Section 5.2: Guardrails

Agent constraints are defined in `governance/guardrails/` and include:

- **Boundary definitions** - What agents can and cannot do
- **Permission requirements** - What requires human approval
- **API restrictions** - Which APIs require explicit consent
- **Audit requirements** - What must be logged

### Section 5.3: Human Oversight

Certain actions require human approval regardless of agent capability:

1. **Irreversible changes** - Deletions, deployments, external communications
2. **Security-sensitive operations** - Credential handling, permission changes
3. **External effects** - API calls to third-party services
4. **Governance actions** - Any changes to governance documents

### Section 5.4: Safety Principles

1. **Fail Closed** - When uncertain, agents should not act
2. **Transparency** - Agent actions should be attributable and auditable
3. **Containment** - Agent scope should be minimized to what's needed
4. **Reversibility** - Prefer reversible actions when possible
5. **Human Override** - Humans can always stop or reverse agent actions

---

## Article VI: Rights and Protections

### Section 6.1: Contributor Rights

All contributors have the right to:
- Participate in discussions respectfully
- Propose changes and receive feedback
- Be credited for contributions
- Appeal decisions through defined processes
- Access governance documents and decision history

### Section 6.2: User Rights

All users have the right to:
- Run Apollo locally without network requirements
- Understand how the system processes their data
- Disable AI features entirely
- Export their data in standard formats
- Report safety concerns and receive response

### Section 6.3: Protections

The project shall not:
- Discriminate based on identity or background
- Require proprietary tools for contribution
- Collect user data without explicit consent
- Implement dark patterns or deceptive UI
- Allow harassment or hostile behavior in project spaces

---

## Article VII: Amendments

### Section 7.1: Amendment Process

1. **Proposal** - Any contributor may propose an amendment
2. **Discussion** - Minimum 14-day public discussion period
3. **Revision** - Incorporate feedback, clarify intent
4. **Final Proposal** - Published at least 7 days before vote
5. **Vote** - Supermajority (80%) of eligible voters required
6. **Ratification** - Amendment takes effect upon documentation

### Section 7.2: Emergency Amendments

In case of immediate security or safety concerns:
- Stewardship Council may enact temporary measures
- Temporary measures expire after 30 days
- Permanent changes require standard amendment process

### Section 7.3: Unamendable Provisions

The following cannot be amended:
- The requirement for supermajority to amend immutable principles
- The existence of this Constitution as the supreme governing document
- The principle of human oversight over AI agents

---

## Appendix A: Definitions

**Active Contributor** - A contributor with at least one accepted contribution in the past 12 months

**Agent** - An AI system that can take actions in the project context

**Consensus** - General agreement without blocking objections

**Guardrail** - A constraint on agent behavior

**Law** - A formal rule that has passed the approval process

**Maintainer** - A contributor with merge authority

**Supermajority** - At least 67% approval (80% for constitutional changes)

---

## Appendix B: Ratification

This Constitution was developed through community input and ratified on 2025-01-23.

**Initial Stewardship Council:**  
*To be established through contributor nomination*

**Amendment History:**
| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2025-01-23 | Initial ratification |

---

*"In the beginning was the code, and the code was with the people, and the code was open."*
