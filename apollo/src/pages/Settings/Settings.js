import React from 'react';
import {
  PageSection,
  PageSectionVariants,
  Title,
  Content,
  Grid,
  GridItem,
  Tabs,
  Tab,
  TabTitleText,
  Card,
  CardTitle,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Switch,
  Form,
  FormGroup,
  FormSection,
  Slider,
  Label,
  Flex,
  FlexItem,
  TextInput,
  TextArea,
  Gallery,
  Alert,
  Spinner,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  Progress,
  ProgressSize,
  Checkbox,
  Breadcrumb,
  BreadcrumbItem,
  Divider,
  ExpandableSection
} from '@patternfly/react-core';
import {
  KeyIcon,
  CheckCircleIcon,
  PlusCircleIcon,
  ExclamationCircleIcon,
  SyncAltIcon,
  DownloadIcon,
  CogIcon,
  RobotIcon,
  UndoIcon,
  TimesIcon,
  TrashIcon,
  EditIcon,
  CatalogIcon,
  ExternalLinkAltIcon,
  GitlabIcon,
  GithubIcon,
  CodeBranchIcon
} from '@patternfly/react-icons';
import { loadOmnibarConfig, saveOmnibarConfig, resetOmnibarConfig, validateTrigger, DEFAULT_SHORTCUTS_LIST } from '../../lib/omnibarConfig';
import {
  loadKeyboardShortcuts,
  saveKeyboardShortcuts,
  resetKeyboardShortcuts,
  formatKeyCombination,
  eventToKeyCombination,
  findConflict,
  getCategories,
  IS_MAC
} from '../../lib/keyboardShortcuts';
import { integrationCategories, tabHashMap, getTabFromHash } from './constants';
import AgentRow from './components/AgentRow';
import AgentConfigPanel from './components/AgentConfigPanel';
import IntegrationModal from './components/IntegrationModal';
import SharedReposSettings from './components/SharedReposSettings';
import logoAi from '../../assets/logos/logo-ai.svg';
import logoTranscription from '../../assets/logos/logo-transcription.svg';

