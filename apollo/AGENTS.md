# AGENTS.md

Instructions for AI coding agents working on the Apollo project.

## Project Overview

Apollo is a local-first "integrated design environment" built with React and PatternFly 6. It aggregates context from various tools (Slack, Jira, Figma, Google Calendar, GitLab, Confluence) and uses local AI models to augment design and development workflows.

**Tech Stack:**
- Frontend: React 18, PatternFly 6, React Router 6
- Backend: Express.js (Node.js)
- Build: Webpack 5, Babel
- AI: Local models via Ollama/ramalama

## Setup Commands

```bash
# Recommended: Launch Apollo (installs deps, runs preflight checks, starts dev server)
./start.sh

# Or run manually:
npm install          # Install dependencies
npm run dev          # Start development server (frontend + backend concurrently)

# Other commands:
npm run build        # Build for production
npm run server       # Start only the backend server
npm run dev:webpack  # Start only the webpack dev server
```

The app runs at `http://localhost:1225` in development.

## Project Structure

```
apollo/
├── public/              # Static assets and index.html
├── server/              # Express.js backend
│   ├── index.js         # Server entry point
│   ├── lib/             # Shared libraries (AI, config, integrations)
│   └── routes/          # API route handlers
├── src/                 # React frontend
│   ├── App.js           # Main app component with routing
│   ├── index.js         # Entry point
│   ├── components/      # Shared components (Masthead, Sidebar)
│   ├── pages/           # Page components (core pages)
│   │   └── components/  # Page-specific components
│   ├── lib/             # Frontend libraries (appRegistry, contexts)
│   ├── assets/          # Images, logos, icons
│   └── custom.css       # Global styles
├── data/
│   └── apps/            # Modular applications (IMPORTANT - see below)
├── docs/                # Documentation
├── examples/            # Example configuration files
├── .apollo/             # Task tracking and governance (READ THIS)
├── .design/             # Design history and feature context (READ THIS)
└── vendor/              # Third-party vendored code
```

## Code Style

- **JavaScript/JSX** with Babel transpilation (not TypeScript)
- **Functional components** with React Hooks
- **PatternFly 6** components for all UI elements
- **React Router 6** for client-side routing
- **CSS classes** via PatternFly design tokens and `custom.css`
- Use **single quotes** for strings in JavaScript
- Use **2-space indentation**

## Component Patterns

### Creating New Apps (Modular/Pluggable)

**PREFERRED METHOD**: For new features that should be self-contained and easily removable, create a modular app in `data/apps/`. See the skill file at `.cursor/skills/create-app/SKILL.md` for complete instructions.

```
data/apps/your-app/
├── manifest.json       # App configuration (required)
├── pages/              # React components (required)
│   └── YourApp.js
└── routes.js           # Express API routes (optional)
```

Benefits:
- Self-contained: All code in one folder
- Easy removal: Delete folder to remove app completely
- Auto-registered: Routes and nav items load automatically
- No core changes: Doesn't modify App.js or AppSidebar.js
- **Space Context**: Can consume the active space's sources via `useSpaceContext()` (see below)

### Creating Core Pages (Legacy)

For core functionality that should not be removable:

1. Create component in `src/pages/YourPage.js`
2. Add route in `src/App.js`
3. Add nav item in `src/components/AppSidebar.js`

### PatternFly Usage

Always import from PatternFly packages:
```javascript
import { Button, Card, PageSection } from '@patternfly/react-core';
import { CogIcon } from '@patternfly/react-icons';
```

Use PatternFly Chatbot for AI/chat interfaces:
```javascript
import { Chatbot, Message } from '@patternfly/chatbot';
```

### API Routes

Backend routes are in `server/routes/`. Each integration has its own route file.
Routes are mounted in `server/index.js`.

Example route pattern:
```javascript
// server/routes/example.js
const express = require('express');
const router = express.Router();

router.get('/items', async (req, res) => {
  // Implementation
});

module.exports = router;
```

## Space Context (Contextual Scoping)

**IMPORTANT:** All apps should be space-context-aware. When a user configures sources (Jira projects, Slack channels, Figma files, etc.) in a space, apps within that space should automatically scope their views based on those sources.

**How it works:** Each space in `data/spaces.json` has an optional `sources` array containing typed URLs (Jira, Slack, GitLab, Figma, etc.). When a space is active, a React Context (`SpaceContextProvider`) makes this data available to every rendered route/component.

