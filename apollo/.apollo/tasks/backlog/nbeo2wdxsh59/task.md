---
id: nbeo2wdxsh59
title: 'Adaptive Onboarding: Infer User Preferences from Wizard Interactions'
type: feature
status: backlog
priority: medium
created: 2026-02-08T00:00:00.000Z
due: null
assignees: []
labels:
  - frontend
  - ux
  - onboarding
  - feature
  - apollo
parent: null
blocks: []
blocked_by: []
related: []
external: {}
estimate: null
component: null
sprint: null
starred: true
flag: null
---

# Adaptive Onboarding: Infer User Preferences from Wizard Interactions

## Description

Redesign the Apollo onboarding wizard to implicitly and explicitly infer user preferences — then automatically configure the UI based on those inferences. Inspired by Halo's controller inversion detection (where the game asks you to "look up" and observes which direction you push the stick, then sets your preference without ever showing a settings screen), the goal is to make onboarding feel purposeful and natural while quietly calibrating Apollo to each user.

The core principle: **every onboarding step should feel meaningful on its own** (learning about Apollo, expressing who you are), not like a settings form in disguise. The user should launch into a personalized Apollo experience without having manually configured anything.

### Already Identified

- **Language selection → reading direction → sidebar position.** If the user selects a right-to-left language (Hebrew, Arabic, etc.), default the primary navigation to the right side. Left-to-right languages default to left.

## Ideas & Techniques

### 1. Behavioral Detection (Observe, Don't Ask — True Halo-Style)

These are the most elegant because the user doesn't realize they're being calibrated.

- **Scroll speed through welcome content.** Show a passage explaining what Apollo does during onboarding. Measure scroll speed. Fast readers → prefer dense, compact UI (smaller fonts, tighter spacing, more data per screen). Slow readers → prefer spacious layout with larger text and more breathing room. Sets an `informationDensity` preference silently.

- **Keyboard vs. mouse affinity.** Present an onboarding step where the user can proceed by clicking a button OR pressing Enter / a keyboard shortcut (subtly hinted). If they use the keyboard → enable power-user defaults: show keyboard shortcut hints in tooltips, enable command palette (Cmd+K), default to keyboard-navigable layouts. If they click → keep the UI more visually guided with larger click targets.

- **Click precision / input device inference.** Track click accuracy on onboarding elements. Imprecise clicks suggest trackpad or touch → increase hit target sizes and spacing. Precise clicks suggest mouse → keep standard compact layout.

- **Response time / decisiveness.** How quickly do they answer onboarding questions? Fast decision-makers → fewer confirmation dialogs, inline actions. Deliberate users → undo affordances and confirmation steps before destructive actions.

- **Time of day.** Check local clock during onboarding. Evening/night → default to dark mode. Morning/afternoon → default to light mode.

### 2. Clever Questions That Map to Deeper Preferences

These feel like simple, natural questions but drive multiple UI decisions.

- **"What's your role?"** (Designer / Developer / Product Manager / Researcher / Other)
  - Sets the **default landing page** — Figma for designers, Code/GitLab for developers, Jira for PMs
  - **Reorders the sidebar** to prioritize role-relevant integrations
  - Adjusts **information density** — developers often prefer denser views, designers prefer more visual space
  - Sets the **AI persona tone** — more technical for devs, more strategic for PMs

- **"How do you start your workday?"** (Check messages / Review calendar / Look at tasks / See what changed overnight)
  - Configures **dashboard widgets** and their ordering
  - Sets the **default app** that opens on launch
  - Configures what the AI assistant proactively surfaces

- **"How many tools do you juggle daily?"** (1–3 / 4–7 / 8+)
  - Fewer → simpler sidebar, focused layout, fewer integrations shown
  - More → expanded sidebar, aggregated feed enabled, integration status indicators shown
  - Calibrates how aggressively Apollo **cross-references context** between tools

- **"Where are you based?"** (or timezone auto-detection)
  - **Date format** (MM/DD vs DD/MM)
  - **Time format** (12h vs 24h)
  - **Weekend days** (Fri–Sat vs Sat–Sun)
  - Calendar/holiday defaults

- **"Do you prefer to be interrupted, or check in on your own terms?"**
  - Maps to **notification strategy**: push with badges/sounds vs. quiet inbox
  - Sets whether the AI proactively surfaces things or waits to be asked

