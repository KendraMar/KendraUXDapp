import React from 'react';

const MarkdownEditor = ({ markdown, onChange, isSplitView = false }) => {
  return (
    <div style={{ 
      height: '100%', 
      padding: '1rem',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <textarea
        value={markdown}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          flex: 1,
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
          fontSize: isSplitView ? '13px' : '14px',
          lineHeight: isSplitView ? '1.5' : '1.6',
          padding: '1rem',
          background: '#0d0d0d',
          color: '#e0e0e0',
          border: '1px solid #333',
          borderRadius: '4px',
          resize: 'none',
          boxSizing: 'border-box',
          outline: 'none'
        }}
        aria-label="Slide markdown editor"
      />
    </div>
  );
};

export default MarkdownEditor;
