import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Flex,
  FlexItem,
  Title,
  Content,
  Form,
  FormSection,
  FormGroup,
  TextInput,
  TextArea,
  Label,
  Checkbox
} from '@patternfly/react-core';
import { availableIntegrations, integrationTools } from '../constants';

const AgentConfigPanel = ({
  selectedAgent,
  agentForm,
  setAgentForm,
  agentSaving,
  handleAgentSave,
  setSelectedAgent,
  toggleAgentIntegration,
  toggleAgentTool
}) => {
  if (!selectedAgent) return null;

  const closeAgentConfig = () => {
    setSelectedAgent(null);
  };

  return (
    <div>
      {/* Breadcrumb navigation */}
      <Breadcrumb style={{ marginBottom: '1.5rem' }}>
        <BreadcrumbItem>
          <Button variant="link" isInline onClick={closeAgentConfig}>
            Agents
          </Button>
        </BreadcrumbItem>
        <BreadcrumbItem isActive>
          {agentForm.name || selectedAgent.name}
        </BreadcrumbItem>
      </Breadcrumb>

      {/* Agent header */}
      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }} style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${selectedAgent.color}20`
          }}
        >
          <img 
            src={selectedAgent.avatarUrl} 
            alt={`${selectedAgent.name} icon`}
            style={{ width: '32px', height: '32px' }}
          />
        </div>
        <div>
          <Title headingLevel="h2" size="xl">
            {agentForm.name || selectedAgent.name}
          </Title>
          <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)', marginTop: '0.25rem' }}>
            Configure this agent's behavior and capabilities
          </Content>
        </div>
      </Flex>

      <Form>
        {/* Basic Info Section */}
        <FormSection title="Basic Information" titleElement="h3">
          <FormGroup label="Name" isRequired fieldId="agent-name">
            <TextInput
              isRequired
              type="text"
              id="agent-name"
              value={agentForm.name || ''}
              onChange={(_event, value) => setAgentForm(prev => ({ ...prev, name: value }))}
              placeholder="Agent name"
            />
          </FormGroup>
          <FormGroup label="Description" fieldId="agent-description">
            <TextInput
              type="text"
              id="agent-description"
              value={agentForm.description || ''}
              onChange={(_event, value) => setAgentForm(prev => ({ ...prev, description: value }))}
              placeholder="Brief description of what this agent does"
            />
          </FormGroup>
        </FormSection>

        {/* Prompts Section */}
        <FormSection title="Prompts" titleElement="h3" style={{ marginTop: '2rem' }}>
          <FormGroup 
            label="System Prompt" 
            fieldId="agent-system-prompt"
            labelHelp={
              <Content component="small" style={{ fontWeight: 'normal' }}>
                Instructions that define the agent's personality and behavior
              </Content>
            }
          >
            <TextArea
              id="agent-system-prompt"
              value={agentForm.systemPrompt || ''}
              onChange={(_event, value) => setAgentForm(prev => ({ ...prev, systemPrompt: value }))}
              placeholder="You are a helpful assistant..."
              rows={6}
              resizeOrientation="vertical"
            />
          </FormGroup>
          <FormGroup 
            label="Default User Prompt" 
            fieldId="agent-user-prompt"
            labelHelp={
              <Content component="small" style={{ fontWeight: 'normal' }}>
                Optional template for user messages
              </Content>
            }
          >
            <TextArea
              id="agent-user-prompt"
              value={agentForm.userPrompt || ''}
              onChange={(_event, value) => setAgentForm(prev => ({ ...prev, userPrompt: value }))}
              placeholder="Optional: A template or prefix for user prompts"
              rows={3}
              resizeOrientation="vertical"
            />
          </FormGroup>
        </FormSection>

        {/* Integrations & Tools Section */}
        <FormSection title="Integrations & Tools" titleElement="h3" style={{ marginTop: '2rem' }}>
          <Content component="p" style={{ marginBottom: '1rem', color: 'var(--pf-v6-global--Color--200)' }}>
            Select which integrations this agent can access and which tools it can use
          </Content>
          
          <div style={{ 
            border: '1px solid var(--pf-v6-global--BorderColor--100)', 
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {availableIntegrations.map((integration, index) => {
              const isEnabled = agentForm.enabledIntegrations?.includes(integration.id);
              const tools = integrationTools[integration.id] || [];
              const enabledTools = agentForm.tools?.[integration.id] || [];
              
              return (
                <div 
                  key={integration.id}
                  style={{
                    borderBottom: index < availableIntegrations.length - 1 
                      ? '1px solid var(--pf-v6-global--BorderColor--100)' 
                      : 'none'
                  }}
                >
                  {/* Integration row */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      backgroundColor: isEnabled 
                        ? 'var(--pf-v6-global--BackgroundColor--200)' 
                        : 'var(--pf-v6-global--BackgroundColor--100)'
                    }}
                  >
                    <Checkbox
                      id={`integration-${integration.id}`}
                      isChecked={isEnabled}
                      onChange={() => toggleAgentIntegration(integration.id)}
                      style={{ marginRight: '0.75rem' }}
                    />
                    <img 
                      src={integration.logo} 
                      alt={integration.name}
                      style={{ width: '20px', height: '20px', marginRight: '0.75rem' }}
                    />
                    <span style={{ fontWeight: 500 }}>{integration.name}</span>
                    {isEnabled && (
                      <Label color="blue" isCompact style={{ marginLeft: 'auto' }}>
                        {enabledTools.length}/{tools.length} tools
                      </Label>
                    )}
                  </div>
                  
                  {/* Tools list (when integration is enabled) */}
                  {isEnabled && tools.length > 0 && (
                    <div style={{ 
                      padding: '0.75rem 1rem 0.75rem 3rem',
                      backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
                      borderTop: '1px solid var(--pf-v6-global--BorderColor--100)'
                    }}>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '0.5rem'
                      }}>
                        {tools.map(tool => (
                          <Checkbox
                            key={tool.id}
                            id={`tool-${integration.id}-${tool.id}`}
                            label={
                              <span>
                                <span style={{ fontWeight: 500 }}>{tool.name}</span>
                                <Content 
                                  component="small" 
                                  style={{ 
                                    display: 'block', 
                                    color: 'var(--pf-v6-global--Color--200)',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  {tool.description}
                                </Content>
                              </span>
                            }
                            isChecked={enabledTools.includes(tool.id)}
                            onChange={() => toggleAgentTool(integration.id, tool.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </FormSection>

        {/* Actions */}
        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.5rem' }}>
          <Button 
            variant="primary" 
            onClick={handleAgentSave}
            isLoading={agentSaving}
            isDisabled={agentSaving}
          >
            Save Changes
          </Button>
          <Button 
            variant="link" 
            onClick={closeAgentConfig}
            isDisabled={agentSaving}
          >
            Cancel
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AgentConfigPanel;
