import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Flex,
  FlexItem
} from '@patternfly/react-core';

const DeletePersonModal = ({
  isOpen,
  onClose,
  onConfirm,
  person,
  getDisplayName
}) => {
  if (!person) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="delete-person-modal-title"
      variant="small"
    >
      <ModalHeader title="Delete Person" />
      <ModalBody>
        <p style={{ marginBottom: '1rem' }}>
          Are you sure you want to delete this person? This will remove all their information and private notes.
        </p>
        <Card isCompact>
          <CardBody>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
              <FlexItem>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    backgroundColor: 'var(--pf-v6-global--palette--blue-200)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--pf-v6-global--palette--blue-500)'
                  }}
                >
                  {(person.name?.first || '?').charAt(0).toUpperCase()}
                  {(person.name?.last || '').charAt(0).toUpperCase()}
                </div>
              </FlexItem>
              <FlexItem>
                <div style={{ fontWeight: 600 }}>{getDisplayName(person)}</div>
                {person.role && (
                  <div style={{ fontSize: '0.875rem', color: 'var(--pf-v6-global--Color--200)' }}>
                    {person.role}{person.company && ` · ${person.company}`}
                  </div>
                )}
              </FlexItem>
            </Flex>
          </CardBody>
        </Card>
        <p style={{ marginTop: '1rem', color: 'var(--pf-v6-global--danger-color--100)', fontSize: '0.875rem' }}>
          This action cannot be undone.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button key="delete" variant="danger" onClick={onConfirm}>
          Delete
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeletePersonModal;
