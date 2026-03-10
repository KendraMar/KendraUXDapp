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
  Alert,
  Card,
  CardBody,
  Progress,
  ProgressVariant,
  Label
} from '@patternfly/react-core';

const UploadModal = ({
  isOpen,
  onClose,
  onUpload,
  uploadFile,
  setUploadFile,
  uploadTitle,
  setUploadTitle,
  uploading,
  uploadError,
  uploadProgress,
  handleFileSelect,
  formatFileSize
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="upload-local-modal-title"
      variant="medium"
    >
      <ModalHeader title="Upload Local File" labelId="upload-local-modal-title" />
      <ModalBody>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
          <FlexItem>
            <Content component="p" style={{ marginBottom: '0.5rem' }}>
              Select a video or audio file from your computer to add to your recordings.
            </Content>
          </FlexItem>

          {/* File Input */}
          <FlexItem>
            <input
              type="file"
              id="local-file-input"
              accept="video/*,audio/*"
              onChange={handleFileSelect}
              disabled={uploading}
              style={{ display: 'none' }}
            />
            <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsMd' }}>
              <FlexItem>
                <Button
                  variant="secondary"
                  onClick={() => document.getElementById('local-file-input').click()}
                  isDisabled={uploading}
                >
                  Choose File
                </Button>
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }}>
                <span style={{ color: uploadFile ? 'inherit' : 'var(--pf-v6-global--Color--200)' }}>
                  {uploadFile ? uploadFile.name : 'No file selected'}
                </span>
              </FlexItem>
            </Flex>
          </FlexItem>

          {/* File Info */}
          {uploadFile && (
            <FlexItem>
              <Card>
                <CardBody>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <Flex spaceItems={{ default: 'spaceItemsLg' }} flexWrap={{ default: 'wrap' }}>
                        <FlexItem>
                          <Label color={uploadFile.type.startsWith('video/') ? 'blue' : 'cyan'}>
                            {uploadFile.type.startsWith('video/') ? 'VIDEO' : 'AUDIO'}
                          </Label>
                        </FlexItem>
                        <FlexItem>
                          <strong>Size:</strong> {formatFileSize(uploadFile.size)}
                        </FlexItem>
                        <FlexItem>
                          <strong>Type:</strong> {uploadFile.type || 'Unknown'}
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </FlexItem>
          )}

          {/* Title Input */}
          {uploadFile && (
            <FlexItem>
              <Content component="p" style={{ marginBottom: '0.5rem' }}>
                <strong>Title</strong>
              </Content>
              <TextInput
                type="text"
                id="upload-title-input"
                aria-label="Recording title"
                placeholder="Enter a title for this recording..."
                value={uploadTitle}
                onChange={(_event, value) => setUploadTitle(value)}
                isDisabled={uploading}
              />
            </FlexItem>
          )}

          {/* Upload Progress */}
          {uploading && (
            <FlexItem>
              <Progress
                value={uploadProgress}
                title="Uploading..."
                variant={ProgressVariant.info}
                measureLocation="outside"
              />
              <Content component="small" style={{ marginTop: '0.5rem' }}>
                {uploadProgress < 50 ? 'Reading file...' : uploadProgress < 90 ? 'Uploading to server...' : 'Saving recording...'}
              </Content>
            </FlexItem>
          )}

          {/* Error Display */}
          {uploadError && (
            <FlexItem>
              <Alert 
                variant="danger" 
                isInline 
                title="Upload Failed"
              >
                {uploadError}
              </Alert>
            </FlexItem>
          )}
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={onUpload}
          isLoading={uploading}
          isDisabled={uploading || !uploadFile}
        >
          {uploading ? 'Uploading...' : 'Upload Recording'}
        </Button>
        <Button 
          variant="link" 
          onClick={onClose}
          isDisabled={uploading}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default UploadModal;
