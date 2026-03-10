import React from 'react';
import {
  PageSection,
  Title,
  Content,
  Flex,
  FlexItem,
  Button,
  Alert,
  Badge,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle
} from '@patternfly/react-core';
import {
  StopCircleIcon,
  PlusIcon,
  MicrophoneIcon,
  DesktopIcon,
  UploadIcon
} from '@patternfly/react-icons';

const RecordingHeader = ({
  recorder,
  recordings,
  isRecordMenuOpen,
  setIsRecordMenuOpen,
  onStartAudioRecording,
  onStartScreenRecording,
  onShowImportModal,
  onShowUploadModal,
  onStopRecording
}) => {
  return (
    <PageSection variant="light" style={{ flexShrink: 0 }}>
      <Flex alignItems={{ default: 'alignItemsCenter' }}>
        <FlexItem flex={{ default: 'flex_1' }}>
          <Title headingLevel="h1" size="2xl">
            Recordings
          </Title>
          <Content style={{ marginTop: '0.5rem' }}>
            Audio and video recordings of meetings, presentations, and events
          </Content>
        </FlexItem>
        <FlexItem>
          <Flex spaceItems={{ default: 'spaceItemsMd' }} alignItems={{ default: 'alignItemsCenter' }}>
            {/* Recording in progress indicator */}
            {recorder.isRecording && (
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} spaceItems={{ default: 'spaceItemsSm' }}>
                  <FlexItem>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: '#c9190b',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }} />
                  </FlexItem>
                  <FlexItem>
                    <span style={{ fontWeight: '600', color: '#c9190b' }}>
                      {recorder.recordingType === 'audio' ? 'Recording Audio' : 'Recording Screen'}
                    </span>
                  </FlexItem>
                  <FlexItem>
                    <Badge style={{ backgroundColor: '#c9190b', color: 'white' }}>
                      {recorder.formatRecordingDuration(recorder.recordingDuration)}
                    </Badge>
                  </FlexItem>
                  <FlexItem>
                    <Button 
                      variant="danger" 
                      onClick={onStopRecording}
                      icon={<StopCircleIcon />}
                    >
                      Stop
                    </Button>
                  </FlexItem>
                </Flex>
              </FlexItem>
            )}
            
            {/* Start Recording dropdown */}
            {!recorder.isRecording && (
              <FlexItem>
                <Dropdown
                  isOpen={isRecordMenuOpen}
                  onSelect={() => setIsRecordMenuOpen(false)}
                  onOpenChange={setIsRecordMenuOpen}
                  toggle={(toggleRef) => (
                    <MenuToggle
                      ref={toggleRef}
                      onClick={() => setIsRecordMenuOpen(!isRecordMenuOpen)}
                      isExpanded={isRecordMenuOpen}
                      variant="primary"
                      icon={<PlusIcon />}
                    >
                      Add Recording
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem
                      key="audio"
                      icon={<MicrophoneIcon />}
                      onClick={onStartAudioRecording}
                      description="Record audio from your microphone"
                    >
                      Audio Recording
                    </DropdownItem>
                    <DropdownItem
                      key="screen"
                      icon={<DesktopIcon />}
                      onClick={onStartScreenRecording}
                      description="Capture your screen with optional audio"
                    >
                      Screen Recording
                    </DropdownItem>
                    <DropdownItem
                      key="import-gdrive"
                      icon={<UploadIcon />}
                      onClick={onShowImportModal}
                      description="Import a video from Google Drive"
                    >
                      Import from Google Drive
                    </DropdownItem>
                    <DropdownItem
                      key="upload-local"
                      icon={<UploadIcon />}
                      onClick={onShowUploadModal}
                      description="Upload a video or audio file from your computer"
                    >
                      Upload Local File
                    </DropdownItem>
                  </DropdownList>
                </Dropdown>
              </FlexItem>
            )}
            
            <FlexItem>
              <Badge isRead>{recordings.length} recordings</Badge>
            </FlexItem>
          </Flex>
        </FlexItem>
      </Flex>
      
      {/* Recording error/success alerts */}
      {recorder.recordingError && (
        <Alert 
          variant="danger" 
          isInline 
          title="Recording Error" 
          style={{ marginTop: '1rem' }}
          actionClose={<Button variant="plain" onClick={() => recorder.clearMessages()}>×</Button>}
        >
          {recorder.recordingError}
        </Alert>
      )}
      {recorder.recordingSuccess && (
        <Alert 
          variant="success" 
          isInline 
          title={recorder.recordingSuccess}
          style={{ marginTop: '1rem' }}
          actionClose={<Button variant="plain" onClick={() => recorder.clearMessages()}>×</Button>}
        />
      )}
    </PageSection>
  );
};

export default RecordingHeader;
