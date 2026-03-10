---
id: x1sxlknrm4i1
title: 'Automatic day/night theme: adapt to environment on first load'
type: feature
status: backlog
priority: medium
created: 2026-02-12T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - ux
  - theming
parent: null
blocks: []
blocked_by: []
related:
  - nbeo2wdxsh59
external: {}
estimate: null
component: theming
sprint: null
starred: false
flag: null
---

# Automatic day/night theme: adapt to environment on first load

## Description

When Apollo loads for the first time (no stored theme preference), automatically select light or dark mode based on the user's current environment — without prompting for any browser permissions.

The goal is a "it just works" experience: open Apollo at night and it's dark mode; open it during the day and it's light mode. Once the user manually picks a theme, respect that choice going forward.

## What's Available (No Permissions Required)

### 1. `prefers-color-scheme` media query (PRIMARY signal)
- **Browser support**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **No permissions needed** — this is a standard CSS media query
- **Real-time**: Can listen for changes via `matchMedia().addEventListener('change', ...)`
- **How it works**: Reads the OS-level dark/light mode setting. On macOS, this automatically switches if the user has "Auto" appearance enabled (which keys off sunrise/sunset for their location).
- **This is the gold standard** for auto theme detection.

### 2. Local time heuristic (FALLBACK signal)
- `new Date()` gives local time — no permissions needed
- Can estimate day/night: e.g., dark mode between ~7 PM and ~7 AM
- Useful as a fallback if `prefers-color-scheme` isn't available or returns no preference

### 3. Ambient Light Sensor API (NOT viable)
- `AmbientLightSensor` API exists but:
  - **Requires permissions** (`'ambient-light-sensor'` permission policy)
  - **Chrome only**, behind an experimental flag
  - **Not supported** in Firefox, Safari, or Edge
- **Verdict: Skip this.** The `prefers-color-scheme` + time heuristic covers the use case without any permission prompts.

## Acceptance Criteria

- [ ] On first load (no `pf-base-theme` in localStorage), auto-detect theme using `prefers-color-scheme`
- [ ] If `prefers-color-scheme` is unavailable, fall back to time-of-day heuristic (dark 7 PM–7 AM)
- [ ] Listen for real-time OS theme changes and apply them (when in "auto" mode)
- [ ] Make "Auto" the default theme option (alongside Light and Dark)
- [ ] If user manually selects Light or Dark, persist that and stop auto-switching
- [ ] Wire up the Settings page theme buttons (currently disconnected) to actually work
- [ ] Update the Welcome page onboarding to offer Auto/Light/Dark
- [ ] Update ThemeToggle dropdown in masthead to include "Auto" option
- [ ] No browser permission prompts at any point

## Technical Notes

See [Implementation Plan](./plan.md) for full details.

## References

- [MDN: prefers-color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [MDN: matchMedia](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia)
- [Implementation Plan](./plan.md)

## History

- 2026-02-12: Created