### 3. Visual/Interactive Choices That Reveal Preference

More playful — feels like aesthetics but is actually functional.

- **"Pick the workspace that feels right."** Show 2–3 abstract workspace thumbnails (not labeled "dense" or "spacious"). Compact with lots of panels / airy with whitespace / balanced. Sets global layout density, font scale, sidebar width.

- **"Arrange these in your order of priority."** Draggable cards for integrations (Slack, Jira, Figma, Calendar, GitLab, Confluence). Directly sets **sidebar ordering** and **dashboard widget priority**. Also signals which integrations to set up first.

- **"Pick a palette."** Show 3–4 abstract color schemes (not labeled "dark" or "light"). Sets theme, accent color, light/dark/system mode. Feels like creative expression, not a settings panel.

- **"Pick the view that appeals to you."** Show the same data as a Kanban board vs. a table/list. Sets the **default view mode** for tasks, feeds, and search results.

### 4. Personality/Playful Questions That Map to Real Settings

Make onboarding memorable and create a sense of personality.

- **"How do you take your coffee?"** (Black / With cream / Extra everything / I don't drink coffee)
  - "Black" → minimal UI, reduced chrome
  - "Extra everything" → full-featured UI with all widgets, badges, animations
  - "I don't drink coffee" → calm/focus mode, reduced visual noise

- **"Pick the animal that matches your workflow."** (Hawk — focused / Octopus — multitasking / Ant — methodical / Cheetah — fast-paced)
  - Hawk → single-panel layout, focus mode, distraction-free
  - Octopus → multi-panel, split views, all integrations visible
  - Ant → list views, structured navigation, task tracking prominent
  - Cheetah → keyboard shortcuts front and center, quick actions, streamlined

### 5. System-Level Implicit Detection (No Question Needed)

Detect from browser/OS without asking anything.

- **Browser zoom level** → adjust base font size
- **`prefers-reduced-motion`** → disable animations and transitions
- **`prefers-color-scheme`** → match light/dark to system setting
- **`prefers-contrast`** → enable high-contrast theme
- **Screen width / device type** → laptop = single-column, ultrawide = multi-panel, mobile = different nav
- **Screen reader detection** → optimize accessibility, increase ARIA verbosity

### 6. The Reveal Moment

At the end of onboarding, show a summary: *"Based on what you told us, here's how we've set up Apollo for you"* — displaying the inferred settings with the ability to tweak each one. This builds trust and delight simultaneously. Users see that the questions weren't random — they were purposeful.

## Acceptance Criteria

- [ ] Identify which existing onboarding wizard steps can be augmented with implicit inference
- [ ] Implement language → RTL/LTR → sidebar position mapping
- [ ] Add at least 2 behavioral detection techniques (e.g., scroll speed, keyboard affinity)
- [ ] Add at least 3 clever question-based inferences (e.g., role, workday start, tool count)
- [ ] Add at least 1 visual/interactive choice (e.g., workspace layout picker)
- [ ] Implement system-level detection for `prefers-color-scheme`, `prefers-reduced-motion`, and screen width
- [ ] Add "reveal" step at end of onboarding showing inferred preferences with ability to adjust
- [ ] All inferred preferences are saved to user settings and applied immediately
- [ ] User can change any inferred setting later via Settings page
- [ ] Onboarding flow feels natural and purposeful, not like a settings form

## Technical Notes

- Preferences should be stored in the existing user settings/preferences system
- Behavioral measurements (scroll speed, click precision, response time) need careful thresholds — err on the side of sensible defaults if signal is weak
- System-level detection (`prefers-color-scheme`, `prefers-reduced-motion`, etc.) should use standard CSS media query APIs and `window.matchMedia()`
- The "reveal" step should show a clean summary card for each inferred setting with a toggle or dropdown to override
- Consider making the inference logic modular so new onboarding signals can be added over time

## References

- Halo controller inversion detection — the gold standard for invisible UX calibration
- [PatternFly Wizard component](https://www.patternfly.org/components/wizard) for onboarding flow structure
- Current onboarding wizard: `src/pages/Welcome.js`

## History

- 2026-02-08: Created — brainstormed adaptive onboarding techniques inspired by Halo's implicit preference detection
