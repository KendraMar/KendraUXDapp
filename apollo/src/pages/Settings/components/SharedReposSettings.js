import React, { useState, useEffect } from 'react';
import {
  Title,
  Content,
  Card,
  CardBody,
  Button,
  Flex,
  FlexItem,
  Label,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  TextInput,
  Switch,
  Divider
} from '@patternfly/react-core';
import {
  CodeBranchIcon,
  PlusCircleIcon,
  TrashIcon,
  SyncAltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  OutlinedClockIcon,
  ExternalLinkAltIcon,
  EditIcon
} from '@patternfly/react-icons';
import SyncStatusPanel from '../../../components/SyncStatusPanel';

const SharedReposSettings = () => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add repo modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ url: '', branch: '', name: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

  // Edit repo modal
  const [editingRepo, setEditingRepo] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', autoSync: true });
  const [editSaving, setEditSaving] = useState(false);

  // Delete confirmation
  const [deletingRepo, setDeletingRepo] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Sync state
  const [syncing, setSyncing] = useState({});

  // Success message
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sharing/repos');
      const data = await response.json();
      if (data.success) {
        setRepos(data.repositories);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRepo = async () => {
    if (!addForm.url.trim()) return;

    setAdding(true);
    setAddError(null);
    try {
      const response = await fetch('/api/sharing/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: addForm.url.trim(),
          branch: addForm.branch.trim() || undefined,
          name: addForm.name.trim() || undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsAddModalOpen(false);
        setAddForm({ url: '', branch: '', name: '' });
        setSuccessMessage(`Repository "${data.repository.name}" connected successfully.`);
        fetchRepos();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setAddError(data.error);
      }
    } catch (err) {
      setAddError('Failed to connect repository. Please check the URL and try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleEditRepo = async () => {
    if (!editingRepo) return;

    setEditSaving(true);
    try {
      const response = await fetch(`/api/sharing/repos/${editingRepo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim() || editingRepo.name,
          autoSync: editForm.autoSync
        })
      });

      const data = await response.json();
      if (data.success) {
        setEditingRepo(null);
        fetchRepos();
      }
    } catch (err) {
      console.error('Error updating repo:', err);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteRepo = async () => {
    if (!deletingRepo) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/sharing/repos/${deletingRepo.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        setDeletingRepo(null);
        setSuccessMessage(`Repository "${deletingRepo.name}" removed.`);
        fetchRepos();
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error('Error removing repo:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSync = async (repoId) => {
    setSyncing(prev => ({ ...prev, [repoId]: true }));
    try {
      await fetch(`/api/sharing/repos/${repoId}/sync`, { method: 'POST' });
      fetchRepos();
    } catch (err) {
      console.error('Error syncing repo:', err);
    } finally {
      setSyncing(prev => ({ ...prev, [repoId]: false }));
    }
  };

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

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <Spinner size="lg" />
        <Content component="p" style={{ marginTop: '1rem' }}>Loading repositories...</Content>
      </div>
    );
  }

  return (
    <div>
      <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ marginBottom: '0.5rem' }}>
        <FlexItem>
          <Title headingLevel="h2" size="xl">
            Shared Repositories
          </Title>
        </FlexItem>
        <FlexItem>
          <Button 
            variant="primary" 
            icon={<PlusCircleIcon />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Connect Repository
          </Button>
        </FlexItem>
      </Flex>
      <Content component="p" style={{ marginBottom: '1.5rem', color: 'var(--pf-v6-global--Color--200)' }}>
        Connect Git repositories to share artifacts with your team. Shared artifacts are automatically synced.
      </Content>

      {successMessage && (
        <Alert variant="success" title={successMessage} isInline style={{ marginBottom: '1rem' }} />
      )}

      {error && (
        <Alert variant="danger" title={error} isInline style={{ marginBottom: '1rem' }} />
      )}

      {repos.length === 0 ? (
        <EmptyState variant="lg">
          <CodeBranchIcon size="xl" />
          <Title headingLevel="h3" size="lg">No Repositories Connected</Title>
          <EmptyStateBody>
            Connect a Git repository to start sharing documents, slides, canvases, and other artifacts with your team.
            Each repository can be used by multiple team members.
          </EmptyStateBody>
          <Button 
            variant="primary" 
            icon={<PlusCircleIcon />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Connect Repository
          </Button>
        </EmptyState>
      ) : (
        <div>
          {repos.map((repo) => (
            <Card key={repo.id} style={{ marginBottom: '1rem' }}>
              <CardBody>
                <Flex alignItems={{ default: 'alignItemsFlexStart' }} justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem>
                        <CodeBranchIcon style={{ fontSize: '1.25rem' }} />
                      </FlexItem>
                      <FlexItem>
                        <Title headingLevel="h3" size="lg" style={{ margin: 0 }}>{repo.name}</Title>
                      </FlexItem>
                      <FlexItem>
                        <Label isCompact color="blue">{repo.branch || 'main'}</Label>
                      </FlexItem>
                      {repo.autoSync && (
                        <FlexItem>
                          <Label isCompact color="green" icon={<SyncAltIcon />}>Auto-sync</Label>
                        </FlexItem>
                      )}
                      {repo.status === 'conflict' && (
                        <FlexItem>
                          <Label isCompact color="red" icon={<ExclamationTriangleIcon />}>Conflicts</Label>
                        </FlexItem>
                      )}
                    </Flex>

                    <Content component="p" style={{ marginTop: '0.5rem', color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem' }}>
                      {repo.url}
                    </Content>

                    <Flex spaceItems={{ default: 'spaceItemsMd' }} style={{ marginTop: '0.5rem' }}>
                      <FlexItem>
                        <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                          <OutlinedClockIcon /> Last synced: {formatLastSync(repo.lastSync)}
                        </Content>
                      </FlexItem>
                    </Flex>
                  </FlexItem>

                  <FlexItem>
                    <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                      <FlexItem>
                        <Button
                          variant="secondary"
                          isSmall
                          icon={syncing[repo.id] ? <Spinner size="sm" /> : <SyncAltIcon />}
                          onClick={() => handleSync(repo.id)}
                          isDisabled={syncing[repo.id]}
                        >
                          Sync
                        </Button>
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="plain"
                          isSmall
                          icon={<EditIcon />}
                          onClick={() => {
                            setEditingRepo(repo);
                            setEditForm({ name: repo.name, autoSync: repo.autoSync });
                          }}
                          aria-label={`Edit ${repo.name}`}
                        />
                      </FlexItem>
                      <FlexItem>
                        <Button
                          variant="plain"
                          isSmall
                          icon={<TrashIcon />}
                          isDanger
                          onClick={() => setDeletingRepo(repo)}
                          aria-label={`Remove ${repo.name}`}
                        />
                      </FlexItem>
                    </Flex>
                  </FlexItem>
                </Flex>

                {/* Sync status panel for this repo */}
                <div style={{ marginTop: '1rem' }}>
                  <SyncStatusPanel repoId={repo.id} />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Add Repository Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setAddError(null); }}
        aria-labelledby="add-repo-modal-title"
        variant="medium"
      >
        <ModalHeader title="Connect Repository" labelId="add-repo-modal-title" />
        <ModalBody>
          <Content component="p" style={{ marginBottom: '1rem' }}>
            Enter the Git repository URL to connect. Apollo will clone the repository and start syncing shared artifacts.
          </Content>

          {addError && (
            <Alert variant="danger" title="Connection Failed" isInline style={{ marginBottom: '1rem' }}>
              {addError}
            </Alert>
          )}

          <Form>
            <FormGroup label="Repository URL" isRequired fieldId="repo-url">
              <TextInput
                id="repo-url"
                type="text"
                value={addForm.url}
                onChange={(e, value) => setAddForm(prev => ({ ...prev, url: value }))}
                placeholder="git@github.com:org/shared-artifacts.git"
              />
            </FormGroup>
            <FormGroup label="Branch" fieldId="repo-branch">
              <TextInput
                id="repo-branch"
                type="text"
                value={addForm.branch}
                onChange={(e, value) => setAddForm(prev => ({ ...prev, branch: value }))}
                placeholder="main (default)"
              />
            </FormGroup>
            <FormGroup label="Display Name" fieldId="repo-name">
              <TextInput
                id="repo-name"
                type="text"
                value={addForm.name}
                onChange={(e, value) => setAddForm(prev => ({ ...prev, name: value }))}
                placeholder="e.g., Team Design Assets"
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={handleAddRepo}
            isDisabled={!addForm.url.trim() || adding}
            isLoading={adding}
          >
            {adding ? 'Connecting...' : 'Connect'}
          </Button>
          <Button
            variant="link"
            onClick={() => { setIsAddModalOpen(false); setAddError(null); }}
            isDisabled={adding}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Repository Modal */}
      <Modal
        isOpen={!!editingRepo}
        onClose={() => setEditingRepo(null)}
        aria-labelledby="edit-repo-modal-title"
        variant="small"
      >
        <ModalHeader title="Edit Repository" labelId="edit-repo-modal-title" />
        <ModalBody>
          <Form>
            <FormGroup label="Display Name" fieldId="edit-repo-name">
              <TextInput
                id="edit-repo-name"
                type="text"
                value={editForm.name}
                onChange={(e, value) => setEditForm(prev => ({ ...prev, name: value }))}
              />
            </FormGroup>
            <FormGroup fieldId="edit-repo-autosync">
              <Switch
                id="edit-repo-autosync"
                label="Auto-sync enabled"
                labelOff="Auto-sync disabled"
                isChecked={editForm.autoSync}
                onChange={(e, checked) => setEditForm(prev => ({ ...prev, autoSync: checked }))}
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={handleEditRepo}
            isDisabled={editSaving}
            isLoading={editSaving}
          >
            Save
          </Button>
          <Button variant="link" onClick={() => setEditingRepo(null)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingRepo}
        onClose={() => setDeletingRepo(null)}
        aria-labelledby="delete-repo-modal-title"
        variant="small"
      >
        <ModalHeader title="Remove Repository" labelId="delete-repo-modal-title" />
        <ModalBody>
          <Content component="p">
            Are you sure you want to remove <strong>{deletingRepo?.name}</strong>?
          </Content>
          <Content component="p" style={{ marginTop: '0.5rem', color: 'var(--pf-v6-global--Color--200)' }}>
            This will delete the local clone. Shared artifacts that were moved to this repository 
            will be lost locally. The remote repository will not be affected.
          </Content>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="danger"
            onClick={handleDeleteRepo}
            isDisabled={deleting}
            isLoading={deleting}
          >
            Remove
          </Button>
          <Button variant="link" onClick={() => setDeletingRepo(null)} isDisabled={deleting}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default SharedReposSettings;
