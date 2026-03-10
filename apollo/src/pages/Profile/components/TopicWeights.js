import React from 'react';
import {
  FormGroup,
  Slider
} from '@patternfly/react-core';

const TopicWeights = ({ topicWeights, onChange }) => {
  const topics = [
    { key: 'technology', label: 'Technology' },
    { key: 'business', label: 'Business' },
    { key: 'science', label: 'Science' },
    { key: 'arts', label: 'Arts & Culture' },
    { key: 'sports', label: 'Sports' }
  ];

  return (
    <FormGroup 
      label="Topic Interest Weights" 
      fieldId="topic-weights"
      style={{ marginBottom: '1.5rem' }}
    >
      {topics.map(topic => (
        <div key={topic.key} style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem',
            fontWeight: 500
          }}>
            {topic.label} ({topicWeights[topic.key]}%)
          </label>
          <Slider
            value={topicWeights[topic.key]}
            onChange={(_event, value) => onChange(topic.key, value)}
            min={0}
            max={100}
            step={5}
            showBoundaries={false}
          />
        </div>
      ))}
    </FormGroup>
  );
};

export default TopicWeights;
