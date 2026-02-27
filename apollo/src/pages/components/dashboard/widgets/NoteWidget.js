import React, { useState, useEffect, useCallback } from 'react';
import { TextArea } from '@patternfly/react-core';

/**
 * NoteWidget - Editable text/markdown note card
 * 
 * Stores content in the widget config via onConfigChange callback.
 * Data shape (stored in widget config):
 * {
 *   content: string
 * }
 */
const NoteWidget = ({ data, config, onConfigChange }) => {
  const [content, setContent] = useState(config?.content || data?.content || '');

  useEffect(() => {
    if (config?.content !== undefined && config.content !== content) {
      setContent(config.content);
    }
  }, [config?.content]);

  const handleChange = useCallback((event, value) => {
    setContent(value);
    if (onConfigChange) {
      onConfigChange({ ...config, content: value });
    }
  }, [config, onConfigChange]);

  return (
    <div className="dashboard-note-widget" style={{ height: '100%', padding: '0.5rem' }}>
      <TextArea
        value={content}
        onChange={handleChange}
        aria-label="Note content"
        placeholder="Type your notes here..."
        style={{
          width: '100%',
          height: '100%',
          resize: 'none',
          border: 'none',
          outline: 'none',
          backgroundColor: 'transparent',
          fontFamily: 'inherit',
          fontSize: '0.875rem',
          lineHeight: 1.6
        }}
      />
    </div>
  );
};

export default NoteWidget;
