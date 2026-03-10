const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

// Directories
const DATA_DIR = path.join(__dirname, '../../data');
const MOODBOARD_DIR = path.join(DATA_DIR, 'moodboard');
const IMAGES_DIR = path.join(MOODBOARD_DIR, 'images');
const DATA_FILE = path.join(MOODBOARD_DIR, 'moodboard.json');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(MOODBOARD_DIR, { recursive: true });
    await fs.mkdir(IMAGES_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating moodboard directories:', error);
  }
}

// Initialize directories
ensureDirectories();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, IMAGES_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Read mood board data
async function readMoodBoardData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return default data if file doesn't exist
    return {
      colors: [],
      fonts: [
        { name: 'Inter', textColor: '#808080', backgroundColor: '#3b3b3b' },
        { name: 'IBM Plex Sans', textColor: '#808080', backgroundColor: '#3b3b3b' },
        { name: 'Source Code Pro', textColor: '#808080', backgroundColor: '#3b3b3b' },
        { name: 'Source Serif 4', textColor: '#808080', backgroundColor: '#3b3b3b' },
        { name: 'Geist', textColor: '#808080', backgroundColor: '#3b3b3b' }
      ],
      spacing: 24,
      backgroundColor: '#2a2a2a',
      imageOrder: []
    };
  }
}

// Write mood board data
async function writeMoodBoardData(data) {
  await ensureDirectories();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/moodboard/images - List all images
router.get('/images', async (req, res) => {
  try {
    await ensureDirectories();
    
    const files = await fs.readdir(IMAGES_DIR);
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
    
    const images = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map(file => ({
        id: path.basename(file, path.extname(file)),
        name: file,
        src: `/api/moodboard/images/${file}`
      }));
    
    // Get ordering from data file
    const data = await readMoodBoardData();
    const orderedImages = [];
    
    // First add images in saved order
    if (data.imageOrder && data.imageOrder.length > 0) {
      for (const id of data.imageOrder) {
        const image = images.find(img => img.id === id);
        if (image) {
          orderedImages.push(image);
        }
      }
    }
    
    // Then add any images not in the order
    for (const image of images) {
      if (!orderedImages.find(img => img.id === image.id)) {
        orderedImages.push(image);
      }
    }
    
    res.json({ images: orderedImages });
  } catch (error) {
    console.error('Error listing images:', error);
    res.status(500).json({ error: 'Failed to list images' });
  }
});

// GET /api/moodboard/images/:filename - Serve an image
router.get('/images/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(IMAGES_DIR, filename);
    
    // Security check - prevent directory traversal
    if (!filePath.startsWith(IMAGES_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch (error) {
    res.status(404).json({ error: 'Image not found' });
  }
});

// POST /api/moodboard/upload - Upload an image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    const image = {
      id: path.basename(req.file.filename, path.extname(req.file.filename)),
      name: req.file.originalname,
      src: `/api/moodboard/images/${req.file.filename}`
    };
    
    // Update image order
    const data = await readMoodBoardData();
    data.imageOrder = data.imageOrder || [];
    data.imageOrder.push(image.id);
    await writeMoodBoardData(data);
    
    res.json({ image });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// DELETE /api/moodboard/images/:id - Delete an image
router.delete('/images/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Find the file with this id
    const files = await fs.readdir(IMAGES_DIR);
    const file = files.find(f => f.startsWith(id));
    
    if (!file) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const filePath = path.join(IMAGES_DIR, file);
    
    // Security check
    if (!filePath.startsWith(IMAGES_DIR)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await fs.unlink(filePath);
    
    // Update image order
    const data = await readMoodBoardData();
    data.imageOrder = (data.imageOrder || []).filter(imgId => imgId !== id);
    await writeMoodBoardData(data);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// GET /api/moodboard/data - Get mood board data (colors, fonts, settings)
router.get('/data', async (req, res) => {
  try {
    const data = await readMoodBoardData();
    res.json(data);
  } catch (error) {
    console.error('Error reading mood board data:', error);
    res.status(500).json({ error: 'Failed to read mood board data' });
  }
});

// POST /api/moodboard/data - Save mood board data
router.post('/data', async (req, res) => {
  try {
    const existingData = await readMoodBoardData();
    const newData = {
      ...existingData,
      ...req.body,
      imageOrder: existingData.imageOrder // Preserve image order
    };
    
    await writeMoodBoardData(newData);
    res.json({ success: true, data: newData });
  } catch (error) {
    console.error('Error saving mood board data:', error);
    res.status(500).json({ error: 'Failed to save mood board data' });
  }
});

module.exports = router;
