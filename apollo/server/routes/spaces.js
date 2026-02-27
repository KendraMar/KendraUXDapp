const express = require('express');
const path = require('path');
const fs = require('fs');
const { dataDir } = require('../lib/config');

const router = express.Router();

const getSpacesFile = () => path.join(dataDir, 'spaces.json');
const examplesDir = path.join(__dirname, '..', '..', 'examples');
const getExampleSpacesFile = () => path.join(examplesDir, 'spaces.example.json');

const readSpaces = () => {
  const file = getSpacesFile();
  const exampleFile = getExampleSpacesFile();
  
  // If spaces.json doesn't exist but the example does, copy from example
  if (!fs.existsSync(file) && fs.existsSync(exampleFile)) {
    const exampleData = fs.readFileSync(exampleFile, 'utf-8');
    fs.writeFileSync(file, exampleData);
    return JSON.parse(exampleData);
  }
  
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  }
  
  return { activeSpaceId: 'default', spaces: [] };
};

const writeSpaces = (data) => {
  const file = getSpacesFile();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Get all spaces
router.get('/', (req, res) => {
  try {
    const data = readSpaces();
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active space
router.get('/active', (req, res) => {
  try {
    const data = readSpaces();
    const activeSpace = data.spaces.find(s => s.id === data.activeSpaceId);
    res.json(activeSpace || data.spaces[0]);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active space context (sources grouped by type, for contextual filtering)
router.get('/active/context', (req, res) => {
  try {
    const data = readSpaces();
    const activeSpace = data.spaces.find(s => s.id === data.activeSpaceId) || data.spaces[0];
    
    if (!activeSpace) {
      return res.json({ success: true, spaceId: null, sources: [], sourcesByType: {} });
    }
    
    const sources = activeSpace.sources || [];
    
    // Group sources by type for easy consumption
    const sourcesByType = sources.reduce((acc, source) => {
      const type = source.type || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(source);
      return acc;
    }, {});
    
    res.json({
      success: true,
      spaceId: activeSpace.id,
      spaceName: activeSpace.name,
      sources,
      sourcesByType
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Set active space
router.put('/active', (req, res) => {
  try {
    const { spaceId } = req.body;
    const data = readSpaces();
    
    if (!data.spaces.find(s => s.id === spaceId)) {
      return res.status(404).json({ success: false, error: 'Space not found' });
    }
    
    data.activeSpaceId = spaceId;
    writeSpaces(data);
    res.json({ success: true, activeSpaceId: spaceId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create a new space
router.post('/', (req, res) => {
  try {
    const { name, emoji, description, items } = req.body;
    const data = readSpaces();
    
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const newSpace = {
      id,
      name,
      emoji: emoji || '📁',
      description: description || '',
      items: items || []
    };
    
    data.spaces.push(newSpace);
    writeSpaces(data);
    
    res.json({ success: true, space: newSpace });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reorder spaces (must be before /:spaceId to avoid matching 'reorder' as a spaceId)
router.put('/reorder', (req, res) => {
  try {
    const { spaceIds } = req.body;
    const data = readSpaces();
    
    if (!Array.isArray(spaceIds)) {
      return res.status(400).json({ success: false, error: 'spaceIds must be an array' });
    }
    
    // Validate all space IDs exist
    const existingIds = new Set(data.spaces.map(s => s.id));
    for (const id of spaceIds) {
      if (!existingIds.has(id)) {
        return res.status(400).json({ success: false, error: `Space "${id}" not found` });
      }
    }
    
    // Reorder spaces according to the provided order
    const spaceMap = new Map(data.spaces.map(s => [s.id, s]));
    data.spaces = spaceIds.map(id => spaceMap.get(id));
    
    writeSpaces(data);
    res.json({ success: true, spaces: data.spaces });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a space
router.put('/:spaceId', (req, res) => {
  try {
    const { spaceId } = req.params;
    const updates = req.body;
    const data = readSpaces();
    
    const spaceIndex = data.spaces.findIndex(s => s.id === spaceId);
    if (spaceIndex === -1) {
      return res.status(404).json({ success: false, error: 'Space not found' });
    }
    
    data.spaces[spaceIndex] = { ...data.spaces[spaceIndex], ...updates };
    writeSpaces(data);
    
    res.json({ success: true, space: data.spaces[spaceIndex] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a space
router.delete('/:spaceId', (req, res) => {
  try {
    const { spaceId } = req.params;
    const data = readSpaces();
    
    if (spaceId === 'default') {
      return res.status(400).json({ success: false, error: 'Cannot delete default space' });
    }
    
    const spaceIndex = data.spaces.findIndex(s => s.id === spaceId);
    if (spaceIndex === -1) {
      return res.status(404).json({ success: false, error: 'Space not found' });
    }
    
    data.spaces.splice(spaceIndex, 1);
    
    // If deleted space was active, switch to default
    if (data.activeSpaceId === spaceId) {
      data.activeSpaceId = 'default';
    }
    
    writeSpaces(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI-assisted item generation for a space
router.post('/generate-items', async (req, res) => {
  try {
    const { description } = req.body;
    
    // This would call an AI service to suggest nav items based on the description
    // For now, we'll return a basic set of suggested items
    const suggestedItems = generateSuggestedItems(description);
    
    res.json({ success: true, items: suggestedItems });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to generate suggested items based on description
function generateSuggestedItems(description) {
  const lowerDesc = description.toLowerCase();
  const items = [];
  
  // Basic keyword matching for demo purposes
  // In production, this would call an AI model
  const mappings = [
    { keywords: ['research', 'study', 'learn', 'discover'], item: { id: 'research', path: '/research', displayName: 'Research', icon: 'BookIcon' }},
    { keywords: ['design', 'visual', 'ui', 'ux'], item: { id: 'designs', path: '/designs', displayName: 'Designs', icon: 'PaintBrushIcon' }},
    { keywords: ['task', 'todo', 'work', 'project'], item: { id: 'tasks', path: '/tasks', displayName: 'Tasks', icon: 'ListIcon' }},
    { keywords: ['chat', 'communicate', 'message', 'discuss'], item: { id: 'chat', path: '/chat', displayName: 'Chat', icon: 'CommentsIcon' }},
    { keywords: ['record', 'video', 'meeting', 'call'], item: { id: 'recordings', path: '/recordings', displayName: 'Recordings', icon: 'VideoIcon' }},
    { keywords: ['component', 'build', 'develop', 'code'], item: { id: 'components', path: '/components', displayName: 'Components', icon: 'CubesIcon' }},
    { keywords: ['artifact', 'file', 'document', 'asset'], item: { id: 'artifacts', path: '/artifacts', displayName: 'Artifacts', icon: 'ArchiveIcon' }},
    { keywords: ['slide', 'present', 'deck', 'presentation'], item: { id: 'slides', path: '/slides', displayName: 'Slides', icon: 'ScreenIcon' }},
    { keywords: ['canvas', 'diagram', 'flow', 'whiteboard'], item: { id: 'canvas', path: '/canvas', displayName: 'Canvas', icon: 'TopologyIcon' }},
    { keywords: ['slack', 'team', 'channel'], item: { id: 'slack', path: '/slack', displayName: 'Slack', icon: 'SlackHashIcon' }},
    { keywords: ['rss', 'feed', 'news', 'blog', 'subscribe', 'reader'], item: { id: 'rss', path: '/rss', displayName: 'RSS', icon: 'RssIcon' }},
  ];
  
  mappings.forEach((mapping, index) => {
    if (mapping.keywords.some(keyword => lowerDesc.includes(keyword))) {
      items.push({ ...mapping.item, order: items.length });
    }
  });
  
  // Always include dashboard if nothing matched
  if (items.length === 0) {
    items.push({ id: 'dashboard', path: '/dashboard', displayName: 'Dashboard', icon: 'TachometerAltIcon', order: 0 });
  }
  
  return items;
}

module.exports = router;
