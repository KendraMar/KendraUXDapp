import React from 'react';
import {
  PageSection,
  Title,
  Content,
  Card,
  CardTitle,
  CardBody,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Button,
  Alert
} from '@patternfly/react-core';

const Playground = () => {
  const [componentName, setComponentName] = React.useState('');
  const [componentCode, setComponentCode] = React.useState('');
  const [saveStatus, setSaveStatus] = React.useState(null);

  const handleSave = async () => {
    if (!componentName) {
      setSaveStatus({ type: 'danger', message: 'Please enter a component name' });
      return;
    }

    try {
      const response = await fetch(`/api/cache/${componentName}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: componentName, 
          code: componentCode,
          timestamp: new Date().toISOString()
        })
      });

      const data = await response.json();
      if (data.success) {
        setSaveStatus({ type: 'success', message: `Saved ${componentName} to cache!` });
      } else {
        setSaveStatus({ type: 'danger', message: data.error });
      }
    } catch (error) {
      setSaveStatus({ type: 'danger', message: error.message });
    }
  };

  return (
    <>
      <PageSection variant="light">
        <Title headingLevel="h1" size="2xl">
          Playground
        </Title>
        <Content component="p">
          Create and experiment with UI components. Your work is automatically saved locally.
        </Content>
      </PageSection>
      <PageSection>
        {saveStatus && (
          <Alert
            variant={saveStatus.type}
            title={saveStatus.message}
            actionClose={<Button variant="plain" onClick={() => setSaveStatus(null)}>×</Button>}
            style={{ marginBottom: '1rem' }}
          />
        )}
        
        <Card>
          <CardTitle>Component Builder</CardTitle>
          <CardBody>
            <Form>
              <FormGroup label="Component Name" isRequired fieldId="component-name">
                <TextInput
                  id="component-name"
                  value={componentName}
                  onChange={(event, value) => setComponentName(value)}
                  placeholder="e.g., MyCustomButton"
                />
              </FormGroup>
              
              <FormGroup label="Component Code" fieldId="component-code">
                <TextArea
                  id="component-code"
                  value={componentCode}
                  onChange={(event, value) => setComponentCode(value)}
                  placeholder="Enter your component code here..."
                  rows={15}
                />
              </FormGroup>
              
              <Button variant="primary" onClick={handleSave}>
                Save to Cache
              </Button>
            </Form>
          </CardBody>
        </Card>
      </PageSection>
    </>
  );
};

export default Playground;

