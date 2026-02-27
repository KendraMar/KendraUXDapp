/**
 * Omnibar Configuration System
 * 
 * Manages configurable shortcuts/triggers for the Omnibar.
 * Stores settings in localStorage so they persist across sessions.
 * 
 * Each shortcut has:
 *   - id: unique identifier
 *   - trigger: the character(s) that activate the shortcut (e.g. '@', '#', '[[')
 *   - label: human-readable name
 *   - description: what this shortcut does
 *   - dropdownLabel: label shown above the dropdown when active
 *   - enabled: whether the shortcut is active
 *   - category: grouping for the settings UI
 */

const STORAGE_KEY = 'apollo-omnibar-config';

// Default shortcut configurations
const DEFAULT_SHORTCUTS = [
  {
    id: 'mention',
    trigger: '@',
    label: 'Mention People & Agents',
    description: 'Opens a dropdown to mention teammates or AI agents. Selected items appear as chips in your input.',
    dropdownLabel: 'People & Agents',
    enabled: true,
    category: 'triggers',
    builtIn: true
  },
  {
    id: 'app',
    trigger: '#',
    label: 'Reference Apps & Pages',
    description: 'Opens a dropdown to reference apps and pages. Selected items appear as chips to scope your query.',
    dropdownLabel: 'Apps & Pages',
    enabled: true,
    category: 'triggers',
    builtIn: true
  },
  {
    id: 'navigate',
    trigger: '[[',
    label: 'Quick Navigate',
    description: 'Opens a navigation dropdown to quickly jump to any page. Selecting an item navigates immediately.',
    dropdownLabel: 'Navigate to...',
    enabled: true,
    category: 'triggers',
    builtIn: true
  }
];

/**
 * Load omnibar config from localStorage, falling back to defaults
 */
export const loadOmnibarConfig = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure any new shortcuts are included
      return mergeWithDefaults(parsed);
    }
  } catch (e) {
    console.warn('Failed to load omnibar config from localStorage:', e);
  }
  return { shortcuts: [...DEFAULT_SHORTCUTS] };
};

/**
 * Save omnibar config to localStorage
 */
export const saveOmnibarConfig = (config) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Dispatch a custom event so other components can react to changes
    window.dispatchEvent(new CustomEvent('omnibar-config-changed', { detail: config }));
  } catch (e) {
    console.warn('Failed to save omnibar config to localStorage:', e);
  }
};

/**
 * Reset config to defaults
 */
export const resetOmnibarConfig = () => {
  const defaults = { shortcuts: [...DEFAULT_SHORTCUTS] };
  saveOmnibarConfig(defaults);
  return defaults;
};

/**
 * Get a specific shortcut config by id
 */
export const getShortcut = (config, id) => {
  return config.shortcuts.find(s => s.id === id);
};

/**
 * Get the trigger string for a shortcut by id
 * Returns null if the shortcut is disabled
 */
export const getTrigger = (config, id) => {
  const shortcut = getShortcut(config, id);
  if (!shortcut || !shortcut.enabled) return null;
  return shortcut.trigger;
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
        trigger: storedShortcut.trigger || defaultShortcut.trigger,
        enabled: storedShortcut.enabled !== undefined ? storedShortcut.enabled : defaultShortcut.enabled,
        label: storedShortcut.label || defaultShortcut.label,
        dropdownLabel: storedShortcut.dropdownLabel || defaultShortcut.dropdownLabel
      };
    }
    return { ...defaultShortcut };
  });
  return { shortcuts };
};

/**
 * Validate a trigger string
 * Returns { valid: boolean, error?: string }
 */
export const validateTrigger = (trigger, shortcutId, allShortcuts) => {
  if (!trigger || trigger.trim() === '') {
    return { valid: false, error: 'Trigger cannot be empty' };
  }
  if (trigger.length > 3) {
    return { valid: false, error: 'Trigger must be 3 characters or fewer' };
  }
  // Check for conflicts with other shortcuts
  const conflict = allShortcuts.find(s => 
    s.id !== shortcutId && s.enabled && s.trigger === trigger
  );
  if (conflict) {
    return { valid: false, error: `Conflicts with "${conflict.label}"` };
  }
  return { valid: true };
};

export const DEFAULT_SHORTCUTS_LIST = DEFAULT_SHORTCUTS;
