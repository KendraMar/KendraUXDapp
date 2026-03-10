import React from 'react';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Grid,
  GridItem,
  Tabs,
  Tab,
  TabTitleText
} from '@patternfly/react-core';
import PersonalInfoTab from './components/PersonalInfoTab';
import PreferencesTab from './components/PreferencesTab';
import SecurityTab from './components/SecurityTab';
import NotificationsTab from './components/NotificationsTab';

const Profile = () => {
  const [activeTabKey, setActiveTabKey] = React.useState(0);
  
  // Profile tab state
  const [fullName, setFullName] = React.useState('John Doe');
  const [email, setEmail] = React.useState('john.doe@example.com');
  const [bio, setBio] = React.useState('');
  
  // Preferences tab state - Public
  const [publicProfile, setPublicProfile] = React.useState(true);
  const [showEmail, setShowEmail] = React.useState(false);
  const [showActivity, setShowActivity] = React.useState(true);
  
  // Preferences tab state - Private (Algorithm)
  const [contentTypes, setContentTypes] = React.useState({
    news: true,
    analysis: true,
    opinions: false,
    multimedia: true,
    research: true
  });
  
  const [topicWeights, setTopicWeights] = React.useState({
    technology: 80,
    business: 60,
    science: 70,
    arts: 40,
    sports: 20
  });
  
  const [freshnessPreference, setFreshnessPreference] = React.useState(70);
  const [diversityScore, setDiversityScore] = React.useState(50);
  const [engagementWeight, setEngagementWeight] = React.useState(60);

  const handleTabClick = (_event, tabIndex) => {
    setActiveTabKey(tabIndex);
  };

  const handleContentTypeChange = (type, checked) => {
    setContentTypes(prev => ({ ...prev, [type]: checked }));
  };

  const handleTopicWeightChange = (topic, value) => {
    setTopicWeights(prev => ({ ...prev, [topic]: value }));
  };

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1" size="2xl">
          Profile
        </Title>
      </PageSection>
      
      <PageSection isFilled>
        <Grid hasGutter span={12}>
          <GridItem span={3}>
            <Tabs
              activeKey={activeTabKey}
              onSelect={handleTabClick}
              isVertical
              aria-label="Profile tabs"
              role="region"
            >
              <Tab 
                eventKey={0} 
                title={<TabTitleText>Personal Info</TabTitleText>}
                aria-label="Personal info tab"
              />
              <Tab 
                eventKey={1} 
                title={<TabTitleText>Preferences</TabTitleText>}
                aria-label="Preferences tab"
              />
              <Tab 
                eventKey={2} 
                title={<TabTitleText>Security</TabTitleText>}
                aria-label="Security tab"
              />
              <Tab 
                eventKey={3} 
                title={<TabTitleText>Notifications</TabTitleText>}
                aria-label="Notifications tab"
              />
            </Tabs>
          </GridItem>
          
          <GridItem span={9}>
            {activeTabKey === 0 && (
              <PersonalInfoTab
                fullName={fullName}
                setFullName={setFullName}
                email={email}
                setEmail={setEmail}
                bio={bio}
                setBio={setBio}
              />
            )}
                
            {activeTabKey === 1 && (
              <PreferencesTab
                publicProfile={publicProfile}
                setPublicProfile={setPublicProfile}
                showEmail={showEmail}
                setShowEmail={setShowEmail}
                showActivity={showActivity}
                setShowActivity={setShowActivity}
                contentTypes={contentTypes}
                handleContentTypeChange={handleContentTypeChange}
                topicWeights={topicWeights}
                handleTopicWeightChange={handleTopicWeightChange}
                freshnessPreference={freshnessPreference}
                setFreshnessPreference={setFreshnessPreference}
                diversityScore={diversityScore}
                setDiversityScore={setDiversityScore}
                engagementWeight={engagementWeight}
                setEngagementWeight={setEngagementWeight}
              />
            )}
            
            {activeTabKey === 2 && (
              <SecurityTab />
            )}
            
            {activeTabKey === 3 && (
              <NotificationsTab />
            )}
          </GridItem>
        </Grid>
      </PageSection>
    </>
  );
};

export default Profile;
