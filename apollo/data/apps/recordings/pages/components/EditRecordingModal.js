import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Button,
  Alert
} from '@patternfly/react-core';

const EditRecordingModal = ({
  isOpen,
  onClose,
  editForm,
  editError,
  isUpdating,
  onFormChange,
  onUpdate
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="medium"
      aria-labelledby="edit-recording-modal-title"
    >
      <ModalHeader title="Edit Recording" labelId="edit-recording-modal-title" />
      <ModalBody>
        {editError && (
          <Alert variant="danger" isInline title="Error" style={{ marginBottom: '1rem' }}>
            {editError}
          </Alert>
        )}
        <Form>
          <FormGroup label="Title" isRequired fieldId="edit-title">
            <TextInput
              id="edit-title"
              value={editForm.title}
              onChange={(_, value) => onFormChange('title', value)}
              isRequired
            />
          </FormGroup>
          <FormGroup label="Description" fieldId="edit-description">
            <TextArea
              id="edit-description"
              value={editForm.description}
              onChange={(_, value) => onFormChange('description', value)}
              rows={4}
            />
          </FormGroup>
          <FormGroup label="Presenter" fieldId="edit-presenter">
            <TextInput
              id="edit-presenter"
              value={editForm.presenter}
              onChange={(_, value) => onFormChange('presenter', value)}
            />
          </FormGroup>
          <FormGroup label="Tags" fieldId="edit-tags" helperText="Comma-separated list of tags">
            <TextInput
              id="edit-tags"
              value={editForm.tags}
              onChange={(_, value) => onFormChange('tags', value)}
              placeholder="e.g., meeting, demo, tutorial"
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={onUpdate}
          isLoading={isUpdating}
          isDisabled={isUpdating}
        >
          Save Changes
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isUpdating}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default EditRecordingModal;
