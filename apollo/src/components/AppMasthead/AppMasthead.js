import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apolloLogo from '../../assets/assistants/assistant-apollo.svg';
import logoAppleMusic from '../../assets/logos/logo-apple-music.svg';
import logoClaude from '../../assets/logos/logo-claude.svg';
import logoCursorCli from '../../assets/logos/logo-cursor-cli.svg';
import logoKagi from '../../assets/logos/logo-kagi.svg';
import {
  Masthead,
  MastheadMain,
  MastheadToggle,
  MastheadBrand,
  MastheadLogo,
  MastheadContent,
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Button,
  Brand
} from '@patternfly/react-core';
import { BarsIcon, CogIcon, QuestionCircleIcon, MicrophoneIcon, PlayIcon, PauseIcon, StepForwardIcon, StepBackwardIcon, StopCircleIcon, DesktopIcon } from '@patternfly/react-icons';
import ScreenAnnotation from '../ScreenAnnotation';
import { useMusicPlayer } from '../../lib/MusicContext';
import { useRecorder } from '../../lib/RecordingContext';
import { getApps, hasApp } from '../../lib/appRegistry';
import { coreNavItems } from '../AppSidebar/constants';
import { useDynamicPlaceholder } from '../../lib/placeholderSystem';
import { loadOmnibarConfig, getTrigger } from '../../lib/omnibarConfig';
import useKeyboardShortcuts from '../../lib/useKeyboardShortcuts';
import { usePeople } from '../../lib/PeopleContext';
import Omnibar from './components/Omnibar';
import AssistantSelector from './components/AssistantSelector';
import FloatingConversationPanel from './components/FloatingConversationPanel';
import NotificationsDropdown from './components/NotificationsDropdown';
import UserMenu from './components/UserMenu';
import ThemeToggle from './components/ThemeToggle';

// Avatar color palette for contacts without avatars
const CONTACT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

function getContactColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CONTACT_COLORS[Math.abs(hash) % CONTACT_COLORS.length];
}

// Theme constants
const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
};

// Sidebar state labels for accessibility
const SIDEBAR_STATE_LABELS = {
  open: 'Collapse navigation',
  collapsed: 'Hide navigation',
  hidden: 'Show navigation'
};

