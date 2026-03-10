import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  TextInput,
  Divider,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Tooltip,
  Tabs,
  Tab,
  TabTitleText,
  Panel,
  PanelMain,
  PanelMainBody,
  SearchInput
} from '@patternfly/react-core';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@patternfly/react-table';
import {
  CubesIcon,
  ServerIcon,
  LayerGroupIcon,
  CogIcon,
  DatabaseIcon,
  NetworkIcon,
  StorageDomainIcon,
  ShieldAltIcon,
  ClusterIcon,
  CloudIcon,
  SyncAltIcon,
  SearchIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TimesCircleIcon,
  OutlinedClockIcon,
  BellIcon,
  PluggedIcon,
  LockIcon,
  KeyIcon,
  FolderIcon,
  AngleRightIcon,
  HomeIcon
} from '@patternfly/react-icons';

// Kubernetes resource categories and their API endpoints
const K8S_RESOURCES = {
  workloads: {
    label: 'Workloads',
    icon: <CubesIcon />,
    items: [
      { id: 'pods', label: 'Pods', apiVersion: 'v1', kind: 'pods', namespaced: true },
      { id: 'deployments', label: 'Deployments', apiVersion: 'apps/v1', kind: 'deployments', namespaced: true },
      { id: 'replicasets', label: 'ReplicaSets', apiVersion: 'apps/v1', kind: 'replicasets', namespaced: true },
      { id: 'statefulsets', label: 'StatefulSets', apiVersion: 'apps/v1', kind: 'statefulsets', namespaced: true },
      { id: 'daemonsets', label: 'DaemonSets', apiVersion: 'apps/v1', kind: 'daemonsets', namespaced: true },
      { id: 'jobs', label: 'Jobs', apiVersion: 'batch/v1', kind: 'jobs', namespaced: true },
      { id: 'cronjobs', label: 'CronJobs', apiVersion: 'batch/v1', kind: 'cronjobs', namespaced: true }
    ]
  },
  networking: {
    label: 'Networking',
    icon: <NetworkIcon />,
    items: [
      { id: 'services', label: 'Services', apiVersion: 'v1', kind: 'services', namespaced: true },
      { id: 'ingresses', label: 'Ingresses', apiVersion: 'networking.k8s.io/v1', kind: 'ingresses', namespaced: true },
      { id: 'networkpolicies', label: 'Network Policies', apiVersion: 'networking.k8s.io/v1', kind: 'networkpolicies', namespaced: true },
      { id: 'endpoints', label: 'Endpoints', apiVersion: 'v1', kind: 'endpoints', namespaced: true }
    ]
  },
  storage: {
    label: 'Storage',
    icon: <StorageDomainIcon />,
    items: [
      { id: 'persistentvolumeclaims', label: 'PVCs', apiVersion: 'v1', kind: 'persistentvolumeclaims', namespaced: true },
      { id: 'persistentvolumes', label: 'PVs', apiVersion: 'v1', kind: 'persistentvolumes', namespaced: false },
      { id: 'storageclasses', label: 'Storage Classes', apiVersion: 'storage.k8s.io/v1', kind: 'storageclasses', namespaced: false },
      { id: 'configmaps', label: 'ConfigMaps', apiVersion: 'v1', kind: 'configmaps', namespaced: true },
      { id: 'secrets', label: 'Secrets', apiVersion: 'v1', kind: 'secrets', namespaced: true }
    ]
  },
  cluster: {
    label: 'Cluster',
    icon: <ClusterIcon />,
    items: [
      { id: 'nodes', label: 'Nodes', apiVersion: 'v1', kind: 'nodes', namespaced: false },
      { id: 'namespaces', label: 'Namespaces', apiVersion: 'v1', kind: 'namespaces', namespaced: false },
      { id: 'events', label: 'Events', apiVersion: 'v1', kind: 'events', namespaced: true }
    ]
  },
  security: {
    label: 'Security',
    icon: <ShieldAltIcon />,
    items: [
      { id: 'serviceaccounts', label: 'Service Accounts', apiVersion: 'v1', kind: 'serviceaccounts', namespaced: true },
      { id: 'roles', label: 'Roles', apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'roles', namespaced: true },
      { id: 'rolebindings', label: 'Role Bindings', apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'rolebindings', namespaced: true },
      { id: 'clusterroles', label: 'Cluster Roles', apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'clusterroles', namespaced: false },
      { id: 'clusterrolebindings', label: 'Cluster Role Bindings', apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'clusterrolebindings', namespaced: false }
    ]
  }
};

