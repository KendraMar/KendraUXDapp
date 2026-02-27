import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Page } from '@patternfly/react-core';
import { HomeAssistantActivityTracker } from './lib/homeAssistantActivity';
import { MusicProvider } from './lib/MusicContext';
import { RecordingProvider } from './lib/RecordingContext';
import { SpaceContextProvider } from './lib/SpaceContext';
import { PeopleProvider } from './lib/PeopleContext';
import AppMasthead from './components/AppMasthead';
import AppSidebar from './components/AppSidebar';
import routes from './routes';

// Import app registry for modular applications
import { getAppRoutes } from './lib/appRegistry';

// Sidebar states: 'open' (full), 'collapsed' (icons only), 'hidden' (completely hidden)
const SIDEBAR_STATES = {
  OPEN: 'open',
  COLLAPSED: 'collapsed',
  HIDDEN: 'hidden'
};

// Default sidebar width
const DEFAULT_SIDEBAR_WIDTH = 250;
const COLLAPSED_SIDEBAR_WIDTH = 82;

function App() {
  // Sidebar state with localStorage persistence
  const [sidebarState, setSidebarState] = useState(() => {
    const saved = localStorage.getItem('apollo-sidebar-state');
    if (saved && Object.values(SIDEBAR_STATES).includes(saved)) {
      return saved;
    }
    return SIDEBAR_STATES.OPEN;
  });
  const [pinnedConversations, setPinnedConversations] = useState([]);
  const [floatingConversation, setFloatingConversation] = useState(null);
  const [activeSpaceId, setActiveSpaceId] = useState('default');
  const [activeSpace, setActiveSpace] = useState(null);
  const [agentSuggestedItems, setAgentSuggestedItems] = useState([]);
  const [currentSpaceItems, setCurrentSpaceItems] = useState([]);
  
  // Docked conversations state - supports multiple conversations docked in sidebar
  const [dockedConversations, setDockedConversations] = useState([]);
  // Ref to track which docked conversation is currently being streamed to
  const activeDockedIdRef = useRef(null);
  
  // Sidebar width state with localStorage persistence
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('apollo-sidebar-width');
    return saved ? parseInt(saved, 10) : DEFAULT_SIDEBAR_WIDTH;
  });

  // Navigation position state (left or right) with localStorage persistence
  const [navPosition, setNavPosition] = useState(() => {
    const saved = localStorage.getItem('apollo-nav-position');
    return saved === 'right' ? 'right' : 'left';
  });

  // Persist sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('apollo-sidebar-state', sidebarState);
  }, [sidebarState]);

  // Persist nav position to localStorage
  useEffect(() => {
    localStorage.setItem('apollo-nav-position', navPosition);
  }, [navPosition]);

  // Listen for nav position changes from Settings page
  useEffect(() => {
    const handleNavPositionChange = (e) => {
      setNavPosition(e.detail.position);
    };
    window.addEventListener('apollo-nav-position-change', handleNavPositionChange);
    return () => {
      window.removeEventListener('apollo-nav-position-change', handleNavPositionChange);
    };
  }, []);

  // Load pinned and docked chats on mount
  useEffect(() => {
    const loadChats = async () => {
      try {
        // Load pinned chats
        const pinnedResponse = await fetch('/api/chats/pinned');
        if (pinnedResponse.ok) {
          const data = await pinnedResponse.json();
          setPinnedConversations(data.pinnedChats || []);
        }
        
        // Load docked chats (all for the default space)
        const dockedResponse = await fetch('/api/chats/docked');
        if (dockedResponse.ok) {
          const data = await dockedResponse.json();
          const spaceDocked = (data.dockedChats || []).filter(
            c => c.spaceId === 'default' || !c.spaceId
          );
          if (spaceDocked.length > 0) {
            setDockedConversations(spaceDocked);
          }
        }
      } catch (error) {
        console.error('Error loading chats:', error);
      }
    };
    loadChats();
  }, []);

  const cycleSidebarState = () => {
    setSidebarState(current => {
      switch (current) {
        case SIDEBAR_STATES.OPEN:
          return SIDEBAR_STATES.COLLAPSED;
        case SIDEBAR_STATES.COLLAPSED:
          return SIDEBAR_STATES.HIDDEN;
        case SIDEBAR_STATES.HIDDEN:
        default:
          return SIDEBAR_STATES.OPEN;
      }
    });
  };

  const getSidebarWidth = () => {
    switch (sidebarState) {
      case SIDEBAR_STATES.OPEN:
        return `${sidebarWidth}px`;
      case SIDEBAR_STATES.COLLAPSED:
        return `${COLLAPSED_SIDEBAR_WIDTH}px`;
      case SIDEBAR_STATES.HIDDEN:
      default:
        return '0px';
    }
  };

  const handleSidebarResize = useCallback((newWidth) => {
    setSidebarWidth(newWidth);
    localStorage.setItem('apollo-sidebar-width', newWidth.toString());
  }, []);

  const handlePinConversation = useCallback(async (conversation) => {
    try {
      const response = await fetch('/api/chats/pinned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...conversation,
          spaceId: activeSpaceId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setPinnedConversations(prev => [data.chat, ...prev]);
      }
    } catch (error) {
      console.error('Error pinning conversation:', error);
    }
    setFloatingConversation(null);
  }, [activeSpaceId]);

  const handleUnpinConversation = useCallback(async (chatId) => {
    const chat = pinnedConversations.find(c => c.id === chatId);
    if (!chat) return;
    
    try {
      const response = await fetch(`/api/chats/pinned/${chatId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setPinnedConversations(prev => prev.filter(c => c.id !== chatId));
        // Restore to floating panel
        setFloatingConversation({
          query: chat.query,
          response: chat.response,
          history: chat.history,
          assistant: chat.assistant
        });
      }
    } catch (error) {
      console.error('Error unpinning conversation:', error);
    }
  }, [pinnedConversations]);

  const handleCloseConversation = useCallback(async (chatId) => {
    if (chatId) {
      // Close a pinned conversation
      try {
        const response = await fetch(`/api/chats/pinned/${chatId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setPinnedConversations(prev => prev.filter(c => c.id !== chatId));
        }
      } catch (error) {
        console.error('Error closing conversation:', error);
      }
    } else {
      // Close the floating conversation
      setFloatingConversation(null);
    }
  }, []);

  const handleSpaceChange = useCallback(async (spaceId, spaceItems = [], spaceObj = null) => {
    setActiveSpaceId(spaceId);
    setActiveSpace(spaceObj);
    // Store the current space's nav items for agent suggestion simulation
    setCurrentSpaceItems(spaceItems);
    // Clear suggestions when changing spaces
    setAgentSuggestedItems([]);
    
    // Load docked chat for the new space
    try {
      const response = await fetch(`/api/chats/docked/space/${spaceId}`);
      if (response.ok) {
        const data = await response.json();
        setDockedConversations(data.dockedChat ? [data.dockedChat] : []);
      }
    } catch (error) {
      console.error('Error loading docked chat for space:', error);
    }
  }, []);

  // Called when an agent conversation completes - simulates agent suggesting pages to check
  const handleAgentConversationComplete = useCallback(() => {
    // Get non-section items from current space
    const navItemIds = currentSpaceItems
      .filter(item => item.type !== 'section')
      .map(item => item.id);
    
    if (navItemIds.length === 0) return;
    
    // Randomly select 2-4 items to suggest (simulating agent recommendations)
    const numSuggestions = Math.min(navItemIds.length, Math.floor(Math.random() * 3) + 2);
    const shuffled = [...navItemIds].sort(() => Math.random() - 0.5);
    const selectedItems = shuffled.slice(0, numSuggestions);
    
    setAgentSuggestedItems(prev => {
      // Merge with existing suggestions, avoiding duplicates
      const combined = new Set([...prev, ...selectedItems]);
      return Array.from(combined);
    });
  }, [currentSpaceItems]);

  // Clear a specific agent suggestion when user clicks on that nav item
  const handleClearAgentSuggestion = useCallback((itemId) => {
    setAgentSuggestedItems(prev => prev.filter(id => id !== itemId));
  }, []);

  // Dock a new conversation to the sidebar (called when user submits from masthead)
  const handleDockConversation = useCallback(async (conversation) => {
    const tempId = `docked-${Date.now()}`;
    const newDockedConversation = {
      id: tempId,
      query: conversation.query,
      response: '',
      history: [],
      assistant: conversation.assistant,
      isLoading: true,
      isComplete: false,
      spaceId: activeSpaceId
    };
    
    // Track this as the active docked conversation (for streaming updates)
    activeDockedIdRef.current = tempId;
    
    // Add to array for responsiveness
    setDockedConversations(prev => [...prev, newDockedConversation]);
    
    // Save to server
    try {
      const response = await fetch('/api/chats/docked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDockedConversation)
      });
      
      if (response.ok) {
        const data = await response.json();
        const serverId = data.chat.id;
        // Update with server-assigned ID
        if (activeDockedIdRef.current === tempId) {
          activeDockedIdRef.current = serverId;
        }
        setDockedConversations(prev => prev.map(c => c.id === tempId ? { ...c, id: serverId } : c));
      }
    } catch (error) {
      console.error('Error saving docked conversation:', error);
    }
  }, [activeSpaceId]);

  // Update the docked conversation's streaming response (targets the active docked conversation)
  const handleUpdateDockedConversation = useCallback(async (updates) => {
    const targetId = activeDockedIdRef.current;
    if (!targetId) return;
    
    setDockedConversations(prev => {
      return prev.map(c => {
        if (c.id !== targetId) return c;
        const updated = { ...c, ...updates };
        
        // Save to server in background on completion
        if (updates.isComplete || updates.isLoading === false) {
          fetch(`/api/chats/docked/${c.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          }).catch(err => console.error('Error updating docked conversation:', err));
        }
        
        return updated;
      });
    });
  }, []);

  // Handle follow-up message from docked conversation panel
  const handleDockedFollowUp = useCallback(async (conversationId, query) => {
    if (!query.trim()) return;
    
    // Find the target conversation from current state
    let targetConversation = null;
    setDockedConversations(prev => {
      targetConversation = prev.find(c => c.id === conversationId);
      return prev;
    });
    
    if (!targetConversation) return;

    // Helper to persist conversation history to data/conversations/ system of record
    const persistToConversations = (history) => {
      const sessionId = targetConversation.conversationSessionId;
      if (!sessionId) return;
      const messages = history.map(msg => ({
        role: msg.type === 'ai' ? 'assistant' : (msg.type === 'kagi-results' ? 'assistant' : 'user'),
        content: msg.type === 'kagi-results'
          ? JSON.stringify({ results: msg.results, relatedSearches: msg.relatedSearches })
          : msg.content,
        timestamp: new Date().toISOString()
      }));
      fetch(`/api/conversations/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, status: 'active' })
      }).catch(err => console.error('Error persisting follow-up to conversations:', err));
    };

    // Build updated history from current conversation
    // history contains only previous exchanges; the current query/response become
    // "previous" now that a new follow-up is starting, so we append them.
    const currentHistory = targetConversation.history || [];
    const updatedHistory = [
      ...currentHistory,
      { type: 'user', content: targetConversation.query },
      ...(targetConversation.response ? [{ type: 'ai', content: targetConversation.response }] : [])
    ];

    // Helper to update this specific conversation in the array
    const updateConversation = (updates) => {
      setDockedConversations(prev => prev.map(c => c.id === conversationId ? { ...c, ...updates } : c));
    };

    // Update conversation: new query, loading state, clear response
    updateConversation({
      query: query,
      response: '',
      history: updatedHistory,
      isLoading: true,
      isComplete: false,
      isKagiSearch: false,
      kagiResults: null
    });

    const assistant = targetConversation.assistant;

    // Build messages array for API calls
    const apiMessages = [
      ...updatedHistory.map(msg => ({
        role: msg.type === 'ai' ? 'assistant' : 'user',
        content: msg.content
      })),
      { role: 'user', content: query }
    ];

    if (assistant?.isCursorCli) {
      try {
        const response = await fetch('/api/cursorcli/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model: assistant.defaultModel || 'claude-4.5-sonnet'
          })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Cursor CLI request failed');
        }
        const data = await response.json();
        const fullResponse = data.content;
        const fullHistory = [...updatedHistory, { type: 'user', content: query }, { type: 'ai', content: fullResponse }];
        updateConversation({
          isLoading: false,
          response: fullResponse,
          history: updatedHistory,
          isComplete: true
        });
        persistToConversations(fullHistory);
      } catch (error) {
        console.error('Error calling Cursor CLI:', error);
        const fullHistory = [...updatedHistory, { type: 'user', content: query }, { type: 'ai', content: `Error: ${error.message}` }];
        updateConversation({
          isLoading: false,
          response: `Error: ${error.message}`,
          history: updatedHistory,
          isComplete: true
        });
        persistToConversations(fullHistory);
      }
    } else if (assistant?.isClaudeCode) {
      try {
        const response = await fetch('/api/claudecode/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model: assistant.defaultModel || 'claude-sonnet-4-20250514'
          })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Claude Code request failed');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        updateConversation({ isLoading: false });
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  fullResponse += data.text;
                  updateConversation({ response: fullResponse });
                } else if (data.done) {
                  const fullHistory = [...updatedHistory, { type: 'user', content: query }, { type: 'ai', content: fullResponse }];
                  updateConversation({
                    response: fullResponse,
                    history: updatedHistory,
                    isComplete: true
                  });
                  persistToConversations(fullHistory);
                } else if (data.error) {
                  updateConversation({ response: `Error: ${data.error}` });
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      } catch (error) {
        console.error('Error calling Claude Code:', error);
        const fullHistory = [...updatedHistory, { type: 'user', content: query }, { type: 'ai', content: `Error: ${error.message}` }];
        updateConversation({
          isLoading: false,
          response: `Error: ${error.message}`,
          history: updatedHistory,
          isComplete: true
        });
        persistToConversations(fullHistory);
      }
    } else {
      // Default simulated response
      const simResponse = "I understand you'd like more information. Let me look into that for you and provide additional details...";
      setTimeout(() => {
        const fullHistory = [...updatedHistory, { type: 'user', content: query }, { type: 'ai', content: simResponse }];
        updateConversation({
          isLoading: false,
          response: simResponse,
          history: updatedHistory,
          isComplete: true
        });
        persistToConversations(fullHistory);
      }, 1500);
    }
  }, []);

  // Float a docked conversation (move it from sidebar to floating panel)
  const handleFloatDockedConversation = useCallback((conversationId) => {
    setDockedConversations(prev => {
      const target = prev.find(c => c.id === conversationId);
      if (target) {
        setFloatingConversation({
          query: target.query,
          response: target.response,
          history: target.history,
          assistant: target.assistant
        });
        return prev.filter(c => c.id !== conversationId);
      }
      return prev;
    });
  }, []);

  // Close a docked conversation (remove from sidebar and server)
  const handleCloseDockedConversation = useCallback(async (conversationId) => {
    setDockedConversations(prev => prev.filter(c => c.id !== conversationId));
    
    // Delete from server
    if (conversationId) {
      try {
        await fetch(`/api/chats/docked/${conversationId}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error deleting docked conversation:', error);
      }
    }
  }, []);

  return (
    <PeopleProvider>
    <MusicProvider>
    <RecordingProvider>
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      {/* Track UI activity and report to Home Assistant */}
      <HomeAssistantActivityTracker />
      <Page
        masthead={
          <AppMasthead 
            onToggleSidebar={cycleSidebarState} 
            sidebarState={sidebarState} 
            onPinConversation={handlePinConversation}
            floatingConversation={floatingConversation}
            onCloseConversation={handleCloseConversation}
            onAgentConversationComplete={handleAgentConversationComplete}
            onDockConversation={handleDockConversation}
            onUpdateDockedConversation={handleUpdateDockedConversation}
          />
        }
        sidebar={
          <AppSidebar 
            isCollapsed={sidebarState === SIDEBAR_STATES.COLLAPSED} 
            isHidden={sidebarState === SIDEBAR_STATES.HIDDEN}
            pinnedConversations={pinnedConversations}
            onUnpinConversation={handleUnpinConversation}
            onCloseConversation={handleCloseConversation}
            onSpaceChange={handleSpaceChange}
            sidebarWidth={sidebarWidth}
            onSidebarResize={handleSidebarResize}
            agentSuggestedItems={agentSuggestedItems}
            onClearAgentSuggestion={handleClearAgentSuggestion}
            dockedConversations={dockedConversations}
            onFloatDockedConversation={handleFloatDockedConversation}
            onCloseDockedConversation={handleCloseDockedConversation}
            onDockedFollowUp={handleDockedFollowUp}
            navPosition={navPosition}
          />
        }
        onPageResize={null}
        className={navPosition === 'right' ? 'apollo-nav-right' : ''}
        style={{
          '--pf-v6-c-page__sidebar--Width': getSidebarWidth()
        }}
      >
        <SpaceContextProvider activeSpaceId={activeSpaceId} activeSpace={activeSpace}>
          <Routes>
            <Route path="/" element={<Navigate to="/welcome" replace />} />

            {/* Static routes from src/routes.js */}
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<route.component />}
              />
            ))}
            
            {/* Dynamic routes from modular apps in data/apps/ */}
            {getAppRoutes().map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={<route.component />}
              />
            ))}
          </Routes>
        </SpaceContextProvider>
      </Page>
    </Router>
    </RecordingProvider>
    </MusicProvider>
    </PeopleProvider>
  );
}

export default App;

