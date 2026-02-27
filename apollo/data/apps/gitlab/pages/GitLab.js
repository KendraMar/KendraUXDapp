import React, { useState, useEffect } from 'react';
import {
  PageSection,
  PageSectionVariants,
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
  ToggleGroup,
  ToggleGroupItem,
  Divider,
  Split,
  SplitItem,
  Button
} from '@patternfly/react-core';
import {
  ExclamationCircleIcon,
  ExternalLinkAltIcon,
  CodeBranchIcon,
  UserIcon,
  OutlinedCommentsIcon,
  ExclamationTriangleIcon,
  SyncAltIcon
} from '@patternfly/react-icons';

const GitLab = () => {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [mergeRequests, setMergeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [projectScope, setProjectScope] = useState('contributed'); // 'contributed' or 'member'
  const [mrScope, setMrScope] = useState('all'); // 'all' or 'assigned'
  const [lastSync, setLastSync] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    fetchCacheStatus();
    fetchGitLabData();
  }, []);

  const fetchCacheStatus = async () => {
    try {
      const res = await fetch('/api/gitlab/cache/status');
      const data = await res.json();
      if (data.success && data.lastSync) {
        setLastSync(data.lastSync);
      }
    } catch (err) {
      console.error('Error fetching cache status:', err);
    }
  };

  useEffect(() => {
    // Refetch projects and MRs when project scope changes
    fetchProjects(projectScope);
    fetchMergeRequests(mrScope, projectScope);
  }, [projectScope]);

  useEffect(() => {
    // Refetch MRs when MR scope changes
    fetchMergeRequests(mrScope, projectScope);
  }, [mrScope]);

  const fetchGitLabData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch user, projects, and merge requests in parallel
      const [userRes, projectsRes, mrsRes] = await Promise.all([
        fetch('/api/gitlab/user'),
        fetch(`/api/gitlab/projects?scope=${projectScope}`),
        fetch(`/api/gitlab/merge-requests?scope=${mrScope}&projectScope=${projectScope}`)
      ]);

      const userData = await userRes.json();
      const projectsData = await projectsRes.json();
      const mrsData = await mrsRes.json();

      if (!userData.success) {
        setError(userData.error || 'Failed to connect to GitLab');
        setLoading(false);
        return;
      }

      setUser(userData.user);
      setProjects(projectsData.projects || []);
      setMergeRequests(mrsData.mergeRequests || []);
      setFromCache(projectsData.fromCache || mrsData.fromCache || false);
    } catch (err) {
      console.error('Error fetching GitLab data:', err);
      setError('Failed to connect to GitLab. Please check your configuration.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (scope) => {
    try {
      const res = await fetch(`/api/gitlab/projects?scope=${scope}`);
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchMergeRequests = async (scope, projScope) => {
    try {
      const res = await fetch(`/api/gitlab/merge-requests?scope=${scope}&projectScope=${projScope}`);
      const data = await res.json();
      if (data.success) {
        setMergeRequests(data.mergeRequests || []);
        if (data.fromCache !== undefined) setFromCache(data.fromCache);
      }
    } catch (err) {
      console.error('Error fetching merge requests:', err);
    }
  };

  const handleRefresh = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/gitlab/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setLastSync(data.lastSync);
        // Refetch all data after sync
        await fetchGitLabData();
        setFromCache(false);
      }
    } catch (err) {
      console.error('Error syncing GitLab:', err);
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

  const getMergeStatusColor = (status, hasConflicts) => {
    if (hasConflicts) return 'red';
    switch (status) {
      case 'can_be_merged':
        return 'green';
      case 'cannot_be_merged':
        return 'red';
      case 'unchecked':
      case 'checking':
        return 'orange';
      default:
        return 'grey';
    }
  };

  const getMergeStatusLabel = (status, hasConflicts) => {
    if (hasConflicts) return 'Has conflicts';
    switch (status) {
      case 'can_be_merged':
        return 'Ready to merge';
      case 'cannot_be_merged':
        return 'Cannot merge';
      case 'unchecked':
        return 'Checking...';
      case 'checking':
        return 'Checking...';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <Title headingLevel="h2" size="lg" style={{ marginTop: '1rem' }}>
            Loading GitLab data...
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
            GitLab Connection Error
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
            <p><strong>To connect to GitLab:</strong></p>
            <ol style={{ marginTop: '0.5rem' }}>
              <li>Go to Settings → Integrations</li>
              <li>Find GitLab and click "Set Up"</li>
              <li>Enter your GitLab URL (e.g., https://gitlab.cee.redhat.com)</li>
              <li>Generate a Personal Access Token with <code>read_api</code>, <code>read_user</code>, and <code>read_repository</code> scopes</li>
              <li>Enter the token and save</li>
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
                <span style={{ fontSize: '2rem' }}>🦊</span>
              </FlexItem>
              <FlexItem>
                <Title headingLevel="h1" size="2xl">
                  GitLab
                </Title>
                <Content style={{ marginTop: '0.25rem' }}>
                  Your projects and merge requests
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
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <Content>
                      <strong>{user.name}</strong>
                      <span style={{ color: 'var(--pf-v6-global--Color--200)', marginLeft: '0.5rem' }}>
                        @{user.username}
                      </span>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', height: '100%' }}>
          
          {/* Projects Column */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ marginBottom: '1rem' }}>
              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
                <Title headingLevel="h2" size="lg">
                  Projects
                </Title>
                <Badge>{projects.length}</Badge>
              </Flex>
              <ToggleGroup aria-label="Project scope toggle">
                <ToggleGroupItem
                  text="Contributed"
                  buttonId="contributed-projects"
                  isSelected={projectScope === 'contributed'}
                  onChange={() => setProjectScope('contributed')}
                />
                <ToggleGroupItem
                  text="Member of"
                  buttonId="member-projects"
                  isSelected={projectScope === 'member'}
                  onChange={() => setProjectScope('member')}
                />
              </ToggleGroup>
            </Flex>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {projects.length === 0 ? (
                <EmptyState>
                  <CodeBranchIcon size="xl" />
                  <Title headingLevel="h3" size="md">
                    No projects found
                  </Title>
                  <EmptyStateBody>
                    {projectScope === 'contributed'
                      ? "You haven't contributed to any projects yet."
                      : "You don't have any projects with maintainer access or higher."}
                  </EmptyStateBody>
                </EmptyState>
              ) : (
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  {projects.map(project => (
                    <Card key={project.id} isCompact>
                      <CardBody>
                        <Split hasGutter>
                          <SplitItem isFilled>
                            <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                              <FlexItem>
                                <a 
                                  href={project.webUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ 
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    color: 'var(--pf-v6-global--link--Color)',
                                    textDecoration: 'none'
                                  }}
                                >
                                  {project.name}
                                  <ExternalLinkAltIcon style={{ marginLeft: '0.5rem', fontSize: '0.75rem' }} />
                                </a>
                              </FlexItem>
                              <FlexItem>
                                <Content style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                                  {project.pathWithNamespace}
                                </Content>
                              </FlexItem>
                              {project.description && (
                                <FlexItem>
                                  <Content style={{ 
                                    fontSize: '0.875rem',
                                    color: 'var(--pf-v6-global--Color--100)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '300px'
                                  }}>
                                    {project.description}
                                  </Content>
                                </FlexItem>
                              )}
                              <FlexItem>
                                <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                                  <Label color="blue" isCompact icon={<CodeBranchIcon />}>
                                    {project.defaultBranch || 'main'}
                                  </Label>
                                  <Label color="grey" isCompact>
                                    {project.visibility}
                                  </Label>
                                  {project.openMergeRequestsCount > 0 && (
                                    <Label color="orange" isCompact>
                                      {project.openMergeRequestsCount} open MR{project.openMergeRequestsCount !== 1 ? 's' : ''}
                                    </Label>
                                  )}
                                </Flex>
                              </FlexItem>
                            </Flex>
                          </SplitItem>
                          <SplitItem>
                            <Content style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)', whiteSpace: 'nowrap' }}>
                              {formatTimestamp(project.lastActivityAt)}
                            </Content>
                          </SplitItem>
                        </Split>
                      </CardBody>
                    </Card>
                  ))}
                </Flex>
              )}
            </div>
          </div>

          {/* Merge Requests Column */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ marginBottom: '1rem' }}>
              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
                <Title headingLevel="h2" size="lg">
                  Merge Requests
                </Title>
                <Badge>{mergeRequests.length}</Badge>
              </Flex>
              <ToggleGroup aria-label="MR scope toggle">
                <ToggleGroupItem
                  text="All"
                  buttonId="all-mrs"
                  isSelected={mrScope === 'all'}
                  onChange={() => setMrScope('all')}
                />
                <ToggleGroupItem
                  text="Assigned to me"
                  buttonId="assigned-mrs"
                  isSelected={mrScope === 'assigned'}
                  onChange={() => setMrScope('assigned')}
                />
              </ToggleGroup>
            </Flex>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {mergeRequests.length === 0 ? (
                <EmptyState>
                  <CodeBranchIcon size="xl" />
                  <Title headingLevel="h3" size="md">
                    No merge requests
                  </Title>
                  <EmptyStateBody>
                    {mrScope === 'assigned' 
                      ? "You don't have any merge requests assigned to you."
                      : "No open merge requests found."}
                  </EmptyStateBody>
                </EmptyState>
              ) : (
                <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  {mergeRequests.map(mr => (
                    <Card key={mr.id} isCompact>
                      <CardBody>
                        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsXs' }}>
                          <FlexItem>
                            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                              <FlexItem>
                                <a 
                                  href={mr.webUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ 
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    color: 'var(--pf-v6-global--link--Color)',
                                    textDecoration: 'none'
                                  }}
                                >
                                  {mr.draft && <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>Draft: </span>}
                                  {mr.title}
                                  <ExternalLinkAltIcon style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }} />
                                </a>
                              </FlexItem>
                              <FlexItem>
                                <Content style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                                  {formatTimestamp(mr.updatedAt)}
                                </Content>
                              </FlexItem>
                            </Flex>
                          </FlexItem>
                          
                          <FlexItem>
                            <Content style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                              {mr.references?.full || `!${mr.iid}`} • {mr.sourceBranch} → {mr.targetBranch}
                            </Content>
                          </FlexItem>
                          
                          <FlexItem>
                            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
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
                                {(mr.author?.name || mr.author?.username || 'U').charAt(0).toUpperCase()}
                              </div>
                              <Content style={{ fontSize: '0.875rem' }}>
                                {mr.author?.name || mr.author?.username}
                              </Content>
                            </Flex>
                          </FlexItem>
                          
                          <FlexItem>
                            <Flex spaceItems={{ default: 'spaceItemsXs' }} alignItems={{ default: 'alignItemsCenter' }}>
                              {mr.draft && (
                                <Label color="grey" isCompact>
                                  Draft
                                </Label>
                              )}
                              <Label 
                                color={getMergeStatusColor(mr.mergeStatus, mr.hasConflicts)} 
                                isCompact
                                icon={mr.hasConflicts ? <ExclamationTriangleIcon /> : undefined}
                              >
                                {getMergeStatusLabel(mr.mergeStatus, mr.hasConflicts)}
                              </Label>
                              {mr.userNotesCount > 0 && (
                                <Label color="blue" isCompact icon={<OutlinedCommentsIcon />}>
                                  {mr.userNotesCount}
                                </Label>
                              )}
                              {mr.labels && mr.labels.slice(0, 3).map((label, idx) => (
                                <Label key={idx} color="purple" isCompact>
                                  {label}
                                </Label>
                              ))}
                              {mr.labels && mr.labels.length > 3 && (
                                <Label color="grey" isCompact>
                                  +{mr.labels.length - 3}
                                </Label>
                              )}
                            </Flex>
                          </FlexItem>
                          
                          {mr.reviewers && mr.reviewers.length > 0 && (
                            <FlexItem>
                              <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsXs' }}>
                                <Content style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)' }}>
                                  Reviewers:
                                </Content>
                                {mr.reviewers.map((reviewer, idx) => (
                                  <div 
                                    key={idx}
                                    title={reviewer.name || reviewer.username}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%',
                                      backgroundColor: 'var(--pf-v6-global--palette--purple-300)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontWeight: 600,
                                      fontSize: '10px',
                                      marginLeft: idx > 0 ? '-6px' : '0',
                                      border: '2px solid white'
                                    }}
                                  >
                                    {(reviewer.name || reviewer.username || 'R').charAt(0).toUpperCase()}
                                  </div>
                                ))}
                              </Flex>
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

export default GitLab;
