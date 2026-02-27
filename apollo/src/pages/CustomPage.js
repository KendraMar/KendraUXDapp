import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  PageSection,
  TextArea
} from '@patternfly/react-core';
import { PlusCircleIcon, MicrophoneIcon } from '@patternfly/react-icons';

const CustomPage = () => {
  const { pageId } = useParams();
  const [description, setDescription] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = useCallback(() => {
    if (description.trim()) {
      setIsSubmitted(true);
      // Future: Send to AI page builder
    }
  }, [description]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleMicrophoneClick = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

  if (isSubmitted) {
    return (
      <PageSection isFilled>
        <div className="custom-page-container">
          <div className="custom-page-submitted">
            <div className="custom-page-submitted-icon">✨</div>
            <h2 className="custom-page-submitted-title">Building your page...</h2>
            <p className="custom-page-submitted-description">
              We&apos;ll use your description to create a personalized page experience.
            </p>
            <p className="custom-page-submitted-detail">
              &ldquo;{description}&rdquo;
            </p>
          </div>
        </div>
      </PageSection>
    );
  }

  return (
    <PageSection isFilled>
      <div className="custom-page-container">
        <div className="custom-page-prompt">
          <div className="custom-page-icon">
            <PlusCircleIcon />
          </div>
          <h2 className="custom-page-title">
            Describe what this page should help you with
          </h2>
          <div className="custom-page-input-wrapper">
            <TextArea
              value={description}
              onChange={(e, val) => setDescription(val)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., A dashboard for tracking sprint progress and team velocity..."
              aria-label="Describe your page"
              className="custom-page-input"
              rows={3}
              resizeOrientation="vertical"
            />
            <button
              className={`custom-page-mic-button ${isRecording ? 'recording' : ''}`}
              onClick={handleMicrophoneClick}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? (
                <div className="custom-page-waveform">
                  <span className="wave-bar"></span>
                  <span className="wave-bar"></span>
                  <span className="wave-bar"></span>
                  <span className="wave-bar"></span>
                  <span className="wave-bar"></span>
                </div>
              ) : (
                <MicrophoneIcon />
              )}
            </button>
          </div>
          <p className="custom-page-hint">
            Press <kbd>Enter</kbd> to submit
          </p>
        </div>
      </div>
    </PageSection>
  );
};

export default CustomPage;