const AppMasthead = ({ onToggleSidebar, sidebarState = 'open', onPinConversation, floatingConversation, onCloseConversation, onAgentConversationComplete, onDockConversation, onUpdateDockedConversation }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchWrapperRef = React.useRef(null);
  const conversationPanelRef = React.useRef(null);
  const conversationContentRef = React.useRef(null);
  const customSearchInputRef = React.useRef(null);
  const mentionDropdownRef = React.useRef(null);
  const notificationsPanelRef = React.useRef(null);
  const notificationsButtonRef = React.useRef(null);
  
  // Music player context
  const musicPlayer = useMusicPlayer();
  
  // Recording context
  const recorder = useRecorder();

  // People context - provides real people data for @ mentions
  const { people: peopleList } = usePeople();

  // Global keyboard shortcuts
  useKeyboardShortcuts({
    'focus-omnibar': () => {
      if (customSearchInputRef.current) {
        customSearchInputRef.current.focus();
      }
    },
    'toggle-sidebar': () => {
      if (onToggleSidebar) onToggleSidebar();
    },
    'go-home': () => {
      navigate('/');
    },
    'go-settings': () => {
      navigate('/settings');
    },
    'toggle-theme': () => {
      const html = document.documentElement;
      const currentTheme = html.classList.contains('pf-v6-theme-dark') ? 'dark' : 'light';
      if (currentTheme === 'dark') {
        html.classList.remove('pf-v6-theme-dark');
        localStorage.setItem('apollo-theme', 'light');
      } else {
        html.classList.add('pf-v6-theme-dark');
        localStorage.setItem('apollo-theme', 'dark');
      }
    },
    'show-shortcuts': () => {
      navigate('/settings#shortcuts');
    },
    'start-recording': () => {
      if (recorder && recorder.toggleRecording) {
        recorder.toggleRecording();
      }
    }
  });

  // Build PEOPLE array from real people data
  const PEOPLE = React.useMemo(() => {
    return peopleList.map(person => {
      const fullName = [person.name?.first, person.name?.middle, person.name?.last].filter(Boolean).join(' ') || person.nickname || person.username || 'Unknown';
      const initials = ((person.name?.first || '').charAt(0) + (person.name?.last || '').charAt(0)).toUpperCase() || '?';
      return {
        id: person.username,
        name: fullName,
        initials,
        color: getContactColor(fullName),
        description: person.role || person.company || '',
        type: 'person',
        slackId: person.integrations?.slack || null
      };
    });
  }, [peopleList]);
  
  // Enabled agents from API
  const [enabledAgents, setEnabledAgents] = React.useState([]);
  const [agentsLoading, setAgentsLoading] = React.useState(true);
  
  // Claude Code state
  const [claudeCodeAvailable, setClaudeCodeAvailable] = React.useState(false);
  const [currentConversationId, setCurrentConversationId] = React.useState(null);
  
  // Conversation session tracking (data/conversations/ system of record)
  const omnibarSessionRef = React.useRef(null);
  
  // Cursor CLI state
  const [cursorCliAvailable, setCursorCliAvailable] = React.useState(false);
  
  // Kagi state
  const [kagiAvailable, setKagiAvailable] = React.useState(false);
  
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = React.useState(false);
  const [isNotificationsPanelOpen, setIsNotificationsPanelOpen] = React.useState(false);
  const [isAssistantMenuOpen, setIsAssistantMenuOpen] = React.useState(false);
  const [activeAssistant, setActiveAssistant] = React.useState(() => {
    try {
      const stored = localStorage.getItem('apollo-active-assistant');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [assistantFilter, setAssistantFilter] = React.useState('');
  const [assistantTab, setAssistantTab] = React.useState('all');
  const [isRecording, setIsRecording] = React.useState(false);
  const [isAnnotating, setIsAnnotating] = React.useState(false);
  // 'idle' | 'starting' | 'listening'
  const [speechStatus, setSpeechStatus] = React.useState('idle');
  const [speechStatusMessage, setSpeechStatusMessage] = React.useState('');
  
  // Speech-to-text refs for microphone capture & WebSocket streaming
  const speechWsRef = React.useRef(null);
  const audioContextRef = React.useRef(null);
  const mediaStreamRef = React.useRef(null);
  const processorRef = React.useRef(null);
  const sourceRef = React.useRef(null);
  
  // Rich text search input state - array of segments (text or chip)
  const [searchSegments, setSearchSegments] = React.useState([]);
  const [currentText, setCurrentText] = React.useState('');
  
  // @ mention dropdown state
  const [showMentionDropdown, setShowMentionDropdown] = React.useState(false);
  const [mentionFilter, setMentionFilter] = React.useState('');
  const [mentionStartIndex, setMentionStartIndex] = React.useState(-1);
  const [mentionSelectedIndex, setMentionSelectedIndex] = React.useState(0);
  
  // # app mention dropdown state  
  const [showAppDropdown, setShowAppDropdown] = React.useState(false);
  const [appFilter, setAppFilter] = React.useState('');
  const [appStartIndex, setAppStartIndex] = React.useState(-1);
  const [appSelectedIndex, setAppSelectedIndex] = React.useState(0);
  
  // [[ navigation mode state
  const [showNavDropdown, setShowNavDropdown] = React.useState(false);
  const [navFilter, setNavFilter] = React.useState('');
  const [navStartIndex, setNavStartIndex] = React.useState(-1);
  const [navSelectedIndex, setNavSelectedIndex] = React.useState(0);
  
  // Omnibar configuration (triggers loaded from settings)
  const [omnibarConfig, setOmnibarConfig] = React.useState(() => loadOmnibarConfig());
  
  // Listen for config changes from Settings page
  React.useEffect(() => {
    const handleConfigChange = (e) => {
      setOmnibarConfig(e.detail);
    };
    window.addEventListener('omnibar-config-changed', handleConfigChange);
    return () => window.removeEventListener('omnibar-config-changed', handleConfigChange);
  }, []);
  
  // Derive trigger strings from config
  const mentionTrigger = getTrigger(omnibarConfig, 'mention');
  const appTrigger = getTrigger(omnibarConfig, 'app');
  const navTrigger = getTrigger(omnibarConfig, 'navigate');
  
  // Get dropdown labels from config
  const mentionDropdownLabel = omnibarConfig.shortcuts.find(s => s.id === 'mention')?.dropdownLabel || 'People & Agents';
  const appDropdownLabel = omnibarConfig.shortcuts.find(s => s.id === 'app')?.dropdownLabel || 'Apps & Pages';
  const navDropdownLabel = omnibarConfig.shortcuts.find(s => s.id === 'navigate')?.dropdownLabel || 'Navigate to page';
  
  // Convert enabled agents to the format expected by the dropdown
  const ASSISTANTS = React.useMemo(() => 
    enabledAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      avatar: agent.avatarUrl,
      description: agent.description,
      type: 'agent',
      isClaudeCode: agent.isClaudeCode || false,
      isCursorCli: agent.isCursorCli || false,
      isKagi: agent.isKagi || false,
      defaultModel: agent.defaultModel
    })), [enabledAgents]);
  
  // Combined list for filtering (people + agents)
  const ALL_ITEMS = React.useMemo(() => [...ASSISTANTS, ...PEOPLE], [ASSISTANTS]);
  
  // Dynamic placeholder system
  const hasSearchContent = searchSegments.length > 0 || currentText.length > 0;
  const dynamicPlaceholder = useDynamicPlaceholder(activeAssistant, hasSearchContent);
  
  // Build complete app list from registry (modular apps) + core nav items
  // Both sources go through the same code path — no hardcoded app lists
  const ALL_APPS = React.useMemo(() => {
    const modularApps = getApps().map(app => ({
      id: app.id,
      name: app.manifest.displayName,
      path: app.navItem?.path || app.routes?.[0]?.path || `/${app.id}`,
      icon: app.manifest.icon || 'CubesIcon',
      type: 'app'
    }));
    // Core pages (Welcome, Dashboard, Settings, Profile) use the same shape
    const corePages = coreNavItems.map(item => ({
      id: item.id,
      name: item.displayName,
      path: item.path,
      icon: item.icon || 'CubesIcon',
      type: 'page'
    }));
    // Merge, deduplicating by id (modular apps take precedence)
    const modularIds = new Set(modularApps.map(a => a.id));
    const uniqueCorePages = corePages.filter(p => !modularIds.has(p.id));
    return [...uniqueCorePages, ...modularApps];
  }, []);
  
  // Filtered items for @ mention dropdown
  const filteredMentionItems = React.useMemo(() => {
    if (!showMentionDropdown) return [];
    const filterLower = mentionFilter.toLowerCase();
    return ALL_ITEMS.filter(item => 
      item.name.toLowerCase().includes(filterLower) || 
      item.description.toLowerCase().includes(filterLower)
    );
  }, [ALL_ITEMS, mentionFilter, showMentionDropdown]);
  
  // Filtered items for # app dropdown
  const filteredAppItems = React.useMemo(() => {
    if (!showAppDropdown) return [];
    const filterLower = appFilter.toLowerCase();
    return ALL_APPS.filter(app => 
      app.name.toLowerCase().includes(filterLower)
    );
  }, [ALL_APPS, appFilter, showAppDropdown]);
  
  // Filtered items for [[ navigation dropdown
  const filteredNavItems = React.useMemo(() => {
    if (!showNavDropdown) return [];
    const filterLower = navFilter.toLowerCase();
    return ALL_APPS.filter(app => 
      app.name.toLowerCase().includes(filterLower)
    );
  }, [ALL_APPS, navFilter, showNavDropdown]);
  
  // Search panel states
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [showConversation, setShowConversation] = React.useState(false);
  const [submittedQuery, setSubmittedQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamedResponse, setStreamedResponse] = React.useState('');
  const [showFollowUp, setShowFollowUp] = React.useState(false);
  const [followUpValue, setFollowUpValue] = React.useState('');
  const [conversationHistory, setConversationHistory] = React.useState([]);
  
  // Drag state for conversation panel
  const [isDragging, setIsDragging] = React.useState(false);
  const [panelPosition, setPanelPosition] = React.useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [hasBeenDragged, setHasBeenDragged] = React.useState(false);
  
  // Auto-scroll state
  const [userHasScrolledUp, setUserHasScrolledUp] = React.useState(false);
  
  // Theme state - separate base theme and high contrast
  const [baseTheme, setBaseTheme] = React.useState(() => {
    const stored = localStorage.getItem('pf-base-theme');
    return stored === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
  });
  
  const [isHighContrast, setIsHighContrast] = React.useState(() => {
    return localStorage.getItem('pf-high-contrast') === 'true';
  });

  // Fetch enabled agents on mount (including Claude Code and Cursor CLI check)
  React.useEffect(() => {
    const fetchAgents = async () => {
      try {
        // Fetch regular agents, Claude Code, Cursor CLI, and Kagi availability in parallel
        const [agentsResponse, claudeCodeResponse, cursorCliResponse, kagiResponse] = await Promise.all([
          fetch('/api/agents'),
          fetch('/api/claudecode/models'),
          fetch('/api/cursorcli/models'),
          fetch('/api/kagi/status')
        ]);
        
        const agentsData = await agentsResponse.json();
        const claudeCodeData = await claudeCodeResponse.json();
        const cursorCliData = await cursorCliResponse.json();
        const kagiData = await kagiResponse.json();
        
        const allAgents = [];
        
        // Add regular agents
        if (agentsData.success && agentsData.agents.length > 0) {
          allAgents.push(...agentsData.agents);
        }
        
        // Add Claude Code as an agent if available
        if (claudeCodeData.success && claudeCodeData.models?.length > 0) {
          setClaudeCodeAvailable(true);
          allAgents.push({
            id: 'claude-code',
            name: 'Claude Code',
            avatarUrl: logoClaude,
            description: 'Anthropic\'s AI coding assistant',
            isClaudeCode: true,
            defaultModel: claudeCodeData.defaultModel
          });
        }
        
        // Add Cursor CLI as an agent if available
        if (cursorCliData.success && cursorCliData.models?.length > 0) {
          setCursorCliAvailable(true);
          allAgents.push({
            id: 'cursor-cli',
            name: 'Cursor CLI',
            avatarUrl: logoCursorCli,
            description: 'Cursor\'s AI agent via CLI',
            isCursorCli: true,
            defaultModel: cursorCliData.defaultModel
          });
        }
        
        // Add Kagi as an agent if available
        if (kagiData.success && kagiData.available) {
          setKagiAvailable(true);
          allAgents.push({
            id: 'kagi',
            name: 'Kagi',
            avatarUrl: logoKagi,
            description: 'Premium web search',
            isKagi: true
          });
        }
        
        if (allAgents.length > 0) {
          setEnabledAgents(allAgents);
          // Restore previously selected agent from localStorage, or default to first
          const storedAssistant = activeAssistant;
          const matchedAgent = storedAssistant
            ? allAgents.find(a => a.id === storedAssistant.id)
            : null;
          const agentToSelect = matchedAgent || allAgents[0];
          const newAssistant = {
            id: agentToSelect.id,
            name: agentToSelect.name,
            avatar: agentToSelect.avatarUrl,
            description: agentToSelect.description,
            type: 'agent',
            isClaudeCode: agentToSelect.isClaudeCode || false,
            isCursorCli: agentToSelect.isCursorCli || false,
            isKagi: agentToSelect.isKagi || false,
            defaultModel: agentToSelect.defaultModel
          };
          setActiveAssistant(newAssistant);
          try {
            localStorage.setItem('apollo-active-assistant', JSON.stringify(newAssistant));
          } catch { /* ignore */ }
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setAgentsLoading(false);
      }
    };
    fetchAgents();
  }, []);

  // Apply theme on mount and when it changes
  React.useEffect(() => {
    const htmlElement = document.documentElement;
    
    // Remove all theme classes first
    htmlElement.classList.remove('pf-v6-theme-dark', 'pf-v6-theme-high-contrast');
    
    // Apply the appropriate theme classes
    if (baseTheme === THEMES.DARK) {
      htmlElement.classList.add('pf-v6-theme-dark');
    }
    if (isHighContrast) {
      htmlElement.classList.add('pf-v6-theme-high-contrast');
    }
    
    localStorage.setItem('pf-base-theme', baseTheme);
    localStorage.setItem('pf-high-contrast', isHighContrast.toString());
  }, [baseTheme, isHighContrast]);

  // Restore floating conversation from sidebar unpin
  React.useEffect(() => {
    if (floatingConversation && !showConversation) {
      setShowConversation(true);
      setSubmittedQuery(floatingConversation.query);
      setStreamedResponse(floatingConversation.response);
      setConversationHistory(floatingConversation.history || []);
      setShowFollowUp(true);
      setIsLoading(false);
      // Reset position when restoring
      setPanelPosition({ x: 0, y: 0 });
      setHasBeenDragged(false);
    }
  }, [floatingConversation, showConversation]);

  // Scroll selected item into view when selection changes
  React.useEffect(() => {
    if (showMentionDropdown && mentionDropdownRef.current) {
      const selectedItem = mentionDropdownRef.current.querySelector('.mention-dropdown-item-selected');
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [mentionSelectedIndex, showMentionDropdown]);
  
  React.useEffect(() => {
    if (showAppDropdown && mentionDropdownRef.current) {
      const selectedItem = mentionDropdownRef.current.querySelector('.mention-dropdown-item-selected');
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [appSelectedIndex, showAppDropdown]);
  
  React.useEffect(() => {
    if (showNavDropdown) {
      const navDropdown = searchWrapperRef.current?.querySelector('.nav-dropdown .mention-dropdown-item-selected');
      if (navDropdown) {
        navDropdown.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [navSelectedIndex, showNavDropdown]);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        if (!showConversation && !hasBeenDragged) {
          setShowSuggestions(false);
        }
        // Close mention dropdown when clicking outside
        if (showMentionDropdown) {
          setShowMentionDropdown(false);
          setMentionFilter('');
          setMentionStartIndex(-1);
        }
        // Close app dropdown when clicking outside
        if (showAppDropdown) {
          setShowAppDropdown(false);
          setAppFilter('');
          setAppStartIndex(-1);
        }
        // Close nav dropdown when clicking outside
        if (showNavDropdown) {
          setShowNavDropdown(false);
          setNavFilter('');
          setNavStartIndex(-1);
        }
      }
      // Also check if clicking outside a dragged conversation panel
      if (hasBeenDragged && conversationPanelRef.current && !conversationPanelRef.current.contains(event.target)) {
        // Don't auto-close dragged panels on outside click
      }
      // Close notifications panel when clicking outside
      if (isNotificationsPanelOpen && 
          notificationsPanelRef.current && 
          !notificationsPanelRef.current.contains(event.target) &&
          notificationsButtonRef.current &&
          !notificationsButtonRef.current.contains(event.target)) {
        setIsNotificationsPanelOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showConversation, hasBeenDragged, showMentionDropdown, showAppDropdown, showNavDropdown, isNotificationsPanelOpen]);

  // Handle drag events
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setPanelPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const onDragStart = (e) => {
    if (conversationPanelRef.current) {
      const rect = conversationPanelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      if (!hasBeenDragged) {
        // First drag - set initial position based on current element position
        setPanelPosition({
          x: rect.left,
          y: rect.top
        });
        setHasBeenDragged(true);
      }
      setIsDragging(true);
    }
  };

  // Auto-scroll to bottom when content changes (unless user scrolled up)
  React.useEffect(() => {
    if (conversationContentRef.current && !userHasScrolledUp) {
      conversationContentRef.current.scrollTop = conversationContentRef.current.scrollHeight;
    }
  }, [streamedResponse, conversationHistory, isLoading, showFollowUp, userHasScrolledUp]);

  // Reset scroll state when conversation opens/closes
  React.useEffect(() => {
    if (showConversation) {
      setUserHasScrolledUp(false);
    }
  }, [showConversation]);

  // Handle scroll to detect if user scrolled up
  const handleConversationScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 30;
    
    if (isAtBottom) {
      setUserHasScrolledUp(false);
    } else {
      setUserHasScrolledUp(true);
    }
  };

  const onUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const onUserMenuSelect = () => {
    setIsUserMenuOpen(false);
  };

  const onThemeMenuToggle = () => {
    setIsThemeMenuOpen(!isThemeMenuOpen);
  };

  const onThemeSelect = (theme) => {
    setBaseTheme(theme);
  };
  
  const onHighContrastToggle = (_event, checked) => {
    setIsHighContrast(checked);
  };

  const onSearchChange = (value) => {
    setCurrentText(value);
    
    // Check for navigation trigger (default: '[[')
    if (navTrigger) {
      const bracketMatch = value.lastIndexOf(navTrigger);
      if (bracketMatch !== -1) {
        const afterTrigger = value.slice(bracketMatch + navTrigger.length);
        // Only show nav dropdown if there's no space in the filter text and no closing bracket
        const closingChar = navTrigger === '[[' ? ']' : null;
        if (!afterTrigger.includes(' ') && (!closingChar || !afterTrigger.includes(closingChar))) {
          setShowNavDropdown(true);
          setNavFilter(afterTrigger);
          setNavStartIndex(bracketMatch);
          setNavSelectedIndex(0);
          // Close other dropdowns
          setShowMentionDropdown(false);
          setMentionFilter('');
          setMentionStartIndex(-1);
          setShowAppDropdown(false);
          setAppFilter('');
          setAppStartIndex(-1);
          return;
        }
      }
    }
    
    // Close nav dropdown if navigation trigger context is gone
    if (showNavDropdown) {
      setShowNavDropdown(false);
      setNavFilter('');
      setNavStartIndex(-1);
    }
    
    // Check for mention and app triggers (default: '@' and '#')
    const cursorPos = value.length; // For now, assume cursor is at end
    
    // Find the last mention trigger or app trigger before cursor position
    let mentionIndex = -1;
    let appIndex = -1;
    
    // For single-char triggers, scan backward from cursor
    if (mentionTrigger || appTrigger) {
      for (let i = cursorPos - 1; i >= 0; i--) {
        if (mentionTrigger && value[i] === mentionTrigger && mentionIndex === -1) {
          mentionIndex = i;
        } else if (appTrigger && value[i] === appTrigger && appIndex === -1) {
          appIndex = i;
        } else if (value[i] === ' ') {
          // Stop if we hit a space before finding triggers
          break;
        }
        
        if (mentionIndex !== -1 && appIndex !== -1) break;
      }
      
      // Also handle multi-char triggers by checking lastIndexOf
      if (mentionTrigger && mentionTrigger.length > 1) {
        const idx = value.lastIndexOf(mentionTrigger);
        if (idx !== -1 && idx >= (cursorPos - mentionTrigger.length - 20)) {
          mentionIndex = idx;
        }
      }
      if (appTrigger && appTrigger.length > 1) {
        const idx = value.lastIndexOf(appTrigger);
        if (idx !== -1 && idx >= (cursorPos - appTrigger.length - 20)) {
          appIndex = idx;
        }
      }
    }
    
    // Determine which dropdown to show (prefer the one closer to cursor)
    const useMention = mentionIndex > appIndex;
    
    if (useMention && mentionIndex !== -1 && mentionTrigger) {
      // Extract the text after the mention trigger up to cursor position
      const mentionText = value.slice(mentionIndex + mentionTrigger.length, cursorPos);
      // Only show dropdown if there's no space in the mention text
      if (!mentionText.includes(' ')) {
        setShowMentionDropdown(true);
        setMentionFilter(mentionText);
        setMentionStartIndex(mentionIndex);
        setMentionSelectedIndex(0);
        setShowAppDropdown(false);
        return;
      }
    } else if (!useMention && appIndex !== -1 && appTrigger) {
      // Extract the text after the app trigger up to cursor position
      const appText = value.slice(appIndex + appTrigger.length, cursorPos);
      // Only show dropdown if there's no space in the app text
      if (!appText.includes(' ')) {
        setShowAppDropdown(true);
        setAppFilter(appText);
        setAppStartIndex(appIndex);
        setAppSelectedIndex(0);
        setShowMentionDropdown(false);
        return;
      }
    }
    
    // Close both dropdowns if no valid trigger context
    setShowMentionDropdown(false);
    setMentionFilter('');
    setMentionStartIndex(-1);
    setShowAppDropdown(false);
    setAppFilter('');
    setAppStartIndex(-1);
  };

  const onSearchClear = () => {
    setSearchSegments([]);
    setCurrentText('');
    setShowMentionDropdown(false);
    setMentionFilter('');
    setMentionStartIndex(-1);
    setShowAppDropdown(false);
    setAppFilter('');
    setAppStartIndex(-1);
    setShowNavDropdown(false);
    setNavFilter('');
    setNavStartIndex(-1);
  };
  
  const onMentionSelect = (item) => {
    if (mentionStartIndex === -1) return;
    
    const triggerLen = mentionTrigger ? mentionTrigger.length : 1;
    const beforeMention = currentText.slice(0, mentionStartIndex);
    const afterMention = currentText.slice(mentionStartIndex + mentionFilter.length + triggerLen);
    
    // If the selected item is an agent, switch the active assistant instead of creating a chip
    if (item.type === 'agent') {
      onAssistantSelect(item);
      
      // Keep any text before and after the @mention as the current query
      const remainingText = (beforeMention + afterMention).trim();
      
      // If there was text before the mention, add it as a segment
      if (beforeMention.trim()) {
        setSearchSegments([...searchSegments, { type: 'text', content: beforeMention.trim() + ' ' }]);
        setCurrentText(afterMention.trimStart());
      } else {
        setCurrentText(remainingText);
      }
      
      setShowMentionDropdown(false);
      setMentionFilter('');
      setMentionStartIndex(-1);
      
      // Focus the input after selection
      setTimeout(() => {
        if (customSearchInputRef.current) {
          customSearchInputRef.current.focus();
        }
      }, 0);
      return;
    }
    
    // For people, create a chip segment as before
    const chip = {
      type: 'chip',
      id: `${item.type}-${item.id}-${Date.now()}`,
      itemId: item.id,
      itemType: item.type,
      name: item.name,
      avatar: item.type === 'person' ? null : item.avatar,
      initials: item.type === 'person' ? item.initials : null,
      color: item.type === 'person' ? item.color : null
    };
    
    // Build new segments
    const newSegments = [...searchSegments];
    if (beforeMention) {
      newSegments.push({ type: 'text', content: beforeMention });
    }
    newSegments.push(chip);
    
    setSearchSegments(newSegments);
    setCurrentText(afterMention);
    setShowMentionDropdown(false);
    setMentionFilter('');
    setMentionStartIndex(-1);
    
    // Focus the input after selection
    setTimeout(() => {
      if (customSearchInputRef.current) {
        customSearchInputRef.current.focus();
      }
    }, 0);
  };
  
  const onAppSelect = (app) => {
    if (appStartIndex === -1) return;
    
    // Create a chip segment
    const chip = {
      type: 'chip',
      id: `app-${app.id}-${Date.now()}`,
      itemId: app.id,
      itemType: 'app',
      name: app.name,
      icon: app.icon
    };
    
    // Split current text at app mention start
    const appTriggerLen = appTrigger ? appTrigger.length : 1;
    const beforeApp = currentText.slice(0, appStartIndex);
    const afterApp = currentText.slice(appStartIndex + appFilter.length + appTriggerLen);
    
    // Build new segments
    const newSegments = [...searchSegments];
    if (beforeApp) {
      newSegments.push({ type: 'text', content: beforeApp });
    }
    newSegments.push(chip);
    
    setSearchSegments(newSegments);
    setCurrentText(afterApp);
    setShowAppDropdown(false);
    setAppFilter('');
    setAppStartIndex(-1);
    
    // Focus the input after selection
    setTimeout(() => {
      if (customSearchInputRef.current) {
        customSearchInputRef.current.focus();
      }
    }, 0);
  };
  
  const onNavSelect = (app) => {
    // Navigate to the selected page
    navigate(app.path);
    // Clear the entire Omnibar
    setSearchSegments([]);
    setCurrentText('');
    setShowNavDropdown(false);
    setNavFilter('');
    setNavStartIndex(-1);
    setShowSuggestions(false);
    // Blur the input
    if (customSearchInputRef.current) {
      customSearchInputRef.current.blur();
    }
  };
  
  const onRemoveChip = (chipId) => {
    setSearchSegments(prev => prev.filter(seg => seg.id !== chipId));
  };

  const onRemoveTextSegment = () => {
    setSearchSegments(prev => prev.slice(0, -1));
  };
  
  // Build full search query from segments + current text
  const getFullSearchQuery = () => {
    const parts = searchSegments.map(seg => 
      seg.type === 'chip' ? `@${seg.name}` : seg.content
    );
    if (currentText) {
      parts.push(currentText);
    }
    return parts.join('');
  };

  const onSearchFocus = () => {
    if (!showConversation) {
      setShowSuggestions(true);
    }
  };

  // ─── Conversation recording helpers (data/conversations/ system of record) ───

  const getOmnibarProvider = () => {
    if (!activeAssistant) return 'unknown';
    if (activeAssistant.isClaudeCode) return 'claude-code';
    if (activeAssistant.isCursorCli) return 'cursor-cli';
    if (activeAssistant.isKagi) return 'kagi';
    return 'local';
  };

  const createOmnibarSession = async (query) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'omnibar',
          model: activeAssistant?.defaultModel || null,
          provider: getOmnibarProvider(),
          title: query.substring(0, 100),
          messages: [{ role: 'user', content: query, timestamp: new Date().toISOString() }],
          settings: { temperature: 0.7, max_tokens: 2000 },
          assistant: activeAssistant ? {
            id: activeAssistant.id,
            name: activeAssistant.name,
            type: activeAssistant.type || null,
            isClaudeCode: activeAssistant.isClaudeCode || false,
            isCursorCli: activeAssistant.isCursorCli || false,
            isKagi: activeAssistant.isKagi || false
          } : null
        })
      });
      const data = await response.json();
      if (data.success && data.session) {
        omnibarSessionRef.current = data.session.id;
      }
    } catch (error) {
      console.error('Error creating omnibar conversation session:', error);
    }
  };

  const updateOmnibarSession = async (history) => {
    if (!omnibarSessionRef.current) return;
    try {
      const messages = history.map(msg => ({
        role: msg.type === 'ai' ? 'assistant' : (msg.type === 'kagi-results' ? 'assistant' : 'user'),
        content: msg.type === 'kagi-results'
          ? JSON.stringify({ results: msg.results, relatedSearches: msg.relatedSearches })
          : msg.content,
        timestamp: new Date().toISOString()
      }));
      await fetch(`/api/conversations/${omnibarSessionRef.current}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model: activeAssistant?.defaultModel || null,
          status: 'active'
        })
      });
    } catch (error) {
      console.error('Error updating omnibar conversation session:', error);
    }
  };

  const onSearchSubmit = async (query) => {
    const fullQuery = query || getFullSearchQuery();
    if (!fullQuery.trim()) return;
    
    setShowSuggestions(false);
    setSearchSegments([]);
    setCurrentText('');
    
    // Dock the conversation to the sidebar instead of showing floating panel
    if (onDockConversation) {
      onDockConversation({
        query: fullQuery,
        assistant: activeAssistant
      });
    }

    // Create a conversation session in data/conversations/ (system of record)
    await createOmnibarSession(fullQuery);
    
    // Attach the conversation session ID to the docked conversation so follow-ups can persist
    if (onUpdateDockedConversation && omnibarSessionRef.current) {
      onUpdateDockedConversation({ conversationSessionId: omnibarSessionRef.current });
    }
    
    // Check if Cursor CLI is the active assistant
    if (activeAssistant?.isCursorCli) {
      // Build messages array including conversation history
      const apiMessages = [
        ...conversationHistory.map(msg => ({
          role: msg.type === 'ai' ? 'assistant' : 'user',
          content: msg.content
        })),
        { role: 'user', content: fullQuery }
      ];
      
      try {
        // Call Cursor CLI API
        const response = await fetch('/api/cursorcli/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model: activeAssistant.defaultModel || 'claude-4.5-sonnet'
          })
        });
        
        if (!response.ok) {
          let errorMessage = 'Cursor CLI request failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Cursor CLI returned status ${response.status}`;
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Update docked conversation - loading complete
        if (onUpdateDockedConversation) {
          onUpdateDockedConversation({ 
            isLoading: false,
            response: data.content
          });
        }
        
        // Stream the response character by character to the docked conversation
        let index = 0;
        const fullResponse = data.content;
        const interval = setInterval(() => {
          if (index < fullResponse.length) {
            const partialResponse = fullResponse.slice(0, index + 1);
            if (onUpdateDockedConversation) {
              onUpdateDockedConversation({ response: partialResponse });
            }
            index++;
          } else {
            clearInterval(interval);
            const newHistory = [...conversationHistory,
              { type: 'user', content: fullQuery },
              { type: 'ai', content: fullResponse }
            ];
            setConversationHistory(newHistory);
            if (onUpdateDockedConversation) {
              onUpdateDockedConversation({ 
                response: fullResponse,
                history: conversationHistory,
                isComplete: true 
              });
            }
            // Record in conversation session (system of record)
            updateOmnibarSession(newHistory);
            // Notify parent that conversation completed
            if (onAgentConversationComplete) {
              onAgentConversationComplete();
            }
          }
        }, 15);
      } catch (error) {
        console.error('Error calling Cursor CLI:', error);
        const errorText = `Error connecting to Cursor CLI: ${error.message}`;
        if (onUpdateDockedConversation) {
          onUpdateDockedConversation({ 
            response: errorText,
            isLoading: false,
            isComplete: true 
          });
        }
        // Save error to conversation session (system of record)
        const errorHistory = [...conversationHistory,
          { type: 'user', content: fullQuery },
          { type: 'ai', content: errorText }
        ];
        updateOmnibarSession(errorHistory);
      }
    } else if (activeAssistant?.isClaudeCode) {
      // Claude Code flow (existing code)
      // Generate conversation ID if not already set
      const convId = currentConversationId || `conv-${Date.now()}`;
      setCurrentConversationId(convId);
      
      // Get current page context
      const pageContext = `Page: ${location.pathname}\nURL: ${window.location.href}`;
      
      // Build messages array including conversation history
      const apiMessages = [
        ...conversationHistory.map(msg => ({
          role: msg.type === 'ai' ? 'assistant' : 'user',
          content: msg.content
        })),
        { role: 'user', content: fullQuery }
      ];
      
      try {
        // Use streaming endpoint
        const response = await fetch('/api/claudecode/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model: activeAssistant.defaultModel || 'claude-sonnet-4-20250514',
            pageContext,
            conversationId: convId
          })
        });
        
        if (!response.ok) {
          let errorMessage = 'Claude Code request failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Claude Code returned status ${response.status}`;
          }
          throw new Error(errorMessage);
        }
        
        // Update docked conversation - loading complete
        if (onUpdateDockedConversation) {
          onUpdateDockedConversation({ isLoading: false });
        }
        
        // Read the SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  fullResponse += data.text;
                  // Update docked conversation with streaming response
                  if (onUpdateDockedConversation) {
                    onUpdateDockedConversation({ response: fullResponse });
                  }
                } else if (data.done) {
                  // Update conversation history and mark as complete
                  const newHistory = [...conversationHistory,
                    { type: 'user', content: fullQuery },
                    { type: 'ai', content: fullResponse }
                  ];
                  setConversationHistory(newHistory);
                  if (onUpdateDockedConversation) {
                    onUpdateDockedConversation({ 
                      response: fullResponse,
                      history: conversationHistory,
                      isComplete: true 
                    });
                  }
                  // Record in conversation session (system of record)
                  updateOmnibarSession(newHistory);
                  // Notify parent that conversation completed
                  if (onAgentConversationComplete) {
                    onAgentConversationComplete();
                  }
                } else if (data.error) {
                  if (onUpdateDockedConversation) {
                    onUpdateDockedConversation({ 
                      response: `Error: ${data.error}`,
                      isComplete: true 
                    });
                  }
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }
      } catch (error) {
        console.error('Error calling Claude Code:', error);
        const errorText = `Error connecting to Claude Code: ${error.message}`;
        if (onUpdateDockedConversation) {
          onUpdateDockedConversation({ 
            response: errorText,
            isLoading: false,
            isComplete: true 
          });
        }
        // Save error to conversation session (system of record)
        const errorHistory = [...conversationHistory,
          { type: 'user', content: fullQuery },
          { type: 'ai', content: errorText }
        ];
        updateOmnibarSession(errorHistory);
      }
    } else if (activeAssistant?.isKagi) {
      // Kagi web search flow
      try {
        const response = await fetch(`/api/kagi/search?q=${encodeURIComponent(fullQuery)}`);
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Kagi search failed');
        }
        
        // Update docked conversation with Kagi search results
        if (onUpdateDockedConversation) {
          onUpdateDockedConversation({ 
            isLoading: false,
            isKagiSearch: true,
            kagiResults: data.results || [],
            kagiRelatedSearches: data.relatedSearches || [],
            kagiMeta: data.meta || {},
            isComplete: true
          });
        }
        
        // Update conversation history
        const newHistory = [...conversationHistory,
          { type: 'user', content: fullQuery },
          { type: 'kagi-results', results: data.results || [], relatedSearches: data.relatedSearches || [] }
        ];
        setConversationHistory(newHistory);
        // Record in conversation session (system of record)
        updateOmnibarSession(newHistory);
      } catch (error) {
        console.error('Error calling Kagi:', error);
        const errorText = `Error searching with Kagi: ${error.message}`;
        if (onUpdateDockedConversation) {
          onUpdateDockedConversation({ 
            response: errorText,
            isLoading: false,
            isComplete: true 
          });
        }
        // Save error to conversation session (system of record)
        const errorHistory = [...conversationHistory,
          { type: 'user', content: fullQuery },
          { type: 'ai', content: errorText }
        ];
        updateOmnibarSession(errorHistory);
      }
    } else {
      // Use local AI model with streaming
      const apiMessages = [
        ...conversationHistory.map(msg => ({
          role: msg.type === 'ai' ? 'assistant' : 'user',
          content: msg.content
        })),
        { role: 'user', content: fullQuery }
      ];

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          let errorMessage = 'AI request failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `AI service returned status ${response.status}. Is the backend server running?`;
          }
          throw new Error(errorMessage);
        }

        // Update docked conversation - loading complete, start streaming
        if (onUpdateDockedConversation) {
          onUpdateDockedConversation({ isLoading: false });
        }

        // Read the SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  fullResponse += data.text;
                  if (onUpdateDockedConversation) {
                    onUpdateDockedConversation({ response: fullResponse });
                  }
                } else if (data.done) {
                  // Stream complete
                } else if (data.error) {
                  if (onUpdateDockedConversation) {
                    onUpdateDockedConversation({
                      response: `Error: ${data.error}`,
                      isComplete: true
                    });
                  }
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }

        // Finalize
        const newHistory = [...conversationHistory,
          { type: 'user', content: fullQuery },
          { type: 'ai', content: fullResponse }
        ];
        setConversationHistory(newHistory);
        if (onUpdateDockedConversation) {
          onUpdateDockedConversation({
            response: fullResponse,
            history: conversationHistory,
            isComplete: true
          });
        }
        // Record in conversation session (system of record)
        updateOmnibarSession(newHistory);
        // Notify parent that conversation completed
        if (onAgentConversationComplete) {
          onAgentConversationComplete();
        }
      } catch (error) {
        console.error('Error calling local AI:', error);
        const errorText = `Error connecting to AI model: ${error.message}`;
        if (onUpdateDockedConversation) {
          onUpdateDockedConversation({
            response: errorText,
            isLoading: false,
            isComplete: true
          });
        }
        // Save error to conversation session (system of record)
        const errorHistory = [...conversationHistory,
          { type: 'user', content: fullQuery },
          { type: 'ai', content: errorText }
        ];
        updateOmnibarSession(errorHistory);
      }
    }
  };


  const onSuggestionClick = (suggestion) => {
    onSearchSubmit(suggestion.text);
  };

  const onEscape = () => {
    setShowSuggestions(false);
  };

  const onFollowUpSubmit = async () => {
    if (!followUpValue.trim()) return;
    
    const query = followUpValue;
    setFollowUpValue('');
    setIsLoading(true);
    setStreamedResponse('');
    setSubmittedQuery(query);
    
    // Add user message to history temporarily (for display)
    const updatedHistory = [...conversationHistory, { type: 'user', content: query }];

    // Immediately save the user's follow-up message to the session (system of record)
    updateOmnibarSession(updatedHistory);
    
    // Check if Cursor CLI is the active assistant
    if (activeAssistant?.isCursorCli) {
      // Build messages array including conversation history
      const apiMessages = updatedHistory.map(msg => ({
        role: msg.type === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }));
      
      try {
        // Call Cursor CLI API
        const response = await fetch('/api/cursorcli/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model: activeAssistant.defaultModel || 'claude-4.5-sonnet'
          })
        });
        
        if (!response.ok) {
          let errorMessage = 'Cursor CLI request failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Cursor CLI returned status ${response.status}`;
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        setIsLoading(false);
        
        // Stream the response character by character
        let index = 0;
        const fullResponse = data.content;
        const interval = setInterval(() => {
          if (index < fullResponse.length) {
            setStreamedResponse(fullResponse.slice(0, index + 1));
            index++;
          } else {
            clearInterval(interval);
            setShowFollowUp(true);
            // Update conversation history
            const newHistory = [...updatedHistory, { type: 'ai', content: fullResponse }];
            setConversationHistory(newHistory);
            // Record in conversation session (system of record)
            updateOmnibarSession(newHistory);
            // Notify parent that conversation completed
            if (onAgentConversationComplete) {
              onAgentConversationComplete();
            }
          }
        }, 15);
      } catch (error) {
        console.error('Error calling Cursor CLI:', error);
        const errorText = `Error connecting to Cursor CLI: ${error.message}`;
        setIsLoading(false);
        setStreamedResponse(errorText);
        setShowFollowUp(true);
        // Save error to conversation session (system of record)
        const errorHistory = [...updatedHistory, { type: 'ai', content: errorText }];
        updateOmnibarSession(errorHistory);
      }
    } else if (activeAssistant?.isClaudeCode) {
      // Claude Code flow (existing code)
      // Get current page context
      const pageContext = `Page: ${location.pathname}\nURL: ${window.location.href}`;
      
      // Build messages array including conversation history
      const apiMessages = updatedHistory.map(msg => ({
        role: msg.type === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }));
      
      try {
        // Use streaming endpoint
        const response = await fetch('/api/claudecode/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            model: activeAssistant.defaultModel || 'claude-sonnet-4-20250514',
            pageContext,
            conversationId: currentConversationId
          })
        });
        
        if (!response.ok) {
          let errorMessage = 'Claude Code request failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `Claude Code returned status ${response.status}`;
          }
          throw new Error(errorMessage);
        }
        
        setIsLoading(false);
        
        // Read the SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  fullResponse += data.text;
                  setStreamedResponse(fullResponse);
                } else if (data.done) {
                  setShowFollowUp(true);
                  // Update conversation history
                  const newHistory = [...updatedHistory, { type: 'ai', content: fullResponse }];
                  setConversationHistory(newHistory);
                  // Record in conversation session (system of record)
                  updateOmnibarSession(newHistory);
                  // Notify parent that conversation completed
                  if (onAgentConversationComplete) {
                    onAgentConversationComplete();
                  }
                } else if (data.error) {
                  setStreamedResponse(`Error: ${data.error}`);
                  setShowFollowUp(true);
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }
      } catch (error) {
        console.error('Error calling Claude Code:', error);
        const errorText = `Error connecting to Claude Code: ${error.message}`;
        setIsLoading(false);
        setStreamedResponse(errorText);
        setShowFollowUp(true);
        // Save error to conversation session (system of record)
        const errorHistory = [...updatedHistory, { type: 'ai', content: errorText }];
        updateOmnibarSession(errorHistory);
      }
    } else {
      // Use local AI model with streaming for follow-up
      const apiMessages = updatedHistory.map(msg => ({
        role: msg.type === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }));

      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (!response.ok) {
          let errorMessage = 'AI request failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            errorMessage = `AI service returned status ${response.status}. Is the backend server running?`;
          }
          throw new Error(errorMessage);
        }

        setIsLoading(false);

        // Read the SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  fullResponse += data.text;
                  setStreamedResponse(fullResponse);
                } else if (data.error) {
                  setStreamedResponse(`Error: ${data.error}`);
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }

        // Finalize
        setShowFollowUp(true);
        const newHistory = [...updatedHistory, { type: 'ai', content: fullResponse }];
        setConversationHistory(newHistory);
        // Record in conversation session (system of record)
        updateOmnibarSession(newHistory);
        // Notify parent that conversation completed
        if (onAgentConversationComplete) {
          onAgentConversationComplete();
        }
      } catch (error) {
        console.error('Error calling local AI:', error);
        const errorText = `Error connecting to AI model: ${error.message}`;
        setIsLoading(false);
        setStreamedResponse(errorText);
        setShowFollowUp(true);
        // Save error to conversation session (system of record)
        const errorHistory = [...updatedHistory, { type: 'ai', content: errorText }];
        updateOmnibarSession(errorHistory);
      }
    }
  };

  const handleCloseConversation = () => {
    setShowConversation(false);
    setShowSuggestions(false);
    setSubmittedQuery('');
    setStreamedResponse('');
    setShowFollowUp(false);
    setConversationHistory([]);
    setIsLoading(false);
    setPanelPosition({ x: 0, y: 0 });
    setHasBeenDragged(false);
    setCurrentConversationId(null);
    omnibarSessionRef.current = null;
    if (onCloseConversation) {
      onCloseConversation();
    }
  };

  const onPinClick = () => {
    if (onPinConversation) {
      onPinConversation({
        query: submittedQuery,
        response: streamedResponse,
        history: conversationHistory,
        assistant: activeAssistant
      });
      // Reset local state without calling parent close
      setShowConversation(false);
      setShowSuggestions(false);
      setSubmittedQuery('');
      setStreamedResponse('');
      setShowFollowUp(false);
      setConversationHistory([]);
      setIsLoading(false);
      setPanelPosition({ x: 0, y: 0 });
      setHasBeenDragged(false);
    }
  };

  // ------ Speech-to-text helpers ------

  // Convert Float32 audio samples to Int16 (PCM16) for the ASR model
  const float32ToInt16 = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  /** Tear down microphone, audio context, and WebSocket cleanly. */
  const stopSpeechToText = React.useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch (_) {}
      sourceRef.current = null;
    }
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch (_) {}
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (speechWsRef.current) {
      try {
        if (speechWsRef.current.readyState === WebSocket.OPEN) {
          speechWsRef.current.send(JSON.stringify({ type: 'stop' }));
        }
        speechWsRef.current.close();
      } catch (_) {}
      speechWsRef.current = null;
    }
    setSpeechStatus('idle');
    setSpeechStatusMessage('');
  }, []);

  /**
   * Begin the audio pipeline once the inference server is confirmed ready.
   * Called when we receive the 'connected' message from the backend.
   */
  const beginAudioCapture = React.useCallback(async (ws) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true
      }
    });
    mediaStreamRef.current = stream;

    let audioContext;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    } catch (_) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    audioContextRef.current = audioContext;

    const source = audioContext.createMediaStreamSource(stream);
    sourceRef.current = source;
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    source.connect(processor);
    processor.connect(audioContext.destination);

    processor.onaudioprocess = (e) => {
      if (ws.readyState === WebSocket.OPEN) {
        const pcm16 = float32ToInt16(e.inputBuffer.getChannelData(0));
        ws.send(pcm16.buffer);
      }
    };

    setSpeechStatus('listening');
    setSpeechStatusMessage('');
  }, []);

  /**
   * Open the WebSocket to the backend. The backend will auto-start the
   * speech model server (e.g. via ramalama) if it isn't already running,
   * sending 'starting' progress messages until the model is ready.
   */
  const startSpeechToText = React.useCallback(async () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/speech/stream`);
    speechWsRef.current = ws;
    ws.binaryType = 'arraybuffer';

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'starting':
            // Model server is spinning up — show progress to user
            setSpeechStatus('starting');
            setSpeechStatusMessage(msg.message || 'Starting speech model…');
            break;

          case 'connected':
            // Inference server is ready — start capturing audio
            beginAudioCapture(ws).catch((err) => {
              console.error('[speech] Microphone error:', err);
              stopSpeechToText();
              setIsRecording(false);
            });
            break;

          case 'transcript':
            if (msg.text) setCurrentText(prev => prev + msg.text);
            break;

          case 'transcript_final':
            if (msg.text) setCurrentText(prev => prev + msg.text);
            break;

          case 'error':
            console.error('[speech] Error:', msg.message);
            stopSpeechToText();
            setIsRecording(false);
            break;

          case 'disconnected':
            stopSpeechToText();
            setIsRecording(false);
            break;

          default:
            break;
        }
      } catch (_) {}
    };

    ws.onerror = () => {
      console.error('[speech] WebSocket connection failed');
      stopSpeechToText();
      setIsRecording(false);
    };

    ws.onclose = () => {
      if (speechWsRef.current) {
        stopSpeechToText();
        setIsRecording(false);
      }
    };
  }, [stopSpeechToText, beginAudioCapture]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => stopSpeechToText();
  }, [stopSpeechToText]);

  const onMicrophoneClick = async () => {
    if (isRecording) {
      stopSpeechToText();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      setSpeechStatus('starting');
      setSpeechStatusMessage('Connecting…');
      try {
        await startSpeechToText();
      } catch (err) {
        console.error('[speech] Failed to start:', err);
        stopSpeechToText();
        setIsRecording(false);
      }
    }
  };

  const onAnnotateClick = () => {
    setIsAnnotating(true);
  };

  const onAnnotateClose = () => {
    setIsAnnotating(false);
  };

  const onAnnotateSave = (screenshot) => {
    console.log('Screenshot saved:', screenshot);
    setIsAnnotating(false);
    // Optionally navigate to screenshots page or show a notification
  };

  const onAssistantMenuToggle = () => {
    setIsAssistantMenuOpen(!isAssistantMenuOpen);
  };

  const onAssistantSelect = (assistant) => {
    // Check if selecting Claude Code, Cursor CLI, or Kagi
    const isClaudeCode = assistant.id === 'claude-code' || assistant.isClaudeCode;
    const isCursorCli = assistant.id === 'cursor-cli' || assistant.isCursorCli;
    const isKagi = assistant.id === 'kagi' || assistant.isKagi;
    const newAssistant = {
      ...assistant,
      isClaudeCode,
      isCursorCli,
      isKagi
    };
    setActiveAssistant(newAssistant);
    // Persist selection to localStorage
    try {
      localStorage.setItem('apollo-active-assistant', JSON.stringify(newAssistant));
    } catch { /* ignore */ }
    setIsAssistantMenuOpen(false);
    // Reset conversation when switching assistants
    if (activeAssistant?.id !== assistant.id) {
      setCurrentConversationId(null);
    }
  };

  // Determine masthead class based on sidebar state
  const mastheadNavClass = `apollo-masthead-nav-${sidebarState}`;

  return (
    <>
    <ScreenAnnotation 
      isActive={isAnnotating} 
      onClose={onAnnotateClose} 
      onSave={onAnnotateSave} 
    />
    <Masthead className={mastheadNavClass}>
      <MastheadMain>
        <MastheadToggle>
          <PageToggleButton
            variant="plain"
            aria-label={SIDEBAR_STATE_LABELS[sidebarState] || 'Toggle navigation'}
            onSidebarToggle={onToggleSidebar}
            isSidebarOpen={sidebarState !== 'hidden'}
          >
            <BarsIcon />
          </PageToggleButton>
        </MastheadToggle>
        <MastheadBrand>
          <MastheadLogo 
            onClick={() => navigate('/dashboard')}
            style={{ 
              cursor: 'pointer',
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Brand
              src={apolloLogo}
              alt="KendraUXDapp logo"
              heights={{ default: '28px' }}
              className="apollo-logo"
            />
            <span className="apollo-logo-text">
              KendraUXDapp
            </span>
          </MastheadLogo>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar id="toolbar" isFullHeight isStatic>
          <ToolbarContent>
            <ToolbarGroup variant="search-filter">
              <ToolbarItem widths={{ default: '300px', lg: '400px' }}>
                <Omnibar
                  searchWrapperRef={searchWrapperRef}
                  customSearchInputRef={customSearchInputRef}
                  searchSegments={searchSegments}
                  currentText={currentText}
                  hasSearchContent={hasSearchContent}
                  dynamicPlaceholder={dynamicPlaceholder}
                  showMentionDropdown={showMentionDropdown}
                  filteredMentionItems={filteredMentionItems}
                  mentionSelectedIndex={mentionSelectedIndex}
                  mentionDropdownRef={mentionDropdownRef}
                  mentionDropdownLabel={mentionDropdownLabel}
                  mentionTrigger={mentionTrigger}
                  mentionFilter={mentionFilter}
                  showAppDropdown={showAppDropdown}
                  filteredAppItems={filteredAppItems}
                  appSelectedIndex={appSelectedIndex}
                  appDropdownLabel={appDropdownLabel}
                  appTrigger={appTrigger}
                  appFilter={appFilter}
                  showNavDropdown={showNavDropdown}
                  filteredNavItems={filteredNavItems}
                  navSelectedIndex={navSelectedIndex}
                  navDropdownLabel={navDropdownLabel}
                  navTrigger={navTrigger}
                  navFilter={navFilter}
                  showSuggestions={showSuggestions}
                  showConversation={showConversation}
                  isRecording={isRecording}
                  speechStatus={speechStatus}
                  speechStatusMessage={speechStatusMessage}
                  onSearchChange={onSearchChange}
                  onSearchFocus={onSearchFocus}
                  onSearchClear={onSearchClear}
                  onSearchSubmit={onSearchSubmit}
                  onRemoveChip={onRemoveChip}
                  onRemoveTextSegment={onRemoveTextSegment}
                  onMentionSelect={onMentionSelect}
                  setMentionSelectedIndex={setMentionSelectedIndex}
                  setShowMentionDropdown={setShowMentionDropdown}
                  setMentionFilter={setMentionFilter}
                  setMentionStartIndex={setMentionStartIndex}
                  onAppSelect={onAppSelect}
                  setAppSelectedIndex={setAppSelectedIndex}
                  setShowAppDropdown={setShowAppDropdown}
                  setAppFilter={setAppFilter}
                  setAppStartIndex={setAppStartIndex}
                  onNavSelect={onNavSelect}
                  setNavSelectedIndex={setNavSelectedIndex}
                  setShowNavDropdown={setShowNavDropdown}
                  setNavFilter={setNavFilter}
                  setNavStartIndex={setNavStartIndex}
                  onSuggestionClick={onSuggestionClick}
                  onMicrophoneClick={onMicrophoneClick}
                  onAnnotateClick={onAnnotateClick}
                  onEscape={onEscape}
                  assistantSelector={
                    <AssistantSelector
                      isOpen={isAssistantMenuOpen}
                      onToggle={onAssistantMenuToggle}
                      onOpenChange={setIsAssistantMenuOpen}
                      agentsLoading={agentsLoading}
                      activeAssistant={activeAssistant}
                      assistantFilter={assistantFilter}
                      setAssistantFilter={setAssistantFilter}
                      assistantTab={assistantTab}
                      setAssistantTab={setAssistantTab}
                      allItems={ALL_ITEMS}
                      onSelect={onAssistantSelect}
                    />
                  }
                />
                <FloatingConversationPanel
                  conversationPanelRef={conversationPanelRef}
                  conversationContentRef={conversationContentRef}
                  showConversation={showConversation}
                  hasBeenDragged={hasBeenDragged}
                  isDragging={isDragging}
                  panelPosition={panelPosition}
                  submittedQuery={submittedQuery}
                  isLoading={isLoading}
                  streamedResponse={streamedResponse}
                  conversationHistory={conversationHistory}
                  followUpValue={followUpValue}
                  setFollowUpValue={setFollowUpValue}
                  userHasScrolledUp={userHasScrolledUp}
                  onDragStart={onDragStart}
                  handleConversationScroll={handleConversationScroll}
                  onPinClick={onPinClick}
                  handleCloseConversation={handleCloseConversation}
                  onFollowUpSubmit={onFollowUpSubmit}
                  onMicrophoneClick={onMicrophoneClick}
                  isRecording={isRecording}
                />
              </ToolbarItem>
            </ToolbarGroup>
            
            {/* Mini Recording Widget — only renders if the recordings app is installed */}
            {hasApp('recordings') && recorder.isRecording && (
              <ToolbarGroup>
                <ToolbarItem>
                  <div className="masthead-mini-recorder">
                    {/* Recording Indicator */}
                    <div 
                      className="mini-recorder-indicator"
                      onClick={() => navigate('/recordings')}
                    >
                      {recorder.recordingType === 'audio' ? (
                        <MicrophoneIcon className="mini-recorder-icon" />
                      ) : (
                        <DesktopIcon className="mini-recorder-icon" />
                      )}
                      <div className="mini-recorder-pulse" />
                    </div>
                    
                    {/* Recording Info */}
                    <div className="mini-recorder-info" onClick={() => navigate('/recordings')}>
                      <div className="mini-recorder-title">
                        {recorder.recordingType === 'audio' ? 'Audio Recording' : 'Screen Recording'}
                      </div>
                      <div className="mini-recorder-duration">
                        {recorder.formatRecordingDuration(recorder.recordingDuration)}
                      </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="mini-recorder-controls">
                      <Button 
                        variant="plain" 
                        onClick={recorder.isPaused ? recorder.resumeRecording : recorder.pauseRecording} 
                        className="mini-recorder-btn"
                        title={recorder.isPaused ? 'Resume' : 'Pause'}
                      >
                        {recorder.isPaused ? <PlayIcon /> : <PauseIcon />}
                      </Button>
                      <Button 
                        variant="plain" 
                        onClick={() => navigate('/recordings')} 
                        className="mini-recorder-btn mini-recorder-stop-btn"
                        title="Stop & Save"
                      >
                        <StopCircleIcon />
                      </Button>
                    </div>
                  </div>
                </ToolbarItem>
              </ToolbarGroup>
            )}
            
            {/* Mini Music Player — only renders if the music app is installed */}
            {hasApp('music') && musicPlayer.currentSong && (
              <ToolbarGroup>
                <ToolbarItem>
                  <div className="masthead-mini-player">
                    {/* Album Art */}
                    {musicPlayer.currentSong.artwork?.url ? (
                      <img 
                        src={musicPlayer.currentSong.artwork.url} 
                        alt={musicPlayer.currentSong.album}
                        className="mini-player-artwork"
                        onClick={() => navigate('/music')}
                      />
                    ) : (
                      <div 
                        className="mini-player-artwork mini-player-artwork-placeholder"
                        onClick={() => navigate('/music')}
                      >
                        <img src={logoAppleMusic} alt="Music" style={{ width: '16px', height: '16px', opacity: 0.5 }} />
                      </div>
                    )}
                    
                    {/* Song Info */}
                    <div className="mini-player-info" onClick={() => navigate('/music')}>
                      <div className="mini-player-title">{musicPlayer.currentSong.title}</div>
                      <div className="mini-player-artist">{musicPlayer.currentSong.artist}</div>
                    </div>
                    
                    {/* Controls */}
                    <div className="mini-player-controls">
                      <Button variant="plain" onClick={musicPlayer.handlePrevious} className="mini-player-btn">
                        <StepBackwardIcon />
                      </Button>
                      <Button variant="plain" onClick={musicPlayer.togglePlayPause} className="mini-player-btn mini-player-play-btn">
                        {musicPlayer.isPlaying ? <PauseIcon /> : <PlayIcon />}
                      </Button>
                      <Button variant="plain" onClick={musicPlayer.handleNext} className="mini-player-btn">
                        <StepForwardIcon />
                      </Button>
                    </div>
                  </div>
                </ToolbarItem>
              </ToolbarGroup>
            )}
            
            <ToolbarGroup
              variant="action-group-plain"
              align={{ default: 'alignEnd' }}
              gap={{ default: 'gapNone' }}
              alignItems={{ default: 'center' }}
            >
              <ToolbarItem>
                <ThemeToggle
                  isOpen={isThemeMenuOpen}
                  onToggle={onThemeMenuToggle}
                  onOpenChange={setIsThemeMenuOpen}
                  baseTheme={baseTheme}
                  isHighContrast={isHighContrast}
                  onThemeSelect={onThemeSelect}
                  onHighContrastToggle={onHighContrastToggle}
                />
              </ToolbarItem>
              <ToolbarItem>
                <Button 
                  variant="plain" 
                  aria-label="Help"
                  onClick={() => window.open('https://www.patternfly.org/v6/', '_blank')}
                  icon={<QuestionCircleIcon />}
                />
              </ToolbarItem>
              <ToolbarItem>
                <NotificationsDropdown
                  isOpen={isNotificationsPanelOpen}
                  onToggle={() => setIsNotificationsPanelOpen(!isNotificationsPanelOpen)}
                  notificationsPanelRef={notificationsPanelRef}
                  notificationsButtonRef={notificationsButtonRef}
                />
              </ToolbarItem>
              <ToolbarItem>
                <Button 
                  variant="plain" 
                  aria-label="Settings"
                  onClick={() => navigate('/settings')}
                  icon={<CogIcon />}
                />
              </ToolbarItem>
              <ToolbarItem>
                <UserMenu
                  isOpen={isUserMenuOpen}
                  onToggle={onUserMenuToggle}
                  onSelect={onUserMenuSelect}
                  onOpenChange={setIsUserMenuOpen}
                />
              </ToolbarItem>
            </ToolbarGroup>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
    </>
  );
};

export default AppMasthead;
