import React from 'react';

const MetadataItem = ({ label, value }) => (
  <div style={{
    backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    border: '1px solid var(--pf-t--global--border--color--default)'
  }}>
    <div style={{ 
      color: 'var(--pf-t--global--text--color--subtle)', 
      fontSize: '0.75rem', 
      marginBottom: '0.25rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {label}
    </div>
    <div style={{ 
      fontSize: '0.875rem',
      wordBreak: 'break-word'
    }}>
      {value || '—'}
    </div>
  </div>
);

export default MetadataItem;
