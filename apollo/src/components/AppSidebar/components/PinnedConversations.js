import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Button, TextInput } from '@patternfly/react-core';
import { CommentsIcon, ThumbtackIcon, TimesIcon } from '@patternfly/react-icons';
import { BookOpenIcon, ScreenIcon, PaletteIcon, EditIcon, VideoIcon, ClipboardIcon } from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';
import aiAvatar from '../../../assets/avatar-bot.svg';

const PinnedConversations = ({
  pinnedConversations,
  isCollapsed,
  sidebarWidth,
  activeSpaceId,
  onUnpinConversation,
  onCloseConversation
}) => {
  const navigate = useNavigate();
  const [activePinnedId, setActivePinnedId] = useState(null);
  const [pinnedPanelPosition, setPinnedPanelPosition] = useState({ top: 0, left: 0 });
  const pinnedItemRefs = useRef({});
  const pinnedPanelRef = useRef(null);
  
  // Drag state for pinned floating panel
  const [isPinnedDragging, setIsPinnedDragging] = useState(false);
  const [pinnedDragOffset, setPinnedDragOffset] = useState({ x: 0, y: 0 });
  const [pinnedHasBeenDragged, setPinnedHasBeenDragged] = useState(false);

  // Handle click outside to close pinned panel (only if still pinned, not if dragged/unpinned)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activePinnedId && !pinnedHasBeenDragged && pinnedPanelRef.current && !pinnedPanelRef.current.contains(event.target)) {
        // Check if click was on the pinned item itself
        const clickedPinnedItem = Object.keys(pinnedItemRefs.current).some(id => 
          pinnedItemRefs.current[id]?.contains(event.target)
        );
        if (!clickedPinnedItem) {
          setActivePinnedId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePinnedId, pinnedHasBeenDragged]);

  // Handle drag events for pinned floating panel
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isPinnedDragging) {
        setPinnedPanelPosition({
          top: e.clientY - pinnedDragOffset.y,
          left: e.clientX - pinnedDragOffset.x
        });
      }
    };

    const handleMouseUp = () => {
      if (isPinnedDragging) {
        setIsPinnedDragging(false);
      }
    };

    if (isPinnedDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPinnedDragging, pinnedDragOffset]);

  // Start dragging the pinned panel - auto-unpins
  const onPinnedDragStart = (e, conversationId) => {
    if (pinnedPanelRef.current) {
      const rect = pinnedPanelRef.current.getBoundingClientRect();
      setPinnedDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      if (!pinnedHasBeenDragged) {
        // First drag - set initial position and auto-unpin
        setPinnedPanelPosition({
          top: rect.top,
          left: rect.left
        });
        setPinnedHasBeenDragged(true);
        // Auto-unpin when user starts dragging
        if (onUnpinConversation) {
          onUnpinConversation(conversationId);
        }
      }
      setIsPinnedDragging(true);
    }
  };

  // Handle pinned item click - show floating panel
  const handlePinnedItemClick = (conversation, event) => {
    if (activePinnedId === conversation.id && !pinnedHasBeenDragged) {
      setActivePinnedId(null);
    } else {
      // Get position of the clicked item
      const itemElement = pinnedItemRefs.current[conversation.id];
      if (itemElement) {
        const rect = itemElement.getBoundingClientRect();
        setPinnedPanelPosition({
          top: rect.top,
          left: sidebarWidth + 8
        });
      }
      setActivePinnedId(conversation.id);
      // Reset drag state for new panel
      setPinnedHasBeenDragged(false);
    }
  };

  // Handle unpin from floating panel - keep panel floating
  const handleUnpinFromPanel = (conversationId) => {
    // Call the parent unpin handler - this will move it to floating state
    if (onUnpinConversation) {
      onUnpinConversation(conversationId);
    }
    setActivePinnedId(null);
  };

  // Filter pinned conversations for the active space
  const spacePinnedConversations = pinnedConversations.filter(
    chat => chat.spaceId === activeSpaceId || (!chat.spaceId && activeSpaceId === 'default')
  );

  // Get the active pinned conversation for the floating panel
  const activePinnedConversation = spacePinnedConversations.find(c => c.id === activePinnedId);

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

  if (isCollapsed || spacePinnedConversations.length === 0) {
    return null;
  }

  // Floating panel for active pinned conversation - rendered via portal to escape sidebar overflow
  const pinnedFloatingPanel = activePinnedConversation && ReactDOM.createPortal(
    <div 
      ref={pinnedPanelRef}
      className={`apollo-pinned-floating-panel ${pinnedHasBeenDragged ? 'apollo-pinned-floating-dragged' : ''} ${isPinnedDragging ? 'apollo-pinned-floating-dragging' : ''}`}
      style={pinnedHasBeenDragged ? {
        top: `${pinnedPanelPosition.top}px`,
        left: `${pinnedPanelPosition.left}px`
      } : {
        top: `${pinnedPanelPosition.top}px`,
        left: `${sidebarWidth + 8}px`
      }}
    >
      {/* Caret pointing to the pinned item - only show when still pinned */}
      {!pinnedHasBeenDragged && <div className="apollo-pinned-floating-caret" />}
      
      {/* Draggable Panel Header */}
      <div 
        className="apollo-pinned-floating-header apollo-pinned-floating-drag-handle"
        onMouseDown={(e) => onPinnedDragStart(e, activePinnedConversation.id)}
      >
        <button 
          className={`apollo-conversation-pin ${pinnedHasBeenDragged ? 'unpinned' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            if (pinnedHasBeenDragged) {
              // Already unpinned - clicking would re-pin (not implemented yet)
            } else {
              handleUnpinFromPanel(activePinnedConversation.id);
            }
          }}
          title={pinnedHasBeenDragged ? 'Unpinned' : 'Pop out to floating panel'}
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
            setActivePinnedId(null);
            setPinnedHasBeenDragged(false);
            onCloseConversation(activePinnedConversation.id);
          }}
          title="Close"
        >
          <TimesIcon />
        </button>
      </div>
      
      {/* Conversation Content */}
      <div className="apollo-pinned-floating-content">
        {/* User query */}
        <div className="apollo-message apollo-message-user">
          <div className="apollo-message-content">{activePinnedConversation.query}</div>
        </div>
        
        {/* AI response */}
        <div className="apollo-message apollo-message-ai">
          <img src={aiAvatar} alt="AI" className="apollo-message-avatar" />
          <div className="apollo-message-content">
            {activePinnedConversation.response}
          </div>
        </div>
        
        {/* Previous history messages if any */}
        {activePinnedConversation.history && activePinnedConversation.history.slice(0, -2).map((msg, index) => (
          <div key={index} className={`apollo-message apollo-message-${msg.type}`}>
            {msg.type === 'ai' && (
              <img src={aiAvatar} alt="AI" className="apollo-message-avatar" />
            )}
            <div className="apollo-message-content">{msg.content}</div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {spacePinnedConversations.map((conversation, index) => {
          const artifacts = mockArtifacts[index] || [];
          return (
            <div 
              key={conversation.id}
              ref={(el) => pinnedItemRefs.current[conversation.id] = el}
              className={`apollo-pinned-item ${activePinnedId === conversation.id ? 'active' : ''}`}
              onClick={(e) => handlePinnedItemClick(conversation, e)}
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
                  {conversation.query.length > 35 
                    ? conversation.query.substring(0, 35) + '...' 
                    : conversation.query}
                </span>
                <div className="apollo-pinned-item-actions">
                  <button 
                    className="apollo-pinned-action-btn"
                    onClick={(e) => { e.stopPropagation(); onUnpinConversation(conversation.id); }}
                    title="Pop out to floating panel"
                  >
                    <ThumbtackIcon />
                  </button>
                  <button 
                    className="apollo-pinned-action-btn apollo-pinned-close-btn"
                    onClick={(e) => { e.stopPropagation(); onCloseConversation(conversation.id); }}
                    title="Close"
                  >
                    <TimesIcon />
                  </button>
                </div>
              </div>
              {artifacts.length > 0 && (
                <div className="apollo-conversation-artifacts">
                  {artifacts.map((artifact) => (
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
      })}
      {pinnedFloatingPanel}
    </>
  );
};

export default PinnedConversations;
