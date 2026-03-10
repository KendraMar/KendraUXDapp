# Routing

**Implementation:** React Router v6 in `src/App.js`

## Overview

The application uses React Router v6 for client-side routing, providing a single-page application (SPA) experience with multiple views.

## Router Configuration

- **Router Type**: `BrowserRouter` (uses HTML5 history API)
- **Future Flags**: Enabled for React Router v7 compatibility
  - `v7_startTransition`: Uses React's startTransition for route updates
  - `v7_relativeSplatPath`: Enables relative path handling

## Route Definitions

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `<Navigate to="/dashboard" />` | Root redirect to dashboard |
| `/dashboard` | `<Dashboard />` | Main dashboard page |
| `/components` | `<Components />` | Component library showcase |
| `/playground` | `<Playground />` | Component playground/editor |
| `/settings` | `<Settings />` | Settings and cache management |

## Navigation Flow

1. User navigates via sidebar links or direct URL access
2. React Router matches the URL path to a route
3. Corresponding page component is rendered
4. Layout components (Masthead, Sidebar) remain persistent

## Programmatic Navigation

Components can navigate programmatically using:
- `useNavigate()` hook from `react-router-dom`
- Example: `navigate('/dashboard')`

## Related Components

- [App Component](./app-component.md) - Contains routing setup
- [Pages](./pages.md) - Route destination components
- [App Sidebar](./components.md) - Navigation UI component


