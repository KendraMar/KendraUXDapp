import React from 'react';
import {
  Form,
  FormGroup,
  FormSection,
  Switch,
  Slider,
  Title
} from '@patternfly/react-core';
import ContentTypes from './ContentTypes';
import TopicWeights from './TopicWeights';

const PreferencesTab = ({
  publicProfile,
  setPublicProfile,
  showEmail,
  setShowEmail,
  showActivity,
  setShowActivity,
  contentTypes,
  handleContentTypeChange,
  topicWeights,
  handleTopicWeightChange,
  freshnessPreference,
  setFreshnessPreference,
  diversityScore,
  setDiversityScore,
  engagementWeight,
  setEngagementWeight
}) => {
  return (
    <Form>
      <Title headingLevel="h2" size="xl" style={{ marginBottom: '1.5rem' }}>
        Preferences
      </Title>
      
      {/* Public-facing Preferences Section */}
      <FormSection 
        title="Public-facing Preferences" 
        titleElement="h3"
        style={{ marginBottom: '2rem' }}
      >
        <FormGroup label="Profile visibility" fieldId="public-profile">
          <Switch
            id="public-profile"
            label="Public profile"
            isChecked={publicProfile}
            onChange={(_event, checked) => setPublicProfile(checked)}
          />
        </FormGroup>
        <FormGroup label="Contact information" fieldId="show-email">
          <Switch
            id="show-email"
            label="Show email address"
            isChecked={showEmail}
            onChange={(_event, checked) => setShowEmail(checked)}
          />
        </FormGroup>
        <FormGroup label="Activity visibility" fieldId="show-activity">
          <Switch
            id="show-activity"
            label="Show activity feed"
            isChecked={showActivity}
            onChange={(_event, checked) => setShowActivity(checked)}
          />
        </FormGroup>
      </FormSection>
      
      {/* Private Preferences Section - Algorithm */}
      <FormSection 
        title="Private Preferences - Content Algorithm" 
        titleElement="h3"
      >
        <p style={{ 
          marginBottom: '1.5rem', 
          color: 'var(--pf-v6-global--Color--200)',
          fontSize: '0.875rem'
        }}>
          Customize what appears in your feed and throughout the application. 
          These settings are private and only visible to you.
        </p>
        
        <ContentTypes contentTypes={contentTypes} onChange={handleContentTypeChange} />
        
        <TopicWeights topicWeights={topicWeights} onChange={handleTopicWeightChange} />
        
        {/* Algorithm Tuning */}
        <FormGroup 
          label="Algorithm Tuning" 
          fieldId="algorithm-tuning"
        >
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>
              Content Freshness ({freshnessPreference}%)
            </label>
            <p style={{ 
              fontSize: '0.75rem', 
              color: 'var(--pf-v6-global--Color--200)',
              marginBottom: '0.5rem'
            }}>
              Higher values prioritize newer content
            </p>
            <Slider
              value={freshnessPreference}
              onChange={(_event, value) => setFreshnessPreference(value)}
              min={0}
              max={100}
              step={5}
              showBoundaries={false}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>
              Content Diversity ({diversityScore}%)
            </label>
            <p style={{ 
              fontSize: '0.75rem', 
              color: 'var(--pf-v6-global--Color--200)',
              marginBottom: '0.5rem'
            }}>
              Higher values show more varied content sources
            </p>
            <Slider
              value={diversityScore}
              onChange={(_event, value) => setDiversityScore(value)}
              min={0}
              max={100}
              step={5}
              showBoundaries={false}
            />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: 500
            }}>
              Engagement Weight ({engagementWeight}%)
            </label>
            <p style={{ 
              fontSize: '0.75rem', 
              color: 'var(--pf-v6-global--Color--200)',
              marginBottom: '0.5rem'
            }}>
              Higher values prioritize popular/trending content
            </p>
            <Slider
              value={engagementWeight}
              onChange={(_event, value) => setEngagementWeight(value)}
              min={0}
              max={100}
              step={5}
              showBoundaries={false}
            />
          </div>
        </FormGroup>
      </FormSection>
    </Form>
  );
};

export default PreferencesTab;
