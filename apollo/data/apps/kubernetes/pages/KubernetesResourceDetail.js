import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Title,
  Content,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  Label,
  Badge,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Alert,
  Button,
  Tabs,
  Tab,
  TabTitleText,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Divider,
  ClipboardCopy,
  CodeBlock,
  CodeBlockCode,
  Tooltip,
  Grid,
  GridItem
} from '@patternfly/react-core';
import {
  ArrowLeftIcon,
  SyncAltIcon,
  ExternalLinkAltIcon,
  CheckCircleIcon,
  TimesCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  OutlinedClockIcon,
  CubesIcon,
  ServerIcon,
  MemoryIcon,
  CpuIcon,
  NetworkIcon,
  StorageDomainIcon,
  TagIcon
} from '@patternfly/react-icons';

// Status helpers
const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case 'running':
    case 'active':
    case 'ready':
    case 'available':
    case 'bound':
    case 'complete':
    case 'succeeded':
      return <CheckCircleIcon color="var(--pf-t--global--color--status--success--default)" />;
    case 'pending':
    case 'waiting':
    case 'creating':
      return <OutlinedClockIcon color="var(--pf-t--global--color--status--warning--default)" />;
    case 'failed':
    case 'error':
    case 'crashloopbackoff':
      return <TimesCircleIcon color="var(--pf-t--global--color--status--danger--default)" />;
    case 'terminating':
    case 'deleting':
      return <ExclamationTriangleIcon color="var(--pf-t--global--color--status--warning--default)" />;
    default:
      return <ExclamationCircleIcon color="var(--pf-t--global--color--status--info--default)" />;
  }
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'running':
    case 'active':
    case 'ready':
    case 'available':
    case 'bound':
    case 'complete':
    case 'succeeded':
      return 'green';
    case 'pending':
    case 'waiting':
    case 'creating':
      return 'orange';
    case 'failed':
    case 'error':
    case 'crashloopbackoff':
      return 'red';
    case 'terminating':
    case 'deleting':
      return 'orange';
    default:
      return 'blue';
  }
};

// Format age from timestamp
const formatAge = (timestamp) => {
  if (!timestamp) return '-';
  const created = new Date(timestamp);
  const now = new Date();
  const diffMs = now - created;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
  if (diffMins > 0) return `${diffMins}m ${diffSecs % 60}s`;
  return `${diffSecs}s`;
};

