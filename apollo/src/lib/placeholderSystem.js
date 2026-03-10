/**
 * Dynamic Placeholder System
 * 
 * Provides context-aware, rotating placeholder text for the masthead search bar.
 * Placeholders change on navigation, assistant changes, and other user-initiated
 * context shifts — never while the user is idle/reading.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// ─── Placeholder Pools ───────────────────────────────────────────────────────

/**
 * Generic placeholders that work on any page.
 * These are warm, invitational, and imply broad capability.
 */
const GENERIC = [
  'What do you need?',
  'How can I help?',
  'What are you working on?',
  'What\'s next?',
  'Go ahead...',
  'Ask anything...',
  'What\'s on your mind?',
  'Where do you want to start?',
  'Try @mentioning someone...',
  'Use # to jump to any app...',
];

/**
 * Contextual placeholders keyed by route prefix.
 * Each route can have multiple options that get cycled through.
 */
const CONTEXTUAL = {
  '/dashboard': [
    'What do you want to focus on today?',
    'Summarize what\'s changed...',
    'What needs your attention?',
    'Show me what\'s important...',
  ],
  '/feed': [
    'What are you looking for?',
    'Summarize today\'s updates...',
    'Find something in the feed...',
    'What did I miss?',
  ],
  '/tasks': [
    'Find a task or ask for a summary...',
    'What needs to get done?',
    'Show me my open tasks...',
    'Create a new task...',
    'What\'s overdue?',
  ],
  '/chat': [
    'Start a new conversation...',
    'Search past messages...',
    'Pick up where you left off...',
  ],
  '/artifacts': [
    'Find or create an artifact...',
    'What are you building?',
    'Search your artifacts...',
  ],
  '/research': [
    'What are you researching?',
    'Explore a new topic...',
    'Summarize your findings...',
    'Find related research...',
  ],
  '/designs': [
    'Search your designs...',
    'What are you designing?',
    'Find a component or pattern...',
    'Describe what you need...',
  ],
  '/playground': [
    'Try something new...',
    'Experiment with an idea...',
    'What do you want to prototype?',
  ],
  '/recordings': [
    'Search your recordings...',
    'Summarize a session...',
    'Find a recording...',
  ],
  '/slides': [
    'Find or create a presentation...',
    'What story are you telling?',
    'Search your decks...',
  ],
  '/canvas': [
    'What do you want to lay out?',
    'Start with an idea...',
    'Search your canvases...',
  ],
  '/slack': [
    'Search Slack messages...',
    'Summarize a channel...',
    'What did the team discuss?',
    'Find a conversation...',
  ],
  '/wiki': [
    'Search the wiki...',
    'Find documentation...',
    'What do you need to know?',
    'Look something up...',
  ],
  '/calendar': [
    'What\'s on the schedule?',
    'Find a meeting...',
    'What\'s coming up?',
    'Summarize today\'s agenda...',
  ],
  '/gitlab': [
    'Search repos or merge requests...',
    'What\'s been merged lately?',
    'Find a pipeline...',
    'Check build status...',
  ],
  '/figma': [
    'Search your Figma files...',
    'Find a design...',
    'What are you working on in Figma?',
  ],
  '/rss': [
    'Search your feeds...',
    'What\'s new today?',
    'Find an article...',
    'Summarize recent posts...',
  ],
  '/code': [
    'Search code or repositories...',
    'Find a file or function...',
    'What are you building?',
  ],
  '/settings': [
    'What do you want to configure?',
    'Find a setting...',
    'Need help with setup?',
  ],
  '/prototypes': [
    'Find or create a prototype...',
    'What are you prototyping?',
    'Search your prototypes...',
  ],
  '/assets': [
    'Search your assets...',
    'Find an image or file...',
    'Upload or organize assets...',
  ],
  '/homeassistant': [
    'Control your home...',
    'Check device status...',
    'What\'s happening at home?',
  ],
  '/documents': [
    'Find a document...',
    'Create something new...',
    'Search your docs...',
    'What are you writing?',
  ],
  '/discussions': [
    'Join a conversation...',
    'Start a new discussion...',
    'Find a thread...',
  ],
  '/bulletin': [
    'Search announcements...',
    'Post an update...',
    'What\'s been shared?',
  ],
  '/music': [
    'Search for music...',
    'Play something...',
    'What do you want to listen to?',
  ],
  '/moodboard': [
    'Capture a mood...',
    'Search your inspiration...',
    'Add to your board...',
  ],
  '/screenshots': [
    'Search your screenshots...',
    'Find a capture...',
    'What were you looking at?',
  ],
  '/welcome': [
    'What would you like to do?',
    'Ready when you are...',
    'Where do you want to start?',
  ],
};

/**
 * Assistant-aware placeholders. {name} gets replaced with the active assistant name.
 */
const ASSISTANT_TEMPLATES = [
  'Ask {name} anything...',
  'What should {name} help with?',
  '{name} is ready...',
  'Put {name} to work...',
];

// ─── Selection Logic ─────────────────────────────────────────────────────────

/**
 * Get the pool of relevant placeholders for the current context.
 * Merges contextual + generic + assistant-aware, weighted toward contextual.
 */
