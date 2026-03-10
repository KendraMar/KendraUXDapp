import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageSection,
  Drawer,
  DrawerContent,
  DrawerPanelContent,
  DrawerHead,
  DrawerActions,
  DrawerCloseButton,
  DrawerPanelBody,
  Title,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Dropdown,
  DropdownItem,
  DropdownList,
  DropdownGroup,
  MenuToggle,
  Divider,
  Button,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Flex,
  FlexItem,
  Breadcrumb,
  BreadcrumbItem,
  Label
} from '@patternfly/react-core';
import { 
  OutlinedWindowRestoreIcon, 
  CommentIcon, 
  ArrowLeftIcon,
  ExternalLinkAltIcon,
  CubesIcon,
  CrosshairsIcon,
  HistoryIcon,
  PlayIcon,
  StopIcon,
  SyncAltIcon
} from '@patternfly/react-icons';
import PrototypeContextPanel from './components/PrototypeContextPanel';
import PrototypeDiscussionsPanel from './components/PrototypeDiscussionsPanel';

// Product options
const productOptions = [
  { key: 'acm', label: 'ACM', description: 'Red Hat Advanced Cluster Management for Kubernetes' },
  { key: 'acs', label: 'ACS', description: 'Red Hat Advanced Cluster Security for Kubernetes' },
  { key: 'ansible', label: 'Ansible', description: 'Red Hat Ansible Automation Platform' },
  { key: 'consoledot', label: 'ConsoleDot', description: 'Red Hat ConsoleDot' },
  { key: 'openshift', label: 'OCP', description: 'Red Hat OpenShift Container Platform' },
  { key: 'openshift-virtualization', label: 'OCP Virt', description: 'Red Hat OpenShift Virtualization' },
  { key: 'rhdh', label: 'RHDH', description: 'Red Hat Developer Hub' },
  { key: 'rhel', label: 'RHEL', description: 'Red Hat Enterprise Linux' },
  { key: 'rhoai', label: 'RHOAI', description: 'Red Hat OpenShift AI' }
];

// Release option groups
const releaseOptionGroups = [
  {
    groupLabel: 'Prototypes',
    options: [
      { key: '3.0', label: '3.0' },
      { key: '3.1', label: '3.1' },
      { key: '3.next', label: '3.next' }
    ]
  },
  {
    groupLabel: 'Upstreams',
    options: [
      { key: 'odh-dashboard', label: 'ODH Dashboard', description: 'red-hat-data-services/odh-dashboard' }
    ]
  }
];

const PrototypeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [prototype, setPrototype] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Drawer state
  const [isLeftDrawerExpanded, setIsLeftDrawerExpanded] = useState(false);
  const [isRightDrawerExpanded, setIsRightDrawerExpanded] = useState(false);
  
  // Switcher state
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isReleaseDropdownOpen, setIsReleaseDropdownOpen] = useState(false);
  const [isIterationDropdownOpen, setIsIterationDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('RHOAI');
  const [selectedRelease, setSelectedRelease] = useState('3.0');
  const [selectedIteration, setSelectedIteration] = useState('v1');
  const [selectedScope, setSelectedScope] = useState('All');
  
  // Selection mode state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);
  
  // Dynamic title from iframe
  const [iframeTitle, setIframeTitle] = useState('');
  
  // Server process state
  const [serverStatus, setServerStatus] = useState(null); // null, 'starting', 'running', 'stopping', 'stopped', 'error'
  const [serverPort, setServerPort] = useState(null);
  const [serverUrl, setServerUrl] = useState(null);
  const [serverLoading, setServerLoading] = useState(false);
  const [allProcesses, setAllProcesses] = useState([]);
  
  const iframeRef = useRef(null);
  const activityIntervalRef = useRef(null);

  // Add class to page main for full-height layout
  useEffect(() => {
    const pageMain = document.querySelector('.pf-v6-c-page__main');
    if (pageMain) {
      pageMain.classList.add('prototype-viewer-page');
    }
    return () => {
      if (pageMain) {
        pageMain.classList.remove('prototype-viewer-page');
      }
    };
  }, []);

  useEffect(() => {
    fetchPrototype();
    fetchServerStatus();
    fetchAllProcesses();
  }, [id]);

  // Poll server status periodically when running
  useEffect(() => {
    if (serverStatus === 'running' || serverStatus === 'starting') {
      const interval = setInterval(() => {
        fetchServerStatus();
      }, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [serverStatus, id]);

  // Send activity ping to keep server alive
  useEffect(() => {
    if (serverStatus === 'running') {
      activityIntervalRef.current = setInterval(() => {
        fetch(`/api/prototypes/${id}/process/touch`, { method: 'POST' });
      }, 60000); // Ping every minute
      return () => {
        if (activityIntervalRef.current) {
          clearInterval(activityIntervalRef.current);
        }
      };
    }
  }, [serverStatus, id]);

  // Handle postMessage communication with iframe
  useEffect(() => {
    const handleMessage = (event) => {
      // Accept messages from localhost origins
      if (!event.origin.startsWith('http://localhost:') && !event.origin.startsWith('https://localhost:')) {
        return;
      }

      // Handle title updates from iframe
      if (event.data && event.data.type === 'TITLE_UPDATE' && event.data.title) {
        setIframeTitle(event.data.title);
      }

      // Handle element selection from iframe
      if (event.data && event.data.type === 'ELEMENT_SELECTED' && event.data.element) {
        setSelectedElement(event.data.element);
        console.log('Element selected:', event.data.element);
      }

      // Handle bridge ready confirmation
      if (event.data && event.data.type === 'SELECTION_BRIDGE_READY') {
        console.log('Selection bridge ready in iframe');
        // Send current selection mode state
        if (iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { type: 'SELECTION_MODE_UPDATE', isSelectMode },
            '*'
          );
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Request initial title when iframe loads
    const handleIframeLoad = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'REQUEST_TITLE' },
          '*'
        );
        // Send current selection mode state
        iframeRef.current.contentWindow.postMessage(
          { type: 'SELECTION_MODE_UPDATE', isSelectMode },
          '*'
        );
      }
    };

    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
      }
    };
  }, [isSelectMode]);

  // Send selection mode updates to iframe when it changes
  useEffect(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'SELECTION_MODE_UPDATE', isSelectMode },
        '*'
      );
    }
  }, [isSelectMode]);

  const fetchPrototype = async () => {
    try {
      const response = await fetch(`/api/prototypes/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setPrototype(data.prototype);
        setSelectedProduct(data.prototype.product?.label || 'RHOAI');
        setSelectedRelease(data.prototype.release?.label || '3.0');
        setSelectedScope(data.prototype.scope?.selected || 'All');
      } else {
        setError(data.error || 'Prototype not found');
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching prototype:', err);
      setError('Failed to load prototype');
      setLoading(false);
    }
  };

  const fetchServerStatus = async () => {
    try {
      const response = await fetch(`/api/prototypes/${id}/process`);
      const data = await response.json();
      
      if (data.success) {
        if (data.process) {
          setServerStatus(data.process.status);
          setServerPort(data.process.port);
          setServerUrl(data.process.url);
        } else {
          setServerStatus('stopped');
          setServerPort(null);
          setServerUrl(null);
        }
      }
    } catch (err) {
      console.error('Error fetching server status:', err);
    }
  };

  const fetchAllProcesses = async () => {
    try {
      const response = await fetch('/api/prototypes/processes/list');
      const data = await response.json();
      
      if (data.success) {
        setAllProcesses(data.processes);
      }
    } catch (err) {
      console.error('Error fetching all processes:', err);
    }
  };

  const handleStartServer = async () => {
    setServerLoading(true);
    try {
      const response = await fetch(`/api/prototypes/${id}/process/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      
      if (data.success) {
        setServerStatus('starting');
        setServerPort(data.port);
        setServerUrl(data.url);
        // Poll for running status
        setTimeout(fetchServerStatus, 2000);
        setTimeout(fetchAllProcesses, 2000);
      } else {
        alert(data.error || 'Failed to start server');
      }
    } catch (err) {
      console.error('Error starting server:', err);
      alert('Failed to start server');
    }
    setServerLoading(false);
  };

  const handleStopServer = async () => {
    setServerLoading(true);
    try {
      const response = await fetch(`/api/prototypes/${id}/process/stop`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setServerStatus('stopped');
        setServerPort(null);
        setServerUrl(null);
        fetchAllProcesses();
      } else {
        alert(data.error || 'Failed to stop server');
      }
    } catch (err) {
      console.error('Error stopping server:', err);
      alert('Failed to stop server');
    }
    setServerLoading(false);
  };

  const handleProductSelect = (option) => {
    setSelectedProduct(option.label);
    setIsProductDropdownOpen(false);
  };

  const handleReleaseSelect = (option) => {
    setSelectedRelease(option.label);
    setIsReleaseDropdownOpen(false);
  };

  const handleIterationSelect = (iteration) => {
    setSelectedIteration(iteration);
    setIsIterationDropdownOpen(false);
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) {
      setSelectedElement(null);
    }
  };

  const handleScopeChange = (scope) => {
    setSelectedScope(scope);
  };

  const handleAddComment = async (threadId, content) => {
    try {
      const response = await fetch(`/api/prototypes/${id}/discussions/${threadId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, author: 'You' })
      });
      
      if (response.ok) {
        // Refresh prototype data to get updated discussions
        fetchPrototype();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  if (loading) {
    return (
      <PageSection isFilled style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading prototype...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error || !prototype) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <CubesIcon size="xl" />
          <Title headingLevel="h2" size="lg">Prototype Not Found</Title>
          <EmptyStateBody>{error || 'The requested prototype could not be found.'}</EmptyStateBody>
          <Button variant="primary" onClick={() => navigate('/prototypes')}>
            Back to Prototypes
          </Button>
        </EmptyState>
      </PageSection>
    );
  }

  const embedUrl = prototype.embed?.url || 'http://localhost:1225';
  
  // Use the dynamic server URL if the server is running, otherwise use the configured embed URL
  const actualEmbedUrl = (serverStatus === 'running' && serverUrl) ? serverUrl : embedUrl;

  return (
    <div className="prototype-viewer" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar with switchers */}
      <div style={{ 
        borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
        backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
      }}>
        <Toolbar isFullHeight style={{ padding: '0 16px' }}>
          <ToolbarContent>
            <ToolbarGroup variant="action-group-plain">
              {/* Context drawer toggle */}
              <ToolbarItem>
                <Button
                  variant="plain"
                  aria-label="Toggle context panel"
                  aria-pressed={isLeftDrawerExpanded}
                  onClick={() => setIsLeftDrawerExpanded(!isLeftDrawerExpanded)}
                >
                  <OutlinedWindowRestoreIcon />
                </Button>
              </ToolbarItem>
              
              {/* Breadcrumb / Back */}
              <ToolbarItem>
                <Breadcrumb>
                  <BreadcrumbItem>
                    <Button variant="link" isInline onClick={() => navigate('/prototypes')}>
                      Prototypes
                    </Button>
                  </BreadcrumbItem>
                  <BreadcrumbItem isActive>
                    {iframeTitle || prototype.name}
                  </BreadcrumbItem>
                </Breadcrumb>
              </ToolbarItem>
            </ToolbarGroup>

            <ToolbarGroup variant="action-group-plain">
              {/* Iteration switcher */}
              <ToolbarItem>
                <Dropdown
                  onOpenChange={(isOpen) => setIsIterationDropdownOpen(isOpen)}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsIterationDropdownOpen(!isIterationDropdownOpen)}
                      isExpanded={isIterationDropdownOpen}
                      variant="plainText"
                      icon={<HistoryIcon />}
                    >
                      {selectedIteration}
                    </MenuToggle>
                  )}
                  isOpen={isIterationDropdownOpen}
                >
                  <DropdownList>
                    {(prototype.iterations || ['v1']).map((iteration, index) => (
                      <DropdownItem
                        key={iteration}
                        onClick={() => handleIterationSelect(iteration)}
                        description={index === 0 ? 'Latest' : undefined}
                      >
                        {iteration}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
              </ToolbarItem>
            </ToolbarGroup>
            
            <ToolbarGroup variant="action-group-plain" align={{ default: 'alignEnd' }}>
              {/* Server control */}
              <ToolbarItem>
                <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                  {serverStatus === 'running' ? (
                    <>
                      <FlexItem>
                        <Label color="green" isCompact icon={<span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3E8635', display: 'inline-block' }} />}>
                          Running on port {serverPort}
                        </Label>
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="secondary"
                          isDanger
                          icon={<StopIcon />}
                          onClick={handleStopServer}
                          isLoading={serverLoading}
                          isDisabled={serverLoading}
                          size="sm"
                        >
                          Stop
                        </Button>
                      </FlexItem>
                    </>
                  ) : serverStatus === 'starting' ? (
                    <FlexItem>
                      <Label color="blue" isCompact icon={<SyncAltIcon className="pf-v6-u-icon-spin" />}>
                        Starting server...
                      </Label>
                    </FlexItem>
                  ) : (
                    <FlexItem>
                      <Button
                        variant="secondary"
                        icon={<PlayIcon />}
                        onClick={handleStartServer}
                        isLoading={serverLoading}
                        isDisabled={serverLoading}
                        size="sm"
                      >
                        Start Server
                      </Button>
                    </FlexItem>
                  )}
                  {allProcesses.length > 0 && (
                    <FlexItem>
                      <Label color="grey" isCompact>
                        {allProcesses.length}/3 servers
                      </Label>
                    </FlexItem>
                  )}
                </Flex>
              </ToolbarItem>
              
              <ToolbarItem variant="separator" />
              
              {/* Selection mode toggle */}
              <ToolbarItem>
                <Button
                  variant={isSelectMode ? 'primary' : 'secondary'}
                  icon={<CrosshairsIcon />}
                  onClick={toggleSelectMode}
                  aria-label="Toggle element selection mode"
                >
                  {isSelectMode ? 'Exit Selection' : 'Select Element'}
                </Button>
              </ToolbarItem>
              
              {/* Show selected element info */}
              {selectedElement && (
                <ToolbarItem>
                  <Label color="purple" isCompact>
                    {selectedElement.tagName}
                    {selectedElement.id ? `#${selectedElement.id}` : ''}
                  </Label>
                </ToolbarItem>
              )}
              
              {/* Open in new tab */}
              <ToolbarItem>
                <Button
                  variant="link"
                  icon={<ExternalLinkAltIcon />}
                  iconPosition="end"
                  component="a"
                  href={actualEmbedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in new tab
                </Button>
              </ToolbarItem>
              
              {/* Discussions drawer toggle */}
              <ToolbarItem>
                <Button
                  variant={isRightDrawerExpanded ? 'secondary' : 'plain'}
                  aria-label="Toggle discussions panel"
                  aria-pressed={isRightDrawerExpanded}
                  onClick={() => setIsRightDrawerExpanded(!isRightDrawerExpanded)}
                >
                  <CommentIcon />
                </Button>
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </div>

      {/* Main content with drawers */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Drawer isExpanded={isLeftDrawerExpanded} isInline position="left">
          <DrawerContent
            panelContent={
              <DrawerPanelContent isResizable minSize="300px" defaultSize="400px">
                <DrawerHead>
                  <Title headingLevel="h3" size="lg">Context</Title>
                  <DrawerActions>
                    <DrawerCloseButton onClick={() => setIsLeftDrawerExpanded(false)} />
                  </DrawerActions>
                </DrawerHead>
                <DrawerPanelBody>
                  <PrototypeContextPanel 
                    prototype={prototype}
                    selectedScope={selectedScope}
                    onScopeChange={handleScopeChange}
                    isSelectMode={isSelectMode}
                    setIsSelectMode={setIsSelectMode}
                    selectedElement={selectedElement}
                  />
                </DrawerPanelBody>
              </DrawerPanelContent>
            }
          >
            <Drawer isExpanded={isRightDrawerExpanded} isInline position="right">
              <DrawerContent
                panelContent={
                  <DrawerPanelContent isResizable minSize="300px" defaultSize="400px">
                    <DrawerHead>
                      <Title headingLevel="h3" size="lg">Discussions</Title>
                      <DrawerActions>
                        <DrawerCloseButton onClick={() => setIsRightDrawerExpanded(false)} />
                      </DrawerActions>
                    </DrawerHead>
                    <DrawerPanelBody>
                      <PrototypeDiscussionsPanel 
                        discussions={prototype.discussions || []}
                        prototypeId={prototype.id}
                        onAddComment={handleAddComment}
                      />
                    </DrawerPanelBody>
                  </DrawerPanelContent>
                }
              >
                {/* Iframe content */}
                <div className={`prototype-main-content${isSelectMode ? ' selection-mode-active' : ''}`}>
                  <iframe
                    ref={iframeRef}
                    src={actualEmbedUrl}
                    title={iframeTitle || prototype.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      borderRadius: '0',
                      backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)'
                    }}
                    allow="web-share"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
                  />
                </div>
              </DrawerContent>
            </Drawer>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};

export default PrototypeDetail;
