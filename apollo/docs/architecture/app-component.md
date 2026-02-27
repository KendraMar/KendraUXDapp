# App Component

**File:** `src/App.js`

## Overview

The `App` component is the root component of the application. It sets up the routing structure and provides the main page layout using PatternFly's `Page` component.

## Responsibilities

- **Routing Setup**: Configures React Router with BrowserRouter
- **Layout Structure**: Provides the main page layout with masthead and sidebar
- **Route Definitions**: Defines all application routes and their corresponding page components

## Key Features

- Uses React Router v6 with future flags enabled (`v7_startTransition`, `v7_relativeSplatPath`)
- Implements PatternFly `Page` component with managed sidebar
- Provides navigation structure with masthead and sidebar components

## Route Structure

- `/` → Redirects to `/dashboard`
- `/dashboard` → Dashboard page
- `/components` → Components library page
- `/playground` → Playground page
- `/settings` → Settings page

## Component Hierarchy

```
App
├── Router (BrowserRouter)
└── Page (PatternFly)
    ├── masthead={<AppMasthead />}
    ├── sidebar={<AppSidebar />}
    └── Routes
        ├── Route: /dashboard → <Dashboard />
        ├── Route: /components → <Components />
        ├── Route: /playground → <Playground />
        └── Route: /settings → <Settings />
```

## Dependencies

- **react-router-dom**: Client-side routing
- **@patternfly/react-core**: PatternFly UI components
- **Components**: AppMasthead, AppSidebar
- **Pages**: Dashboard, Components, Playground, Settings

## Related Components

- [Routing](./routing.md) - Detailed routing configuration
- [Components](./components.md) - Layout components (Masthead, Sidebar)
- [Pages](./pages.md) - Page components