function getPlaceholderPool(pathname, activeAssistant) {
  const pool = [];

  // Find the best matching route (longest prefix match)
  const routeKey = Object.keys(CONTEXTUAL)
    .filter(key => pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];

  // Contextual placeholders get priority (added twice for weighting)
  if (routeKey) {
    pool.push(...CONTEXTUAL[routeKey]);
    pool.push(...CONTEXTUAL[routeKey]);
  }

  // Add assistant-aware placeholders if we have an active assistant
  if (activeAssistant?.name) {
    const assistantPlaceholders = ASSISTANT_TEMPLATES.map(
      template => template.replace('{name}', activeAssistant.name)
    );
    pool.push(...assistantPlaceholders);
  }

  // Add generic placeholders
  pool.push(...GENERIC);

  return pool;
}

/**
 * Pick a placeholder from the pool, avoiding the previous one.
 */
function pickPlaceholder(pool, previousText) {
  if (pool.length === 0) return 'What do you need?';
  if (pool.length === 1) return pool[0];

  // Filter out the previous placeholder to avoid repetition
  const candidates = pool.filter(p => p !== previousText);
  const source = candidates.length > 0 ? candidates : pool;

  return source[Math.floor(Math.random() * source.length)];
}

// ─── Custom Hook ─────────────────────────────────────────────────────────────

/**
 * useDynamicPlaceholder
 * 
 * Returns { text, visible } for the placeholder overlay.
 * 
 * Transitions are triggered by:
 *   - Route changes (navigation)
 *   - Active assistant changes
 *   - Periodic rotation (only after user-initiated context changes)
 * 
 * The fade is a two-phase animation:
 *   Phase 1: visible → false (fade out)
 *   Phase 2: swap text, visible → true (fade in)
 * 
 * @param {object} activeAssistant - The currently selected assistant/agent
 * @param {boolean} hasContent - Whether the search bar has any content
 */
export function useDynamicPlaceholder(activeAssistant, hasContent) {
  const location = useLocation();
  const pathname = location.pathname;

  const [text, setText] = useState(() => {
    const pool = getPlaceholderPool(pathname, activeAssistant);
    return pickPlaceholder(pool, '');
  });
  const [visible, setVisible] = useState(true);

  // Track previous context to detect changes
  const prevContext = useRef({ pathname, assistantId: activeAssistant?.id });
  const currentText = useRef(text);
  const fadeTimeoutRef = useRef(null);
  const rotationTimeoutRef = useRef(null);
  const isTransitioning = useRef(false);

  // Fade duration must match CSS transition timing
  const FADE_DURATION = 400; // ms
  // How long to wait after a context change before auto-rotating
  const ROTATION_INTERVAL = 45000; // 45 seconds

  /**
   * Perform a smooth text transition:
   * fade out → swap text → fade in
   */
  const transitionTo = useCallback((newText) => {
    if (isTransitioning.current) return;
    if (newText === currentText.current) return;

    isTransitioning.current = true;

    // Phase 1: fade out
    setVisible(false);

    // Phase 2: after fade out completes, swap text and fade in
    fadeTimeoutRef.current = setTimeout(() => {
      setText(newText);
      currentText.current = newText;
      setVisible(true);
      isTransitioning.current = false;
    }, FADE_DURATION);
  }, [FADE_DURATION]);

  /**
   * Pick a new placeholder and transition to it.
   */
  const rotatePlaceholder = useCallback(() => {
    const pool = getPlaceholderPool(pathname, activeAssistant);
    const next = pickPlaceholder(pool, currentText.current);
    transitionTo(next);
  }, [pathname, activeAssistant, transitionTo]);

  /**
   * Schedule the next auto-rotation.
   * This only fires once after the last context change, then reschedules.
   */
  const scheduleRotation = useCallback(() => {
    if (rotationTimeoutRef.current) {
      clearTimeout(rotationTimeoutRef.current);
    }
    rotationTimeoutRef.current = setTimeout(() => {
      rotatePlaceholder();
      // After rotating, schedule another one
      scheduleRotation();
    }, ROTATION_INTERVAL);
  }, [rotatePlaceholder, ROTATION_INTERVAL]);

  // React to context changes (navigation, assistant switch)
  useEffect(() => {
    const contextChanged =
      pathname !== prevContext.current.pathname ||
      activeAssistant?.id !== prevContext.current.assistantId;

    if (contextChanged) {
      prevContext.current = { pathname, assistantId: activeAssistant?.id };

      // Pick a new contextual placeholder and transition
      const pool = getPlaceholderPool(pathname, activeAssistant);
      const next = pickPlaceholder(pool, currentText.current);
      transitionTo(next);

      // Reset the rotation timer — user is active
      scheduleRotation();
    }
  }, [pathname, activeAssistant, transitionTo, scheduleRotation]);

  // Set up initial rotation schedule
  useEffect(() => {
    scheduleRotation();
    return () => {
      if (rotationTimeoutRef.current) clearTimeout(rotationTimeoutRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    text: hasContent ? '' : text,
    visible: hasContent ? false : visible,
  };
}

export default useDynamicPlaceholder;
