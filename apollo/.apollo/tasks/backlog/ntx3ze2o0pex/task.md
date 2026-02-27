---
id: ntx3ze2o0pex
title: 'Explore Open Decision Framework relationship to Apollo'
type: spike
status: backlog
priority: medium
created: 2026-02-08T00:00:00.000Z
due: null
assignees: []
labels:
  - research
  - governance
  - ai
  - design
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external:
  odf-repo: https://github.com/open-organization/open-decision-framework
estimate: null
component: null
sprint: null
starred: false
flag: null
---

# Explore Open Decision Framework relationship to Apollo

## Description

Investigate how Apollo's architecture and capabilities could operationalize the [Open Decision Framework](https://github.com/open-organization/open-decision-framework) (ODF) at a scale not previously possible, leveraging generative AI and agent technologies.

The ODF is a flexible, open approach to making collective decisions transparently and inclusively. It was created by Red Hat's People team and is maintained by The Open Organization. It defines four phases of open decision-making (Ideate, Research, Develop, Launch) and introduces key artifacts like the Common Fact Base.

Apollo already has many of the architectural primitives needed to make the ODF's aspirational practices structural and self-sustaining — Space Context for multi-source aggregation, AI summarization, governance models, discussion threading, and modular app architecture. The question is whether these can be composed into something that makes open decision-making genuinely scalable.

This also connects to Doug Engelbart's vision of augmenting collective intelligence — using computing systems not just to help individuals, but to amplify how groups think together, build shared understanding, and make better decisions.

## Key Questions

- Can Apollo's Space Context system be extended to create "Decision Rooms" — purpose-built spaces for open decisions?
- Can AI agents maintain a living Common Fact Base by watching decision-relevant sources?
- Can the governance model (`.apollo/governance/`) be mapped to the ODF's maturity model?
- Can the Discussions app be connected to decision phases for structured feedback collection?
- What would an ODF modular app (`data/apps/odf/`) look like?
- How could AI bridge-build between diverse perspectives at scale?

## Acceptance Criteria

- [ ] Initial analysis of ODF ↔ Apollo architectural alignment (see [analysis.md](./analysis.md))
- [ ] Identify specific ODF concepts that map to existing Apollo primitives
- [ ] Propose a "Decision Room" concept design
- [ ] Evaluate feasibility of AI-maintained Common Fact Base
- [ ] Draft a potential ODF app manifest and architecture
- [ ] Assess connection to Engelbart's augmentation vision

## Technical Notes

The ODF defines four phases with specific practices:
1. **Concept, Define, Ideate** — Publish problem statements, engage diverse perspectives
2. **Plan, Research** — Gather input, set expectations, explain tradeoffs
3. **Design, Develop, Test** — Build community, promote open exchange, conduct premortems
4. **Launch, Deploy, Close** — Demonstrate alignment, contribute upstream, share lessons learned

Key ODF artifacts:
- **Common Fact Base** — Living document giving all stakeholders shared understanding
- **Maturity Model** — Assessment across Communication, Transparency, Release Early/Often, Collaboration
- **OPT Model** — Owner, Participant, Team roles for decisions

Apollo primitives that align:
- Space Context → Decision scoping
- Feed + AI summarization → Living synthesis
- Discussions app → Stakeholder feedback
- `.apollo/governance/` → Decision types, voting, roles
- `.apollo/decisions.md` → ADR archive / "Contribute upstream"
- `.design/` system → Transparency artifacts
- App registry → Modular ODF app

## References

- [Analysis: Apollo x Open Decision Framework](./analysis.md)
- [Open Decision Framework repo](https://github.com/open-organization/open-decision-framework)
- [ODF Community Markdown](https://github.com/open-organization/open-decision-framework/blob/master/ODF-community.md)
- [Common Fact Base Template](https://github.com/open-organization/open-decision-framework/blob/master/common-fact-base-template/CommonFactBase_Master_External.md)
- [The Open Organization](https://theopenorganization.org/)
- [Apollo Space Context docs](../../docs/architecture/space-context.md)
- [Apollo Governance](../../governance/)

## History

- 2026-02-08: Created — initial spike to explore ODF ↔ Apollo relationship
- 2026-02-08: Added initial systems analysis (analysis.md)
