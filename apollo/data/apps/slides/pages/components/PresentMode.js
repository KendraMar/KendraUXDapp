import React from 'react';
import { Button } from '@patternfly/react-core';
import { CompressIcon } from '@patternfly/react-icons';

const PresentMode = ({ slideDeckId, slideDeckTitle, onExit }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      background: '#000'
    }}>
      <iframe
        src={`/api/slides/${slideDeckId}/player`}
        style={{
          width: '100%',
          height: '100%',
          border: 'none'
        }}
        title={slideDeckTitle || 'Presentation'}
      />
      <Button
        variant="plain"
        onClick={onExit}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.5)',
          color: '#fff',
          zIndex: 10000
        }}
      >
        <CompressIcon /> Exit
      </Button>
    </div>
  );
};

export default PresentMode;
