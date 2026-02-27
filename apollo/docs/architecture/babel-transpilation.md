# Babel Transpilation

**Configuration:** Webpack babel-loader in `webpack.config.js`

## Overview

Babel is used to transpile modern JavaScript (ES6+) and JSX syntax into browser-compatible JavaScript.

## Configuration

Babel is configured through Webpack's babel-loader:

```javascript
{
  loader: 'babel-loader',
  options: {
    presets: ['@babel/preset-env', '@babel/preset-react']
  }
}
```

## Presets

### @babel/preset-env
- **Purpose**: Transpiles modern JavaScript to compatible versions
- **Version**: 7.23.5
- **Features**:
  - ES6+ syntax (arrow functions, destructuring, etc.)
  - Async/await
  - Modules (import/export)
  - Automatically determines needed transformations based on target browsers

### @babel/preset-react
- **Purpose**: Transforms JSX syntax to JavaScript
- **Version**: 7.23.3
- **Features**:
  - JSX to `React.createElement()` calls
  - React-specific syntax transformations

## Processing Flow

1. **Source Code**: `src/**/*.js` and `src/**/*.jsx` files
2. **Babel Processing**: Transpiles to ES5-compatible JavaScript
3. **Webpack Bundling**: Bundles transpiled code
4. **Output**: Single bundle file in `dist/`

## Exclusions

- **node_modules**: Excluded from transpilation for performance
- Only application source code is processed

## Dependencies

- **@babel/core**: Core Babel compiler (7.23.5)
- **@babel/preset-env**: Environment preset (7.23.5)
- **@babel/preset-react**: React preset (7.23.3)
- **babel-loader**: Webpack loader (9.1.3)

## Related Components

- [Webpack Config](./webpack-config.md) - Build system configuration
- [Entry Point](./entry-point.md) - Source code entry