**Consuming space context in an app:**

```javascript
import { useSpaceContext } from '../../../../src/lib/SpaceContext';

const MyApp = () => {
  const {
    activeSpaceId,     // Current space ID
    activeSpace,       // Full space object
    sources,           // Space's sources array
    spaceName,         // Space name
    getSourcesByType,  // fn(type) → matching sources
    getSourceUrls,     // fn(type) → URL strings
    hasSourceType,     // fn(type) → boolean
  } = useSpaceContext();

  // Example: scope to Jira projects in this space
  const jiraSources = getSourcesByType('jira');

  // Example: check if space has Slack context
  if (hasSourceType('slack')) {
    // Auto-scope to relevant channels
  }
};
```

**Integration pattern:**
1. Determine which source types your app cares about (e.g., Tasks cares about `jira`)
2. Extract identifiers from source URLs (e.g., Jira project keys)
3. Apply as a **default filter** that users can toggle off
4. Show a **visual indicator** when space scoping is active
5. Gracefully degrade — if no relevant sources exist, show everything as normal

**Key files:**
- `src/lib/SpaceContext.js` — Context definition and `useSpaceContext()` hook
- `docs/architecture/space-context.md` — Full architecture documentation

**Reference implementation:** `data/apps/tasks/pages/Tasks.js` — extracts Jira project keys from space sources and auto-filters the task list, with a toggleable banner.

## Configuration

- **App config**: `data/config.json` (API keys, integration settings)
- **Spaces config**: `data/spaces.json` (navigation, layout, and space sources)
- **Example configs**: `examples/` directory

Never commit actual API tokens or secrets. Use example files as templates.

## Testing Instructions

Currently no automated test suite. When adding tests:
- Place test files adjacent to source files as `*.test.js`
- Use Jest for unit tests
- Manually verify UI changes in the browser

## Important Directories

### `data/apps/` - Modular Applications

**IMPORTANT:** This is the preferred location for new features. Each app is a self-contained folder.

Structure:
```
data/apps/your-app/
├── manifest.json       # Required: App configuration
├── pages/              # Required: React page components
│   └── YourApp.js
└── routes.js           # Optional: Express API routes
```

Key points:
- Apps auto-register on startup (routes, navigation, API)
- Delete folder to completely remove an app
- See `data/apps/README.md` for manifest schema
- See `.cursor/skills/create-app/SKILL.md` for full instructions
- Example: `data/apps/kubernetes/` - a fully modular app

### `.apollo/` - Design Metadata & Tasks

**IMPORTANT:** Read `.apollo/AGENTS.md` for detailed instructions on using the design metadata and task tracking system.

The `.apollo` folder contains:
- **Task tracking** in `tasks/` - Git-native issue management
- **Design history** - Chronological record of design decisions
- **Context sources** - Links to external resources
- **Feature documentation** - Per-feature design specs
- **Decision log** - Architectural Decision Records (ADRs)

Before starting work, check `.apollo/tasks/` for existing tasks.
When completing work, update or create tasks as appropriate.

### `.design/` - Design History & Feature Context

**IMPORTANT:** Read `.design/README.md` for the full spec. Agents should **continuously update** the `.design` folder when making design-related changes.

The `.design` folder provides:
- **Design decision history** — Per-feature `design-history.md` with chronological entries
- **Open design questions** — `design-questions.md` (open vs resolved)
- **Stakeholder context** — `design-stakeholders.md` where present
- **Feature mapping** — `feature-mapping.md` maps code paths to design feature areas

**Structure:**
```
.design/
├── README.md
├── feature-mapping.md      # Code path → feature → design-history path
├── features/               # Per-feature design docs
│   └── <feature>/
│       ├── design-history.md
│       ├── design-questions.md
│       └── design-stakeholders.md (optional)
├── product/                # Guidelines, UX research
└── agents/                 # Rules and skills for design updates
```

**When making design-related changes:**

1. **Before:** Check `feature-mapping.md` to find the feature for your code path; review that feature's `design-history.md` and `design-questions.md`.
2. **After significant design changes:** Add an entry to the feature's `design-history.md` (concise, 1–2 sentences; focus on user-facing change, not implementation).
3. **New feature areas:** Add a row to `feature-mapping.md` and create the feature folder with at least `design-history.md`.

