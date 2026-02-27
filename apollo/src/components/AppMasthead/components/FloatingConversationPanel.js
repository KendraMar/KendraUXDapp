import React from 'react';
import { Button, TextInput } from '@patternfly/react-core';
import { ThumbtackIcon, TimesIcon, MicrophoneIcon } from '@patternfly/react-icons';
import aiAvatar from '../../../assets/avatar-bot.svg';

const FloatingConversationPanel = ({
  conversationPanelRef,
  conversationContentRef,
  showConversation,
  hasBeenDragged,
  isDragging,
  panelPosition,
  submittedQuery,
  isLoading,
  streamedResponse,
  conversationHistory,
  followUpValue,
  setFollowUpValue,
  userHasScrolledUp,
  onDragStart,
  handleConversationScroll,
  onPinClick,
  handleCloseConversation,
  onFollowUpSubmit,
  onMicrophoneClick,
  isRecording
}) => {
  if (!showConversation) return null;

  return (
    <div 
      ref={conversationPanelRef}
      className={`apollo-conversation-panel ${hasBeenDragged ? 'apollo-conversation-dragged' : ''} ${isDragging ? 'apollo-conversation-dragging' : ''}`}
      style={hasBeenDragged ? {
        position: 'fixed',
        left: `${panelPosition.x}px`,
        top: `${panelPosition.y}px`,
        transform: 'none'
      } : {}}
    >
      {/* Draggable Panel Header */}
      <div 
        className="apollo-conversation-header apollo-conversation-drag-handle"
        onMouseDown={onDragStart}
      >
        <button 
          className="apollo-conversation-pin"
          onClick={(e) => { e.stopPropagation(); onPinClick(); }}
          title="Pin to sidebar"
        >
          <ThumbtackIcon />
        </button>
        <div className="apollo-conversation-drag-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <button 
          className="apollo-conversation-close"
          onClick={(e) => { e.stopPropagation(); handleCloseConversation(); }}
          title="Close"
        >
          <TimesIcon />
        </button>
      </div>
      
      {/* Conversation Content */}
      <div 
        ref={conversationContentRef}
        className="apollo-conversation-content"
        onScroll={handleConversationScroll}
      >
        {/* Previous messages in history */}
        {conversationHistory.slice(0, -2).map((msg, index) => (
          <div key={index} className={`apollo-message apollo-message-${msg.type}`}>
            {msg.type === 'ai' && (
              <img src={aiAvatar} alt="AI" className="apollo-message-avatar" />
            )}
            <div className="apollo-message-content">{msg.content}</div>
          </div>
        ))}
        
        {/* Current user query */}
        <div className="apollo-message apollo-message-user apollo-message-animate-in">
          <div className="apollo-message-content">{submittedQuery}</div>
        </div>
        
        {/* Loading indicator or AI response */}
        {isLoading ? (
          <div className="apollo-message apollo-message-ai apollo-loading">
            <img src={aiAvatar} alt="AI" className="apollo-message-avatar" />
            <div className="apollo-loading-indicator">
              <span className="apollo-loading-dot"></span>
              <span className="apollo-loading-dot"></span>
              <span className="apollo-loading-dot"></span>
            </div>
          </div>
        ) : streamedResponse && (
          <div className="apollo-message apollo-message-ai">
            <img src={aiAvatar} alt="AI" className="apollo-message-avatar" />
            <div className="apollo-message-content apollo-message-streaming">
              {streamedResponse}
            </div>
          </div>
        )}
      </div>
      
      {/* Follow-up input - always visible */}
      <div className="apollo-followup-container">
        <div className="apollo-followup-input-wrapper">
          <TextInput
            value={followUpValue}
            onChange={(e, val) => setFollowUpValue(val)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isLoading) {
                e.preventDefault();
                onFollowUpSubmit();
              }
            }}
            placeholder={isLoading ? 'Waiting for response...' : 'Ask a follow-up question...'}
            aria-label="Follow-up question"
            className="apollo-followup-input"
          />
          <button
            className="apollo-followup-mic-button"
            onClick={onMicrophoneClick}
            aria-label={isRecording ? 'Stop recording' : 'Use voice input'}
            title={isRecording ? 'Stop recording' : 'Use voice input'}
          >
            {isRecording ? (
              <div className="apollo-followup-waveform">
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
              </div>
            ) : (
              <MicrophoneIcon />
            )}
          </button>
        </div>
        <Button 
          variant="primary" 
          onClick={onFollowUpSubmit}
          isDisabled={!followUpValue.trim() || isLoading}
          className="apollo-followup-button"
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default FloatingConversationPanel;
