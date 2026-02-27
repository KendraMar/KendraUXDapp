---
id: hu8xxmvsnop5
title: 'People: Core contact management with per-person storage, private notes, and cross-app context'
type: feature
status: done
priority: high
created: 2026-02-08T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - backend
  - core
  - feature
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: people
sprint: null
starred: false
flag: null
---

# People: Core contact management with per-person storage, private notes, and cross-app context

## Description

Built a full-featured People system as a core Apollo component (not a modular app), replacing the previous lightweight People tab that lived inside the Profile page. The system provides a personal Rolodex for managing contacts with rich data, private notes, per-field sharing controls on your own card, and a cross-app React context that feeds real people data into the omnibar and any other part of Apollo that needs it.

### Why core instead of a modular app

People is infrastructure, not a feature. The omnibar depends on it for @ mentions, any app can consume people data via `usePeople()`, and it shouldn't be removable without breaking other parts of the system. This puts it alongside Profile, Dashboard, and Settings as foundational pages.

### Why "People" instead of "Contacts"

- Consistent with existing terminology (the old PeopleTab, `/api/people`, the omnibar's "People & Agents" label)
- Warmer and more relationship-oriented, fitting Apollo's design-first philosophy
- Aligned with Apple, Google, Microsoft, and Slack naming conventions

## What Was Built

### Data layer: `data/people/<username>/`

Each person gets their own folder with JSON files:
- `person.json` -- structured contact data (name with first/last/middle, nickname, role, company, location, timezone, email, phone, bio, avatar, skills, interests, projects, integration IDs for Slack/GitLab/Jira/GitHub, tags, favorite, timestamps)
- `notes.json` -- private notes array (never shared, your personal Rolodex notes about them)
- `_me/` folder for your own card, with an additional `sharing.json` for per-field public/private visibility toggles

### Backend: `server/routes/people.js` (upgraded)

Full CRUD API replacing the old flat-file single-JSON approach:
- `GET /api/people` -- list all people
- `GET /api/people/search?q=` -- full-text search across name, role, company, skills, tags
- `GET/PUT /api/people/me` -- your own card
- `GET/PUT /api/people/me/sharing` -- per-field sharing settings
- `GET /api/people/:username` -- single person with notes
- `POST /api/people` -- create (auto-generates username slug)
- `PUT /api/people/:username` -- update
- `DELETE /api/people/:username` -- delete (removes folder)
- `GET/PUT /api/people/:username/notes` -- private notes
- Auto-migration from the old `data/people/people.json` format on first load

### Frontend: `src/pages/People/`

Core page with:
- **Card/table view toggle** (persisted in localStorage) using PatternFly ToggleGroup
- **Search** across name, role, company, skills, tags
- **Favorites filter** and **tag filter** dropdown
- **Create/Edit modal** with sectioned form (Basic Info, Contact Info, Profile, Integrations, Organization)
- **Delete modal** with confirmation
- **"My Card" modal** with per-field sharing toggles (public/private switches)
- **Detail page** (`/people/:username`) with full contact info, integration links, skills/interests labels, projects, and a **private notes panel** for adding/deleting personal notes

### Cross-app context: `src/lib/PeopleContext.js`

React Context wrapping the entire app via `PeopleProvider` in App.js:
- `usePeople()` hook provides: `people`, `myCard`, `getPerson(username)`, `searchPeople(query)`, `getPersonByIntegration(type, id)`, `refreshPeople()`
- Enables any app or system component to access people data without direct API calls

### Omnibar integration

Replaced the hardcoded `PEOPLE` array in `AppMasthead.js` with real data from `usePeople()`. The omnibar's @ mentions now show actual people from `data/people/`, with proper initials, colors, and role descriptions. Each person object includes `slackId` for future Slack message routing.

### Profile page cleanup

Removed the old "People" tab from the Profile page entirely. Profile now has four tabs: Personal Info, Preferences, Security, Notifications.

### Sidebar navigation

Added "People" to `coreNavItems` in `AppSidebar/constants.js` with `UsersIcon`.

## Acceptance Criteria

- [x] People list page at `/people` with card and table view toggle
- [x] Search, favorites filter, and tag filter
- [x] Create, edit, and delete people via modals
- [x] Detail page at `/people/:username` with full info and private notes
- [x] "My Card" with per-field sharing controls (public/private)
- [x] Per-person folder storage in `data/people/<username>/`
- [x] Private notes stored separately in `notes.json`
- [x] Auto-migration from old `people.json` format
- [x] PeopleContext with `usePeople()` hook for cross-app access
- [x] Omnibar @ mentions use real people data
- [x] People added to core sidebar navigation
- [x] Old People tab removed from Profile page

## Technical Notes

### Key files created/modified

**Created:**
- `src/pages/People/People.js` -- main list page
- `src/pages/People/PersonDetail.js` -- detail page
- `src/pages/People/index.js` -- re-export
- `src/pages/People/components/PersonCardView.js` -- card gallery view
- `src/pages/People/components/PersonTableView.js` -- table view
- `src/pages/People/components/PersonModal.js` -- create/edit modal
- `src/pages/People/components/DeletePersonModal.js` -- delete confirmation
- `src/pages/People/components/MyCard.js` -- my card editor with sharing toggles
- `src/lib/PeopleContext.js` -- cross-app context

**Modified:**
- `server/routes/people.js` -- fully replaced with per-folder CRUD
- `src/routes.js` -- added `/people` and `/people/:username`
- `src/App.js` -- added PeopleProvider
- `src/components/AppSidebar/constants.js` -- added People nav item and UsersIcon
- `src/components/AppMasthead/AppMasthead.js` -- replaced hardcoded PEOPLE with usePeople()
- `src/pages/Profile/Profile.js` -- removed People tab

### Design decisions

- **JSON over YAML** for data files: zero dependencies, consistent with all other Apollo data files
- **Per-folder storage**: git-friendly, supports per-person attachments and notes without a monolithic file
- **`_me` convention**: your own card at `data/people/_me/` with a separate `sharing.json`
- **Core page, not modular app**: People is infrastructure that other parts depend on

### Future enhancements

- Slack integration: auto-create contacts from Slack conversations using integration IDs
- Omnibar message routing: when @ mentioning a person with a Slack ID, route the message via Slack
- Avatar upload: support uploading images to the person's folder instead of just URLs
- vCard import/export

## References

- [Implementation plan](./plan.md)

## History

- 2026-02-08: Created as a retroactive task to capture completed work
- 2026-02-08: Completed -- all features implemented and wired up
