const express = require('express');
const router = express.Router();

// High-DPI screenshot captures can be large
router.use(express.json({ limit: '50mb' }));

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Screenshots data directory
const DATA_DIR = path.join(__dirname, '../../data/screenshots');

// Ensure screenshots directory exists
const ensureDir = async () => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
};

// Generate screenshot ID
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 8);
  return `${timestamp}-${random}`;
};

// Format date for filesystem-safe filename
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}_${mins}_${secs}_${ms}`;
};

// GET /api/screenshots - List all screenshots
router.get('/', async (req, res) => {
  try {
    await ensureDir();
    
    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
    const screenshots = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        try {
          const metadataPath = path.join(DATA_DIR, entry.name, 'metadata.json');
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          
          // Include thumbnail URL
          metadata.thumbnailUrl = `/api/screenshots/${metadata.id}/image`;
          screenshots.push(metadata);
        } catch (err) {
          // Skip directories without valid metadata
          console.warn(`Skipping invalid screenshot directory: ${entry.name}`);
        }
      }
    }
    
    // Sort by date (newest first)
    screenshots.sort((a, b) => new Date(b.dateTaken) - new Date(a.dateTaken));
    
    res.json({ success: true, screenshots });
  } catch (error) {
    console.error('Error listing screenshots:', error);
    res.status(500).json({ success: false, error: 'Failed to list screenshots' });
  }
});

// GET /api/screenshots/:id - Get single screenshot metadata
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const screenshotDir = path.join(DATA_DIR, id);
    const metadataPath = path.join(screenshotDir, 'metadata.json');
    
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    metadata.imageUrl = `/api/screenshots/${id}/image`;
    
    res.json({ success: true, screenshot: metadata });
  } catch (error) {
    console.error('Error fetching screenshot:', error);
    res.status(404).json({ success: false, error: 'Screenshot not found' });
  }
});

// GET /api/screenshots/:id/image - Get screenshot image
router.get('/:id/image', async (req, res) => {
  try {
    const { id } = req.params;
    const imagePath = path.join(DATA_DIR, id, 'screenshot.png');
    
    await fs.access(imagePath);
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error fetching screenshot image:', error);
    res.status(404).json({ success: false, error: 'Image not found' });
  }
});

// POST /api/screenshots - Save new screenshot
router.post('/', async (req, res) => {
  try {
    await ensureDir();
    
    const {
      imageData,
      title,
      description,
      sourceUrl,
      width,
      height,
      annotations
    } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ success: false, error: 'Image data is required' });
    }
    
    // Generate ID and create directory
    const id = generateId();
    const screenshotDir = path.join(DATA_DIR, id);
    await fs.mkdir(screenshotDir, { recursive: true });
    
    // Extract base64 image data and save as PNG
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const imagePath = path.join(screenshotDir, 'screenshot.png');
    await fs.writeFile(imagePath, imageBuffer);
    
    // Get file size
    const stats = await fs.stat(imagePath);
    
    // Create metadata
    const now = new Date();
    const metadata = {
      id,
      title: title || 'Untitled Screenshot',
      description: description || '',
      dateTaken: formatDate(now),
      createdAt: now.toISOString(),
      sourceUrl: sourceUrl || '/',
      width: width || 0,
      height: height || 0,
      fileSize: stats.size,
      annotations: annotations || { strokeCount: 0, tools: [] }
    };
    
    // Save metadata
    const metadataPath = path.join(screenshotDir, 'metadata.json');
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    // Add URL to response
    metadata.imageUrl = `/api/screenshots/${id}/image`;
    metadata.thumbnailUrl = `/api/screenshots/${id}/image`;
    
    res.json({ success: true, screenshot: metadata });
  } catch (error) {
    console.error('Error saving screenshot:', error);
    res.status(500).json({ success: false, error: 'Failed to save screenshot' });
  }
});

// PATCH /api/screenshots/:id - Update screenshot metadata
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    const screenshotDir = path.join(DATA_DIR, id);
    const metadataPath = path.join(screenshotDir, 'metadata.json');
    
    // Read existing metadata
    const metadataContent = await fs.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    // Update fields
    if (title !== undefined) metadata.title = title;
    if (description !== undefined) metadata.description = description;
    metadata.updatedAt = new Date().toISOString();
    
    // Save updated metadata
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    metadata.imageUrl = `/api/screenshots/${id}/image`;
    
    res.json({ success: true, screenshot: metadata });
  } catch (error) {
    console.error('Error updating screenshot:', error);
    res.status(500).json({ success: false, error: 'Failed to update screenshot' });
  }
});

// DELETE /api/screenshots/:id - Delete screenshot
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const screenshotDir = path.join(DATA_DIR, id);
    
    // Verify directory exists
    await fs.access(screenshotDir);
    
    // Remove directory and all contents
    await fs.rm(screenshotDir, { recursive: true, force: true });
    
    res.json({ success: true, message: 'Screenshot deleted' });
  } catch (error) {
    console.error('Error deleting screenshot:', error);
    res.status(500).json({ success: false, error: 'Failed to delete screenshot' });
  }
});

module.exports = router;
