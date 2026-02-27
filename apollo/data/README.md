# Apollo Data Directory

This is Apollo's local-first data store. Everything here is **private by default** -- it lives on your machine and is not committed to the Apollo source repository (the `data/` folder is in `.gitignore`).

The one exception is `shared/`, which contains Git repositories for collaborating on artifacts with others.

## Directory Structure

```
data/
├── shared/              # SHARED -- Git repos for team collaboration (see shared/README.md)
│   ├── repos.json       # Registry of connected repos
│   └── <repo-id>/       # Each repo is a Git clone
│
├── apps/                # APPLICATION CODE -- modular apps (tracked in main repo, see apps/README.md)
│
├── documents/           # LOCAL -- Markdown documents with frontmatter
├── slides/              # LOCAL -- Slide decks (Markdown + metadata)
├── canvas/              # LOCAL -- JSON Canvas diagrams
├── prototypes/          # LOCAL -- HTML prototypes
├── recordings/          # LOCAL -- Audio/video recordings + transcripts
├── code/                # LOCAL -- Code projects
├── moodboard/           # LOCAL -- Moodboard images
├── discussions/         # LOCAL -- Discussion threads
├── bulletins/           # LOCAL -- Bulletin posts
├── artifacts/           # LOCAL -- General artifacts
│
├── config.json          # PRIVATE CONFIG -- API keys, integration settings (gitignored)
├── spaces.json          # PRIVATE CONFIG -- Space definitions and layout
├── dashboards.json      # PRIVATE CONFIG -- Dashboard widget layouts
├── chats.json           # PRIVATE CONFIG -- Pinned/docked chat sessions
│
├── cache/               # EPHEMERAL -- Cached API responses (Slack, GitLab, Figma, etc.)
├── browser/             # PRIVATE -- Browser extension data (history, tabs)
├── agents/              # PRIVATE -- AI agent configurations
├── models/              # PRIVATE -- Local AI models (Whisper, Piper)
├── keys/                # PRIVATE -- Cryptographic keys
├── people/              # PRIVATE -- Contacts data
├── rss/                 # PRIVATE -- RSS feed subscriptions
├── tasks/               # PRIVATE -- Task data
├── conversations/       # PRIVATE -- Chat conversation logs
└── chats/               # PRIVATE -- Chat session storage
```

## Local vs Shared

| Category | Location | Visibility | How it syncs |
|----------|----------|-----------|-------------|
| **Your artifacts** | `data/<type>/` | Private, local only | Does not sync |
| **Shared artifacts** | `data/shared/<repo>/<type>/` | Shared via Git | Auto-sync every 5 min, or manual |
| **Configuration** | `data/config.json`, etc. | Private, gitignored | Does not sync |
| **App code** | `data/apps/` | Part of Apollo source | Main Apollo repo |
| **Cache** | `data/cache/` | Ephemeral, local | Rebuilt from APIs |

## Sharing artifacts

To share an artifact with your team:

1. Connect a Git repository in **Settings > Repositories**
2. On any artifact card (Documents, Slides, Canvas, Prototypes), click **Share**
3. Choose which repository to share to
4. The artifact moves from `data/<type>/` to `data/shared/<repo>/<type>/`
5. Apollo commits and pushes the change automatically

To bring a shared artifact back to local, click **Unshare** on the artifact card.

See `data/shared/README.md` for more details on the sharing system.

## Important notes

- **Never commit `data/config.json`** -- it contains API tokens and secrets
- **`data/apps/` is code** -- it's excluded from `data/*` in `.gitignore` and tracked in the main repo
- **`data/shared/` is excluded from the main `.gitignore`** -- each shared repo has its own `.git`
- **Cache is disposable** -- deleting `data/cache/` only means API responses will be re-fetched
