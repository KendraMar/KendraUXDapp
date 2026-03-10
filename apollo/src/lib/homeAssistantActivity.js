/**
 * Home Assistant Activity Tracking
 * 
 * Tracks Apollo UI activity and reports it to Home Assistant as a binary_sensor.
 * This allows Home Assistant automations to respond to when someone is actively
 * using the Apollo interface.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Generate a unique session ID for this browser tab
const SESSION_ID = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Activity tracking configuration
const ACTIVITY_CONFIG = {
  heartbeatInterval: 30000, // Send heartbeat every 30 seconds when active
  idleTimeout: 60000,       // Consider idle after 60 seconds of no activity
  debounceMs: 1000          // Debounce activity events
};

/**
 * Hook to track and report Apollo UI activity to Home Assistant.
 * Must be used inside a Router component.
 */
export function useHomeAssistantActivityTracking() {
  const location = useLocation();
  const lastActivityRef = useRef(Date.now());
  const isActiveRef = useRef(true);
  const heartbeatIntervalRef = useRef(null);
  const idleTimeoutRef = useRef(null);
  const activityDebounceRef = useRef(null);

  // Send heartbeat to backend
  const sendHeartbeat = useCallback(async () => {
    if (!isActiveRef.current) return;
    
    try {
      await fetch('/api/homeassistant/apollo/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPage: location.pathname,
          sessionId: SESSION_ID
        })
      });
    } catch (error) {
      // Silently fail - Home Assistant integration is optional
      console.debug('Apollo activity heartbeat failed:', error.message);
    }
  }, [location.pathname]);

  // Send inactive notification
  const sendInactive = useCallback(async () => {
    try {
      await fetch('/api/homeassistant/apollo/inactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.debug('Apollo inactive notification failed:', error.message);
    }
  }, []);

  // Handle activity detection
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing debounce
    if (activityDebounceRef.current) {
      clearTimeout(activityDebounceRef.current);
    }

    // Debounce the activity handling
    activityDebounceRef.current = setTimeout(() => {
      // If we were idle, we're now active again
      if (!isActiveRef.current) {
        isActiveRef.current = true;
        sendHeartbeat();
      }

      // Reset idle timeout
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      
      idleTimeoutRef.current = setTimeout(() => {
        isActiveRef.current = false;
        sendInactive();
      }, ACTIVITY_CONFIG.idleTimeout);
    }, ACTIVITY_CONFIG.debounceMs);
  }, [sendHeartbeat, sendInactive]);

  // Handle visibility change (tab switching)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      isActiveRef.current = false;
      sendInactive();
    } else {
      isActiveRef.current = true;
      lastActivityRef.current = Date.now();
      sendHeartbeat();
    }
  }, [sendHeartbeat, sendInactive]);

  // Handle window focus/blur
  const handleFocus = useCallback(() => {
    isActiveRef.current = true;
    lastActivityRef.current = Date.now();
    sendHeartbeat();
  }, [sendHeartbeat]);

  const handleBlur = useCallback(() => {
    // Only mark as inactive if the window truly loses focus
    // (not just switching between elements)
    setTimeout(() => {
      if (!document.hasFocus()) {
        isActiveRef.current = false;
        sendInactive();
      }
    }, 100);
  }, [sendInactive]);

  useEffect(() => {
    // Send initial heartbeat on mount
    sendHeartbeat();

    // Set up heartbeat interval
    heartbeatIntervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        sendHeartbeat();
      }
    }, ACTIVITY_CONFIG.heartbeatInterval);

    // Set up initial idle timeout
    idleTimeoutRef.current = setTimeout(() => {
      isActiveRef.current = false;
      sendInactive();
    }, ACTIVITY_CONFIG.idleTimeout);

    // Activity event listeners
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Visibility and focus listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Cleanup on unmount (send inactive when leaving)
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (activityDebounceRef.current) {
        clearTimeout(activityDebounceRef.current);
      }

      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);

      // Best effort to notify on unmount
      sendInactive();
    };
  }, [handleActivity, handleVisibilityChange, handleFocus, handleBlur, sendHeartbeat, sendInactive]);

  // Also send heartbeat when route changes
  useEffect(() => {
    if (isActiveRef.current) {
      sendHeartbeat();
    }
  }, [location.pathname, sendHeartbeat]);
}

/**
 * Component that activates Home Assistant activity tracking.
 * Place this inside your Router component.
 */
export function HomeAssistantActivityTracker() {
  useHomeAssistantActivityTracking();
  return null; // Renders nothing, just runs the hook
}
