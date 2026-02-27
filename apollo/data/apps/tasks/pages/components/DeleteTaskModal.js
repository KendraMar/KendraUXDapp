import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Alert,
  Card,
  CardBody
} from '@patternfly/react-core';

const DeleteTaskModal = ({
  isOpen,
  onClose,
  task,
  onDelete,
  isDeleting,
  error
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="small"
    >
      <ModalHeader title="Delete task" />
      <ModalBody>
        {error && (
          <Alert variant="danger" isInline title="Error" style={{ marginBottom: '1rem' }}>
            {error}
          </Alert>
        )}
        <p>Are you sure you want to delete this task?</p>
        {task && (
          <Card isCompact style={{ marginTop: '1rem' }}>
            <CardBody>
              <strong>{task.key}</strong>: {task.summary}
            </CardBody>
          </Card>
        )}
        <p style={{ marginTop: '1rem', color: 'var(--pf-v6-global--danger-color--100)' }}>
          This action cannot be undone.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="danger"
          onClick={onDelete}
          isLoading={isDeleting}
          isDisabled={isDeleting}
        >
          Delete
        </Button>
        <Button
          variant="link"
          onClick={onClose}
          isDisabled={isDeleting}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteTaskModal;
