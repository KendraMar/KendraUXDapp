import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  PageSection,
  Title,
  Content,
  Flex,
  FlexItem,
  Card,
  CardBody,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Label,
  LabelGroup,
  Button,
  Tabs,
  Tab,
  TabTitleText,
  TextArea,
  TextInput,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle
} from '@patternfly/react-core';
import {
  ArrowLeftIcon,
  CalendarAltIcon,
  ClockIcon,
  EyeIcon,
  UserIcon,
  ThumbsUpIcon,
  CommentIcon,
  OutlinedCommentDotsIcon,
  PaperPlaneIcon,
  UsersIcon,
  TagIcon,
  ListIcon,
  ClosedCaptioningIcon,
  PlayIcon,
  PauseIcon,
  AngleDownIcon,
  AngleRightIcon,
  VolumeUpIcon,
  SyncAltIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InfoCircleIcon,
  EllipsisVIcon,
  PencilAltIcon,
  TrashIcon,
  UploadIcon,
  ExternalLinkAltIcon,
  FileAltIcon,
  OutlinedBookmarkIcon
} from '@patternfly/react-icons';

// Import utilities
import { parseVTT } from './utils/vttParser';
import { formatDate, formatTimestamp, getRelativeTime, getInitials, getAvatarColor } from './utils/timeFormatters';

// Import components
import AudioWaveformPlayer from './components/AudioWaveformPlayer';
import GoogleDrivePlayer from './components/GoogleDrivePlayer';
import ChatTimeline from './components/ChatTimeline';
import MetadataItem from './components/MetadataItem';
import EditRecordingModal from './components/EditRecordingModal';
import DeleteRecordingModal from './components/DeleteRecordingModal';

const RecordingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const transcriptRef = useRef(null);
  const tabContentScrollRef = useRef(null);
  const activeCueRef = useRef(null);
  const chatScrollRef = useRef(null);
  const lastMessageRef = useRef(null);
  const [recording, setRecording] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeContentTab, setActiveContentTab] = useState(0);
  const [activeSidebarTab, setActiveSidebarTab] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [newDiscussion, setNewDiscussion] = useState('');
  const [transcript, setTranscript] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeCueIndex, setActiveCueIndex] = useState(-1);
  const [showFutureMessages, setShowFutureMessages] = useState(false);
  const [prevPastMessageCount, setPrevPastMessageCount] = useState(0);
  
  // Transcription state
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState(null);
  
  // Fetch related files state (for Google Drive recordings)
  const [fetchingRelated, setFetchingRelated] = useState(false);
  const [fetchRelatedResult, setFetchRelatedResult] = useState(null);
  
  // Manual chat import state
  const [chatImportUrl, setChatImportUrl] = useState('');
  const [importingChat, setImportingChat] = useState(false);
  const [chatImportResult, setChatImportResult] = useState(null);
  
  // Description import state
  const [descriptionImportUrl, setDescriptionImportUrl] = useState('');
  const [importingDescription, setImportingDescription] = useState(false);
  const [descriptionImportResult, setDescriptionImportResult] = useState(null);
  
  // Inline description editing state
  const [descriptionText, setDescriptionText] = useState('');
  const [isSavingDescription, setIsSavingDescription] = useState(false);
  const [descriptionSaveResult, setDescriptionSaveResult] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Kebab menu state
  const [isKebabOpen, setIsKebabOpen] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', presenter: '', tags: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Source selection state (for multi-source recordings)
  const [selectedSourceId, setSelectedSourceId] = useState(null);
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);

  // Derive the active source from the sources array
  const activeSource = useMemo(() => {
    if (!recording?.sources?.length) return null;
    if (selectedSourceId) {
      const found = recording.sources.find(s => s.id === selectedSourceId);
      if (found) return found;
    }
    // Fall back to default source or first source
    return recording.sources.find(s => s.default) || recording.sources[0];
  }, [recording?.sources, selectedSourceId]);

  useEffect(() => {
    fetchRecording();
  }, [id]);

  // Initialize description text when recording loads
  useEffect(() => {
    if (recording) {
      setDescriptionText(recording.description || '');
    }
  }, [recording?.id]);

  // Fetch and parse transcript
  useEffect(() => {
    if (recording?.hasTranscript) {
      fetch(`/api/recordings/${id}/transcript`)
        .then(res => res.text())
        .then(vttContent => {
          const cues = parseVTT(vttContent);
          setTranscript(cues);
        })
        .catch(err => console.error('Error loading transcript:', err));
    }
  }, [recording, id]);

  // Helper to get the active media element (video or audio)
  const getMediaElement = useCallback(() => {
    return videoRef.current || audioRef.current;
  }, []);

  // Media time update handler (works for both video and audio)
  useEffect(() => {
    const media = getMediaElement();
    if (!media) return;

    const handleTimeUpdate = () => {
      const time = media.currentTime;
      setCurrentTime(time);
      
      // Find active cue
      const cueIndex = transcript.findIndex(
        cue => time >= cue.start && time < cue.end
      );
      setActiveCueIndex(cueIndex);
    };

    media.addEventListener('timeupdate', handleTimeUpdate);
    return () => media.removeEventListener('timeupdate', handleTimeUpdate);
  }, [transcript, getMediaElement]);

  // Auto-scroll to active cue
  useEffect(() => {
    if (activeCueRef.current && tabContentScrollRef.current && activeContentTab === 3) {
      const container = tabContentScrollRef.current;
      const element = activeCueRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      // Check if element is outside visible area
      if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeCueIndex, activeContentTab]);

  // Compute past and future chat messages based on current playback time
  const pastMessages = recording?.chat?.filter(
    msg => msg.recordingTimeSeconds !== undefined && msg.recordingTimeSeconds <= currentTime
  ) || [];
  
  const futureMessages = recording?.chat?.filter(
    msg => msg.recordingTimeSeconds !== undefined && msg.recordingTimeSeconds > currentTime
  ) || [];

  // Auto-scroll to latest message when a new one appears
  useEffect(() => {
    if (pastMessages.length > prevPastMessageCount && lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    setPrevPastMessageCount(pastMessages.length);
  }, [pastMessages.length, prevPastMessageCount]);

  // Seek to transcript cue (works for video, audio, and Google Drive recordings)
  const seekToCue = useCallback((startTime) => {
    const media = getMediaElement();
    if (media) {
      // For local video/audio with a media element
      media.currentTime = startTime;
      media.play();
    } else if (activeSource?.type === 'google-drive') {
      // For Google Drive sources, update the time state directly
      // Note: This updates our timeline but can't seek the embedded video
      setCurrentTime(startTime);
    }
  }, [getMediaElement, activeSource]);

  const fetchRecording = async () => {
    try {
      const response = await fetch(`/api/recordings/${id}`);
      const data = await response.json();
      if (data.success) {
        setRecording(data.recording);
      } else {
        setError(data.error);
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching recording:', err);
      setError('Failed to load recording');
      setLoading(false);
    }
  };

  const startTranscription = async () => {
    setTranscribing(true);
    setTranscriptionError(null);
    
    try {
      const response = await fetch(`/api/recordings/${id}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setTranscriptionError(data.error || 'Transcription failed');
      } else {
        // Refresh the recording to get the new transcript
        await fetchRecording();
        // Fetch the transcript
        const transcriptResponse = await fetch(`/api/recordings/${id}/transcript`);
        const vttContent = await transcriptResponse.text();
        const cues = parseVTT(vttContent);
        setTranscript(cues);
      }
    } catch (err) {
      console.error('Error starting transcription:', err);
      setTranscriptionError('Failed to start transcription: ' + err.message);
    } finally {
      setTranscribing(false);
    }
  };

  // Fetch related files from Google Drive (transcript, chat)
  const fetchRelatedFiles = async () => {
    setFetchingRelated(true);
    setFetchRelatedResult(null);
    
    try {
      const response = await fetch(`/api/recordings/${id}/fetch-related`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setFetchRelatedResult({ error: data.error || 'Failed to fetch related files' });
      } else {
        // Build result message
        const imported = [];
        if (data.results?.transcript?.imported) {
          imported.push(`transcript from "${data.results.transcript.source}"`);
        }
        if (data.results?.chat?.imported) {
          imported.push(`${data.results.chat.messageCount} chat messages`);
        }
        
        if (imported.length > 0) {
          setFetchRelatedResult({ success: `Imported: ${imported.join(', ')}` });
          // Refresh the recording
          await fetchRecording();
          // Reload transcript if imported
          if (data.results?.transcript?.imported) {
            const transcriptResponse = await fetch(`/api/recordings/${id}/transcript`);
            const vttContent = await transcriptResponse.text();
            const cues = parseVTT(vttContent);
            setTranscript(cues);
          }
        } else {
          setFetchRelatedResult({ info: 'No related files (transcript, chat) found in Google Drive folder' });
        }
      }
    } catch (err) {
      console.error('Error fetching related files:', err);
      setFetchRelatedResult({ error: 'Failed to fetch related files: ' + err.message });
    } finally {
      setFetchingRelated(false);
    }
  };

  // Import chat from a Google Drive URL
  const importChatFromUrl = async (e) => {
    e.preventDefault();
    
    if (!chatImportUrl.trim()) {
      setChatImportResult({ error: 'Please enter a Google Drive URL' });
      return;
    }
    
    setImportingChat(true);
    setChatImportResult(null);
    
    try {
      const response = await fetch(`/api/recordings/${id}/import-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: chatImportUrl.trim() }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setChatImportResult({ error: data.error || 'Failed to import chat' });
      } else {
        setChatImportResult({ 
          success: `Imported ${data.messageCount} chat messages` 
        });
        setChatImportUrl('');
        // Refresh the recording to get the new chat
        await fetchRecording();
      }
    } catch (err) {
      console.error('Error importing chat:', err);
      setChatImportResult({ error: 'Failed to import chat: ' + err.message });
    } finally {
      setImportingChat(false);
    }
  };

  // Import description from a Google Doc URL
  const importDescriptionFromUrl = async (e) => {
    e.preventDefault();
    
    if (!descriptionImportUrl.trim()) {
      setDescriptionImportResult({ error: 'Please enter a Google Drive URL' });
      return;
    }
    
    setImportingDescription(true);
    setDescriptionImportResult(null);
    
    try {
      const response = await fetch(`/api/recordings/${id}/import-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: descriptionImportUrl.trim() }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setDescriptionImportResult({ error: data.error || 'Failed to import description' });
      } else {
        setDescriptionImportResult({ success: 'Description imported successfully' });
        setDescriptionImportUrl('');
        // Refresh the recording to get the new description
        await fetchRecording();
        // Update the description text field
        if (data.recording?.description) {
          setDescriptionText(data.recording.description);
        }
        // Close modal after short delay to show success message
        setTimeout(() => {
          setIsImportModalOpen(false);
          setDescriptionImportResult(null);
        }, 1500);
      }
    } catch (err) {
      console.error('Error importing description:', err);
      setDescriptionImportResult({ error: 'Failed to import description: ' + err.message });
    } finally {
      setImportingDescription(false);
    }
  };

  // Save description inline
  const handleSaveDescription = async () => {
    setIsSavingDescription(true);
    setDescriptionSaveResult(null);
    
    try {
      const response = await fetch(`/api/recordings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: descriptionText.trim()
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDescriptionSaveResult({ success: 'Description saved' });
        // Update local recording state
        if (data.recording) {
          setRecording(data.recording);
        } else {
          await fetchRecording();
        }
        // Switch back to view mode
        setIsEditingDescription(false);
        // Clear success message after 2 seconds
        setTimeout(() => setDescriptionSaveResult(null), 2000);
      } else {
        setDescriptionSaveResult({ error: data.error || 'Failed to save description' });
      }
    } catch (err) {
      console.error('Error saving description:', err);
      setDescriptionSaveResult({ error: 'Failed to save description' });
    } finally {
      setIsSavingDescription(false);
    }
  };

  // Import modal handlers
  const handleOpenImportModal = () => {
    setDescriptionImportUrl('');
    setDescriptionImportResult(null);
    setIsImportModalOpen(true);
  };

  const handleCloseImportModal = () => {
    setIsImportModalOpen(false);
  };

  // Render description as markdown
  const renderedDescription = useMemo(() => {
    if (!recording?.description) return null;
    
    const html = marked(recording.description, {
      breaks: true,
      gfm: true
    });
    
    return DOMPurify.sanitize(html);
  }, [recording?.description]);

  // Kebab menu handlers
  const onKebabToggle = () => {
    setIsKebabOpen(!isKebabOpen);
  };

  const onKebabSelect = () => {
    setIsKebabOpen(false);
  };

  // Edit modal handlers
  const handleOpenEditModal = () => {
    if (recording) {
      setEditForm({
        title: recording.title || '',
        description: recording.description || '',
        presenter: recording.presenter || '',
        tags: (recording.tags || []).join(', ')
      });
      setEditError(null);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditError(null);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateRecording = async () => {
    if (!editForm.title.trim()) {
      setEditError('Title is required');
      return;
    }

    setIsUpdating(true);
    setEditError(null);

    try {
      const response = await fetch(`/api/recordings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          presenter: editForm.presenter.trim() || null,
          tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()).filter(Boolean) : []
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update the local recording state with the updated data
        if (data.recording) {
          setRecording(data.recording);
        } else {
          // Fallback: refetch the recording
          await fetchRecording();
        }
        setIsEditModalOpen(false);
      } else {
        setEditError(data.error || 'Failed to update recording');
      }
    } catch (err) {
      console.error('Error updating recording:', err);
      setEditError('Failed to update recording. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete modal handlers
  const handleOpenDeleteModal = () => {
    setDeleteError(null);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteError(null);
  };

  const handleDeleteRecording = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/recordings/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        // Navigate back to recordings list
        navigate('/recordings');
      } else {
        setDeleteError(data.error || 'Failed to delete recording');
      }
    } catch (err) {
      console.error('Error deleting recording:', err);
      setDeleteError('Failed to delete recording. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };


  const seekToChapter = (timeString) => {
    const media = getMediaElement();
    if (media) {
      const parts = timeString.split(':').map(Number);
      const seconds = parts[0] * 3600 + parts[1] * 60 + (parts[2] || 0);
      media.currentTime = seconds;
      media.play();
    }
  };

  if (loading) {
    return (
      <PageSection isFilled>
        <EmptyState>
          <Spinner size="xl" />
          <EmptyStateBody>Loading recording...</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  if (error || !recording) {
    return (
      <PageSection isFilled>
        <EmptyState variant="lg">
          <Title headingLevel="h2" size="lg">Error Loading Recording</Title>
          <EmptyStateBody>{error || 'Recording not found'}</EmptyStateBody>
          <Button variant="primary" onClick={() => navigate('/recordings')}>
            <ArrowLeftIcon /> Back to Recordings
          </Button>
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
      {/* Header */}
      <div style={{ 
        padding: '1rem 1.5rem', 
        borderBottom: '1px solid var(--pf-t--global--border--color--default)',
        flexShrink: 0
      }}>
        <Button 
          variant="link" 
          onClick={() => navigate('/recordings')}
          style={{ padding: 0 }}
        >
          <ArrowLeftIcon style={{ marginRight: '8px' }} />
          Back to Recordings
        </Button>
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        overflow: 'hidden',
        gap: '0'
      }}>
        {/* Left Side - Video + Content Tabs */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0
        }}>
          {/* Media Player - Video, Audio, or External (Google Drive) */}
          {/* Use activeSource to determine which player to render */}
          {activeSource?.type === 'local' && recording.mediaType === 'audio' ? (
            <AudioWaveformPlayer
              audioRef={audioRef}
              recordingId={id}
              recording={recording}
              sourceId={activeSource.id}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
            />
          ) : activeSource?.type === 'google-drive' && activeSource.googleDrive?.fileId ? (
            // Google Drive embedded video player with manual time tracking
            <GoogleDrivePlayer
              fileId={activeSource.googleDrive.fileId}
              thumbnail={recording.thumbnail}
              durationSeconds={recording.durationSeconds}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
            />
          ) : activeSource?.type === 'local' ? (
            <div style={{ 
              position: 'relative',
              width: '100%',
              maxHeight: '60vh',
              backgroundColor: '#000',
              flexShrink: 0
            }}>
              <video
                ref={videoRef}
                controls
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '60vh',
                  objectFit: 'contain',
                  backgroundColor: '#000'
                }}
                poster={recording.thumbnail}
                crossOrigin="anonymous"
              >
                <source 
                  src={`/api/recordings/${id}/stream${activeSource.id ? `?sourceId=${activeSource.id}` : ''}`} 
                  type={activeSource.mimeType || 'video/mp4'} 
                />
                {recording.hasTranscript && (
                  <track 
                    kind="captions" 
                    src={`/api/recordings/${id}/transcript`} 
                    srcLang="en" 
                    label="English"
                    default
                  />
                )}
                Your browser does not support the video tag.
              </video>
            </div>
          ) : null}
          
          {/* Source Selector - shown when multiple sources exist */}
          {recording.sources && recording.sources.length > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--pf-t--global--background--color--secondary--default)',
              borderBottom: '1px solid var(--pf-t--global--border--color--default)'
            }}>
              <span style={{ 
                fontSize: '0.8rem', 
                color: 'var(--pf-t--global--text--color--subtle)',
                fontWeight: '500'
              }}>
                Source:
              </span>
              <Dropdown
                isOpen={isSourceDropdownOpen}
                onSelect={() => setIsSourceDropdownOpen(false)}
                onOpenChange={(isOpen) => setIsSourceDropdownOpen(isOpen)}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef}
                    onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)}
                    isExpanded={isSourceDropdownOpen}
                    style={{ minWidth: '180px' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {activeSource?.type === 'google-drive' && (
                        <svg width="14" height="14" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                        </svg>
                      )}
                      {activeSource?.type === 'local' && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.7 }}>
                          <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                        </svg>
                      )}
                      {activeSource?.title || 'Select source'}
                      {activeSource?.default && (
                        <span style={{ 
                          fontSize: '0.65rem', 
                          opacity: 0.6,
                          marginLeft: '4px'
                        }}>
                          (default)
                        </span>
                      )}
                    </span>
                  </MenuToggle>
                )}
              >
                <DropdownList>
                  {recording.sources.map((source) => (
                    <DropdownItem
                      key={source.id}
                      onClick={() => {
                        setSelectedSourceId(source.id);
                        setCurrentTime(0); // Reset playback when switching sources
                      }}
                      isSelected={activeSource?.id === source.id}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {source.type === 'google-drive' && (
                          <svg width="14" height="14" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                          </svg>
                        )}
                        {source.type === 'local' && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.7 }}>
                            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                          </svg>
                        )}
                        <span>{source.title}</span>
                        {source.default && (
                          <span style={{ 
                            fontSize: '0.65rem', 
                            opacity: 0.5,
                            marginLeft: 'auto'
                          }}>
                            (default)
                          </span>
                        )}
                      </span>
                    </DropdownItem>
                  ))}
                </DropdownList>
              </Dropdown>
            </div>
          )}
          
          {/* Chat Timeline Bar */}
          {recording.chat && recording.chat.length > 0 && recording.durationSeconds > 0 && (
            <ChatTimeline
              chatMessages={recording.chat}
              durationSeconds={recording.durationSeconds}
              currentTime={currentTime}
              onSeek={seekToCue}
            />
          )}

          {/* Video Info & Tabs */}
          <div style={{ 
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0
          }}>
            {/* Title and Meta */}
            <div style={{ 
              padding: '1.5rem 1.5rem 0 1.5rem',
              flexShrink: 0
            }}>
              <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsFlexStart' }}>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <h1 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '700',
                    marginBottom: '0.75rem',
                    lineHeight: '1.3'
                  }}>
                    {recording.title}
                  </h1>
                </FlexItem>
                <FlexItem>
                  <Dropdown
                    isOpen={isKebabOpen}
                    onSelect={onKebabSelect}
                    onOpenChange={(isOpen) => setIsKebabOpen(isOpen)}
                    toggle={(toggleRef) => (
                      <MenuToggle
                        ref={toggleRef}
                        aria-label="Recording actions"
                        variant="plain"
                        onClick={onKebabToggle}
                        isExpanded={isKebabOpen}
                      >
                        <EllipsisVIcon />
                      </MenuToggle>
                    )}
                    popperProps={{ position: 'right' }}
                  >
                    <DropdownList>
                      <DropdownItem
                        key="edit"
                        icon={<PencilAltIcon />}
                        onClick={handleOpenEditModal}
                      >
                        Edit recording
                      </DropdownItem>
                      <DropdownItem
                        key="delete"
                        icon={<TrashIcon />}
                        onClick={handleOpenDeleteModal}
                        style={{ color: 'var(--pf-v6-global--danger-color--100)' }}
                      >
                        Delete recording
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </FlexItem>
              </Flex>
              <Flex spaceItems={{ default: 'spaceItemsLg' }} alignItems={{ default: 'alignItemsCenter' }} wrap={{ default: 'wrap' }}>
                <FlexItem>
                  <span style={{ color: 'var(--pf-t--global--text--color--subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarAltIcon />
                    {formatDate(recording.recordedAt)}
                  </span>
                </FlexItem>
                {recording.duration && (
                  <FlexItem>
                    <span style={{ color: 'var(--pf-t--global--text--color--subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ClockIcon />
                      {recording.duration}
                    </span>
                  </FlexItem>
                )}
                <FlexItem>
                  <span style={{ color: 'var(--pf-t--global--text--color--subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <EyeIcon />
                    {recording.views} views
                  </span>
                </FlexItem>
                {recording.presenter && (
                  <FlexItem>
                    <span style={{ color: 'var(--pf-t--global--text--color--subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserIcon />
                      {recording.presenter}
                    </span>
                  </FlexItem>
                )}
              </Flex>
              
              {/* Tags */}
              {recording.tags && recording.tags.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <LabelGroup>
                    {recording.tags.map(tag => (
                      <Label key={tag} color="blue" isCompact>
                        {tag}
                      </Label>
                    ))}
                  </LabelGroup>
                </div>
              )}
            </div>

            {/* Content Tabs */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minHeight: 0,
              padding: '0 1.5rem 1.5rem 1.5rem',
              marginTop: '1rem'
            }}>
              <Tabs 
                activeKey={activeContentTab} 
                onSelect={(_, tabIndex) => setActiveContentTab(tabIndex)}
                style={{ flexShrink: 0 }}
              >
                <Tab eventKey={0} title={<TabTitleText>Description</TabTitleText>} />
                <Tab 
                  eventKey={1} 
                  title={
                    <TabTitleText>
                      <OutlinedBookmarkIcon style={{ marginRight: '6px' }} />
                      Chapters
                    </TabTitleText>
                  }
                />
                <Tab eventKey={2} title={<TabTitleText>Metadata</TabTitleText>} />
                <Tab 
                  eventKey={3} 
                  title={
                    <TabTitleText>
                      <ClosedCaptioningIcon style={{ marginRight: '6px' }} />
                      Transcript
                    </TabTitleText>
                  }
                />
              </Tabs>
              
              {/* Tab Content - Scrollable */}
              <div 
                ref={tabContentScrollRef}
                style={{ 
                  flex: 1,
                  overflowY: 'auto',
                  minHeight: 0
                }}
              >
                {activeContentTab === 0 && (
                  <div style={{ padding: '1.5rem 0' }}>
                    {/* Description - view/edit mode */}
                    <div>
                      {/* Action buttons row */}
                      <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '1rem' }}>
                        {/* Edit button - only show in view mode when there's a description */}
                        {!isEditingDescription && recording.description && (
                          <Button 
                            variant="link" 
                            isInline 
                            onClick={() => setIsEditingDescription(true)}
                            icon={<PencilAltIcon />}
                            style={{ fontSize: '0.875rem', padding: 0 }}
                          >
                            Edit
                          </Button>
                        )}
                        {/* Import from Google Drive button - only for Google Drive sources */}
                        {activeSource?.type === 'google-drive' && (
                          <Button 
                            variant="link" 
                            isInline 
                            onClick={handleOpenImportModal}
                            icon={<UploadIcon />}
                            style={{ fontSize: '0.875rem', padding: 0 }}
                          >
                            Import from Google Drive
                          </Button>
                        )}
                      </div>
                      
                      {/* View mode - show description as rendered markdown */}
                      {!isEditingDescription && recording.description ? (
                        <div 
                          className="task-description-markdown"
                          dangerouslySetInnerHTML={{ __html: renderedDescription }}
                          style={{ 
                            lineHeight: '1.6',
                            fontSize: '0.95rem'
                          }}
                        />
                      ) : (
                        /* Edit mode - show text area */
                        <>
                          <TextArea
                            id="description-edit"
                            aria-label="Recording description"
                            placeholder="Enter a description for this recording..."
                            value={descriptionText}
                            onChange={(_event, value) => setDescriptionText(value)}
                            rows={4}
                            style={{ marginBottom: '0.75rem' }}
                          />
                          
                          {/* Save result feedback */}
                          {descriptionSaveResult && (
                            <div style={{ 
                              padding: '0.5rem 0.75rem',
                              borderRadius: '4px',
                              backgroundColor: descriptionSaveResult.error 
                                ? 'var(--pf-t--global--color--status--danger--default)'
                                : 'var(--pf-t--global--color--status--success--default)',
                              color: '#fff',
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginBottom: '0.75rem'
                            }}>
                              {descriptionSaveResult.error && <ExclamationCircleIcon />}
                              {descriptionSaveResult.success && <CheckCircleIcon />}
                              {descriptionSaveResult.error || descriptionSaveResult.success}
                            </div>
                          )}
                          
                          {/* Save and Cancel buttons */}
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button 
                              variant="primary"
                              onClick={handleSaveDescription}
                              isLoading={isSavingDescription}
                              isDisabled={isSavingDescription}
                            >
                              Save
                            </Button>
                            {recording.description && (
                              <Button 
                                variant="link"
                                onClick={() => {
                                  setDescriptionText(recording.description || '');
                                  setIsEditingDescription(false);
                                  setDescriptionSaveResult(null);
                                }}
                                isDisabled={isSavingDescription}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {/* Participants */}
                    {recording.participants && recording.participants.length > 0 && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <UsersIcon />
                          Participants ({recording.participants.length})
                        </h4>
                        <Flex spaceItems={{ default: 'spaceItemsSm' }} wrap={{ default: 'wrap' }}>
                          {recording.participants.map(participant => (
                            <FlexItem key={participant}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                border: '1px solid var(--pf-t--global--border--color--default)'
                              }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  backgroundColor: getAvatarColor(participant),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  color: '#fff',
                                  fontWeight: '600'
                                }}>
                                  {getInitials(participant)}
                                </div>
                                <span style={{ fontSize: '0.875rem' }}>{participant}</span>
                              </div>
                            </FlexItem>
                          ))}
                        </Flex>
                      </div>
                    )}

                  </div>
                )}

                {/* Chapters Tab */}
                {activeContentTab === 1 && (
                  <div style={{ padding: '1.5rem 0' }}>
                    {recording.chapters && recording.chapters.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recording.chapters.map((chapter, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              gap: '16px',
                              padding: '16px',
                              backgroundColor: 'var(--pf-t--global--background--color--secondary--default)',
                              borderRadius: '8px',
                              border: '1px solid var(--pf-t--global--border--color--default)',
                              alignItems: 'flex-start'
                            }}
                          >
                            {/* Timestamp button */}
                            <button
                              onClick={() => seekToChapter(chapter.time || chapter.startTime)}
                              style={{
                                backgroundColor: 'var(--pf-t--global--color--brand--default)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 10px',
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                flexShrink: 0,
                                fontWeight: '500'
                              }}
                              title="Jump to this chapter"
                            >
                              {chapter.time || chapter.startTime}
                            </button>
                            
                            {/* Chapter content */}
                            <div style={{ flex: 1 }}>
                              <h4 style={{ 
                                margin: 0, 
                                marginBottom: chapter.description ? '0.5rem' : 0,
                                fontSize: '1rem',
                                fontWeight: '600'
                              }}>
                                {chapter.title}
                              </h4>
                              {chapter.description && (
                                <p style={{ 
                                  margin: 0, 
                                  fontSize: '0.875rem',
                                  color: 'var(--pf-t--global--text--color--subtle)',
                                  lineHeight: '1.5'
                                }}>
                                  {chapter.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '3rem 1rem',
                        color: 'var(--pf-t--global--text--color--subtle)'
                      }}>
                        <OutlinedBookmarkIcon style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }} />
                        <p style={{ margin: 0, marginBottom: '0.5rem', fontWeight: '500' }}>
                          No chapters defined
                        </p>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>
                          Chapters help navigate through different sections of the recording
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeContentTab === 2 && (
                  <div style={{ padding: '1.5rem 0' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                      gap: '1rem'
                    }}>
                      <MetadataItem label="Title" value={recording.title} />
                      {recording.presenter && <MetadataItem label="Presenter" value={recording.presenter} />}
                      <MetadataItem label="Recorded" value={formatDate(recording.recordedAt)} />
                      {recording.timezone && <MetadataItem label="Timezone" value={recording.timezone} />}
                      {recording.duration && <MetadataItem label="Duration" value={recording.duration} />}
                      <MetadataItem label="File Size" value={recording.sizeFormatted} />
                      <MetadataItem label="Media Type" value={recording.mediaType === 'audio' ? 'Audio' : 'Video'} />
                      <MetadataItem label="Format" value={(recording.mediaExtension || recording.videoExtension)?.toUpperCase()} />
                      <MetadataItem label="Media File" value={recording.mediaFile || recording.videoFile} />
                      <MetadataItem label="Views" value={`${recording.views || 0}`} />
                      <MetadataItem label="Has Transcript" value={recording.hasTranscript ? 'Yes' : 'No'} />
                      {recording.participants && <MetadataItem label="Participants" value={`${recording.participants.length} people`} />}
                      {recording.chapters && <MetadataItem label="Chapters" value={`${recording.chapters.length} chapters`} />}
                    </div>
                    
                    {/* Google Drive Actions - show when active source is Google Drive */}
                    {activeSource?.type === 'google-drive' && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <h4 style={{ 
                          marginBottom: '0.75rem', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px' 
                        }}>
                          <svg width="16" height="16" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                          </svg>
                          Google Drive
                        </h4>
                        
                        <div style={{
                          backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
                          padding: '1rem',
                          borderRadius: '6px',
                          border: '1px solid var(--pf-t--global--border--color--default)'
                        }}>
                          <p style={{ 
                            fontSize: '0.875rem', 
                            color: 'var(--pf-t--global--text--color--subtle)',
                            marginBottom: '0.75rem'
                          }}>
                            This recording is linked to Google Drive. You can fetch related files 
                            (transcripts, chat exports) from the same folder.
                          </p>
                          
                          <Button
                            variant="secondary"
                            onClick={fetchRelatedFiles}
                            isLoading={fetchingRelated}
                            isDisabled={fetchingRelated}
                            icon={<SyncAltIcon />}
                          >
                            {fetchingRelated ? 'Fetching...' : 'Fetch Related Files'}
                          </Button>
                          
                          {/* Fetch result feedback */}
                          {fetchRelatedResult && (
                            <div style={{ 
                              marginTop: '0.75rem',
                              padding: '0.75rem',
                              borderRadius: '4px',
                              backgroundColor: fetchRelatedResult.error 
                                ? 'var(--pf-t--global--color--status--danger--default)'
                                : fetchRelatedResult.success
                                  ? 'var(--pf-t--global--color--status--success--default)'
                                  : 'var(--pf-t--global--color--status--info--default)',
                              color: '#fff',
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              {fetchRelatedResult.error && <ExclamationCircleIcon />}
                              {fetchRelatedResult.success && <CheckCircleIcon />}
                              {fetchRelatedResult.info && <InfoCircleIcon />}
                              {fetchRelatedResult.error || fetchRelatedResult.success || fetchRelatedResult.info}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeContentTab === 3 && (
                  <div 
                    ref={transcriptRef}
                    style={{ 
                      padding: '1rem 0'
                    }}
                  >
                    {!recording.hasTranscript ? (
                      // Empty state - no transcript available
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '3rem 2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <ClosedCaptioningIcon style={{ 
                          fontSize: '3rem', 
                          color: 'var(--pf-t--global--text--color--subtle)' 
                        }} />
                        <div>
                          <p style={{ 
                            fontSize: '1.1rem', 
                            fontWeight: '500',
                            marginBottom: '0.5rem'
                          }}>
                            No transcript available
                          </p>
                          <p style={{ 
                            color: 'var(--pf-t--global--text--color--subtle)',
                            fontSize: '0.9rem',
                            marginBottom: '1.5rem'
                          }}>
                            Generate a transcript using AI-powered speech recognition
                          </p>
                        </div>
                        {transcriptionError && (
                          <Alert 
                            variant="danger" 
                            isInline 
                            title="Transcription failed"
                            style={{ marginBottom: '1rem', textAlign: 'left' }}
                          >
                            {transcriptionError}
                          </Alert>
                        )}
                        <Button
                          variant="primary"
                          onClick={startTranscription}
                          isLoading={transcribing}
                          isDisabled={transcribing}
                          icon={<ClosedCaptioningIcon />}
                        >
                          {transcribing ? 'Transcribing...' : 'Start Transcription'}
                        </Button>
                        {transcribing && (
                          <p style={{ 
                            color: 'var(--pf-t--global--text--color--subtle)',
                            fontSize: '0.85rem',
                            marginTop: '0.5rem'
                          }}>
                            This may take several minutes depending on the recording length...
                          </p>
                        )}
                      </div>
                    ) : transcript.length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        color: 'var(--pf-t--global--text--color--subtle)', 
                        padding: '2rem' 
                      }}>
                        <Spinner size="md" />
                        <p style={{ marginTop: '1rem' }}>Loading transcript...</p>
                      </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {transcript.map((cue, index) => {
                            const isActive = index === activeCueIndex;
                            return (
                              <button
                                key={cue.id}
                                ref={isActive ? activeCueRef : null}
                                onClick={() => seekToCue(cue.start)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '12px',
                                  padding: '12px 14px',
                                  backgroundColor: isActive ? 'var(--pf-t--global--color--brand--default)' : 'transparent',
                                  border: 'none',
                                  borderRadius: '8px',
                                  borderLeft: isActive ? '3px solid var(--pf-t--global--color--brand--default)' : '3px solid transparent',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  transition: 'all 0.2s ease',
                                  width: '100%'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'var(--pf-t--global--background--color--primary--hover)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isActive) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                  }
                                }}
                              >
                                <span style={{
                                  color: isActive ? '#fff' : 'var(--pf-t--global--text--color--subtle)',
                                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                  fontSize: '0.8rem',
                                  minWidth: '50px',
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  marginTop: '2px'
                                }}>
                                  {isActive && (
                                    <PlayIcon style={{ 
                                      fontSize: '0.7rem',
                                      animation: 'pulse 1.5s ease-in-out infinite'
                                    }} />
                                  )}
                                  {cue.startFormatted}
                                </span>
                                <span style={{ 
                                  color: isActive ? '#fff' : 'inherit',
                                  fontSize: '0.9rem',
                                  lineHeight: '1.5',
                                  fontWeight: isActive ? '500' : '400'
                                }}>
                                  {cue.text}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Add keyframe animation for the pulse effect */}
                      <style>
                        {`
                          @keyframes pulse {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0.4; }
                          }
                        `}
                      </style>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Chat & Discussion */}
        <div style={{ 
          width: '380px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--pf-t--global--border--color--default)',
          backgroundColor: 'var(--pf-t--global--background--color--secondary--default)',
          overflow: 'hidden'
        }}>
          <Tabs 
            activeKey={activeSidebarTab} 
            onSelect={(_, tabIndex) => setActiveSidebarTab(tabIndex)}
            style={{ 
              flexShrink: 0
            }}
          >
            <Tab 
              eventKey={0} 
              title={
                <TabTitleText>
                  <CommentIcon style={{ marginRight: '6px' }} />
                  Chat ({recording.chat?.length || 0})
                </TabTitleText>
              }
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: 'calc(100vh - 120px)',
                overflow: 'hidden'
              }}>
                {/* Chat Messages - Replay Mode */}
                <div 
                  ref={chatScrollRef}
                  style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    padding: '1rem'
                  }}
                >
                  {recording.chat?.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: 'var(--pf-t--global--text--color--subtle)', 
                      padding: '2rem',
                      fontSize: '0.875rem'
                    }}>
                      <CommentIcon style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.4 }} />
                      <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>No chat messages</p>
                      
                      {/* Google Drive import option */}
                      {activeSource?.type === 'google-drive' ? (
                        <div style={{ marginTop: '1.5rem', textAlign: 'left' }}>
                          <p style={{ 
                            marginBottom: '1rem', 
                            textAlign: 'center',
                            color: 'var(--pf-t--global--text--color--subtle)'
                          }}>
                            Import chat from a Google Drive file (text or doc)
                          </p>
                          
                          <form onSubmit={importChatFromUrl}>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                              <TextInput
                                type="text"
                                id="chat-import-url"
                                aria-label="Google Drive chat URL"
                                placeholder="https://drive.google.com/file/d/.../view"
                                value={chatImportUrl}
                                onChange={(_event, value) => setChatImportUrl(value)}
                                isDisabled={importingChat}
                                style={{ flex: 1 }}
                              />
                              <Button 
                                type="submit"
                                variant="secondary" 
                                isLoading={importingChat}
                                isDisabled={importingChat || !chatImportUrl.trim()}
                                icon={<UploadIcon />}
                                style={{ flexShrink: 0 }}
                              >
                                Import
                              </Button>
                            </div>
                          </form>
                          
                          {/* Import result feedback */}
                          {chatImportResult && (
                            <div style={{ 
                              padding: '0.5rem 0.75rem',
                              borderRadius: '4px',
                              backgroundColor: chatImportResult.error 
                                ? 'var(--pf-t--global--color--status--danger--default)'
                                : 'var(--pf-t--global--color--status--success--default)',
                              color: '#fff',
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              {chatImportResult.error && <ExclamationCircleIcon />}
                              {chatImportResult.success && <CheckCircleIcon />}
                              {chatImportResult.error || chatImportResult.success}
                            </div>
                          )}
                          
                          <p style={{ 
                            marginTop: '1rem', 
                            fontSize: '0.75rem', 
                            color: 'var(--pf-t--global--text--color--subtle)',
                            textAlign: 'center'
                          }}>
                            <ExternalLinkAltIcon style={{ marginRight: '4px' }} />
                            Paste a link to a Google Doc or text file containing chat messages
                          </p>
                        </div>
                      ) : (
                        <p style={{ margin: 0 }}>This recording has no chat history</p>
                      )}
                    </div>
                  ) : pastMessages.length === 0 && currentTime === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: 'var(--pf-t--global--text--color--subtle)', 
                      padding: '2rem',
                      fontSize: '0.875rem'
                    }}>
                      <CommentIcon style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.5 }} />
                      <p style={{ margin: 0 }}>Play the recording to see chat messages appear in real-time</p>
                    </div>
                  ) : (
                    <>
                      {/* Past Messages - Already happened */}
                      {pastMessages.map((msg, index) => {
                        const isLatest = index === pastMessages.length - 1;
                        return (
                          <div 
                            key={msg.id}
                            ref={isLatest ? lastMessageRef : null}
                            style={{ 
                              marginBottom: '0.75rem',
                              padding: '0.5rem',
                              borderRadius: '8px',
                              backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--pf-t--global--background--color--primary--default)',
                              animation: isLatest && pastMessages.length > 1 ? 'chatFadeIn 0.3s ease-out' : 'none'
                            }}
                          >
                            <Flex alignItems={{ default: 'alignItemsFlexStart' }} spaceItems={{ default: 'spaceItemsSm' }}>
                              <FlexItem>
                                <div style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  backgroundColor: getAvatarColor(msg.user),
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  color: '#fff',
                                  fontWeight: '600'
                                }}>
                                  {getInitials(msg.user)}
                                </div>
                              </FlexItem>
                              <FlexItem flex={{ default: 'flex_1' }}>
                                <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsBaseline' }}>
                                  <FlexItem>
                                    <span style={{ 
                                      fontWeight: '600',
                                      fontSize: '0.875rem'
                                    }}>
                                      {msg.user}
                                    </span>
                                  </FlexItem>
                                  <FlexItem>
                                    {msg.recordingTime ? (
                                      <button
                                        onClick={() => seekToCue(msg.recordingTimeSeconds)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: '2px 6px',
                                          margin: '-2px 0',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          color: 'var(--pf-t--global--color--brand--default)',
                                          fontSize: '0.75rem',
                                          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                          fontWeight: '500',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          transition: 'background-color 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--pf-t--global--background--color--primary--hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        title={`Jump to ${msg.recordingTime} in recording`}
                                      >
                                        <PlayIcon style={{ fontSize: '0.65rem' }} />
                                        {msg.recordingTime}
                                      </button>
                                    ) : (
                                      <span style={{ 
                                        color: 'var(--pf-t--global--text--color--subtle)', 
                                        fontSize: '0.75rem'
                                      }}>
                                        {formatTimestamp(msg.timestamp)}
                                      </span>
                                    )}
                                  </FlexItem>
                                </Flex>
                                <p style={{ 
                                  margin: '0.25rem 0 0 0',
                                  fontSize: '0.875rem',
                                  lineHeight: '1.4'
                                }}>
                                  {msg.message}
                                </p>
                              </FlexItem>
                            </Flex>
                          </div>
                        );
                      })}

                      {/* Future Messages - Collapsible Section */}
                      {futureMessages.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <button
                            onClick={() => setShowFutureMessages(!showFutureMessages)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              width: '100%',
                              padding: '10px 12px',
                              backgroundColor: 'var(--pf-t--global--background--color--primary--default)',
                              border: '1px dashed var(--pf-t--global--border--color--default)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              color: 'var(--pf-t--global--text--color--subtle)',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--pf-t--global--background--color--primary--hover)';
                              e.currentTarget.style.borderColor = 'var(--pf-t--global--color--brand--default)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--pf-t--global--background--color--primary--default)';
                              e.currentTarget.style.borderColor = 'var(--pf-t--global--border--color--default)';
                            }}
                          >
                            {showFutureMessages ? (
                              <AngleDownIcon style={{ fontSize: '0.9rem' }} />
                            ) : (
                              <AngleRightIcon style={{ fontSize: '0.9rem' }} />
                            )}
                            <span>
                              {futureMessages.length} upcoming message{futureMessages.length !== 1 ? 's' : ''}
                            </span>
                            <span style={{ 
                              marginLeft: 'auto', 
                              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                              fontSize: '0.7rem'
                            }}>
                              next at {futureMessages[0].recordingTime}
                            </span>
                          </button>

                          {/* Expanded Future Messages */}
                          {showFutureMessages && (
                            <div style={{ 
                              marginTop: '0.5rem',
                              opacity: 0.5,
                              borderLeft: '2px dashed var(--pf-t--global--border--color--default)',
                              marginLeft: '8px',
                              paddingLeft: '12px'
                            }}>
                              {futureMessages.map((msg, index) => (
                                <div 
                                  key={msg.id} 
                                  style={{ 
                                    marginBottom: '0.75rem',
                                    padding: '0.5rem',
                                    borderRadius: '8px'
                                  }}
                                >
                                  <Flex alignItems={{ default: 'alignItemsFlexStart' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                    <FlexItem>
                                      <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        backgroundColor: getAvatarColor(msg.user),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        color: '#fff',
                                        fontWeight: '600'
                                      }}>
                                        {getInitials(msg.user)}
                                      </div>
                                    </FlexItem>
                                    <FlexItem flex={{ default: 'flex_1' }}>
                                      <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsBaseline' }}>
                                        <FlexItem>
                                          <span style={{ 
                                            fontWeight: '600',
                                            fontSize: '0.875rem'
                                          }}>
                                            {msg.user}
                                          </span>
                                        </FlexItem>
                                        <FlexItem>
                                          <button
                                            onClick={() => seekToCue(msg.recordingTimeSeconds)}
                                            style={{
                                              background: 'none',
                                              border: 'none',
                                              padding: '2px 6px',
                                              margin: '-2px 0',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              color: 'var(--pf-t--global--color--brand--default)',
                                              fontSize: '0.75rem',
                                              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                              fontWeight: '500',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              transition: 'background-color 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--pf-t--global--background--color--primary--hover)'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            title={`Jump to ${msg.recordingTime} in recording`}
                                          >
                                            <PlayIcon style={{ fontSize: '0.65rem' }} />
                                            {msg.recordingTime}
                                          </button>
                                        </FlexItem>
                                      </Flex>
                                      <p style={{ 
                                        margin: '0.25rem 0 0 0',
                                        fontSize: '0.875rem',
                                        lineHeight: '1.4'
                                      }}>
                                        {msg.message}
                                      </p>
                                    </FlexItem>
                                  </Flex>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Animation keyframes for chat messages */}
                  <style>
                    {`
                      @keyframes chatFadeIn {
                        from {
                          opacity: 0;
                          transform: translateY(10px);
                        }
                        to {
                          opacity: 1;
                          transform: translateY(0);
                        }
                      }
                    `}
                  </style>
                </div>

                {/* Chat Input */}
                <div style={{ 
                  padding: '1rem',
                  borderTop: '1px solid var(--pf-t--global--border--color--default)'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-end'
                  }}>
                    <div style={{ flex: 1 }}>
                      <TextArea
                        placeholder="Add a comment during playback..."
                        value={newComment}
                        onChange={(_, value) => setNewComment(value)}
                        rows={1}
                        style={{
                          borderRadius: '20px',
                          resize: 'none'
                        }}
                      />
                    </div>
                    <Button 
                      variant="primary" 
                      isDisabled={!newComment.trim()}
                      style={{
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        padding: 0,
                        minWidth: 'unset'
                      }}
                    >
                      <PaperPlaneIcon />
                    </Button>
                  </div>
                </div>
              </div>
            </Tab>
            <Tab 
              eventKey={1} 
              title={
                <TabTitleText>
                  <OutlinedCommentDotsIcon style={{ marginRight: '6px' }} />
                  Discussion ({recording.discussion?.length || 0})
                </TabTitleText>
              }
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: 'calc(100vh - 120px)',
                overflow: 'hidden'
              }}>
                {/* Discussion Threads */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                  {recording.discussion?.length === 0 ? (
                    <div style={{ 
                      textAlign: 'center', 
                      color: 'var(--pf-t--global--text--color--subtle)', 
                      padding: '2rem',
                      fontSize: '0.875rem'
                    }}>
                      No discussions yet. Start the conversation!
                    </div>
                  ) : (
                    recording.discussion?.map((thread) => (
                      <div 
                        key={thread.id} 
                        style={{ 
                          marginBottom: '1.5rem',
                          paddingBottom: '1.5rem',
                          borderBottom: '1px solid var(--pf-t--global--border--color--default)'
                        }}
                      >
                        {/* Main Comment */}
                        <Flex alignItems={{ default: 'alignItemsFlexStart' }} spaceItems={{ default: 'spaceItemsSm' }}>
                          <FlexItem>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: getAvatarColor(thread.user),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              color: '#fff',
                              fontWeight: '600'
                            }}>
                              {getInitials(thread.user)}
                            </div>
                          </FlexItem>
                          <FlexItem flex={{ default: 'flex_1' }}>
                            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                              <FlexItem>
                                <span style={{ fontWeight: '600' }}>
                                  {thread.user}
                                </span>
                                <span style={{ color: 'var(--pf-t--global--text--color--subtle)', marginLeft: '8px', fontSize: '0.875rem' }}>
                                  {getRelativeTime(thread.timestamp)}
                                </span>
                              </FlexItem>
                            </Flex>
                            <p style={{ 
                              margin: '0.5rem 0',
                              lineHeight: '1.5'
                            }}>
                              {thread.content}
                            </p>
                            <Flex spaceItems={{ default: 'spaceItemsMd' }}>
                              <FlexItem>
                                <Button 
                                  variant="plain" 
                                  style={{ padding: '4px 8px' }}
                                >
                                  <ThumbsUpIcon style={{ marginRight: '4px' }} />
                                  {thread.likes}
                                </Button>
                              </FlexItem>
                              <FlexItem>
                                <Button 
                                  variant="plain" 
                                  style={{ padding: '4px 8px' }}
                                >
                                  <CommentIcon style={{ marginRight: '4px' }} />
                                  {thread.replies?.length || 0}
                                </Button>
                              </FlexItem>
                            </Flex>

                            {/* Replies */}
                            {thread.replies?.length > 0 && (
                              <div style={{ marginTop: '1rem', marginLeft: '0.5rem', borderLeft: '2px solid var(--pf-t--global--border--color--default)', paddingLeft: '1rem' }}>
                                {thread.replies.map((reply) => (
                                  <div key={reply.id} style={{ marginBottom: '1rem' }}>
                                    <Flex alignItems={{ default: 'alignItemsFlexStart' }} spaceItems={{ default: 'spaceItemsSm' }}>
                                      <FlexItem>
                                        <div style={{
                                          width: '32px',
                                          height: '32px',
                                          borderRadius: '50%',
                                          backgroundColor: getAvatarColor(reply.user),
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          fontSize: '12px',
                                          color: '#fff',
                                          fontWeight: '600'
                                        }}>
                                          {getInitials(reply.user)}
                                        </div>
                                      </FlexItem>
                                      <FlexItem flex={{ default: 'flex_1' }}>
                                        <span style={{ fontWeight: '600', fontSize: '0.875rem' }}>
                                          {reply.user}
                                        </span>
                                        <span style={{ color: 'var(--pf-t--global--text--color--subtle)', marginLeft: '8px', fontSize: '0.75rem' }}>
                                          {getRelativeTime(reply.timestamp)}
                                        </span>
                                        <p style={{ 
                                          margin: '0.25rem 0 0 0',
                                          fontSize: '0.875rem',
                                          lineHeight: '1.4'
                                        }}>
                                          {reply.content}
                                        </p>
                                        <Button 
                                          variant="plain" 
                                          style={{ padding: '4px 8px', marginTop: '4px' }}
                                        >
                                          <ThumbsUpIcon style={{ marginRight: '4px' }} />
                                          {reply.likes}
                                        </Button>
                                      </FlexItem>
                                    </Flex>
                                  </div>
                                ))}
                              </div>
                            )}
                          </FlexItem>
                        </Flex>
                      </div>
                    ))
                  )}
                </div>

                {/* New Discussion Input */}
                <div style={{ 
                  padding: '1rem',
                  borderTop: '1px solid var(--pf-t--global--border--color--default)'
                }}>
                  <TextArea
                    placeholder="Start a discussion about this recording..."
                    value={newDiscussion}
                    onChange={(_, value) => setNewDiscussion(value)}
                    rows={2}
                    style={{
                      borderRadius: '8px',
                      resize: 'none',
                      marginBottom: '0.5rem'
                    }}
                  />
                  <Button variant="primary" isBlock isDisabled={!newDiscussion.trim()}>
                    Post Discussion
                  </Button>
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>

      {/* Edit Recording Modal */}
      <EditRecordingModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        editForm={editForm}
        editError={editError}
        isUpdating={isUpdating}
        onFormChange={handleEditFormChange}
        onUpdate={handleUpdateRecording}
      />

      {/* Delete Confirmation Modal */}
      <DeleteRecordingModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        recordingTitle={recording?.title}
        deleteError={deleteError}
        isDeleting={isDeleting}
        onDelete={handleDeleteRecording}
      />

      {/* Import from Google Drive Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={handleCloseImportModal}
        variant="medium"
        aria-labelledby="import-description-modal-title"
      >
        <ModalHeader title="Import from Google Drive" labelId="import-description-modal-title" />
        <ModalBody>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '1.5rem'
          }}>
            <FileAltIcon style={{ 
              fontSize: '1.5rem', 
              color: 'var(--pf-t--global--text--color--subtle)' 
            }} />
            <div>
              <p style={{ 
                margin: 0, 
                fontWeight: '500',
                marginBottom: '0.25rem'
              }}>
                Import a summary from a Google Doc
              </p>
              <p style={{ 
                margin: 0, 
                fontSize: '0.875rem',
                color: 'var(--pf-t--global--text--color--subtle)'
              }}>
                Paste a link to a Google Doc containing a summary or meeting notes (e.g., Gemini-generated)
              </p>
            </div>
          </div>
          
          <form onSubmit={(e) => { importDescriptionFromUrl(e); }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <TextInput
                type="text"
                id="description-import-url-modal"
                aria-label="Google Drive document URL"
                placeholder="https://drive.google.com/file/d/.../view or https://docs.google.com/document/d/..."
                value={descriptionImportUrl}
                onChange={(_event, value) => setDescriptionImportUrl(value)}
                isDisabled={importingDescription}
                style={{ flex: 1 }}
              />
              <Button 
                type="submit"
                variant="primary" 
                isLoading={importingDescription}
                isDisabled={importingDescription || !descriptionImportUrl.trim()}
                icon={<UploadIcon />}
                style={{ flexShrink: 0 }}
              >
                Import
              </Button>
            </div>
          </form>
          
          {/* Import result feedback */}
          {descriptionImportResult && (
            <div style={{ 
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              backgroundColor: descriptionImportResult.error 
                ? 'var(--pf-t--global--color--status--danger--default)'
                : 'var(--pf-t--global--color--status--success--default)',
              color: '#fff',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '0.75rem'
            }}>
              {descriptionImportResult.error && <ExclamationCircleIcon />}
              {descriptionImportResult.success && <CheckCircleIcon />}
              {descriptionImportResult.error || descriptionImportResult.success}
            </div>
          )}
          
          <p style={{ 
            margin: 0, 
            fontSize: '0.75rem', 
            color: 'var(--pf-t--global--text--color--subtle)'
          }}>
            <ExternalLinkAltIcon style={{ marginRight: '4px' }} />
            The document content will be imported as the description for this recording
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="link" onClick={handleCloseImportModal} isDisabled={importingDescription}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

// Component definitions moved to ./components/ directory

export default RecordingDetail;
