const express = require('express');
const path = require('path');
const fs = require('fs');
const { dataDir } = require('../../../server/lib/config');

const router = express.Router();
const bulletinsDir = path.join(dataDir, 'bulletins');

// Ensure bulletins directory exists
if (!fs.existsSync(bulletinsDir)) {
  fs.mkdirSync(bulletinsDir, { recursive: true });
}

// Generate a unique ID for new bulletins
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Load bulletin metadata from a folder
function loadBulletin(bulletinId) {
  const bulletinDir = path.join(bulletinsDir, bulletinId);
  const metadataPath = path.join(bulletinDir, 'metadata.json');

  if (!fs.existsSync(bulletinDir) || !fs.statSync(bulletinDir).isDirectory()) {
    return null;
  }

  if (!fs.existsSync(metadataPath)) {
    return null;
  }

  try {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    const stats = fs.statSync(metadataPath);

    // Check if there's HTML content
    const contentDir = path.join(bulletinDir, 'content');
    let htmlContent = null;
    let cssContent = null;

    if (fs.existsSync(contentDir)) {
      const htmlPath = path.join(contentDir, 'index.html');
      const cssPath = path.join(contentDir, 'styles.css');

      if (fs.existsSync(htmlPath)) {
        htmlContent = fs.readFileSync(htmlPath, 'utf-8');
      }
      if (fs.existsSync(cssPath)) {
        cssContent = fs.readFileSync(cssPath, 'utf-8');
      }
    }

    return {
      id: bulletinId,
      title: metadata.title || 'Untitled',
      description: metadata.description || '',
      author: metadata.author || 'Anonymous',
      authorId: metadata.authorId || null,
      created: metadata.created || stats.birthtime.toISOString(),
      modified: metadata.modified || stats.mtime.toISOString(),
      backgroundColor: metadata.backgroundColor || null,
      tags: metadata.tags || [],
      source: metadata.source || 'local',
      hasContent: !!htmlContent,
      htmlContent,
      cssContent
    };
  } catch (err) {
    console.error(`Error loading bulletin ${bulletinId}:`, err);
    return null;
  }
}

// Save bulletin to folder
function saveBulletin(bulletinId, data) {
  const bulletinDir = path.join(bulletinsDir, bulletinId);
  const metadataPath = path.join(bulletinDir, 'metadata.json');
  const contentDir = path.join(bulletinDir, 'content');

  // Ensure directory exists
  if (!fs.existsSync(bulletinDir)) {
    fs.mkdirSync(bulletinDir, { recursive: true });
  }

  const metadata = {
    title: data.title || 'Untitled',
    description: data.description || '',
    author: data.author || 'Anonymous',
    authorId: data.authorId || null,
    created: data.created || new Date().toISOString(),
    modified: new Date().toISOString(),
    backgroundColor: data.backgroundColor || null,
    tags: data.tags || [],
    source: data.source || 'local'
  };

  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

  // Handle HTML/CSS content
  if (data.htmlContent !== undefined) {
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    if (data.htmlContent) {
      fs.writeFileSync(path.join(contentDir, 'index.html'), data.htmlContent, 'utf-8');
    } else {
      // Remove HTML file if content is cleared
      const htmlPath = path.join(contentDir, 'index.html');
      if (fs.existsSync(htmlPath)) {
        fs.unlinkSync(htmlPath);
      }
    }
  }

  if (data.cssContent !== undefined) {
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    if (data.cssContent) {
      fs.writeFileSync(path.join(contentDir, 'styles.css'), data.cssContent, 'utf-8');
    } else {
      // Remove CSS file if content is cleared
      const cssPath = path.join(contentDir, 'styles.css');
      if (fs.existsSync(cssPath)) {
        fs.unlinkSync(cssPath);
      }
    }
  }

  return {
    id: bulletinId,
    ...metadata,
    hasContent: !!(data.htmlContent),
    htmlContent: data.htmlContent || null,
    cssContent: data.cssContent || null
  };
}