**Design history entry format:** See `.design/README.md`. Use types such as `[Decision]`, `[Update]`, `[Addition]`, `[Removal]`, `[Enhancement]`, `[Meeting]`, `[Feedback]`, etc. Keep entries short.

**Design questions:** If you hit an unresolved design question, add it under `## Open` in the feature's `design-questions.md` with a **Raised** date. When resolved, move to `## Resolved` with **Answer** and **Resolved** date.

**When to update design history:** Do add entries for major UI changes, new/removed/descoped features, new user flows, new integrations. Do not add entries for refactors, non-design bug fixes, linting, or dependency updates.

**Agent rules and skills:** `.design/agents/rules/design-guidelines.md` and `.design/agents/README.md` describe how to write design history and use the review/compliance skills.

### `docs/` - Documentation

- `docs/architecture/` - Technical architecture documentation
- `docs/design/` - Design principles
- `docs/QUICKSTART.md` - Getting started guide
- `docs/MIGRATING_PAGES_TO_APPS.md` - Guide for converting existing pages to modular apps

### `examples/` - Configuration Examples

Use these as templates when setting up integrations.

## PR and Commit Guidelines

### Commit Messages

Use conventional commit format:
```
type(scope): description

feat(chat): add message streaming support
fix(feed): resolve pagination bug
docs(readme): update installation steps
refactor(api): extract common fetch logic
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Before Committing

1. Ensure the app builds without errors: `npm run build`
2. Verify no console errors in browser
3. Check that new/modified features work as expected
4. Update relevant documentation
5. If you made design-related changes, add a brief entry to the appropriate `.design/features/<feature>/design-history.md` (see `.design/` section above)

### Task Tracking

Reference tasks in commits when applicable:
```
feat(auth): implement login flow

Implements a1b2c3d4e5f6
```

## Integration Notes

### AI Features

AI features use local models via Ollama. The AI service is in `server/lib/ai.js`.
Default model configuration is in `data/config.json`.

### External APIs

Each integration (Jira, Slack, Figma, etc.) has:
- Server route in `server/routes/`
- Library helpers in `server/lib/` (some integrations)
- Frontend page in `src/pages/`

### Caching

API responses are cached locally in `data/cache/`. 
Cache logic is handled in `server/routes/cache.js`.

## Security Considerations

- Never commit API tokens or secrets
- Keep `data/config.json` out of version control
- AI runs locally to preserve data privacy
- Sanitize user input before rendering (use DOMPurify)

## Common Tasks

### Adding a New App (Recommended)

Create a modular app in `data/apps/`. This is the preferred method for new features.

1. Create folder: `data/apps/your-app/`
2. Create `manifest.json` with app configuration
3. Create `pages/YourApp.js` with React component
4. Create `routes.js` for API endpoints (if needed)
5. Restart Apollo - app auto-registers

See `.cursor/skills/create-app/SKILL.md` for complete templates and instructions.

### Adding a Core Integration (Legacy)

Only use this for core functionality that must not be removable:

1. Create route handler in `server/routes/newintegration.js`
2. Mount route in `server/index.js`
3. Add library helpers in `server/lib/` if needed
4. Create frontend page in `src/pages/NewIntegration.js`
5. Add navigation in `src/components/AppSidebar.js`
6. Document in `docs/architecture/`

### Adding a PatternFly Component

1. Check PatternFly 6 docs for component API
2. Import from appropriate package
3. Use PatternFly design tokens for styling
4. Follow existing patterns in `src/pages/components/`

### Working with Tasks

See `.apollo/tasks/README.md` for the task system documentation.
Use templates from `.apollo/tasks/_templates/` when creating tasks.

### Updating Design History

When you change UI, flows, or feature scope in a way that affects design:
1. Find the feature via `.design/feature-mapping.md` (code path → feature).
2. Add a short entry to that feature's `design-history.md` using the format in `.design/README.md`.
3. If the change introduces a new feature area, add a mapping in `feature-mapping.md` and create the feature folder under `.design/features/`.
4. For open design questions, add to the feature's `design-questions.md`; when resolved, move to Resolved with Answer and date.
See the `.design/` section under Important Directories and `.design/agents/rules/design-guidelines.md` for details.
