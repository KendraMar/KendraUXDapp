import React, { useState } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Alert,
  Content
} from '@patternfly/react-core';
import {
  UndoIcon
} from '@patternfly/react-icons';

/**
 * Modal to confirm unsharing an artifact (moving it back to local).
 * 
 * Props:
 *   isOpen - boolean
 *   onClose - function
 *   artifactType - string
 *   artifactId - string
 *   artifactName - string
 *   repoId - string
 *   repoName - string
 *   onUnshareComplete - function(result)
 */
const UnshareArtifactModal = ({ isOpen, onClose, artifactType, artifactId, artifactName, repoId, repoName, onUnshareComplete }) => {
  const [unsharing, setUnsharing] = useState(false);
  const [error, setError] = useState(null);

  const handleUnshare = async () => {
    setUnsharing(true);
    setError(null);
    try {
      const response = await fetch('/api/sharing/artifacts/unshare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactType,
          artifactId,
          repoId
        })
      });

      const data = await response.json();
      if (data.success) {
        onClose();
        if (onUnshareComplete) {
          onUnshareComplete(data);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to unshare artifact. Please try again.');
    } finally {
      setUnsharing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="unshare-artifact-modal-title"
      variant="small"
    >
      <ModalHeader title="Unshare Artifact" labelId="unshare-artifact-modal-title" />
      <ModalBody>
        <Content component="p">
          Are you sure you want to unshare <strong>{artifactName || artifactId}</strong>?
        </Content>
        <Content component="p" style={{ marginTop: '0.5rem', color: 'var(--pf-v6-global--Color--200)' }}>
          This will move the artifact from <strong>{repoName}</strong> back to your local storage. 
          Other team members will no longer have access to it through the shared repository.
        </Content>
        {error && (
          <Alert variant="danger" title="Unshare Failed" isInline style={{ marginTop: '1rem' }}>
            {error}
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={handleUnshare}
          isDisabled={unsharing}
          isLoading={unsharing}
          icon={<UndoIcon />}
        >
          {unsharing ? 'Unsharing...' : 'Unshare'}
        </Button>
        <Button
          variant="link"
          onClick={onClose}
          isDisabled={unsharing}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default UnshareArtifactModal;
