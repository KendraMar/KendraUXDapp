import React, { useState, useEffect, useCallback } from 'react';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Content,
  Spinner,
  Alert,
  AlertActionLink,
  Flex,
  FlexItem,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateActions,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  Card,
  CardBody,
  CardTitle,
  CardHeader,
  Skeleton,
  TextInput,
  InputGroup,
  InputGroupItem,
  Label,
  Divider
} from '@patternfly/react-core';
import {
  BookOpenIcon,
  CogIcon,
  ExclamationCircleIcon,
  SearchIcon,
  ExternalLinkAltIcon,
  AngleLeftIcon,
  AngleRightIcon,
  AngleDownIcon,
  FileIcon,
  ClockIcon,
  UserIcon,
  SyncAltIcon
} from '@patternfly/react-icons';
import { useNavigate } from 'react-router-dom';

// Tree node component for the sidebar
const TreeNode = ({ page, level = 0, selectedPageId, onSelectPage, expandedNodes, onToggleExpand, childrenCache, loadingChildren }) => {
  const isExpanded = expandedNodes[page.id];
  const isSelected = selectedPageId === page.id;
  const isLoading = loadingChildren[page.id];
  const children = childrenCache[page.id] || [];
  const hasChildren = page.hasChildren !== false; // Assume has children unless explicitly false
  
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.4rem 0.5rem',
          paddingLeft: `${level * 1 + 0.5}rem`,
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'background 0.15s',
          backgroundColor: isSelected ? 'var(--pf-v6-global--BackgroundColor--200)' : 'transparent'
        }}
        className={!isSelected ? 'pf-v6-u-background-color-hover-100' : ''}
      >
        {/* Expand/Collapse toggle */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(page.id);
          }}
          style={{
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '4px',
            opacity: hasChildren ? 1 : 0,
            pointerEvents: hasChildren ? 'auto' : 'none'
          }}
        >
          {isLoading ? (
            <Spinner size="sm" style={{ width: '12px', height: '12px' }} />
          ) : (
            <AngleDownIcon
              style={{
                fontSize: '0.75rem',
                color: 'var(--pf-v6-global--Color--200)',
                transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.15s'
              }}
            />
          )}
        </div>
        
        {/* Page title */}
        <div
          onClick={() => onSelectPage(page)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            overflow: 'hidden'
          }}
        >
          <FileIcon 
            style={{ 
              flexShrink: 0,
              fontSize: '0.8rem',
              color: isSelected ? 'var(--pf-v6-global--palette--blue-400)' : 'var(--pf-v6-global--Color--200)' 
            }} 
          />
          <span 
            style={{ 
              fontSize: '0.875rem',
              fontWeight: isSelected ? 600 : 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {page.title}
          </span>
        </div>
      </div>
      
      {/* Children */}
      {isExpanded && children.length > 0 && (
        <div>
          {children.map(child => (
            <TreeNode
              key={child.id}
              page={child}
              level={level + 1}
              selectedPageId={selectedPageId}
              onSelectPage={onSelectPage}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              childrenCache={childrenCache}
              loadingChildren={loadingChildren}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Wiki = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configuredPage, setConfiguredPage] = useState(null);
  const [rootPage, setRootPage] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [pageContent, setPageContent] = useState(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Tree state
  const [expandedNodes, setExpandedNodes] = useState({});
  const [childrenCache, setChildrenCache] = useState({});
  const [loadingChildren, setLoadingChildren] = useState({});
  
  // Sync state
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Load configured page info on mount
  useEffect(() => {
    loadConfiguredPage();
  }, []);

  const loadConfiguredPage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/confluence/configured');
      const data = await response.json();
      
      if (data.success) {
        setConfiguredPage(data.config);
        
        // Set last sync time from cache metadata
        if (data.cache?.lastSync) {
          setLastSync(data.cache.lastSync);
        }
        
        // If we have a page ID, load that page as root
        if (data.config.pageId) {
          await loadRootPage(data.config.pageId);
        } else if (data.config.spaceKey) {
          // If we have a space key, load the space to get the homepage
          await loadSpaceRoot(data.config.spaceKey);
        } else {
          setError('Could not determine the Confluence space or page from the configured URL.');
        }
      } else {
        setError(data.error || 'Confluence is not configured.');
      }
    } catch (err) {
      setError(`Error loading configuration: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadRootPage = async (pageId) => {
    try {
      const response = await fetch(`/api/confluence/pages/${pageId}`);
      const data = await response.json();
      
      if (data.success) {
        const root = {
          id: data.page.id,
          title: data.page.title,
          hasChildren: (data.page.children || []).length > 0
        };
        setRootPage(root);
        
        // Load the root page content
        setCurrentPage(data.page);
        setPageContent(data.page.body);
        
        // Cache children for root
        if (data.page.children && data.page.children.length > 0) {
          setChildrenCache(prev => ({
            ...prev,
            [pageId]: data.page.children.map(c => ({ ...c, hasChildren: true }))
          }));
          // Auto-expand root
          setExpandedNodes(prev => ({ ...prev, [pageId]: true }));
        }
        
        // Add to history
        setNavigationHistory([{ type: 'page', id: pageId, title: data.page.title }]);
        setHistoryIndex(0);
      } else {
        setError(data.error || 'Failed to load page');
      }
    } catch (err) {
      setError(`Error loading page: ${err.message}`);
    }
  };

  const loadSpaceRoot = async (spaceKey) => {
    try {
      const response = await fetch(`/api/confluence/spaces/${spaceKey}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.space.homepage) {
          await loadRootPage(data.space.homepage.id);
        } else if (data.pages && data.pages.length > 0) {
          // No homepage, use the first page
          await loadRootPage(data.pages[0].id);
        } else {
          setError('No pages found in this space.');
        }
      } else {
        setError(data.error || 'Failed to load space');
      }
    } catch (err) {
      setError(`Error loading space: ${err.message}`);
    }
  };

  const loadPageContent = async (pageId, addToHistory = true) => {
    setLoadingPage(true);
    
    try {
      const response = await fetch(`/api/confluence/pages/${pageId}`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentPage(data.page);
        setPageContent(data.page.body);
        
        // Update children cache for this page
        if (data.page.children && data.page.children.length > 0) {
          setChildrenCache(prev => ({
            ...prev,
            [pageId]: data.page.children.map(c => ({ ...c, hasChildren: true }))
          }));
        } else {
          // Mark as having no children
          setChildrenCache(prev => ({
            ...prev,
            [pageId]: []
          }));
        }
        
        // Update navigation history
        if (addToHistory) {
          const newHistory = navigationHistory.slice(0, historyIndex + 1);
          newHistory.push({ type: 'page', id: pageId, title: data.page.title });
          setNavigationHistory(newHistory);
          setHistoryIndex(newHistory.length - 1);
        }
      } else {
        setError(data.error || 'Failed to load page');
      }
    } catch (err) {
      setError(`Error loading page: ${err.message}`);
    } finally {
      setLoadingPage(false);
    }
  };

  const loadChildrenForNode = async (pageId) => {
    setLoadingChildren(prev => ({ ...prev, [pageId]: true }));
    
    try {
      const response = await fetch(`/api/confluence/pages/${pageId}/children`);
      const data = await response.json();
      
      if (data.success) {
        setChildrenCache(prev => ({
          ...prev,
          [pageId]: (data.children || []).map(c => ({ ...c, hasChildren: true }))
        }));
      }
    } catch (err) {
      console.error('Error loading children:', err);
    } finally {
      setLoadingChildren(prev => ({ ...prev, [pageId]: false }));
    }
  };

  const handleToggleExpand = async (pageId) => {
    const isCurrentlyExpanded = expandedNodes[pageId];
    
    if (!isCurrentlyExpanded && !childrenCache[pageId]) {
      // Need to load children first
      await loadChildrenForNode(pageId);
    }
    
    setExpandedNodes(prev => ({
      ...prev,
      [pageId]: !isCurrentlyExpanded
    }));
  };

  const handleSelectPage = (page) => {
    loadPageContent(page.id);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    setSearchResults([]);
    
    try {
      const spaceKey = configuredPage?.spaceKey || '';
      const response = await fetch(`/api/confluence/search?q=${encodeURIComponent(searchQuery)}&spaceKey=${spaceKey}&limit=20`);
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.results);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    
    try {
      const response = await fetch('/api/confluence/sync', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        setLastSync(data.lastSync);
        // Clear caches to force reload from fresh data
        setChildrenCache({});
        setExpandedNodes({});
        // Reload the root page
        if (configuredPage?.pageId) {
          await loadRootPage(configuredPage.pageId);
        } else if (configuredPage?.spaceKey) {
          await loadSpaceRoot(configuredPage.spaceKey);
        }
      } else {
        setSyncError(data.error || 'Failed to sync from Confluence');
      }
    } catch (err) {
      setSyncError(`Sync error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (isoString) => {
    if (!isoString) return 'Never synced';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const navigateBack = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevItem = navigationHistory[prevIndex];
      setHistoryIndex(prevIndex);
      loadPageContent(prevItem.id, false);
    }
  };

  const navigateForward = () => {
    if (historyIndex < navigationHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextItem = navigationHistory[nextIndex];
      setHistoryIndex(nextIndex);
      loadPageContent(nextItem.id, false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle clicks on links within the Confluence content
  const handleContentClick = useCallback((e) => {
    const target = e.target.closest('a');
    if (!target) return;
    
    const href = target.getAttribute('href');
    if (!href) return;
    
    // Check if it's an internal Confluence link
    if (href.includes('/pages/') || href.includes('pageId=')) {
      e.preventDefault();
      
      // Extract page ID from URL
      const pageIdMatch = href.match(/\/pages\/(\d+)/) || href.match(/pageId=(\d+)/);
      if (pageIdMatch) {
        loadPageContent(pageIdMatch[1]);
      }
    }
  }, []);

  if (loading) {
    return (
      <>
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel="h1" size="2xl">
            Wiki
          </Title>
          <Content component="p">
            Confluence documentation and team wiki
          </Content>
        </PageSection>
        <PageSection isFilled>
          <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: '4rem' }}>
            <Spinner size="xl" />
          </Flex>
        </PageSection>
      </>
    );
  }

  if (error) {
    const isNotConfigured = error.includes('not configured') || error.includes('Could not determine');
    
    return (
      <>
        <PageSection variant={PageSectionVariants.light}>
          <Title headingLevel="h1" size="2xl">
            Wiki
          </Title>
          <Content component="p">
            Confluence documentation and team wiki
          </Content>
        </PageSection>
        <PageSection isFilled>
          {isNotConfigured ? (
            <EmptyState 
              variant="lg"
              headingLevel="h2"
              titleText="Confluence Not Configured"
              icon={ExclamationCircleIcon}
            >
              <EmptyStateBody>
                To use the Wiki page, you need to configure your Confluence credentials in Settings.
                You'll need your Confluence URL, email, and an API token.
              </EmptyStateBody>
              <EmptyStateFooter>
                <EmptyStateActions>
                  <Button 
                    variant="primary" 
                    icon={<CogIcon />}
                    onClick={() => navigate('/settings')}
                  >
                    Go to Settings
                  </Button>
                </EmptyStateActions>
              </EmptyStateFooter>
            </EmptyState>
          ) : (
            <Alert 
              variant="danger" 
              title="Error loading Wiki"
              actionLinks={
                <AlertActionLink onClick={loadConfiguredPage}>Retry</AlertActionLink>
              }
            >
              {error}
            </Alert>
          )}
        </PageSection>
      </>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden' 
    }}>
      {/* Header */}
      <PageSection variant="light" style={{ flexShrink: 0 }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl">
              Wiki
            </Title>
            <Content component="p" style={{ marginTop: '0.25rem' }}>
              {currentPage?.space?.name || 'Confluence documentation and team wiki'}
            </Content>
          </FlexItem>
          <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
            {/* Navigation buttons */}
            <FlexItem>
              <Button
                variant="plain"
                icon={<AngleLeftIcon />}
                onClick={navigateBack}
                isDisabled={historyIndex <= 0}
                aria-label="Go back"
              />
            </FlexItem>
            <FlexItem>
              <Button
                variant="plain"
                icon={<AngleRightIcon />}
                onClick={navigateForward}
                isDisabled={historyIndex >= navigationHistory.length - 1}
                aria-label="Go forward"
              />
            </FlexItem>
            
            {/* Search */}
            <FlexItem>
              <InputGroup>
                <InputGroupItem>
                  <TextInput
                    type="search"
                    placeholder="Search wiki..."
                    value={searchQuery}
                    onChange={(_event, value) => setSearchQuery(value)}
                    onKeyPress={handleSearchKeyPress}
                    aria-label="Search wiki"
                    style={{ width: '200px' }}
                  />
                </InputGroupItem>
                <InputGroupItem>
                  <Button 
                    variant="control" 
                    icon={<SearchIcon />}
                    onClick={handleSearch}
                    isLoading={searching}
                  />
                </InputGroupItem>
              </InputGroup>
            </FlexItem>
            
            {/* Sync button with last sync time */}
            <FlexItem>
              <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                <FlexItem>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--pf-v6-global--Color--200)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <ClockIcon style={{ fontSize: '0.75rem' }} />
                    {formatLastSync(lastSync)}
                  </span>
                </FlexItem>
                <FlexItem>
                  <Button
                    variant="secondary"
                    icon={<SyncAltIcon />}
                    onClick={handleSync}
                    isLoading={syncing}
                    isDisabled={syncing}
                  >
                    {syncing ? 'Syncing...' : 'Refresh'}
                  </Button>
                </FlexItem>
              </Flex>
            </FlexItem>
            
            {/* Open in Confluence */}
            {currentPage && (
              <FlexItem>
                <Button
                  variant="link"
                  icon={<ExternalLinkAltIcon />}
                  component="a"
                  href={currentPage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open in Confluence
                </Button>
              </FlexItem>
            )}
          </Flex>
        </Flex>
        
        {/* Sync error alert */}
        {syncError && (
          <Alert 
            variant="warning" 
            title="Sync issue" 
            isInline 
            style={{ marginTop: '0.75rem' }}
            actionClose={<Button variant="plain" onClick={() => setSyncError(null)}>×</Button>}
          >
            {syncError}
          </Alert>
        )}
      </PageSection>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
        minHeight: 0 
      }}>
        {/* Left Panel - Tree Navigation */}
        <div style={{ 
          width: '300px', 
          display: 'flex', 
          flexDirection: 'column',
          borderRight: '1px solid var(--pf-v6-global--BorderColor--100)',
          overflow: 'hidden',
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)'
        }}>
          <div style={{ 
            flex: 1, 
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{ padding: '1rem' }}>
                <Flex 
                  justifyContent={{ default: 'justifyContentSpaceBetween' }} 
                  alignItems={{ default: 'alignItemsCenter' }}
                  style={{ marginBottom: '0.75rem' }}
                >
                  <Title headingLevel="h3" size="md">
                    Search Results
                  </Title>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => setSearchResults([])}
                  >
                    Clear
                  </Button>
                </Flex>
                {searchResults.map(result => (
                  <div
                    key={result.id}
                    onClick={() => {
                      loadPageContent(result.id);
                      setSearchResults([]);
                      setSearchQuery('');
                    }}
                    style={{
                      padding: '0.5rem',
                      marginBottom: '0.25rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                    className="pf-v6-u-background-color-hover-100"
                  >
                    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                      <FileIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} />
                      <span style={{ fontSize: '0.875rem' }}>{result.title}</span>
                    </Flex>
                  </div>
                ))}
                <Divider style={{ margin: '1rem 0' }} />
              </div>
            )}

            {/* Page Tree */}
            <div style={{ padding: '0.5rem' }}>
              {rootPage ? (
                <TreeNode
                  page={rootPage}
                  level={0}
                  selectedPageId={currentPage?.id}
                  onSelectPage={handleSelectPage}
                  expandedNodes={expandedNodes}
                  onToggleExpand={handleToggleExpand}
                  childrenCache={childrenCache}
                  loadingChildren={loadingChildren}
                />
              ) : (
                <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem', padding: '0.5rem' }}>
                  No pages found
                </Content>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Page Content */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '1.5rem 2rem',
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)'
        }}>
          {loadingPage ? (
            <Card isCompact style={{ maxWidth: '900px', margin: '0 auto' }}>
              <CardHeader>
                <Skeleton height="32px" width="60%" />
              </CardHeader>
              <CardBody>
                <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                  <Skeleton height="16px" width="100%" />
                  <Skeleton height="16px" width="95%" />
                  <Skeleton height="16px" width="88%" />
                  <Skeleton height="16px" width="92%" />
                  <Skeleton height="16px" width="80%" />
                </Flex>
              </CardBody>
            </Card>
          ) : currentPage ? (
            <Card isCompact style={{ maxWidth: '900px', margin: '0 auto' }}>
              <CardHeader>
                {/* Breadcrumbs */}
                {currentPage.ancestors && currentPage.ancestors.length > 0 && (
                  <Breadcrumb style={{ marginBottom: '0.75rem' }}>
                    {currentPage.ancestors.map(ancestor => (
                      <BreadcrumbItem 
                        key={ancestor.id}
                        onClick={() => loadPageContent(ancestor.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {ancestor.title}
                      </BreadcrumbItem>
                    ))}
                    <BreadcrumbItem isActive>
                      {currentPage.title}
                    </BreadcrumbItem>
                  </Breadcrumb>
                )}
                
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsFlexStart' }}>
                  <FlexItem>
                    <CardTitle style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                      {currentPage.title}
                    </CardTitle>
                  </FlexItem>
                  {currentPage.version && (
                    <FlexItem>
                      <Label color="grey" isCompact>
                        v{currentPage.version}
                      </Label>
                    </FlexItem>
                  )}
                </Flex>
                
                {/* Metadata */}
                <Flex gap={{ default: 'gapMd' }} style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  {currentPage.lastUpdatedBy && (
                    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapXs' }}>
                      <UserIcon style={{ fontSize: '0.75rem' }} />
                      <span>{currentPage.lastUpdatedBy}</span>
                    </Flex>
                  )}
                  {currentPage.lastUpdated && (
                    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapXs' }}>
                      <ClockIcon style={{ fontSize: '0.75rem' }} />
                      <span>{formatDate(currentPage.lastUpdated)}</span>
                    </Flex>
                  )}
                </Flex>
              </CardHeader>
              <CardBody>
                {/* Confluence content with styled wrapper */}
                <div 
                  className="confluence-content"
                  onClick={handleContentClick}
                  style={{
                    lineHeight: '1.7',
                    fontSize: '0.95rem'
                  }}
                  dangerouslySetInnerHTML={{ __html: pageContent || '<p>No content</p>' }}
                />
                
                {/* Confluence content styles */}
                <style>{`
                  .confluence-content h1 {
                    font-size: 1.75rem;
                    font-weight: 600;
                    margin-top: 1.5rem;
                    margin-bottom: 0.75rem;
                    border-bottom: 1px solid var(--pf-v6-global--BorderColor--100);
                    padding-bottom: 0.5rem;
                  }
                  .confluence-content h2 {
                    font-size: 1.4rem;
                    font-weight: 600;
                    margin-top: 1.25rem;
                    margin-bottom: 0.5rem;
                  }
                  .confluence-content h3 {
                    font-size: 1.15rem;
                    font-weight: 600;
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                  }
                  .confluence-content p {
                    margin-bottom: 0.75rem;
                  }
                  .confluence-content ul, .confluence-content ol {
                    margin-bottom: 0.75rem;
                    padding-left: 1.5rem;
                  }
                  .confluence-content li {
                    margin-bottom: 0.35rem;
                  }
                  .confluence-content a {
                    color: var(--pf-v6-global--link--Color);
                    text-decoration: none;
                  }
                  .confluence-content a:hover {
                    text-decoration: underline;
                  }
                  .confluence-content table {
                    border-collapse: collapse;
                    width: 100%;
                    margin-bottom: 1rem;
                  }
                  .confluence-content th, .confluence-content td {
                    border: 1px solid var(--pf-v6-global--BorderColor--100);
                    padding: 0.5rem 0.75rem;
                    text-align: left;
                  }
                  .confluence-content th {
                    background-color: var(--pf-v6-global--BackgroundColor--200);
                    font-weight: 600;
                  }
                  .confluence-content pre, .confluence-content code {
                    background-color: var(--pf-v6-global--BackgroundColor--200);
                    border-radius: 4px;
                    font-family: 'Roboto Mono', monospace;
                    font-size: 0.85rem;
                  }
                  .confluence-content pre {
                    padding: 1rem;
                    overflow-x: auto;
                    margin-bottom: 0.75rem;
                  }
                  .confluence-content code {
                    padding: 0.15rem 0.35rem;
                  }
                  .confluence-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 4px;
                    margin: 0.5rem 0;
                  }
                  .confluence-content blockquote {
                    border-left: 3px solid var(--pf-v6-global--palette--blue-300);
                    padding-left: 1rem;
                    margin: 0.75rem 0;
                    color: var(--pf-v6-global--Color--200);
                  }
                  .confluence-content .panel, 
                  .confluence-content .confluence-information-macro {
                    background-color: var(--pf-v6-global--BackgroundColor--200);
                    border-radius: 4px;
                    padding: 1rem;
                    margin: 0.75rem 0;
                  }
                `}</style>
              </CardBody>
            </Card>
          ) : (
            <EmptyState titleText="No page selected" headingLevel="h2">
              <BookOpenIcon size="xl" style={{ color: 'var(--pf-v6-global--Color--200)', marginBottom: '1rem' }} />
              <EmptyStateBody>
                Select a page from the sidebar to view its content
              </EmptyStateBody>
            </EmptyState>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wiki;
