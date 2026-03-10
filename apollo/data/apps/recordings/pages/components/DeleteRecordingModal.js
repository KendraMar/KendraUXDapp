import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Alert
} from '@patternfly/react-core';

const DeleteRecordingModal = ({
  isOpen,
  onClose,
  recordingTitle,
  deleteError,
  isDeleting,
  onDelete
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="small"
      aria-labelledby="delete-recording-modal-title"
    >
      <ModalHeader title="Delete Recording" labelId="delete-recording-modal-title" />
      <ModalBody>
        {deleteError && (
          <Alert variant="danger" isInline title="Error" style={{ marginBottom: '1rem' }}>
            {deleteError}
          </Alert>
        )}
        <p>Are you sure you want to delete <strong>{recordingTitle}</strong>?</p>
        <p style={{ color: 'var(--pf-t--global--text--color--subtle)', marginTop: '0.5rem' }}>
          This action cannot be undone. The recording and all associated data (transcript, chat, discussions) will be permanently removed.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={onDelete}
          isLoading={isDeleting}
          isDisabled={isDeleting}
        >
          Delete Recording
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isDeleting}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteRecordingModal;
