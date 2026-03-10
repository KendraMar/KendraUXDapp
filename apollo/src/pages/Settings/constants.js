// Import service logos
import logoGmail from '../../assets/logos/logo-gmail.svg';
import logoSlack from '../../assets/logos/logo-slack.svg';
import logoTeams from '../../assets/logos/logo-teams.svg';
import logoDiscord from '../../assets/logos/logo-discord.svg';
import logoGoogleDrive from '../../assets/logos/logo-google-drive.svg';
import logoDropbox from '../../assets/logos/logo-dropbox.svg';
import logoOnedrive from '../../assets/logos/logo-onedrive.svg';
import logoBox from '../../assets/logos/logo-box.svg';
import logoGoogleCalendar from '../../assets/logos/logo-google-calendar.svg';
import logoOutlookCalendar from '../../assets/logos/logo-outlook-calendar.svg';
import logoGithub from '../../assets/logos/logo-github.svg';
import logoGitlab from '../../assets/logos/logo-gitlab.svg';
import logoJira from '../../assets/logos/logo-jira.svg';
import logoConfluence from '../../assets/logos/logo-confluence.svg';
import logoBitbucket from '../../assets/logos/logo-bitbucket.svg';
import logoNotion from '../../assets/logos/logo-notion.svg';
import logoTrello from '../../assets/logos/logo-trello.svg';
import logoAsana from '../../assets/logos/logo-asana.svg';
import logoLinear from '../../assets/logos/logo-linear.svg';
import logoFigma from '../../assets/logos/logo-figma.svg';
import logoOpenai from '../../assets/logos/logo-openai.svg';
import logoAnthropic from '../../assets/logos/logo-anthropic.svg';
import logoLocal from '../../assets/logos/logo-local.svg';
import logoAi from '../../assets/logos/logo-ai.svg';
import logoTranscription from '../../assets/logos/logo-transcription.svg';
import logoOpenshiftAi from '../../assets/logos/logo-openshift-ai.svg';
import logoRamalama from '../../assets/logos/logo-ramalama.svg';
import logoPodman from '../../assets/logos/logo-podman.svg';
import logoDocker from '../../assets/logos/logo-docker.svg';
import logoClaudeCode from '../../assets/logos/logo-claude.svg';
import logoGoose from '../../assets/logos/logo-goose.svg';
import logoGeminiCli from '../../assets/logos/logo-gemini-cli.svg';
import logoOpencode from '../../assets/logos/logo-opencode.svg';
import logoCodex from '../../assets/logos/logo-codex.svg';
import logoHomeAssistant from '../../assets/logos/logo-home-assistant.svg';
import logoRedHat from '../../assets/logos/logo-red-hat.svg';
import logoAppleMusic from '../../assets/logos/logo-apple-music.svg';
import logoCursorCli from '../../assets/logos/logo-cursor-cli.svg';
import logoGoogleTasks from '../../assets/logos/logo-google-tasks.svg';
import logoKagi from '../../assets/logos/logo-kagi.svg';

