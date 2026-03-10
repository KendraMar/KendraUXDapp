---
id: 05a72ef1b0e5
title: 'Prototype: Annotation-to-Code AI Interpretation'
type: feature
status: backlog
priority: high
created: 2026-01-31T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - backend
  - prototypes
  - ai
  - annotation
  - reveal-script
  - apollo
parent: null
blocks: []
blocked_by: []
related:
  - 53ce03d46fd6
external: {}
estimate: null
component: Prototypes
sprint: null
starred: false
flag: null
---

# Prototype: Annotation-to-Code AI Interpretation

## Description

Implement AI interpretation of visual annotations into code changes as described in the Apollo Reveal Script (Scenes 6.1-6.3):

> "Now I'm going to annotate directly. I think this button would work better over here..."
>
> [User draws annotations: circles an element, draws arrow showing where it should move, crosses out elements, adds text notes]
>
> "Now watch this. I click 'Apply Annotations' and Apollo interprets my drawings."

This is a signature feature of Apollo's annotation-driven design philosophy: draw your intent, AI interprets and implements.

## Current State

Apollo already has a `ScreenAnnotation` component (`src/components/ScreenAnnotation.js`) that supports:
- Drawing tools (pencil, highlighter, text)
- Color selection
- Stroke capture and rendering
- Screenshot saving to `/api/screenshots`

What's missing is the AI interpretation layer that converts annotations into code modifications.

## Features to Implement

### Annotation Mode for Prototypes
- Dedicated annotation mode in prototype viewer
- Draw directly over the prototype iframe
- Support annotation types:
  - **Circles/highlights** - "Focus on this element"
  - **Arrows** - "Move this here"
  - **Strikethroughs/X** - "Remove this"
  - **Text notes** - "Add specific instruction"

### AI Annotation Analysis
- Capture annotation layer with element positions
- Map annotations to DOM elements in prototype
- Interpret annotation semantics:
  - Circle around button → identify that button
  - Arrow from A to B → move element A to position B
  - X over element → remove/hide element
  - Text "make bold" near element → style change

### Change Generation
- Generate code modifications based on interpretation
- Show proposed changes for each annotation
- Display before/after preview
- Allow per-annotation approval

### Apply Annotations
- "Apply All" - accept all interpretations
- "Apply Selected" - choose which changes to apply
- "Edit & Apply" - modify interpretation before applying
- Real-time prototype update after application

## Acceptance Criteria

- [ ] Prototype viewer has "Annotation Mode" button
- [ ] User can draw circles, arrows, X marks, and text
- [ ] "Apply Annotations" button triggers AI analysis
- [ ] Each annotation shows interpreted action
- [ ] User can approve/reject per-annotation
- [ ] Approved changes modify the prototype code
- [ ] Before/after preview available
- [ ] Annotations can be saved for reference

## Technical Notes

Current ScreenAnnotation implementation:
- Canvas-based drawing
- Stroke data structure with tool, color, points
- Text annotations with position and content
- Screenshot capture to blob

New requirements:
- Prototype-aware annotation mode (knows DOM structure)
- Element detection under annotation position
- AI interpretation service
- Code modification generation
- Annotation-to-change mapping

AI interpretation challenges:
- Arrow direction detection
- Element proximity matching
- Handwriting/sketch recognition for arrows/X
- Context-aware action inference

Integration with:
- Prototype file system
- Local AI service
- Element selector for prototype iframe

## References

- Apollo Reveal Script: Scenes 6.1-6.3 "Visual Review", "Drawing on Design", "AI Interpretation"
- ScreenAnnotation: `src/components/ScreenAnnotation.js`
- PrototypeDetail: `src/pages/PrototypeDetail.js`
- Related: `53ce03d46fd6` (AI chat editing)

## History

- 2026-01-31: Created from reveal script gap analysis
