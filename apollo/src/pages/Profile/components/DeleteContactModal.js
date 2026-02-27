import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@patternfly/react-core';

const DeleteContactModal = ({
  isOpen,
  onClose,
  onConfirm,
  personToDelete
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="delete-modal-title"
      variant="small"
    >
      <ModalHeader title="Delete Contact" />
      <ModalBody>
        Are you sure you want to delete <strong>{personToDelete?.name}</strong>? This action cannot be undone.
      </ModalBody>
      <ModalFooter>
        <Button key="confirm" variant="danger" onClick={onConfirm}>
          Delete
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteContactModal;
