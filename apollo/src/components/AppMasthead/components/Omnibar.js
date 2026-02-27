import React from 'react';
import { TimesIcon, MicrophoneIcon, PaperclipIcon, PencilAltIcon } from '@patternfly/react-icons';
import { iconMap } from '../../AppSidebar/constants';
import { formatKeyCombination, IS_MAC } from '../../../lib/keyboardShortcuts';

const SEARCH_SUGGESTIONS = [
  { icon: '🚀', text: 'Create a new project roadmap' },
  { icon: '📊', text: 'Show me analytics dashboard' },
  { icon: '📝', text: 'Draft meeting notes from last sync' },
  { icon: '🔍', text: 'Find all tasks assigned to me' },
  { icon: '💡', text: 'Generate ideas for user onboarding' }
];
// Render an icon from the PatternFly iconMap, falling back to text/emoji
const renderAppIcon = (iconName) => {
  const IconComponent = iconMap[iconName];
  if (IconComponent) {
    return <IconComponent style={{ fontSize: '1rem' }} />;
  }
  return iconName;
};

const Omnibar = ({
  searchWrapperRef,
  customSearchInputRef,
  searchSegments,
  currentText,
  hasSearchContent,
  dynamicPlaceholder,
  showMentionDropdown,
  filteredMentionItems,
  mentionSelectedIndex,
  mentionDropdownRef,
  mentionDropdownLabel,
  mentionTrigger,
  mentionFilter,
  showAppDropdown,
  filteredAppItems,
  appSelectedIndex,
  appDropdownLabel,
  appTrigger,
  appFilter,
  showNavDropdown,
  filteredNavItems,
  navSelectedIndex,
  navDropdownLabel,
  navTrigger,
  navFilter,
  showSuggestions,
  showConversation,
  isRecording,
  speechStatus,
  speechStatusMessage,
  onSearchChange,
  onSearchFocus,
  onSearchClear,
  onSearchSubmit,
  onRemoveChip,
  onRemoveTextSegment,
  onMentionSelect,
  setMentionSelectedIndex,
  setShowMentionDropdown,
  setMentionFilter,
  setMentionStartIndex,
  onAppSelect,
  setAppSelectedIndex,
  setShowAppDropdown,
  setAppFilter,
  setAppStartIndex,
  onNavSelect,
  setNavSelectedIndex,
  setShowNavDropdown,
  setNavFilter,
  setNavStartIndex,
  onSuggestionClick,
  onMicrophoneClick,
  onAnnotateClick,
  onEscape,
  assistantSelector
}) => {
  return (
    <div className="masthead-search-wrapper" ref={searchWrapperRef}>
      {/* Assistant selector — rendered inside wrapper so absolute positioning anchors here */}
      {assistantSelector}
      {/* Custom inline search input with chips */}
      <div className="masthead-custom-search-input">
        {/* Dynamic placeholder overlay — fades contextual text */}
        {!hasSearchContent && (
          <div className="masthead-placeholder-overlay">
            <span className={`masthead-placeholder-text ${dynamicPlaceholder.visible ? 'placeholder-visible' : 'placeholder-hidden'}`}>
              {dynamicPlaceholder.text}
            </span>
          </div>
        )}
        <div className="masthead-search-content">
          {searchSegments.map((segment) => {
            if (segment.type === 'text') {
              return <span key={`text-${Math.random()}`}>{segment.content}</span>;
            } else {
              // Chip
              return (
                <span key={segment.id} className="masthead-inline-chip">
                  {segment.itemType === 'person' ? (
                    <span 
                      className="masthead-chip-avatar masthead-chip-person-avatar"
                      style={{ backgroundColor: segment.color }}
                    >
                      {segment.initials}
                    </span>
                  ) : segment.itemType === 'agent' ? (
                    <img 
                      src={segment.avatar} 
                      alt={segment.name} 
                      className="masthead-chip-avatar"
                    />
                  ) : (
                    <span className="masthead-chip-icon">{renderAppIcon(segment.icon)}</span>
                  )}
                  <span className="masthead-chip-name">{segment.name}</span>
                  <button
                    className="masthead-chip-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveChip(segment.id);
                    }}
                    aria-label={`Remove ${segment.name}`}
                  >
                    <TimesIcon />
                  </button>
                </span>
              );
            }
          })}
          <input
            ref={customSearchInputRef}
            type="text"
            className="masthead-inline-text-input"
            placeholder=""
            value={currentText}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={onSearchFocus}
            onKeyDown={(e) => {
              // Handle [[ navigation dropdown keyboard navigation
              if (showNavDropdown && filteredNavItems.length > 0) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setNavSelectedIndex(prev => prev < filteredNavItems.length - 1 ? prev + 1 : 0);
                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setNavSelectedIndex(prev => prev > 0 ? prev - 1 : filteredNavItems.length - 1);
                  return;
                }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onNavSelect(filteredNavItems[navSelectedIndex]);
                  return;
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setShowNavDropdown(false);
                  setNavFilter('');
                  setNavStartIndex(-1);
                  return;
                }
                if (e.key === 'Tab') {
                  e.preventDefault();
                  onNavSelect(filteredNavItems[navSelectedIndex]);
                  return;
                }
              }
              
              // Handle mention dropdown keyboard navigation
              if (showMentionDropdown && filteredMentionItems.length > 0) {
                console.log('Key pressed in mention dropdown:', e.key, 'Current index:', mentionSelectedIndex, 'Items:', filteredMentionItems.length);
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setMentionSelectedIndex(prev => {
                    const newIndex = prev < filteredMentionItems.length - 1 ? prev + 1 : 0;
                    console.log('Arrow down: moving from', prev, 'to', newIndex);
                    return newIndex;
                  });
                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setMentionSelectedIndex(prev => {
                    const newIndex = prev > 0 ? prev - 1 : filteredMentionItems.length - 1;
                    console.log('Arrow up: moving from', prev, 'to', newIndex);
                    return newIndex;
                  });
                  return;
                }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  console.log('Enter pressed, selecting item at index:', mentionSelectedIndex);
                  onMentionSelect(filteredMentionItems[mentionSelectedIndex]);
                  return;
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setShowMentionDropdown(false);
                  setMentionFilter('');
                  setMentionStartIndex(-1);
                  return;
                }
                if (e.key === 'Tab') {
                  e.preventDefault();
                  onMentionSelect(filteredMentionItems[mentionSelectedIndex]);
                  return;
                }
              }
              
              // Handle app dropdown keyboard navigation
              if (showAppDropdown && filteredAppItems.length > 0) {
                console.log('Key pressed in app dropdown:', e.key, 'Current index:', appSelectedIndex, 'Items:', filteredAppItems.length);
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setAppSelectedIndex(prev => {
                    const newIndex = prev < filteredAppItems.length - 1 ? prev + 1 : 0;
                    console.log('Arrow down: moving from', prev, 'to', newIndex);
                    return newIndex;
                  });
                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setAppSelectedIndex(prev => {
                    const newIndex = prev > 0 ? prev - 1 : filteredAppItems.length - 1;
                    console.log('Arrow up: moving from', prev, 'to', newIndex);
                    return newIndex;
                  });
                  return;
                }
                if (e.key === 'Enter') {
                  e.preventDefault();
                  console.log('Enter pressed, selecting app at index:', appSelectedIndex);
                  onAppSelect(filteredAppItems[appSelectedIndex]);
                  return;
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setShowAppDropdown(false);
                  setAppFilter('');
                  setAppStartIndex(-1);
                  return;
                }
                if (e.key === 'Tab') {
                  e.preventDefault();
                  onAppSelect(filteredAppItems[appSelectedIndex]);
                  return;
                }
              }
              
              // Handle backspace on empty input - remove last segment
              if (e.key === 'Backspace' && !currentText && searchSegments.length > 0) {
                e.preventDefault();
                const lastSegment = searchSegments[searchSegments.length - 1];
                if (lastSegment.type === 'chip') {
                  onRemoveChip(lastSegment.id);
                } else {
                  onRemoveTextSegment();
                }
                return;
              }
              
              // Escape with no dropdown open — blur the Omnibar and close suggestions
              if (e.key === 'Escape') {
                e.preventDefault();
                e.target.blur();
                if (onEscape) onEscape();
                return;
              }

              if (e.key === 'Enter') {
                e.preventDefault();
                onSearchSubmit();
              }
            }}
            aria-label="Global search"
          />
        </div>
        {(searchSegments.length > 0 || currentText) && (
          <button
            className="masthead-search-clear"
            onClick={onSearchClear}
            aria-label="Clear search"
          >
            <TimesIcon />
          </button>
        )}
      </div>
      
      {/* Mention Dropdown */}
      {showMentionDropdown && filteredMentionItems.length > 0 && (
        <div 
          ref={mentionDropdownRef}
          className="mention-dropdown"
        >
          <div className="mention-dropdown-header">
            <span>{mentionDropdownLabel}</span>
          </div>
          <div className="mention-dropdown-list">
            {filteredMentionItems.map((item, index) => (
              <button
                key={item.id}
                className={`mention-dropdown-item ${index === mentionSelectedIndex ? 'mention-dropdown-item-selected' : ''}`}
                onClick={() => onMentionSelect(item)}
                onMouseEnter={() => setMentionSelectedIndex(index)}
              >
                {item.type === 'person' ? (
                  <span 
                    className="mention-item-avatar mention-person-avatar"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.initials}
                  </span>
                ) : (
                  <img 
                    src={item.avatar} 
                    alt={item.name} 
                    className="mention-item-avatar"
                  />
                )}
                <div className="mention-item-info">
                  <span className="mention-item-name">{item.name}</span>
                  <span className="mention-item-description">{item.description}</span>
                </div>
                <span className="mention-item-type">
                  {item.type === 'person' ? 'Person' : 'Agent'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {showMentionDropdown && filteredMentionItems.length === 0 && mentionFilter && (
        <div className="mention-dropdown">
          <div className="mention-dropdown-empty">
            No matches for &ldquo;{mentionTrigger}{mentionFilter}&rdquo;
          </div>
        </div>
      )}
      
      {/* App Dropdown */}
      {showAppDropdown && filteredAppItems.length > 0 && (
        <div className="mention-dropdown">
          <div className="mention-dropdown-header">
            <span>{appDropdownLabel}</span>
          </div>
          <div className="mention-dropdown-list">
            {filteredAppItems.map((app, index) => (
              <button
                key={app.id}
                className={`mention-dropdown-item ${index === appSelectedIndex ? 'mention-dropdown-item-selected' : ''}`}
                onClick={() => onAppSelect(app)}
                onMouseEnter={() => setAppSelectedIndex(index)}
              >
                <span className="mention-item-icon">{renderAppIcon(app.icon)}</span>
                <div className="mention-item-info">
                  <span className="mention-item-name">{app.name}</span>
                  <span className="mention-item-description">{app.type}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {showAppDropdown && filteredAppItems.length === 0 && appFilter && (
        <div className="mention-dropdown">
          <div className="mention-dropdown-empty">
            No matches for &ldquo;{appTrigger}{appFilter}&rdquo;
          </div>
        </div>
      )}
      
      {/* Navigation Dropdown */}
      {showNavDropdown && filteredNavItems.length > 0 && (
        <div className="mention-dropdown nav-dropdown">
          <div className="mention-dropdown-header">
            <span>{navDropdownLabel}</span>
            <span className="nav-dropdown-hint">
              <kbd>Enter</kbd> to go &middot; <kbd>Esc</kbd> to cancel
            </span>
          </div>
          <div className="mention-dropdown-list">
            {filteredNavItems.map((app, index) => (
              <button
                key={app.id}
                className={`mention-dropdown-item ${index === navSelectedIndex ? 'mention-dropdown-item-selected' : ''}`}
                onClick={() => onNavSelect(app)}
                onMouseEnter={() => setNavSelectedIndex(index)}
              >
                <span className="mention-item-icon">{renderAppIcon(app.icon)}</span>
                <div className="mention-item-info">
                  <span className="mention-item-name">{app.name}</span>
                  <span className="mention-item-description">{app.path}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {showNavDropdown && filteredNavItems.length === 0 && navFilter && (
        <div className="mention-dropdown nav-dropdown">
          <div className="mention-dropdown-empty">
            No pages matching "{navFilter}"
          </div>
        </div>
      )}
      
      <button
        className={`masthead-mic-button${isRecording ? ' recording' : ''}${speechStatus === 'starting' ? ' starting' : ''}`}
        onClick={onMicrophoneClick}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
        title={speechStatus === 'starting' ? speechStatusMessage : undefined}
      >
        {isRecording && speechStatus === 'listening' ? (
          <div className="masthead-waveform">
            <span className="wave-bar"></span>
            <span className="wave-bar"></span>
            <span className="wave-bar"></span>
            <span className="wave-bar"></span>
            <span className="wave-bar"></span>
          </div>
        ) : isRecording && speechStatus === 'starting' ? (
          <div className="masthead-mic-starting">
            <MicrophoneIcon className="mic-pulse" />
          </div>
        ) : (
          <MicrophoneIcon />
        )}
      </button>
      {/* Status text shown while speech model is starting */}
      {isRecording && speechStatus === 'starting' && speechStatusMessage && (
        <span className="masthead-speech-status">{speechStatusMessage}</span>
      )}
      <button
        className="masthead-attach-button"
        onClick={() => {}}
        aria-label="Attach file"
      >
        <PaperclipIcon />
      </button>
      <button
        className="masthead-annotate-button"
        onClick={onAnnotateClick}
        aria-label="Annotate screen"
        title="Annotate screen"
      >
        <PencilAltIcon />
      </button>
      
      {/* Suggestions Panel — two-column: commands tutorial + quick suggestions */}
      {showSuggestions && !showConversation && (
        <div className="apollo-suggestions-panel">
          <div className="apollo-suggestions-columns">
            {/* Left column: Commands tutorial */}
            <div className="apollo-suggestions-col apollo-suggestions-commands">
              <div className="apollo-suggestions-col-header">
                <span className="apollo-suggestions-title">Commands</span>
              </div>
              <div className="apollo-suggestions-col-body">
                {mentionTrigger && (
                  <div className="apollo-command-row" style={{ animationDelay: '0ms' }}>
                    <kbd className="apollo-command-key">{mentionTrigger}</kbd>
                    <div className="apollo-command-info">
                      <span className="apollo-command-label">Tag a person or agent</span>
                      <span className="apollo-command-desc">Mention teammates or AI assistants</span>
                    </div>
                  </div>
                )}
                {appTrigger && (
                  <div className="apollo-command-row" style={{ animationDelay: '40ms' }}>
                    <kbd className="apollo-command-key">{appTrigger}</kbd>
                    <div className="apollo-command-info">
                      <span className="apollo-command-label">Reference an app or page</span>
                      <span className="apollo-command-desc">Scope your query to a specific app</span>
                    </div>
                  </div>
                )}
                {navTrigger && (
                  <div className="apollo-command-row" style={{ animationDelay: '80ms' }}>
                    <kbd className="apollo-command-key">{navTrigger}</kbd>
                    <div className="apollo-command-info">
                      <span className="apollo-command-label">Quick navigate</span>
                      <span className="apollo-command-desc">Jump to any page instantly</span>
                    </div>
                  </div>
                )}
                <div className="apollo-command-divider" />
                <div className="apollo-command-row" style={{ animationDelay: '120ms' }}>
                  <kbd className="apollo-command-key apollo-command-key-combo">{IS_MAC ? '⌘' : 'Ctrl'}+P</kbd>
                  <div className="apollo-command-info">
                    <span className="apollo-command-label">Focus Omnibar</span>
                    <span className="apollo-command-desc">Open from anywhere with a shortcut</span>
                  </div>
                </div>
                <div className="apollo-command-row" style={{ animationDelay: '160ms' }}>
                  <kbd className="apollo-command-key apollo-command-key-icon"><MicrophoneIcon /></kbd>
                  <div className="apollo-command-info">
                    <span className="apollo-command-label">Voice input</span>
                    <span className="apollo-command-desc">Speak your query using the mic button</span>
                  </div>
                </div>
                <div className="apollo-command-row" style={{ animationDelay: '200ms' }}>
                  <kbd className="apollo-command-key apollo-command-key-icon"><PencilAltIcon /></kbd>
                  <div className="apollo-command-info">
                    <span className="apollo-command-label">Annotate screen</span>
                    <span className="apollo-command-desc">Capture and mark up your screen</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Right column: Suggestions */}
            <div className="apollo-suggestions-col apollo-suggestions-quickstart">
              <div className="apollo-suggestions-col-header">
                <span className="apollo-suggestions-title">Try asking</span>
              </div>
              <div className="apollo-suggestions-col-body">
                {SEARCH_SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    className="apollo-suggestion-item"
                    onClick={() => onSuggestionClick(suggestion)}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <span className="apollo-suggestion-icon">{suggestion.icon}</span>
                    <span className="apollo-suggestion-text">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Omnibar;
