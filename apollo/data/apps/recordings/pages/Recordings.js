import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecorder } from '../../../../src/lib/RecordingContext';
import {
  PageSection,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Title,
  Label,
  Flex,
  FlexItem
} from '@patternfly/react-core';
import {
  FilmIcon,
  CalendarAltIcon,
  EyeIcon,
  ClockIcon,
  VolumeUpIcon,
  PlayIcon
} from '@patternfly/react-icons';
import RecordingHeader from './components/RecordingHeader';
import RecordingCard from './components/RecordingCard';
import StopRecordingModal from './components/StopRecordingModal';
import ImportModal from './components/ImportModal';
import UploadModal from './components/UploadModal';
import { formatFileSize, formatDuration, formatDate } from './utils';
import CollectionLayout from '../../../../src/components/CollectionLayout';

const Recordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Use global recording context
  const recorder = useRecorder();

  // Google Drive URL lookup state
  const [driveUrl, setDriveUrl] = useState('');
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError] = useState(null);
  const [driveFileData, setDriveFileData] = useState(null);
  
  // Import state
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);

  // Local file upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Recording UI state (local to this page)
  const [isRecordMenuOpen, setIsRecordMenuOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [recordingTitle, setRecordingTitle] = useState('');

  useEffect(() => {
    fetchRecordings();
    
    // Set callback for when recording is saved (to refresh list)
    recorder.setOnRecordingSaved(() => {
      fetchRecordings();
    });
  }, [recorder]);

  // Handle stop recording - show modal for title
  const handleStopRecording = () => {
    recorder.stopRecording();
    
    // Set default title based on recording type and date/time
    const now = new Date();
    const defaultTitle = `${recorder.recordingType === 'audio' ? 'Audio' : 'Screen'} Recording - ${now.toLocaleDateString()} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setRecordingTitle(defaultTitle);
    setShowStopModal(true);
  };

  // Save the recording using context
  const saveRecording = async () => {
    const result = await recorder.saveRecording(recordingTitle);
    if (result.success) {
      setShowStopModal(false);
      setRecordingTitle('');
      fetchRecordings();
    }
  };

  // Cancel recording
  const cancelRecording = () => {
    recorder.cancelRecording();
    setShowStopModal(false);
    setRecordingTitle('');
  };

  const handleDriveUrlSubmit = async (e) => {
    e.preventDefault();
    
    if (!driveUrl.trim()) {
      setDriveError('Please enter a URL');
      return;
    }

    setDriveLoading(true);
    setDriveError(null);
    setDriveFileData(null);

    try {
      const response = await fetch('/api/google/drive/file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: driveUrl.trim() }),
      });

      const data = await response.json();

      if (!data.success) {
        setDriveError(data.error || 'Failed to fetch file data');
      } else {
        setDriveFileData(data);
      }
    } catch (err) {
      console.error('Error fetching drive file:', err);
      setDriveError('Failed to fetch file data: ' + err.message);
    } finally {
      setDriveLoading(false);
    }
  };

  // Handle local file selection
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadError(null);
      // Generate default title from filename
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
      setUploadTitle(nameWithoutExt);
    }
  };

  // Handle local file upload
  const handleLocalUpload = async () => {
    if (!uploadFile) {
      setUploadError('Please select a file');
      return;
    }

    // Check if it's a video or audio file
    const isVideo = uploadFile.type.startsWith('video/');
    const isAudio = uploadFile.type.startsWith('audio/');
    
    if (!isVideo && !isAudio) {
      setUploadError('Please select a video or audio file');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(10);

    try {
      // Read file as base64
      const reader = new FileReader();
      
      const mediaData = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            // Reading takes up 0-50% of progress
            setUploadProgress(Math.round((e.loaded / e.total) * 50));
          }
        };
        reader.readAsDataURL(uploadFile);
      });

      setUploadProgress(50);

      // Send to API
      const response = await fetch('/api/recordings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: uploadTitle || uploadFile.name.replace(/\.[^.]+$/, ''),
          mediaType: isVideo ? 'video' : 'audio',
          mediaData: mediaData,
          mimeType: uploadFile.type,
          description: `Uploaded on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })} at ${new Date().toLocaleTimeString()}`
        }),
      });

      setUploadProgress(90);

      const data = await response.json();

      if (!data.success) {
        setUploadError(data.error || 'Failed to upload recording');
      } else {
        setUploadProgress(100);
        // Close modal and reset state
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadTitle('');
        setUploadProgress(0);
        // Refresh recordings list
        fetchRecordings();
      }
    } catch (err) {
      console.error('Error uploading recording:', err);
      setUploadError('Failed to upload recording: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!driveFileData?.fileId) {
      setImportError('No file data available');
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const response = await fetch('/api/recordings/import/google-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId: driveFileData.fileId }),
      });

      const data = await response.json();

      if (!data.success) {
        setImportError(data.error || 'Failed to import recording');
      } else {
        // Build success message with import details
        let successMessage = `Successfully imported: ${data.recording?.title || 'Recording'}`;
        const importedItems = [];
        if (data.imported?.transcript) {
          importedItems.push('transcript');
        }
        if (data.imported?.chatMessages > 0) {
          importedItems.push(`${data.imported.chatMessages} chat messages`);
        }
        if (importedItems.length > 0) {
          successMessage += ` (with ${importedItems.join(', ')})`;
        }
        setImportSuccess(successMessage);
        // Clear the form
        setDriveUrl('');
        setDriveFileData(null);
        // Refresh recordings list
        fetchRecordings();
      }
    } catch (err) {
      console.error('Error importing recording:', err);
      setImportError('Failed to import recording: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const fetchRecordings = async () => {
    try {
      const response = await fetch('/api/recordings');
      const data = await response.json();
      if (data.success) {
        setRecordings(data.recordings);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching recordings:', err);
      setError('Failed to load recordings');
      setLoading(false);
    }
  };

  const handleRecordingClick = (recording) => {
    navigate(`/recordings/${recording.id}`);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setDriveUrl('');
    setDriveFileData(null);
    setDriveError(null);
    setImportError(null);
    setImportSuccess(null);
  };

  const handleCloseUploadModal = () => {
    if (!uploading) {
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadError(null);
      setUploadProgress(0);
    }
  };

  const handleImportAndClose = async () => {
    await handleImport();
    if (!importError) {
      // Close modal after successful import
      setTimeout(() => {
        setShowImportModal(false);
        setDriveUrl('');
        setDriveFileData(null);
        setImportSuccess(null);
      }, 1500);
    }
  };

  // ── Table columns for list view ─────────────────────────────────────
  const tableColumns = [
    {
      key: 'title',
      label: 'Title',
      render: (item) => (
        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <div style={{
              width: '48px',
              height: '36px',
              borderRadius: '4px',
              background: item.mediaType === 'audio'
                ? 'linear-gradient(135deg, #1e3a5f 0%, #2d5a7b 50%, #1e3a5f 100%)'
                : 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 50%, #1a1f2e 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {item.mediaType === 'audio' ? (
                <VolumeUpIcon style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)' }} />
              ) : (
                <PlayIcon style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)' }} />
              )}
            </div>
          </FlexItem>
          <FlexItem><strong>{item.title}</strong></FlexItem>
        </Flex>
      )
    },
    {
      key: 'mediaType',
      label: 'Type',
      width: 12,
      render: (item) => (
        <Label color={item.mediaType === 'audio' ? 'cyan' : 'blue'} isCompact>
          {item.mediaType === 'audio' ? 'Audio' : 'Video'}
        </Label>
      )
    },
    {
      key: 'duration',
      label: 'Duration',
      width: 12,
      render: (item) => (
        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem><ClockIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} /></FlexItem>
          <FlexItem>{item.duration || item.sizeFormatted || '—'}</FlexItem>
        </Flex>
      )
    },
    {
      key: 'recordedAt',
      label: 'Recorded',
      width: 18,
      render: (item) => formatDate(item.recordedAt)
    },
    {
      key: 'views',
      label: 'Views',
      width: 10,
      render: (item) => (
        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem><EyeIcon style={{ color: 'var(--pf-v6-global--Color--200)' }} /></FlexItem>
          <FlexItem>{item.views}</FlexItem>
        </Flex>
      )
    },
    {
      key: 'source',
      label: 'Source',
      width: 12,
      render: (item) => item.externalSource === 'google-drive' ? (
        <Label color="gold" isCompact>Google Drive</Label>
      ) : (
        <span style={{ color: 'var(--pf-v6-global--Color--200)' }}>Local</span>
      )
    }
  ];

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading recordings...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <FilmIcon size="xl" />
          <Title headingLevel="h2" size="lg">Error Loading Recordings</Title>
          <EmptyStateBody>{error}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden' 
    }}>
      <RecordingHeader
        recorder={recorder}
        recordings={recordings}
        isRecordMenuOpen={isRecordMenuOpen}
        setIsRecordMenuOpen={setIsRecordMenuOpen}
        onStartAudioRecording={recorder.startAudioRecording}
        onStartScreenRecording={recorder.startScreenRecording}
        onShowImportModal={() => setShowImportModal(true)}
        onShowUploadModal={() => setShowUploadModal(true)}
        onStopRecording={handleStopRecording}
      />
      
      <StopRecordingModal
        isOpen={showStopModal}
        onClose={cancelRecording}
        onSave={saveRecording}
        onCancel={cancelRecording}
        recordingTitle={recordingTitle}
        setRecordingTitle={setRecordingTitle}
        recordingType={recorder.recordingType}
        recordingDuration={recorder.recordingDuration}
        formatRecordingDuration={recorder.formatRecordingDuration}
        isSaving={recorder.isSaving}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={handleCloseImportModal}
        onImport={handleImportAndClose}
        driveUrl={driveUrl}
        setDriveUrl={setDriveUrl}
        driveLoading={driveLoading}
        driveError={driveError}
        driveFileData={driveFileData}
        importError={importError}
        importSuccess={importSuccess}
        importing={importing}
        handleDriveUrlSubmit={handleDriveUrlSubmit}
        formatFileSize={formatFileSize}
        formatDuration={formatDuration}
        formatDate={formatDate}
      />

      <UploadModal
        isOpen={showUploadModal}
        onClose={handleCloseUploadModal}
        onUpload={handleLocalUpload}
        uploadFile={uploadFile}
        setUploadFile={setUploadFile}
        uploadTitle={uploadTitle}
        setUploadTitle={setUploadTitle}
        uploading={uploading}
        uploadError={uploadError}
        uploadProgress={uploadProgress}
        handleFileSelect={handleFileSelect}
        formatFileSize={formatFileSize}
      />

      {/* Collection content with card/list toggle */}
      <CollectionLayout
        storageKey="recordings"
        items={recordings}
        renderCard={(recording) => (
          <RecordingCard
            recording={recording}
            onClick={handleRecordingClick}
            formatDate={formatDate}
          />
        )}
        columns={tableColumns}
        onItemClick={handleRecordingClick}
        emptyState={
          <EmptyState variant="lg">
            <FilmIcon size="xl" />
            <Title headingLevel="h2" size="lg">No Recordings Found</Title>
            <EmptyStateBody>
              Add video files to the data/recordings folder to see them here.
            </EmptyStateBody>
          </EmptyState>
        }
      />
    </div>
  );
};

export default Recordings;