const KubernetesResourceDetail = () => {
  const { resourceType, namespace, name } = useParams();
  const navigate = useNavigate();
  
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    fetchResource();
    fetchEvents();
  }, [resourceType, namespace, name]);
  
  const fetchResource = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const ns = namespace === '_cluster' ? '' : `?namespace=${namespace}`;
      const res = await fetch(`/api/kubernetes/resource/${resourceType}/${name}${ns}`);
      const data = await res.json();
      
      if (data.success) {
        setResource(data.resource);
      } else {
        setError(data.error || 'Failed to fetch resource');
      }
    } catch (err) {
      setError('Failed to fetch resource: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchEvents = async () => {
    if (namespace === '_cluster') return;
    
    try {
      const res = await fetch(`/api/kubernetes/events/${namespace}/${name}`);
      const data = await res.json();
      if (data.success) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const renderMetadata = () => {
    const meta = resource.metadata || {};
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardBody>
          <DescriptionList isHorizontal columnModifier={{ default: '2Col' }}>
            <DescriptionListGroup>
              <DescriptionListTerm>Name</DescriptionListTerm>
              <DescriptionListDescription>
                <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied" variant="inline-compact">
                  {meta.name}
                </ClipboardCopy>
              </DescriptionListDescription>
            </DescriptionListGroup>
            
            {meta.namespace && (
              <DescriptionListGroup>
                <DescriptionListTerm>Namespace</DescriptionListTerm>
                <DescriptionListDescription>
                  <Label color="blue">{meta.namespace}</Label>
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            
            <DescriptionListGroup>
              <DescriptionListTerm>UID</DescriptionListTerm>
              <DescriptionListDescription>
                <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied" variant="inline-compact">
                  {meta.uid}
                </ClipboardCopy>
              </DescriptionListDescription>
            </DescriptionListGroup>
            
            <DescriptionListGroup>
              <DescriptionListTerm>Created</DescriptionListTerm>
              <DescriptionListDescription>
                {new Date(meta.creationTimestamp).toLocaleString()}
                <span style={{ marginLeft: '8px', color: 'var(--pf-t--global--text--color--subtle)' }}>
                  ({formatAge(meta.creationTimestamp)} ago)
                </span>
              </DescriptionListDescription>
            </DescriptionListGroup>
            
            {meta.resourceVersion && (
              <DescriptionListGroup>
                <DescriptionListTerm>Resource Version</DescriptionListTerm>
                <DescriptionListDescription>{meta.resourceVersion}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
            
            {meta.generation && (
              <DescriptionListGroup>
                <DescriptionListTerm>Generation</DescriptionListTerm>
                <DescriptionListDescription>{meta.generation}</DescriptionListDescription>
              </DescriptionListGroup>
            )}
          </DescriptionList>
        </CardBody>
      </Card>
    );
  };

  const renderLabels = () => {
    const labels = resource.metadata?.labels || {};
    const annotations = resource.metadata?.annotations || {};
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Labels &amp; Annotations</CardTitle>
        </CardHeader>
        <CardBody>
          <Title headingLevel="h4" size="md" style={{ marginBottom: '12px' }}>
            Labels
          </Title>
          {Object.keys(labels).length > 0 ? (
            <Flex wrap={{ default: 'wrap' }} spaceItems={{ default: 'spaceItemsXs' }}>
              {Object.entries(labels).map(([key, value]) => (
                <Label key={key} color="blue" icon={<TagIcon />}>
                  {key}: {value}
                </Label>
              ))}
            </Flex>
          ) : (
            <Content style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
              No labels
            </Content>
          )}
          
          <Divider style={{ margin: '1.5rem 0' }} />
          
          <Title headingLevel="h4" size="md" style={{ marginBottom: '12px' }}>
            Annotations
          </Title>
          {Object.keys(annotations).length > 0 ? (
            <DescriptionList isCompact>
              {Object.entries(annotations).slice(0, 10).map(([key, value]) => (
                <DescriptionListGroup key={key}>
                  <DescriptionListTerm>{key}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <div style={{ 
                      maxWidth: '500px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {value.length > 100 ? `${value.substring(0, 100)}...` : value}
                    </div>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ))}
              {Object.keys(annotations).length > 10 && (
                <Content style={{ color: 'var(--pf-t--global--text--color--subtle)', marginTop: '8px' }}>
                  +{Object.keys(annotations).length - 10} more annotations
                </Content>
              )}
            </DescriptionList>
          ) : (
            <Content style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>
              No annotations
            </Content>
          )}
        </CardBody>
      </Card>
    );
  };

  const renderPodSpec = () => {
    const spec = resource.spec || {};
    const status = resource.status || {};
    const containers = spec.containers || [];
    const containerStatuses = status.containerStatuses || [];
    
    return (
      <>
        {/* Pod Status */}
        <Card style={{ marginBottom: '1rem' }}>
          <CardHeader>
            <CardTitle>Pod Status</CardTitle>
          </CardHeader>
          <CardBody>
            <Grid hasGutter>
              <GridItem span={3}>
                <div className="k8s-detail-stat">
                  <span className="label">Phase</span>
                  <Label color={getStatusColor(status.phase)} icon={getStatusIcon(status.phase)} isCompact>
                    {status.phase || 'Unknown'}
                  </Label>
                </div>
              </GridItem>
              <GridItem span={3}>
                <div className="k8s-detail-stat">
                  <span className="label">Node</span>
                  <span className="value">{spec.nodeName || '-'}</span>
                </div>
              </GridItem>
              <GridItem span={3}>
                <div className="k8s-detail-stat">
                  <span className="label">Pod IP</span>
                  <span className="value">{status.podIP || '-'}</span>
                </div>
              </GridItem>
              <GridItem span={3}>
                <div className="k8s-detail-stat">
                  <span className="label">Host IP</span>
                  <span className="value">{status.hostIP || '-'}</span>
                </div>
              </GridItem>
              <GridItem span={3}>
                <div className="k8s-detail-stat">
                  <span className="label">QoS Class</span>
                  <span className="value">{status.qosClass || '-'}</span>
                </div>
              </GridItem>
              <GridItem span={3}>
                <div className="k8s-detail-stat">
                  <span className="label">Service Account</span>
                  <span className="value">{spec.serviceAccountName || 'default'}</span>
                </div>
              </GridItem>
              <GridItem span={3}>
                <div className="k8s-detail-stat">
                  <span className="label">Restart Policy</span>
                  <span className="value">{spec.restartPolicy || 'Always'}</span>
                </div>
              </GridItem>
            </Grid>
          </CardBody>
        </Card>

        {/* Containers */}
        <Card>
          <CardHeader>
            <CardTitle>Containers ({containers.length})</CardTitle>
          </CardHeader>
          <CardBody>
            {containers.map((container, idx) => {
              const containerStatus = containerStatuses.find(cs => cs.name === container.name) || {};
              const isReady = containerStatus.ready;
              const restartCount = containerStatus.restartCount || 0;
              
              // Determine container state
              let containerState = 'Unknown';
              let stateDetails = '';
              if (containerStatus.state) {
                if (containerStatus.state.running) {
                  containerState = 'Running';
                  stateDetails = `Started: ${new Date(containerStatus.state.running.startedAt).toLocaleString()}`;
                } else if (containerStatus.state.waiting) {
                  containerState = containerStatus.state.waiting.reason || 'Waiting';
                  stateDetails = containerStatus.state.waiting.message || '';
                } else if (containerStatus.state.terminated) {
                  containerState = containerStatus.state.terminated.reason || 'Terminated';
                  stateDetails = `Exit code: ${containerStatus.state.terminated.exitCode}`;
                }
              }
              
              return (
                <div key={idx} className="k8s-container-card">
                  <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <FlexItem>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <CubesIcon />
                        <Title headingLevel="h4" size="md">{container.name}</Title>
                        <Label color={getStatusColor(containerState)} isCompact icon={getStatusIcon(containerState)}>
                          {containerState}
                        </Label>
                        {!isReady && (
                          <Label color="orange" isCompact>Not Ready</Label>
                        )}
                        {restartCount > 0 && (
                          <Label color="grey" isCompact>{restartCount} restarts</Label>
                        )}
                      </Flex>
                    </FlexItem>
                  </Flex>
                  
                  <Grid hasGutter style={{ marginTop: '1rem' }}>
                    <GridItem span={6}>
                      <DescriptionList isCompact>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Image</DescriptionListTerm>
                          <DescriptionListDescription>
                            <code style={{ fontSize: '0.85rem' }}>{container.image}</code>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Image Pull Policy</DescriptionListTerm>
                          <DescriptionListDescription>{container.imagePullPolicy || 'Always'}</DescriptionListDescription>
                        </DescriptionListGroup>
                        {container.command && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>Command</DescriptionListTerm>
                            <DescriptionListDescription>
                              <code>{container.command.join(' ')}</code>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                      </DescriptionList>
                    </GridItem>
                    
                    <GridItem span={6}>
                      <DescriptionList isCompact>
                        {container.ports && container.ports.length > 0 && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>Ports</DescriptionListTerm>
                            <DescriptionListDescription>
                              <Flex wrap={{ default: 'wrap' }} spaceItems={{ default: 'spaceItemsXs' }}>
                                {container.ports.map((port, pIdx) => (
                                  <Label key={pIdx} color="blue" isCompact>
                                    {port.containerPort}/{port.protocol || 'TCP'}
                                  </Label>
                                ))}
                              </Flex>
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                        {container.resources && (
                          <>
                            {container.resources.requests && (
                              <DescriptionListGroup>
                                <DescriptionListTerm>Resource Requests</DescriptionListTerm>
                                <DescriptionListDescription>
                                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                                    {container.resources.requests.cpu && (
                                      <Label color="cyan" isCompact icon={<CpuIcon />}>
                                        CPU: {container.resources.requests.cpu}
                                      </Label>
                                    )}
                                    {container.resources.requests.memory && (
                                      <Label color="cyan" isCompact icon={<MemoryIcon />}>
                                        Memory: {container.resources.requests.memory}
                                      </Label>
                                    )}
                                  </Flex>
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            )}
                            {container.resources.limits && (
                              <DescriptionListGroup>
                                <DescriptionListTerm>Resource Limits</DescriptionListTerm>
                                <DescriptionListDescription>
                                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                                    {container.resources.limits.cpu && (
                                      <Label color="orange" isCompact icon={<CpuIcon />}>
                                        CPU: {container.resources.limits.cpu}
                                      </Label>
                                    )}
                                    {container.resources.limits.memory && (
                                      <Label color="orange" isCompact icon={<MemoryIcon />}>
                                        Memory: {container.resources.limits.memory}
                                      </Label>
                                    )}
                                  </Flex>
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            )}
                          </>
                        )}
                      </DescriptionList>
                    </GridItem>
                  </Grid>
                  
                  {stateDetails && (
                    <Content style={{ marginTop: '0.75rem', color: 'var(--pf-t--global--text--color--subtle)', fontSize: '0.875rem' }}>
                      {stateDetails}
                    </Content>
                  )}
                  
                  {idx < containers.length - 1 && <Divider style={{ margin: '1rem 0' }} />}
                </div>
              );
            })}
          </CardBody>
        </Card>
      </>
    );
  };

  const renderDeploymentSpec = () => {
    const spec = resource.spec || {};
    const status = resource.status || {};
    
    return (
      <>
        <Card style={{ marginBottom: '1rem' }}>
          <CardHeader>
            <CardTitle>Deployment Status</CardTitle>
          </CardHeader>
          <CardBody>
            <Grid hasGutter>
              <GridItem span={3}>
                <div className="k8s-detail-stat">
                  <span className="label">Replicas</span>
                  <span className="value">{status.replicas || 0} / {spec.replicas || 0}</span>
                </div>
              </GridItem>
              <GridItem span={3}>
                <div className="k8s-detail-stat">
                  <span className="label">Ready</span>
                  <span className="value">{status.readyReplicas || 0}</span>
                </div>
              </GridItem>
              <GridItem span={3}>
                <div className="k8s-detail-stat">
                  <span className="label">Up-to-date</span>
                  <span className="value">{status.updatedReplicas || 0}</span>
                </div>
              </GridItem>
              <GridItem span={3}>
                <div className="k8s-detail-stat">
                  <span className="label">Available</span>
                  <span className="value">{status.availableReplicas || 0}</span>
                </div>
              </GridItem>
            </Grid>
          </CardBody>
        </Card>
        
        <Card style={{ marginBottom: '1rem' }}>
          <CardHeader>
            <CardTitle>Strategy</CardTitle>
          </CardHeader>
          <CardBody>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>Type</DescriptionListTerm>
                <DescriptionListDescription>
                  <Label color="blue">{spec.strategy?.type || 'RollingUpdate'}</Label>
                </DescriptionListDescription>
              </DescriptionListGroup>
              {spec.strategy?.rollingUpdate && (
                <>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Max Unavailable</DescriptionListTerm>
                    <DescriptionListDescription>{spec.strategy.rollingUpdate.maxUnavailable || '25%'}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Max Surge</DescriptionListTerm>
                    <DescriptionListDescription>{spec.strategy.rollingUpdate.maxSurge || '25%'}</DescriptionListDescription>
                  </DescriptionListGroup>
                </>
              )}
            </DescriptionList>
          </CardBody>
        </Card>
        
        {/* Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Selector</CardTitle>
          </CardHeader>
          <CardBody>
            {spec.selector?.matchLabels && (
              <Flex wrap={{ default: 'wrap' }} spaceItems={{ default: 'spaceItemsXs' }}>
                {Object.entries(spec.selector.matchLabels).map(([key, value]) => (
                  <Label key={key} color="purple" icon={<TagIcon />}>
                    {key}: {value}
                  </Label>
                ))}
              </Flex>
            )}
          </CardBody>
        </Card>
      </>
    );
  };

  const renderServiceSpec = () => {
    const spec = resource.spec || {};
    
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Configuration</CardTitle>
        </CardHeader>
        <CardBody>
          <Grid hasGutter>
            <GridItem span={6}>
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>Type</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Label color="blue">{spec.type || 'ClusterIP'}</Label>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Cluster IP</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ClipboardCopy isReadOnly variant="inline-compact">{spec.clusterIP || '-'}</ClipboardCopy>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {spec.externalIPs && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>External IPs</DescriptionListTerm>
                    <DescriptionListDescription>{spec.externalIPs.join(', ')}</DescriptionListDescription>
                  </DescriptionListGroup>
                )}
                <DescriptionListGroup>
                  <DescriptionListTerm>Session Affinity</DescriptionListTerm>
                  <DescriptionListDescription>{spec.sessionAffinity || 'None'}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </GridItem>
            
            <GridItem span={6}>
              <Title headingLevel="h4" size="md" style={{ marginBottom: '12px' }}>Ports</Title>
              {spec.ports && spec.ports.length > 0 ? (
                <div>
                  {spec.ports.map((port, idx) => (
                    <Card key={idx} isCompact style={{ marginBottom: '8px' }}>
                      <CardBody style={{ padding: '12px' }}>
                        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                          <FlexItem>
                            <strong>{port.name || `Port ${idx + 1}`}</strong>
                          </FlexItem>
                          <Label color="blue" isCompact>{port.protocol || 'TCP'}</Label>
                        </Flex>
                        <div style={{ marginTop: '8px' }}>
                          {port.port} → {port.targetPort}
                          {port.nodePort && ` (NodePort: ${port.nodePort})`}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              ) : (
                <Content style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>No ports configured</Content>
              )}
              
              <Title headingLevel="h4" size="md" style={{ marginTop: '1.5rem', marginBottom: '12px' }}>Selector</Title>
              {spec.selector && Object.keys(spec.selector).length > 0 ? (
                <Flex wrap={{ default: 'wrap' }} spaceItems={{ default: 'spaceItemsXs' }}>
                  {Object.entries(spec.selector).map(([key, value]) => (
                    <Label key={key} color="purple" isCompact>{key}: {value}</Label>
                  ))}
                </Flex>
              ) : (
                <Content style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>No selector</Content>
              )}
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    );
  };

  const renderNodeSpec = () => {
    const status = resource.status || {};
    const spec = resource.spec || {};
    const conditions = status.conditions || [];
    const nodeInfo = status.nodeInfo || {};
    const capacity = status.capacity || {};
    const allocatable = status.allocatable || {};
    
    return (
      <>
        <Card style={{ marginBottom: '1rem' }}>
          <CardHeader>
            <CardTitle>Node Conditions</CardTitle>
          </CardHeader>
          <CardBody>
            <Flex wrap={{ default: 'wrap' }} spaceItems={{ default: 'spaceItemsSm' }}>
              {conditions.map((condition, idx) => (
                <Label
                  key={idx}
                  color={condition.status === 'True' 
                    ? (condition.type === 'Ready' ? 'green' : (condition.type.includes('Pressure') ? 'red' : 'green'))
                    : (condition.type === 'Ready' ? 'red' : 'green')
                  }
                  icon={condition.status === 'True' 
                    ? (condition.type === 'Ready' ? <CheckCircleIcon /> : (condition.type.includes('Pressure') ? <ExclamationTriangleIcon /> : <CheckCircleIcon />))
                    : (condition.type === 'Ready' ? <TimesCircleIcon /> : <CheckCircleIcon />)
                  }
                >
                  {condition.type}: {condition.status}
                </Label>
              ))}
            </Flex>
          </CardBody>
        </Card>
        
        <Grid hasGutter>
          <GridItem span={6}>
            <Card style={{ height: '100%' }}>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardBody>
                <DescriptionList>
                  <DescriptionListGroup>
                    <DescriptionListTerm>CPU</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                        <Label color="blue" icon={<CpuIcon />}>Capacity: {capacity.cpu}</Label>
                        <Label color="green" icon={<CpuIcon />}>Allocatable: {allocatable.cpu}</Label>
                      </Flex>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Memory</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                        <Label color="blue" icon={<MemoryIcon />}>Capacity: {capacity.memory}</Label>
                        <Label color="green" icon={<MemoryIcon />}>Allocatable: {allocatable.memory}</Label>
                      </Flex>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Pods</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                        <Label color="blue">Capacity: {capacity.pods}</Label>
                        <Label color="green">Allocatable: {allocatable.pods}</Label>
                      </Flex>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  {capacity.storage && (
                    <DescriptionListGroup>
                      <DescriptionListTerm>Storage</DescriptionListTerm>
                      <DescriptionListDescription>
                        <Label color="blue" icon={<StorageDomainIcon />}>{capacity.storage}</Label>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  )}
                </DescriptionList>
              </CardBody>
            </Card>
          </GridItem>
          
          <GridItem span={6}>
            <Card style={{ height: '100%' }}>
              <CardHeader>
                <CardTitle>System Info</CardTitle>
              </CardHeader>
              <CardBody>
                <DescriptionList isCompact>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Kubelet Version</DescriptionListTerm>
                    <DescriptionListDescription>{nodeInfo.kubeletVersion}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Container Runtime</DescriptionListTerm>
                    <DescriptionListDescription>{nodeInfo.containerRuntimeVersion}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>OS</DescriptionListTerm>
                    <DescriptionListDescription>{nodeInfo.operatingSystem} / {nodeInfo.osImage}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Architecture</DescriptionListTerm>
                    <DescriptionListDescription>{nodeInfo.architecture}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Kernel</DescriptionListTerm>
                    <DescriptionListDescription>{nodeInfo.kernelVersion}</DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </>
    );
  };

  const renderGenericSpec = () => {
    const spec = resource.spec || {};
    const status = resource.status || {};
    
    return (
      <Grid hasGutter>
        {Object.keys(spec).length > 0 && (
          <GridItem span={6}>
            <Card style={{ height: '100%' }}>
              <CardHeader>
                <CardTitle>Spec</CardTitle>
              </CardHeader>
              <CardBody>
                <CodeBlock>
                  <CodeBlockCode>
                    {JSON.stringify(spec, null, 2)}
                  </CodeBlockCode>
                </CodeBlock>
              </CardBody>
            </Card>
          </GridItem>
        )}
        
        {Object.keys(status).length > 0 && (
          <GridItem span={6}>
            <Card style={{ height: '100%' }}>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardBody>
                <CodeBlock>
                  <CodeBlockCode>
                    {JSON.stringify(status, null, 2)}
                  </CodeBlockCode>
                </CodeBlock>
              </CardBody>
            </Card>
          </GridItem>
        )}
      </Grid>
    );
  };

  const renderSpecificDetails = () => {
    switch (resourceType) {
      case 'pods':
        return renderPodSpec();
      case 'deployments':
      case 'replicasets':
      case 'statefulsets':
      case 'daemonsets':
        return renderDeploymentSpec();
      case 'services':
        return renderServiceSpec();
      case 'nodes':
        return renderNodeSpec();
      default:
        return renderGenericSpec();
    }
  };

  const renderEvents = () => {
    if (events.length === 0) {
      return (
        <EmptyState>
          <ExclamationCircleIcon size="xl" />
          <Title headingLevel="h3" size="lg">No events</Title>
          <EmptyStateBody>No events found for this resource</EmptyStateBody>
        </EmptyState>
      );
    }
    
    return (
      <div className="k8s-events-list">
        {events.map((event, idx) => (
          <Card key={idx} isCompact style={{ marginBottom: '8px' }}>
            <CardBody style={{ padding: '12px' }}>
              <Flex alignItems={{ default: 'alignItemsFlexStart' }} spaceItems={{ default: 'spaceItemsSm' }}>
                {event.type === 'Warning' ? (
                  <ExclamationTriangleIcon color="var(--pf-t--global--color--status--warning--default)" />
                ) : (
                  <CheckCircleIcon color="var(--pf-t--global--color--status--info--default)" />
                )}
                <div style={{ flex: 1 }}>
                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                    <strong>{event.reason}</strong>
                    <span style={{ color: 'var(--pf-t--global--text--color--subtle)', fontSize: '0.875rem' }}>
                      {formatAge(event.lastTimestamp || event.eventTime)}
                    </span>
                  </Flex>
                  <Content style={{ marginTop: '4px' }}>{event.message}</Content>
                  {event.count > 1 && (
                    <Label color="grey" isCompact style={{ marginTop: '4px' }}>
                      Occurred {event.count} times
                    </Label>
                  )}
                </div>
              </Flex>
            </CardBody>
          </Card>
        ))}
      </div>
    );
  };

  const renderYAML = () => {
    return (
      <Card>
        <CardBody>
          <CodeBlock>
            <CodeBlockCode>
              {JSON.stringify(resource, null, 2)}
            </CodeBlockCode>
          </CodeBlock>
        </CardBody>
      </Card>
    );
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <Title headingLevel="h2" size="lg" style={{ marginTop: '1rem' }}>
            Loading resource...
          </Title>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection isFilled>
        <Button
          variant="link"
          icon={<ArrowLeftIcon />}
          onClick={() => navigate(`/kubernetes?view=${resourceType}`)}
          style={{ marginBottom: '1rem' }}
        >
          Back to {resourceType}
        </Button>
        <Alert variant="danger" title="Error loading resource">
          {error}
        </Alert>
      </PageSection>
    );
  }

  return (
    <div className="k8s-detail-container">
      {/* Header */}
      <PageSection variant="light" className="k8s-detail-header">
        <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
          <Button
            variant="plain"
            icon={<ArrowLeftIcon />}
            onClick={() => navigate(`/kubernetes?view=${resourceType}`)}
            aria-label="Go back"
          />
          <Divider orientation={{ default: 'vertical' }} style={{ height: '32px' }} />
          <span style={{ fontSize: '2rem' }}>☸️</span>
          <div>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
              <Title headingLevel="h1" size="2xl">
                {resource?.metadata?.name}
              </Title>
              {resource?.status?.phase && (
                <Label color={getStatusColor(resource.status.phase)} icon={getStatusIcon(resource.status.phase)}>
                  {resource.status.phase}
                </Label>
              )}
            </Flex>
            <Content style={{ marginTop: '4px' }}>
              <Label color="blue" isCompact>{resourceType}</Label>
              {namespace !== '_cluster' && (
                <Label color="grey" isCompact style={{ marginLeft: '8px' }}>
                  {namespace}
                </Label>
              )}
            </Content>
          </div>
          <FlexItem align={{ default: 'alignRight' }}>
            <Button
              variant="secondary"
              icon={<SyncAltIcon />}
              onClick={fetchResource}
            >
              Refresh
            </Button>
          </FlexItem>
        </Flex>
      </PageSection>
      
      {/* Tabs */}
      <PageSection style={{ paddingTop: 0 }}>
        <Tabs activeKey={activeTab} onSelect={(e, key) => setActiveTab(key)} style={{ marginBottom: '1rem' }}>
          <Tab eventKey="overview" title={<TabTitleText>Overview</TabTitleText>} />
          <Tab eventKey="metadata" title={<TabTitleText>Metadata</TabTitleText>} />
          <Tab eventKey="events" title={<TabTitleText>Events ({events.length})</TabTitleText>} />
          <Tab eventKey="yaml" title={<TabTitleText>YAML</TabTitleText>} />
        </Tabs>
        
        {activeTab === 'overview' && (
          <div className="k8s-detail-content">
            {renderSpecificDetails()}
          </div>
        )}
        
        {activeTab === 'metadata' && (
          <div className="k8s-detail-content">
            {renderMetadata()}
            <div style={{ marginTop: '1rem' }}>
              {renderLabels()}
            </div>
          </div>
        )}
        
        {activeTab === 'events' && (
          <div className="k8s-detail-content">
            {renderEvents()}
          </div>
        )}
        
        {activeTab === 'yaml' && (
          <div className="k8s-detail-content">
            {renderYAML()}
          </div>
        )}
      </PageSection>
    </div>
  );
};

export default KubernetesResourceDetail;
