import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Checkbox
} from '@patternfly/react-core';

const ContactModal = ({
  isOpen,
  onClose,
  onSave,
  isEditMode,
  formData,
  handleFormChange
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="person-modal-title"
      aria-describedby="person-modal-body"
      variant="medium"
    >
      <ModalHeader title={isEditMode ? 'Edit Contact' : 'Add Contact'} />
      <ModalBody id="person-modal-body">
        <Form>
          <FormGroup label="Name" isRequired fieldId="person-name">
            <TextInput
              isRequired
              id="person-name"
              value={formData.name}
              onChange={(_event, value) => handleFormChange('name', value)}
            />
          </FormGroup>
          <FormGroup label="Role / Title" fieldId="person-role">
            <TextInput
              id="person-role"
              value={formData.role}
              onChange={(_event, value) => handleFormChange('role', value)}
              placeholder="e.g., Senior Engineer, Product Manager"
            />
          </FormGroup>
          <FormGroup label="Company" fieldId="person-company">
            <TextInput
              id="person-company"
              value={formData.company}
              onChange={(_event, value) => handleFormChange('company', value)}
            />
          </FormGroup>
          <FormGroup label="Email" fieldId="person-email">
            <TextInput
              type="email"
              id="person-email"
              value={formData.email}
              onChange={(_event, value) => handleFormChange('email', value)}
            />
          </FormGroup>
          <FormGroup label="Phone" fieldId="person-phone">
            <TextInput
              type="tel"
              id="person-phone"
              value={formData.phone}
              onChange={(_event, value) => handleFormChange('phone', value)}
            />
          </FormGroup>
          <FormGroup 
            label="Relationship" 
            fieldId="person-relationship"
            helperText="Describe how you know this person and your working relationship"
          >
            <TextArea
              id="person-relationship"
              value={formData.relationship}
              onChange={(_event, value) => handleFormChange('relationship', value)}
              placeholder="e.g., Direct manager, collaborator on Project X, former colleague..."
              rows={3}
            />
          </FormGroup>
          <FormGroup 
            label="Tags" 
            fieldId="person-tags"
            helperText="Comma-separated tags (e.g., engineering, mentor, teammate)"
          >
            <TextInput
              id="person-tags"
              value={formData.tags}
              onChange={(_event, value) => handleFormChange('tags', value)}
              placeholder="engineering, mentor, teammate"
            />
          </FormGroup>
          <FormGroup label="Notes" fieldId="person-notes">
            <TextArea
              id="person-notes"
              value={formData.notes}
              onChange={(_event, value) => handleFormChange('notes', value)}
              placeholder="Any additional notes about this person..."
              rows={3}
            />
          </FormGroup>
          <FormGroup fieldId="person-favorite">
            <Checkbox
              id="person-favorite"
              label="Mark as favorite"
              isChecked={formData.favorite}
              onChange={(_event, checked) => handleFormChange('favorite', checked)}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button key="save" variant="primary" onClick={onSave}>
          {isEditMode ? 'Save Changes' : 'Add Contact'}
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ContactModal;
