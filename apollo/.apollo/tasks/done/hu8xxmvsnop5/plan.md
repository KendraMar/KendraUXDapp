# People Feature - Implementation Plan

> This plan was created during implementation and evolved as design decisions were made. It reflects the final architecture.

## Prior State

There was an existing lightweight People system:

- **server/routes/people.js** -- CRUD API storing all contacts in a single `data/people/people.json` file with a basic schema (name, role, company, email, phone, relationship, tags, notes, favorite)
- **src/pages/Profile/components/PeopleTab.js** -- A "People" tab inside Profile with card-only view, search, favorites filter, and create/edit/delete modals
- **src/components/AppMasthead/AppMasthead.js** -- Omnibar had a hardcoded `PEOPLE` array used for `@` mentions, not connected to the API

## Design Decisions

### Naming: "People" over "Contacts"

- Consistent with existing Apollo terminology (PeopleTab, `/api/people`, omnibar "People & Agents")
- Warmer, more relationship-oriented - fits a design IDE better than a CRM term
- Aligned with Apple, Google, Microsoft, and Slack conventions

### Architecture: Core page over modular app

- People is infrastructure that other parts depend on (omnibar, PeopleContext, future Slack routing)
- Parallels other core pages (Profile, Dashboard, Settings)
- Should not be removable - deleting it would break the omnibar
- The context provider is core infrastructure in `src/lib/`

### Data format: JSON over YAML

- Zero extra dependencies (no `js-yaml` needed)
- Consistent with every other data file in Apollo (`spaces.json`, `config.json`, `repos.json`)
- `JSON.parse`/`JSON.stringify` are built-in and fast
- Per-folder structure still provides all git-friendliness benefits

## Data Model

### Storage: `data/people/<username>/`

Each person gets their own folder. The `<username>` is a URL-safe slug derived from their name.

**`person.json`** -- contact data:

```json
{
  "name": { "first": "Andy", "last": "Smith", "middle": "" },
  "nickname": "Andy",
  "role": "Senior Engineer",
  "company": "Acme Corp",
  "location": "San Francisco, CA",
  "timezone": "America/Los_Angeles",
  "email": "andy@example.com",
  "phone": "+1-555-0123",
  "bio": "Full-stack developer with 10 years experience...",
  "avatar": "",
  "skills": ["JavaScript", "React", "Node.js"],
  "interests": ["hiking", "photography"],
  "projects": [{ "name": "Apollo", "role": "Lead Developer" }],
  "integrations": {
    "slack": "U12345",
    "gitlab": "asmith",
    "jira": "asmith@company.com",
    "github": "asmith"
  },
  "tags": ["engineering", "teammate"],
  "favorite": true,
  "lastContact": "2026-02-01",
  "createdAt": "2026-01-15T00:00:00Z",
  "updatedAt": "2026-02-08T00:00:00Z"
}
```

**`notes.json`** -- private notes (never shared):

```json
{
  "entries": [
    { "id": "1707350400000", "date": "2026-02-01T00:00:00Z", "content": "Discussed the Apollo project timeline..." }
  ]
}
```

### "My Card": `data/people/_me/`

Same `person.json` schema plus a **`sharing.json`** controlling per-field visibility:

```json
{
  "fields": {
    "email": "public",
    "phone": "private",
    "location": "public",
    "timezone": "public",
    "bio": "public",
    "skills": "public",
    "interests": "public",
    "projects": "public",
    "integrations": "private"
  }
}
```

## Architecture

```
Frontend                          Backend                    Storage
─────────────────────────────────────────────────────────────────────
People.js (list page)     ──→    server/routes/people.js    data/people/<username>/
  PersonCardView.js                GET /api/people              person.json
  PersonTableView.js               POST /api/people             notes.json
  PersonModal.js                   PUT /api/people/:username
  DeletePersonModal.js             DELETE /api/people/:username
                                   GET/PUT .../notes
PersonDetail.js (detail)  ──→
  Private notes panel

MyCard.js (my card modal) ──→    GET/PUT /api/people/me     data/people/_me/
  Sharing toggles                 GET/PUT .../me/sharing        person.json
                                                                sharing.json

PeopleContext.js          ──→    GET /api/people             (cached in memory)
  usePeople() hook               GET /api/people/me

AppMasthead.js            ──→    PeopleContext (usePeople)
  @ mention dropdown
```

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/people` | List all people |
| GET | `/api/people/search?q=` | Search people |
| GET | `/api/people/me` | Get my card |
| PUT | `/api/people/me` | Update my card |
| GET | `/api/people/me/sharing` | Get sharing settings |
| PUT | `/api/people/me/sharing` | Update sharing settings |
| GET | `/api/people/:username` | Get single person + notes |
| POST | `/api/people` | Create new person |
| PUT | `/api/people/:username` | Update person |
| DELETE | `/api/people/:username` | Delete person (removes folder) |
| GET | `/api/people/:username/notes` | Get private notes |
| PUT | `/api/people/:username/notes` | Update private notes |

## Migration

Auto-migration runs on server startup: if `data/people/people.json` exists and there are no person subfolders yet, each entry is migrated to a per-folder structure. The old single "name" field is parsed into first/last, notes are moved to `notes.json`, and relationship text becomes the bio field.
