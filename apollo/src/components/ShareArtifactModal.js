import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Alert,
  Spinner,
  Label,
  Flex,
  FlexItem,
  Content,
  Radio,
  EmptyState,
  EmptyStateBody,
  Title
} from '@patternfly/react-core';
import {
  CodeBranchIcon,
  ShareAltIcon,
  ExclamationCircleIcon
} from '@patternfly/react-icons';

/**
 * Reusable modal for sharing an artifact to a connected Git repository.
 * 
 * Props:
 *   isOpen - boolean
 *   onClose - function
 *   artifactType - string (e.g., 'documents', 'slides', 'canvas', 'prototypes')
 *   artifactId - string
 *   artifactName - string (for display)
 *   onShareComplete - function(result) called after successful share
 */
const ShareArtifactModal = ({ isOpen, onClose, artifactType, artifactId, artifactName, onShareComplete }) => {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRepoId, setSelectedRepoId] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchRepos();
      setSelectedRepoId(null);
      setShareError(null);
    }
  }, [isOpen]);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sharing/repos');
      const data = await response.json();
      if (data.success) {
        setRepos(data.repositories);
        if (data.repositories.length === 1) {
          setSelectedRepoId(data.repositories[0].id);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!selectedRepoId) return;

    setSharing(true);
    setShareError(null);
    try {
      const response = await fetch('/api/sharing/artifacts/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType,
          artifactId,
          repoId: selectedRepoId
        })
      });

      const data = await response.json();
      if (data.success) {
        onClose();
        if (onShareComplete) {
          onShareComplete(data);
        }
      } else {
        setShareError(data.error);
      }
    } catch (err) {
      setShareError('Failed to share artifact. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const selectedRepo = repos.find(r => r.id === selectedRepoId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="share-artifact-modal-title"
      variant="small"
    >
      <ModalHeader title="Share Artifact" labelId="share-artifact-modal-title" />
      <ModalBody>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <Spinner size="lg" />
            <Content component="p" style={{ marginTop: '1rem' }}>Loading repositories...</Content>
          </div>
        ) : error ? (
          <Alert variant="danger" title="Error" isInline>
            {error}
          </Alert>
        ) : repos.length === 0 ? (
          <EmptyState variant="sm">
            <CodeBranchIcon size="xl" />
            <Title headingLevel="h3" size="md">No Repositories Connected</Title>
            <EmptyStateBody>
              Connect a Git repository in Settings to start sharing artifacts with your team.
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <Form>
            <Content component="p" style={{ marginBottom: '1rem' }}>
              Share <strong>{artifactName || artifactId}</strong> to a connected repository. 
              The artifact will be moved to the shared repository and synced with your team.
            </Content>

            {shareError && (
              <Alert variant="danger" title="Share Failed" isInline style={{ marginBottom: '1rem' }}>
                {shareError}
              </Alert>
            )}

            <FormGroup label="Select repository" isRequired fieldId="repo-select">
              {repos.map((repo) => (
                <div 
                  key={repo.id}
                  style={{ 
                    padding: '0.75rem 1rem',
                    marginBottom: '0.5rem',
                    borderRadius: '6px',
                    border: selectedRepoId === repo.id 
                      ? '2px solid var(--pf-v6-global--primary-color--100)' 
                      : '1px solid var(--pf-v6-global--BorderColor--100)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: selectedRepoId === repo.id 
                      ? 'var(--pf-v6-global--BackgroundColor--light-300)' 
                      : 'transparent'
                  }}
                  onClick={() => setSelectedRepoId(repo.id)}
                >
                  <Radio
                    id={`repo-${repo.id}`}
                    name="repo-select"
                    label={
                      <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                        <FlexItem>
                          <CodeBranchIcon />
                        </FlexItem>
                        <FlexItem>
                          <strong>{repo.name}</strong>
                        </FlexItem>
                        <FlexItem>
                          <Label isCompact color="blue">{repo.branch || 'main'}</Label>
                        </FlexItem>
                      </Flex>
                    }
                    description={
                      <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)', marginLeft: '1.75rem' }}>
                        {repo.url}
                      </Content>
                    }
                    isChecked={selectedRepoId === repo.id}
                    onChange={() => setSelectedRepoId(repo.id)}
                  />
                </div>
              ))}
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>
                    The artifact will be committed and pushed to the selected repository.
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>
          </Form>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleShare}
          isDisabled={!selectedRepoId || sharing || loading || repos.length === 0}
          isLoading={sharing}
          icon={<ShareAltIcon />}
        >
          {sharing ? 'Sharing...' : 'Share'}
        </Button>
        <Button
          variant="link"
          onClick={onClose}
          isDisabled={sharing}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ShareArtifactModal;
