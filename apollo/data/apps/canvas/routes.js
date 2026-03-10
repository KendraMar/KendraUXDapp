const express = require('express');
const path = require('path');
const fs = require('fs');
const { dataDir } = require('../../../server/lib/config');
const { listSharedArtifactDirs } = require('../../../server/lib/sharing');
const {
  hasHeroImage,
  getHeroPath,
  generateHeroFromHtml,
  generateHeroesBatch,
  isBatchRunning,
  setBatchRunning
} = require('../../../server/lib/heroService');

const router = express.Router();

// Canvas assets can include base64 images, so allow larger request bodies
router.use(express.json({ limit: '15mb' }));

const canvasDir = path.join(dataDir, 'canvas');

// Ensure directory exists
if (!fs.existsSync(canvasDir)) {
  fs.mkdirSync(canvasDir, { recursive: true });
}

// Load metadata for a canvas folder
function loadCanvasMetadata(folderId, baseDir) {
  const dir = baseDir || canvasDir;
  const folderPath = path.join(dir, folderId);
  
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return null;
  }
  
  const metadataPath = path.join(folderPath, 'metadata.json');
  const canvasPath = path.join(folderPath, 'canvas.json');
  
  // Check for canvas.json file
  if (!fs.existsSync(canvasPath)) {
    return null;
  }
  
  // Load metadata.json
  let metadata = {
    title: folderId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    description: '',
    createdAt: new Date().toISOString()
  };
  
  if (fs.existsSync(metadataPath)) {
    try {
      const loadedMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      metadata = { ...metadata, ...loadedMetadata };
    } catch (err) {
      console.error(`Error parsing metadata.json for ${folderId}:`, err);
    }
  }
  
  // Load canvas to get node count
  let nodeCount = 0;
  let edgeCount = 0;
  try {
    const canvasData = JSON.parse(fs.readFileSync(canvasPath, 'utf-8'));
    nodeCount = (canvasData.nodes || []).length;
    edgeCount = (canvasData.edges || []).length;
  } catch (err) {
    console.error(`Error parsing canvas.json for ${folderId}:`, err);
  }
  
  const stats = fs.statSync(canvasPath);
  
  return {
    id: folderId,
    ...metadata,
    nodeCount,
    edgeCount,
    hasHero: hasHeroImage(folderPath),
    modifiedAt: stats.mtime.toISOString()
  };
}

