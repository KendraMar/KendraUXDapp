# Quick Start Guide — Apollo

## Launch Apollo in One Step

```bash
./start.sh
```

The start script takes care of everything:

1. **Checks your environment** — verifies Node.js 18+ and npm are available
2. **Installs dependencies** — runs `npm install` on first launch (skips if already installed)
3. **Checks configuration** — lets you know if integrations aren't set up yet
4. **Starts the dev server** — launches both the Express backend and Webpack frontend

Once it's running, open your browser to: **http://localhost:1225**

Press `Ctrl+C` to stop the server.

---

## First-Time Setup

### Prerequisites

- **Node.js** 18+ — [Download](https://nodejs.org)
- **npm** (ships with Node.js)

### Connect Your Integrations (Optional)

Apollo works out of the box, but to connect tools like Slack, Jira, Figma, and others, create a config file:

```bash
cp examples/config.example.json data/config.json
```

Then edit `data/config.json` with your API tokens. See the integration guides in `/docs` for details.

### AI Features (Optional)

For local AI capabilities, install [ramalama](https://ramalama.ai). Apollo uses local models so your data stays private.

---

## Manual Commands

If you prefer to run things yourself instead of using `start.sh`:

```bash
npm install           # Install dependencies
npm run dev           # Start dev server (frontend + backend)
npm run build         # Production build
npm run server        # Run backend server only
npm run dev:webpack   # Run webpack dev server only
```

---

## What You Get

### Integrated Workspace

Apollo pulls context from the tools your team already uses — Slack, Jira, Figma, Google Calendar, GitLab, Confluence, and more — into a single unified interface.

### AI Augmentation

Local AI models summarize feeds, analyze tasks, and power a conversational assistant — all running privately on your machine.

### Spaces

Organize work by project or topic. When you're in a Space, everything automatically scopes to what matters right now.

### Artifact Remixing

Transform content between formats: documents to slides, research notes to journey maps, specs to interactive prototypes.

---

## Server Details

- **Port**: 1225 (configurable via `PORT` environment variable)
- **Host**: localhost
- **Protocol**: HTTP

---

## Next Steps

- **Explore Spaces** — Set up a Space for your project with sources from Slack, Jira, etc.
- **Try the Feed** — See all your information streams filtered and summarized
- **Chat with Apollo** — Use the AI assistant to ask questions about your sources
- **Build prototypes** — Create and share interactive prototypes

---

## Learning Resources

- [PatternFly Documentation](https://www.patternfly.org/v6/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Apollo Design Principles](../docs/design/principles.md)
