import React, { useRef, useEffect } from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { RedoIcon, ExpandIcon, CompressIcon } from '@patternfly/react-icons';

const PreviewView = ({ slideDeckId, slideDeckTitle, isFullscreen, onToggleFullscreen }) => {
  const iframeRef = useRef(null);

  // Focus the iframe when preview tab is active so arrow keys work immediately
  useEffect(() => {
    if (iframeRef.current) {
      // Small delay to ensure iframe is rendered
      const timer = setTimeout(() => {
        iframeRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const refreshPreview = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <div style={{ 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <div style={{
        width: '100%',
        height: '100%',
        transition: 'all 0.3s ease'
      }}>
        <iframe
          ref={iframeRef}
          src={`/api/slides/${slideDeckId}/player`}
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          title={slideDeckTitle || 'Presentation'}
          tabIndex={0}
          onLoad={() => iframeRef.current?.focus()}
        />
      </div>
      <div style={{
        position: 'absolute',
        top: '0.5rem',
        right: '0.5rem',
        display: 'flex',
        gap: '0.5rem'
      }}>
        <Tooltip content="Refresh preview">
          <Button variant="plain" onClick={refreshPreview} style={{ color: '#fff' }}>
            <RedoIcon />
          </Button>
        </Tooltip>
        <Tooltip content={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
          <Button variant="plain" onClick={onToggleFullscreen} style={{ color: '#fff' }}>
            {isFullscreen ? <CompressIcon /> : <ExpandIcon />}
          </Button>
        </Tooltip>
      </div>
    </div>
  );
};

export default PreviewView;
