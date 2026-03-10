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
  Title,
  Label
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';

const ImportModal = ({
  isOpen,
  onClose,
  onImport,
  driveUrl,
  setDriveUrl,
  driveLoading,
  driveError,
  driveFileData,
  importError,
  importSuccess,
  importing,
  handleDriveUrlSubmit,
  formatFileSize,
  formatDuration,
  formatDate
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="import-gdrive-modal-title"
      variant="medium"
    >
      <ModalHeader title="Import from Google Drive" labelId="import-gdrive-modal-title" />
      <ModalBody>
        <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
          {/* URL Input Form */}
          <FlexItem>
            <Content component="p" style={{ marginBottom: '0.5rem' }}>
              Paste a Google Drive URL to import a video recording.
            </Content>
            <form onSubmit={handleDriveUrlSubmit}>
              <Flex alignItems={{ default: 'alignItemsFlexEnd' }} spaceItems={{ default: 'spaceItemsSm' }}>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <TextInput
                    type="text"
                    id="drive-url-input"
                    aria-label="Google Drive URL"
                    placeholder="https://drive.google.com/file/d/.../view"
                    value={driveUrl}
                    onChange={(_event, value) => setDriveUrl(value)}
                    isDisabled={driveLoading || importing}
                  />
                </FlexItem>
                <FlexItem>
                  <Button 
                    type="submit" 
                    variant="secondary" 
                    isLoading={driveLoading}
                    isDisabled={driveLoading || importing || !driveUrl.trim()}
                    icon={<SearchIcon />}
                  >
                    {driveLoading ? 'Loading...' : 'Lookup'}
                  </Button>
                </FlexItem>
              </Flex>
            </form>
          </FlexItem>

          {/* Error Display */}
          {driveError && (
            <FlexItem>
              <Alert 
                variant="danger" 
                isInline 
                title="Error"
              >
                {driveError}
              </Alert>
            </FlexItem>
          )}

          {/* Import Success Message */}
          {importSuccess && (
            <FlexItem>
              <Alert 
                variant="success" 
                isInline 
                title={importSuccess}
              />
            </FlexItem>
          )}

          {/* Import Error Message */}
          {importError && (
            <FlexItem>
              <Alert 
                variant="danger" 
                isInline 
                title="Import Failed"
              >
                {importError}
              </Alert>
            </FlexItem>
          )}

          {/* File Data Display */}
          {driveFileData && (
            <FlexItem>
              <Card>
                <CardBody>
                  <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsMd' }}>
                    {/* File Summary */}
                    <FlexItem>
                      <Title headingLevel="h3" size="lg">
                        {driveFileData.metadata?.name || 'Unknown File'}
                      </Title>
                    </FlexItem>
                    
                    <FlexItem>
                      <Flex spaceItems={{ default: 'spaceItemsLg' }} flexWrap={{ default: 'wrap' }}>
                        <FlexItem>
                          <Label color="blue">{driveFileData.metadata?.mimeType}</Label>
                        </FlexItem>
                        <FlexItem>
                          <strong>Size:</strong> {formatFileSize(parseInt(driveFileData.metadata?.size, 10))}
                        </FlexItem>
                        {driveFileData.metadata?.videoMediaMetadata?.durationMillis && (
                          <FlexItem>
                            <strong>Duration:</strong> {formatDuration(parseInt(driveFileData.metadata.videoMediaMetadata.durationMillis, 10))}
                          </FlexItem>
                        )}
                        {driveFileData.metadata?.videoMediaMetadata?.width && (
                          <FlexItem>
                            <strong>Resolution:</strong> {driveFileData.metadata.videoMediaMetadata.width}x{driveFileData.metadata.videoMediaMetadata.height}
                          </FlexItem>
                        )}
                      </Flex>
                    </FlexItem>

                    <FlexItem>
                      <Flex spaceItems={{ default: 'spaceItemsMd' }} flexWrap={{ default: 'wrap' }}>
                        <FlexItem>
                          <strong>Owner:</strong> {driveFileData.metadata?.owners?.[0]?.displayName || 'Unknown'} ({driveFileData.metadata?.owners?.[0]?.emailAddress || ''})
                        </FlexItem>
                        <FlexItem>
                          <strong>Created:</strong> {formatDate(driveFileData.metadata?.createdTime)}
                        </FlexItem>
                      </Flex>
                    </FlexItem>

                    <FlexItem>
                      <strong>Google Drive ID:</strong> <code>{driveFileData.fileId}</code>
                    </FlexItem>

                    {!driveFileData.metadata?.mimeType?.startsWith('video/') && (
                      <FlexItem>
                        <Alert 
                          variant="warning" 
                          isInline 
                          title="Only video files can be imported"
                        />
                      </FlexItem>
                    )}

                    {/* Raw Data Toggle */}
                    <FlexItem>
                      <details>
                        <summary style={{ cursor: 'pointer', color: 'var(--pf-v6-global--link--Color)' }}>
                          Show raw API response
                        </summary>
                        <pre style={{ 
                          backgroundColor: 'var(--pf-v6-global--BackgroundColor--200)',
                          color: 'var(--pf-v6-global--Color--100)',
                          padding: '1rem', 
                          borderRadius: '4px',
                          overflow: 'auto',
                          maxHeight: '200px',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          marginTop: '0.5rem'
                        }}>
                          {JSON.stringify(driveFileData, null, 2)}
                        </pre>
                      </details>
                    </FlexItem>
                  </Flex>
                </CardBody>
              </Card>
            </FlexItem>
          )}
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={onImport}
          isLoading={importing}
          isDisabled={importing || !driveFileData || !driveFileData.metadata?.mimeType?.startsWith('video/')}
        >
          {importing ? 'Importing...' : 'Import Recording'}
        </Button>
        <Button 
          variant="link" 
          onClick={onClose}
          isDisabled={importing}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ImportModal;
