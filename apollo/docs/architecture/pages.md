# Page Components

**Location:** `src/pages/`

## Overview

The application consists of four main page components, each serving a specific purpose in the dashboard.

## Pages

### Dashboard

**File:** `src/pages/Dashboard.js`

The main landing page providing an overview and quick access to other sections.

**Features:**
- Welcome message and title
- Four feature cards:
  - Components Library
  - Creative Playground
  - Local-First Storage
  - Settings & Cache
- Card-based navigation to other pages
- Visual icons and color coding

### Components

**File:** `src/pages/Components.js`

A showcase page demonstrating PatternFly 6 components.

**Features:**
- Interactive component examples:
  - Buttons (multiple variants)
  - Badges and labels
  - Tabs with categorized content
  - Alerts
- Component documentation organized by category
- Live, interactive demos

**Component Categories:**
- Layout Components
- Navigation
- Data Display
- Forms & Inputs

### Playground

**File:** `src/pages/Playground.js`

A component builder/editor for creating and saving custom components.

**Features:**
- Form-based component creation:
  - Component name input
  - Code textarea
- Save functionality (POSTs to `/api/cache/:filename`)
- Success/error alerts
- Local-first storage integration

**API Integration:**
- Saves components to cache via `/api/cache/:filename` endpoint
- Stores component metadata (name, code, timestamp)

### Settings

**File:** `src/pages/Settings.js`

Settings and cache management page.

**Features:**
- Lists all cached files
- Cache file management
- Refresh functionality
- Empty state when no cached files exist

**API Integration:**
- Fetches cached files list from `/api/cache` endpoint
- Displays cached file names

## Page Structure Pattern

All pages follow a consistent structure:

```javascript
<>
  <PageSection variant="light">
    <Title>Page Title</Title>
    <Content>Description</Content>
  </PageSection>
  <PageSection>
    {/* Page content */}
  </PageSection>
</>
```

## Dependencies

- **@patternfly/react-core**: PatternFly UI components
- **react-router-dom**: Navigation hooks (for some pages)
- **Fetch API**: API calls for Playground and Settings

## Related Components

- [API Endpoints](./api-endpoints.md) - Backend API used by pages
- [PatternFly Library](./patternfly-library.md) - UI components used