// Available tools per integration
export const integrationTools = {
  confluence: [
    { id: 'search_pages', name: 'Search Pages', description: 'Search for pages in Confluence' },
    { id: 'get_page_content', name: 'Get Page Content', description: 'Retrieve content of a specific page' },
    { id: 'list_spaces', name: 'List Spaces', description: 'List available Confluence spaces' },
    { id: 'get_page_comments', name: 'Get Comments', description: 'Get comments on a page' }
  ],
  slack: [
    { id: 'search_messages', name: 'Search Messages', description: 'Search messages across channels' },
    { id: 'get_channel_history', name: 'Get Channel History', description: 'Retrieve channel message history' },
    { id: 'list_channels', name: 'List Channels', description: 'List available channels' },
    { id: 'post_message', name: 'Post Message', description: 'Send a message to a channel' }
  ],
  'google-drive': [
    { id: 'search_files', name: 'Search Files', description: 'Search for files in Drive' },
    { id: 'get_file_content', name: 'Get File Content', description: 'Read file contents' },
    { id: 'list_files', name: 'List Files', description: 'List files in a folder' }
  ],
  figma: [
    { id: 'get_file', name: 'Get File', description: 'Retrieve Figma file details' },
    { id: 'get_comments', name: 'Get Comments', description: 'Get comments on a design' },
    { id: 'get_versions', name: 'Get Versions', description: 'List file version history' },
    { id: 'get_components', name: 'Get Components', description: 'List design components' }
  ],
  gitlab: [
    { id: 'get_project', name: 'Get Project', description: 'Get project details' },
    { id: 'list_merge_requests', name: 'List MRs', description: 'List merge requests' },
    { id: 'get_file_content', name: 'Get File', description: 'Read file from repository' },
    { id: 'search_code', name: 'Search Code', description: 'Search code in repositories' },
    { id: 'list_pipelines', name: 'List Pipelines', description: 'List CI/CD pipelines' }
  ],
  jira: [
    { id: 'search_issues', name: 'Search Issues', description: 'Search Jira issues with JQL' },
    { id: 'get_issue', name: 'Get Issue', description: 'Get issue details' },
    { id: 'create_issue', name: 'Create Issue', description: 'Create a new issue' },
    { id: 'update_issue', name: 'Update Issue', description: 'Update an existing issue' },
    { id: 'add_comment', name: 'Add Comment', description: 'Add comment to an issue' }
  ],
  'google-calendar': [
    { id: 'list_events', name: 'List Events', description: 'List calendar events' },
    { id: 'get_event', name: 'Get Event', description: 'Get event details' },
    { id: 'create_event', name: 'Create Event', description: 'Create a calendar event' }
  ]
};

// Available integrations for agents
export const availableIntegrations = [
  { id: 'confluence', name: 'Confluence', logo: logoConfluence },
  { id: 'slack', name: 'Slack', logo: logoSlack },
  { id: 'google-drive', name: 'Google Drive', logo: logoGoogleDrive },
  { id: 'figma', name: 'Figma', logo: logoFigma },
  { id: 'gitlab', name: 'GitLab', logo: logoGitlab },
  { id: 'jira', name: 'Jira', logo: logoJira },
  { id: 'google-calendar', name: 'Google Calendar', logo: logoGoogleCalendar }
];

