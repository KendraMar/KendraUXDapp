import React, { useState, useRef, useEffect } from 'react';
import { Nav } from '@patternfly/react-core';
import {
  TimesIcon,
  PlusCircleIcon,
  CheckIcon
} from '@patternfly/react-icons';
import { DragDropSort } from '@patternfly/react-drag-drop';
import { Button } from '@patternfly/react-core';
import { getIcon, generateCustomPageId } from '../constants';

const NavigationCustomizer = ({
  navItems,
  availableItems,
  editingSectionId,
  editingSectionTitle,
  onRemoveItem,
  onAddItem,
  onAddSection,
  onAddCustomPage,
  onRemoveSection,
  onStartEditingSection,
  onFinishEditingSection,
  onCancelEditingSection,
  onSectionTitleChange,
  onDrop
}) => {
  // Add page state
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageIcon, setNewPageIcon] = useState('emoji:➕');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  
  const pageInputRef = useRef(null);
  const iconPickerRef = useRef(null);
  const suggestionPanelRef = useRef(null);

  // Focus input when adding page
  useEffect(() => {
    if (isAddingPage && pageInputRef.current) {
      pageInputRef.current.focus();
    }
  }, [isAddingPage]);

  // Close icon picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target)) {
        setShowIconPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter suggestions based on input
  useEffect(() => {
    if (isAddingPage) {
      const search = newPageName.toLowerCase().trim();
      if (search) {
        const filtered = availableItems.filter(item =>
          item.displayName.toLowerCase().includes(search)
        );
        setFilteredSuggestions(filtered);
      } else {
        setFilteredSuggestions(availableItems);
      }
    }
  }, [newPageName, isAddingPage, availableItems]);

  const handleFinishEditing = () => {
    if (editingSectionId && editingSectionTitle.trim()) {
      onFinishEditingSection(editingSectionId, editingSectionTitle);
    } else if (editingSectionId) {
      const section = navItems.find(item => item.id === editingSectionId);
      if (section && !section.title) {
        onRemoveSection(editingSectionId);
      }
      onCancelEditingSection();
    }
  };

  const startAddingPage = () => {
    setIsAddingPage(true);
    setNewPageName('');
    setNewPageIcon('emoji:➕');
    setShowIconPicker(false);
  };

  const cancelAddingPage = () => {
    setIsAddingPage(false);
    setNewPageName('');
    setNewPageIcon('emoji:➕');
    setShowIconPicker(false);
  };

  const saveCustomPage = () => {
    if (!newPageName.trim()) return;

    const pageId = generateCustomPageId();
    const customPage = {
      id: pageId,
      path: `/page/${pageId}`,
      displayName: newPageName.trim(),
      icon: newPageIcon === 'emoji:➕' ? 'emoji:📄' : newPageIcon,
      isCustom: true
    };

    if (onAddCustomPage) {
      onAddCustomPage(customPage);
    }
    cancelAddingPage();
  };

  const selectSuggestion = (item) => {
    onAddItem(item);
    cancelAddingPage();
  };

  const selectIcon = (emoji) => {
    setNewPageIcon(`emoji:${emoji}`);
    setShowIconPicker(false);
  };

  // Extended emoji options for icon picker
  const pageEmojiOptions = [
    '📄', '📝', '📊', '📈', '📋', '📌',
    '🎯', '🚀', '💡', '⚡', '🔧', '🎨',
    '📁', '🏠', '🔬', '💼', '📦', '🗂️',
    '🌟', '🔥', '💬', '📡', '🛡️', '🎪',
    '🧩', '🎲', '📐', '🔑', '🏷️', '📎'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Active items with drag-drop and remove buttons */}
      <Nav aria-label="Nav">
        <DragDropSort
          items={navItems.map((item) => ({
            id: item.id,
            content: item.type === 'section' ? (
              <div className="apollo-nav-customize-section">
                <div className="apollo-nav-customize-section-content">
                  {editingSectionId === item.id ? (
                    <input
                      type="text"
                      value={editingSectionTitle}
                      onChange={(e) => {
                        if (onSectionTitleChange) {
                          onSectionTitleChange(e.target.value);
                        }
                      }}
                      onBlur={handleFinishEditing}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleFinishEditing();
                        } else if (e.key === 'Escape') {
                          onCancelEditingSection();
                        }
                      }}
                      autoFocus
                      placeholder="Section name"
                      aria-label="Section title"
                      className="apollo-nav-section-title-input"
                    />
                  ) : (
                    <span 
                      className="apollo-nav-section-title"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartEditingSection(item);
                      }}
                    >
                      {item.title}
                    </span>
                  )}
                </div>
                <div className="apollo-nav-customize-section-actions">
                  <Button
                    variant="plain"
                    className="apollo-nav-customize-remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSection(item.id);
                    }}
                    aria-label={`Remove ${item.title}`}
                  >
                    <TimesIcon />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="apollo-nav-customize-item">
                <div className="apollo-nav-customize-item-content">
                  {getIcon(item.icon)}
                  <span>{item.customLabel || item.displayName}</span>
                </div>
                <Button
                  variant="plain"
                  className="apollo-nav-customize-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  aria-label={`Remove ${item.customLabel || item.displayName}`}
                >
                  <TimesIcon />
                </Button>
              </div>
            )
          }))}
          onDrop={onDrop}
          variant="DataList"
        />
      </Nav>

      {/* Inline add page row - shown when isAddingPage */}
      {isAddingPage && (
        <div className="apollo-nav-add-page-row">
          <div className="apollo-nav-add-page-row-inner">
            {/* Icon button - click to pick emoji */}
            <div className="apollo-nav-add-page-icon-wrapper" ref={iconPickerRef}>
              <button
                className="apollo-nav-add-page-icon-btn"
                onClick={() => setShowIconPicker(!showIconPicker)}
                aria-label="Choose page icon"
                title="Choose an icon"
              >
                {getIcon(newPageIcon)}
              </button>

              {/* Icon picker popover */}
              {showIconPicker && (
                <div className="apollo-nav-icon-picker">
                  <div className="apollo-nav-icon-picker-grid">
                    {pageEmojiOptions.map((emoji) => (
                      <button
                        key={emoji}
                        className={`apollo-nav-icon-picker-item ${newPageIcon === `emoji:${emoji}` ? 'selected' : ''}`}
                        onClick={() => selectIcon(emoji)}
                        aria-label={`Select ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Page name input */}
            <input
              ref={pageInputRef}
              type="text"
              value={newPageName}
              onChange={(e) => setNewPageName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveCustomPage();
                } else if (e.key === 'Escape') {
                  cancelAddingPage();
                }
              }}
              placeholder="Page name..."
              aria-label="Page name"
              className="apollo-nav-add-page-input"
            />

            {/* Save / Cancel buttons */}
            <div className="apollo-nav-add-page-actions">
              {newPageName.trim() && (
                <Button
                  variant="plain"
                  className="apollo-nav-add-page-save-btn"
                  onClick={saveCustomPage}
                  aria-label="Save page"
                >
                  <CheckIcon />
                </Button>
              )}
              <Button
                variant="plain"
                className="apollo-nav-add-page-cancel-btn"
                onClick={cancelAddingPage}
                aria-label="Cancel"
              >
                <TimesIcon />
              </Button>
            </div>
          </div>

          {/* Suggestion panel - slides in below the input */}
          {(filteredSuggestions.length > 0) && (
            <div className="apollo-nav-suggestion-panel" ref={suggestionPanelRef}>
              <div className="apollo-nav-suggestion-header">
                <span>Available pages</span>
              </div>
              <div className="apollo-nav-suggestion-list">
                {filteredSuggestions.map((item) => (
                  <div
                    key={item.id}
                    className="apollo-nav-suggestion-item"
                    onClick={() => selectSuggestion(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        selectSuggestion(item);
                      }
                    }}
                  >
                    <div className="apollo-nav-suggestion-item-content">
                      {getIcon(item.icon)}
                      <span>{item.displayName}</span>
                    </div>
                    <PlusCircleIcon className="apollo-nav-suggestion-add-icon" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Add Page + Add Section Buttons */}
      <div className="apollo-nav-add-actions">
        {!isAddingPage && (
          <Button
            variant="link"
            icon={<PlusCircleIcon />}
            onClick={startAddingPage}
            isSmall
          >
            Add page
          </Button>
        )}
        <Button
          variant="link"
          icon={<PlusCircleIcon />}
          onClick={() => onAddSection('')}
          isSmall
        >
          Add section
        </Button>
      </div>
    </div>
  );
};

export default NavigationCustomizer;
