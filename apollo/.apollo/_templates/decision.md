# Decision Template

Use this template when documenting a significant design or architectural decision.

Either add to the main `decisions.md` file, or create a standalone file for complex decisions.

---

## DEC-XXX: {Title}

**Date**: YYYY-MM-DD
**Status**: Proposed | Decided | Implemented | Superseded | Deprecated
**Deciders**: Names of people who made/approved this decision
**Consulted**: Names of people who provided input
**Informed**: Names of people who should know about this

### Context

What is the issue that we're seeing that is motivating this decision or change?

Include:
- Background information
- Problem statement
- Constraints and requirements
- Relevant history

### Decision Drivers

- Driver 1: e.g., performance requirements
- Driver 2: e.g., maintainability
- Driver 3: e.g., user experience

### Considered Options

1. **Option A**: Brief description
2. **Option B**: Brief description
3. **Option C**: Brief description

### Decision Outcome

Chosen option: **Option X**, because {justification}.

### Pros and Cons of Options

#### Option A
- ✅ Pro 1
- ✅ Pro 2
- ❌ Con 1

#### Option B
- ✅ Pro 1
- ❌ Con 1
- ❌ Con 2

#### Option C
- ✅ Pro 1
- ❌ Con 1

### Consequences

**Positive:**
- What becomes easier?
- What new capabilities does this enable?

**Negative:**
- What becomes harder?
- What technical debt might this create?

**Neutral:**
- Other notable changes

### Implementation Notes

Any specific notes for implementation:
- Approach
- Timeline considerations
- Dependencies

### Related Decisions

- Supersedes: [DEC-YYY]
- Related to: [DEC-ZZZ]
- Enables: [DEC-AAA]

### References

- [Link to discussion]
- [Link to research]
- [Link to related documentation]
