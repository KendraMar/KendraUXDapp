/**
 * Iframe Selection Mode Bridge Script
 * 
 * This script should be included in the iframe application to handle
 * selection mode and hover highlighting functionality from Apollo Canvas.
 * 
 * Usage:
 * 1. Include this script in your iframe application's HTML:
 *    <script src="http://localhost:1225/iframe-selection-bridge.js"></script>
 * 
 * 2. The script will automatically:
 *    - Listen for selection mode updates from the parent Apollo Canvas window
 *    - Add hover highlighting for all elements when in selection mode
 *    - Remove highlighting when exiting selection mode
 */

(function() {
  'use strict';
  
  // Accept messages from any localhost origin (dev server flexibility)
  const isValidOrigin = (origin) => {
    return origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:');
  };
  
  let isSelectionMode = false;
  let highlightedElement = null;
  
  // CSS for hover highlighting
  const HOVER_HIGHLIGHT_CLASS = 'apollo-canvas-hover-highlight';
  
  // Function to create hover highlight CSS if it doesn't exist
  function createHoverHighlightCSS() {
    if (document.getElementById('apollo-canvas-hover-styles')) {
      return; // Already exists
    }
    
    const style = document.createElement('style');
    style.id = 'apollo-canvas-hover-styles';
    style.textContent = `
      .${HOVER_HIGHLIGHT_CLASS} {
        background-color: rgba(255, 20, 147, 0.25) !important;
        outline: 2px solid rgba(255, 20, 147, 0.8) !important;
        outline-offset: 1px !important;
        cursor: pointer !important;
        position: relative !important;
        z-index: 999999 !important;
      }
      
      .${HOVER_HIGHLIGHT_CLASS}::before {
        content: "";
        position: absolute !important;
        top: -2px !important;
        left: -2px !important;
        right: -2px !important;
        bottom: -2px !important;
        background-color: rgba(255, 20, 147, 0.1) !important;
        pointer-events: none !important;
        z-index: -1 !important;
      }
      
      body.apollo-selection-active {
        cursor: crosshair !important;
      }
      
      body.apollo-selection-active * {
        cursor: crosshair !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Function to remove hover highlight CSS
  function removeHoverHighlightCSS() {
    const existingStyle = document.getElementById('apollo-canvas-hover-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
  }
  
  // Function to add hover highlighting to an element
  function addHoverHighlight(element) {
    if (highlightedElement && highlightedElement !== element) {
      removeHoverHighlight(highlightedElement);
    }
    
    if (element && !element.classList.contains(HOVER_HIGHLIGHT_CLASS)) {
      element.classList.add(HOVER_HIGHLIGHT_CLASS);
      highlightedElement = element;
    }
  }
  
  // Function to remove hover highlighting from an element
  function removeHoverHighlight(element) {
    if (element) {
      element.classList.remove(HOVER_HIGHLIGHT_CLASS);
      if (highlightedElement === element) {
        highlightedElement = null;
      }
    }
  }
  
  // Function to check if element is selectable
  function isSelectableElement(el) {
    const tagName = el.tagName.toLowerCase();
    return tagName !== 'script' && 
           tagName !== 'style' && 
           tagName !== 'html' && 
           tagName !== 'head' &&
           !el.classList.contains(HOVER_HIGHLIGHT_CLASS) &&
           el.offsetParent !== null; // Visible elements only
  }
  
  // Mouse event handlers
  function handleMouseEnter(event) {
    if (!isSelectionMode) return;
    event.stopPropagation();
    addHoverHighlight(event.target);
  }
  
  function handleMouseLeave(event) {
    if (!isSelectionMode) return;
    event.stopPropagation();
    removeHoverHighlight(event.target);
  }
  
  function handleClick(event) {
    if (!isSelectionMode) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const element = event.target;
    const elementInfo = {
      tagName: element.tagName.toLowerCase(),
      id: element.id || null,
      className: element.className || null,
      textContent: element.textContent?.substring(0, 100) || null,
      rect: element.getBoundingClientRect()
    };
    
    // Send selected element info to parent
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'ELEMENT_SELECTED',
        element: elementInfo
      }, '*');
    }
  }
  
  // Function to enable selection mode
  function enableSelectionMode() {
    if (isSelectionMode) return;
    
    console.log('Apollo Canvas: Enabling selection mode');
    isSelectionMode = true;
    createHoverHighlightCSS();
    document.body.classList.add('apollo-selection-active');
    
    // Add event listeners to document for delegation
    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    document.addEventListener('click', handleClick, true);
  }
  
  // Function to disable selection mode
  function disableSelectionMode() {
    if (!isSelectionMode) return;
    
    console.log('Apollo Canvas: Disabling selection mode');
    isSelectionMode = false;
    document.body.classList.remove('apollo-selection-active');
    
    // Remove event listeners
    document.removeEventListener('mouseenter', handleMouseEnter, true);
    document.removeEventListener('mouseleave', handleMouseLeave, true);
    document.removeEventListener('click', handleClick, true);
    
    // Remove any remaining highlights
    const highlighted = document.querySelectorAll('.' + HOVER_HIGHLIGHT_CLASS);
    highlighted.forEach(el => el.classList.remove(HOVER_HIGHLIGHT_CLASS));
    highlightedElement = null;
    
    // Remove CSS styles
    removeHoverHighlightCSS();
  }
  
  // Listen for messages from parent window
  window.addEventListener('message', function(event) {
    // Verify origin for security
    if (!isValidOrigin(event.origin)) {
      return;
    }
    
    if (event.data && event.data.type === 'SELECTION_MODE_UPDATE') {
      const newSelectionMode = event.data.isSelectMode;
      
      if (newSelectionMode !== isSelectionMode) {
        if (newSelectionMode) {
          enableSelectionMode();
        } else {
          disableSelectionMode();
        }
      }
    }
  });
  
  // Initialize when DOM is ready
  function initialize() {
    console.log('Apollo Canvas: Selection mode bridge initialized');
    
    // Send confirmation to parent that we're ready
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({
          type: 'SELECTION_BRIDGE_READY'
        }, '*');
      } catch (error) {
        console.warn('Failed to send selection bridge ready message:', error);
      }
    }
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
  // Also initialize on window load
  window.addEventListener('load', initialize);
  
  // Cleanup on unload
  window.addEventListener('beforeunload', function() {
    disableSelectionMode();
  });
  
})();
