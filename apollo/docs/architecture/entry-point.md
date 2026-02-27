# Entry Point

**File:** `src/index.js`

## Overview

The entry point is the first file executed when the React application loads. It initializes the React application and renders the root `App` component into the DOM.

## Responsibilities

- **React Initialization**: Creates the root React DOM container and renders the application
- **CSS Import**: Imports PatternFly base CSS styles for the entire application
- **Strict Mode**: Wraps the app in React StrictMode for development warnings

## Key Components

- Uses `ReactDOM.createRoot()` (React 18 API) to create the root
- Renders `<App />` component as the root of the component tree
- Imports PatternFly base styles: `@patternfly/react-core/dist/styles/base.css`

## Code Structure

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@patternfly/react-core/dist/styles/base.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## Dependencies

- **React**: Core React library
- **ReactDOM**: React DOM rendering library
- **PatternFly**: Base CSS styles

## Related Components

- [App Component](./app-component.md) - The root component rendered here