// Integration services organized by category
export const integrationCategories = [
  {
    name: 'Communication',
    description: 'Connect your messaging and email platforms',
    services: [
      {
        id: 'gmail',
        name: 'Gmail',
        description: 'Access emails and send messages',
        logo: logoGmail,
        color: '#EA4335',
        configurable: false
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Sync channels and direct messages',
        logo: logoSlack,
        color: '#4A154B',
        configurable: true,
        configKey: 'slack'
      },
      {
        id: 'teams',
        name: 'Microsoft Teams',
        description: 'Connect Teams chats and meetings',
        logo: logoTeams,
        color: '#6264A7',
        configurable: false
      },
      {
        id: 'discord',
        name: 'Discord',
        description: 'Integrate server messages',
        logo: logoDiscord,
        color: '#5865F2',
        configurable: false
      }
    ]
  },
  {
    name: 'Files & Storage',
    description: 'Link your cloud storage providers',
    services: [
      {
        id: 'google-drive',
        name: 'Google Drive',
        description: 'Access and sync your Drive files',
        logo: logoGoogleDrive,
        color: '#4285F4',
        configurable: true,
        configKey: 'google'
      },
      {
        id: 'dropbox',
        name: 'Dropbox',
        description: 'Connect your Dropbox storage',
        logo: logoDropbox,
        color: '#0061FF',
        configurable: false
      },
      {
        id: 'onedrive',
        name: 'OneDrive',
        description: 'Sync Microsoft OneDrive files',
        logo: logoOnedrive,
        color: '#0078D4',
        configurable: false
      },
      {
        id: 'box',
        name: 'Box',
        description: 'Enterprise content management',
        logo: logoBox,
        color: '#0061D5',
        configurable: false
      }
    ]
  },
  {
    name: 'Calendar & Scheduling',
    description: 'Sync your calendars and events',
    services: [
      {
        id: 'google-calendar',
        name: 'Google Calendar',
        description: 'Sync events and scheduling',
        logo: logoGoogleCalendar,
        color: '#4285F4',
        configurable: true,
        configKey: 'googleCalendar'
      },
      {
        id: 'outlook-calendar',
        name: 'Outlook Calendar',
        description: 'Microsoft calendar integration',
        logo: logoOutlookCalendar,
        color: '#0078D4',
        configurable: false
      }
    ]
  },
  {
    name: 'Development & Code',
    description: 'Connect your development tools',
    services: [
      {
        id: 'github',
        name: 'GitHub',
        description: 'Repositories, issues, and PRs',
        logo: logoGithub,
        color: '#24292F',
        configurable: false
      },
      {
        id: 'gitlab',
        name: 'GitLab',
        description: 'GitLab projects and pipelines',
        logo: logoGitlab,
        color: '#FC6D26',
        configurable: true,
        configKey: 'gitlab'
      },
      {
        id: 'jira',
        name: 'Jira',
        description: 'Project tracking and issues',
        logo: logoJira,
        color: '#0052CC',
        configurable: true,
        configKey: 'jira'
      },
      {
        id: 'confluence',
        name: 'Confluence',
        description: 'Team documentation and wikis',
        logo: logoConfluence,
        color: '#172B4D',
        configurable: true,
        configKey: 'confluence'
      },
      {
        id: 'bitbucket',
        name: 'Bitbucket',
        description: 'Code collaboration platform',
        logo: logoBitbucket,
        color: '#0052CC',
        configurable: false
      }
    ]
  },
  {
    name: 'Project Management',
    description: 'Connect your project and task management tools',
    services: [
      {
        id: 'notion',
        name: 'Notion',
        description: 'Workspaces and databases',
        logo: logoNotion,
        color: '#000000',
        configurable: false
      },
      {
        id: 'trello',
        name: 'Trello',
        description: 'Boards, lists, and cards',
        logo: logoTrello,
        color: '#0079BF',
        configurable: false
      },
      {
        id: 'asana',
        name: 'Asana',
        description: 'Task and project management',
        logo: logoAsana,
        color: '#F06A6A',
        configurable: false
      },
      {
        id: 'linear',
        name: 'Linear',
        description: 'Issue tracking for teams',
        logo: logoLinear,
        color: '#5E6AD2',
        configurable: false
      },
      {
        id: 'google-tasks',
        name: 'Google Tasks',
        description: 'Simple task lists from Google',
        logo: logoGoogleTasks,
        color: '#4285F4',
        configurable: true,
        configKey: 'googleTasks'
      }
    ]
  },
  {
    name: 'Design',
    description: 'Connect your design tools',
    services: [
      {
        id: 'figma',
        name: 'Figma',
        description: 'Design files and collaboration',
        logo: logoFigma,
        color: '#F24E1E',
        configurable: true,
        configKey: 'figma'
      }
    ]
  },
  {
    name: 'AI Providers',
    description: 'Configure AI model providers for chat and content generation',
    services: [
      {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT-4, GPT-3.5, and other OpenAI models',
        logo: logoOpenai,
        color: '#10A37F',
        configurable: true,
        configKey: 'openai'
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Claude models for safe, helpful AI',
        logo: logoAnthropic,
        color: '#D4A574',
        configurable: true,
        configKey: 'anthropic'
      },
      {
        id: 'openshift-ai',
        name: 'OpenShift AI',
        description: 'Red Hat OpenShift AI platform',
        logo: logoOpenshiftAi,
        color: '#EE0000',
        configurable: false
      },
      {
        id: 'ramalama',
        name: 'ramalama.ai',
        description: 'Run AI models easily with ramalama',
        logo: logoRamalama,
        color: '#8B5CF6',
        configurable: false
      },
      {
        id: 'local',
        name: 'Local',
        description: 'Local LLM server (Ollama, LM Studio)',
        logo: logoLocal,
        color: '#6366F1',
        configurable: true,
        configKey: 'local'
      },
      {
        id: 'ambient-ai',
        name: 'Ambient AI',
        description: 'Red Hat internal AI platform (Claude-powered)',
        logo: logoRedHat,
        color: '#EE0000',
        configurable: true,
        configKey: 'ambientAi'
      }
    ]
  },
  {
    name: 'Containers',
    description: 'Connect your container runtime environments',
    services: [
      {
        id: 'podman',
        name: 'Podman',
        description: 'Daemonless container engine for OCI containers',
        logo: logoPodman,
        color: '#892CA0',
        configurable: false
      },
      {
        id: 'docker',
        name: 'Docker',
        description: 'Build, share, and run containerized applications',
        logo: logoDocker,
        color: '#2496ED',
        configurable: false
      }
    ]
  },
  {
    name: 'Local Tools',
    description: 'AI-powered coding assistants and CLI tools',
    services: [
      {
        id: 'claude-code',
        name: 'Claude Code',
        description: 'Anthropic\'s Claude via API key or Google Vertex AI',
        logo: logoClaudeCode,
        color: '#D4A574',
        configurable: true,
        configKey: 'claudeCode'
      },
      {
        id: 'cursor-cli',
        name: 'Cursor CLI',
        description: 'AI-powered coding from your terminal via Cursor',
        logo: logoCursorCli,
        color: '#7C3AED',
        configurable: true,
        configKey: 'cursorCli'
      },
      {
        id: 'goose',
        name: 'Goose',
        description: 'Open-source AI developer agent by Block',
        logo: logoGoose,
        color: '#FF9500',
        configurable: false
      },
      {
        id: 'gemini-cli',
        name: 'Gemini CLI',
        description: 'Google\'s AI-powered command-line coding assistant',
        logo: logoGeminiCli,
        color: '#4285F4',
        configurable: false
      },
      {
        id: 'opencode',
        name: 'OpenCode',
        description: 'Open-source terminal-based AI coding assistant',
        logo: logoOpencode,
        color: '#58A6FF',
        configurable: false
      },
      {
        id: 'codex',
        name: 'Codex CLI',
        description: 'OpenAI\'s lightweight coding agent for the terminal',
        logo: logoCodex,
        color: '#10A37F',
        configurable: false
      }
    ]
  },
  {
    name: 'Smart Home & IoT',
    description: 'Connect your home automation and IoT platforms',
    services: [
      {
        id: 'home-assistant',
        name: 'Home Assistant',
        description: 'Open source home automation platform',
        logo: logoHomeAssistant,
        color: '#18BCF2',
        configurable: true,
        configKey: 'homeAssistant'
      }
    ]
  },
  {
    name: 'Search',
    description: 'Connect web search providers',
    services: [
      {
        id: 'kagi',
        name: 'Kagi',
        description: 'Premium ad-free web search engine',
        logo: logoKagi,
        color: '#FFB319',
        configurable: true,
        configKey: 'kagi'
      }
    ]
  },
  {
    name: 'Media & Music',
    description: 'Connect your music and media services',
    services: [
      {
        id: 'apple-music',
        name: 'Apple Music',
        description: 'Stream and access your Apple Music library',
        logo: logoAppleMusic,
        color: '#FA2D48',
        configurable: true,
        configKey: 'appleMusic'
      }
    ]
  }
];

// Tab hash mapping for URL anchors (alphabetical order)
export const tabHashMap = [
  'accessibility',
  'agents',
  'ai',
  'capture',
  'catalog',
  'integrations',
  'notifications',
  'omnibar',
  'preferences',
  'repositories',
  'shortcuts'
];

export const getTabFromHash = () => {
  const hash = window.location.hash.replace('#', '');
  const index = tabHashMap.indexOf(hash);
  return index >= 0 ? index : 0;
};
