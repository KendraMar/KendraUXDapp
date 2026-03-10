import React, { useState, useEffect } from 'react';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Content,
  Card,
  CardBody,
  Flex,
  FlexItem,
  Label,
  Badge,
  Spinner,
  EmptyState,
  EmptyStateBody,
  Alert,
  ToggleGroup,
  ToggleGroupItem,
  Split,
  SplitItem,
  Button
} from '@patternfly/react-core';
import {
  ExclamationCircleIcon,
  ExternalLinkAltIcon,
  FolderIcon,
  UserIcon,
  OutlinedCommentsIcon,
  HistoryIcon,
  SyncAltIcon,
  FileIcon
} from '@patternfly/react-icons';

const Figma = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null); // null = all projects
  const [updateType, setUpdateType] = useState('all'); // 'all', 'versions', 'comments'
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    fetchCacheStatus();
    fetchFigmaData();
  }, []);

  const fetchCacheStatus = async () => {
    try {
      const res = await fetch('/api/figma/cache/status');
      const data = await res.json();
      if (data.success && data.lastSync) {
        setLastSync(data.lastSync);
      }
    } catch (err) {
      console.error('Error fetching cache status:', err);
    }
  };

  useEffect(() => {
    // Refetch updates when project or type changes
    fetchUpdates(selectedProject, updateType);
  }, [selectedProject, updateType]);

  const fetchFigmaData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch user, projects, and recent files in parallel
      const [userRes, projectsRes, filesRes] = await Promise.all([
        fetch('/api/figma/user'),
        fetch('/api/figma/projects'),
        fetch('/api/figma/files/recent')
      ]);

      const userData = await userRes.json();
      const projectsData = await projectsRes.json();
      const filesData = await filesRes.json();

      if (!userData.success) {
        setError(userData.error || 'Failed to connect to Figma');
        setLoading(false);
        return;
      }

      setUser(userData.user);
      setProjects(projectsData.projects || []);
      setRecentFiles(filesData.files || []);
      setFromCache(projectsData.fromCache || false);

      // Fetch initial updates
      await fetchUpdates(null, 'all');
    } catch (err) {
      console.error('Error fetching Figma data:', err);
      setError('Failed to connect to Figma. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUpdates = async (projectId, type) => {
    try {
      let url = `/api/figma/updates?type=${type}`;
      if (projectId) {
        url += `&projectId=${projectId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setUpdates(data.updates || []);
        if (data.fromCache !== undefined) setFromCache(data.fromCache);
      }
    } catch (err) {
      console.error('Error fetching updates:', err);
    }
  };

  const handleRefresh = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/figma/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLastSync(data.lastSync);
        // Refetch all data after sync
        await fetchFigmaData();
        setFromCache(false);
      }
    } catch (err) {
      console.error('Error syncing Figma:', err);
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'version':
        return <HistoryIcon />;
      case 'comment':
        return <OutlinedCommentsIcon />;
      default:
        return <HistoryIcon />;
    }
  };

  const getUpdateColor = (type) => {
    switch (type) {
      case 'version':
        return 'blue';
      case 'comment':
        return 'purple';
      default:
        return 'grey';
    }
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <Title headingLevel="h2" size="lg" style={{ marginTop: '1rem' }}>
            Loading Figma data...
          </Title>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <ExclamationCircleIcon size="xl" color="var(--pf-v6-global--danger-color--100)" />
          <Title headingLevel="h2" size="lg">
            Figma Connection Error
          </Title>
          <EmptyStateBody>
            <div style={{ 
              textAlign: 'left', 
              maxWidth: '800px', 
              margin: '1rem auto',
              padding: '1rem',
              backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          </EmptyStateBody>
          <Alert variant="info" title="Setup Instructions" style={{ marginTop: '1rem', maxWidth: '700px' }}>
            <p><strong>To connect to Figma:</strong></p>
            <ol style={{ marginTop: '0.5rem' }}>
              <li>Go to Settings → Integrations</li>
              <li>Find Figma and click "Set Up"</li>
              <li>Go to <a href="https://www.figma.com/developers/api#access-tokens" target="_blank" rel="noopener noreferrer">Figma Account Settings → Personal Access Tokens</a></li>
              <li>Generate a new Personal Access Token with the required scopes</li>
              <li>Enter the token and your Team ID (found in your Figma URL: figma.com/files/team/<strong>TEAM_ID</strong>/...)</li>
              <li>Save the configuration</li>
            </ol>
          </Alert>
        </EmptyState>
      </PageSection>
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
      <PageSection variant={PageSectionVariants.light} style={{ flexShrink: 0 }}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
              <FlexItem>
                <span style={{ fontSize: '2rem' }}>🎨</span>
              </FlexItem>
              <FlexItem>
                <Title headingLevel="h1" size="2xl">
                  Figma
                </Title>
                <Content style={{ marginTop: '0.25rem' }}>
                  Your design projects and recent updates
                </Content>
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
              {/* Last synced info */}
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  {lastSync && (
                    <Content style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                      {fromCache && <Label color="blue" isCompact style={{ marginRight: '0.5rem' }}>Cached</Label>}
                      Last synced {formatLastSync(lastSync)}
                    </Content>
                  )}
                  <Button
                    variant="secondary"
                    icon={<SyncAltIcon />}
                    onClick={handleRefresh}
                    isLoading={syncing}
                    isDisabled={syncing}
                  >
                    {syncing ? 'Syncing...' : 'Refresh'}
                  </Button>
                </Flex>
              </FlexItem>
              {/* User info */}
              {user && (
                <FlexItem>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    {user.imgUrl ? (
                      <img 
                        src={user.imgUrl} 
                        alt={user.handle}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--pf-v6-global--palette--orange-300)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '14px'
                      }}>
                        {user.handle?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <Content>
                      <strong>{user.handle}</strong>
                      {user.email && (
                        <span style={{ color: 'var(--pf-v6-global--Color--200)', marginLeft: '0.5rem' }}>
                          {user.email}
                        </span>
                      )}
                    </Content>
                  </Flex>
                </FlexItem>
              )}
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {/* Main Content - Scrollable */}
      <PageSection isFilled style={{ overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 1fr', gap: '1.5rem', height: '100%' }}>
          
          {/* Projects Column */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ marginBottom: '1rem' }}>
              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
                <Title headingLevel="h2" size="lg">
                  Projects
                </Title>
                <Badge>{projects.length}</Badge>
              </Flex>
            </Flex>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* All Projects option */}
              <Card 
                isCompact 
                isSelectable
                isSelected={selectedProject === null}
                onClick={() => setSelectedProject(null)}
                style={{ marginBottom: '0.5rem', cursor: 'pointer' }}
              >
                <CardBody>
                  <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    <FolderIcon />
                    <Content style={{ fontWeight: 600 }}>All Projects</Content>
                    <Badge isRead>{projects.length}</Badge>
                  </Flex>
                </CardBody>
              </Card>
              
              {projects.length === 0 ? (
                <EmptyState>
                  <FolderIcon size="xl" />
                  <Title headingLevel="h3" size="md">
                    No projects found
                  </Title>
                  <EmptyStateBody>
                    You don't have any Figma projects yet, or your token doesn't have access to any teams.
                  </EmptyStateBody>
                </EmptyState>
              ) : (
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  {projects.map(project => (
                    <Card 
                      key={project.id} 
                      isCompact
                      isSelectable
                      isSelected={selectedProject === project.id}
                      onClick={() => setSelectedProject(project.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <CardBody>
                        <Split hasGutter>
                          <SplitItem isFilled>
                            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                              <FlexItem>
                                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                  <FolderIcon color="var(--pf-v6-global--palette--orange-300)" />
                                  <span style={{ fontWeight: 600, fontSize: '1rem' }}>
                                    {project.name}
                                  </span>
                                </Flex>
                              </FlexItem>
                              {project.teamName && (
                                <FlexItem>
                                  <Content style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                                    {project.teamName}
                                  </Content>
                                </FlexItem>
                              )}
                            </Flex>
                          </SplitItem>
                          <SplitItem>
                            <a 
                              href={`https://www.figma.com/files/project/${project.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              style={{ color: 'var(--pf-v6-global--link--Color)' }}
                            >
                              <ExternalLinkAltIcon />
                            </a>
                          </SplitItem>
                        </Split>
                      </CardBody>
                    </Card>
                  ))}
                </Flex>
              )}
            </div>
          </div>

          {/* Recent Files Column */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ marginBottom: '1rem' }}>
              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
                <Title headingLevel="h2" size="lg">
                  Recent Files
                </Title>
                <Badge>
                  {selectedProject
                    ? recentFiles.filter(f => String(f.projectId) === String(selectedProject)).length
                    : recentFiles.length}
                </Badge>
              </Flex>
            </Flex>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {(() => {
                const filteredFiles = selectedProject
                  ? recentFiles.filter(f => String(f.projectId) === String(selectedProject))
                  : recentFiles;

                if (filteredFiles.length === 0) {
                  return (
                    <EmptyState>
                      <FileIcon size="xl" />
                      <Title headingLevel="h3" size="md">
                        No files found
                      </Title>
                      <EmptyStateBody>
                        {selectedProject
                          ? 'No files in this project.'
                          : 'No files found across your projects.'}
                      </EmptyStateBody>
                    </EmptyState>
                  );
                }

                return (
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    {filteredFiles.map(file => (
                      <Card key={file.key} isCompact>
                        <CardBody>
                          <Split hasGutter>
                            {file.thumbnailUrl && (
                              <SplitItem>
                                <img
                                  src={file.thumbnailUrl}
                                  alt={file.name}
                                  style={{
                                    width: '48px',
                                    height: '36px',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    border: '1px solid var(--pf-v6-global--BorderColor--100)'
                                  }}
                                />
                              </SplitItem>
                            )}
                            <SplitItem isFilled>
                              <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                                <FlexItem>
                                  <a
                                    href={`https://www.figma.com/file/${file.key}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      fontWeight: 600,
                                      fontSize: '0.95rem',
                                      color: 'var(--pf-v6-global--link--Color)',
                                      textDecoration: 'none'
                                    }}
                                  >
                                    {file.name}
                                    <ExternalLinkAltIcon style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }} />
                                  </a>
                                </FlexItem>
                                <FlexItem>
                                  <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                    {file.projectName && !selectedProject && (
                                      <Label color="grey" isCompact icon={<FolderIcon />}>
                                        {file.projectName}
                                      </Label>
                                    )}
                                    <Content style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                                      {formatTimestamp(file.lastModified)}
                                    </Content>
                                  </Flex>
                                </FlexItem>
                              </Flex>
                            </SplitItem>
                          </Split>
                        </CardBody>
                      </Card>
                    ))}
                  </Flex>
                );
              })()}
            </div>
          </div>

          {/* Updates Column */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ marginBottom: '1rem' }}>
              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
                <Title headingLevel="h2" size="lg">
                  Recent Updates
                </Title>
                <Badge>{updates.length}</Badge>
              </Flex>
              <ToggleGroup aria-label="Update type toggle">
                <ToggleGroupItem
                  text="All"
                  buttonId="all-updates"
                  isSelected={updateType === 'all'}
                  onChange={() => setUpdateType('all')}
                />
                <ToggleGroupItem
                  text="Versions"
                  buttonId="version-updates"
                  isSelected={updateType === 'versions'}
                  onChange={() => setUpdateType('versions')}
                />
                <ToggleGroupItem
                  text="Comments"
                  buttonId="comment-updates"
                  isSelected={updateType === 'comments'}
                  onChange={() => setUpdateType('comments')}
                />
              </ToggleGroup>
            </Flex>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {updates.length === 0 ? (
                <EmptyState>
                  <HistoryIcon size="xl" />
                  <Title headingLevel="h3" size="md">
                    No updates found
                  </Title>
                  <EmptyStateBody>
                    {selectedProject 
                      ? "No recent updates for this project."
                      : "No recent updates across your projects."}
                  </EmptyStateBody>
                </EmptyState>
              ) : (
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  {updates.map((update, index) => (
                    <Card key={`${update.type}-${update.id}-${index}`} isCompact>
                      <CardBody>
                        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                          <FlexItem>
                            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                              <FlexItem>
                                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                  <Label 
                                    color={getUpdateColor(update.type)} 
                                    isCompact 
                                    icon={getUpdateIcon(update.type)}
                                  >
                                    {update.type === 'version' ? 'Version' : 'Comment'}
                                  </Label>
                                  <a 
                                    href={`https://www.figma.com/file/${update.fileKey}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ 
                                      fontWeight: 600,
                                      fontSize: '0.95rem',
                                      color: 'var(--pf-v6-global--link--Color)',
                                      textDecoration: 'none'
                                    }}
                                  >
                                    {update.fileName || 'Untitled'}
                                    <ExternalLinkAltIcon style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }} />
                                  </a>
                                </Flex>
                              </FlexItem>
                              <FlexItem>
                                <Content style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                                  {formatTimestamp(update.createdAt)}
                                </Content>
                              </FlexItem>
                            </Flex>
                          </FlexItem>
                          
                          {/* Update content */}
                          {update.type === 'version' && update.label && (
                            <FlexItem>
                              <Content style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                {update.label}
                              </Content>
                            </FlexItem>
                          )}
                          
                          {update.type === 'version' && update.description && (
                            <FlexItem>
                              <Content style={{ 
                                fontSize: '0.875rem',
                                color: 'var(--pf-v6-global--Color--100)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                              }}>
                                {update.description}
                              </Content>
                            </FlexItem>
                          )}
                          
                          {update.type === 'comment' && update.message && (
                            <FlexItem>
                              <Content style={{ 
                                fontSize: '0.875rem',
                                color: 'var(--pf-v6-global--Color--100)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                marginTop: '0.25rem'
                              }}>
                                "{update.message}"
                              </Content>
                            </FlexItem>
                          )}
                          
                          {/* User info */}
                          {update.user && (
                            <FlexItem>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                                {update.user.imgUrl ? (
                                  <img 
                                    src={update.user.imgUrl} 
                                    alt={update.user.handle}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%'
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--pf-v6-global--palette--blue-300)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: '10px'
                                  }}>
                                    {(update.user.handle || 'U').charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <Content style={{ fontSize: '0.875rem' }}>
                                  {update.user.handle}
                                </Content>
                              </Flex>
                            </FlexItem>
                          )}
                          
                          {/* Resolved badge for comments */}
                          {update.type === 'comment' && update.resolvedAt && (
                            <FlexItem>
                              <Label color="green" isCompact>Resolved</Label>
                            </FlexItem>
                          )}
                        </Flex>
                      </CardBody>
                    </Card>
                  ))}
                </Flex>
              )}
            </div>
          </div>
        </div>
      </PageSection>
    </div>
  );
};

export default Figma;
