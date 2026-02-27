import React from 'react';

/**
 * React Error Boundary that catches component render errors and reports them
 * to the floating dev error overlay (src/lib/devErrorOverlay.js) instead of
 * crashing the entire page.
 *
 * In production this is a no-op pass-through — it still catches errors but
 * shows a simple fallback message rather than the dev panel.
 *
 * Usage:
 *   <DevErrorBoundary>
 *     <App />
 *   </DevErrorBoundary>
 */
class DevErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });

    // Report to the floating overlay if available (dev only)
    if (window.__devErrorOverlay) {
      const message = [
        error.message,
        '',
        error.stack || '',
        '',
        'Component stack:',
        errorInfo?.componentStack || '(unavailable)',
      ].join('\n');

      window.__devErrorOverlay.addError('React Render Error', message);
    }

    console.error('[DevErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    // Clear the React render error from the floating overlay
    if (window.__devErrorOverlay) {
      window.__devErrorOverlay.clearErrors('React Render Error');
    }
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // In development: show a minimal inline fallback + the floating panel has details
      if (process.env.NODE_ENV === 'development') {
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            padding: '40px 20px',
            color: '#c9d1d9',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '32px',
              marginBottom: '12px',
            }}>
              &#9888;
            </div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              margin: '0 0 8px 0',
              color: '#e8e8e8',
            }}>
              Something went wrong
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#8b949e',
              margin: '0 0 20px 0',
              maxWidth: '400px',
            }}>
              A component error was caught. Check the floating error panel
              in the bottom-right corner for details.
            </p>
            <button
              onClick={this.handleRetry}
              style={{
                background: '#238636',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 20px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
          </div>
        );
      }

      // Production fallback
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <p>Something went wrong. Please refresh the page.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DevErrorBoundary;
