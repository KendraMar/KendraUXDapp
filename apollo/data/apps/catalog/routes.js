const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const crypto = require('crypto');

// ── Catalog Sources (YAML-backed) ────────────────────────────
const SOURCES_FILE = path.join(__dirname, '..', '..', 'catalog-sources.yaml');

function loadSources() {
  try {
    if (!fs.existsSync(SOURCES_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(SOURCES_FILE, 'utf8');
    const parsed = yaml.load(raw);
    return (parsed && parsed.sources) || [];
  } catch (err) {
    console.error('Failed to load catalog sources:', err.message);
    return [];
  }
}

function saveSources(sources) {
  const doc = {
    sources: sources
  };
  const header = [
    '# Apollo Catalog Sources',
    '# Each source points to a Git repository or GitLab subgroup that contains catalog entries.',
    '# Supported types: gitlab-subgroup, gitlab, github, git (generic)',
    '#',
    '# For GitLab subgroup sources, each repository within the subgroup becomes a catalog entry.',
    '# For individual repository sources, the repository itself is a single catalog entry.',
    ''
  ].join('\n');
  const yamlStr = yaml.dump(doc, { lineWidth: 120, noRefs: true });
  fs.writeFileSync(SOURCES_FILE, header + yamlStr, 'utf8');
}

// Mock catalog data — in the future this would be fetched from catalog sources (GitLab repos, etc.)
const catalogItems = [
  // ── Applications ──────────────────────────────────────────
  {
    id: 'kubernetes-explorer',
    name: 'Kubernetes Explorer',
    type: 'application',
    description: 'Browse and manage Kubernetes clusters, namespaces, pods, deployments, and other resources directly from Apollo.',
    shortDescription: 'Kubernetes cluster management and resource explorer',
    author: 'Apollo Community',
    version: '1.2.0',
    installedVersion: '1.0.0',
    installed: true,
    stars: 142,
    downloads: 3200,
    icon: 'CubesIcon',
    tags: ['kubernetes', 'devops', 'infrastructure', 'containers'],
    capabilities: ['cluster-management', 'resource-browsing', 'pod-logs', 'namespace-switching'],
    repository: 'https://gitlab.com/apollo-community/apps/kubernetes-explorer',
    updated: '2026-01-28',
    created: '2025-06-15',
    readme: '# Kubernetes Explorer\n\nA comprehensive Kubernetes cluster management tool for Apollo.\n\n## Features\n\n- **Multi-cluster support** — Connect and switch between multiple clusters\n- **Resource browser** — Browse pods, deployments, services, configmaps, and more\n- **Real-time logs** — Stream pod logs in real-time\n- **Namespace management** — Switch namespaces and view resources per namespace\n- **YAML viewer** — View and edit resource YAML definitions\n\n## Getting Started\n\n1. Add your kubeconfig path in Settings > Integrations\n2. Navigate to the Kubernetes page\n3. Select your cluster and start exploring\n\n## Screenshots\n\n![Resource Browser](./screenshots/browser.png)\n![Pod Logs](./screenshots/logs.png)\n\n## Configuration\n\n```json\n{\n  "kubeconfigPath": "~/.kube/config",\n  "defaultNamespace": "default",\n  "refreshInterval": 30\n}\n```'
  },
  {
    id: 'home-assistant',
    name: 'Home Assistant',
    type: 'application',
    description: 'Control and monitor your smart home devices through Home Assistant integration. View sensors, toggle switches, and automate routines.',
    shortDescription: 'Smart home control and monitoring',
    author: 'Apollo Community',
    version: '2.0.1',
    installed: true,
    installedVersion: '2.0.1',
    stars: 89,
    downloads: 1850,
    icon: 'HomeIcon',
    tags: ['smart-home', 'iot', 'automation', 'home-assistant'],
    capabilities: ['device-control', 'sensor-monitoring', 'automation', 'dashboard'],
    repository: 'https://gitlab.com/apollo-community/apps/home-assistant',
    updated: '2026-02-01',
    created: '2025-08-20',
    readme: '# Home Assistant\n\nConnect Apollo to your Home Assistant instance for smart home control.\n\n## Features\n\n- View all devices and entities\n- Toggle switches and lights\n- Monitor sensor values\n- Create and trigger automations\n- Dashboard widgets for quick access'
  },
  {
    id: 'project-planner',
    name: 'Project Planner',
    type: 'application',
    description: 'Visual project planning with Gantt charts, kanban boards, and timeline views. Integrates with Jira and GitLab issues.',
    shortDescription: 'Visual project planning and tracking',
    author: 'Apollo Community',
    version: '1.0.0',
    installed: false,
    stars: 234,
    downloads: 5100,
    icon: 'ListIcon',
    tags: ['project-management', 'planning', 'gantt', 'kanban'],
    capabilities: ['gantt-charts', 'kanban-boards', 'timeline-view', 'jira-sync', 'gitlab-sync'],
    repository: 'https://gitlab.com/apollo-community/apps/project-planner',
    updated: '2026-01-15',
    created: '2025-04-10',
    readme: '# Project Planner\n\nA powerful project planning tool with multiple views.\n\n## Views\n\n- **Gantt Chart** — Visualize project timelines and dependencies\n- **Kanban Board** — Drag-and-drop task management\n- **Timeline** — Calendar-based project overview\n\n## Integrations\n\nSync with Jira and GitLab to keep your project plans up to date.'
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    type: 'application',
    description: 'Custom analytics dashboards with charts, metrics, and data visualizations. Connect to multiple data sources.',
    shortDescription: 'Custom analytics and data visualization',
    author: 'Apollo Community',
    version: '1.3.0',
    installed: false,
    stars: 178,
    downloads: 4200,
    icon: 'TachometerAltIcon',
    tags: ['analytics', 'dashboard', 'visualization', 'metrics'],
    capabilities: ['custom-charts', 'data-connectors', 'real-time-metrics', 'export'],
    repository: 'https://gitlab.com/apollo-community/apps/analytics-dashboard',
    updated: '2026-01-20',
    created: '2025-05-01',
    readme: '# Analytics Dashboard\n\nCreate beautiful, interactive analytics dashboards.\n\n## Features\n\n- Drag-and-drop dashboard builder\n- Multiple chart types (bar, line, pie, scatter, heatmap)\n- Data source connectors (PostgreSQL, MySQL, REST APIs)\n- Real-time data refresh\n- Export to PDF/PNG'
  },
  {
    id: 'notebook',
    name: 'Notebook',
    type: 'application',
    description: 'A rich notebook experience with markdown, code cells, and inline AI assistance. Perfect for research and documentation.',
    shortDescription: 'Interactive notebooks with AI assistance',
    author: 'Apollo Community',
    version: '0.9.0',
    installed: false,
    stars: 312,
    downloads: 6800,
    icon: 'BookOpenIcon',
    tags: ['notebook', 'markdown', 'documentation', 'research'],
    capabilities: ['markdown-editing', 'code-cells', 'ai-assistance', 'export', 'collaboration'],
    repository: 'https://gitlab.com/apollo-community/apps/notebook',
    updated: '2026-02-05',
    created: '2025-03-15',
    readme: '# Notebook\n\nAn interactive notebook for research, documentation, and exploration.\n\n## Features\n\n- Rich markdown editing with live preview\n- Executable code cells (Python, JavaScript, SQL)\n- Inline AI assistance for writing and analysis\n- Export to Markdown, PDF, HTML\n- Version history and collaboration'
  },

  // ── Integrations ──────────────────────────────────────────
  {
    id: 'slack-integration',
    name: 'Slack',
    type: 'integration',
    description: 'Connect to your Slack workspace to browse channels, search messages, and stay up to date with team conversations.',
    shortDescription: 'Slack workspace integration',
    author: 'Apollo Core',
    version: '3.1.0',
    installed: true,
    installedVersion: '3.1.0',
    stars: 456,
    downloads: 12000,
    icon: 'SlackHashIcon',
    tags: ['communication', 'messaging', 'team', 'slack'],
    capabilities: ['channel-browsing', 'message-search', 'notifications', 'thread-view'],
    repository: 'https://gitlab.com/apollo-community/integrations/slack',
    updated: '2026-01-30',
    created: '2025-01-01',
    readme: '# Slack Integration\n\nFull Slack workspace integration for Apollo.\n\n## Features\n\n- Browse all channels and DMs\n- Full-text message search\n- Thread view and replies\n- Real-time notifications\n- Rich message formatting'
  },
  {
    id: 'jira-integration',
    name: 'Jira',
    type: 'integration',
    description: 'Connect to Jira to browse projects, track issues, manage sprints, and view boards directly from Apollo.',
    shortDescription: 'Jira project and issue tracking',
    author: 'Apollo Core',
    version: '2.5.0',
    installed: true,
    installedVersion: '2.4.0',
    stars: 389,
    downloads: 9800,
    icon: 'ListIcon',
    tags: ['project-management', 'issue-tracking', 'agile', 'jira'],
    capabilities: ['project-browsing', 'issue-management', 'sprint-tracking', 'board-view'],
    repository: 'https://gitlab.com/apollo-community/integrations/jira',
    updated: '2026-02-03',
    created: '2025-01-15',
    readme: '# Jira Integration\n\nFull Jira integration for project and issue tracking.\n\n## Features\n\n- Browse all projects and boards\n- Create and edit issues\n- Sprint planning and tracking\n- JQL search\n- Kanban and Scrum board views'
  },
  {
    id: 'gitlab-integration',
    name: 'GitLab',
    type: 'integration',
    description: 'Connect to GitLab to browse repositories, merge requests, pipelines, and manage your code directly from Apollo.',
    shortDescription: 'GitLab repository and CI/CD integration',
    author: 'Apollo Core',
    version: '2.2.0',
    installed: true,
    installedVersion: '2.2.0',
    stars: 298,
    downloads: 7600,
    icon: 'GitlabIcon',
    tags: ['git', 'ci-cd', 'code', 'gitlab'],
    capabilities: ['repo-browsing', 'merge-requests', 'pipeline-view', 'code-review'],
    repository: 'https://gitlab.com/apollo-community/integrations/gitlab',
    updated: '2026-01-25',
    created: '2025-02-01',
    readme: '# GitLab Integration\n\nFull GitLab integration for code and CI/CD management.'
  },
  {
    id: 'figma-integration',
    name: 'Figma',
    type: 'integration',
    description: 'Browse Figma files, view designs, inspect components, and track design changes within Apollo.',
    shortDescription: 'Figma design file browser',
    author: 'Apollo Core',
    version: '1.8.0',
    installed: true,
    installedVersion: '1.8.0',
    stars: 267,
    downloads: 6200,
    icon: 'ObjectGroupIcon',
    tags: ['design', 'ui', 'figma', 'prototyping'],
    capabilities: ['file-browsing', 'component-inspection', 'design-tokens', 'version-history'],
    repository: 'https://gitlab.com/apollo-community/integrations/figma',
    updated: '2026-01-18',
    created: '2025-03-01',
    readme: '# Figma Integration\n\nBrowse and inspect Figma designs directly in Apollo.'
  },
  {
    id: 'confluence-integration',
    name: 'Confluence',
    type: 'integration',
    description: 'Access your Confluence spaces, pages, and documentation. Search across all your team knowledge base.',
    shortDescription: 'Confluence knowledge base integration',
    author: 'Apollo Community',
    version: '1.5.0',
    installed: false,
    stars: 156,
    downloads: 3800,
    icon: 'BookOpenIcon',
    tags: ['documentation', 'wiki', 'knowledge-base', 'confluence'],
    capabilities: ['space-browsing', 'page-search', 'inline-preview', 'recent-pages'],
    repository: 'https://gitlab.com/apollo-community/integrations/confluence',
    updated: '2026-01-10',
    created: '2025-05-20',
    readme: '# Confluence Integration\n\nAccess your team\'s Confluence knowledge base from Apollo.'
  },
  {
    id: 'google-calendar-integration',
    name: 'Google Calendar',
    type: 'integration',
    description: 'View and manage your Google Calendar events, meetings, and schedules. Get reminders and agenda views.',
    shortDescription: 'Google Calendar events and scheduling',
    author: 'Apollo Community',
    version: '1.2.0',
    installed: false,
    stars: 198,
    downloads: 4500,
    icon: 'CalendarAltIcon',
    tags: ['calendar', 'scheduling', 'meetings', 'google'],
    capabilities: ['event-view', 'agenda', 'meeting-reminders', 'quick-add'],
    repository: 'https://gitlab.com/apollo-community/integrations/google-calendar',
    updated: '2026-01-22',
    created: '2025-04-15',
    readme: '# Google Calendar Integration\n\nView and manage your schedule from Apollo.'
  },
  {
    id: 'github-integration',
    name: 'GitHub',
    type: 'integration',
    description: 'Connect to GitHub to browse repositories, pull requests, issues, and actions workflows.',
    shortDescription: 'GitHub repository and PR management',
    author: 'Apollo Community',
    version: '1.0.0',
    installed: false,
    stars: 345,
    downloads: 8200,
    icon: 'CodeIcon',
    tags: ['git', 'ci-cd', 'code', 'github'],
    capabilities: ['repo-browsing', 'pull-requests', 'issues', 'actions'],
    repository: 'https://gitlab.com/apollo-community/integrations/github',
    updated: '2026-02-04',
    created: '2025-07-01',
    readme: '# GitHub Integration\n\nFull GitHub integration for Apollo.'
  },

  // ── Agents ────────────────────────────────────────────────
  {
    id: 'design-reviewer',
    name: 'Design Reviewer',
    type: 'agent',
    description: 'An AI agent that reviews UI designs for accessibility, consistency, and UX best practices. Provides actionable feedback on mockups and prototypes.',
    shortDescription: 'AI-powered design review and feedback',
    author: 'Apollo Community',
    version: '1.1.0',
    installed: false,
    stars: 267,
    downloads: 4100,
    icon: 'PaintBrushIcon',
    tags: ['ai', 'design', 'accessibility', 'ux-review'],
    capabilities: ['accessibility-audit', 'consistency-check', 'ux-suggestions', 'component-recognition'],
    repository: 'https://gitlab.com/apollo-community/agents/design-reviewer',
    updated: '2026-01-29',
    created: '2025-09-01',
    readme: '# Design Reviewer Agent\n\nAn AI agent that provides expert design feedback.\n\n## What It Does\n\n- **Accessibility Audit** — Checks color contrast, touch targets, ARIA labels\n- **Consistency Check** — Verifies design system compliance\n- **UX Suggestions** — Provides improvement recommendations\n- **Component Recognition** — Identifies PatternFly components and suggests alternatives\n\n## Usage\n\nUpload a screenshot or share a Figma link, and the agent will provide a detailed review.'
  },
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    type: 'agent',
    description: 'A coding assistant that helps with code generation, refactoring, debugging, and documentation. Works with your local codebase.',
    shortDescription: 'AI code generation and refactoring',
    author: 'Apollo Core',
    version: '2.0.0',
    installed: true,
    installedVersion: '2.0.0',
    stars: 534,
    downloads: 15000,
    icon: 'CodeIcon',
    tags: ['ai', 'coding', 'refactoring', 'documentation'],
    capabilities: ['code-generation', 'refactoring', 'debugging', 'documentation', 'code-review'],
    repository: 'https://gitlab.com/apollo-community/agents/code-assistant',
    updated: '2026-02-06',
    created: '2025-02-15',
    readme: '# Code Assistant Agent\n\nYour AI pair programmer within Apollo.\n\n## Features\n\n- Generate code from natural language descriptions\n- Refactor and optimize existing code\n- Debug issues with contextual understanding\n- Auto-generate documentation\n- Code review with best practice suggestions'
  },
  {
    id: 'research-agent',
    name: 'Research Agent',
    type: 'agent',
    description: 'An AI agent that helps gather, synthesize, and organize research from multiple sources. Great for competitive analysis and user research.',
    shortDescription: 'AI research gathering and synthesis',
    author: 'Apollo Community',
    version: '1.0.0',
    installed: false,
    stars: 189,
    downloads: 3400,
    icon: 'BookIcon',
    tags: ['ai', 'research', 'analysis', 'synthesis'],
    capabilities: ['web-research', 'source-aggregation', 'summary-generation', 'citation-tracking'],
    repository: 'https://gitlab.com/apollo-community/agents/research-agent',
    updated: '2026-01-20',
    created: '2025-10-01',
    readme: '# Research Agent\n\nAn AI agent for research gathering and synthesis.'
  },
  {
    id: 'writing-assistant',
    name: 'Writing Assistant',
    type: 'agent',
    description: 'An AI agent for content creation, editing, and refinement. Helps with documentation, blog posts, reports, and more.',
    shortDescription: 'AI writing and content creation',
    author: 'Apollo Community',
    version: '1.3.0',
    installed: false,
    stars: 223,
    downloads: 5200,
    icon: 'EditIcon',
    tags: ['ai', 'writing', 'content', 'editing'],
    capabilities: ['content-generation', 'editing', 'tone-adjustment', 'formatting'],
    repository: 'https://gitlab.com/apollo-community/agents/writing-assistant',
    updated: '2026-02-02',
    created: '2025-07-15',
    readme: '# Writing Assistant Agent\n\nAI-powered writing and content creation.'
  },
  {
    id: 'ux-researcher',
    name: 'UX Researcher',
    type: 'agent',
    description: 'An AI agent that helps plan and analyze user research. Creates interview guides, analyzes transcripts, and identifies themes.',
    shortDescription: 'AI user research planning and analysis',
    author: 'Apollo Community',
    version: '0.8.0',
    installed: false,
    stars: 145,
    downloads: 2100,
    icon: 'UsersIcon',
    tags: ['ai', 'ux-research', 'interviews', 'analysis'],
    capabilities: ['interview-guides', 'transcript-analysis', 'theme-extraction', 'insight-synthesis'],
    repository: 'https://gitlab.com/apollo-community/agents/ux-researcher',
    updated: '2026-01-12',
    created: '2025-11-01',
    readme: '# UX Researcher Agent\n\nAI assistance for user research activities.'
  },

  // ── Templates ─────────────────────────────────────────────
  {
    id: 'design-sprint-template',
    name: 'Design Sprint',
    type: 'template',
    description: 'A complete design sprint workspace template with pre-configured spaces, boards, and workflows for running a 5-day design sprint.',
    shortDescription: '5-day design sprint workspace template',
    author: 'Apollo Community',
    version: '1.0.0',
    installed: false,
    stars: 178,
    downloads: 2800,
    icon: 'FlaskIcon',
    tags: ['design-sprint', 'workshop', 'template', 'methodology'],
    capabilities: ['space-template', 'board-templates', 'timer', 'voting'],
    repository: 'https://gitlab.com/apollo-community/templates/design-sprint',
    updated: '2026-01-05',
    created: '2025-08-01',
    readme: '# Design Sprint Template\n\nEverything you need to run a design sprint.\n\n## Includes\n\n- Pre-configured 5-day workspace\n- Activity boards for each day\n- Voting and decision tools\n- Timer and facilitation guides'
  },
  {
    id: 'product-launch-template',
    name: 'Product Launch',
    type: 'template',
    description: 'A workspace template for managing product launches with checklists, timelines, communication plans, and stakeholder tracking.',
    shortDescription: 'Product launch management template',
    author: 'Apollo Community',
    version: '1.1.0',
    installed: false,
    stars: 134,
    downloads: 2200,
    icon: 'RocketIcon',
    tags: ['product-launch', 'checklist', 'planning', 'template'],
    capabilities: ['launch-checklist', 'timeline', 'stakeholder-tracking', 'communication-plan'],
    repository: 'https://gitlab.com/apollo-community/templates/product-launch',
    updated: '2025-12-20',
    created: '2025-06-15',
    readme: '# Product Launch Template\n\nManage your product launches from start to finish.'
  },

  // ── Themes ────────────────────────────────────────────────
  {
    id: 'nord-theme',
    name: 'Nord',
    type: 'theme',
    description: 'A clean, arctic-inspired color theme based on the Nord color palette. Easy on the eyes for long work sessions.',
    shortDescription: 'Arctic-inspired color theme',
    author: 'Apollo Community',
    version: '1.0.0',
    installed: false,
    stars: 456,
    downloads: 8900,
    icon: 'PaletteIcon',
    tags: ['theme', 'dark-mode', 'colors', 'nord'],
    capabilities: ['color-theme', 'dark-mode', 'syntax-highlighting'],
    repository: 'https://gitlab.com/apollo-community/themes/nord',
    updated: '2025-11-15',
    created: '2025-09-01',
    readme: '# Nord Theme\n\nAn arctic, north-bluish color palette for Apollo.'
  },
  {
    id: 'dracula-theme',
    name: 'Dracula',
    type: 'theme',
    description: 'A dark theme based on the popular Dracula color scheme. High contrast and vibrant colors for excellent readability.',
    shortDescription: 'Dark theme with vibrant colors',
    author: 'Apollo Community',
    version: '1.2.0',
    installed: false,
    stars: 389,
    downloads: 7500,
    icon: 'PaletteIcon',
    tags: ['theme', 'dark-mode', 'colors', 'dracula'],
    capabilities: ['color-theme', 'dark-mode', 'syntax-highlighting'],
    repository: 'https://gitlab.com/apollo-community/themes/dracula',
    updated: '2025-12-01',
    created: '2025-08-15',
    readme: '# Dracula Theme\n\nA dark theme with vibrant colors for Apollo.'
  }
];

// Catalog sources are loaded from YAML — see loadSources() above

// ── API Routes ──────────────────────────────────────────────

// List all catalog items with optional filtering
router.get('/items', async (req, res) => {
  try {
    const { type, search, installed, tag } = req.query;
    let filtered = [...catalogItems];

    if (type && type !== 'all') {
      filtered = filtered.filter(item => item.type === type);
    }

    if (installed === 'true') {
      filtered = filtered.filter(item => item.installed);
    }

    if (tag) {
      filtered = filtered.filter(item => item.tags.includes(tag));
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    res.json({ success: true, items: filtered, total: filtered.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get items with available updates
router.get('/updates', async (req, res) => {
  try {
    const updates = catalogItems.filter(item =>
      item.installed && item.installedVersion && item.version !== item.installedVersion
    );
    res.json({ success: true, items: updates, total: updates.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get a single catalog item by ID
router.get('/items/:id', async (req, res) => {
  try {
    const item = catalogItems.find(i => i.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Install a catalog item (mock)
router.post('/items/:id/install', async (req, res) => {
  try {
    const item = catalogItems.find(i => i.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    item.installed = true;
    item.installedVersion = item.version;
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Uninstall a catalog item (mock)
router.post('/items/:id/uninstall', async (req, res) => {
  try {
    const item = catalogItems.find(i => i.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    item.installed = false;
    item.installedVersion = null;
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update a catalog item (mock)
router.post('/items/:id/update', async (req, res) => {
  try {
    const item = catalogItems.find(i => i.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    item.installedVersion = item.version;
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Catalog Sources CRUD ──────────────────────────────────────

// List all sources
router.get('/sources', async (req, res) => {
  try {
    const sources = loadSources();
    res.json({ success: true, sources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get a single source by ID
router.get('/sources/:id', async (req, res) => {
  try {
    const sources = loadSources();
    const source = sources.find(s => s.id === req.params.id);
    if (!source) {
      return res.status(404).json({ success: false, error: 'Source not found' });
    }
    res.json({ success: true, source });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add a new source
router.post('/sources', async (req, res) => {
  try {
    const { name, url, type, description, branch, enabled } = req.body;

    if (!name || !url) {
      return res.status(400).json({ success: false, error: 'Name and URL are required' });
    }

    const sources = loadSources();
    const id = crypto.randomBytes(8).toString('hex');

    const newSource = {
      id,
      name,
      url,
      type: type || detectSourceType(url),
      description: description || '',
      enabled: enabled !== undefined ? enabled : true,
      branch: branch || 'main',
      lastSync: null
    };

    sources.push(newSource);
    saveSources(sources);

    res.json({ success: true, source: newSource });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update a source
router.put('/sources/:id', async (req, res) => {
  try {
    const sources = loadSources();
    const index = sources.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Source not found' });
    }

    const { name, url, type, description, branch, enabled } = req.body;
    const updated = {
      ...sources[index],
      ...(name !== undefined && { name }),
      ...(url !== undefined && { url }),
      ...(type !== undefined && { type }),
      ...(description !== undefined && { description }),
      ...(branch !== undefined && { branch }),
      ...(enabled !== undefined && { enabled })
    };

    // Re-detect type if URL changed and type wasn't explicitly set
    if (url && !type) {
      updated.type = detectSourceType(url);
    }

    sources[index] = updated;
    saveSources(sources);

    res.json({ success: true, source: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a source
router.delete('/sources/:id', async (req, res) => {
  try {
    const sources = loadSources();
    const index = sources.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Source not found' });
    }

    const removed = sources.splice(index, 1)[0];
    saveSources(sources);

    res.json({ success: true, source: removed });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper: detect source type from URL
function detectSourceType(url) {
  if (!url) return 'git';
  const lower = url.toLowerCase();
  if (lower.includes('gitlab')) return 'gitlab';
  if (lower.includes('github')) return 'github';
  return 'git';
}

// Get category counts
router.get('/categories', async (req, res) => {
  try {
    const counts = {};
    catalogItems.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    const installedCount = catalogItems.filter(i => i.installed).length;
    const updateCount = catalogItems.filter(i =>
      i.installed && i.installedVersion && i.version !== i.installedVersion
    ).length;

    res.json({
      success: true,
      categories: counts,
      installed: installedCount,
      updates: updateCount,
      total: catalogItems.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
