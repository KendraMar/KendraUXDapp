/**
 * useKeyboardShortcuts Hook
 * 
 * Registers a global keydown listener that matches keyboard events
 * against the user's configured shortcuts and fires action callbacks.
 * 
 * Usage:
 *   useKeyboardShortcuts({ 'focus-omnibar': () => inputRef.current?.focus() });
 */
import { useEffect, useCallback, useRef } from 'react';
import { loadKeyboardShortcuts, eventMatchesKeys } from './keyboardShortcuts';

const useKeyboardShortcuts = (actionHandlers = {}) => {
  const handlersRef = useRef(actionHandlers);
  handlersRef.current = actionHandlers;

  // Keep a live reference to shortcuts that updates when config changes
  const shortcutsRef = useRef(loadKeyboardShortcuts().shortcuts);

  const handleKeyDown = useCallback((event) => {
    // Don't intercept shortcuts when the user is actively recording a new shortcut
    if (event.target.closest('[data-shortcut-capture]')) return;

    const shortcuts = shortcutsRef.current;
    for (const shortcut of shortcuts) {
      if (!shortcut.enabled) continue;
      if (eventMatchesKeys(event, shortcut.keys)) {
        const handler = handlersRef.current[shortcut.id];
        if (handler) {
          event.preventDefault();
          event.stopPropagation();
          handler(event);
        }
        return;
      }
    }
  }, []);

  useEffect(() => {
    // Listen for config changes (from Settings page)
    const onConfigChanged = (e) => {
      shortcutsRef.current = e.detail.shortcuts;
    };
    window.addEventListener('keyboard-shortcuts-changed', onConfigChanged);
    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keyboard-shortcuts-changed', onConfigChanged);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
