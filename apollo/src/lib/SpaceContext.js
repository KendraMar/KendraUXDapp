import React, { createContext, useContext, useMemo } from 'react';

/**
 * SpaceContext - Provides the active space and its sources to all child components.
 * 
 * This enables "contextual passing" where apps automatically scope their views
 * based on the sources configured in the current space.
 * 
 * Usage in any component/app:
 *   import { useSpaceContext } from '../../src/lib/SpaceContext';
 *   const { activeSpace, sources, getSourcesByType } = useSpaceContext();
 */

const SpaceContext = createContext({
  activeSpaceId: 'default',
  activeSpace: null,
  sources: [],
  spaceName: '',
  spaceDescription: '',
  getSourcesByType: () => [],
  getSourceUrls: () => [],
  hasSourceType: () => false,
});

/**
 * Custom hook to consume the space context.
 * Returns the current space data and helper functions.
 */
export function useSpaceContext() {
  return useContext(SpaceContext);
}

/**
 * SpaceContextProvider - Wraps children with space context data.
 * 
 * @param {Object} props
 * @param {string} props.activeSpaceId - The active space ID
 * @param {Object} props.activeSpace - The full space object (from spaces.json)
 * @param {React.ReactNode} props.children
 */
export function SpaceContextProvider({ activeSpaceId, activeSpace, children }) {
  const contextValue = useMemo(() => {
    const sources = activeSpace?.sources || [];

    return {
      // Core data
      activeSpaceId: activeSpaceId || 'default',
      activeSpace: activeSpace || null,
      sources,
      spaceName: activeSpace?.name || '',
      spaceDescription: activeSpace?.description || '',

      /**
       * Get sources filtered by type (e.g., 'jira', 'slack', 'google-drive', 'gitlab', 'figma')
       * @param {string} type - The source type to filter by
       * @returns {Array} Matching sources
       */
      getSourcesByType: (type) => {
        return sources.filter(s => s.type === type);
      },

      /**
       * Get just the URLs for a given source type
       * @param {string} type - The source type to filter by
       * @returns {string[]} Array of URLs
       */
      getSourceUrls: (type) => {
        return sources.filter(s => s.type === type).map(s => s.url);
      },

      /**
       * Check if the current space has any sources of a given type
       * @param {string} type - The source type to check
       * @returns {boolean}
       */
      hasSourceType: (type) => {
        return sources.some(s => s.type === type);
      },
    };
  }, [activeSpaceId, activeSpace]);

  return (
    <SpaceContext.Provider value={contextValue}>
      {children}
    </SpaceContext.Provider>
  );
}

export default SpaceContext;
