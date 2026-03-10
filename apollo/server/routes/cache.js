const express = require('express');
const path = require('path');
const fs = require('fs');
const { cacheDir } = require('../lib/config');

const router = express.Router();

// API endpoint for saving cached data
router.post('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(cacheDir, filename);
  
  try {
    fs.writeFileSync(filepath, JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: `Cached data saved to ${filename}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint for reading cached data
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(cacheDir, filename);
  
  try {
    if (fs.existsSync(filepath)) {
      const data = fs.readFileSync(filepath, 'utf-8');
      res.json(JSON.parse(data));
    } else {
      res.status(404).json({ success: false, error: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint for listing cached files
router.get('/', (req, res) => {
  try {
    const files = fs.readdirSync(cacheDir);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;


