import * as React from 'react';
import { TextInput, Button, PageSection, Title } from '@patternfly/react-core';
import { AskRedHat, useAskRedHat } from './index';

const DashboardWithAskRedHat: React.FunctionComponent = () => {
  const [userInput, setUserInput] = React.useState('');
  const { isVisible, checkForTriggerPhrase, hideAskRedHat } = useAskRedHat();

  const handleInputChange = (value: string) => {
    setUserInput(value);
    // Check if the input contains the trigger phrase
    checkForTriggerPhrase(value);
  };

  const handleSubmit = () => {
    // Process the input
    console.log('User input:', userInput);
    
    // Check for trigger phrase
    if (checkForTriggerPhrase(userInput)) {
      console.log('Ask Red Hat triggered!');
    }
  };

  return (
    <>
      <PageSection>
        <Title headingLevel="h1" size="2xl">Dashboard</Title>
        
        {/* Demo input field to trigger Ask Red Hat */}
        <div style={{ marginTop: '20px', maxWidth: '400px' }}>
          <TextInput
            value={userInput}
            onChange={(_, value) => handleInputChange(value)}
            placeholder="Try typing: upgrade my RHEL systems to RHEL9"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
          />
          <Button 
            onClick={handleSubmit} 
            style={{ marginTop: '10px' }}
            variant="primary"
          >
            Submit
          </Button>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <p>Try typing: "upgrade my RHEL systems to RHEL9" to see the Ask Red Hat component appear!</p>
        </div>
      </PageSection>

      {/* Ask Red Hat Overlay */}
      <AskRedHat 
        isVisible={isVisible} 
        onClose={hideAskRedHat}
      />
    </>
  );
};

export { DashboardWithAskRedHat };