// List all bulletins
router.get('/', (req, res) => {
  try {
    const entries = fs.readdirSync(bulletinsDir, { withFileTypes: true });

    const bulletins = entries
      .filter(entry => entry.isDirectory())
      .map(entry => {
        try {
          const bulletin = loadBulletin(entry.name);
          if (bulletin) {
            // Return metadata only for list view (no full content)
            return {
              id: bulletin.id,
              title: bulletin.title,
              description: bulletin.description,
              author: bulletin.author,
              authorId: bulletin.authorId,
              created: bulletin.created,
              modified: bulletin.modified,
              backgroundColor: bulletin.backgroundColor,
              tags: bulletin.tags,
              source: bulletin.source,
              hasContent: bulletin.hasContent
            };
          }
          return null;
        } catch (err) {
          console.error(`Error loading bulletin ${entry.name}:`, err);
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({ success: true, bulletins });
  } catch (error) {
    console.error('Error listing bulletins:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new bulletin
router.post('/', (req, res) => {
  try {
    const { title, description, author, authorId, backgroundColor, tags, htmlContent, cssContent } = req.body;
    const bulletinId = generateId();

    const bulletin = saveBulletin(bulletinId, {
      title,
      description,
      author,
      authorId,
      backgroundColor,
      tags,
      htmlContent,
      cssContent,
      source: 'local',
      created: new Date().toISOString()
    });

    res.json({ success: true, bulletin });
  } catch (error) {
    console.error('Error creating bulletin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single bulletin with full content
router.get('/:id', (req, res) => {
  try {
    const bulletin = loadBulletin(req.params.id);

    if (!bulletin) {
      return res.status(404).json({ success: false, error: 'Bulletin not found' });
    }

    res.json({ success: true, bulletin });
  } catch (error) {
    console.error('Error getting bulletin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update bulletin
router.put('/:id', (req, res) => {
  try {
    const bulletinId = req.params.id;
    const existing = loadBulletin(bulletinId);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Bulletin not found' });
    }

    // Only allow editing local bulletins
    if (existing.source !== 'local') {
      return res.status(403).json({ success: false, error: 'Cannot edit external bulletins' });
    }

    const { title, description, author, authorId, backgroundColor, tags, htmlContent, cssContent } = req.body;

    const bulletin = saveBulletin(bulletinId, {
      title: title !== undefined ? title : existing.title,
      description: description !== undefined ? description : existing.description,
      author: author !== undefined ? author : existing.author,
      authorId: authorId !== undefined ? authorId : existing.authorId,
      backgroundColor: backgroundColor !== undefined ? backgroundColor : existing.backgroundColor,
      tags: tags !== undefined ? tags : existing.tags,
      htmlContent: htmlContent !== undefined ? htmlContent : existing.htmlContent,
      cssContent: cssContent !== undefined ? cssContent : existing.cssContent,
      source: existing.source,
      created: existing.created
    });

    res.json({ success: true, bulletin });
  } catch (error) {
    console.error('Error updating bulletin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete bulletin
router.delete('/:id', (req, res) => {
  try {
    const bulletinId = req.params.id;
    const bulletinDir = path.join(bulletinsDir, bulletinId);

    if (!fs.existsSync(bulletinDir)) {
      return res.status(404).json({ success: false, error: 'Bulletin not found' });
    }

    // Check if it's a local bulletin
    const existing = loadBulletin(bulletinId);
    if (existing && existing.source !== 'local') {
      return res.status(403).json({ success: false, error: 'Cannot delete external bulletins' });
    }

    // Delete directory and contents
    fs.rmSync(bulletinDir, { recursive: true });

    res.json({ success: true, message: 'Bulletin deleted' });
  } catch (error) {
    console.error('Error deleting bulletin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve bulletin content (HTML/CSS) for iframe embedding
router.get('/:id/content', (req, res) => {
  try {
    const bulletin = loadBulletin(req.params.id);

    if (!bulletin) {
      return res.status(404).json({ success: false, error: 'Bulletin not found' });
    }

    if (!bulletin.htmlContent) {
      return res.status(404).json({ success: false, error: 'Bulletin has no content' });
    }

    // Combine HTML and CSS into a complete document
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; }
    ${bulletin.cssContent || ''}
  </style>
</head>
<body>
  ${bulletin.htmlContent}
</body>
</html>`;

    res.type('html').send(fullHtml);
  } catch (error) {
    console.error('Error serving bulletin content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
