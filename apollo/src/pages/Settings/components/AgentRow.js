import React from 'react';
import { Content, Label, Switch, Button, Spinner } from '@patternfly/react-core';
import { CogIcon } from '@patternfly/react-icons';

const AgentRow = ({ 
  agent, 
  isTemplate = false, 
  isAgentEnabled, 
  agentEnabling, 
  enableAgent, 
  disableAgent, 
  openAgentConfig,
  enabledAgents 
}) => {
  const enabled = isAgentEnabled(agent.id);
  const isProcessing = agentEnabling === agent.id;
  
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1rem 1.25rem',
        backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
        transition: 'background-color 0.15s ease'
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '1rem',
          flexShrink: 0,
          backgroundColor: `${agent.color}20`
        }}
      >
        <img 
          src={agent.avatarUrl} 
          alt={`${agent.name} icon`}
          style={{ width: '28px', height: '28px' }}
        />
      </div>
      
      {/* Name and Description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>
          {agent.name}
        </div>
        <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
          {agent.description}
        </Content>
      </div>
      
      {/* Integration count - only show if enabled */}
      {enabled && (
        <div style={{ marginRight: '1rem', flexShrink: 0 }}>
          <Label color="blue" isCompact>
            {agent.enabledIntegrations?.length || 0} integrations
          </Label>
        </div>
      )}
      
      {/* Enable/Disable Switch */}
      <div style={{ marginRight: '1rem', flexShrink: 0 }}>
        {isProcessing ? (
          <Spinner size="sm" />
        ) : (
          <Switch
            id={`agent-switch-${agent.id}`}
            label="Enabled"
            isChecked={enabled}
            onChange={() => enabled ? disableAgent(agent.id) : enableAgent(agent.id)}
            isReversed
          />
        )}
      </div>
      
      {/* Configure Button - only show if enabled */}
      {enabled && (
        <div style={{ flexShrink: 0 }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<CogIcon />}
            onClick={() => {
              // Find the enabled agent (which has full config) to edit
              const enabledAgent = enabledAgents.find(a => a.id === agent.id);
              if (enabledAgent) {
                openAgentConfig(enabledAgent);
              }
            }}
          >
            Configure
          </Button>
        </div>
      )}
    </div>
  );
};

export default AgentRow;
