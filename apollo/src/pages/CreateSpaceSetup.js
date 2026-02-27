import React, { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  TextInput,
  TextArea,
  Checkbox
} from '@patternfly/react-core';
import { MicrophoneIcon, ArrowRightIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { emojiOptions, generateSectionId } from '../components/AppSidebar/constants';

// Task suggestions (reused from Welcome page)
const taskSuggestions = [
  { id: 'review-designs', label: 'Review design specs', color: '#EC4899' },
  { id: 'write-code', label: 'Write code', color: '#3B82F6' },
  { id: 'attend-meetings', label: 'Attend meetings', color: '#8B5CF6' },
  { id: 'read-docs', label: 'Read documentation', color: '#10B981' },
  { id: 'check-emails', label: 'Check emails', color: '#F59E0B' },
  { id: 'plan-sprints', label: 'Plan sprints', color: '#6366F1' },
  { id: 'create-reports', label: 'Create reports', color: '#14B8A6' },
  { id: 'debug-issues', label: 'Debug issues', color: '#EF4444' },
  { id: 'collaborate', label: 'Collaborate with team', color: '#A855F7' }
];

// Dummy nav templates for quick space creation
const buildNavTemplate = (template) => {
  let order = 0;
  return template.map(item => {
    if (item.type === 'section') {
      return { ...item, id: generateSectionId(), order: order++ };
    }
    return { ...item, order: order++ };
  });
};

const navTemplates = [
  // 1: Product Design
  () => buildNavTemplate([
    { id: 'dashboard', path: '/dashboard', displayName: 'Dashboard', icon: 'TachometerAltIcon' },
    { id: 'feed', path: '/feed', displayName: 'Feed', icon: 'InboxIcon' },
    { id: 'tasks', path: '/tasks', displayName: 'Tasks', icon: 'ListIcon' },
    { type: 'section', title: 'Design' },
    { id: 'figma', path: '/figma', displayName: 'Figma', icon: 'ObjectGroupIcon' },
    { id: 'designs', path: '/designs', displayName: 'Designs', icon: 'PaintBrushIcon' },
    { id: 'prototypes', path: '/prototypes', displayName: 'Prototypes', icon: 'CubesIcon' },
    { id: 'canvas', path: '/canvas', displayName: 'Canvas', icon: 'TopologyIcon' },
    { type: 'section', title: 'Collaborate' },
    { id: 'chat', path: '/chat', displayName: 'Chat', icon: 'CommentsIcon' },
    { id: 'slides', path: '/slides', displayName: 'Slides', icon: 'ScreenIcon' },
    { id: 'recordings', path: '/recordings', displayName: 'Recordings', icon: 'VideoIcon' },
  ]),
  // 2: Engineering
  () => buildNavTemplate([
    { id: 'dashboard', path: '/dashboard', displayName: 'Dashboard', icon: 'TachometerAltIcon' },
    { id: 'feed', path: '/feed', displayName: 'Feed', icon: 'InboxIcon' },
    { id: 'tasks', path: '/tasks', displayName: 'Tasks', icon: 'ListIcon' },
    { type: 'section', title: 'Development' },
    { id: 'code', path: '/code', displayName: 'Code', icon: 'CodeIcon' },
    { id: 'gitlab', path: '/gitlab', displayName: 'GitLab', icon: 'GitlabIcon' },
    { id: 'kubernetes', path: '/kubernetes', displayName: 'Kubernetes', icon: 'CubesIcon' },
    { type: 'section', title: 'Docs & Comms' },
    { id: 'wiki', path: '/wiki', displayName: 'Wiki', icon: 'BookOpenIcon' },
    { id: 'chat', path: '/chat', displayName: 'Chat', icon: 'CommentsIcon' },
    { id: 'documents', path: '/documents', displayName: 'Documents', icon: 'BookOpenIcon' },
  ]),
  // 3: Research & Discovery
  () => buildNavTemplate([
    { id: 'feed', path: '/feed', displayName: 'Feed', icon: 'InboxIcon' },
    { id: 'research', path: '/research', displayName: 'Research', icon: 'BookIcon' },
    { id: 'calendar', path: '/calendar', displayName: 'Calendar', icon: 'CalendarAltIcon' },
    { type: 'section', title: 'Artifacts' },
    { id: 'recordings', path: '/recordings', displayName: 'Recordings', icon: 'VideoIcon' },
    { id: 'documents', path: '/documents', displayName: 'Documents', icon: 'BookOpenIcon' },
    { id: 'slides', path: '/slides', displayName: 'Slides', icon: 'ScreenIcon' },
    { type: 'section', title: 'Sources' },
    { id: 'rss', path: '/rss', displayName: 'RSS', icon: 'RssIcon' },
    { id: 'slack', path: '/slack', displayName: 'Slack', icon: 'SlackHashIcon' },
  ]),
  // 4: Project Management
  () => buildNavTemplate([
    { id: 'dashboard', path: '/dashboard', displayName: 'Dashboard', icon: 'TachometerAltIcon' },
    { id: 'feed', path: '/feed', displayName: 'Feed', icon: 'InboxIcon' },
    { id: 'tasks', path: '/tasks', displayName: 'Tasks', icon: 'ListIcon' },
    { id: 'calendar', path: '/calendar', displayName: 'Calendar', icon: 'CalendarAltIcon' },
    { type: 'section', title: 'Communication' },
    { id: 'chat', path: '/chat', displayName: 'Chat', icon: 'CommentsIcon' },
    { id: 'slack', path: '/slack', displayName: 'Slack', icon: 'SlackHashIcon' },
    { id: 'discussions', path: '/discussions', displayName: 'Discussions', icon: 'CommentsIcon' },
    { type: 'section', title: 'Artifacts' },
    { id: 'slides', path: '/slides', displayName: 'Slides', icon: 'ScreenIcon' },
    { id: 'documents', path: '/documents', displayName: 'Documents', icon: 'BookOpenIcon' },
  ]),
  // 5: Content & Media
  () => buildNavTemplate([
    { id: 'feed', path: '/feed', displayName: 'Feed', icon: 'InboxIcon' },
    { id: 'documents', path: '/documents', displayName: 'Documents', icon: 'BookOpenIcon' },
    { id: 'canvas', path: '/canvas', displayName: 'Canvas', icon: 'TopologyIcon' },
    { type: 'section', title: 'Create' },
    { id: 'slides', path: '/slides', displayName: 'Slides', icon: 'ScreenIcon' },
    { id: 'prototypes', path: '/prototypes', displayName: 'Prototypes', icon: 'CubesIcon' },
    { id: 'designs', path: '/designs', displayName: 'Designs', icon: 'PaintBrushIcon' },
    { type: 'section', title: 'Capture' },
    { id: 'screenshots', path: '/screenshots', displayName: 'Screenshots', icon: 'CameraIcon' },
    { id: 'recordings', path: '/recordings', displayName: 'Recordings', icon: 'VideoIcon' },
    { id: 'assets', path: '/assets', displayName: 'Assets', icon: 'PaletteIcon' },
  ]),
];

const CreateSpaceSetup = () => {
  const navigate = useNavigate();
  const { spaceId } = useParams();

  // Form state
  const [spaceName, setSpaceName] = useState('');
  const [spaceEmoji, setSpaceEmoji] = useState('');
  const [description, setDescription] = useState('');
  const [useAiSuggestions, setUseAiSuggestions] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Mic + task chip state
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());

  const handleMicrophoneClick = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

  const handleTaskClick = useCallback((task) => {
    const taskLabel = task.label.toLowerCase();

    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(task.id)) {
        newSet.delete(task.id);
        setDescription(prevDesc => {
          let newDesc = prevDesc
            .replace(new RegExp(`,\\s*${taskLabel}`, 'gi'), '')
            .replace(new RegExp(`${taskLabel}\\s*,\\s*`, 'gi'), '')
            .replace(new RegExp(`^${taskLabel}$`, 'gi'), '');
          newDesc = newDesc.replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
          return newDesc;
        });
      } else {
        newSet.add(task.id);
        setDescription(prevDesc => {
          const separator = prevDesc.trim() ? ', ' : '';
          return prevDesc + separator + taskLabel;
        });
      }
      return newSet;
    });
  }, []);

  const handleCreate = async () => {
    if (!spaceName.trim()) return;

    setIsCreating(true);
    try {
      // Pick a random nav template
      const templateFn = navTemplates[Math.floor(Math.random() * navTemplates.length)];
      const items = templateFn();

      // Update the draft space with actual details
      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: spaceName,
          emoji: spaceEmoji || '📁',
          items
        })
      });

      if (response.ok) {
        // Set this space as the active space
        await fetch('/api/spaces/active', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ spaceId })
        });

        // Tell the sidebar to refresh and animate new nav items
        window.dispatchEvent(new CustomEvent('apollo-spaces-updated'));
        window.dispatchEvent(new CustomEvent('apollo-nav-animate'));
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error setting up space:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="create-space-container">
      <div className="create-space-content">
        {/* Icon */}
        <div className="create-space-icon">
          {spaceEmoji || <PlusCircleIcon />}
        </div>

        {/* Title */}
        <h1 className="create-space-title">Create your space</h1>
        <p className="create-space-subtitle">
          Give your space a name and describe what you'll use it for.
        </p>

        {/* Name input */}
        <div className="create-space-field">
          <label className="create-space-label" htmlFor="space-name">
            Name
          </label>
          <div className="welcome-name-input-wrapper">
            <TextInput
              id="space-name"
              value={spaceName}
              onChange={(e, val) => setSpaceName(val)}
              placeholder="e.g., Project Alpha"
              aria-label="Space name"
              className="welcome-name-input"
              autoFocus
            />
          </div>
        </div>

        {/* Emoji selector */}
        <div className="create-space-field">
          <label className="create-space-label">Emoji (optional)</label>
          <div className="create-space-emoji-row">
            {emojiOptions.map((emoji) => (
              <button
                key={emoji}
                className={`create-space-emoji-btn ${spaceEmoji === emoji ? 'selected' : ''}`}
                onClick={() => setSpaceEmoji(spaceEmoji === emoji ? '' : emoji)}
                type="button"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Description with mic */}
        <div className="create-space-field">
          <label className="create-space-label" htmlFor="space-description">
            What will you use this space for?
          </label>
          <div className="welcome-task-input-wrapper">
            <TextArea
              id="space-description"
              value={description}
              onChange={(e, val) => setDescription(val)}
              placeholder="Describe the tasks you'll do, tools you'll use..."
              aria-label="Describe your tasks"
              className="welcome-task-input"
              rows={3}
              resizeOrientation="vertical"
            />
            <button
              className={`welcome-mic-button ${isRecording ? 'recording' : ''}`}
              onClick={handleMicrophoneClick}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
              type="button"
            >
              {isRecording ? (
                <div className="welcome-waveform">
                  <span className="wave-bar"></span>
                  <span className="wave-bar"></span>
                  <span className="wave-bar"></span>
                  <span className="wave-bar"></span>
                  <span className="wave-bar"></span>
                </div>
              ) : (
                <MicrophoneIcon />
              )}
            </button>
          </div>
        </div>

        {/* Task suggestion chips */}
        <h3 className="welcome-tasks-heading">Or select some tasks</h3>
        <div className="welcome-task-chips">
          {taskSuggestions.map(task => (
            <button
              key={task.id}
              className={`welcome-task-chip ${selectedTaskIds.has(task.id) ? 'selected' : ''}`}
              style={{ '--task-color': task.color }}
              onClick={() => handleTaskClick(task)}
              type="button"
            >
              {task.label}
            </button>
          ))}
        </div>

        {/* AI suggestions checkbox */}
        {description.trim() && (
          <div className="create-space-ai-toggle">
            <Checkbox
              id="ai-suggestions"
              label="Let AI pre-populate navigation items based on your description"
              description="AI will analyze your description and suggest relevant navigation items"
              isChecked={useAiSuggestions}
              onChange={(e, checked) => setUseAiSuggestions(checked)}
            />
          </div>
        )}

        {/* Actions */}
        <div className="create-space-actions">
          <Button
            variant="link"
            onClick={() => {
              // Delete the draft space and go back
              fetch(`/api/spaces/${spaceId}`, { method: 'DELETE' })
                .then(() => {
                  window.dispatchEvent(new CustomEvent('apollo-spaces-updated'));
                  navigate('/dashboard');
                })
                .catch(() => navigate('/dashboard'));
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            isDisabled={!spaceName.trim() || isCreating}
            isLoading={isCreating}
            icon={<ArrowRightIcon />}
            iconPosition="end"
            className="create-space-submit-btn"
          >
            {isCreating ? 'Creating...' : 'Create space'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateSpaceSetup;
