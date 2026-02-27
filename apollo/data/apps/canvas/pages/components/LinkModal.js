import React from 'react';
import {
  Modal,
  ModalVariant,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  TextInput,
  Button
} from '@patternfly/react-core';

const LinkModal = ({ isOpen, linkUrl, onClose, onAdd, onUrlChange }) => {
  const handleAdd = () => {
    if (linkUrl.trim()) {
      onAdd();
    }
  };

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="link-modal-title"
    >
      <ModalHeader title="Add Link Node" labelId="link-modal-title" />
      <ModalBody>
        <Form>
          <FormGroup label="URL" isRequired fieldId="link-url">
            <TextInput
              isRequired
              id="link-url"
              value={linkUrl}
              onChange={(e, value) => onUrlChange(value)}
              placeholder="https://example.com"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && linkUrl.trim()) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button 
          variant="primary" 
          onClick={handleAdd}
          isDisabled={!linkUrl.trim()}
        >
          Add
        </Button>
        <Button 
          variant="link" 
          onClick={onClose}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default LinkModal;
