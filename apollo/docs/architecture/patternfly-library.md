# PatternFly Library

**Package:** `@patternfly/react-core` v6.4.0

## Overview

PatternFly 6 is the primary UI component library used throughout the application. It provides a comprehensive set of React components following Red Hat's design system.

## Usage

The application imports PatternFly components and styles:

```javascript
import { ComponentName } from '@patternfly/react-core';
import '@patternfly/react-core/dist/styles/base.css';
```

## Components Used

### Layout Components
- **Page**: Main page wrapper with masthead and sidebar
- **PageSection**: Content sections with variants (light, default)
- **Grid / GridItem**: Responsive grid layout system
- **Card**: Content containers with header, body, footer

### Navigation Components
- **Masthead**: Top navigation bar
- **PageSidebar**: Left navigation sidebar
- **Nav / NavList / NavItem**: Navigation menu structure
- **Tabs / Tab**: Tab navigation

### Form Components
- **Form / FormGroup**: Form structure
- **TextInput**: Text input fields
- **TextArea**: Multi-line text input
- **Button**: Various button variants (primary, secondary, tertiary, danger, link, plain)

### Display Components
- **Title**: Typography headings
- **Content**: Text content wrapper
- **Alert**: Notification messages
- **Badge**: Status badges and labels
- **List / ListItem**: List displays
- **EmptyState**: Empty state displays

### Icons
- **@patternfly/react-icons**: Icon library
  - BarsIcon, CogIcon, QuestionCircleIcon
  - TachometerAltIcon, CubesIcon, FlaskIcon
  - DatabaseIcon, ArrowRightIcon

## Styling

- Base CSS imported globally in `src/index.js`
- Uses CSS variables for theming
- Responsive design built-in
- Dark theme support (via PatternFly themes)

## Version

- **Current Version**: 6.4.0
- **React Version**: Compatible with React 18.2.0+

## Design System

PatternFly follows a design system with:
- Consistent spacing and typography
- Accessible components (WCAG compliant)
- Responsive breakpoints
- Theme support

## Related Components

- [Components](./components.md) - Layout components using PatternFly
- [Pages](./pages.md) - Pages using PatternFly components


