import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  AlertActionCloseButton,
  Button,
  Label,
  Flex,
  FlexItem,
  Content,
  Spinner,
  Tooltip,
  NotificationBadge
} from '@patternfly/react-core';
import {
  SyncAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CodeBranchIcon,
  OutlinedClockIcon
} from '@patternfly/react-icons';

/**
 * Inline sync status indicator for a shared repository.
 * Can be used in the masthead, sidebar, or settings panel.
 *
 * Props:
 *   repoId - string (if provided, shows status for a single repo)
 *   compact - boolean (show as a small badge instead of full panel)
 *   onConflict - function(repoId, conflicts) callback when conflicts detected
 */
const SyncStatusPanel = ({ repoId, compact = false, onConflict }) => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState({});
  const [statuses, setStatuses] = useState({});
  const [syncResults, setSyncResults] = useState({});
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  const fetchRepos = useCallback(async () => {
    try {
      const response = await fetch('/api/sharing/repos');
      const data = await response.json();
      if (data.success) {
        setRepos(data.repositories);
        // Fetch status for each repo
        for (const repo of data.repositories) {
          if (!repoId || repo.id === repoId) {
            fetchRepoStatus(repo.id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching repos:', err);
    } finally {
      setLoading(false);
    }
  }, [repoId]);

  const fetchRepoStatus = async (id) => {
    try {
      const response = await fetch(`/api/sharing/repos/${id}/status`);
      const data = await response.json();
      if (data.success) {
        setStatuses(prev => ({ ...prev, [id]: data }));
        if (data.conflicts?.length > 0 && onConflict) {
          onConflict(id, data.conflicts);
        }
      }
    } catch (err) {
      console.error(`Error fetching status for ${id}:`, err);
    }
  };

  const handleSync = async (id) => {
    setSyncing(prev => ({ ...prev, [id]: true }));
    setSyncResults(prev => ({ ...prev, [id]: null }));
    try {
      const response = await fetch(`/api/sharing/repos/${id}/sync`, { method: 'POST' });
      const data = await response.json();
      setSyncResults(prev => ({ ...prev, [id]: data }));

      if (data.conflicts?.length > 0 && onConflict) {
        onConflict(id, data.conflicts);
      }

      // Refresh status after sync
      fetchRepoStatus(id);
    } catch (err) {
      setSyncResults(prev => ({
        ...prev,
        [id]: { success: false, error: err.message }
      }));
    } finally {
      setSyncing(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleResolveConflicts = async (id, strategy) => {
    // For now, we support 'ours' (keep local) and 'theirs' (use remote) strategies
    // This is handled by resetting and pulling with the appropriate strategy
    try {
      const response = await fetch(`/api/sharing/repos/${id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolveStrategy: strategy })
      });
      const data = await response.json();
      setSyncResults(prev => ({ ...prev, [id]: data }));
      fetchRepoStatus(id);
    } catch (err) {
      console.error(`Error resolving conflicts for ${id}:`, err);
    }
  };

  useEffect(() => {
    fetchRepos();
    // Poll status every 2 minutes
    const interval = setInterval(fetchRepos, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRepos]);

  const formatLastSync = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const filteredRepos = repoId ? repos.filter(r => r.id === repoId) : repos;

  if (loading) {
    return compact ? null : <Spinner size="sm" />;
  }

  if (filteredRepos.length === 0) {
    return null;
  }

  // Compact mode: just show a badge with sync count
  if (compact) {
    const totalBehind = Object.values(statuses).reduce((sum, s) => sum + (s.behind || 0), 0);
    const hasConflicts = Object.values(statuses).some(s => s.conflicts?.length > 0);

    if (hasConflicts) {
      return (
        <Tooltip content="Sync conflicts detected">
          <NotificationBadge variant="attention" count={totalBehind || '!'} />
        </Tooltip>
      );
    }

    if (totalBehind > 0) {
      return (
        <Tooltip content={`${totalBehind} update${totalBehind > 1 ? 's' : ''} available`}>
          <NotificationBadge variant="unread" count={totalBehind} />
        </Tooltip>
      );
    }

    return null;
  }

  // Full panel mode
  return (
    <div>
      {filteredRepos.map((repo) => {
        const status = statuses[repo.id] || {};
        const result = syncResults[repo.id];
        const isSyncing = syncing[repo.id];
        const hasConflicts = status.conflicts?.length > 0;

        return (
          <div key={repo.id} style={{ 
            padding: '1rem',
            marginBottom: '0.75rem',
            borderRadius: '6px',
            border: hasConflicts 
              ? '1px solid var(--pf-v6-global--danger-color--100)' 
              : '1px solid var(--pf-v6-global--BorderColor--100)',
            backgroundColor: hasConflicts 
              ? 'var(--pf-v6-global--BackgroundColor--danger-default)' 
              : 'transparent'
          }}>
            {/* Repo header */}
            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <CodeBranchIcon />
                  </FlexItem>
                  <FlexItem>
                    <strong>{repo.name}</strong>
                  </FlexItem>
                  <FlexItem>
                    <Label isCompact color="blue">{status.branch || repo.branch || 'main'}</Label>
                  </FlexItem>
                </Flex>
              </FlexItem>
              <FlexItem>
                <Button
                  variant="plain"
                  isSmall
                  onClick={() => handleSync(repo.id)}
                  isDisabled={isSyncing}
                  icon={isSyncing ? <Spinner size="sm" /> : <SyncAltIcon />}
                  aria-label={`Sync ${repo.name}`}
                />
              </FlexItem>
            </Flex>

            {/* Status info */}
            <Flex spaceItems={{ default: 'spaceItemsMd' }} style={{ marginTop: '0.5rem' }}>
              <FlexItem>
                <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                  <OutlinedClockIcon /> Last sync: {formatLastSync(repo.lastSync)}
                </Content>
              </FlexItem>
              {status.ahead > 0 && (
                <FlexItem>
                  <Label isCompact color="green">{status.ahead} ahead</Label>
                </FlexItem>
              )}
              {status.behind > 0 && (
                <FlexItem>
                  <Label isCompact color="orange">{status.behind} behind</Label>
                </FlexItem>
              )}
              {status.isClean && !status.ahead && !status.behind && (
                <FlexItem>
                  <Label isCompact color="green" icon={<CheckCircleIcon />}>Up to date</Label>
                </FlexItem>
              )}
            </Flex>

            {/* Conflicts */}
            {hasConflicts && !dismissedAlerts.has(`conflict-${repo.id}`) && (
              <Alert
                variant="warning"
                title={`${status.conflicts.length} conflict${status.conflicts.length > 1 ? 's' : ''} detected`}
                isInline
                style={{ marginTop: '0.75rem' }}
                actionClose={
                  <AlertActionCloseButton onClose={() => setDismissedAlerts(prev => new Set([...prev, `conflict-${repo.id}`]))} />
                }
              >
                <Content component="p" style={{ marginBottom: '0.5rem' }}>
                  The following files have merge conflicts:
                </Content>
                <ul style={{ margin: '0.25rem 0', paddingLeft: '1.5rem' }}>
                  {status.conflicts.map((file, i) => (
                    <li key={i}><code>{file}</code></li>
                  ))}
                </ul>
                <Flex spaceItems={{ default: 'spaceItemsSm' }} style={{ marginTop: '0.75rem' }}>
                  <FlexItem>
                    <Button variant="secondary" isSmall onClick={() => handleResolveConflicts(repo.id, 'ours')}>
                      Keep Local
                    </Button>
                  </FlexItem>
                  <FlexItem>
                    <Button variant="secondary" isSmall onClick={() => handleResolveConflicts(repo.id, 'theirs')}>
                      Use Remote
                    </Button>
                  </FlexItem>
                </Flex>
              </Alert>
            )}

            {/* Sync result */}
            {result && !dismissedAlerts.has(`result-${repo.id}`) && (
              <Alert
                variant={result.error ? 'danger' : 'success'}
                title={result.error ? 'Sync failed' : 'Sync complete'}
                isInline
                style={{ marginTop: '0.75rem' }}
                actionClose={
                  <AlertActionCloseButton onClose={() => {
                    setDismissedAlerts(prev => new Set([...prev, `result-${repo.id}`]));
                    setSyncResults(prev => ({ ...prev, [repo.id]: null }));
                  }} />
                }
              >
                {result.error || (
                  <Content component="small">
                    {result.committed && 'Local changes committed. '}
                    {result.pulled && 'Remote changes pulled. '}
                    {result.pushed && 'Changes pushed to remote.'}
                    {!result.committed && !result.pulled && !result.pushed && 'Already up to date.'}
                  </Content>
                )}
              </Alert>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SyncStatusPanel;