// List all canvases (local + shared)
router.get('/', (req, res) => {
  try {
    const entries = fs.readdirSync(canvasDir, { withFileTypes: true });
    
    const canvases = entries
      .filter(entry => entry.isDirectory())
      .map(entry => {
        try {
          const meta = loadCanvasMetadata(entry.name);
          if (meta) {
            meta.shared = false;
          }
          return meta;
        } catch (err) {
          console.error(`Error loading canvas ${entry.name}:`, err);
          return null;
        }
      })
      .filter(Boolean);

    // Load shared canvases from all connected repos
    try {
      const sharedDirs = listSharedArtifactDirs('canvas');
      for (const shared of sharedDirs) {
        try {
          const baseDir = path.dirname(shared.dirPath);
          const meta = loadCanvasMetadata(shared.id, baseDir);
          if (meta) {
            meta.shared = true;
            meta.repoId = shared.repoId;
            meta.repoName = shared.repoName;
            canvases.push(meta);
          }
        } catch (err) {
          console.error(`Error loading shared canvas ${shared.id}:`, err);
        }
      }
    } catch (err) {
      console.error('Error loading shared canvases:', err);
    }

    canvases.sort((a, b) => {
      const dateA = new Date(a.modifiedAt);
      const dateB = new Date(b.modifiedAt);
      return dateB - dateA;
    });
    
    res.json({ success: true, canvases });

    // Fire-and-forget: generate missing heroes in background
    const missing = canvases.filter(c => !c.hasHero && !c.shared);
    if (missing.length > 0 && !isBatchRunning('canvas')) {
      setBatchRunning('canvas', true);
      generateMissingCanvasHeroes(missing.map(c => c.id))
        .finally(() => setBatchRunning('canvas', false));
    }
  } catch (error) {
    console.error('Error listing canvases:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single canvas
router.get('/:id', (req, res) => {
  try {
    const metadata = loadCanvasMetadata(req.params.id);
    
    if (!metadata) {
      return res.status(404).json({ success: false, error: 'Canvas not found' });
    }
    
    // Load full canvas content
    const canvasPath = path.join(canvasDir, req.params.id, 'canvas.json');
    const canvasData = JSON.parse(fs.readFileSync(canvasPath, 'utf-8'));
    
    res.json({ 
      success: true, 
      canvas: {
        ...metadata,
        data: canvasData
      }
    });
  } catch (error) {
    console.error('Error getting canvas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new canvas
router.post('/', (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    
    // Create folder ID from name
    const folderId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const folderPath = path.join(canvasDir, folderId);
    
    if (fs.existsSync(folderPath)) {
      return res.status(400).json({ success: false, error: 'Canvas already exists' });
    }
    
    // Create folder and assets subfolder
    fs.mkdirSync(folderPath, { recursive: true });
    fs.mkdirSync(path.join(folderPath, 'assets'), { recursive: true });
    
    // Create metadata.json
    const metadata = {
      title: name,
      description: '',
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(
      path.join(folderPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    // Create empty canvas.json (JSON Canvas format)
    const canvasData = {
      nodes: [],
      edges: []
    };
    fs.writeFileSync(
      path.join(folderPath, 'canvas.json'),
      JSON.stringify(canvasData, null, 2)
    );
    
    res.json({ 
      success: true, 
      canvas: loadCanvasMetadata(folderId)
    });
  } catch (error) {
    console.error('Error creating canvas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update canvas data
router.put('/:id', (req, res) => {
  try {
    const { data } = req.body;
    const folderPath = path.join(canvasDir, req.params.id);
    const canvasPath = path.join(folderPath, 'canvas.json');
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Canvas not found' });
    }
    
    fs.writeFileSync(canvasPath, JSON.stringify(data, null, 2));
    
    const nodeCount = (data.nodes || []).length;
    const edgeCount = (data.edges || []).length;
    
    // Fire-and-forget hero regeneration
    generateCanvasHero(req.params.id).catch(() => {});
    
    res.json({ success: true, nodeCount, edgeCount });
  } catch (error) {
    console.error('Error updating canvas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update metadata
router.patch('/:id', (req, res) => {
  try {
    const folderPath = path.join(canvasDir, req.params.id);
    const metadataPath = path.join(folderPath, 'metadata.json');
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Canvas not found' });
    }
    
    let metadata = {};
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    }
    
    metadata = { ...metadata, ...req.body };
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    
    res.json({ success: true, metadata });
  } catch (error) {
    console.error('Error updating metadata:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete canvas
router.delete('/:id', (req, res) => {
  try {
    const folderPath = path.join(canvasDir, req.params.id);
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Canvas not found' });
    }
    
    // Recursive delete
    fs.rmSync(folderPath, { recursive: true, force: true });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting canvas:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// Hero Image Endpoints
// ============================================

// Helper: generate a visual preview of a canvas
function generateCanvasPreviewHtml(canvasData, title) {
  const nodes = canvasData.nodes || [];
  const edges = canvasData.edges || [];
  
  if (nodes.length === 0) return null;
  
  // Calculate bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes) {
    const x = node.x || 0;
    const y = node.y || 0;
    const w = node.width || 200;
    const h = node.height || 100;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }
  
  // Add padding
  const padding = 40;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;
  
  const canvasW = maxX - minX;
  const canvasH = maxY - minY;
  
  // Scale to fit 640x360
  const scale = Math.min(640 / canvasW, 360 / canvasH, 1);
  
  const nodeColors = {
    text: { bg: '#1a1a2e', border: '#3a3a5e', text: '#e0e0e0' },
    file: { bg: '#1a2e1a', border: '#3a5e3a', text: '#e0e0e0' },
    link: { bg: '#2e1a2e', border: '#5e3a5e', text: '#e0e0e0' },
    group: { bg: 'rgba(255,255,255,0.03)', border: '#333', text: '#999' },
    default: { bg: '#1e2a3a', border: '#3a5a7a', text: '#e0e0e0' }
  };
  
  let nodesHtml = '';
  for (const node of nodes) {
    const x = ((node.x || 0) - minX) * scale;
    const y = ((node.y || 0) - minY) * scale;
    const w = (node.width || 200) * scale;
    const h = (node.height || 100) * scale;
    const colors = nodeColors[node.type] || nodeColors.default;
    const label = (node.text || node.file || node.url || node.label || '').substring(0, 30);
    const fontSize = Math.max(8, Math.min(12, w / 15));
    
    nodesHtml += `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;
      background:${colors.bg};border:1px solid ${colors.border};border-radius:4px;
      overflow:hidden;padding:${Math.max(2, 4 * scale)}px;
      font-size:${fontSize}px;color:${colors.text};font-family:system-ui;">
      ${label ? `<span style="opacity:0.8">${label}</span>` : ''}
    </div>`;
  }
  
  // Draw edges as SVG lines
  let edgesSvg = '';
  for (const edge of edges) {
    const fromNode = nodes.find(n => n.id === edge.fromNode);
    const toNode = nodes.find(n => n.id === edge.toNode);
    if (!fromNode || !toNode) continue;
    
    const x1 = ((fromNode.x || 0) + (fromNode.width || 200) / 2 - minX) * scale;
    const y1 = ((fromNode.y || 0) + (fromNode.height || 100) / 2 - minY) * scale;
    const x2 = ((toNode.x || 0) + (toNode.width || 200) / 2 - minX) * scale;
    const y2 = ((toNode.y || 0) + (toNode.height || 100) / 2 - minY) * scale;
    
    edgesSvg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
      stroke="rgba(100,150,200,0.3)" stroke-width="1.5"/>`;
  }
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 640px; height: 360px; overflow: hidden; background: #0f1214; }
  .canvas-preview { position: relative; width: 640px; height: 360px; }
  .grid-overlay {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
    background-size: 20px 20px;
  }
  .nodes { position: absolute; top: 0; left: 0; }
  svg { position: absolute; top: 0; left: 0; }
</style>
</head><body>
<div class="canvas-preview">
  <div class="grid-overlay"></div>
  <svg width="640" height="360">${edgesSvg}</svg>
  <div class="nodes">${nodesHtml}</div>
</div>
</body></html>`;
}

// Helper: batch-generate heroes for multiple canvases (single browser)
async function generateMissingCanvasHeroes(canvasIds) {
  const items = [];

  for (const canvasId of canvasIds) {
    try {
      const folderPath = path.join(canvasDir, canvasId);
      const canvasPath = path.join(folderPath, 'canvas.json');
      const metadataPath = path.join(folderPath, 'metadata.json');

      if (!fs.existsSync(canvasPath)) continue;

      const canvasData = JSON.parse(fs.readFileSync(canvasPath, 'utf-8'));
      let title = canvasId;
      if (fs.existsSync(metadataPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
          title = meta.title || title;
        } catch (e) { /* use default */ }
      }

      const html = generateCanvasPreviewHtml(canvasData, title);
      if (html) {
        items.push({ artifactDir: folderPath, html });
      }
    } catch (err) {
      console.error(`[hero] Error preparing canvas hero for ${canvasId}:`, err.message);
    }
  }

  if (items.length > 0) {
    console.log(`[hero] Generating ${items.length} canvas hero image(s)...`);
    const result = await generateHeroesBatch(items, 640, 360);
    console.log(`[hero] Canvas heroes done: ${result.generated} generated, ${result.failed} failed`);
    return result;
  }
  return { generated: 0, failed: 0 };
}

async function generateCanvasHero(canvasId) {
  try {
    const folderPath = path.join(canvasDir, canvasId);
    const canvasPath = path.join(folderPath, 'canvas.json');
    const metadataPath = path.join(folderPath, 'metadata.json');
    
    if (!fs.existsSync(canvasPath)) return false;
    
    const canvasData = JSON.parse(fs.readFileSync(canvasPath, 'utf-8'));
    
    let title = canvasId;
    if (fs.existsSync(metadataPath)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        title = meta.title || title;
      } catch (e) { /* use default */ }
    }
    
    const html = generateCanvasPreviewHtml(canvasData, title);
    if (!html) return false;
    
    return await generateHeroFromHtml(folderPath, html, 640, 360);
  } catch (error) {
    console.error(`[hero] Failed to generate canvas hero for ${canvasId}:`, error.message);
    return false;
  }
}

// GET /api/canvas/:id/hero - Serve hero image
router.get('/:id/hero', (req, res) => {
  const folderPath = path.join(canvasDir, req.params.id);
  const heroPath = getHeroPath(folderPath);
  
  if (!fs.existsSync(heroPath)) {
    return res.status(404).json({ success: false, error: 'No hero image available' });
  }
  
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  fs.createReadStream(heroPath).pipe(res);
});

// POST /api/canvas/hero/generate-all - Generate heroes for all canvases missing them
router.post('/hero/generate-all', async (req, res) => {
  try {
    const entries = fs.readdirSync(canvasDir, { withFileTypes: true });
    const missingIds = entries
      .filter(e => e.isDirectory())
      .filter(e => {
        const heroPath = path.join(canvasDir, e.name, 'hero.png');
        return !fs.existsSync(heroPath) && fs.existsSync(path.join(canvasDir, e.name, 'canvas.json'));
      })
      .map(e => e.name);

    if (missingIds.length === 0) {
      return res.json({ success: true, message: 'All canvases already have heroes', generated: 0 });
    }

    const result = await generateMissingCanvasHeroes(missingIds);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in bulk hero generation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/canvas/:id/hero/generate - Generate hero image on demand
router.post('/:id/hero/generate', async (req, res) => {
  try {
    const folderPath = path.join(canvasDir, req.params.id);
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Canvas not found' });
    }
    
    const success = await generateCanvasHero(req.params.id);
    
    res.json({
      success,
      message: success ? 'Hero image generated' : 'Failed to generate hero image',
      heroUrl: success ? `/api/canvas/${req.params.id}/hero` : null
    });
  } catch (error) {
    console.error('Error generating hero:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload asset to canvas (using base64 encoded data)
router.post('/:id/assets', (req, res) => {
  try {
    const { filename, data, mimetype } = req.body;
    
    if (!data) {
      return res.status(400).json({ success: false, error: 'No file data provided' });
    }
    
    // Validate mime type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (mimetype && !allowedTypes.includes(mimetype)) {
      return res.status(400).json({ success: false, error: 'Only image files are allowed' });
    }
    
    const folderPath = path.join(canvasDir, req.params.id);
    const assetsPath = path.join(folderPath, 'assets');
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Canvas not found' });
    }
    
    // Ensure assets folder exists
    if (!fs.existsSync(assetsPath)) {
      fs.mkdirSync(assetsPath, { recursive: true });
    }
    
    // Generate unique filename
    const originalName = filename || 'image';
    const ext = path.extname(originalName) || getExtensionFromMimeType(mimetype);
    const basename = path.basename(originalName, ext).replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const uniqueFilename = `${basename}-${Date.now()}${ext}`;
    const filePath = path.join(assetsPath, uniqueFilename);
    
    // Decode base64 and write file
    // Remove data URL prefix if present (e.g., "data:image/png;base64,")
    const base64Data = data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Check file size (10MB limit)
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'File too large (max 10MB)' });
    }
    
    fs.writeFileSync(filePath, buffer);
    
    const assetUrl = `/api/canvas/${req.params.id}/assets/${uniqueFilename}`;
    
    res.json({ 
      success: true, 
      asset: {
        filename: uniqueFilename,
        url: assetUrl,
        size: buffer.length,
        mimetype: mimetype || 'application/octet-stream'
      }
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper to get file extension from mime type
function getExtensionFromMimeType(mimetype) {
  const mimeToExt = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg'
  };
  return mimeToExt[mimetype] || '.png';
}

// Serve canvas assets
router.get('/:id/assets/:filename', (req, res) => {
  try {
    const { id, filename } = req.params;
    const filePath = path.join(canvasDir, id, 'assets', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }
    
    // Set content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Error serving asset:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List assets for a canvas
router.get('/:id/assets', (req, res) => {
  try {
    const assetsPath = path.join(canvasDir, req.params.id, 'assets');
    
    if (!fs.existsSync(assetsPath)) {
      return res.json({ success: true, assets: [] });
    }
    
    const files = fs.readdirSync(assetsPath);
    const assets = files.map(filename => {
      const filePath = path.join(assetsPath, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        url: `/api/canvas/${req.params.id}/assets/${filename}`,
        size: stats.size,
        modifiedAt: stats.mtime.toISOString()
      };
    });
    
    res.json({ success: true, assets });
  } catch (error) {
    console.error('Error listing assets:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
