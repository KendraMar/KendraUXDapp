import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Button, TextInput } from '@patternfly/react-core';
import { CommentsIcon, ThumbtackIcon, TimesIcon } from '@patternfly/react-icons';
import { BookOpenIcon, ScreenIcon, PaletteIcon, EditIcon, VideoIcon, ClipboardIcon } from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import aiAvatar from '../../../assets/avatar-bot.svg';

const DockedConversations = ({
  dockedConversations,
  isCollapsed,
  sidebarWidth,
  onFloatDockedConversation,
  onCloseDockedConversation,
  onDockedFollowUp
}) => {
  const navigate = useNavigate();
  const dockedItemRefs = useRef({});
  const [dockedPanelPosition, setDockedPanelPosition] = useState({ top: 0 });
  const [activeDockedId, setActiveDockedId] = useState(null);
  const [dockedFollowUpValue, setDockedFollowUpValue] = useState('');
  const dockedContentRef = useRef(null);

  // Auto-open panel when a new docked conversation starts loading
  useEffect(() => {
    // Find any conversation that is currently loading (newly created)
    const loadingConversation = dockedConversations.find(c => c.isLoading);
    if (loadingConversation) {
      setActiveDockedId(loadingConversation.id);
      // Update position after a tick to ensure the ref is set
      setTimeout(() => {
        const itemRef = dockedItemRefs.current[loadingConversation.id];
        if (itemRef) {
          const rect = itemRef.getBoundingClientRect();
          setDockedPanelPosition({ top: rect.top });
        }
      }, 0);
    }
  }, [dockedConversations.map(c => c.id + ':' + c.isLoading).join(',')]); // Trigger on ID or loading state changes

  // Auto-scroll docked panel to bottom when content changes
  const activeDockedConversation = dockedConversations.find(c => c.id === activeDockedId);
  useEffect(() => {
    if (dockedContentRef.current) {
      dockedContentRef.current.scrollTop = dockedContentRef.current.scrollHeight;
    }
  }, [activeDockedConversation?.response, activeDockedConversation?.isLoading, activeDockedConversation?.history?.length]);

  // Handle docked follow-up submit
  const handleDockedFollowUpSubmit = () => {
    if (!dockedFollowUpValue.trim() || activeDockedConversation?.isLoading || !activeDockedId) return;
    const query = dockedFollowUpValue;
    setDockedFollowUpValue('');
    if (onDockedFollowUp) {
      onDockedFollowUp(activeDockedId, query);
    }
  };

  // Handle clicking on a docked conversation item - toggle panel open/closed
  const handleDockedItemClick = (conversationId) => {
    if (activeDockedId === conversationId) {
      // Clicking the already-active one toggles it closed
      setActiveDockedId(null);
    } else {
      // Update position and open this conversation's panel
      const itemRef = dockedItemRefs.current[conversationId];
      if (itemRef) {
        const rect = itemRef.getBoundingClientRect();
        setDockedPanelPosition({ top: rect.top });
      }
      setActiveDockedId(conversationId);
    }
  };

  // Mock artifact data for conversations
  const mockArtifacts = {
    0: [
      { id: 'a1', type: 'document', label: 'Design Principles', icon: 'book', path: '/design' },
      { id: 'a2', type: 'slides', label: 'Sprint Review Deck', icon: 'screen', path: '/catalog' },
      { id: 'a3', type: 'canvas', label: 'User Flow Diagram', icon: 'palette', path: '/canvas' },
    ],
    1: [
      { id: 'a4', type: 'document', label: 'API Spec v2', icon: 'edit', path: '/design' },
      { id: 'a5', type: 'recording', label: 'Standup Recording', icon: 'video', path: '/recordings' },
    ],
    2: [
      { id: 'a6', type: 'slides', label: 'Quarterly Roadmap', icon: 'screen', path: '/catalog' },
      { id: 'a7', type: 'canvas', label: 'Architecture Diagram', icon: 'palette', path: '/canvas' },
      { id: 'a8', type: 'document', label: 'Migration Guide', icon: 'book', path: '/design' },
      { id: 'a9', type: 'recording', label: 'Design Review', icon: 'video', path: '/recordings' },
    ],
    3: [
      { id: 'a10', type: 'document', label: 'Component Audit', icon: 'clipboard', path: '/design' },
    ],
  };

  const artifactIconMap = {
    book: <BookOpenIcon className="apollo-artifact-icon" />,
    screen: <ScreenIcon className="apollo-artifact-icon" />,
    palette: <PaletteIcon className="apollo-artifact-icon" />,
    edit: <EditIcon className="apollo-artifact-icon" />,
    video: <VideoIcon className="apollo-artifact-icon" />,
    clipboard: <ClipboardIcon className="apollo-artifact-icon" />,
  };

  const handleArtifactClick = (artifact, e) => {
    e.stopPropagation();
    navigate(artifact.path);
  };

  // Docked conversation entries (rendered inside unified conversations section)
  const dockedConversationEntries = dockedConversations.map((conversation, idx) => {
    const dockedArtifacts = mockArtifacts[idx] || [];
    return (
      <div 
        key={conversation.id}
        ref={(el) => dockedItemRefs.current[conversation.id] = el}
        className={`apollo-pinned-item ${activeDockedId === conversation.id ? 'active' : ''}`}
        onClick={() => handleDockedItemClick(conversation.id)}
      >
        <div className="apollo-pinned-item-row">
          {conversation.assistant ? (
            <img 
              src={conversation.assistant.avatar} 
              alt={conversation.assistant.name}
              className="apollo-pinned-avatar"
            />
          ) : (
            <CommentsIcon className="apollo-pinned-icon" />
          )}
          <span className="apollo-pinned-item-title">
            {(conversation.query || '').length > 35 
              ? conversation.query.substring(0, 35) + '...' 
              : (conversation.query || 'Conversation')}
          </span>
          <div className="apollo-pinned-item-actions" style={{ opacity: 1 }}>
            <button 
              className="apollo-pinned-action-btn"
              onClick={(e) => { e.stopPropagation(); onFloatDockedConversation && onFloatDockedConversation(conversation.id); }}
              title="Pop out to floating panel"
            >
              <ThumbtackIcon />
            </button>
            <button 
              className="apollo-pinned-action-btn apollo-pinned-close-btn"
              onClick={(e) => { e.stopPropagation(); onCloseDockedConversation && onCloseDockedConversation(conversation.id); }}
              title="Remove from sidebar"
            >
              <TimesIcon />
            </button>
          </div>
        </div>
        {dockedArtifacts.length > 0 && (
          <div className="apollo-conversation-artifacts">
            {dockedArtifacts.map((artifact) => (
              <div 
                key={artifact.id}
                className="apollo-artifact-item"
                onClick={(e) => handleArtifactClick(artifact, e)}
                title={`Open ${artifact.label}`}
              >
                {artifactIconMap[artifact.icon]}
                <span className="apollo-artifact-label">{artifact.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  });

  // Docked conversation floating panel - rendered via portal to the right of sidebar
  const dockedFloatingPanel = activeDockedConversation && activeDockedId && !isCollapsed && ReactDOM.createPortal(
    <div 
      className="apollo-pinned-floating-panel"
      style={{
        top: `${dockedPanelPosition.top}px`,
        left: `${sidebarWidth + 8}px`
      }}
    >
      {/* Caret pointing to the docked item */}
      <div className="apollo-pinned-floating-caret" />
      
      {/* Panel Header */}
      <div className="apollo-pinned-floating-header apollo-pinned-floating-drag-handle">
        <button 
          className="apollo-conversation-pin"
          onClick={(e) => {
            e.stopPropagation();
            onFloatDockedConversation && onFloatDockedConversation(activeDockedId);
          }}
          title="Pop out to floating panel"
        >
          <ThumbtackIcon />
        </button>
        <div className="apollo-pinned-floating-drag-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <button 
          className="apollo-conversation-close"
          onClick={(e) => {
            e.stopPropagation();
            setActiveDockedId(null); // Just close the panel, don't remove conversation
          }}
          title="Close panel"
        >
          <TimesIcon />
        </button>
      </div>
      
      {/* Conversation Content */}
      <div className="apollo-pinned-floating-content" ref={dockedContentRef}>
        {/* Previous messages from history */}
        {activeDockedConversation.history && activeDockedConversation.history.map((msg, index) => (
          <div key={index} className={`apollo-message apollo-message-${msg.type}`}>
            {msg.type === 'ai' && (
              <img src={aiAvatar} alt="AI" className="apollo-message-avatar" />
            )}
            <div className="apollo-message-content">{msg.content}</div>
          </div>
        ))}

        {/* Current user query */}
        <div className="apollo-message apollo-message-user">
          <div className="apollo-message-content">{activeDockedConversation.query}</div>
        </div>
        
        {/* Loading indicator, Kagi search results, or AI response */}
        {activeDockedConversation.isLoading ? (
          <div className="apollo-message apollo-message-ai apollo-loading">
            <img src={aiAvatar} alt="AI" className="apollo-message-avatar" />
            <div className="apollo-loading-indicator">
              <span className="apollo-loading-dot"></span>
              <span className="apollo-loading-dot"></span>
              <span className="apollo-loading-dot"></span>
            </div>
          </div>
        ) : activeDockedConversation.isKagiSearch && activeDockedConversation.kagiResults ? (
          <div className="kagi-search-results">
            <div className="kagi-results-header">
              <img src={activeDockedConversation.assistant?.avatar} alt="Kagi" className="kagi-results-logo" />
              <span className="kagi-results-count">
                {activeDockedConversation.kagiResults.length} results
                {activeDockedConversation.kagiMeta?.ms ? ` (${activeDockedConversation.kagiMeta.ms}ms)` : ''}
              </span>
            </div>
            <div className="kagi-results-list">
              {activeDockedConversation.kagiResults.map((result, index) => (
                <a
                  key={index}
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kagi-result-item"
                >
                  <div className="kagi-result-url">
                    {(() => {
                      try {
                        const url = new URL(result.url);
                        return url.hostname.replace('www.', '');
                      } catch {
                        return result.url;
                      }
                    })()}
                  </div>
                  <div className="kagi-result-title">{result.title}</div>
                  {result.snippet && (
                    <div className="kagi-result-snippet">{result.snippet}</div>
                  )}
                  {result.published && (
                    <div className="kagi-result-date">
                      {new Date(result.published).toLocaleDateString()}
                    </div>
                  )}
                </a>
              ))}
            </div>
            {activeDockedConversation.kagiRelatedSearches && activeDockedConversation.kagiRelatedSearches.length > 0 && (
              <div className="kagi-related-searches">
                <div className="kagi-related-header">Related searches</div>
                <div className="kagi-related-list">
                  {activeDockedConversation.kagiRelatedSearches.map((term, index) => (
                    <span key={index} className="kagi-related-term">{term}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeDockedConversation.response && (
          <div className="apollo-message apollo-message-ai">
            <img src={aiAvatar} alt="AI" className="apollo-message-avatar" />
            <div className="apollo-message-content">
              {activeDockedConversation.response}
            </div>
          </div>
        )}
      </div>

      {/* Follow-up input - always visible */}
      <div className="apollo-followup-container">
        <div className="apollo-followup-input-wrapper">
          <TextInput
            value={dockedFollowUpValue}
            onChange={(e, val) => setDockedFollowUpValue(val)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !activeDockedConversation.isLoading) {
                e.preventDefault();
                handleDockedFollowUpSubmit();
              }
            }}
            placeholder={activeDockedConversation.isLoading ? 'Waiting for response...' : 'Ask a follow-up question...'}
            aria-label="Follow-up question"
            className="apollo-followup-input"
          />
        </div>
        <Button 
          variant="primary" 
          onClick={handleDockedFollowUpSubmit}
          isDisabled={!dockedFollowUpValue.trim() || activeDockedConversation.isLoading}
          className="apollo-followup-button"
        >
          Send
        </Button>
      </div>
    </div>,
    document.body
  );

  if (isCollapsed || dockedConversations.length === 0) {
    return dockedFloatingPanel;
  }

  return (
    <>
      {dockedConversationEntries}
      {dockedFloatingPanel}
    </>
  );
};

export default DockedConversations;
