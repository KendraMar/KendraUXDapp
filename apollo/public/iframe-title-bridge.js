/**
 * Iframe Title Bridge Script
 * 
 * This script should be included in the iframe application to automatically
 * send title updates to the parent Apollo Canvas window.
 * 
 * Usage:
 * 1. Include this script in your iframe application's HTML:
 *    <script src="http://localhost:1225/iframe-title-bridge.js"></script>
 * 
 * 2. The script will automatically:
 *    - Send the initial page title when loaded
 *    - Monitor for title changes and send updates
 *    - Respond to title requests from the parent window
 */

(function() {
  'use strict';
  
  // Accept messages from any localhost origin (dev server flexibility)
  const isValidOrigin = (origin) => {
    return origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:');
  };
  
  let lastTitle = '';
  let lastUrl = '';
  
  // Function to send title to parent window
  function sendTitleToParent(title) {
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({
          type: 'TITLE_UPDATE',
          title: title,
          url: window.location.href
        }, '*');
        console.log('Apollo Canvas: Sent title to parent:', title);
      } catch (error) {
        console.warn('Failed to send title to parent:', error);
      }
    }
  }
  
  // Function to get current title (prioritize h1, then document.title)
  function getCurrentTitle() {
    // Try to get title from the main heading first
    const h1 = document.querySelector('h1');
    if (h1 && h1.textContent.trim()) {
      return h1.textContent.trim();
    }
    
    // Try page-specific title elements
    const pageTitle = document.querySelector('[data-page-title]');
    if (pageTitle && pageTitle.textContent.trim()) {
      return pageTitle.textContent.trim();
    }
    
    // Fall back to document title
    return document.title || 'Prototype';
  }
  
  // Function to check and send title if changed
  function checkAndSendTitle() {
    const currentTitle = getCurrentTitle();
    const currentUrl = window.location.href;
    
    if (currentTitle !== lastTitle || currentUrl !== lastUrl) {
      lastTitle = currentTitle;
      lastUrl = currentUrl;
      sendTitleToParent(currentTitle);
    }
  }
  
  // Send initial title when DOM is ready
  function initialize() {
    console.log('Apollo Canvas: Title bridge initialized');
    checkAndSendTitle();
    
    // Set up title observer for document.title changes
    const titleObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.target === document.head) {
          checkAndSendTitle();
        }
      });
    });
    
    // Observe document title changes
    if (document.head) {
      titleObserver.observe(document.head, {
        childList: true,
        subtree: true
      });
    }
    
    // Set up observer for h1 changes (main page title)
    const contentObserver = new MutationObserver(function(mutations) {
      let shouldCheck = false;
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          // Check if any h1 elements were potentially modified
          if (mutation.target.nodeName === 'H1' || 
              mutation.target.querySelector?.('h1') ||
              mutation.target.closest?.('h1')) {
            shouldCheck = true;
          }
          // Also check for any added nodes that might be h1
          mutation.addedNodes.forEach(node => {
            if (node.nodeName === 'H1' || node.querySelector?.('h1')) {
              shouldCheck = true;
            }
          });
        }
      });
      if (shouldCheck) {
        checkAndSendTitle();
      }
    });
    
    // Observe DOM changes for h1 elements
    if (document.body) {
      contentObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
    
    // Set up interval check as backup (every 2 seconds)
    setInterval(checkAndSendTitle, 2000);
  }
  
  // Listen for title requests from parent
  window.addEventListener('message', function(event) {
    // Verify origin for security
    if (!isValidOrigin(event.origin)) {
      return;
    }
    
    if (event.data && event.data.type === 'REQUEST_TITLE') {
      checkAndSendTitle();
    }
  });
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Also send title on window load
  window.addEventListener('load', checkAndSendTitle);
  
  // Listen for popstate events (browser navigation)
  window.addEventListener('popstate', function() {
    setTimeout(checkAndSendTitle, 100);
  });
  
  // For modern SPAs, also listen for History API changes
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;
  
  history.pushState = function() {
    originalPushState.apply(history, arguments);
    setTimeout(checkAndSendTitle, 100);
  };
  
  history.replaceState = function() {
    originalReplaceState.apply(history, arguments);
    setTimeout(checkAndSendTitle, 100);
  };
  
})();
