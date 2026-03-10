const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const basePath = process.env.ASSET_PATH || process.env.PUBLIC_PATH || '/';
  
  return {
    // Only show errors and warnings — suppress verbose build stats
    stats: 'errors-warnings',
    infrastructureLogging: { level: 'warn' },
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'bundle.[contenthash].js' : 'bundle.js',
      publicPath: basePath,
      clean: true
    },
    module: {
      rules: [
        {
          // Process JS/JSX from src/ and data/apps/ (modular applications)
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          include: [
            path.resolve(__dirname, 'src'),
            path.resolve(__dirname, 'data/apps')
          ],
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
              plugins: isProduction ? [] : [require.resolve('react-refresh/babel')]
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|woff|woff2|ttf|eot)$/,
          type: 'asset/resource'
        }
      ]
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        '@apps': path.resolve(__dirname, 'data/apps')
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.PUBLIC_PATH': JSON.stringify(basePath)
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
        favicon: './public/favicon.ico',
        templateParameters: { basePath: basePath || '/' }
      }),
      // Enable React Fast Refresh in development (overlay disabled; custom floating panel handles errors)
      !isProduction && new ReactRefreshWebpackPlugin({
        overlay: false,
      })
    ].filter(Boolean),
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    devServer: {
      port: 1225,
      hot: true,
      devMiddleware: {
        writeToDisk: true,
      },
      liveReload: false,  // Disable full-page reload; React Fast Refresh handles component updates
      client: {
        overlay: false,  // Disable full-page error overlay; custom floating panel handles this
      },
      watchFiles: {
        // Watch src files and data/apps for modular applications
        paths: ['src/**', 'public/**', 'data/apps/**'],
        options: {
          ignored: ['**/data/!(apps)/**', '**/node_modules/**']
        }
      },
      historyApiFallback: true,
      static: [
        {
          directory: path.join(__dirname, 'dist'),
        },
        {
          directory: path.join(__dirname, 'public'),
          publicPath: '/',
        },
        {
          directory: path.join(__dirname, 'data'),
          publicPath: '/data',
          watch: false,  // Don't trigger reloads when data files change (e.g., spaces.json)
        }
      ],
      // Proxy API requests to the Express server
      proxy: [
        {
          context: ['/api'],
          target: 'http://localhost:1226',
          changeOrigin: true,
          ws: true,
        }
      ]
    }
  };
};

