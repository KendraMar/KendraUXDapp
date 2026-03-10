---
name: create-prototype
description: Create prototypes in Apollo's data/prototypes folder. Use when the user asks to create a prototype, mockup, landing page, or HTML demo for the project.
---

# Creating Prototypes in Apollo

Prototypes are stored in `data/prototypes/` with a specific structure.

## Directory Structure

Each prototype requires:
1. A folder containing the prototype files
2. A companion JSON metadata file

```
data/prototypes/
├── {prototype-name}/
│   ├── index.html           # Entry point (required)
│   └── ...                   # Any other files (CSS, JS, images, etc.)
├── {prototype-name}.json    # Metadata file (required)
```

## Creating a Prototype

### Step 1: Create the Prototype Folder

Create `data/prototypes/{prototype-name}/` with at minimum an `index.html` entry point.

The prototype can be:
- A single self-contained HTML file with embedded CSS/JS
- Multiple files with separate stylesheets and scripts
- A built output from a framework
- Any static web content

### Step 2: Create the Metadata JSON

Create `data/prototypes/{prototype-name}.json`:

```json
{
  "id": "{prototype-name}",
  "name": "Human Readable Name",
  "description": "Brief description of the prototype.",
  "product": {
    "key": "apollo",
    "label": "Apollo",
    "description": "Apollo Integrated Design Environment"
  },
  "release": {
    "key": "1.0",
    "label": "1.0",
    "group": "Category"
  },
  "embed": {
    "type": "iframe",
    "url": "/data/prototypes/{prototype-name}/index.html",
    "fallbackUrl": null
  },
  "repository": {
    "url": null,
    "branch": "main",
    "localPath": null
  },
  "scope": {
    "selected": "All",
    "options": [
      { "id": "all", "label": "Full Page", "type": "default" }
    ]
  },
  "context": {
    "overview": {
      "title": "Prototype Title",
      "description": "What this prototype demonstrates.",
      "rationale": "Why it was created.",
      "deliverables": "What it produces",
      "team": [],
      "personas": []
    },
    "sources": {
      "jira": [],
      "drive": [],
      "slack": []
    },
    "history": [
      {
        "id": "h-1",
        "date": "YYYY-MM-DD",
        "title": "Initial Design",
        "description": "Created the prototype"
      }
    ]
  },
  "discussions": [],
  "createdAt": "YYYY-MM-DDTHH:mm:ss.000Z",
  "modifiedAt": "YYYY-MM-DDTHH:mm:ss.000Z"
}
```

## Naming Conventions

- Use lowercase kebab-case: `apollo-website`, `feature-comparison`
- Be descriptive: `user-onboarding-flow` not `flow1`
- Match folder name, JSON file name (without extension), and JSON `id` field

## Checklist

- [ ] Folder created at `data/prototypes/{name}/`
- [ ] Entry point exists at `data/prototypes/{name}/index.html`
- [ ] Metadata JSON created at `data/prototypes/{name}.json`
- [ ] JSON `id` matches folder name
- [ ] JSON `embed.url` points to `/data/prototypes/{name}/index.html`
