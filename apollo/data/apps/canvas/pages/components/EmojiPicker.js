import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EMOJI_CATEGORIES } from '../canvasConstants';

const RECENT_EMOJIS_KEY = 'apollo-canvas-recent-emojis';
const MAX_RECENT = 16;

const getRecentEmojis = () => {
  try {
    const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentEmoji = (emoji) => {
  try {
    const recent = getRecentEmojis().filter(e => e !== emoji);
    recent.unshift(emoji);
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // ignore localStorage errors
  }
};

const EmojiPicker = ({ position, onSelect, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('smileys');
  const pickerRef = useRef(null);
  const searchRef = useRef(null);
  const recentEmojis = getRecentEmojis();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose();
      }
    };
    // Delay adding listener to prevent immediate close from the same click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onClose]);

  // Focus search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const handleEmojiClick = useCallback((emoji) => {
    saveRecentEmoji(emoji);
    onSelect(emoji);
  }, [onSelect]);

  // Build categories with recent emojis populated
  const categories = EMOJI_CATEGORIES.map(cat => {
    if (cat.id === 'recent') {
      return {
        ...cat,
        emojis: recentEmojis.map(e => ({ emoji: e, keywords: [] }))
      };
    }
    return cat;
  }).filter(cat => cat.id !== 'recent' || cat.emojis.length > 0);

  // Filter by search
  const searchLower = search.toLowerCase().trim();
  const filteredCategories = searchLower
    ? categories
        .map(cat => ({
          ...cat,
          emojis: cat.emojis.filter(e =>
            e.emoji.includes(searchLower) ||
            e.keywords.some(k => k.includes(searchLower))
          )
        }))
        .filter(cat => cat.emojis.length > 0)
    : categories;

  // Compute position - try to stay in viewport
  const style = {
    position: 'fixed',
    left: position?.x ?? 0,
    top: position?.y ?? 0,
    zIndex: 10000
  };

  return (
    <div
      ref={pickerRef}
      style={style}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        style={{
          width: '280px',
          maxHeight: '340px',
          background: '#2a2a2a',
          border: '1px solid #444',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Search */}
        <div style={{ padding: '8px 8px 4px' }}>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search emoji..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              background: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: '6px',
              color: '#e0e0e0',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => { e.target.style.borderColor = '#0066cc'; }}
            onBlur={(e) => { e.target.style.borderColor = '#444'; }}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </div>

        {/* Category tabs */}
        {!searchLower && (
          <div
            style={{
              display: 'flex',
              gap: '2px',
              padding: '4px 8px',
              borderBottom: '1px solid #333',
              overflowX: 'auto'
            }}
          >
            {categories.map(cat => (
              <button
                key={cat.id}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  background: activeCategory === cat.id ? '#0066cc' : 'transparent',
                  color: activeCategory === cat.id ? '#fff' : '#888',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                  flexShrink: 0
                }}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Emoji grid */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '6px 8px'
          }}
        >
          {filteredCategories.map(cat => {
            // When not searching, only show active category (and always show recent)
            if (!searchLower && cat.id !== activeCategory && cat.id !== 'recent') {
              return null;
            }

            return (
              <div key={cat.id} style={{ marginBottom: '8px' }}>
                <div style={{
                  fontSize: '11px',
                  color: '#666',
                  fontWeight: 600,
                  marginBottom: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {cat.name}
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: '2px'
                }}>
                  {cat.emojis.map((item, idx) => (
                    <button
                      key={`${cat.id}-${idx}`}
                      style={{
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        outline: 'none',
                        padding: 0,
                        lineHeight: 1
                      }}
                      onClick={() => handleEmojiClick(item.emoji)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#444';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                      title={item.keywords.join(', ')}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredCategories.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              color: '#666',
              fontSize: '13px'
            }}>
              No emoji found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
