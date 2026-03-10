# Design Guidelines

Apollo follows **PatternFly 6** as its design system and React 18 with functional components for implementation.

## Design System

- **PatternFly 6** — All UI components, layout, and design tokens
- **PatternFly Chatbot** — AI assistant and chat interfaces
- **PatternFly Icons** — Iconography

## Design Principles

1. **Local-first** — Data stays on the user's machine; AI runs locally via Ollama
2. **Context-rich** — Aggregate context from multiple tools to reduce switching
3. **Modular** — Features are self-contained apps that can be added/removed independently
4. **Keyboard accessible** — All features navigable via keyboard
5. **Progressive disclosure** — Show what's needed, reveal details on demand

## Component Usage

- Always import from PatternFly packages (`@patternfly/react-core`, `@patternfly/react-icons`)
- Use PatternFly Chatbot components for any conversational UI
- Prefer PatternFly layout components (PageSection, Gallery, Grid) over custom layouts
- Use design tokens for any custom styling

## Typography

Follow PatternFly's typography scale. Do not introduce custom font sizes or weights.

## Color

Use PatternFly design tokens for all colors. Custom colors should be defined as CSS custom properties in `src/custom.css`.

## Spacing

Use PatternFly spacing variables. Avoid hardcoded pixel values.

## Responsive Design

Apollo is designed for desktop-first usage but should degrade gracefully. Use PatternFly breakpoint utilities.
