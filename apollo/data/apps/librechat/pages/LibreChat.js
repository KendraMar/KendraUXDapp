import React, { useState, useEffect } from 'react';
import {
  PageSection,
  Title,
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Button,
  TextInput,
  FormGroup,
  Form,
  Alert,
  AlertActionCloseButton,
  Spinner,
  EmptyState,
  EmptyStateBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Switch,
  Tooltip,
  Tabs,
  Tab,
  TabContent,
  TabContentBody,
  TabTitleText,
  ClipboardCopy,
  Label,
  LabelGroup
} from '@patternfly/react-core';
import {
  ExternalLinkAltIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SyncAltIcon,
  InfoCircleIcon,
  PlayIcon,
  StopIcon,
  TrashIcon
} from '@patternfly/react-icons';

const LibreChat = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [activeTabKey, setActiveTabKey] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('unknown');
  const [availableProviders, setAvailableProviders] = useState([]);
  
  // Form state for LibreChat URL
  const [libreChatUrl, setLibreChatUrl] = useState('http://localhost:3080');
  const [isEditing, setIsEditing] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  
  // Container management state
  const [containerStatus, setContainerStatus] = useState({ running: false, containerId: null });
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [containerLogs, setContainerLogs] = useState('');
  const [showLogs, setShowLogs] = useState(false);

  // Load config on mount
  useEffect(() => {
    loadConfig();
    checkAvailableProviders();
    checkContainerStatus();
  }, []);

  // Check connection status when URL changes
  useEffect(() => {
    if (libreChatUrl) {
      checkConnection();
    }
  }, [libreChatUrl]);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/config/librechat');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        if (data.url) {
          setLibreChatUrl(data.url);
        }
      }
    } catch (err) {
      console.error('Error loading LibreChat config:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailableProviders = async () => {
    const providers = [];
    
    // Check local AI
    try {
      const response = await fetch('/api/chat/models');
      const data = await response.json();
      if (data.success && data.models?.length > 0) {
        providers.push({
          name: 'Local AI (Ollama/LM Studio)',
          status: 'connected',
          models: data.models.map(m => m.id || m)
        });
      }
    } catch (err) {
      providers.push({ name: 'Local AI', status: 'disconnected' });
    }

    // Check Ambient AI
    try {
      const response = await fetch('/api/ambient/models');
      const data = await response.json();
      if (data.success && data.models?.length > 0) {
        providers.push({
          name: 'Ambient AI',
          status: 'connected',
          models: data.models.map(m => m.name)
        });
      }
    } catch (err) {
      // Ambient AI not configured
    }

    // Check Claude Code
    try {
      const response = await fetch('/api/claudecode/models');
      const data = await response.json();
      if (data.success && data.models?.length > 0) {
        providers.push({
          name: 'Claude (via Vertex AI)',
          status: 'connected',
          models: data.models.map(m => m.name)
        });
      }
    } catch (err) {
      // Claude not configured
    }

    // Check Cursor CLI
    try {
      const response = await fetch('/api/cursorcli/models');
      const data = await response.json();
      if (data.success && data.models?.length > 0) {
        providers.push({
          name: 'Cursor CLI',
          status: 'connected',
          models: data.models.map(m => m.name)
        });
      }
    } catch (err) {
      // Cursor CLI not configured
    }

    setAvailableProviders(providers);
  };

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      // Try to reach the LibreChat instance
      const response = await fetch('/api/librechat/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: libreChatUrl })
      });
      const data = await response.json();
      setConnectionStatus(data.connected ? 'connected' : 'disconnected');
    } catch (err) {
      setConnectionStatus('disconnected');
    }
  };

  const checkContainerStatus = async () => {
    try {
      const response = await fetch('/api/librechat/container-status');
      const data = await response.json();
      setContainerStatus(data);
    } catch (err) {
      console.error('Error checking container status:', err);
    }
  };

  const startContainer = async () => {
    setIsStarting(true);
    setError(null);
    try {
      const response = await fetch('/api/librechat/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage(data.message);
        setContainerStatus({ running: true, containerId: data.containerId });
        
        // Wait a moment for the container to be ready, then check connection
        setTimeout(() => {
          checkConnection();
          setIframeKey(prev => prev + 1);
        }, 3000);
      } else {
        setError(data.error || 'Failed to start LibreChat');
      }
    } catch (err) {
      setError('Error starting LibreChat: ' + err.message);
    } finally {
      setIsStarting(false);
    }
  };

  const stopContainer = async () => {
    setIsStopping(true);
    setError(null);
    try {
      const response = await fetch('/api/librechat/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        setSuccessMessage('LibreChat stopped');
        setContainerStatus({ running: false, containerId: null });
        setConnectionStatus('disconnected');
      } else {
        setError(data.error || 'Failed to stop LibreChat');
      }
    } catch (err) {
      setError('Error stopping LibreChat: ' + err.message);
    } finally {
      setIsStopping(false);
    }
  };

  const removeContainer = async () => {
    try {
      await fetch('/api/librechat/container', { method: 'DELETE' });
      setSuccessMessage('LibreChat containers and volumes removed');
      setContainerStatus({ running: false, containerId: null });
      setContainerLogs('');
    } catch (err) {
      setError('Error removing container: ' + err.message);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/librechat/logs?lines=100');
      const data = await response.json();
      if (data.success) {
        setContainerLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const saveConfig = async () => {
    try {
      const response = await fetch('/api/config/librechat', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: libreChatUrl })
      });
      
      if (response.ok) {
        setSuccessMessage('LibreChat configuration saved');
        setIsEditing(false);
        setIframeKey(prev => prev + 1); // Force iframe reload
        checkConnection();
      } else {
        setError('Failed to save configuration');
      }
    } catch (err) {
      setError('Error saving configuration: ' + err.message);
    }
  };

  const refreshIframe = () => {
    setIframeKey(prev => prev + 1);
    checkConnection();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon color="var(--pf-t--global--color--status--success--default)" />;
      case 'disconnected':
        return <ExclamationCircleIcon color="var(--pf-t--global--color--status--danger--default)" />;
      case 'checking':
        return <Spinner size="sm" />;
      default:
        return <InfoCircleIcon color="var(--pf-t--global--color--status--info--default)" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'connected':
        return <Label color="green" icon={<CheckCircleIcon />}>Connected</Label>;
      case 'disconnected':
        return <Label color="red" icon={<ExclamationCircleIcon />}>Disconnected</Label>;
      case 'checking':
        return <Label color="blue" icon={<Spinner size="sm" />}>Checking...</Label>;
      default:
        return <Label color="grey" icon={<InfoCircleIcon />}>Unknown</Label>;
    }
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <Flex justifyContent={{ default: 'justifyContentCenter' }} alignItems={{ default: 'alignItemsCenter' }} style={{ height: '100%' }}>
          <Spinner size="xl" />
        </Flex>
      </PageSection>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: 'calc(100vh - 76px)', // Full viewport minus masthead height
      overflow: 'hidden'
    }}>
      {error && (
        <Alert
          variant="danger"
          title={error}
          actionClose={<AlertActionCloseButton onClose={() => setError(null)} />}
          style={{ margin: '1rem' }}
        />
      )}
      {successMessage && (
        <Alert
          variant="success"
          title={successMessage}
          actionClose={<AlertActionCloseButton onClose={() => setSuccessMessage(null)} />}
          style={{ margin: '1rem' }}
        />
      )}

      <Tabs
        activeKey={activeTabKey}
        onSelect={(_, tabIndex) => setActiveTabKey(tabIndex)}
        style={{ padding: '0 1rem' }}
      >
        <Tab eventKey={0} title={<TabTitleText>Chat</TabTitleText>} />
        <Tab eventKey={1} title={<TabTitleText>Configuration</TabTitleText>} />
        <Tab eventKey={2} title={<TabTitleText>AI Providers</TabTitleText>} />
      </Tabs>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {activeTabKey === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Toolbar */}
            <Flex
              justifyContent={{ default: 'justifyContentSpaceBetween' }}
              alignItems={{ default: 'alignItemsCenter' }}
              style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--pf-t--global--border--color--default)' }}
            >
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                  {getStatusLabel(connectionStatus)}
                  <span style={{ color: 'var(--pf-t--global--text--color--subtle)', fontSize: '0.875rem' }}>
                    {libreChatUrl}
                  </span>
                </Flex>
              </FlexItem>
              <FlexItem>
                <Flex gap={{ default: 'gapSm' }}>
                  <Tooltip content="Refresh">
                    <Button variant="plain" onClick={refreshIframe}>
                      <SyncAltIcon />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Open in new tab">
                    <Button
                      variant="plain"
                      component="a"
                      href={libreChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLinkAltIcon />
                    </Button>
                  </Tooltip>
                  <Tooltip content="Settings">
                    <Button variant="plain" onClick={() => setActiveTabKey(1)}>
                      <CogIcon />
                    </Button>
                  </Tooltip>
                </Flex>
              </FlexItem>
            </Flex>

            {/* LibreChat iframe or setup message */}
            {connectionStatus === 'connected' ? (
              <iframe
                key={iframeKey}
                src={libreChatUrl}
                style={{
                  flex: 1,
                  width: '100%',
                  height: '100%',
                  minHeight: 0,
                  border: 'none',
                  display: 'block'
                }}
                title="LibreChat"
                allow="clipboard-read; clipboard-write"
              />
            ) : (
              <EmptyState style={{ flex: 1 }}>
                <ExclamationCircleIcon size="xl" color="var(--pf-t--global--color--status--warning--default)" />
                <Title headingLevel="h2" size="lg">LibreChat Not Connected</Title>
                <EmptyStateBody>
                  <p style={{ marginBottom: '1rem' }}>
                    LibreChat is not running at <strong>{libreChatUrl}</strong>.
                  </p>
                  <p style={{ marginBottom: '1rem' }}>
                    LibreChat is a powerful open-source AI chat interface that supports multiple AI providers.
                    Click the button below to start it automatically with Podman.
                  </p>
                </EmptyStateBody>
                <Button 
                  variant="primary" 
                  onClick={startContainer}
                  isLoading={isStarting}
                  isDisabled={isStarting}
                  icon={<PlayIcon />}
                >
                  {isStarting ? 'Starting LibreChat...' : 'Start LibreChat'}
                </Button>
                <Button variant="link" onClick={checkConnection}>
                  Retry Connection
                </Button>
                <Button variant="link" onClick={() => setActiveTabKey(1)}>
                  Configure
                </Button>
              </EmptyState>
            )}
          </div>
        )}

        {activeTabKey === 1 && (
          <PageSection>
            <Card>
              <CardTitle>LibreChat Configuration</CardTitle>
              <CardBody>
                <Form>
                  <FormGroup label="LibreChat URL" fieldId="librechat-url">
                    <Flex gap={{ default: 'gapSm' }}>
                      <FlexItem grow={{ default: 'grow' }}>
                        <TextInput
                          id="librechat-url"
                          value={libreChatUrl}
                          onChange={(_, value) => setLibreChatUrl(value)}
                          placeholder="http://localhost:3080"
                        />
                      </FlexItem>
                      <FlexItem>
                        <Button variant="primary" onClick={saveConfig}>
                          Save
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button variant="secondary" onClick={checkConnection}>
                          Test Connection
                        </Button>
                      </FlexItem>
                    </Flex>
                    <p style={{ marginTop: '0.5rem', color: 'var(--pf-t--global--text--color--subtle)', fontSize: '0.875rem' }}>
                      The URL where your LibreChat instance is running.
                    </p>
                  </FormGroup>
                </Form>

                <div style={{ marginTop: '2rem' }}>
                  <Title headingLevel="h3" size="lg" style={{ marginBottom: '1rem' }}>
                    Connection Status
                  </Title>
                  <DescriptionList>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Status</DescriptionListTerm>
                      <DescriptionListDescription>
                        {getStatusLabel(connectionStatus)}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>URL</DescriptionListTerm>
                      <DescriptionListDescription>{libreChatUrl}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <Title headingLevel="h3" size="lg" style={{ marginBottom: '1rem' }}>
                    Container Management
                  </Title>
                  <p style={{ marginBottom: '1rem', color: 'var(--pf-t--global--text--color--subtle)' }}>
                    Start or stop LibreChat using Podman (or Docker as fallback).
                  </p>
                  <DescriptionList>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Container Status</DescriptionListTerm>
                      <DescriptionListDescription>
                        {containerStatus.running ? (
                          <Label color="green" icon={<CheckCircleIcon />}>
                            Running {containerStatus.containerId && `(${containerStatus.containerId.substring(0, 12)})`}
                          </Label>
                        ) : (
                          <Label color="grey">Not Running</Label>
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                  <Flex gap={{ default: 'gapMd' }} style={{ marginTop: '1rem' }}>
                    {!containerStatus.running ? (
                      <Button
                        variant="primary"
                        onClick={startContainer}
                        isLoading={isStarting}
                        isDisabled={isStarting}
                        icon={<PlayIcon />}
                      >
                        {isStarting ? 'Starting...' : 'Start LibreChat'}
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={stopContainer}
                        isLoading={isStopping}
                        isDisabled={isStopping}
                        icon={<StopIcon />}
                      >
                        {isStopping ? 'Stopping...' : 'Stop LibreChat'}
                      </Button>
                    )}
                    <Button
                      variant="plain"
                      onClick={checkContainerStatus}
                    >
                      <SyncAltIcon /> Refresh Status
                    </Button>
                    <Button
                      variant="plain"
                      onClick={() => {
                        setShowLogs(!showLogs);
                        if (!showLogs) fetchLogs();
                      }}
                    >
                      {showLogs ? 'Hide Logs' : 'View Logs'}
                    </Button>
                    <Tooltip content="Remove LibreChat containers and volumes (useful if you need to reset)">
                      <Button
                        variant="plain"
                        onClick={removeContainer}
                        isDanger
                      >
                        <TrashIcon /> Remove All
                      </Button>
                    </Tooltip>
                  </Flex>
                  
                  {showLogs && (
                    <div style={{ marginTop: '1rem' }}>
                      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '0.5rem' }}>
                        <Title headingLevel="h4" size="md">Container Logs</Title>
                        <Button variant="plain" onClick={fetchLogs} isSmall>
                          <SyncAltIcon /> Refresh
                        </Button>
                      </Flex>
                      <pre style={{
                        background: 'var(--pf-t--global--background--color--secondary--default)',
                        padding: '1rem',
                        borderRadius: '4px',
                        maxHeight: '300px',
                        overflow: 'auto',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all'
                      }}>
                        {containerLogs || 'No logs available. Start the container first.'}
                      </pre>
                    </div>
                  )}
                  
                  <Alert 
                    variant="info" 
                    isInline 
                    title="About LibreChat Setup"
                    style={{ marginTop: '1rem' }}
                  >
                    LibreChat runs with MongoDB for data persistence. The first startup may take a minute while images are downloaded. 
                    If you don't have podman-compose installed, run: <code>pip install podman-compose</code>
                  </Alert>
                </div>

                <div style={{ marginTop: '2rem' }}>
                  <Title headingLevel="h3" size="lg" style={{ marginBottom: '1rem' }}>
                    Apollo AI Proxy Endpoint
                  </Title>
                  <p style={{ marginBottom: '1rem', color: 'var(--pf-t--global--text--color--subtle)' }}>
                    Configure LibreChat to use Apollo as an AI proxy. This allows LibreChat to access all of Apollo's configured AI providers (local models, Ambient AI, Claude, Cursor CLI).
                  </p>
                  <DescriptionList>
                    <DescriptionListGroup>
                      <DescriptionListTerm>OpenAI-Compatible Endpoint</DescriptionListTerm>
                      <DescriptionListDescription>
                        <ClipboardCopy isCode isReadOnly>
                          {`${window.location.origin}/api/librechat/v1`}
                        </ClipboardCopy>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>API Key</DescriptionListTerm>
                      <DescriptionListDescription>
                        <ClipboardCopy isCode isReadOnly>
                          apollo-local
                        </ClipboardCopy>
                        <span style={{ marginLeft: '0.5rem', color: 'var(--pf-t--global--text--color--subtle)', fontSize: '0.875rem' }}>
                          (any value works for local access)
                        </span>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </div>
              </CardBody>
            </Card>
          </PageSection>
        )}

        {activeTabKey === 2 && (
          <PageSection>
            <Card>
              <CardTitle>Available AI Providers</CardTitle>
              <CardBody>
                <p style={{ marginBottom: '1rem', color: 'var(--pf-t--global--text--color--subtle)' }}>
                  These AI providers are configured in Apollo and can be accessed through the LibreChat proxy endpoint.
                </p>

                {availableProviders.length === 0 ? (
                  <EmptyState>
                    <Title headingLevel="h3" size="lg">No AI Providers Configured</Title>
                    <EmptyStateBody>
                      Configure AI providers in Apollo Settings to make them available through LibreChat.
                    </EmptyStateBody>
                  </EmptyState>
                ) : (
                  <div>
                    {availableProviders.map((provider, index) => (
                      <Card key={index} isCompact style={{ marginBottom: '1rem' }}>
                        <CardBody>
                          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                            <FlexItem>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                                {getStatusIcon(provider.status)}
                                <Title headingLevel="h4" size="md">{provider.name}</Title>
                              </Flex>
                            </FlexItem>
                            <FlexItem>
                              <Label color={provider.status === 'connected' ? 'green' : 'red'}>
                                {provider.status}
                              </Label>
                            </FlexItem>
                          </Flex>
                          {provider.models && provider.models.length > 0 && (
                            <div style={{ marginTop: '0.75rem' }}>
                              <LabelGroup>
                                {provider.models.slice(0, 5).map((model, idx) => (
                                  <Label key={idx} color="blue" isCompact>
                                    {model}
                                  </Label>
                                ))}
                                {provider.models.length > 5 && (
                                  <Label color="grey" isCompact>
                                    +{provider.models.length - 5} more
                                  </Label>
                                )}
                              </LabelGroup>
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: '2rem' }}>
                  <Button variant="secondary" onClick={checkAvailableProviders}>
                    <SyncAltIcon style={{ marginRight: '0.5rem' }} />
                    Refresh Providers
                  </Button>
                </div>
              </CardBody>
            </Card>
          </PageSection>
        )}
      </div>
    </div>
  );
};

export default LibreChat;