const Settings = () => {
  const [activeTabKey, setActiveTabKey] = React.useState(getTabFromHash);
  
  // Agents state
  const [agentTemplates, setAgentTemplates] = React.useState([]);
  const [enabledAgents, setEnabledAgents] = React.useState([]);
  const [agentsLoading, setAgentsLoading] = React.useState(true);
  const [agentsError, setAgentsError] = React.useState(null);
  const [selectedAgent, setSelectedAgent] = React.useState(null);
  const [agentForm, setAgentForm] = React.useState({});
  const [agentSaving, setAgentSaving] = React.useState(false);
  const [agentEnabling, setAgentEnabling] = React.useState(null); // Track which agent is being enabled/disabled
  
  // Config state
  const [configLoading, setConfigLoading] = React.useState(true);
  const [configError, setConfigError] = React.useState(null);
  const [integrationConfig, setIntegrationConfig] = React.useState({
    jira: { url: '', username: '', token: '', hasToken: false },
    ai: { apiUrl: '', model: '' },
    slack: { hasXoxcToken: false, hasXoxdToken: false },
    google: { hasClientId: false, hasClientSecret: false, hasRefreshToken: false },
    googleCalendar: { hasClientId: false, hasClientSecret: false, hasRefreshToken: false },
    googleTasks: { hasClientId: false, hasClientSecret: false, hasRefreshToken: false },
    transcription: { useBuiltIn: true, apiUrl: '', model: '' },
    confluence: { url: '', username: '', token: '', hasToken: false },
    gitlab: { url: '', token: '', hasToken: false },
    figma: { token: '', hasToken: false, teamIds: '' },
    openai: { hasApiKey: false, model: '' },
    anthropic: { hasApiKey: false, model: '' },
    local: { apiUrl: '', model: '' },
    homeAssistant: { url: '', token: '', hasToken: false },
    ambientAi: { apiUrl: '', projectName: '', hasAccessKey: false },
    appleMusic: { hasDeveloperToken: false, hasMediaUserToken: false },
    claudeCode: { authType: 'apiKey', hasApiKey: false, vertexProjectId: '', vertexRegion: '', model: '' },
    cursorCli: { enabled: false, defaultModel: 'claude-4.5-sonnet' },
    kagi: { hasApiKey: false }
  });
  
  // Apollo transcription status
  const [apolloStatus, setApolloStatus] = React.useState({
    whisperInstalled: false,
    modelInstalled: false,
    ffmpegInstalled: false,
    ready: false,
    loading: false
  });
  const [apolloSetupProgress, setApolloSetupProgress] = React.useState(null);
  const [apolloSetupMessage, setApolloSetupMessage] = React.useState('');
  
  // Modal state
  const [editingService, setEditingService] = React.useState(null);
  const [editForm, setEditForm] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState(null);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState(null);

  // Preferences state
  const [theme, setTheme] = React.useState('system');
  const [compactMode, setCompactMode] = React.useState(false);
  const [autoSave, setAutoSave] = React.useState(true);
  const [navPosition, setNavPosition] = React.useState(() => {
    const saved = localStorage.getItem('apollo-nav-position');
    return saved === 'right' ? 'right' : 'left';
  });

  // Accessibility state
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [highContrast, setHighContrast] = React.useState(false);
  const [fontSize, setFontSize] = React.useState(100);
  const [screenReader, setScreenReader] = React.useState(false);

  // AI state
  const [aiEnabled, setAiEnabled] = React.useState(true);
  const [aiSuggestions, setAiSuggestions] = React.useState(true);
  const [aiAutoComplete, setAiAutoComplete] = React.useState(true);
  const [aiCreativity, setAiCreativity] = React.useState(50);

  // Notifications state
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [mentions, setMentions] = React.useState(true);
  const [updates, setUpdates] = React.useState(false);

  // Capture state
  const [browserHistory, setBrowserHistory] = React.useState([]);
  const [browserHistoryLoading, setBrowserHistoryLoading] = React.useState(false);
  const [browserHistoryError, setBrowserHistoryError] = React.useState(null);
  const [browserCaptureStatus, setBrowserCaptureStatus] = React.useState(null);
  const [browserTabs, setBrowserTabs] = React.useState({ tabs: [], timestamp: null });
  const [browserTabsLoading, setBrowserTabsLoading] = React.useState(false);

  // Omnibar config state
  const [omnibarConfig, setOmnibarConfig] = React.useState(() => loadOmnibarConfig());
  const [omnibarErrors, setOmnibarErrors] = React.useState({});
  const [omnibarSaved, setOmnibarSaved] = React.useState(false);

  // Keyboard shortcuts state
  const [shortcutsConfig, setShortcutsConfig] = React.useState(() => loadKeyboardShortcuts());
  const [recordingShortcutId, setRecordingShortcutId] = React.useState(null);
  const [shortcutConflict, setShortcutConflict] = React.useState(null);
  const [shortcutsSaved, setShortcutsSaved] = React.useState(false);

  // Catalog sources state
  const [catalogSources, setCatalogSources] = React.useState([]);
  const [catalogSourcesLoading, setCatalogSourcesLoading] = React.useState(false);
  const [catalogSourcesError, setCatalogSourcesError] = React.useState(null);
  const [catalogSourcesSaved, setCatalogSourcesSaved] = React.useState(false);
  const [editingSource, setEditingSource] = React.useState(null); // null = not editing, 'new' = adding, or source object
  const [sourceForm, setSourceForm] = React.useState({ name: '', url: '', type: 'gitlab', description: '', branch: 'main', enabled: true });
  const [sourceFormError, setSourceFormError] = React.useState(null);
  const [deletingSourceId, setDeletingSourceId] = React.useState(null);

  // Load browser capture history
  const loadBrowserHistory = React.useCallback(async () => {
    setBrowserHistoryLoading(true);
    setBrowserHistoryError(null);
    try {
      const response = await fetch('/api/browser/history?limit=50');
      if (!response.ok) {
        throw new Error('Failed to load browser history');
      }
      const data = await response.json();
      setBrowserHistory(data.history || []);
      
      // Also get status
      const statusResponse = await fetch('/api/browser/status');
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        setBrowserCaptureStatus(statusData);
      }
      
      // Also load tabs
      const tabsResponse = await fetch('/api/browser/tabs');
      if (tabsResponse.ok) {
        const tabsData = await tabsResponse.json();
        setBrowserTabs(tabsData);
      }
    } catch (error) {
      setBrowserHistoryError(error.message);
    } finally {
      setBrowserHistoryLoading(false);
    }
  }, []);

  // Format timestamp for display
  const formatBrowserTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${ms}`;
  };

  // Load catalog sources
  const loadCatalogSources = React.useCallback(async () => {
    setCatalogSourcesLoading(true);
    setCatalogSourcesError(null);
    try {
      const response = await fetch('/api/catalog/sources');
      if (!response.ok) {
        throw new Error('Failed to load catalog sources');
      }
      const data = await response.json();
      if (data.success) {
        setCatalogSources(data.sources || []);
      } else {
        setCatalogSourcesError(data.error || 'Failed to load sources');
      }
    } catch (error) {
      setCatalogSourcesError(error.message);
    } finally {
      setCatalogSourcesLoading(false);
    }
  }, []);

  const saveCatalogSource = async (source) => {
    setSourceFormError(null);
    try {
      if (!source.name || !source.url) {
        setSourceFormError('Name and URL are required');
        return false;
      }

      let response;
      if (editingSource === 'new') {
        response = await fetch('/api/catalog/sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(source)
        });
      } else {
        response = await fetch(`/api/catalog/sources/${editingSource.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(source)
        });
      }

      const data = await response.json();
      if (data.success) {
        setEditingSource(null);
        setSourceForm({ name: '', url: '', type: 'gitlab', description: '', branch: 'main', enabled: true });
        setCatalogSourcesSaved(true);
        setTimeout(() => setCatalogSourcesSaved(false), 3000);
        await loadCatalogSources();
        return true;
      } else {
        setSourceFormError(data.error || 'Failed to save source');
        return false;
      }
    } catch (error) {
      setSourceFormError(error.message);
      return false;
    }
  };

  const deleteCatalogSource = async (sourceId) => {
    setDeletingSourceId(sourceId);
    try {
      const response = await fetch(`/api/catalog/sources/${sourceId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setCatalogSourcesSaved(true);
        setTimeout(() => setCatalogSourcesSaved(false), 3000);
        await loadCatalogSources();
      }
    } catch (error) {
      setCatalogSourcesError(error.message);
    } finally {
      setDeletingSourceId(null);
    }
  };

  const toggleCatalogSource = async (source) => {
    try {
      const response = await fetch(`/api/catalog/sources/${source.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !source.enabled })
      });
      const data = await response.json();
      if (data.success) {
        await loadCatalogSources();
      }
    } catch (error) {
      setCatalogSourcesError(error.message);
    }
  };

  const getSourceTypeIcon = (type) => {
    switch (type) {
      case 'gitlab':
      case 'gitlab-subgroup':
        return <GitlabIcon />;
      case 'github':
        return <GithubIcon />;
      default:
        return <CodeBranchIcon />;
    }
  };

  const getSourceTypeLabel = (type) => {
    switch (type) {
      case 'gitlab-subgroup': return 'GitLab Subgroup';
      case 'gitlab': return 'GitLab Repository';
      case 'github': return 'GitHub Repository';
      case 'git': return 'Git Repository';
      default: return type;
    }
  };

  // Sync tab with URL hash (supports browser back/forward)
  React.useEffect(() => {
    const onHashChange = () => {
      setActiveTabKey(getTabFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Load configuration on mount
  React.useEffect(() => {
    loadConfig();
  }, []);

  // Load agents on mount
  React.useEffect(() => {
    loadAgents();
  }, []);

  // Load browser history when Capture tab is selected
  React.useEffect(() => {
    if (activeTabKey === 3) {
      loadBrowserHistory();
    }
  }, [activeTabKey, loadBrowserHistory]);

  // Load catalog sources when Catalog tab is selected
  React.useEffect(() => {
    if (activeTabKey === 4) {
      loadCatalogSources();
    }
  }, [activeTabKey, loadCatalogSources]);

  // Fetch agent templates and enabled agents
  const loadAgents = async () => {
    setAgentsLoading(true);
    setAgentsError(null);
    try {
      const [templatesRes, enabledRes] = await Promise.all([
        fetch('/api/agents/templates'),
        fetch('/api/agents')
      ]);
      
      const templatesData = await templatesRes.json();
      const enabledData = await enabledRes.json();
      
      if (templatesData.success) {
        setAgentTemplates(templatesData.templates);
      }
      if (enabledData.success) {
        setEnabledAgents(enabledData.agents);
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      setAgentsError(error.message);
    } finally {
      setAgentsLoading(false);
    }
  };

  // Enable an agent
  const enableAgent = async (agentId) => {
    setAgentEnabling(agentId);
    try {
      const response = await fetch(`/api/agents/${agentId}/enable`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setEnabledAgents(prev => [...prev, data.agent]);
      }
    } catch (error) {
      console.error('Error enabling agent:', error);
    } finally {
      setAgentEnabling(null);
    }
  };

  // Disable an agent
  const disableAgent = async (agentId) => {
    setAgentEnabling(agentId);
    try {
      const response = await fetch(`/api/agents/${agentId}/disable`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setEnabledAgents(prev => prev.filter(a => a.id !== agentId));
      }
    } catch (error) {
      console.error('Error disabling agent:', error);
    } finally {
      setAgentEnabling(null);
    }
  };

  // Check if an agent is enabled
  const isAgentEnabled = (agentId) => {
    return enabledAgents.some(a => a.id === agentId);
  };

  // Load Apollo status when transcription modal opens
  const loadApolloStatus = async (clearMessages = false) => {
    try {
      setApolloStatus(prev => ({ ...prev, loading: true }));
      const response = await fetch('/api/recordings/transcription/apollo-status');
      const data = await response.json();
      if (data.success) {
        setApolloStatus({
          whisperInstalled: data.whisperInstalled,
          modelInstalled: data.modelInstalled,
          ffmpegInstalled: data.ffmpegInstalled,
          ready: data.ready,
          loading: false
        });
        // Clear save message if Apollo is ready (to avoid confusing "saved" + "setup required" combo)
        if (clearMessages || data.ready) {
          setSaveMessage(null);
        }
      }
    } catch (error) {
      console.error('Error loading Apollo status:', error);
      setApolloStatus(prev => ({ ...prev, loading: false }));
    }
  };

  // Setup Apollo transcription (download whisper.cpp + model)
  const setupApollo = async () => {
    setApolloSetupProgress(0);
    setApolloSetupMessage('Starting setup...');
    
    try {
      const response = await fetch('/api/recordings/transcription/setup-apollo', {
        method: 'POST'
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        const lines = text.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.message) {
                setApolloSetupMessage(data.message);
              }
              if (data.progress !== null && data.progress !== undefined) {
                setApolloSetupProgress(data.progress);
              }
              if (data.error) {
                setSaveMessage({ type: 'danger', text: data.error });
                setApolloSetupProgress(null);
                return;
              }
              if (data.complete) {
                setApolloSetupProgress(null);
                setApolloSetupMessage('');
                await loadApolloStatus();
                setSaveMessage({ type: 'success', text: 'Apollo transcription is ready!' });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      setSaveMessage({ type: 'danger', text: `Setup failed: ${error.message}` });
      setApolloSetupProgress(null);
    }
  };

  const loadConfig = async () => {
    try {
      setConfigLoading(true);
      setConfigError(null);
      const response = await fetch('/api/config/integrations');
      const data = await response.json();
      if (data.success) {
        setIntegrationConfig(data.config);
        // Also load Apollo status to show correct connected state for transcription
        if (data.config.transcription?.useBuiltIn !== false) {
          loadApolloStatus();
        }
      } else {
        setConfigError(data.error || 'Failed to load configuration');
      }
    } catch (error) {
      setConfigError(`Error loading configuration: ${error.message}`);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleTabClick = (_event, tabIndex) => {
    setActiveTabKey(tabIndex);
    window.location.hash = tabHashMap[tabIndex] || '';
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setSaveMessage(null);
    setTestResult(null);
    
    // Initialize form with current config
    if (service.configKey === 'jira') {
      setEditForm({
        url: integrationConfig.jira?.url || '',
        username: integrationConfig.jira?.username || '',
        token: '',
        hasExistingToken: integrationConfig.jira?.hasToken || false
      });
    } else if (service.configKey === 'ai') {
      setEditForm({
        apiUrl: integrationConfig.ai?.apiUrl || '',
        model: integrationConfig.ai?.model || ''
      });
    } else if (service.configKey === 'slack') {
      setEditForm({
        xoxcToken: '',
        xoxdToken: '',
        hasExistingXoxcToken: integrationConfig.slack?.hasXoxcToken || false,
        hasExistingXoxdToken: integrationConfig.slack?.hasXoxdToken || false
      });
    } else if (service.configKey === 'google') {
      setEditForm({
        clientId: '',
        clientSecret: '',
        refreshToken: '',
        hasExistingClientId: integrationConfig.google?.hasClientId || false,
        hasExistingClientSecret: integrationConfig.google?.hasClientSecret || false,
        hasExistingRefreshToken: integrationConfig.google?.hasRefreshToken || false
      });
    } else if (service.configKey === 'transcription') {
      setEditForm({
        useBuiltIn: integrationConfig.transcription?.useBuiltIn !== false,
        apiUrl: integrationConfig.transcription?.apiUrl || '',
        model: integrationConfig.transcription?.model || ''
      });
      // Load Apollo status when opening transcription modal
      loadApolloStatus();
    } else if (service.configKey === 'confluence') {
      setEditForm({
        url: integrationConfig.confluence?.url || '',
        username: integrationConfig.confluence?.username || '',
        token: '',
        hasExistingToken: integrationConfig.confluence?.hasToken || false
      });
    } else if (service.configKey === 'googleCalendar') {
      setEditForm({
        clientId: '',
        clientSecret: '',
        refreshToken: '',
        hasExistingClientId: integrationConfig.googleCalendar?.hasClientId || false,
        hasExistingClientSecret: integrationConfig.googleCalendar?.hasClientSecret || false,
        hasExistingRefreshToken: integrationConfig.googleCalendar?.hasRefreshToken || false
      });
    } else if (service.configKey === 'googleTasks') {
      setEditForm({
        clientId: '',
        clientSecret: '',
        refreshToken: '',
        hasExistingClientId: integrationConfig.googleTasks?.hasClientId || false,
        hasExistingClientSecret: integrationConfig.googleTasks?.hasClientSecret || false,
        hasExistingRefreshToken: integrationConfig.googleTasks?.hasRefreshToken || false
      });
    } else if (service.configKey === 'gitlab') {
      setEditForm({
        url: integrationConfig.gitlab?.url || 'https://gitlab.cee.redhat.com',
        token: '',
        hasExistingToken: integrationConfig.gitlab?.hasToken || false
      });
    } else if (service.configKey === 'figma') {
      setEditForm({
        token: '',
        hasExistingToken: integrationConfig.figma?.hasToken || false,
        teamIds: integrationConfig.figma?.teamIds || ''
      });
    } else if (service.configKey === 'openai') {
      setEditForm({
        apiKey: '',
        hasExistingApiKey: integrationConfig.openai?.hasApiKey || false,
        model: integrationConfig.openai?.model || 'gpt-4o'
      });
    } else if (service.configKey === 'anthropic') {
      setEditForm({
        apiKey: '',
        hasExistingApiKey: integrationConfig.anthropic?.hasApiKey || false,
        model: integrationConfig.anthropic?.model || 'claude-sonnet-4-20250514'
      });
    } else if (service.configKey === 'local') {
      setEditForm({
        apiUrl: integrationConfig.local?.apiUrl || 'http://127.0.0.1:11434',
        model: integrationConfig.local?.model || ''
      });
    } else if (service.configKey === 'homeAssistant') {
      setEditForm({
        url: integrationConfig.homeAssistant?.url || 'http://homeassistant.local:8123',
        token: '',
        hasExistingToken: integrationConfig.homeAssistant?.hasToken || false
      });
    } else if (service.configKey === 'ambientAi') {
      setEditForm({
        apiUrl: integrationConfig.ambientAi?.apiUrl || '',
        projectName: integrationConfig.ambientAi?.projectName || '',
        accessKey: '',
        hasExistingAccessKey: integrationConfig.ambientAi?.hasAccessKey || false
      });
    } else if (service.configKey === 'claudeCode') {
      setEditForm({
        authType: integrationConfig.claudeCode?.authType || 'apiKey',
        apiKey: '',
        hasExistingApiKey: integrationConfig.claudeCode?.hasApiKey || false,
        vertexProjectId: integrationConfig.claudeCode?.vertexProjectId || '',
        vertexRegion: integrationConfig.claudeCode?.vertexRegion || 'us-east5',
        model: integrationConfig.claudeCode?.model || 'claude-sonnet-4@20250514'
      });
    } else if (service.configKey === 'appleMusic') {
      setEditForm({
        developerToken: '',
        mediaUserToken: '',
        hasExistingDeveloperToken: integrationConfig.appleMusic?.hasDeveloperToken || false,
        hasExistingMediaUserToken: integrationConfig.appleMusic?.hasMediaUserToken || false
      });
    } else if (service.configKey === 'cursorCli') {
      setEditForm({
        enabled: integrationConfig.cursorCli?.enabled || false,
        defaultModel: integrationConfig.cursorCli?.defaultModel || 'claude-4.5-sonnet'
      });
    } else if (service.configKey === 'kagi') {
      setEditForm({
        apiKey: '',
        hasExistingApiKey: integrationConfig.kagi?.hasApiKey || false
      });
    }
  };

  const closeEditModal = () => {
    setEditingService(null);
    setEditForm({});
    setSaveMessage(null);
    setTestResult(null);
    setApolloSetupProgress(null);
    setApolloSetupMessage('');
  };

  const handleSave = async () => {
    if (!editingService) return;
    
    setSaving(true);
    setSaveMessage(null);
    
    try {
      const updates = {};
      
      if (editingService.configKey === 'jira') {
        updates.jira = {
          url: editForm.url,
          username: editForm.username
        };
        // Only include token if user entered a new one
        if (editForm.token) {
          updates.jira.token = editForm.token;
        }
      } else if (editingService.configKey === 'ai') {
        updates.ai = {
          apiUrl: editForm.apiUrl,
          model: editForm.model
        };
      } else if (editingService.configKey === 'slack') {
        updates.slack = {};
        // Only include tokens if user entered new ones
        if (editForm.xoxcToken) {
          updates.slack.xoxcToken = editForm.xoxcToken;
        }
        if (editForm.xoxdToken) {
          updates.slack.xoxdToken = editForm.xoxdToken;
        }
      } else if (editingService.configKey === 'google') {
        updates.google = {};
        // Only include credentials if user entered new ones
        if (editForm.clientId) {
          updates.google.clientId = editForm.clientId;
        }
        if (editForm.clientSecret) {
          updates.google.clientSecret = editForm.clientSecret;
        }
        if (editForm.refreshToken) {
          updates.google.refreshToken = editForm.refreshToken;
        }
      } else if (editingService.configKey === 'transcription') {
        updates.transcription = {
          useBuiltIn: editForm.useBuiltIn,
          apiUrl: editForm.apiUrl,
          model: editForm.model
        };
      } else if (editingService.configKey === 'confluence') {
        updates.confluence = {
          url: editForm.url,
          username: editForm.username
        };
        // Only include token if user entered a new one
        if (editForm.token) {
          updates.confluence.token = editForm.token;
        }
      } else if (editingService.configKey === 'googleCalendar') {
        updates.googleCalendar = {};
        // Only include credentials if user entered new ones
        if (editForm.clientId) {
          updates.googleCalendar.clientId = editForm.clientId;
        }
        if (editForm.clientSecret) {
          updates.googleCalendar.clientSecret = editForm.clientSecret;
        }
        if (editForm.refreshToken) {
          updates.googleCalendar.refreshToken = editForm.refreshToken;
        }
      } else if (editingService.configKey === 'googleTasks') {
        updates.googleTasks = {};
        // Only include credentials if user entered new ones
        if (editForm.clientId) {
          updates.googleTasks.clientId = editForm.clientId;
        }
        if (editForm.clientSecret) {
          updates.googleTasks.clientSecret = editForm.clientSecret;
        }
        if (editForm.refreshToken) {
          updates.googleTasks.refreshToken = editForm.refreshToken;
        }
      } else if (editingService.configKey === 'gitlab') {
        updates.gitlab = {
          url: editForm.url
        };
        // Only include token if user entered a new one
        if (editForm.token) {
          updates.gitlab.token = editForm.token;
        }
      } else if (editingService.configKey === 'figma') {
        updates.figma = {
          teamIds: editForm.teamIds
        };
        // Only include token if user entered a new one
        if (editForm.token) {
          updates.figma.token = editForm.token;
        }
      } else if (editingService.configKey === 'openai') {
        updates.openai = {
          model: editForm.model
        };
        // Only include API key if user entered a new one
        if (editForm.apiKey) {
          updates.openai.apiKey = editForm.apiKey;
        }
      } else if (editingService.configKey === 'anthropic') {
        updates.anthropic = {
          model: editForm.model
        };
        // Only include API key if user entered a new one
        if (editForm.apiKey) {
          updates.anthropic.apiKey = editForm.apiKey;
        }
      } else if (editingService.configKey === 'local') {
        updates.local = {
          apiUrl: editForm.apiUrl,
          model: editForm.model
        };
      } else if (editingService.configKey === 'homeAssistant') {
        updates.homeAssistant = {
          url: editForm.url
        };
        // Only include token if user entered a new one
        if (editForm.token) {
          updates.homeAssistant.token = editForm.token;
        }
      } else if (editingService.configKey === 'ambientAi') {
        updates.ambientAi = {
          apiUrl: editForm.apiUrl,
          projectName: editForm.projectName
        };
        // Only include access key if user entered a new one
        if (editForm.accessKey) {
          updates.ambientAi.accessKey = editForm.accessKey;
        }
      } else if (editingService.configKey === 'claudeCode') {
        updates.claudeCode = {
          authType: editForm.authType,
          vertexProjectId: editForm.vertexProjectId,
          vertexRegion: editForm.vertexRegion,
          model: editForm.model
        };
        // Only include API key if user entered a new one
        if (editForm.apiKey) {
          updates.claudeCode.apiKey = editForm.apiKey;
        }
      } else if (editingService.configKey === 'appleMusic') {
        updates.appleMusic = {};
        // Only include tokens if user entered new ones
        if (editForm.developerToken) {
          updates.appleMusic.developerToken = editForm.developerToken;
        }
        if (editForm.mediaUserToken) {
          updates.appleMusic.mediaUserToken = editForm.mediaUserToken;
        }
      } else if (editingService.configKey === 'cursorCli') {
        updates.cursorCli = {
          enabled: editForm.enabled,
          defaultModel: editForm.defaultModel
        };
      } else if (editingService.configKey === 'kagi') {
        updates.kagi = {};
        // Only include API key if user entered a new one
        if (editForm.apiKey) {
          updates.kagi.apiKey = editForm.apiKey;
        }
      }
      
      const response = await fetch('/api/config/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reload config to get updated state
        await loadConfig();
        // For transcription with Apollo mode, refresh status and skip the "saved" message
        // (the status panel shows the current state more clearly)
        if (editingService?.configKey === 'transcription' && editForm.useBuiltIn !== false) {
          await loadApolloStatus(true);
        } else {
          setSaveMessage({ type: 'success', text: 'Configuration saved successfully!' });
        }
      } else {
        setSaveMessage({ type: 'danger', text: data.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setSaveMessage({ type: 'danger', text: `Error saving: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!editingService) return;
    
    setTesting(true);
    setTestResult(null);
    
    try {
      let endpoint = '';
      if (editingService.configKey === 'jira') {
        endpoint = '/api/jira/test';
      } else if (editingService.configKey === 'slack') {
        endpoint = '/api/slack/test';
      } else if (editingService.configKey === 'google') {
        endpoint = '/api/google/test';
      } else if (editingService.configKey === 'confluence') {
        endpoint = '/api/confluence/test';
      } else if (editingService.configKey === 'googleCalendar') {
        endpoint = '/api/google/calendar/test';
      } else if (editingService.configKey === 'googleTasks') {
        endpoint = '/api/google/tasks/test';
      } else if (editingService.configKey === 'gitlab') {
        endpoint = '/api/gitlab/test';
      } else if (editingService.configKey === 'figma') {
        endpoint = '/api/figma/test';
      } else if (editingService.configKey === 'homeAssistant') {
        endpoint = '/api/homeassistant/test';
      } else if (editingService.configKey === 'ambientAi') {
        endpoint = '/api/ambient/test';
      } else if (editingService.configKey === 'claudeCode') {
        endpoint = '/api/claudecode/test';
      } else if (editingService.configKey === 'appleMusic') {
        endpoint = '/api/applemusic/test';
      } else if (editingService.configKey === 'cursorCli') {
        endpoint = '/api/cursorcli/test';
      } else if (editingService.configKey === 'kagi') {
        endpoint = '/api/kagi/test';
      } else {
        return;
      }
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        if (editingService.configKey === 'claudeCode') {
          setTestResult({ 
            type: 'success', 
            text: data.message || 'Claude Code connection successful!'
          });
        } else if (editingService.configKey === 'cursorCli') {
          setTestResult({ 
            type: 'success', 
            text: data.message || 'Cursor CLI is installed and ready!'
          });
        } else if (editingService.configKey === 'ambientAi') {
          setTestResult({ 
            type: 'success', 
            text: `Connected successfully! Found ${data.projectCount || 0} project(s).`
          });
        } else if (editingService.configKey === 'jira') {
          setTestResult({ 
            type: 'success', 
            text: `Connected successfully as ${data.user?.name || data.user?.email || 'user'} (${data.authMethod})`
          });
        } else if (editingService.configKey === 'slack') {
          setTestResult({ 
            type: 'success', 
            text: `Connected successfully to Slack as ${data.user?.name || 'user'}`
          });
        } else if (editingService.configKey === 'google') {
          setTestResult({ 
            type: 'success', 
            text: `Connected successfully as ${data.user?.email || data.user?.name || 'user'}`
          });
        } else if (editingService.configKey === 'confluence') {
          setTestResult({ 
            type: 'success', 
            text: `Connected successfully as ${data.user?.name || data.user?.email || 'user'} (${data.authMethod})`
          });
        } else if (editingService.configKey === 'googleCalendar') {
          setTestResult({ 
            type: 'success', 
            text: `Connected successfully as ${data.user?.email || data.user?.name || 'user'}`
          });
        } else if (editingService.configKey === 'googleTasks') {
          setTestResult({ 
            type: 'success', 
            text: `Connected successfully as ${data.user?.email || data.user?.name || 'user'}. Found ${data.taskListsCount || 0} task list(s).`
          });
        } else if (editingService.configKey === 'gitlab') {
          setTestResult({ 
            type: 'success', 
            text: `Connected successfully as ${data.user?.name || data.user?.username || 'user'}`
          });
        } else if (editingService.configKey === 'figma') {
          setTestResult({ 
            type: 'success', 
            text: `Connected successfully as ${data.user?.handle || data.user?.email || 'user'}`
          });
        } else if (editingService.configKey === 'homeAssistant') {
          setTestResult({ 
            type: 'success', 
            text: `Connected successfully to Home Assistant ${data.info?.version ? `(v${data.info.version})` : ''}`
          });
        } else if (editingService.configKey === 'appleMusic') {
          setTestResult({ 
            type: 'success', 
            text: `Connected successfully to Apple Music (${data.info?.name || 'Apple Music'})`
          });
        } else if (editingService.configKey === 'kagi') {
          setTestResult({ 
            type: 'success', 
            text: data.message || 'Connected to Kagi successfully!'
          });
        }
      } else {
        setTestResult({ type: 'danger', text: data.error || 'Connection test failed' });
      }
    } catch (error) {
      setTestResult({ type: 'danger', text: `Error testing connection: ${error.message}` });
    } finally {
      setTesting(false);
    }
  };

  // Agent configuration handlers
  const openAgentConfig = (agent) => {
    setSelectedAgent(agent);
    setAgentForm({
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt || '',
      userPrompt: agent.userPrompt || '',
      enabledIntegrations: [...(agent.enabledIntegrations || [])],
      tools: { ...(agent.toolsConfig || agent.tools || {}) }
    });
  };

  const closeAgentConfig = () => {
    setSelectedAgent(null);
    setAgentForm({});
  };

  const handleAgentSave = async () => {
    setAgentSaving(true);
    try {
      const response = await fetch(`/api/agents/${selectedAgent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentForm.name,
          description: agentForm.description,
          systemPrompt: agentForm.systemPrompt,
          enabledIntegrations: agentForm.enabledIntegrations,
          toolsConfig: agentForm.tools
        })
      });
      const data = await response.json();
      if (data.success) {
        // Update the enabled agents list with the updated agent
        setEnabledAgents(prev => prev.map(a => 
          a.id === selectedAgent.id ? data.agent : a
        ));
        closeAgentConfig();
      }
    } catch (error) {
      console.error('Error saving agent:', error);
    } finally {
      setAgentSaving(false);
    }
  };

  const toggleAgentIntegration = (integrationId) => {
    setAgentForm(prev => {
      const enabled = prev.enabledIntegrations || [];
      const isEnabled = enabled.includes(integrationId);
      
      if (isEnabled) {
        // Remove integration and its tools
        const newTools = { ...prev.tools };
        delete newTools[integrationId];
        return {
          ...prev,
          enabledIntegrations: enabled.filter(id => id !== integrationId),
          tools: newTools
        };
      } else {
        // Add integration with no tools selected
        return {
          ...prev,
          enabledIntegrations: [...enabled, integrationId],
          tools: { ...prev.tools, [integrationId]: [] }
        };
      }
    });
  };

  const toggleAgentTool = (integrationId, toolId) => {
    setAgentForm(prev => {
      const currentTools = prev.tools[integrationId] || [];
      const isEnabled = currentTools.includes(toolId);
      
      return {
        ...prev,
        tools: {
          ...prev.tools,
          [integrationId]: isEnabled
            ? currentTools.filter(id => id !== toolId)
            : [...currentTools, toolId]
        }
      };
    });
  };



  const isServiceConnected = (service) => {
    if (!service.configurable) return false;
    
    if (service.configKey === 'jira') {
      const jira = integrationConfig.jira;
      return jira && jira.url && jira.username && jira.hasToken;
    }
    if (service.configKey === 'ai') {
      const ai = integrationConfig.ai;
      return ai && ai.apiUrl && ai.model;
    }
    if (service.configKey === 'slack') {
      const slack = integrationConfig.slack;
      return slack && slack.hasXoxcToken && slack.hasXoxdToken;
    }
    if (service.configKey === 'google') {
      const google = integrationConfig.google;
      return google && google.hasClientId && google.hasClientSecret && google.hasRefreshToken;
    }
    if (service.configKey === 'transcription') {
      const transcription = integrationConfig.transcription;
      // If using built-in, check if Apollo is ready; otherwise check external API config
      if (transcription?.useBuiltIn !== false) {
        return apolloStatus.ready;
      }
      return transcription && transcription.apiUrl && transcription.model;
    }
    if (service.configKey === 'confluence') {
      const confluence = integrationConfig.confluence;
      return confluence && confluence.url && confluence.username && confluence.hasToken;
    }
    if (service.configKey === 'googleCalendar') {
      const googleCalendar = integrationConfig.googleCalendar;
      return googleCalendar && googleCalendar.hasClientId && googleCalendar.hasClientSecret && googleCalendar.hasRefreshToken;
    }
    if (service.configKey === 'gitlab') {
      const gitlab = integrationConfig.gitlab;
      return gitlab && gitlab.url && gitlab.hasToken;
    }
    if (service.configKey === 'figma') {
      const figma = integrationConfig.figma;
      return figma && figma.hasToken && figma.teamIds;
    }
    if (service.configKey === 'openai') {
      const openai = integrationConfig.openai;
      return openai && openai.hasApiKey;
    }
    if (service.configKey === 'anthropic') {
      const anthropic = integrationConfig.anthropic;
      return anthropic && anthropic.hasApiKey;
    }
    if (service.configKey === 'local') {
      const local = integrationConfig.local;
      return local && local.apiUrl && local.model;
    }
    if (service.configKey === 'homeAssistant') {
      const homeAssistant = integrationConfig.homeAssistant;
      return homeAssistant && homeAssistant.url && homeAssistant.hasToken;
    }
    if (service.configKey === 'ambientAi') {
      const ambientAi = integrationConfig.ambientAi;
      return ambientAi && ambientAi.apiUrl && ambientAi.hasAccessKey;
    }
    if (service.configKey === 'claudeCode') {
      const claudeCode = integrationConfig.claudeCode;
      if (!claudeCode) return false;
      if (claudeCode.authType === 'vertex') {
        return claudeCode.vertexProjectId && claudeCode.vertexRegion;
      }
      return claudeCode.hasApiKey;
    }
    if (service.configKey === 'cursorCli') {
      const cursorCli = integrationConfig.cursorCli;
      return cursorCli && cursorCli.enabled;
    }
    if (service.configKey === 'appleMusic') {
      const appleMusic = integrationConfig.appleMusic;
      return appleMusic && appleMusic.hasDeveloperToken && appleMusic.hasMediaUserToken;
    }
    return false;
  };

  // Full-width row component for each integration
  const IntegrationRow = ({ service }) => {
    const isConnected = isServiceConnected(service);
    const isConfigurable = service.configurable;
    
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1rem 1.25rem',
          backgroundColor: 'var(--pf-v6-global--BackgroundColor--100)',
          transition: 'background-color 0.15s ease'
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '1rem',
            flexShrink: 0
          }}
        >
          <img 
            src={service.logo} 
            alt={`${service.name} logo`}
            style={{ width: '28px', height: '28px' }}
          />
        </div>
        
        {/* Name and Description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>
            {service.name}
          </div>
          <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
            {service.description}
          </Content>
        </div>
        
        {/* Status indicator for connected services */}
        {isConfigurable && isConnected && (
          <div style={{ marginRight: '1rem', flexShrink: 0 }}>
            <Label color="green" icon={<CheckCircleIcon />} isCompact>
              Connected
            </Label>
          </div>
        )}
        
        {/* Action Button */}
        <div style={{ flexShrink: 0 }}>
          {isConfigurable ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => openEditModal(service)}
            >
              {isConnected ? 'Manage' : 'Connect'}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              isDisabled
            >
              Coming soon
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Keep ServiceCard for AI settings tab (Gallery layout)
  const ServiceCard = ({ service }) => {
    const isConnected = isServiceConnected(service);
    const isConfigurable = service.configurable;
    
    return (
      <Card 
        isCompact
        style={{ 
          height: '100%',
          borderLeft: `4px solid ${service.color}`,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease'
        }}
        className="pf-v6-u-box-shadow-sm"
      >
        <CardHeader>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              <img 
                src={service.logo} 
                alt={`${service.name} logo`}
                style={{ width: '24px', height: '24px' }}
              />
            </FlexItem>
            <FlexItem flex={{ default: 'flex_1' }}>
              <CardTitle style={{ margin: 0 }}>{service.name}</CardTitle>
            </FlexItem>
            <FlexItem>
              {isConfigurable ? (
                isConnected ? (
                  <Label color="green" icon={<CheckCircleIcon />}>
                    Connected
                  </Label>
                ) : (
                  <Label color="orange" icon={<ExclamationCircleIcon />}>
                    Not configured
                  </Label>
                )
              ) : (
                <Label color="grey">
                  Coming soon
                </Label>
              )}
            </FlexItem>
          </Flex>
        </CardHeader>
        <CardBody>
          <Content component="p" style={{ marginBottom: '1rem', color: 'var(--pf-v6-global--Color--200)' }}>
            {service.description}
          </Content>
        </CardBody>
        <CardFooter>
          {isConfigurable ? (
            <Button
              variant={isConnected ? 'secondary' : 'primary'}
              size="sm"
              icon={isConnected ? <KeyIcon /> : <PlusCircleIcon />}
              onClick={() => openEditModal(service)}
            >
              {isConnected ? 'Configure' : 'Set Up'}
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              isDisabled
            >
              Not Available
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };


  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <Title headingLevel="h1" size="2xl">
          Settings
        </Title>
        <Content component="p">
          Configure your Apollo Dashboard preferences and integrations
        </Content>
      </PageSection>
      
      <PageSection isFilled>
        <Grid hasGutter span={12}>
          <GridItem span={2} className="apollo-settings-tabs-sticky">
            <Tabs
              activeKey={activeTabKey}
              onSelect={handleTabClick}
              isVertical
              aria-label="Settings tabs"
              role="region"
            >
              <Tab 
                eventKey={0} 
                title={<TabTitleText>Accessibility</TabTitleText>}
                aria-label="Accessibility tab"
              />
              <Tab 
                eventKey={1} 
                title={<TabTitleText>Agents</TabTitleText>}
                aria-label="Agents tab"
              />
              <Tab 
                eventKey={2} 
                title={<TabTitleText>AI</TabTitleText>}
                aria-label="AI tab"
              />
              <Tab 
                eventKey={3} 
                title={<TabTitleText>Capture</TabTitleText>}
                aria-label="Capture tab"
              />
              <Tab 
                eventKey={4} 
                title={<TabTitleText>Catalog</TabTitleText>}
                aria-label="Catalog tab"
              />
              <Tab 
                eventKey={5} 
                title={<TabTitleText>Integrations</TabTitleText>}
                aria-label="Integrations tab"
              />
              <Tab 
                eventKey={6} 
                title={<TabTitleText>Notifications</TabTitleText>}
                aria-label="Notifications tab"
              />
              <Tab 
                eventKey={7} 
                title={<TabTitleText>Omnibar</TabTitleText>}
                aria-label="Omnibar tab"
              />
              <Tab 
                eventKey={8} 
                title={<TabTitleText>Preferences</TabTitleText>}
                aria-label="Preferences tab"
              />
              <Tab 
                eventKey={9} 
                title={<TabTitleText>Repositories</TabTitleText>}
                aria-label="Repositories tab"
              />
              <Tab 
                eventKey={10} 
                title={<TabTitleText>Shortcuts</TabTitleText>}
                aria-label="Keyboard shortcuts tab"
              />
            </Tabs>
          </GridItem>
          
          <GridItem span={10}>
            {/* Agents Tab */}
            {activeTabKey === 1 && (
              selectedAgent ? (
                <AgentConfigPanel
                  selectedAgent={selectedAgent}
                  agentForm={agentForm}
                  setAgentForm={setAgentForm}
                  agentSaving={agentSaving}
                  handleAgentSave={handleAgentSave}
                  setSelectedAgent={setSelectedAgent}
                  toggleAgentIntegration={toggleAgentIntegration}
                  toggleAgentTool={toggleAgentTool}
                />
              ) : (
                <div>
                  <Title headingLevel="h2" size="xl" style={{ marginBottom: '0.5rem' }}>
                    AI Agents
                  </Title>
                  <Content component="p" style={{ marginBottom: '2rem', color: 'var(--pf-v6-global--Color--200)' }}>
                    Enable and configure AI agents that can help you with various tasks using your connected integrations
                  </Content>
                  
                  {agentsLoading ? (
                    <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: '2rem' }}>
                      <Spinner size="lg" />
                    </Flex>
                  ) : agentsError ? (
                    <Alert variant="danger" title="Error loading agents" isInline>
                      {agentsError}
                    </Alert>
                  ) : (
                    <div
                      style={{
                        border: '1px solid var(--pf-v6-global--BorderColor--100)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}
                    >
                      {agentTemplates.map((agent, index) => (
                        <div
                          key={agent.id}
                          style={{
                            borderBottom: index < agentTemplates.length - 1 
                              ? '1px solid var(--pf-v6-global--BorderColor--100)' 
                              : 'none'
                          }}
                        >
                          <AgentRow 
                            agent={agent} 
                            isTemplate 
                            isAgentEnabled={isAgentEnabled}
                            agentEnabling={agentEnabling}
                            enableAgent={enableAgent}
                            disableAgent={disableAgent}
                            openAgentConfig={openAgentConfig}
                            enabledAgents={enabledAgents}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )}

            {/* Integrations Tab */}
            {activeTabKey === 5 && (
              <div>
                <Title headingLevel="h2" size="xl" style={{ marginBottom: '0.5rem' }}>
                  Integrations
                </Title>
                <Content component="p" style={{ marginBottom: '2rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  Connect your favorite services to enhance your Apollo experience
                </Content>
                
                {configLoading ? (
                  <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: '2rem' }}>
                    <Spinner size="lg" />
                  </Flex>
                ) : configError ? (
                  <Alert variant="danger" title="Error loading configuration" isInline>
                    {configError}
                  </Alert>
                ) : (
                  integrationCategories.map((category, catIndex) => (
                    <div key={category.name} style={{ marginBottom: catIndex < integrationCategories.length - 1 ? '2rem' : 0 }}>
                      <Title headingLevel="h3" size="md" style={{ marginBottom: '0.25rem' }}>
                        {category.name}
                      </Title>
                      <Content component="p" style={{ marginBottom: '0.75rem', color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem' }}>
                        {category.description}
                      </Content>
                      <div
                        style={{
                          border: '1px solid var(--pf-v6-global--BorderColor--100)',
                          borderRadius: '8px',
                          overflow: 'hidden'
                        }}
                      >
                        {category.services.map((service, index) => (
                          <div
                            key={service.id}
                            style={{
                              borderBottom: index < category.services.length - 1 
                                ? '1px solid var(--pf-v6-global--BorderColor--100)' 
                                : 'none'
                            }}
                          >
                            <IntegrationRow service={service} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Preferences Tab */}
            {activeTabKey === 8 && (
              <Form>
                <Title headingLevel="h2" size="xl" style={{ marginBottom: '1.5rem' }}>
                  Preferences
                </Title>
                
                <FormSection title="Appearance" titleElement="h3">
                  <FormGroup label="Theme" fieldId="theme">
                    <Flex gap={{ default: 'gapMd' }}>
                      <Button
                        variant={theme === 'light' ? 'primary' : 'secondary'}
                        onClick={() => setTheme('light')}
                      >
                        Light
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'primary' : 'secondary'}
                        onClick={() => setTheme('dark')}
                      >
                        Dark
                      </Button>
                      <Button
                        variant={theme === 'system' ? 'primary' : 'secondary'}
                        onClick={() => setTheme('system')}
                      >
                        System
                      </Button>
                    </Flex>
                  </FormGroup>
                  <FormGroup label="Compact mode" fieldId="compact-mode">
                    <Switch
                      id="compact-mode"
                      label="Use compact UI elements"
                      isChecked={compactMode}
                      onChange={(_event, checked) => setCompactMode(checked)}
                    />
                  </FormGroup>
                </FormSection>

                <FormSection title="Layout" titleElement="h3" style={{ marginTop: '2rem' }}>
                  <FormGroup 
                    label="Primary navigation position" 
                    fieldId="nav-position"
                    helperText="Choose which side of the screen the primary navigation sidebar appears on. Some users may prefer right-hand navigation for RTL languages or personal preference."
                  >
                    <Flex gap={{ default: 'gapMd' }}>
                      <Button
                        variant={navPosition === 'left' ? 'primary' : 'secondary'}
                        onClick={() => {
                          setNavPosition('left');
                          localStorage.setItem('apollo-nav-position', 'left');
                          window.dispatchEvent(new CustomEvent('apollo-nav-position-change', { detail: { position: 'left' } }));
                        }}
                      >
                        Left
                      </Button>
                      <Button
                        variant={navPosition === 'right' ? 'primary' : 'secondary'}
                        onClick={() => {
                          setNavPosition('right');
                          localStorage.setItem('apollo-nav-position', 'right');
                          window.dispatchEvent(new CustomEvent('apollo-nav-position-change', { detail: { position: 'right' } }));
                        }}
                      >
                        Right
                      </Button>
                    </Flex>
                  </FormGroup>
                </FormSection>

                <FormSection title="Behavior" titleElement="h3" style={{ marginTop: '2rem' }}>
                  <FormGroup label="Auto-save" fieldId="auto-save">
                    <Switch
                      id="auto-save"
                      label="Automatically save changes"
                      isChecked={autoSave}
                      onChange={(_event, checked) => setAutoSave(checked)}
                    />
                  </FormGroup>
                </FormSection>
              </Form>
            )}

            {/* Accessibility Tab */}
            {activeTabKey === 0 && (
              <Form>
                <Title headingLevel="h2" size="xl" style={{ marginBottom: '1.5rem' }}>
                  Accessibility
                </Title>
                
                <FormSection title="Visual" titleElement="h3">
                  <FormGroup label="Reduce motion" fieldId="reduce-motion">
                    <Switch
                      id="reduce-motion"
                      label="Minimize animations"
                      isChecked={reduceMotion}
                      onChange={(_event, checked) => setReduceMotion(checked)}
                    />
                  </FormGroup>
                  <FormGroup label="High contrast" fieldId="high-contrast">
                    <Switch
                      id="high-contrast"
                      label="Use high contrast colors"
                      isChecked={highContrast}
                      onChange={(_event, checked) => setHighContrast(checked)}
                    />
                  </FormGroup>
                  <FormGroup label={`Font size (${fontSize}%)`} fieldId="font-size">
                    <Slider
                      value={fontSize}
                      onChange={(_event, value) => setFontSize(value)}
                      min={75}
                      max={150}
                      step={5}
                      showBoundaries={false}
                    />
                  </FormGroup>
                </FormSection>

                <FormSection title="Assistive Technology" titleElement="h3" style={{ marginTop: '2rem' }}>
                  <FormGroup label="Screen reader optimization" fieldId="screen-reader">
                    <Switch
                      id="screen-reader"
                      label="Optimize for screen readers"
                      isChecked={screenReader}
                      onChange={(_event, checked) => setScreenReader(checked)}
                    />
                  </FormGroup>
                </FormSection>
              </Form>
            )}

            {/* AI Tab */}
            {activeTabKey === 2 && (
              <div>
                <Title headingLevel="h2" size="xl" style={{ marginBottom: '0.5rem' }}>
                  AI Settings
                </Title>
                <Content component="p" style={{ marginBottom: '2rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  Configure AI services and behavior for your Apollo experience
                </Content>

                {/* AI & Automation Services Section */}
                <div style={{ marginBottom: '2.5rem' }}>
                  <Title headingLevel="h3" size="lg" style={{ marginBottom: '0.5rem' }}>
                    AI & Automation
                  </Title>
                  <Content component="p" style={{ marginBottom: '1rem', color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem' }}>
                    Connect AI and automation services
                  </Content>
                  {configLoading ? (
                    <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: '2rem' }}>
                      <Spinner size="lg" />
                    </Flex>
                  ) : configError ? (
                    <Alert variant="danger" title="Error loading configuration" isInline>
                      {configError}
                    </Alert>
                  ) : (
                    <Gallery hasGutter minWidths={{ default: '280px' }}>
                      <ServiceCard service={{
                        id: 'ai',
                        name: 'AI Model',
                        description: 'Local or remote AI model for summaries',
                        logo: logoAi,
                        color: '#10B981',
                        configurable: true,
                        configKey: 'ai'
                      }} />
                      <ServiceCard service={{
                        id: 'transcription',
                        name: 'Transcription AI',
                        description: 'Whisper-compatible API for audio transcription',
                        logo: logoTranscription,
                        color: '#8B5CF6',
                        configurable: true,
                        configKey: 'transcription'
                      }} />
                    </Gallery>
                  )}
                </div>

                <Form>
                <FormSection title="AI Features" titleElement="h3">
                  <FormGroup label="Enable AI features" fieldId="ai-enabled">
                    <Switch
                      id="ai-enabled"
                      label="AI features enabled"
                      isChecked={aiEnabled}
                      onChange={(_event, checked) => setAiEnabled(checked)}
                    />
                  </FormGroup>
                  <FormGroup label="Smart suggestions" fieldId="ai-suggestions">
                    <Switch
                      id="ai-suggestions"
                      label="Show AI-powered suggestions"
                      isChecked={aiSuggestions}
                      onChange={(_event, checked) => setAiSuggestions(checked)}
                      isDisabled={!aiEnabled}
                    />
                  </FormGroup>
                  <FormGroup label="Auto-complete" fieldId="ai-autocomplete">
                    <Switch
                      id="ai-autocomplete"
                      label="Enable AI auto-complete"
                      isChecked={aiAutoComplete}
                      onChange={(_event, checked) => setAiAutoComplete(checked)}
                      isDisabled={!aiEnabled}
                    />
                  </FormGroup>
                </FormSection>

                <FormSection title="AI Behavior" titleElement="h3" style={{ marginTop: '2rem' }}>
                  <FormGroup label={`Creativity level (${aiCreativity}%)`} fieldId="ai-creativity">
                    <Content component="p" style={{ fontSize: '0.75rem', color: 'var(--pf-v6-global--Color--200)', marginBottom: '0.5rem' }}>
                      Lower values produce more predictable responses, higher values are more creative
                    </Content>
                    <Slider
                      value={aiCreativity}
                      onChange={(_event, value) => setAiCreativity(value)}
                      min={0}
                      max={100}
                      step={5}
                      showBoundaries={false}
                      isDisabled={!aiEnabled}
                    />
                  </FormGroup>
                </FormSection>
                </Form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTabKey === 6 && (
              <Form>
                <Title headingLevel="h2" size="xl" style={{ marginBottom: '1.5rem' }}>
                  Notifications
                </Title>
                
                <FormSection title="Notification Channels" titleElement="h3">
                  <FormGroup label="Email notifications" fieldId="email-notifications">
                    <Switch
                      id="email-notifications"
                      label="Receive email notifications"
                      isChecked={emailNotifications}
                      onChange={(_event, checked) => setEmailNotifications(checked)}
                    />
                  </FormGroup>
                  <FormGroup label="Push notifications" fieldId="push-notifications">
                    <Switch
                      id="push-notifications"
                      label="Receive push notifications"
                      isChecked={pushNotifications}
                      onChange={(_event, checked) => setPushNotifications(checked)}
                    />
                  </FormGroup>
                </FormSection>

                <FormSection title="Notification Types" titleElement="h3" style={{ marginTop: '2rem' }}>
                  <FormGroup label="Mentions" fieldId="mentions">
                    <Switch
                      id="mentions"
                      label="Notify when mentioned"
                      isChecked={mentions}
                      onChange={(_event, checked) => setMentions(checked)}
                    />
                  </FormGroup>
                  <FormGroup label="Product updates" fieldId="updates">
                    <Switch
                      id="updates"
                      label="Notify about product updates"
                      isChecked={updates}
                      onChange={(_event, checked) => setUpdates(checked)}
                    />
                  </FormGroup>
                </FormSection>
              </Form>
            )}

            {/* Capture Tab */}
            {activeTabKey === 3 && (
              <div>
                <Title headingLevel="h2" size="xl" style={{ marginBottom: '0.5rem' }}>
                  Capture
                </Title>
                <Content component="p" style={{ marginBottom: '2rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  Capture and log your browser history to Apollo for context and analysis
                </Content>

                {/* Installation Instructions */}
                <Card style={{ marginBottom: '1.5rem' }}>
                  <CardHeader>
                    <CardTitle>Browser Extension Installation</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Content component="p" style={{ marginBottom: '1rem' }}>
                      Capture requires a browser extension to track your browsing history. 
                      The extension is not yet available in browser stores, so you'll need to install it manually.
                    </Content>
                    
                    <ExpandableSection toggleText="Installation Instructions (Developer Mode)">
                      <div style={{ padding: '1rem', background: 'var(--pf-v6-global--BackgroundColor--200)', borderRadius: '8px', marginTop: '1rem' }}>
                        <Title headingLevel="h4" size="md" style={{ marginBottom: '1rem' }}>Chrome / Edge / Brave</Title>
                        <ol style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                          <li style={{ marginBottom: '0.5rem' }}>Open your browser and go to <code>chrome://extensions/</code> (or <code>edge://extensions/</code>)</li>
                          <li style={{ marginBottom: '0.5rem' }}>Enable <strong>"Developer mode"</strong> (toggle in top right)</li>
                          <li style={{ marginBottom: '0.5rem' }}>Click <strong>"Load unpacked"</strong></li>
                          <li style={{ marginBottom: '0.5rem' }}>Select the <code>apps/browser-extension</code> folder in your Apollo project</li>
                          <li style={{ marginBottom: '0.5rem' }}>The Capture icon should appear in your toolbar</li>
                        </ol>

                        <Title headingLevel="h4" size="md" style={{ marginBottom: '1rem' }}>Firefox</Title>
                        <ol style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                          <li style={{ marginBottom: '0.5rem' }}>Open Firefox and go to <code>about:debugging#/runtime/this-firefox</code></li>
                          <li style={{ marginBottom: '0.5rem' }}>Click <strong>"Load Temporary Add-on..."</strong></li>
                          <li style={{ marginBottom: '0.5rem' }}>Select the <code>manifest.json</code> file in <code>apps/browser-extension</code></li>
                        </ol>

                        <Alert variant="info" isInline title="Note" style={{ marginTop: '1rem' }}>
                          After installing, click the extension icon to open settings and register with the Apollo server.
                          The extension will automatically capture pages you visit and send them to Apollo.
                        </Alert>
                      </div>
                    </ExpandableSection>
                  </CardBody>
                </Card>

                {/* Status Card */}
                <Card style={{ marginBottom: '1.5rem' }}>
                  <CardHeader>
                    <CardTitle>Connection Status</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                      {browserCaptureStatus?.registered ? (
                        <>
                          <CheckCircleIcon color="var(--pf-v6-global--success-color--100)" />
                          <span>Extension registered: <code>{browserCaptureStatus.extensionId}</code></span>
                        </>
                      ) : (
                        <>
                          <ExclamationCircleIcon color="var(--pf-v6-global--warning-color--100)" />
                          <span>No extension registered. Install the browser extension and click "Register" in its settings.</span>
                        </>
                      )}
                      <FlexItem align={{ default: 'alignRight' }}>
                        <Button variant="secondary" onClick={loadBrowserHistory} icon={<SyncAltIcon />}>
                          Refresh
                        </Button>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>

                {/* Open Tabs Snapshot */}
                <Card style={{ marginBottom: '1.5rem' }}>
                  <CardHeader>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <CardTitle>Open Tabs Snapshot</CardTitle>
                      <Flex gap={{ default: 'gapMd' }} alignItems={{ default: 'alignItemsCenter' }}>
                        <Label color="green">{browserTabs.tabs?.length || 0} tabs</Label>
                        <Button variant="plain" onClick={loadBrowserHistory} icon={<SyncAltIcon />} aria-label="Refresh tabs" />
                      </Flex>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    {browserTabs.timestamp && (
                      <Content component="p" style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--pf-v6-global--Color--200)' }}>
                        Last captured: {formatBrowserTimestamp(browserTabs.timestamp)}
                      </Content>
                    )}
                    {!browserTabs.tabs || browserTabs.tabs.length === 0 ? (
                      <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)', textAlign: 'center', padding: '2rem' }}>
                        No tabs captured yet. Use the browser extension to capture a snapshot of your open tabs.
                      </Content>
                    ) : (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid var(--pf-v6-global--BorderColor--100)' }}>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600', width: '50px' }}></th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Title</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>URL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {browserTabs.tabs.map((tab, index) => (
                              <tr 
                                key={tab.id || index} 
                                style={{ 
                                  borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)',
                                  background: tab.active ? 'var(--pf-v6-global--BackgroundColor--200)' : 'transparent'
                                }}
                              >
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                  {tab.pinned && <span title="Pinned">📌</span>}
                                  {tab.active && <span title="Active tab" style={{ color: 'var(--pf-v6-global--primary-color--100)' }}>●</span>}
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {tab.title}
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <a href={tab.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pf-v6-global--link--Color)' }}>
                                    {tab.url}
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardBody>
                  {browserTabs.tabs?.length > 0 && (
                    <CardFooter>
                      <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                        Data stored in <code>data/browser/tabs.json</code>
                      </Content>
                    </CardFooter>
                  )}
                </Card>

                {/* Browser History Log */}
                <Card>
                  <CardHeader>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }}>
                      <CardTitle>Recent Browser History</CardTitle>
                      <Flex gap={{ default: 'gapMd' }} alignItems={{ default: 'alignItemsCenter' }}>
                        <Label color="blue">{browserHistory.length} entries</Label>
                        <Button variant="plain" onClick={loadBrowserHistory} icon={<SyncAltIcon />} aria-label="Refresh history" />
                      </Flex>
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    {browserHistoryLoading ? (
                      <Flex justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: '2rem' }}>
                        <Spinner size="lg" />
                      </Flex>
                    ) : browserHistoryError ? (
                      <Alert variant="warning" isInline title="Could not load history">
                        {browserHistoryError}. Make sure the Apollo server is running.
                      </Alert>
                    ) : browserHistory.length === 0 ? (
                      <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)', textAlign: 'center', padding: '2rem' }}>
                        No browser history captured yet. Install the extension and browse some pages.
                      </Content>
                    ) : (
                      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid var(--pf-v6-global--BorderColor--100)' }}>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Timestamp</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Title</th>
                              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>URL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {browserHistory.map((item, index) => (
                              <tr key={item.id || index} style={{ borderBottom: '1px solid var(--pf-v6-global--BorderColor--100)' }}>
                                <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                                  {formatBrowserTimestamp(item.timestamp)}
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.title}
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pf-v6-global--link--Color)' }}>
                                    {item.url}
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardBody>
                  {browserHistory.length > 0 && (
                    <CardFooter>
                      <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                        Showing most recent {browserHistory.length} entries. Data stored in <code>data/browser/history.json</code>
                      </Content>
                    </CardFooter>
                  )}
                </Card>
              </div>
            )}

            {/* Omnibar Tab */}
            {activeTabKey === 7 && (
              <div>
                <Title headingLevel="h2" size="xl" style={{ marginBottom: '0.5rem' }}>
                  Omnibar
                </Title>
                <Content component="p" style={{ marginBottom: '2rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  Customize shortcuts and triggers for the Omnibar. Change how you interact with people, apps, and navigation.
                </Content>

                {omnibarSaved && (
                  <Alert
                    variant="success"
                    title="Omnibar settings saved"
                    isInline
                    style={{ marginBottom: '1.5rem' }}
                    actionClose={<Button variant="plain" aria-label="Close" onClick={() => setOmnibarSaved(false)}><TimesIcon /></Button>}
                  >
                    Your changes are active immediately.
                  </Alert>
                )}

                {/* Shortcuts Section */}
                <div style={{ marginBottom: '2rem' }}>
                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '1rem' }}>
                    <FlexItem>
                      <Title headingLevel="h3" size="lg">
                        Shortcut Triggers
                      </Title>
                      <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Define the characters that activate Omnibar features. Type these in the Omnibar to trigger dropdowns and actions.
                      </Content>
                    </FlexItem>
                    <FlexItem>
                      <Button
                        variant="link"
                        icon={<UndoIcon />}
                        onClick={() => {
                          const defaults = resetOmnibarConfig();
                          setOmnibarConfig(defaults);
                          setOmnibarErrors({});
                          setOmnibarSaved(true);
                          setTimeout(() => setOmnibarSaved(false), 3000);
                        }}
                      >
                        Reset to defaults
                      </Button>
                    </FlexItem>
                  </Flex>

                  <div
                    style={{
                      border: '1px solid var(--pf-v6-global--BorderColor--100)',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                  >
                    {omnibarConfig.shortcuts.map((shortcut, index) => (
                      <div
                        key={shortcut.id}
                        style={{
                          padding: '1.25rem 1.5rem',
                          borderBottom: index < omnibarConfig.shortcuts.length - 1
                            ? '1px solid var(--pf-v6-global--BorderColor--100)'
                            : 'none',
                          background: !shortcut.enabled ? 'var(--pf-v6-global--BackgroundColor--200)' : 'transparent',
                          opacity: shortcut.enabled ? 1 : 0.7,
                          transition: 'opacity 0.2s, background 0.2s'
                        }}
                      >
                        <Flex alignItems={{ default: 'alignItemsFlexStart' }} gap={{ default: 'gapLg' }}>
                          {/* Trigger badge */}
                          <FlexItem style={{ flexShrink: 0, width: '90px' }}>
                            <div
                              style={{
                                fontFamily: 'var(--pf-v6-global--FontFamily--monospace)',
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                background: shortcut.enabled 
                                  ? 'var(--pf-v6-global--primary-color--100)' 
                                  : 'var(--pf-v6-global--Color--200)',
                                color: '#fff',
                                borderRadius: '8px',
                                padding: '0.5rem 0.75rem',
                                textAlign: 'center',
                                minWidth: '60px',
                                transition: 'background 0.2s'
                              }}
                            >
                              {shortcut.trigger}
                            </div>
                          </FlexItem>

                          {/* Details */}
                          <FlexItem style={{ flex: 1 }}>
                            <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
                              <Title headingLevel="h4" size="md">
                                {shortcut.label}
                              </Title>
                              <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem', margin: 0 }}>
                                {shortcut.description}
                              </Content>

                              {/* Editable fields */}
                              <Flex gap={{ default: 'gapLg' }} alignItems={{ default: 'alignItemsFlexEnd' }} style={{ marginTop: '0.5rem' }}>
                                <FlexItem>
                                  <FormGroup
                                    label="Trigger character(s)"
                                    fieldId={`trigger-${shortcut.id}`}
                                    helperTextInvalid={omnibarErrors[shortcut.id]}
                                    validated={omnibarErrors[shortcut.id] ? 'error' : 'default'}
                                  >
                                    <TextInput
                                      id={`trigger-${shortcut.id}`}
                                      value={shortcut.trigger}
                                      onChange={(_event, value) => {
                                        const newShortcuts = omnibarConfig.shortcuts.map(s =>
                                          s.id === shortcut.id ? { ...s, trigger: value } : s
                                        );
                                        const newConfig = { ...omnibarConfig, shortcuts: newShortcuts };
                                        setOmnibarConfig(newConfig);

                                        // Validate
                                        const validation = validateTrigger(value, shortcut.id, newShortcuts);
                                        setOmnibarErrors(prev => {
                                          const next = { ...prev };
                                          if (validation.valid) {
                                            delete next[shortcut.id];
                                          } else {
                                            next[shortcut.id] = validation.error;
                                          }
                                          return next;
                                        });

                                        // Auto-save if valid
                                        if (validation.valid) {
                                          saveOmnibarConfig(newConfig);
                                          setOmnibarSaved(true);
                                          setTimeout(() => setOmnibarSaved(false), 3000);
                                        }
                                      }}
                                      validated={omnibarErrors[shortcut.id] ? 'error' : 'default'}
                                      style={{ 
                                        width: '100px',
                                        fontFamily: 'var(--pf-v6-global--FontFamily--monospace)',
                                        fontSize: '1rem',
                                        textAlign: 'center'
                                      }}
                                      isDisabled={!shortcut.enabled}
                                    />
                                  </FormGroup>
                                </FlexItem>
                                <FlexItem>
                                  <FormGroup
                                    label="Dropdown label"
                                    fieldId={`dropdown-label-${shortcut.id}`}
                                  >
                                    <TextInput
                                      id={`dropdown-label-${shortcut.id}`}
                                      value={shortcut.dropdownLabel}
                                      onChange={(_event, value) => {
                                        const newShortcuts = omnibarConfig.shortcuts.map(s =>
                                          s.id === shortcut.id ? { ...s, dropdownLabel: value } : s
                                        );
                                        const newConfig = { ...omnibarConfig, shortcuts: newShortcuts };
                                        setOmnibarConfig(newConfig);
                                        saveOmnibarConfig(newConfig);
                                        setOmnibarSaved(true);
                                        setTimeout(() => setOmnibarSaved(false), 3000);
                                      }}
                                      style={{ width: '200px' }}
                                      isDisabled={!shortcut.enabled}
                                    />
                                  </FormGroup>
                                </FlexItem>
                              </Flex>
                            </Flex>
                          </FlexItem>

                          {/* Enable/disable toggle */}
                          <FlexItem style={{ flexShrink: 0 }}>
                            <Switch
                              id={`omnibar-shortcut-${shortcut.id}`}
                              label="Enabled"
                              labelOff="Disabled"
                              isChecked={shortcut.enabled}
                              onChange={(_event, checked) => {
                                const newShortcuts = omnibarConfig.shortcuts.map(s =>
                                  s.id === shortcut.id ? { ...s, enabled: checked } : s
                                );
                                const newConfig = { ...omnibarConfig, shortcuts: newShortcuts };
                                setOmnibarConfig(newConfig);
                                saveOmnibarConfig(newConfig);
                                setOmnibarSaved(true);
                                setTimeout(() => setOmnibarSaved(false), 3000);
                              }}
                            />
                          </FlexItem>
                        </Flex>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How it works section */}
                <Card>
                  <CardHeader>
                    <CardTitle>How Omnibar Shortcuts Work</CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Content component="p" style={{ marginBottom: '1rem' }}>
                      The Omnibar is Apollo's unified interaction surface. Type a trigger character to activate a specific feature:
                    </Content>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'auto 1fr', 
                      gap: '0.75rem 1.5rem',
                      padding: '1rem',
                      background: 'var(--pf-v6-global--BackgroundColor--200)',
                      borderRadius: '8px'
                    }}>
                      {omnibarConfig.shortcuts.filter(s => s.enabled).map(shortcut => (
                        <React.Fragment key={shortcut.id}>
                          <code style={{
                            fontFamily: 'var(--pf-v6-global--FontFamily--monospace)',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                            background: 'var(--pf-v6-global--BackgroundColor--100)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            alignSelf: 'center'
                          }}>
                            {shortcut.trigger}
                          </code>
                          <span style={{ alignSelf: 'center' }}>
                            <strong>{shortcut.dropdownLabel}</strong> &mdash; {shortcut.description}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>
                    <Content component="p" style={{ marginTop: '1rem', color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem' }}>
                      Changes take effect immediately. The Omnibar will use your custom triggers the next time you type in it.
                    </Content>
                  </CardBody>
                </Card>
              </div>
            )}

            {/* Catalog Tab */}
            {activeTabKey === 4 && (
              <div>
                <Title headingLevel="h2" size="xl" style={{ marginBottom: '0.5rem' }}>
                  Catalog
                </Title>
                <Content component="p" style={{ marginBottom: '1rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  Manage the sources that populate your Apollo catalog. Sources can be Git repositories, GitLab subgroups, or GitHub organizations. Each repository within a source becomes a catalog entry.
                </Content>

                <ExpandableSection
                  toggleText="How catalog sources work"
                  style={{ marginBottom: '2rem' }}
                >
                  <Content component="p" style={{ marginBottom: '1rem' }}>
                    Catalog sources tell Apollo where to find installable applications, integrations, agents, templates, and themes. Sources are stored in <code>data/catalog-sources.yaml</code>.
                  </Content>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr',
                    gap: '0.75rem 1.5rem',
                    padding: '1rem',
                    background: 'var(--pf-v6-global--BackgroundColor--200)',
                    borderRadius: '8px'
                  }}>
                    <Label isCompact color="purple">GitLab Subgroup</Label>
                    <span>Each repository within the subgroup becomes a catalog entry. Great for organizations with many items.</span>

                    <Label isCompact color="blue">GitLab Repository</Label>
                    <span>A single GitLab repository is treated as one catalog entry.</span>

                    <Label isCompact color="grey">GitHub Repository</Label>
                    <span>A single GitHub repository is treated as one catalog entry.</span>

                    <Label isCompact color="grey">Git Repository</Label>
                    <span>Any Git-compatible repository URL. Used as a single catalog entry.</span>
                  </div>
                  <Content component="p" style={{ marginTop: '1rem', color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem' }}>
                    Sources can be enabled or disabled without removing them. Disabled sources are not synced and their entries are hidden from the catalog.
                  </Content>
                </ExpandableSection>

                {catalogSourcesSaved && (
                  <Alert
                    variant="success"
                    title="Catalog sources updated"
                    isInline
                    style={{ marginBottom: '1.5rem' }}
                    actionClose={<Button variant="plain" aria-label="Close" onClick={() => setCatalogSourcesSaved(false)}><TimesIcon /></Button>}
                  >
                    Your catalog sources have been saved to <code>data/catalog-sources.yaml</code>.
                  </Alert>
                )}

                {catalogSourcesError && (
                  <Alert
                    variant="danger"
                    title="Error"
                    isInline
                    style={{ marginBottom: '1.5rem' }}
                    actionClose={<Button variant="plain" aria-label="Close" onClick={() => setCatalogSourcesError(null)}><TimesIcon /></Button>}
                  >
                    {catalogSourcesError}
                  </Alert>
                )}

                {/* Sources Section */}
                <div style={{ marginBottom: '2rem' }}>
                  <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '1rem' }}>
                    <FlexItem>
                      <Title headingLevel="h3" size="lg">
                        Catalog Sources
                      </Title>
                      <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Add Git repositories or GitLab subgroups as catalog sources. Each repository within a source becomes an installable catalog entry.
                      </Content>
                    </FlexItem>
                    <FlexItem>
                      <Button
                        variant="primary"
                        icon={<PlusCircleIcon />}
                        onClick={() => {
                          setEditingSource('new');
                          setSourceForm({ name: '', url: '', type: 'gitlab', description: '', branch: 'main', enabled: true });
                          setSourceFormError(null);
                        }}
                      >
                        Add source
                      </Button>
                    </FlexItem>
                  </Flex>

                  {catalogSourcesLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>
                      <Spinner size="lg" />
                      <div style={{ marginTop: '1rem', color: 'var(--pf-v6-global--Color--200)' }}>Loading catalog sources...</div>
                    </div>
                  ) : (
                    <div
                      style={{
                        border: '1px solid var(--pf-v6-global--BorderColor--100)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}
                    >
                      {catalogSources.length === 0 && editingSource !== 'new' ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--pf-v6-global--Color--200)' }}>
                          <CatalogIcon style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.5 }} />
                          <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>No catalog sources configured</div>
                          <div style={{ fontSize: '0.875rem' }}>Add a Git repository or GitLab subgroup to populate your catalog.</div>
                        </div>
                      ) : (
                        <>
                          {catalogSources.map((source, index) => (
                            <div
                              key={source.id}
                              style={{
                                padding: '1.25rem 1.5rem',
                                borderBottom: (index < catalogSources.length - 1 || editingSource === 'new')
                                  ? '1px solid var(--pf-v6-global--BorderColor--100)'
                                  : 'none',
                                background: !source.enabled ? 'var(--pf-v6-global--BackgroundColor--200)' : 'transparent',
                                opacity: source.enabled ? 1 : 0.7,
                                transition: 'opacity 0.2s, background 0.2s'
                              }}
                            >
                              {editingSource && editingSource.id === source.id ? (
                                // Edit mode for existing source
                                <div>
                                  <Title headingLevel="h4" size="md" style={{ marginBottom: '1rem' }}>Edit Source</Title>
                                  {sourceFormError && (
                                    <Alert variant="danger" title={sourceFormError} isInline isPlain style={{ marginBottom: '1rem' }} />
                                  )}
                                  <Form isHorizontal>
                                    <FormGroup label="Name" isRequired fieldId="source-name">
                                      <TextInput
                                        id="source-name"
                                        value={sourceForm.name}
                                        onChange={(_e, val) => setSourceForm(prev => ({ ...prev, name: val }))}
                                        placeholder="e.g. Apollo Community Catalog"
                                      />
                                    </FormGroup>
                                    <FormGroup label="URL" isRequired fieldId="source-url">
                                      <TextInput
                                        id="source-url"
                                        value={sourceForm.url}
                                        onChange={(_e, val) => setSourceForm(prev => ({ ...prev, url: val }))}
                                        placeholder="e.g. https://gitlab.com/my-org/catalog"
                                      />
                                    </FormGroup>
                                    <FormGroup label="Type" fieldId="source-type">
                                      <select
                                        id="source-type"
                                        value={sourceForm.type}
                                        onChange={(e) => setSourceForm(prev => ({ ...prev, type: e.target.value }))}
                                        style={{
                                          padding: '0.5rem 0.75rem',
                                          borderRadius: '6px',
                                          border: '1px solid var(--pf-v6-global--BorderColor--100)',
                                          background: 'var(--pf-v6-global--BackgroundColor--100)',
                                          color: 'var(--pf-v6-global--Color--100)',
                                          fontSize: '0.875rem',
                                          width: '100%'
                                        }}
                                      >
                                        <option value="gitlab-subgroup">GitLab Subgroup</option>
                                        <option value="gitlab">GitLab Repository</option>
                                        <option value="github">GitHub Repository</option>
                                        <option value="git">Git Repository (generic)</option>
                                      </select>
                                    </FormGroup>
                                    <FormGroup label="Branch" fieldId="source-branch">
                                      <TextInput
                                        id="source-branch"
                                        value={sourceForm.branch}
                                        onChange={(_e, val) => setSourceForm(prev => ({ ...prev, branch: val }))}
                                        placeholder="main"
                                      />
                                    </FormGroup>
                                    <FormGroup label="Description" fieldId="source-description">
                                      <TextInput
                                        id="source-description"
                                        value={sourceForm.description}
                                        onChange={(_e, val) => setSourceForm(prev => ({ ...prev, description: val }))}
                                        placeholder="Brief description of this source"
                                      />
                                    </FormGroup>
                                  </Form>
                                  <Flex gap={{ default: 'gapSm' }} style={{ marginTop: '1rem' }}>
                                    <FlexItem>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => saveCatalogSource(sourceForm)}
                                      >
                                        Save
                                      </Button>
                                    </FlexItem>
                                    <FlexItem>
                                      <Button
                                        variant="link"
                                        size="sm"
                                        onClick={() => {
                                          setEditingSource(null);
                                          setSourceFormError(null);
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                    </FlexItem>
                                  </Flex>
                                </div>
                              ) : (
                                // Display mode
                                <Flex alignItems={{ default: 'alignItemsFlexStart' }} gap={{ default: 'gapLg' }}>
                                  {/* Source type icon */}
                                  <FlexItem style={{ flexShrink: 0 }}>
                                    <div
                                      style={{
                                        fontSize: '1.5rem',
                                        background: source.enabled
                                          ? 'var(--pf-v6-global--primary-color--100)'
                                          : 'var(--pf-v6-global--Color--200)',
                                        color: '#fff',
                                        borderRadius: '8px',
                                        padding: '0.6rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '44px',
                                        height: '44px',
                                        transition: 'background 0.2s'
                                      }}
                                    >
                                      {getSourceTypeIcon(source.type)}
                                    </div>
                                  </FlexItem>

                                  {/* Details */}
                                  <FlexItem style={{ flex: 1 }}>
                                    <Flex direction={{ default: 'column' }} gap={{ default: 'gapXs' }}>
                                      <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                                        <Title headingLevel="h4" size="md" style={{ margin: 0 }}>
                                          {source.name}
                                        </Title>
                                        <Label isCompact color="blue">{getSourceTypeLabel(source.type)}</Label>
                                      </Flex>
                                      {source.description && (
                                        <Content component="p" style={{ color: 'var(--pf-v6-global--Color--200)', fontSize: '0.875rem', margin: 0 }}>
                                          {source.description}
                                        </Content>
                                      )}
                                      <Content component="p" style={{ margin: 0 }}>
                                        <a
                                          href={source.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          style={{ fontSize: '0.8125rem', color: 'var(--pf-v6-global--link--Color)' }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {source.url} <ExternalLinkAltIcon style={{ fontSize: '0.7rem' }} />
                                        </a>
                                      </Content>
                                      <Flex gap={{ default: 'gapMd' }} style={{ marginTop: '0.25rem' }}>
                                        {source.branch && (
                                          <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                                            <CodeBranchIcon style={{ marginRight: '0.25rem' }} />{source.branch}
                                          </Content>
                                        )}
                                        {source.lastSync && (
                                          <Content component="small" style={{ color: 'var(--pf-v6-global--Color--200)' }}>
                                            Last synced: {new Date(source.lastSync).toLocaleString()}
                                          </Content>
                                        )}
                                      </Flex>
                                    </Flex>
                                  </FlexItem>

                                  {/* Actions */}
                                  <FlexItem style={{ flexShrink: 0 }}>
                                    <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
                                      <FlexItem>
                                        <Button
                                          variant="plain"
                                          aria-label="Edit source"
                                          onClick={() => {
                                            setEditingSource(source);
                                            setSourceForm({
                                              name: source.name,
                                              url: source.url,
                                              type: source.type,
                                              description: source.description || '',
                                              branch: source.branch || 'main',
                                              enabled: source.enabled
                                            });
                                            setSourceFormError(null);
                                          }}
                                        >
                                          <EditIcon />
                                        </Button>
                                      </FlexItem>
                                      <FlexItem>
                                        <Button
                                          variant="plain"
                                          aria-label="Delete source"
                                          isDanger
                                          onClick={() => deleteCatalogSource(source.id)}
                                          isLoading={deletingSourceId === source.id}
                                          isDisabled={deletingSourceId === source.id}
                                        >
                                          <TrashIcon />
                                        </Button>
                                      </FlexItem>
                                      <FlexItem>
                                        <Switch
                                          id={`catalog-source-${source.id}`}
                                          label="Enabled"
                                          labelOff="Disabled"
                                          isChecked={source.enabled}
                                          onChange={() => toggleCatalogSource(source)}
                                        />
                                      </FlexItem>
                                    </Flex>
                                  </FlexItem>
                                </Flex>
                              )}
                            </div>
                          ))}

                          {/* Add new source form (inline) */}
                          {editingSource === 'new' && (
                            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--pf-v6-global--BackgroundColor--200)' }}>
                              <Title headingLevel="h4" size="md" style={{ marginBottom: '1rem' }}>Add New Source</Title>
                              {sourceFormError && (
                                <Alert variant="danger" title={sourceFormError} isInline isPlain style={{ marginBottom: '1rem' }} />
                              )}
                              <Form isHorizontal>
                                <FormGroup label="Name" isRequired fieldId="new-source-name">
                                  <TextInput
                                    id="new-source-name"
                                    value={sourceForm.name}
                                    onChange={(_e, val) => setSourceForm(prev => ({ ...prev, name: val }))}
                                    placeholder="e.g. Apollo Community Catalog"
                                  />
                                </FormGroup>
                                <FormGroup label="URL" isRequired fieldId="new-source-url">
                                  <TextInput
                                    id="new-source-url"
                                    value={sourceForm.url}
                                    onChange={(_e, val) => setSourceForm(prev => ({ ...prev, url: val }))}
                                    placeholder="e.g. https://gitlab.cee.redhat.com/uxd/apollo/community-catalog"
                                  />
                                </FormGroup>
                                <FormGroup label="Type" fieldId="new-source-type">
                                  <select
                                    id="new-source-type"
                                    value={sourceForm.type}
                                    onChange={(e) => setSourceForm(prev => ({ ...prev, type: e.target.value }))}
                                    style={{
                                      padding: '0.5rem 0.75rem',
                                      borderRadius: '6px',
                                      border: '1px solid var(--pf-v6-global--BorderColor--100)',
                                      background: 'var(--pf-v6-global--BackgroundColor--100)',
                                      color: 'var(--pf-v6-global--Color--100)',
                                      fontSize: '0.875rem',
                                      width: '100%'
                                    }}
                                  >
                                    <option value="gitlab-subgroup">GitLab Subgroup</option>
                                    <option value="gitlab">GitLab Repository</option>
                                    <option value="github">GitHub Repository</option>
                                    <option value="git">Git Repository (generic)</option>
                                  </select>
                                </FormGroup>
                                <FormGroup label="Branch" fieldId="new-source-branch">
                                  <TextInput
                                    id="new-source-branch"
                                    value={sourceForm.branch}
                                    onChange={(_e, val) => setSourceForm(prev => ({ ...prev, branch: val }))}
                                    placeholder="main"
                                  />
                                </FormGroup>
                                <FormGroup label="Description" fieldId="new-source-description">
                                  <TextInput
                                    id="new-source-description"
                                    value={sourceForm.description}
                                    onChange={(_e, val) => setSourceForm(prev => ({ ...prev, description: val }))}
                                    placeholder="Brief description of this source"
                                  />
                                </FormGroup>
                              </Form>
                              <Flex gap={{ default: 'gapSm' }} style={{ marginTop: '1rem' }}>
                                <FlexItem>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => saveCatalogSource(sourceForm)}
                                  >
                                    Add source
                                  </Button>
                                </FlexItem>
                                <FlexItem>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => {
                                      setEditingSource(null);
                                      setSourceFormError(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </FlexItem>
                              </Flex>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Repositories Tab */}
            {activeTabKey === 9 && (
              <SharedReposSettings />
            )}

            {/* Shortcuts Tab */}
            {activeTabKey === 10 && (
              <div>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '0.5rem' }}>
                  <FlexItem>
                    <Title headingLevel="h2" size="xl">
                      Keyboard Shortcuts
                    </Title>
                  </FlexItem>
                  <FlexItem>
                    <Button
                      variant="link"
                      icon={<UndoIcon />}
                      onClick={() => {
                        const defaults = resetKeyboardShortcuts();
                        setShortcutsConfig(defaults);
                        setShortcutsSaved(true);
                        setTimeout(() => setShortcutsSaved(false), 2000);
                      }}
                    >
                      Reset to defaults
                    </Button>
                  </FlexItem>
                </Flex>
                <Content component="p" style={{ marginBottom: '1.5rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  Customize keyboard shortcuts to quickly perform actions in Apollo. Click on a shortcut key combination to record a new one.
                </Content>
                
                {shortcutsSaved && (
                  <Alert variant="success" title="Shortcuts saved" isInline isPlain style={{ marginBottom: '1rem' }} />
                )}
                {shortcutConflict && (
                  <Alert variant="warning" title={`Conflict: "${shortcutConflict}" already uses that key combination`} isInline isPlain style={{ marginBottom: '1rem' }} />
                )}

                {getCategories(shortcutsConfig.shortcuts).map(category => (
                  <div key={category} style={{ marginBottom: '2rem' }}>
                    <Title headingLevel="h3" size="lg" style={{ marginBottom: '0.75rem' }}>
                      {category}
                    </Title>
                    <div
                      style={{
                        border: '1px solid var(--pf-v6-global--BorderColor--100)',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}
                    >
                      {shortcutsConfig.shortcuts
                        .filter(s => s.category === category)
                        .map((shortcut, index, arr) => (
                          <div
                            key={shortcut.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0.875rem 1.25rem',
                              borderBottom: index < arr.length - 1
                                ? '1px solid var(--pf-v6-global--BorderColor--100)'
                                : 'none',
                              opacity: shortcut.enabled ? 1 : 0.5,
                              background: recordingShortcutId === shortcut.id
                                ? 'var(--pf-v6-global--BackgroundColor--200)'
                                : 'transparent',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>
                                {shortcut.label}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--pf-v6-global--Color--200)' }}>
                                {shortcut.description}
                              </div>
                            </div>
                            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
                              <FlexItem>
                                {recordingShortcutId === shortcut.id ? (
                                  <div
                                    data-shortcut-capture="true"
                                    tabIndex={0}
                                    ref={(el) => el && el.focus()}
                                    onKeyDown={(e) => {
                                      // Ignore bare modifier keys
                                      if (['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) return;
                                      e.preventDefault();
                                      e.stopPropagation();
                                      
                                      // Escape cancels recording
                                      if (e.key === 'Escape') {
                                        setRecordingShortcutId(null);
                                        setShortcutConflict(null);
                                        return;
                                      }

                                      const newKeys = eventToKeyCombination(e);
                                      
                                      // Must have at least one modifier
                                      if (!newKeys.metaKey && !newKeys.ctrlKey && !newKeys.altKey) {
                                        return;
                                      }

                                      // Check for conflicts
                                      const conflict = findConflict(newKeys, shortcut.id, shortcutsConfig.shortcuts);
                                      if (conflict) {
                                        setShortcutConflict(conflict.label);
                                        setTimeout(() => setShortcutConflict(null), 3000);
                                        return;
                                      }

                                      // Apply the new key combo
                                      const updated = {
                                        ...shortcutsConfig,
                                        shortcuts: shortcutsConfig.shortcuts.map(s =>
                                          s.id === shortcut.id ? { ...s, keys: newKeys } : s
                                        )
                                      };
                                      setShortcutsConfig(updated);
                                      saveKeyboardShortcuts(updated);
                                      setRecordingShortcutId(null);
                                      setShortcutConflict(null);
                                      setShortcutsSaved(true);
                                      setTimeout(() => setShortcutsSaved(false), 2000);
                                    }}
                                    onBlur={() => {
                                      setRecordingShortcutId(null);
                                      setShortcutConflict(null);
                                    }}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.375rem',
                                      padding: '0.375rem 0.75rem',
                                      borderRadius: '6px',
                                      border: '2px solid var(--pf-v6-global--primary-color--100)',
                                      background: 'var(--pf-v6-global--BackgroundColor--100)',
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      color: 'var(--pf-v6-global--primary-color--100)',
                                      outline: 'none',
                                      cursor: 'text',
                                      minWidth: '140px',
                                      justifyContent: 'center',
                                      animation: 'pulse-border 1.5s ease-in-out infinite'
                                    }}
                                  >
                                    Press a key combo...
                                  </div>
                                ) : (
                                  <Button
                                    variant="plain"
                                    onClick={() => {
                                      setRecordingShortcutId(shortcut.id);
                                      setShortcutConflict(null);
                                    }}
                                    isDisabled={!shortcut.enabled}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.375rem',
                                      padding: '0.375rem 0.75rem',
                                      borderRadius: '6px',
                                      border: '1px solid var(--pf-v6-global--BorderColor--100)',
                                      background: 'var(--pf-v6-global--BackgroundColor--200)',
                                      fontSize: '0.8rem',
                                      fontFamily: 'var(--pf-v6-global--FontFamily--monospace, monospace)',
                                      fontWeight: 600,
                                      letterSpacing: '0.02em',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {formatKeyCombination(shortcut.keys)}
                                  </Button>
                                )}
                              </FlexItem>
                              <FlexItem>
                                <Switch
                                  id={`shortcut-toggle-${shortcut.id}`}
                                  isChecked={shortcut.enabled}
                                  onChange={(_event, checked) => {
                                    const updated = {
                                      ...shortcutsConfig,
                                      shortcuts: shortcutsConfig.shortcuts.map(s =>
                                        s.id === shortcut.id ? { ...s, enabled: checked } : s
                                      )
                                    };
                                    setShortcutsConfig(updated);
                                    saveKeyboardShortcuts(updated);
                                  }}
                                  aria-label={`Toggle ${shortcut.label}`}
                                />
                              </FlexItem>
                            </Flex>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}

                <Divider style={{ marginBottom: '1.5rem' }} />
                <Content component="p" style={{ fontSize: '0.85rem', color: 'var(--pf-v6-global--Color--200)' }}>
                  Tip: Shortcuts require at least one modifier key ({IS_MAC ? '⌘, ⌃, ⌥' : 'Ctrl, Alt'}). Press <strong>Escape</strong> to cancel while recording.
                </Content>
              </div>
            )}
          </GridItem>
        </Grid>
      </PageSection>
      
      <IntegrationModal
        editingService={editingService}
        editForm={editForm}
        setEditForm={setEditForm}
        saving={saving}
        saveMessage={saveMessage}
        testing={testing}
        testResult={testResult}
        handleSave={handleSave}
        handleTestConnection={handleTestConnection}
        closeEditModal={closeEditModal}
        setupApollo={setupApollo}
        apolloSetupProgress={apolloSetupProgress}
        apolloSetupMessage={apolloSetupMessage}
        apolloStatus={apolloStatus}
        loadApolloStatus={loadApolloStatus}
      />
    </>
  );
};

export default Settings;
