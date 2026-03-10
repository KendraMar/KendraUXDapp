import React from 'react';
import {
  Modal,
  ModalVariant,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInput,
  Button,
  Alert
} from '@patternfly/react-core';

const AddFeedModal = ({
  isOpen,
  onClose,
  newFeedUrl,
  newFeedTitle,
  newFeedDescription,
  onUrlChange,
  onTitleChange,
  onDescriptionChange,
  onAddFeed,
  addingFeed,
  addFeedError
}) => {
  return (
    <Modal
      variant={ModalVariant.small}
      title="Add RSS Feed"
      isOpen={isOpen}
      onClose={() => {
        onClose();
      }}
      actions={[
        <Button key="add" variant="primary" onClick={onAddFeed} isLoading={addingFeed} isDisabled={!newFeedUrl}>
          Add Feed
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      ]}
    >
      <Form>
        {addFeedError && (
          <Alert variant="danger" title="Error adding feed" isInline style={{ marginBottom: '1rem' }}>
            {addFeedError}
          </Alert>
        )}
        <FormGroup label="Feed URL" isRequired fieldId="feed-url">
          <TextInput
            isRequired
            type="url"
            id="feed-url"
            value={newFeedUrl}
            onChange={(e, value) => onUrlChange(value)}
            placeholder="https://example.com/feed.xml"
          />
          <FormHelperText>
            <HelperText>
              <HelperTextItem>Enter the URL of the RSS or Atom feed</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
        <FormGroup label="Title" fieldId="feed-title">
          <TextInput
            type="text"
            id="feed-title"
            value={newFeedTitle}
            onChange={(e, value) => onTitleChange(value)}
            placeholder="Auto-detected from feed"
          />
        </FormGroup>
        <FormGroup label="Description" fieldId="feed-description">
          <TextInput
            type="text"
            id="feed-description"
            value={newFeedDescription}
            onChange={(e, value) => onDescriptionChange(value)}
            placeholder="Optional description"
          />
        </FormGroup>
      </Form>
    </Modal>
  );
};

export default AddFeedModal;
