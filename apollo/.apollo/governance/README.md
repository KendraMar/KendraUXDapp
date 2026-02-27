# Apollo Governance System

The governance folder defines how the Apollo project is governed—by humans and AI agents working together. It establishes rules, processes, and guardrails that ensure the project evolves responsibly and transparently.

## Overview

This governance system is inspired by successful open source community models (Fedora, Apache Software Foundation) but adapted for a unique context: **human-agent collaboration**, where both human contributors and AI coding agents work together on the codebase.

### Core Principles

1. **Transparency** - All governance rules are visible to everyone, including AI agents
2. **Earned Authority** - Influence is based on demonstrated merit and contributions
3. **Consensus-Seeking** - Prefer agreement over voting when possible
4. **Open Communication** - Discussions happen publicly and are archived
5. **Thin Governance** - Minimal bureaucracy; enable action over process
6. **Safety-First** - AI agents operate under explicit guardrails
7. **Human Oversight** - Humans retain final authority over critical decisions

## Folder Structure

```
governance/
├── README.md           # This file - overview and navigation
├── CONSTITUTION.md     # Foundational document defining project values and structure
├── laws/               # Codified rules that have been formally adopted
│   ├── README.md       # How laws are proposed, approved, and enforced
│   ├── active/         # Currently enforced laws
│   ├── proposed/       # Laws under community review
│   └── archived/       # Superseded or repealed laws
├── guardrails/         # AI agent safety constraints and permissions
│   ├── README.md       # How guardrails work
│   ├── agent-boundaries.md    # What agents can/cannot do
│   └── api-permissions.md     # Required permissions for sensitive APIs
├── roles/              # Defined governance roles and responsibilities
│   └── README.md       # Role definitions and authority levels
└── processes/          # Standard operating procedures
    ├── decision-making.md     # How decisions are made
    ├── law-proposal.md        # How to propose new laws
    └── dispute-resolution.md  # How conflicts are resolved
```

## Key Documents

### CONSTITUTION.md

The foundational document that:
- Defines project mission and values
- Establishes governance structure
- Sets immutable principles that require supermajority to change
- Defines the relationship between humans and AI agents

### Laws

Formal rules that have passed the approval process. Laws are:
- **Binding** on all contributors (human and agent)
- **Versioned** with change history
- **Enforceable** through code and process

See `laws/README.md` for the full lifecycle.

### Guardrails

Specific constraints for AI agents that:
- Define permitted and prohibited actions
- Specify required permissions for sensitive operations
- Establish safety boundaries
- Can be integrated into system prompts and code

### Roles

Defined positions with specific authority:
- **Maintainers** - Merge authority, technical direction
- **Stewards** - Governance oversight, dispute resolution
- **Contributors** - Anyone who contributes (human or agent)

## Quick Reference

| Question | Document |
|----------|----------|
| What are Apollo's core values? | `CONSTITUTION.md` |
| What can AI agents do? | `guardrails/agent-boundaries.md` |
| How do I propose a new rule? | `processes/law-proposal.md` |
| What authority do maintainers have? | `roles/README.md` |
| How are disputes resolved? | `processes/dispute-resolution.md` |

## Future Integrations

This governance system is designed to eventually integrate with Apollo at the code level:

1. **System Prompts** - Guardrails can be injected into AI agent prompts
2. **API Permissions** - Sensitive APIs can check governance rules before executing
3. **Audit Logging** - Agent actions can be logged against governance requirements
4. **Automated Enforcement** - Code-level controls can enforce certain laws
5. **Consent Flows** - User acceptance required for certain operations

These integrations are planned but not yet implemented.

## Contributing to Governance

### Proposing Changes

1. **Minor clarifications** - Open a discussion or PR
2. **New laws** - Follow the process in `processes/law-proposal.md`
3. **Constitutional amendments** - Require supermajority approval

### Community Feedback

All significant governance changes require:
- Public announcement
- Minimum 7-day feedback period
- Response to substantive objections
- Documentation of the decision

## Related Resources

- `.apollo/decisions.md` - Architectural Decision Records
- `.apollo/stakeholders.md` - Project stakeholders
- `.apollo/team/` - Team documentation
- `docs/design/principles.md` - Design principles

---

*This governance system is itself governed by the Constitution. To change how governance works, propose a Constitutional amendment.*
