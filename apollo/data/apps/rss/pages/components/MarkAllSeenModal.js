import React from 'react';
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Button,
  Content
} from '@patternfly/react-core';

const MarkAllSeenModal = ({ isOpen, onClose, totalUnseenCount, onConfirm, markingAllSeen }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="small"
    >
      <ModalHeader title="Mark all as seen" />
      <ModalBody>
        <Content>
          Are you sure you want to mark all {totalUnseenCount} unseen items across all feeds as seen?
        </Content>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={onConfirm}
          isLoading={markingAllSeen}
          isDisabled={markingAllSeen}
        >
          {markingAllSeen ? 'Marking...' : 'Mark all as seen'}
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={markingAllSeen}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default MarkAllSeenModal;
