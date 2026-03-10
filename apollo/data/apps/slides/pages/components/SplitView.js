import React, { useRef } from 'react';
import { Split, SplitItem } from '@patternfly/react-core';
import MarkdownEditor from './MarkdownEditor';

const SplitView = ({ markdown, onMarkdownChange, stackedPreviewHtml, slideDeckTitle }) => {
  const splitIframeRef = useRef(null);

  return (
    <Split style={{ height: '100%' }}>
      <SplitItem style={{ width: '50%', height: '100%', borderRight: '1px solid #333' }}>
        <MarkdownEditor 
          markdown={markdown} 
          onChange={onMarkdownChange}
          isSplitView={true}
        />
      </SplitItem>
      <SplitItem style={{ width: '50%', height: '100%' }}>
        <div style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <iframe
            ref={splitIframeRef}
            srcDoc={stackedPreviewHtml}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}
            title={`${slideDeckTitle || 'Presentation'} - Live Preview`}
          />
        </div>
      </SplitItem>
    </Split>
  );
};

export default SplitView;
