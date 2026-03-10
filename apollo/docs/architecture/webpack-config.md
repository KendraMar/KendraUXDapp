# Webpack Configuration

**File:** `webpack.config.js`

## Overview

Webpack is the module bundler responsible for compiling and bundling the React application for both development and production environments.

## Configuration

### Entry Point
```javascript
entry: './src/index.js'
```
The main entry point of the application.

### Output
```javascript
output: {
  path: path.resolve(__dirname, 'dist'),
  filename: 'bundle.[contenthash].js',
  publicPath: '/',
  clean: true
}
```
- **Path**: Output directory (`dist/`)
- **Filename**: Content-hashed bundle name for cache busting
- **Public Path**: Root path for asset URLs
- **Clean**: Removes old files before build

## Module Rules

### JavaScript/JSX Processing
```javascript
{
  test: /\.(js|jsx)$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['@babel/preset-env', '@babel/preset-react']
    }
  }
}
```
- Transpiles ES6+ and JSX using Babel
- Excludes node_modules for performance

### CSS Processing
```javascript
{
  test: /\.css$/,
  use: ['style-loader', 'css-loader']
}
```
- Processes CSS files
- Injects styles into the DOM

### Asset Processing
```javascript
{
  test: /\.(png|svg|jpg|jpeg|gif|woff|woff2|ttf|eot)$/,
  type: 'asset/resource'
}
```
- Handles images, fonts, and other assets
- Uses Webpack 5 asset/resource type

## Plugins

### HTML Webpack Plugin
```javascript
new HtmlWebpackPlugin({
  template: './public/index.html',
  favicon: './public/favicon.ico'
})
```
- Generates `index.html` in `dist/`
- Injects script tags automatically
- Includes favicon

## Development Tools

```javascript
devtool: 'source-map'
```
Generates source maps for debugging.

## Build Modes

- **Development**: `webpack --mode development --watch`
  - Faster builds
  - Source maps enabled
  - Watch mode for auto-rebuild

- **Production**: `webpack --mode production`
  - Optimized/minified output
  - Smaller bundle size
  - Production optimizations

## Related Components

- [Babel Transpilation](./babel-transpilation.md) - JavaScript transpilation
- [Express Server](./express-server.md) - Serves built files


