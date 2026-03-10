# Implementation Plan: Automatic Day/Night Theme

## Research Summary

### What's possible without browser permissions

| Signal | API | Permissions? | Browser Support | Verdict |
|--------|-----|-------------|-----------------|---------|
| OS dark/light mode | `prefers-color-scheme` media query | None | All modern browsers | **Primary signal** |
| Real-time OS changes | `matchMedia().addEventListener('change')` | None | All modern browsers | **Use for live switching** |
| Local time | `new Date()` | None | Universal | **Fallback heuristic** |
| Ambient light level | `AmbientLightSensor` | **Yes** (permission policy) | Chrome only, behind flag | **Skip — not viable** |
| Screen brightness | No standard API | N/A | N/A | **Not available** |

**Bottom line:** `prefers-color-scheme` is the right approach. It reads the OS-level dark/light setting, which on macOS (with "Auto" appearance) already keys off sunrise/sunset for the user's location. Combined with a time-of-day fallback, this covers the use case completely — zero permission prompts.

---

## Current State

### How theme works today

1. **`index.html`** — starts with `class="pf-v6-theme-dark"` hardcoded
2. **`AppMasthead.js`** — reads `pf-base-theme` from `localStorage`, defaults to `THEMES.LIGHT` if nothing stored (contradicts the HTML default)
3. **`ThemeToggle.js`** — dropdown with Light/Dark options + high contrast switch
4. **`Welcome.js`** — onboarding theme selector, same localStorage key
5. **`Settings.js`** — has Light/Dark/System buttons but they're **completely disconnected** (local state only, never persists or applies)

### Problems with current approach

- No "Auto" option anywhere
- First load defaults to light (AppMasthead) but HTML says dark → flash of wrong theme
- Settings page theme controls do nothing
- No `prefers-color-scheme` support at all

---

## Implementation Steps

### Step 1: Add `AUTO` theme constant and detection utility

**Files:** `src/components/AppMasthead/AppMasthead.js`, `src/components/AppMasthead/components/ThemeToggle.js`

Add `AUTO: 'auto'` to the `THEMES` constant in both files.

Create a small utility function (can live at top of AppMasthead or in a shared lib):

```javascript
/**
 * Resolve the effective theme (light or dark) for 'auto' mode.
 * 1. Prefer prefers-color-scheme if available
 * 2. Fall back to time-of-day heuristic
 */
function resolveAutoTheme() {
  // Primary: OS-level preference
  if (window.matchMedia) {
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkQuery.matches) return 'dark';
    const lightQuery = window.matchMedia('(prefers-color-scheme: light)');
    if (lightQuery.matches) return 'light';
  }
  // Fallback: time-of-day (dark between 7 PM and 7 AM)
  const hour = new Date().getHours();
  return (hour >= 19 || hour < 7) ? 'dark' : 'light';
}
```

### Step 2: Update theme initialization in `AppMasthead.js`

Change the `baseTheme` state initializer:

**Before:**
```javascript
const [baseTheme, setBaseTheme] = React.useState(() => {
  const stored = localStorage.getItem('pf-base-theme');
  return stored === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
});
```

**After:**
```javascript
const [baseTheme, setBaseTheme] = React.useState(() => {
  const stored = localStorage.getItem('pf-base-theme');
  if (stored === THEMES.DARK || stored === THEMES.LIGHT) return stored;
  if (stored === THEMES.AUTO) return THEMES.AUTO;
  // First load — no preference stored yet — default to auto
  return THEMES.AUTO;
});
```

### Step 3: Update the theme effect in `AppMasthead.js`

Modify the `useEffect` that applies theme classes:

```javascript
React.useEffect(() => {
  const htmlElement = document.documentElement;
  
  // Resolve effective theme
  const effectiveTheme = baseTheme === THEMES.AUTO
    ? resolveAutoTheme()
    : baseTheme;
  
  // Remove all theme classes
  htmlElement.classList.remove('pf-v6-theme-dark', 'pf-v6-theme-high-contrast');
  
  // Apply
  if (effectiveTheme === THEMES.DARK) {
    htmlElement.classList.add('pf-v6-theme-dark');
  }
  if (isHighContrast) {
    htmlElement.classList.add('pf-v6-theme-high-contrast');
  }
  
  // Persist the user's MODE choice (auto/light/dark), not the resolved value
  localStorage.setItem('pf-base-theme', baseTheme);
  localStorage.setItem('pf-high-contrast', isHighContrast.toString());
}, [baseTheme, isHighContrast]);
```

