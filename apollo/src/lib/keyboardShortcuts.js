/**
 * Keyboard Shortcuts Configuration System
 * 
 * Manages reprogrammable keyboard shortcuts for Apollo.
 * Stores settings in localStorage so they persist across sessions.
 * 
 * Each shortcut has:
 *   - id: unique identifier (used as action name)
 *   - label: human-readable name
 *   - description: what this shortcut does
 *   - category: grouping for the settings UI
 *   - keys: the key combo object { key, metaKey, ctrlKey, shiftKey, altKey }
 *   - enabled: whether the shortcut is active
 *   - builtIn: whether this is a default shortcut (can be rebound but not deleted)
 */

const STORAGE_KEY = 'apollo-keyboard-shortcuts';

// Detect platform
const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

/**
 * Default keyboard shortcut configurations
 */
const DEFAULT_SHORTCUTS = [
  {
    id: 'focus-omnibar',
    label: 'Select Omnibar',
    description: 'Focus the Omnibar search input at the top of the page',
    category: 'Navigation',
    keys: { key: 'p', metaKey: isMac, ctrlKey: !isMac, shiftKey: false, altKey: false },
    enabled: true,
    builtIn: true
  },
  {
    id: 'toggle-sidebar',
    label: 'Toggle Sidebar',
    description: 'Show or hide the navigation sidebar',
    category: 'Navigation',
    keys: { key: 'b', metaKey: isMac, ctrlKey: !isMac, shiftKey: false, altKey: false },
    enabled: true,
    builtIn: true
  },
  {
    id: 'go-home',
    label: 'Go to Home',
    description: 'Navigate to the home / welcome page',
    category: 'Navigation',
    keys: { key: 'h', metaKey: isMac, ctrlKey: !isMac, shiftKey: true, altKey: false },
    enabled: true,
    builtIn: true
  },
  {
    id: 'go-settings',
    label: 'Go to Settings',
    description: 'Navigate to the Settings page',
    category: 'Navigation',
    keys: { key: ',', metaKey: isMac, ctrlKey: !isMac, shiftKey: false, altKey: false },
    enabled: true,
    builtIn: true
  },
  {
    id: 'toggle-theme',
    label: 'Toggle Theme',
    description: 'Switch between light and dark mode',
    category: 'Appearance',
    keys: { key: 't', metaKey: isMac, ctrlKey: !isMac, shiftKey: true, altKey: false },
    enabled: true,
    builtIn: true
  },
  {
    id: 'show-shortcuts',
    label: 'Show Keyboard Shortcuts',
    description: 'Open the keyboard shortcuts reference',
    category: 'General',
    keys: { key: '/', metaKey: isMac, ctrlKey: !isMac, shiftKey: false, altKey: false },
    enabled: true,
    builtIn: true
  },
  {
    id: 'start-recording',
    label: 'Start / Stop Recording',
    description: 'Toggle voice recording for the Omnibar',
    category: 'General',
    keys: { key: 'r', metaKey: isMac, ctrlKey: !isMac, shiftKey: true, altKey: false },
    enabled: true,
    builtIn: true
  }
];

/**
 * Format a key combo object into a human-readable string
 */
export const formatKeyCombination = (keys) => {
  if (!keys) return '';
  const parts = [];
  if (keys.metaKey) parts.push(isMac ? '⌘' : 'Win');
  if (keys.ctrlKey) parts.push(isMac ? '⌃' : 'Ctrl');
  if (keys.altKey) parts.push(isMac ? '⌥' : 'Alt');
  if (keys.shiftKey) parts.push(isMac ? '⇧' : 'Shift');

  // Format the actual key nicely
  let displayKey = keys.key;
  const keyMap = {
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Escape': 'Esc',
    'Enter': '↵',
    'Backspace': '⌫',
    'Delete': 'Del',
    'Tab': '⇥',
    ' ': 'Space',
    ',': ',',
    '.': '.',
    '/': '/',
    '[': '[',
    ']': ']'
  };
  if (keyMap[displayKey]) {
    displayKey = keyMap[displayKey];
  } else if (displayKey && displayKey.length === 1) {
    displayKey = displayKey.toUpperCase();
  }

  parts.push(displayKey);
  return parts.join(isMac ? '' : ' + ');
};

/**
 * Parse a KeyboardEvent into a key combo object
 */
export const eventToKeyCombination = (event) => {
  return {
    key: event.key.length === 1 ? event.key.toLowerCase() : event.key,
    metaKey: event.metaKey,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey
  };
};

/**
 * Check if a KeyboardEvent matches a key combo
 */
export const eventMatchesKeys = (event, keys) => {
  if (!keys) return false;
  const eventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  return (
    eventKey === keys.key &&
    event.metaKey === !!keys.metaKey &&
    event.ctrlKey === !!keys.ctrlKey &&
    event.shiftKey === !!keys.shiftKey &&
    event.altKey === !!keys.altKey
  );
};

/**
 * Load keyboard shortcuts from localStorage, falling back to defaults
 */
export const loadKeyboardShortcuts = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return mergeWithDefaults(parsed);
    }
  } catch (e) {
    console.warn('Failed to load keyboard shortcuts from localStorage:', e);
  }
  return { shortcuts: DEFAULT_SHORTCUTS.map(s => ({ ...s })) };
};

/**
 * Save keyboard shortcuts to localStorage
 */
export const saveKeyboardShortcuts = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('keyboard-shortcuts-changed', { detail: config }));
  } catch (e) {
    console.warn('Failed to save keyboard shortcuts to localStorage:', e);
  }
};

/**
 * Reset shortcuts to defaults
 */
export const resetKeyboardShortcuts = () => {
  const defaults = { shortcuts: DEFAULT_SHORTCUTS.map(s => ({ ...s })) };
  saveKeyboardShortcuts(defaults);
  return defaults;
};

/**
 * Merge stored config with defaults so new shortcuts are always present
 */
const mergeWithDefaults = (stored) => {
  const shortcuts = DEFAULT_SHORTCUTS.map(defaultShortcut => {
    const storedShortcut = stored.shortcuts?.find(s => s.id === defaultShortcut.id);
    if (storedShortcut) {
      return {
        ...defaultShortcut,
        keys: storedShortcut.keys || defaultShortcut.keys,
        enabled: storedShortcut.enabled !== undefined ? storedShortcut.enabled : defaultShortcut.enabled
      };
    }
    return { ...defaultShortcut };
  });
  return { shortcuts };
};

/**
 * Check for conflicts between a key combo and existing shortcuts
 * Returns the conflicting shortcut or null
 */
export const findConflict = (keys, shortcutId, allShortcuts) => {
  return allShortcuts.find(s =>
    s.id !== shortcutId &&
    s.enabled &&
    s.keys.key === keys.key &&
    s.keys.metaKey === keys.metaKey &&
    s.keys.ctrlKey === keys.ctrlKey &&
    s.keys.shiftKey === keys.shiftKey &&
    s.keys.altKey === keys.altKey
  ) || null;
};

/**
 * Get unique categories from shortcuts
 */
export const getCategories = (shortcuts) => {
  return [...new Set(shortcuts.map(s => s.category))];
};

export const IS_MAC = isMac;
export const DEFAULT_SHORTCUTS_LIST = DEFAULT_SHORTCUTS;
