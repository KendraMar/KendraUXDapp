# Layout Components

**Location:** `src/components/`

## Overview

The application includes two main layout components that provide consistent navigation and branding across all pages.

## Components

### AppMasthead

**File:** `src/components/AppMasthead.js`

The top navigation bar (masthead) of the application.

**Features:**
- Brand logo/name ("Apollo Dashboard")
- Hamburger menu toggle for sidebar
- Toolbar with action buttons:
  - Help button (links to PatternFly docs)
  - Settings button (navigates to settings page)

**Key Functionality:**
- Uses PatternFly `Masthead` component
- Implements `useNavigate()` for programmatic navigation
- Responsive design with collapsible sidebar toggle

### AppSidebar

**File:** `src/components/AppSidebar.js`

The left navigation sidebar providing main navigation links.

**Features:**
- Navigation menu with icons
- Active route highlighting
- Navigation items:
  - Dashboard (TachometerAltIcon)
  - Components (CubesIcon)
  - Playground (FlaskIcon)
  - Settings (CogIcon)

**Key Functionality:**
- Uses PatternFly `PageSidebar` and `Nav` components
- Tracks current location with `useLocation()`
- Handles navigation selection with `onNavSelect`

## Component Structure

```
AppMasthead
├── MastheadMain
│   ├── MastheadToggle (hamburger menu)
│   └── MastheadBrand (logo/title)
└── MastheadContent
    └── Toolbar (action buttons)

AppSidebar
└── PageSidebar
    └── Nav
        └── NavList
            └── NavItem[] (navigation links)
```

## Dependencies

- **@patternfly/react-core**: PatternFly UI components
- **@patternfly/react-icons**: Icon components
- **react-router-dom**: Navigation hooks

## Related Components

- [App Component](./app-component.md) - Uses these layout components
- [PatternFly Library](./patternfly-library.md) - UI component library


