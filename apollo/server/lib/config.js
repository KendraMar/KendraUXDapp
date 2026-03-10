const path = require('path');
const fs = require('fs');

// Directory paths
const dataDir = path.join(__dirname, '..', '..', 'data');
const cacheDir = path.join(__dirname, '..', '..', 'cache');
const slackCacheDir = path.join(dataDir, 'cache', 'slack');
const confluenceCacheDir = path.join(dataDir, 'cache', 'confluence');
const gitlabCacheDir = path.join(dataDir, 'cache', 'gitlab');
const figmaCacheDir = path.join(dataDir, 'cache', 'figma');
const sharedDir = path.join(dataDir, 'shared');

// Ensure directories exist
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(slackCacheDir)) {
  fs.mkdirSync(slackCacheDir, { recursive: true });
}
if (!fs.existsSync(confluenceCacheDir)) {
  fs.mkdirSync(confluenceCacheDir, { recursive: true });
}
if (!fs.existsSync(gitlabCacheDir)) {
  fs.mkdirSync(gitlabCacheDir, { recursive: true });
}
if (!fs.existsSync(figmaCacheDir)) {
  fs.mkdirSync(figmaCacheDir, { recursive: true });
}
if (!fs.existsSync(sharedDir)) {
  fs.mkdirSync(sharedDir, { recursive: true });
}

// Ensure config.json exists - create from examples/config.example.json if not
const configFile = path.join(dataDir, 'config.json');
const examplesDir = path.join(__dirname, '..', '..', 'examples');
const configExampleFile = path.join(examplesDir, 'config.example.json');

if (!fs.existsSync(configFile)) {
  if (fs.existsSync(configExampleFile)) {
    fs.copyFileSync(configExampleFile, configFile);
    console.log('📋 Created data/config.json from examples/config.example.json');
    console.log('   Please update data/config.json with your API keys and credentials.');
  } else {
    // Create a minimal config if example doesn't exist either
    const defaultConfig = {
      jira: {
        url: '',
        token: '',
        username: ''
      },
      google: {
        clientId: '',
        clientSecret: '',
        refreshToken: ''
      },
      transcription: {
        apiUrl: '',
        model: ''
      }
    };
    fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2));
    console.log('📋 Created empty data/config.json');
    console.log('   Please update data/config.json with your API keys and credentials.');
  }
}

// Load configuration from data/config.json
function loadConfig() {
  try {
    if (fs.existsSync(configFile)) {
      return JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return {};
}

// Load Jira configuration
function loadJiraConfig() {
  const config = loadConfig();
  return config.jira || null;
}

// Load AI configuration
function loadAiConfig() {
  const config = loadConfig();
  return config.ai || null;
}

// Load Slack configuration
function loadSlackConfig() {
  const config = loadConfig();
  return config.slack || null;
}

// Load Google configuration
function loadGoogleConfig() {
  const config = loadConfig();
  return config.google || null;
}

// Load Transcription configuration
function loadTranscriptionConfig() {
  const config = loadConfig();
  return config.transcription || null;
}

// Load Confluence configuration
function loadConfluenceConfig() {
  const config = loadConfig();
  return config.confluence || null;
}

// Load Google Calendar configuration
function loadGoogleCalendarConfig() {
  const config = loadConfig();
  return config.googleCalendar || null;
}

// Load GitLab configuration
function loadGitLabConfig() {
  const config = loadConfig();
  return config.gitlab || null;
}

// Load Figma configuration
function loadFigmaConfig() {
  const config = loadConfig();
  return config.figma || null;
}

// Load Google Slides configuration (shares OAuth with Google Drive)
function loadGoogleSlidesConfig() {
  const config = loadConfig();
  return config.googleSlides || config.google || null;
}

// Load Home Assistant configuration
function loadHomeAssistantConfig() {
  const config = loadConfig();
  return config.homeAssistant || null;
}

// Load Apple Music configuration
function loadAppleMusicConfig() {
  const config = loadConfig();
  return config.appleMusic || null;
}

// Load Claude Code configuration
function loadClaudeCodeConfig() {
  const config = loadConfig();
  return config.claudeCode || null;
}

// Load Cursor CLI configuration
function loadCursorCliConfig() {
  const config = loadConfig();
  return config.cursorCli || null;
}

// Load Google Tasks configuration
function loadGoogleTasksConfig() {
  const config = loadConfig();
  return config.googleTasks || null;
}

// Load real-time speech-to-text configuration
function loadSpeechConfig() {
  const config = loadConfig();
  return config.speech || null;
}

module.exports = {
  dataDir,
  cacheDir,
  sharedDir,
  slackCacheDir,
  confluenceCacheDir,
  gitlabCacheDir,
  figmaCacheDir,
  loadConfig,
  loadJiraConfig,
  loadAiConfig,
  loadSlackConfig,
  loadGoogleConfig,
  loadTranscriptionConfig,
  loadConfluenceConfig,
  loadGoogleCalendarConfig,
  loadGitLabConfig,
  loadFigmaConfig,
  loadGoogleSlidesConfig,
  loadHomeAssistantConfig,
  loadAppleMusicConfig,
  loadClaudeCodeConfig,
  loadCursorCliConfig,
  loadGoogleTasksConfig,
  loadSpeechConfig
};

