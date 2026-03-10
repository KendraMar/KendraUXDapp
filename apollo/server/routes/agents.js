const express = require('express');
const path = require('path');
const fs = require('fs');
const { dataDir } = require('../lib/config');

const router = express.Router();

// Directories
const templatesDir = path.join(__dirname, '..', '..', 'templates', 'agents');
const enabledAgentsDir = path.join(dataDir, 'agents');

// Ensure the enabled agents directory exists
const ensureAgentsDir = () => {
  if (!fs.existsSync(enabledAgentsDir)) {
    fs.mkdirSync(enabledAgentsDir, { recursive: true });
  }
};

// Parse frontmatter from markdown file
const parseFrontmatter = (content) => {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { metadata: {}, body: content };
  }
  
  const frontmatterLines = match[1].split('\n');
  const metadata = {};
  
  frontmatterLines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      metadata[key] = value;
    }
  });
  
  return { metadata, body: match[2].trim() };
};

// Read agent data from a directory
const readAgentFromDir = (agentDir, id) => {
  const agentJsonPath = path.join(agentDir, 'agent.json');
  const promptPath = path.join(agentDir, 'prompt.md');
  const avatarPath = path.join(agentDir, 'avatar.svg');
  
  if (!fs.existsSync(agentJsonPath)) {
    return null;
  }
  
  const agentConfig = JSON.parse(fs.readFileSync(agentJsonPath, 'utf-8'));
  
  let name = id;
  let description = '';
  let tools = '';
  let systemPrompt = '';
  
  if (fs.existsSync(promptPath)) {
    const promptContent = fs.readFileSync(promptPath, 'utf-8');
    const { metadata, body } = parseFrontmatter(promptContent);
    name = metadata.name || id;
    description = metadata.description || '';
    tools = metadata.tools || '';
    systemPrompt = body;
  }
  
  const hasAvatar = fs.existsSync(avatarPath);
  
  return {
    id: agentConfig.id || id,
    name,
    description,
    tools,
    color: agentConfig.color || '#8B5CF6',
    enabledIntegrations: agentConfig.enabledIntegrations || [],
    toolsConfig: agentConfig.tools || {},
    systemPrompt,
    hasAvatar,
    avatarUrl: hasAvatar ? `/api/agents/${agentConfig.id || id}/avatar` : null
  };
};

