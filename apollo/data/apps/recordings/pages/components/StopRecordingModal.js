import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  TextInput,
  Flex,
  FlexItem,
  Content,
  Progress,
  ProgressVariant
} from '@patternfly/react-core';

const StopRecordingModal = ({
  isOpen,
  onClose,
  onSave,
  onCancel,
  recordingTitle,
  setRecordingTitle,
  recordingType,
  recordingDuration,
  formatRecordingDuration,
  isSaving
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      aria-labelledby="stop-recording-modal-title"
      variant="small"
    >
      <ModalHeader title="Save Recording" labelId="stop-recording-modal-title" />
      <ModalBody>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
          <FlexItem>
            <Content>
              Your {recordingType === 'audio' ? 'audio' : 'screen'} recording is {formatRecordingDuration(recordingDuration)} long. 
              Give it a name before saving.
            </Content>
          </FlexItem>
          <FlexItem>
            <TextInput
              type="text"
              id="recording-title"
              aria-label="Recording title"
              placeholder="Enter recording title..."
              value={recordingTitle}
              onChange={(_event, value) => setRecordingTitle(value)}
              isDisabled={isSaving}
            />
          </FlexItem>
          {isSaving && (
            <FlexItem>
              <Progress
                value={100}
                title="Saving..."
                variant={ProgressVariant.info}
                measureLocation="none"
              />
              <Content component="small" style={{ marginTop: '0.5rem' }}>
                Saving recording to disk...
              </Content>
            </FlexItem>
          )}
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button 
          variant="primary" 
          onClick={onSave}
          isLoading={isSaving}
          isDisabled={isSaving || !recordingTitle.trim()}
        >
          Save Recording
        </Button>
        <Button 
          variant="link" 
          onClick={onCancel}
          isDisabled={isSaving}
        >
          Discard
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default StopRecordingModal;
