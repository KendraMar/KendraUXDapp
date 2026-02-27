import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

/**
 * PeopleContext - Provides people data to all child components.
 *
 * This enables cross-app access to the people list. Other apps and the
 * omnibar can consume people via the usePeople() hook without making
 * direct API calls.
 *
 * Usage in any component/app:
 *   import { usePeople } from '../../src/lib/PeopleContext';
 *   const { people, myCard, searchPeople, getPerson } = usePeople();
 */

const PeopleContext = createContext({
  people: [],
  myCard: null,
  loading: false,
  error: null,
  getPerson: () => null,
  searchPeople: () => [],
  getPersonByIntegration: () => null,
  refreshPeople: () => {},
});

/**
 * Custom hook to consume the people context.
 * Returns people data and helper functions.
 */
export function usePeople() {
  return useContext(PeopleContext);
}

/**
 * PeopleProvider - Wraps children with people context data.
 * Fetches people on mount and provides search/lookup utilities.
 */
export function PeopleProvider({ children }) {
  const [people, setPeople] = useState([]);
  const [myCard, setMyCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const fetchPeople = useCallback(async () => {
    if (!loaded) setLoading(true);
    setError(null);

    try {
      const [peopleRes, myCardRes] = await Promise.all([
        fetch('/api/people'),
        fetch('/api/people/me')
      ]);

      const peopleData = await peopleRes.json();
      const myCardData = await myCardRes.json();

      if (peopleData.success) {
        setPeople(peopleData.people || []);
      } else {
        setError(peopleData.error);
      }

      if (myCardData.success) {
        setMyCard(myCardData.person || null);
      }
    } catch (err) {
      console.error('PeopleContext: Failed to fetch people:', err);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [loaded]);

  useEffect(() => {
    fetchPeople();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const contextValue = useMemo(() => {
    return {
      people,
      myCard,
      loading,
      error,

      /**
       * Get a single person by username.
       * @param {string} username
       * @returns {Object|null}
       */
      getPerson: (username) => {
        return people.find(p => p.username === username) || null;
      },

      /**
       * Search people by a query string.
       * Matches against name, nickname, role, company, email, skills, tags.
       * @param {string} query
       * @returns {Array}
       */
      searchPeople: (query) => {
        if (!query) return people;
        const q = query.toLowerCase().trim();
        return people.filter(p => {
          const fullName = `${p.name?.first || ''} ${p.name?.middle || ''} ${p.name?.last || ''}`.toLowerCase();
          const nickname = (p.nickname || '').toLowerCase();
          const role = (p.role || '').toLowerCase();
          const company = (p.company || '').toLowerCase();
          const email = (p.email || '').toLowerCase();
          const skills = (p.skills || []).join(' ').toLowerCase();
          const tags = (p.tags || []).join(' ').toLowerCase();

          return fullName.includes(q)
            || nickname.includes(q)
            || role.includes(q)
            || company.includes(q)
            || email.includes(q)
            || skills.includes(q)
            || tags.includes(q);
        });
      },

      /**
       * Find a person by integration ID.
       * Useful for looking up people from Slack user IDs, GitLab usernames, etc.
       * @param {string} type - Integration type (slack, gitlab, jira, github)
       * @param {string} id - The integration-specific ID
       * @returns {Object|null}
       */
      getPersonByIntegration: (type, id) => {
        if (!type || !id) return null;
        return people.find(p => p.integrations?.[type] === id) || null;
      },

      /**
       * Re-fetch people from the API.
       * Call this after creating, updating, or deleting a person.
       */
      refreshPeople: fetchPeople,
    };
  }, [people, myCard, loading, error, fetchPeople]);

  return (
    <PeopleContext.Provider value={contextValue}>
      {children}
    </PeopleContext.Provider>
  );
}

export default PeopleContext;
