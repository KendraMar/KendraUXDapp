const express = require('express');
const path = require('path');
const fs = require('fs');
const { loadConfig } = require('../lib/config');

const router = express.Router();

// API endpoint for getting integrations configuration
router.get('/integrations', (req, res) => {
  try {
    const config = loadConfig();
    // Return config without exposing full tokens (mask them for security)
    const safeConfig = {
      jira: config.jira ? {
        url: config.jira.url || '',
        username: config.jira.username || '',
        token: config.jira.token ? '••••••••' : '',
        hasToken: !!config.jira.token
      } : { url: '', username: '', token: '', hasToken: false },
      ai: config.ai ? {
        apiUrl: config.ai.apiUrl || '',
        model: config.ai.model || '',
      } : { apiUrl: '', model: '' },
      slack: config.slack ? {
        hasXoxcToken: !!config.slack.xoxcToken,
        hasXoxdToken: !!config.slack.xoxdToken
      } : { hasXoxcToken: false, hasXoxdToken: false },
      google: config.google ? {
        hasClientId: !!config.google.clientId,
        hasClientSecret: !!config.google.clientSecret,
        hasRefreshToken: !!config.google.refreshToken
      } : { hasClientId: false, hasClientSecret: false, hasRefreshToken: false },
      transcription: config.transcription ? {
        useBuiltIn: config.transcription.useBuiltIn !== false, // Default to true
        apiUrl: config.transcription.apiUrl || '',
        model: config.transcription.model || '',
      } : { useBuiltIn: true, apiUrl: '', model: '' },
      confluence: config.confluence ? {
        url: config.confluence.url || '',
        username: config.confluence.username || '',
        token: config.confluence.token ? '••••••••' : '',
        hasToken: !!config.confluence.token
      } : { url: '', username: '', token: '', hasToken: false },
      googleCalendar: config.googleCalendar ? {
        hasClientId: !!config.googleCalendar.clientId,
        hasClientSecret: !!config.googleCalendar.clientSecret,
        hasRefreshToken: !!config.googleCalendar.refreshToken
      } : { hasClientId: false, hasClientSecret: false, hasRefreshToken: false },
      googleTasks: config.googleTasks ? {
        hasClientId: !!config.googleTasks.clientId,
        hasClientSecret: !!config.googleTasks.clientSecret,
        hasRefreshToken: !!config.googleTasks.refreshToken
      } : { hasClientId: false, hasClientSecret: false, hasRefreshToken: false },
      gitlab: config.gitlab ? {
        url: config.gitlab.url || '',
        token: config.gitlab.token ? '••••••••' : '',
        hasToken: !!config.gitlab.token
      } : { url: '', token: '', hasToken: false },
      figma: config.figma ? {
        token: config.figma.token ? '••••••••' : '',
        hasToken: !!config.figma.token,
        teamIds: config.figma.teamIds || ''
      } : { token: '', hasToken: false, teamIds: '' },
      homeAssistant: config.homeAssistant ? {
        url: config.homeAssistant.url || '',
        token: config.homeAssistant.token ? '••••••••' : '',
        hasToken: !!config.homeAssistant.token
      } : { url: '', token: '', hasToken: false },
      ambientAi: config.ambientAi ? {
        apiUrl: config.ambientAi.apiUrl || '',
        projectName: config.ambientAi.projectName || '',
        hasAccessKey: !!config.ambientAi.accessKey
      } : { apiUrl: '', projectName: '', hasAccessKey: false },
      appleMusic: config.appleMusic ? {
        hasDeveloperToken: !!config.appleMusic.developerToken,
        hasMediaUserToken: !!config.appleMusic.mediaUserToken
      } : { hasDeveloperToken: false, hasMediaUserToken: false },
      claudeCode: config.claudeCode ? {
        authType: config.claudeCode.authType || 'apiKey',
        hasApiKey: !!config.claudeCode.apiKey,
        vertexProjectId: config.claudeCode.vertexProjectId || '',
        vertexRegion: config.claudeCode.vertexRegion || '',
        model: config.claudeCode.model || ''
      } : { authType: 'apiKey', hasApiKey: false, vertexProjectId: '', vertexRegion: '', model: '' },
      cursorCli: config.cursorCli ? {
        enabled: config.cursorCli.enabled || false,
        defaultModel: config.cursorCli.defaultModel || 'claude-4.5-sonnet'
      } : { enabled: false, defaultModel: 'claude-4.5-sonnet' },
      librechat: config.librechat ? {
        url: config.librechat.url || 'http://localhost:3080',
        enabled: config.librechat.enabled !== false
      } : { url: 'http://localhost:3080', enabled: true },
      kagi: config.kagi ? {
        hasApiKey: !!config.kagi.apiKey
      } : { hasApiKey: false }
    };
    res.json({ success: true, config: safeConfig });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint for updating integrations configuration
router.put('/integrations', (req, res) => {
  const configFile = path.join(__dirname, '..', '..', 'data', 'config.json');
  
  try {
    // Load existing config
    let config = {};
    if (fs.existsSync(configFile)) {
      config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    }

    const updates = req.body;

    // Update Jira config if provided
    if (updates.jira) {
      config.jira = config.jira || {};
      if (updates.jira.url !== undefined) config.jira.url = updates.jira.url;
      if (updates.jira.username !== undefined) config.jira.username = updates.jira.username;
      // Only update token if a new one is provided (not the masked placeholder)
      if (updates.jira.token && updates.jira.token !== '••••••••') {
        config.jira.token = updates.jira.token;
      }
    }

    // Update AI config if provided
    if (updates.ai) {
      config.ai = config.ai || {};
      if (updates.ai.apiUrl !== undefined) config.ai.apiUrl = updates.ai.apiUrl;
      if (updates.ai.model !== undefined) config.ai.model = updates.ai.model;
    }

    // Update Slack config if provided
    if (updates.slack) {
      config.slack = config.slack || {};
      // Only update tokens if new ones are provided
      if (updates.slack.xoxcToken && updates.slack.xoxcToken !== '••••••••') {
        config.slack.xoxcToken = updates.slack.xoxcToken;
      }
      if (updates.slack.xoxdToken && updates.slack.xoxdToken !== '••••••••') {
        config.slack.xoxdToken = updates.slack.xoxdToken;
      }
    }

    // Update Google config if provided
    if (updates.google) {
      config.google = config.google || {};
      // Only update credentials if new ones are provided
      if (updates.google.clientId && updates.google.clientId !== '••••••••') {
        config.google.clientId = updates.google.clientId;
      }
      if (updates.google.clientSecret && updates.google.clientSecret !== '••••••••') {
        config.google.clientSecret = updates.google.clientSecret;
      }
      if (updates.google.refreshToken && updates.google.refreshToken !== '••••••••') {
        config.google.refreshToken = updates.google.refreshToken;
      }
    }

    // Update Transcription config if provided
    if (updates.transcription) {
      config.transcription = config.transcription || {};
      if (updates.transcription.useBuiltIn !== undefined) config.transcription.useBuiltIn = updates.transcription.useBuiltIn;
      if (updates.transcription.apiUrl !== undefined) config.transcription.apiUrl = updates.transcription.apiUrl;
      if (updates.transcription.model !== undefined) config.transcription.model = updates.transcription.model;
    }

    // Update Confluence config if provided
    if (updates.confluence) {
      config.confluence = config.confluence || {};
      if (updates.confluence.url !== undefined) config.confluence.url = updates.confluence.url;
      if (updates.confluence.username !== undefined) config.confluence.username = updates.confluence.username;
      // Only update token if a new one is provided (not the masked placeholder)
      if (updates.confluence.token && updates.confluence.token !== '••••••••') {
        config.confluence.token = updates.confluence.token;
      }
    }

    // Update Google Calendar config if provided
    if (updates.googleCalendar) {
      config.googleCalendar = config.googleCalendar || {};
      // Only update credentials if new ones are provided
      if (updates.googleCalendar.clientId && updates.googleCalendar.clientId !== '••••••••') {
        config.googleCalendar.clientId = updates.googleCalendar.clientId;
      }
      if (updates.googleCalendar.clientSecret && updates.googleCalendar.clientSecret !== '••••••••') {
        config.googleCalendar.clientSecret = updates.googleCalendar.clientSecret;
      }
      if (updates.googleCalendar.refreshToken && updates.googleCalendar.refreshToken !== '••••••••') {
        config.googleCalendar.refreshToken = updates.googleCalendar.refreshToken;
      }
    }

    // Update Google Tasks config if provided
    if (updates.googleTasks) {
      config.googleTasks = config.googleTasks || {};
      // Only update credentials if new ones are provided
      if (updates.googleTasks.clientId && updates.googleTasks.clientId !== '••••••••') {
        config.googleTasks.clientId = updates.googleTasks.clientId;
      }
      if (updates.googleTasks.clientSecret && updates.googleTasks.clientSecret !== '••••••••') {
        config.googleTasks.clientSecret = updates.googleTasks.clientSecret;
      }
      if (updates.googleTasks.refreshToken && updates.googleTasks.refreshToken !== '••••••••') {
        config.googleTasks.refreshToken = updates.googleTasks.refreshToken;
      }
    }

    // Update GitLab config if provided
    if (updates.gitlab) {
      config.gitlab = config.gitlab || {};
      if (updates.gitlab.url !== undefined) config.gitlab.url = updates.gitlab.url;
      // Only update token if a new one is provided (not the masked placeholder)
      if (updates.gitlab.token && updates.gitlab.token !== '••••••••') {
        config.gitlab.token = updates.gitlab.token;
      }
    }

    // Update Figma config if provided
    if (updates.figma) {
      config.figma = config.figma || {};
      // Only update token if a new one is provided (not the masked placeholder)
      if (updates.figma.token && updates.figma.token !== '••••••••') {
        config.figma.token = updates.figma.token;
      }
      if (updates.figma.teamIds !== undefined) {
        config.figma.teamIds = updates.figma.teamIds;
      }
    }

    // Update Home Assistant config if provided
    if (updates.homeAssistant) {
      config.homeAssistant = config.homeAssistant || {};
      if (updates.homeAssistant.url !== undefined) config.homeAssistant.url = updates.homeAssistant.url;
      // Only update token if a new one is provided (not the masked placeholder)
      if (updates.homeAssistant.token && updates.homeAssistant.token !== '••••••••') {
        config.homeAssistant.token = updates.homeAssistant.token;
      }
    }

    // Update Ambient AI config if provided
    if (updates.ambientAi) {
      config.ambientAi = config.ambientAi || {};
      if (updates.ambientAi.apiUrl !== undefined) config.ambientAi.apiUrl = updates.ambientAi.apiUrl;
      if (updates.ambientAi.projectName !== undefined) config.ambientAi.projectName = updates.ambientAi.projectName;
      // Only update access key if a new one is provided (not the masked placeholder)
      if (updates.ambientAi.accessKey && updates.ambientAi.accessKey !== '••••••••') {
        config.ambientAi.accessKey = updates.ambientAi.accessKey;
      }
    }

    // Update Apple Music config if provided
    if (updates.appleMusic) {
      config.appleMusic = config.appleMusic || {};
      // Only update tokens if new ones are provided (not the masked placeholder)
      if (updates.appleMusic.developerToken && updates.appleMusic.developerToken !== '••••••••') {
        config.appleMusic.developerToken = updates.appleMusic.developerToken;
      }
      if (updates.appleMusic.mediaUserToken && updates.appleMusic.mediaUserToken !== '••••••••') {
        config.appleMusic.mediaUserToken = updates.appleMusic.mediaUserToken;
      }
    }

    // Update Claude Code config if provided
    if (updates.claudeCode) {
      config.claudeCode = config.claudeCode || {};
      if (updates.claudeCode.authType !== undefined) config.claudeCode.authType = updates.claudeCode.authType;
      if (updates.claudeCode.vertexProjectId !== undefined) config.claudeCode.vertexProjectId = updates.claudeCode.vertexProjectId;
      if (updates.claudeCode.vertexRegion !== undefined) config.claudeCode.vertexRegion = updates.claudeCode.vertexRegion;
      if (updates.claudeCode.model !== undefined) config.claudeCode.model = updates.claudeCode.model;
      // Only update API key if a new one is provided (not the masked placeholder)
      if (updates.claudeCode.apiKey && updates.claudeCode.apiKey !== '••••••••') {
        config.claudeCode.apiKey = updates.claudeCode.apiKey;
      }
    }

    // Update Cursor CLI config if provided
    if (updates.cursorCli) {
      config.cursorCli = config.cursorCli || {};
      if (updates.cursorCli.enabled !== undefined) config.cursorCli.enabled = updates.cursorCli.enabled;
      if (updates.cursorCli.defaultModel !== undefined) config.cursorCli.defaultModel = updates.cursorCli.defaultModel;
    }

    // Update Kagi config if provided
    if (updates.kagi) {
      config.kagi = config.kagi || {};
      // Only update API key if a new one is provided (not the masked placeholder)
      if (updates.kagi.apiKey && updates.kagi.apiKey !== '••••••••') {
        config.kagi.apiKey = updates.kagi.apiKey;
      }
    }

    // Update LibreChat config if provided
    if (updates.librechat) {
      config.librechat = config.librechat || {};
      if (updates.librechat.url !== undefined) config.librechat.url = updates.librechat.url;
      if (updates.librechat.enabled !== undefined) config.librechat.enabled = updates.librechat.enabled;
    }

    // Write updated config
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    res.json({ success: true, message: 'Configuration updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get LibreChat specific config
router.get('/librechat', (req, res) => {
  try {
    const config = loadConfig();
    res.json({
      url: config.librechat?.url || 'http://localhost:3080',
      enabled: config.librechat?.enabled !== false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update LibreChat specific config
router.put('/librechat', (req, res) => {
  const configFile = path.join(__dirname, '..', '..', 'data', 'config.json');
  
  try {
    let config = {};
    if (fs.existsSync(configFile)) {
      config = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
    }
    
    const { url, enabled } = req.body;
    config.librechat = {
      url: url || config.librechat?.url || 'http://localhost:3080',
      enabled: enabled !== undefined ? enabled : true
    };
    
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
    res.json({ success: true, config: config.librechat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