// GET /api/agents/templates - List all available agent templates
router.get('/templates', (req, res) => {
  try {
    if (!fs.existsSync(templatesDir)) {
      return res.json({ success: true, templates: [] });
    }
    
    const agentDirs = fs.readdirSync(templatesDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    const templates = agentDirs
      .map(id => {
        const agentDir = path.join(templatesDir, id);
        const agent = readAgentFromDir(agentDir, id);
        if (agent) {
          // For templates, use template avatar URL
          agent.avatarUrl = `/api/agents/templates/${id}/avatar`;
        }
        return agent;
      })
      .filter(agent => agent !== null);
    
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error listing agent templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agents/templates/:id/avatar - Get template avatar
router.get('/templates/:id/avatar', (req, res) => {
  try {
    const { id } = req.params;
    const avatarPath = path.join(templatesDir, id, 'avatar.svg');
    
    if (!fs.existsSync(avatarPath)) {
      return res.status(404).json({ success: false, error: 'Avatar not found' });
    }
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(avatarPath);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agents - List enabled agents
router.get('/', (req, res) => {
  try {
    ensureAgentsDir();
    
    if (!fs.existsSync(enabledAgentsDir)) {
      return res.json({ success: true, agents: [] });
    }
    
    const agentDirs = fs.readdirSync(enabledAgentsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    const agents = agentDirs
      .map(id => {
        const agentDir = path.join(enabledAgentsDir, id);
        return readAgentFromDir(agentDir, id);
      })
      .filter(agent => agent !== null);
    
    res.json({ success: true, agents });
  } catch (error) {
    console.error('Error listing enabled agents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agents/:id - Get single enabled agent
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const agentDir = path.join(enabledAgentsDir, id);
    
    if (!fs.existsSync(agentDir)) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    
    const agent = readAgentFromDir(agentDir, id);
    
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    
    res.json({ success: true, agent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/agents/:id/avatar - Get enabled agent avatar
router.get('/:id/avatar', (req, res) => {
  try {
    const { id } = req.params;
    const avatarPath = path.join(enabledAgentsDir, id, 'avatar.svg');
    
    if (!fs.existsSync(avatarPath)) {
      return res.status(404).json({ success: false, error: 'Avatar not found' });
    }
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(avatarPath);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agents/:id/enable - Enable an agent (copy from templates)
router.post('/:id/enable', (req, res) => {
  try {
    const { id } = req.params;
    const templateDir = path.join(templatesDir, id);
    const targetDir = path.join(enabledAgentsDir, id);
    
    if (!fs.existsSync(templateDir)) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    ensureAgentsDir();
    
    // Check if already enabled
    if (fs.existsSync(targetDir)) {
      return res.status(400).json({ success: false, error: 'Agent already enabled' });
    }
    
    // Create target directory
    fs.mkdirSync(targetDir, { recursive: true });
    
    // Copy all files from template to target
    const files = fs.readdirSync(templateDir);
    files.forEach(file => {
      const srcPath = path.join(templateDir, file);
      const destPath = path.join(targetDir, file);
      fs.copyFileSync(srcPath, destPath);
    });
    
    const agent = readAgentFromDir(targetDir, id);
    
    res.json({ success: true, agent });
  } catch (error) {
    console.error('Error enabling agent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/agents/:id/disable - Disable an agent (remove from data)
router.post('/:id/disable', (req, res) => {
  try {
    const { id } = req.params;
    const agentDir = path.join(enabledAgentsDir, id);
    
    if (!fs.existsSync(agentDir)) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    
    // Remove the agent directory
    fs.rmSync(agentDir, { recursive: true, force: true });
    
    res.json({ success: true, message: `Agent ${id} disabled` });
  } catch (error) {
    console.error('Error disabling agent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/agents/:id - Update enabled agent config
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const agentDir = path.join(enabledAgentsDir, id);
    
    if (!fs.existsSync(agentDir)) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    
    const { name, description, tools, systemPrompt, color, enabledIntegrations, toolsConfig } = req.body;
    
    // Update agent.json
    const agentJsonPath = path.join(agentDir, 'agent.json');
    const agentConfig = JSON.parse(fs.readFileSync(agentJsonPath, 'utf-8'));
    
    if (color !== undefined) agentConfig.color = color;
    if (enabledIntegrations !== undefined) agentConfig.enabledIntegrations = enabledIntegrations;
    if (toolsConfig !== undefined) agentConfig.tools = toolsConfig;
    
    fs.writeFileSync(agentJsonPath, JSON.stringify(agentConfig, null, 2));
    
    // Update prompt.md if any prompt-related fields changed
    if (name !== undefined || description !== undefined || tools !== undefined || systemPrompt !== undefined) {
      const promptPath = path.join(agentDir, 'prompt.md');
      let currentName = name;
      let currentDescription = description;
      let currentTools = tools;
      let currentBody = systemPrompt;
      
      // Read current values if not all are provided
      if (fs.existsSync(promptPath)) {
        const promptContent = fs.readFileSync(promptPath, 'utf-8');
        const { metadata, body } = parseFrontmatter(promptContent);
        if (currentName === undefined) currentName = metadata.name || id;
        if (currentDescription === undefined) currentDescription = metadata.description || '';
        if (currentTools === undefined) currentTools = metadata.tools || '';
        if (currentBody === undefined) currentBody = body;
      }
      
      // Write updated prompt.md
      const newPromptContent = `---
name: ${currentName}
description: ${currentDescription}
tools: ${currentTools}
---

${currentBody}
`;
      fs.writeFileSync(promptPath, newPromptContent);
    }
    
    const agent = readAgentFromDir(agentDir, id);
    
    res.json({ success: true, agent });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
