// Dev error overlay — must be imported FIRST so it can catch errors
// from any module (including React itself). Replaces webpack's full-page
// error overlays with a floating, dismissible panel.
import './lib/devErrorOverlay';

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import DevErrorBoundary from './components/DevErrorBoundary';

// Import PatternFly CSS
import '@patternfly/react-core/dist/styles/base.css';
// Import PatternFly Chatbot CSS (must be imported AFTER react-core CSS)
import '@patternfly/chatbot/dist/css/main.css';
// Import custom styles (must be imported AFTER PatternFly CSS)
import './styles/index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <DevErrorBoundary>
      <App />
    </DevErrorBoundary>
  </React.StrictMode>
);