// Flatten resources for search
const ALL_RESOURCES = Object.values(K8S_RESOURCES).flatMap(category =>
  category.items.map(item => ({ ...item, category: category.label }))
);

// Status icons
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

  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  if (diffMins > 0) return `${diffMins}m`;
  return `${diffSecs}s`;
};

const Kubernetes = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Connection state
  const [connectionConfig, setConnectionConfig] = useState({
    apiServer: '',
    token: '',
    caCert: ''
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [clusterInfo, setClusterInfo] = useState(null);
  
  // View state
  const [activeView, setActiveView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(['workloads', 'cluster']);
  
  // Resource data state
  const [resources, setResources] = useState([]);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState(null);
  
  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState(null);
  
  // Namespace filter
  const [namespaces, setNamespaces] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('all');

  // Check initial connection and load saved config
  useEffect(() => {
    checkConnection();
  }, []);

  // Load view from URL params
  useEffect(() => {
    const view = searchParams.get('view') || 'dashboard';
    setActiveView(view);
  }, [searchParams]);

  // Fetch resources when view changes
  useEffect(() => {
    if (isConnected && activeView !== 'dashboard') {
      fetchResources(activeView);
    } else if (isConnected && activeView === 'dashboard') {
      fetchDashboardStats();
    }
  }, [isConnected, activeView, selectedNamespace]);

  const checkConnection = async () => {
    try {
      const res = await fetch('/api/kubernetes/status');
      const data = await res.json();
      if (data.connected) {
        setIsConnected(true);
        setClusterInfo(data.clusterInfo);
        setConnectionConfig({
          apiServer: data.apiServer || '',
          token: '',
          caCert: ''
        });
        fetchNamespaces();
      }
    } catch (err) {
      console.error('Error checking k8s connection:', err);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    // Auto-format API server URL if user just enters an IP
    let apiServer = connectionConfig.apiServer.trim();
    if (apiServer && !apiServer.startsWith('http://') && !apiServer.startsWith('https://')) {
      // If it looks like just an IP address, add https:// and :8443
      if (/^[\d.]+$/.test(apiServer) || /^[\d.]+:\d+$/.test(apiServer)) {
        if (!apiServer.includes(':')) {
          apiServer = `https://${apiServer}:8443`;
        } else {
          apiServer = `https://${apiServer}`;
        }
        setConnectionConfig(prev => ({ ...prev, apiServer }));
      }
    }
    
    try {
      const res = await fetch('/api/kubernetes/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...connectionConfig, apiServer })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setIsConnected(true);
        setClusterInfo(data.clusterInfo);
        fetchNamespaces();
      } else {
        setConnectionError(data.error || 'Failed to connect to cluster');
      }
    } catch (err) {
      setConnectionError('Failed to connect: ' + err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchNamespaces = async () => {
    try {
      const res = await fetch('/api/kubernetes/resources/namespaces');
      const data = await res.json();
      if (data.success) {
        setNamespaces(data.items?.map(ns => ns.metadata?.name) || []);
      }
    } catch (err) {
      console.error('Error fetching namespaces:', err);
    }
  };

  const fetchDashboardStats = async () => {
    setResourceLoading(true);
    try {
      const res = await fetch('/api/kubernetes/dashboard');
      const data = await res.json();
      if (data.success) {
        setDashboardStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setResourceLoading(false);
    }
  };

  const fetchResources = async (resourceType) => {
    setResourceLoading(true);
    setResourceError(null);
    
    const resourceConfig = ALL_RESOURCES.find(r => r.id === resourceType);
    if (!resourceConfig) {
      setResourceLoading(false);
      return;
    }
    
    try {
      const namespace = resourceConfig.namespaced && selectedNamespace !== 'all' 
        ? `?namespace=${selectedNamespace}` 
        : '';
      const res = await fetch(`/api/kubernetes/resources/${resourceType}${namespace}`);
      const data = await res.json();
      
      if (data.success) {
        setResources(data.items || []);
      } else {
        setResourceError(data.error || 'Failed to fetch resources');
        setResources([]);
      }
    } catch (err) {
      setResourceError('Failed to fetch resources: ' + err.message);
      setResources([]);
    } finally {
      setResourceLoading(false);
    }
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setSearchParams({ view });
  };

  const handleResourceClick = (resource) => {
    const resourceType = activeView;
    const name = resource.metadata?.name;
    const namespace = resource.metadata?.namespace || '_cluster';
    navigate(`/kubernetes/${resourceType}/${namespace}/${name}`);
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Filter resources for search
  const filteredResources = searchTerm
    ? ALL_RESOURCES.filter(r => 
        r.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const currentResourceConfig = ALL_RESOURCES.find(r => r.id === activeView);

  // Get columns for current resource type
  const getResourceColumns = () => {
    switch (activeView) {
      case 'pods':
        return ['Name', 'Namespace', 'Status', 'Ready', 'Restarts', 'Age', 'Node'];
      case 'deployments':
        return ['Name', 'Namespace', 'Ready', 'Up-to-date', 'Available', 'Age'];
      case 'services':
        return ['Name', 'Namespace', 'Type', 'Cluster IP', 'Ports', 'Age'];
      case 'nodes':
        return ['Name', 'Status', 'Roles', 'Age', 'Version'];
      case 'namespaces':
        return ['Name', 'Status', 'Age'];
      case 'persistentvolumeclaims':
        return ['Name', 'Namespace', 'Status', 'Volume', 'Capacity', 'Access Modes', 'Age'];
      case 'configmaps':
      case 'secrets':
        return ['Name', 'Namespace', 'Data', 'Age'];
      case 'ingresses':
        return ['Name', 'Namespace', 'Hosts', 'Address', 'Age'];
      default:
        return ['Name', 'Namespace', 'Age'];
    }
  };

  // Get row data for current resource type
  const getResourceRow = (resource) => {
    const meta = resource.metadata || {};
    const status = resource.status || {};
    const spec = resource.spec || {};
    
    switch (activeView) {
      case 'pods': {
        const containerStatuses = status.containerStatuses || [];
        const readyCount = containerStatuses.filter(c => c.ready).length;
        const totalCount = containerStatuses.length || spec.containers?.length || 0;
        const restarts = containerStatuses.reduce((sum, c) => sum + (c.restartCount || 0), 0);
        const phase = status.phase || 'Unknown';
        
        return [
          meta.name,
          meta.namespace,
          <Label key="status" color={getStatusColor(phase)} icon={getStatusIcon(phase)}>{phase}</Label>,
          `${readyCount}/${totalCount}`,
          restarts.toString(),
          formatAge(meta.creationTimestamp),
          spec.nodeName || '-'
        ];
      }
      case 'deployments': {
        const replicas = status.replicas || 0;
        const ready = status.readyReplicas || 0;
        const updated = status.updatedReplicas || 0;
        const available = status.availableReplicas || 0;
        
        return [
          meta.name,
          meta.namespace,
          `${ready}/${replicas}`,
          updated.toString(),
          available.toString(),
          formatAge(meta.creationTimestamp)
        ];
      }
      case 'services': {
        const ports = spec.ports?.map(p => `${p.port}${p.nodePort ? `:${p.nodePort}` : ''}/${p.protocol || 'TCP'}`).join(', ') || '-';
        
        return [
          meta.name,
          meta.namespace,
          spec.type || 'ClusterIP',
          spec.clusterIP || '-',
          ports,
          formatAge(meta.creationTimestamp)
        ];
      }
      case 'nodes': {
        const conditions = status.conditions || [];
        const readyCondition = conditions.find(c => c.type === 'Ready');
        const nodeStatus = readyCondition?.status === 'True' ? 'Ready' : 'NotReady';
        const roles = Object.keys(meta.labels || {})
          .filter(l => l.startsWith('node-role.kubernetes.io/'))
          .map(l => l.replace('node-role.kubernetes.io/', ''))
          .join(', ') || 'none';
        
        return [
          meta.name,
          <Label key="status" color={getStatusColor(nodeStatus)} icon={getStatusIcon(nodeStatus)}>{nodeStatus}</Label>,
          roles,
          formatAge(meta.creationTimestamp),
          status.nodeInfo?.kubeletVersion || '-'
        ];
      }
      case 'namespaces': {
        const phase = status.phase || 'Active';
        return [
          meta.name,
          <Label key="status" color={getStatusColor(phase)} icon={getStatusIcon(phase)}>{phase}</Label>,
          formatAge(meta.creationTimestamp)
        ];
      }
      case 'persistentvolumeclaims': {
        const accessModes = spec.accessModes?.join(', ') || '-';
        return [
          meta.name,
          meta.namespace,
          <Label key="status" color={getStatusColor(status.phase)}>{status.phase}</Label>,
          status.volumeName || '-',
          status.capacity?.storage || spec.resources?.requests?.storage || '-',
          accessModes,
          formatAge(meta.creationTimestamp)
        ];
      }
      case 'configmaps':
      case 'secrets': {
        const dataCount = Object.keys(resource.data || {}).length;
        return [
          meta.name,
          meta.namespace,
          `${dataCount} items`,
          formatAge(meta.creationTimestamp)
        ];
      }
      case 'ingresses': {
        const hosts = spec.rules?.map(r => r.host).filter(Boolean).join(', ') || '-';
        const addresses = status.loadBalancer?.ingress?.map(i => i.ip || i.hostname).join(', ') || '-';
        return [
          meta.name,
          meta.namespace,
          hosts,
          addresses,
          formatAge(meta.creationTimestamp)
        ];
      }
      default:
        return [
          meta.name,
          meta.namespace || '-',
          formatAge(meta.creationTimestamp)
        ];
    }
  };

  // Connection form
  if (!isConnected) {
    return (
      <div className="k8s-connection-container">
        <div className="k8s-connection-card">
          <div className="k8s-connection-header">
            <span className="k8s-connection-icon">☸️</span>
            <Title headingLevel="h1" size="2xl">
              Connect to Kubernetes
            </Title>
            <Content>
              Connect to a Kubernetes cluster to explore its resources
            </Content>
          </div>
          
          {connectionError && (
            <Alert variant="danger" title="Connection failed" style={{ marginBottom: '1.5rem' }}>
              {connectionError}
            </Alert>
          )}
          
          <div className="k8s-connection-form">
            <div className="k8s-form-group">
              <label htmlFor="api-server">API Server URL</label>
              <TextInput
                id="api-server"
                value={connectionConfig.apiServer}
                onChange={(e, val) => setConnectionConfig(prev => ({ ...prev, apiServer: val }))}
                placeholder="https://localhost:6443 or https://kubernetes.default.svc"
              />
              <span className="k8s-form-hint">
                For Minikube, run: <code>minikube ip</code> and use <code>https://&lt;ip&gt;:8443</code>
              </span>
            </div>
            
            <div className="k8s-form-group">
              <label htmlFor="token">Bearer Token (optional)</label>
              <TextInput
                id="token"
                type="password"
                value={connectionConfig.token}
                onChange={(e, val) => setConnectionConfig(prev => ({ ...prev, token: val }))}
                placeholder="Service account token or kubeconfig token"
              />
              <span className="k8s-form-hint">
                Leave empty to use default kubeconfig or in-cluster config
              </span>
            </div>
            
            <Button
              variant="primary"
              onClick={handleConnect}
              isLoading={isConnecting}
              isDisabled={!connectionConfig.apiServer || isConnecting}
              size="lg"
              className="k8s-connect-btn"
            >
              {isConnecting ? 'Connecting...' : 'Connect to Cluster'}
            </Button>
            
            <Divider style={{ margin: '1.5rem 0' }} />
            
            <div className="k8s-quick-connect">
              <Content style={{ marginBottom: '1rem', textAlign: 'center' }}>
                <strong>Quick Connect Options:</strong>
              </Content>
              <Flex justifyContent={{ default: 'justifyContentCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
                <Button
                  variant="secondary"
                  onClick={() => setConnectionConfig(prev => ({ ...prev, apiServer: 'http://localhost:8001' }))}
                >
                  kubectl proxy
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    // Try to auto-detect minikube
                    setConnectionConfig(prev => ({ ...prev, apiServer: 'https://192.168.49.2:8443' }));
                  }}
                >
                  Minikube
                </Button>
              </Flex>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main view with sidebar and content
  return (
    <div className="k8s-container">
      {/* Left Sidebar Navigation */}
      <div className="k8s-sidebar">
        {/* Cluster info header */}
        <div className="k8s-sidebar-header">
          <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
            <span style={{ fontSize: '1.5rem' }}>☸️</span>
            <div>
              <div className="k8s-cluster-name">
                {clusterInfo?.name || 'Kubernetes'}
              </div>
              <div className="k8s-cluster-version">
                {clusterInfo?.version || 'Connected'}
              </div>
            </div>
          </Flex>
          <Tooltip content="Refresh connection">
            <Button
              variant="plain"
              onClick={checkConnection}
              style={{ padding: '4px' }}
            >
              <SyncAltIcon />
            </Button>
          </Tooltip>
        </div>
        
        {/* Search */}
        <div className="k8s-search-wrapper">
          <SearchInput
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e, val) => setSearchTerm(val)}
            onClear={() => setSearchTerm('')}
          />
          
          {/* Search results dropdown */}
          {searchTerm && filteredResources.length > 0 && (
            <div className="k8s-search-results">
              {filteredResources.map(resource => (
                <div
                  key={resource.id}
                  className="k8s-search-result-item"
                  onClick={() => {
                    handleViewChange(resource.id);
                    setSearchTerm('');
                  }}
                >
                  <span>{resource.label}</span>
                  <Badge isRead>{resource.category}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Navigation items */}
        <div className="k8s-nav-items">
          {/* Dashboard */}
          <div
            className={`k8s-nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleViewChange('dashboard')}
          >
            <HomeIcon />
            <span>Dashboard</span>
          </div>
          
          <Divider style={{ margin: '8px 0' }} />
          
          {/* Resource categories */}
          {Object.entries(K8S_RESOURCES).map(([categoryId, category]) => (
            <div key={categoryId} className="k8s-nav-category">
              <div
                className="k8s-nav-category-header"
                onClick={() => toggleCategory(categoryId)}
              >
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  {category.icon}
                  <span>{category.label}</span>
                </Flex>
                <AngleRightIcon 
                  className={`k8s-nav-category-arrow ${expandedCategories.includes(categoryId) ? 'expanded' : ''}`}
                />
              </div>
              
              {expandedCategories.includes(categoryId) && (
                <div className="k8s-nav-category-items">
                  {category.items.map(item => (
                    <div
                      key={item.id}
                      className={`k8s-nav-item ${activeView === item.id ? 'active' : ''}`}
                      onClick={() => handleViewChange(item.id)}
                    >
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* API Server info - editable */}
        <div className="k8s-api-info">
          <label>API Server</label>
          <div className="k8s-api-input-wrapper">
            <TextInput
              value={connectionConfig.apiServer}
              onChange={(e, val) => setConnectionConfig(prev => ({ ...prev, apiServer: val }))}
              placeholder="192.168.49.2"
              aria-label="API Server IP"
            />
            <Tooltip content="Reconnect with new IP">
              <Button
                variant="plain"
                onClick={handleConnect}
                isLoading={isConnecting}
                className="k8s-reconnect-btn"
              >
                <SyncAltIcon />
              </Button>
            </Tooltip>
          </div>
        </div>
        
        {/* Namespace filter at bottom */}
        <div className="k8s-namespace-filter">
          <label>Namespace</label>
          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
          >
            <option value="all">All Namespaces</option>
            {namespaces.map(ns => (
              <option key={ns} value={ns}>{ns}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="k8s-content">
        {activeView === 'dashboard' ? (
          /* Dashboard View */
          <div className="k8s-dashboard">
            <PageSection variant="light" className="k8s-page-header">
              <Title headingLevel="h1" size="2xl">
                Cluster Dashboard
              </Title>
              <Content>
                Overview of your Kubernetes cluster resources
              </Content>
            </PageSection>
            
            <PageSection>
              {resourceLoading ? (
                <EmptyState>
                  <Spinner size="xl" />
                  <Title headingLevel="h3" size="lg" style={{ marginTop: '1rem' }}>
                    Loading cluster status...
                  </Title>
                </EmptyState>
              ) : dashboardStats ? (
                <div className="k8s-dashboard-grid">
                  {/* Nodes card */}
                  <Card className="k8s-stat-card">
                    <CardBody>
                      <div className="k8s-stat-header">
                        <ServerIcon className="k8s-stat-icon nodes" />
                        <span>Nodes</span>
                      </div>
                      <div className="k8s-stat-value">{dashboardStats.nodes?.total || 0}</div>
                      <div className="k8s-stat-detail">
                        <span className="ready">{dashboardStats.nodes?.ready || 0} Ready</span>
                      </div>
                    </CardBody>
                  </Card>
                  
                  {/* Pods card */}
                  <Card className="k8s-stat-card">
                    <CardBody>
                      <div className="k8s-stat-header">
                        <CubesIcon className="k8s-stat-icon pods" />
                        <span>Pods</span>
                      </div>
                      <div className="k8s-stat-value">{dashboardStats.pods?.total || 0}</div>
                      <div className="k8s-stat-detail">
                        <span className="ready">{dashboardStats.pods?.running || 0} Running</span>
                        {dashboardStats.pods?.pending > 0 && (
                          <span className="pending">{dashboardStats.pods.pending} Pending</span>
                        )}
                      </div>
                    </CardBody>
                  </Card>
                  
                  {/* Deployments card */}
                  <Card className="k8s-stat-card">
                    <CardBody>
                      <div className="k8s-stat-header">
                        <LayerGroupIcon className="k8s-stat-icon deployments" />
                        <span>Deployments</span>
                      </div>
                      <div className="k8s-stat-value">{dashboardStats.deployments?.total || 0}</div>
                      <div className="k8s-stat-detail">
                        <span className="ready">{dashboardStats.deployments?.available || 0} Available</span>
                      </div>
                    </CardBody>
                  </Card>
                  
                  {/* Services card */}
                  <Card className="k8s-stat-card">
                    <CardBody>
                      <div className="k8s-stat-header">
                        <NetworkIcon className="k8s-stat-icon services" />
                        <span>Services</span>
                      </div>
                      <div className="k8s-stat-value">{dashboardStats.services?.total || 0}</div>
                      <div className="k8s-stat-detail">
                        <span>{dashboardStats.services?.loadBalancer || 0} LoadBalancer</span>
                      </div>
                    </CardBody>
                  </Card>
                  
                  {/* PVCs card */}
                  <Card className="k8s-stat-card">
                    <CardBody>
                      <div className="k8s-stat-header">
                        <StorageDomainIcon className="k8s-stat-icon storage" />
                        <span>PVCs</span>
                      </div>
                      <div className="k8s-stat-value">{dashboardStats.pvcs?.total || 0}</div>
                      <div className="k8s-stat-detail">
                        <span className="ready">{dashboardStats.pvcs?.bound || 0} Bound</span>
                      </div>
                    </CardBody>
                  </Card>
                  
                  {/* Namespaces card */}
                  <Card className="k8s-stat-card">
                    <CardBody>
                      <div className="k8s-stat-header">
                        <FolderIcon className="k8s-stat-icon namespaces" />
                        <span>Namespaces</span>
                      </div>
                      <div className="k8s-stat-value">{dashboardStats.namespaces?.total || 0}</div>
                      <div className="k8s-stat-detail">
                        <span className="ready">{dashboardStats.namespaces?.active || 0} Active</span>
                      </div>
                    </CardBody>
                  </Card>
                </div>
              ) : (
                <Alert variant="info" title="No data available">
                  Unable to fetch cluster statistics. Please check your connection.
                </Alert>
              )}
            </PageSection>
          </div>
        ) : (
          /* Resource List View */
          <div className="k8s-resource-view">
            <PageSection variant="light" className="k8s-page-header">
              <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                <FlexItem>
                  <Title headingLevel="h1" size="2xl">
                    {currentResourceConfig?.label || activeView}
                  </Title>
                  <Content>
                    {currentResourceConfig?.apiVersion} / {currentResourceConfig?.kind}
                  </Content>
                </FlexItem>
                <FlexItem>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
                    <Badge>{resources.length} resources</Badge>
                    <Button
                      variant="secondary"
                      icon={<SyncAltIcon />}
                      onClick={() => fetchResources(activeView)}
                      isLoading={resourceLoading}
                    >
                      Refresh
                    </Button>
                  </Flex>
                </FlexItem>
              </Flex>
            </PageSection>
            
            <PageSection isFilled className="k8s-table-section">
              {resourceLoading ? (
                <EmptyState>
                  <Spinner size="xl" />
                  <Title headingLevel="h3" size="lg" style={{ marginTop: '1rem' }}>
                    Loading {currentResourceConfig?.label}...
                  </Title>
                </EmptyState>
              ) : resourceError ? (
                <Alert variant="danger" title="Error loading resources">
                  {resourceError}
                </Alert>
              ) : resources.length === 0 ? (
                <EmptyState>
                  <CubesIcon size="xl" />
                  <Title headingLevel="h3" size="lg">
                    No {currentResourceConfig?.label} found
                  </Title>
                  <EmptyStateBody>
                    {selectedNamespace !== 'all' 
                      ? `No ${currentResourceConfig?.label} in namespace "${selectedNamespace}"`
                      : `No ${currentResourceConfig?.label} found in the cluster`
                    }
                  </EmptyStateBody>
                </EmptyState>
              ) : (
                <Card>
                  <Table aria-label="Resources table" variant="compact">
                    <Thead>
                      <Tr>
                        {getResourceColumns().map((col, idx) => (
                          <Th key={idx}>{col}</Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {resources.map((resource, rowIdx) => (
                        <Tr
                          key={resource.metadata?.uid || rowIdx}
                          className="k8s-table-row"
                          onClick={() => handleResourceClick(resource)}
                          isClickable
                        >
                          {getResourceRow(resource).map((cell, cellIdx) => (
                            <Td key={cellIdx}>{cell}</Td>
                          ))}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Card>
              )}
            </PageSection>
          </div>
        )}
      </div>
    </div>
  );
};

export default Kubernetes;