### Step 4: Listen for OS theme changes (live switching in auto mode)

Add a second effect that subscribes to `prefers-color-scheme` changes:

```javascript
React.useEffect(() => {
  if (baseTheme !== THEMES.AUTO) return;
  
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    // Re-trigger the theme effect by forcing a re-render
    // Use a state update or ref to trigger the theme application
    const htmlElement = document.documentElement;
    const effective = resolveAutoTheme();
    htmlElement.classList.remove('pf-v6-theme-dark');
    if (effective === 'dark') {
      htmlElement.classList.add('pf-v6-theme-dark');
    }
  };
  
  darkQuery.addEventListener('change', handler);
  return () => darkQuery.removeEventListener('change', handler);
}, [baseTheme]);
```

### Step 5: Update `ThemeToggle.js` dropdown

Add an "Auto" option at the top of the theme list:

```jsx
<DropdownItem 
  key="auto"
  onClick={() => onThemeSelect(THEMES.AUTO)}
  icon={baseTheme === THEMES.AUTO ? <CheckIcon /> : null}
  description="Adapts to your environment"
>
  Auto
</DropdownItem>
```

### Step 6: Fix `index.html` flash-of-wrong-theme

Replace the hardcoded `pf-v6-theme-dark` class with an inline script that runs before React hydrates:

```html
<html lang="en">
<head>
  <script>
    // Apply theme immediately to prevent flash
    (function() {
      var stored = localStorage.getItem('pf-base-theme');
      var theme;
      if (stored === 'dark') {
        theme = 'dark';
      } else if (stored === 'light') {
        theme = 'light';
      } else {
        // Auto mode: check OS preference, then time
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          theme = 'dark';
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
          theme = 'light';
        } else {
          var h = new Date().getHours();
          theme = (h >= 19 || h < 7) ? 'dark' : 'light';
        }
      }
      if (theme === 'dark') {
        document.documentElement.classList.add('pf-v6-theme-dark');
      }
      if (localStorage.getItem('pf-high-contrast') === 'true') {
        document.documentElement.classList.add('pf-v6-theme-high-contrast');
      }
    })();
  </script>
  ...
```

### Step 7: Update `Welcome.js` onboarding

Update the theme selector on the Welcome/onboarding page to include an "Auto" option and make it the default selection. The current code uses `isDarkMode` boolean — this should be refactored to a three-state value (`'auto'`, `'light'`, `'dark'`).

### Step 8: Wire up `Settings.js` theme controls

The Settings page already has Light/Dark/System buttons that do nothing. Wire them up:
- Map "System" to `THEMES.AUTO`
- On click, update `localStorage.setItem('pf-base-theme', value)` and apply classes
- Read initial state from `localStorage` on mount

### Step 9: Optional periodic re-check for time-based fallback

If in auto mode and `prefers-color-scheme` has no preference (rare), set up a timer to re-check the time-of-day heuristic every 30 minutes so the theme switches at dusk/dawn even without an OS signal.

---

## File Change Summary

| File | Change |
|------|--------|
| `public/index.html` | Remove hardcoded `pf-v6-theme-dark`, add inline theme detection script |
| `src/components/AppMasthead/AppMasthead.js` | Add `AUTO` to `THEMES`, add `resolveAutoTheme()`, update init + effect, add OS listener |
| `src/components/AppMasthead/components/ThemeToggle.js` | Add `AUTO` to `THEMES`, add "Auto" dropdown item |
| `src/pages/Welcome.js` | Add Auto option to onboarding theme selector |
| `src/pages/Settings/Settings.js` | Wire up theme buttons to actually persist and apply |

---

## Testing Approach

1. **Clear localStorage** → reload → should auto-detect OS theme
2. **macOS System Preferences** → switch Appearance to Light/Dark/Auto → Apollo should follow in real-time (when in Auto mode)
3. **Manual override** → select Light explicitly → stays Light regardless of OS
4. **Time fallback** → mock `matchMedia` to return no preference → verify time heuristic kicks in
5. **No flash** → hard reload → theme should be correct from first paint (inline script)
6. **Settings page** → verify Light/Dark/System buttons actually change the theme
