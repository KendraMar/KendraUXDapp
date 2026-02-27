const express = require('express');
const path = require('path');
const fs = require('fs');
const {
  slidesDir,
  templatesDir,
  loadSlideMetadata,
  parseMarkdownToSlides,
  listTemplates
} = require('./slideHelpers');
const { listSharedArtifactDirs } = require('../../../../server/lib/sharing');
const {
  getScreenshotPaths,
  isScreenshotCached,
  getScreenshotMetadata,
  captureScreenshot,
  clearAllScreenshots,
  deleteScreenshot
} = require('./screenshotService');
const {
  generateStandaloneHtml,
  generateSingleSlideHtml,
  exportToPdf,
  exportToPng
} = require('./exportService');
const {
  checkGoogleSlidesStatus,
  getOAuthUrl,
  handleOAuthCallback,
  exportToGoogleSlides
} = require('./googleSlidesService');
const {
  hasHeroImage,
  getHeroPath,
  generateHeroFromHtml,
  generateHeroesBatch,
  isBatchRunning,
  setBatchRunning
} = require('../../../../server/lib/heroService');

const router = express.Router();

// List all slide decks (local + shared) - also triggers background hero generation
router.get('/', (req, res) => {
  try {
    const entries = fs.readdirSync(slidesDir, { withFileTypes: true });
    
    const slideDecks = entries
      .filter(entry => entry.isDirectory() && entry.name !== 'templates')
      .map(entry => {
        try {
          const meta = loadSlideMetadata(entry.name);
          if (meta) {
            meta.shared = false;
          }
          return meta;
        } catch (err) {
          console.error(`Error loading slide deck ${entry.name}:`, err);
          return null;
        }
      })
      .filter(Boolean);

    // Load shared slide decks from all connected repos
    try {
      const sharedDirs = listSharedArtifactDirs('slides');
      for (const shared of sharedDirs) {
        try {
          const baseDir = path.dirname(shared.dirPath);
          const meta = loadSlideMetadata(shared.id, baseDir);
          if (meta) {
            meta.shared = true;
            meta.repoId = shared.repoId;
            meta.repoName = shared.repoName;
            slideDecks.push(meta);
          }
        } catch (err) {
          console.error(`Error loading shared slide deck ${shared.id}:`, err);
        }
      }
    } catch (err) {
      console.error('Error loading shared slides:', err);
    }

    slideDecks.sort((a, b) => {
      const dateA = new Date(a.modifiedAt);
      const dateB = new Date(b.modifiedAt);
      return dateB - dateA;
    });
    
    res.json({ success: true, slideDecks });

    // Fire-and-forget: generate missing heroes in background
    const missing = slideDecks.filter(d => !d.hasHero && !d.shared);
    if (missing.length > 0 && !isBatchRunning('slides')) {
      setBatchRunning('slides', true);
      generateMissingSlideHeroes(missing.map(d => d.id))
        .finally(() => setBatchRunning('slides', false));
    }
  } catch (error) {
    console.error('Error listing slide decks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List templates
router.get('/templates', (req, res) => {
  try {
    const templates = listTemplates();
    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get template files (CSS, JS)
router.get('/templates/:templateId/:file', (req, res) => {
  try {
    const { templateId, file } = req.params;
    const filePath = path.join(templatesDir, templateId, file);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Template file not found' });
    }
    
    // Set content type based on file extension
    const ext = path.extname(file).toLowerCase();
    const mimeTypes = {
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.html': 'text/html',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf'
    };
    
    res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error('Error serving template file:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve static assets from a slide deck folder (images, etc.)
router.get('/:id/assets/:filename', (req, res) => {
  try {
    const { id, filename } = req.params;
    const assetPath = path.join(slidesDir, id, filename);
    
    if (!fs.existsSync(assetPath)) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }
    
    // Set content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm'
    };
    
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    fs.createReadStream(assetPath).pipe(res);
  } catch (error) {
    console.error('Error serving slide asset:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// Screenshot Routes (must be before /:id)
// ============================================

// GET /api/slides/screenshot - Get or generate screenshot for a URL
router.get('/screenshot', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL parameter is required' });
    }
    
    // Validate URL format
    const isExternalUrl = url.startsWith('http://') || url.startsWith('https://');
    const isLocalPath = url.startsWith('/');
    
    if (!isExternalUrl && !isLocalPath) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid URL format. Use a local path (e.g., /feed) or full URL (e.g., https://example.com)' 
      });
    }
    
    const { imagePath } = getScreenshotPaths(url);
    
    // Check if cached
    if (isScreenshotCached(url)) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('X-Screenshot-Cached', 'true');
      return fs.createReadStream(imagePath).pipe(res);
    }
    
    // Generate screenshot
    // Get base URL from request (e.g., http://localhost:3000) for local paths
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    await captureScreenshot(url, baseUrl);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('X-Screenshot-Cached', 'false');
    fs.createReadStream(imagePath).pipe(res);
    
  } catch (error) {
    console.error('Error generating screenshot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/slides/screenshot/status - Check screenshot cache status
router.get('/screenshot/status', (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL parameter is required' });
    }
    
    const cached = isScreenshotCached(url);
    const metadata = cached ? getScreenshotMetadata(url) : null;
    
    res.json({
      success: true,
      cached,
      metadata
    });
    
  } catch (error) {
    console.error('Error checking screenshot status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/slides/screenshot - Invalidate cached screenshot
router.delete('/screenshot', (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL parameter is required' });
    }
    
    const deleted = deleteScreenshot(url);
    
    res.json({ 
      success: true, 
      deleted,
      message: deleted ? 'Screenshot cache invalidated' : 'No cached screenshot found'
    });
    
  } catch (error) {
    console.error('Error invalidating screenshot cache:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/slides/screenshot/all - Clear all cached screenshots
router.delete('/screenshot/all', (req, res) => {
  try {
    const deletedCount = clearAllScreenshots();
    
    res.json({ 
      success: true, 
      deleted: deletedCount,
      message: deletedCount > 0 
        ? `Cleared ${deletedCount} cached files. Screenshots will be regenerated on next view.`
        : 'No cached screenshots found'
    });
    
  } catch (error) {
    console.error('Error clearing screenshot cache:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single slide deck
router.get('/:id', (req, res) => {
  try {
    const slideDeck = loadSlideMetadata(req.params.id);
    
    if (!slideDeck) {
      return res.status(404).json({ success: false, error: 'Slide deck not found' });
    }
    
    // Load full slides content
    const slidesPath = path.join(slidesDir, req.params.id, 'slides.md');
    const markdown = fs.readFileSync(slidesPath, 'utf-8');
    const slides = parseMarkdownToSlides(markdown);
    
    res.json({ 
      success: true, 
      slideDeck: {
        ...slideDeck,
        slides,
        markdown
      }
    });
  } catch (error) {
    console.error('Error getting slide deck:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new slide deck
router.post('/', (req, res) => {
  try {
    const { name, title, template = 'uxd', aspectRatio = '16:9', description = '' } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    
    // Create folder ID from name
    const folderId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const folderPath = path.join(slidesDir, folderId);
    
    if (fs.existsSync(folderPath)) {
      return res.status(400).json({ success: false, error: 'Slide deck already exists' });
    }
    
    // Create folder
    fs.mkdirSync(folderPath, { recursive: true });
    
    // Create metadata.json
    const metadata = {
      title: title || name,
      description,
      template,
      aspectRatio,
      author: '',
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(
      path.join(folderPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    // Create default slides.md
    const defaultSlides = `<!-- type: title -->
# ${title || name}

## Your subtitle here

---

<!-- type: content -->
# First Slide

This is your first content slide.

- Add bullet points
- Like this
- And this

---

<!-- type: content -->
# Second Slide

Add more content here.

**Bold text** and *italic text* are supported.
`;
    
    fs.writeFileSync(path.join(folderPath, 'slides.md'), defaultSlides);
    
    res.json({ 
      success: true, 
      slideDeck: loadSlideMetadata(folderId)
    });
  } catch (error) {
    console.error('Error creating slide deck:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update slide deck markdown
router.put('/:id/slides', (req, res) => {
  try {
    const { markdown } = req.body;
    const folderPath = path.join(slidesDir, req.params.id);
    const slidesPath = path.join(folderPath, 'slides.md');
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Slide deck not found' });
    }
    
    fs.writeFileSync(slidesPath, markdown);
    
    const slides = parseMarkdownToSlides(markdown);
    
    // Fire-and-forget hero regeneration
    generateSlideHero(req.params.id).catch(() => {});
    
    res.json({ success: true, slides, slideCount: slides.length });
  } catch (error) {
    console.error('Error updating slides:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update metadata
router.patch('/:id', (req, res) => {
  try {
    const folderPath = path.join(slidesDir, req.params.id);
    const metadataPath = path.join(folderPath, 'metadata.json');
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Slide deck not found' });
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

// Delete slide deck
router.delete('/:id', (req, res) => {
  try {
    const folderPath = path.join(slidesDir, req.params.id);
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Slide deck not found' });
    }
    
    // Recursive delete
    fs.rmSync(folderPath, { recursive: true, force: true });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting slide deck:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve the slide deck player HTML
router.get('/:id/player', (req, res) => {
  try {
    const slideDeck = loadSlideMetadata(req.params.id);
    
    if (!slideDeck) {
      return res.status(404).json({ success: false, error: 'Slide deck not found' });
    }
    
    // Load slides
    const slidesPath = path.join(slidesDir, req.params.id, 'slides.md');
    const markdown = fs.readFileSync(slidesPath, 'utf-8');
    const slides = parseMarkdownToSlides(markdown);
    
    // Load template player HTML
    const templatePlayerPath = path.join(templatesDir, slideDeck.template || 'uxd', 'player.html');
    
    if (!fs.existsSync(templatePlayerPath)) {
      return res.status(404).json({ success: false, error: 'Template player not found' });
    }
    
    let playerHtml = fs.readFileSync(templatePlayerPath, 'utf-8');
    
    // Inject slide data
    playerHtml = playerHtml.replace(
      '/* SLIDE_DATA_PLACEHOLDER */',
      `window.SLIDE_DATA = ${JSON.stringify({
        ...slideDeck,
        slides
      })};`
    );
    
    res.setHeader('Content-Type', 'text/html');
    res.send(playerHtml);
  } catch (error) {
    console.error('Error serving slide player:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// Hero Image Endpoints
// ============================================

// Helper: batch-generate heroes for multiple slide decks (single browser)
async function generateMissingSlideHeroes(deckIds) {
  const items = [];
  const heroWidth = 640;
  const heroHeight = 360;

  for (const deckId of deckIds) {
    try {
      const folderPath = path.join(slidesDir, deckId);
      const slidesPath = path.join(folderPath, 'slides.md');
      const metadataPath = path.join(folderPath, 'metadata.json');

      if (!fs.existsSync(slidesPath)) continue;

      const markdown = fs.readFileSync(slidesPath, 'utf-8');
      const slides = parseMarkdownToSlides(markdown);
      if (slides.length === 0) continue;

      let metadata = { title: deckId, template: 'uxd', aspectRatio: '16:9' };
      if (fs.existsSync(metadataPath)) {
        try {
          metadata = { ...metadata, ...JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) };
        } catch (e) { /* use defaults */ }
      }

      const html = generateSingleSlideHtml(metadata, slides[0], 0, heroWidth, heroHeight);
      items.push({ artifactDir: folderPath, html });
    } catch (err) {
      console.error(`[hero] Error preparing slide hero for ${deckId}:`, err.message);
    }
  }

  if (items.length > 0) {
    console.log(`[hero] Generating ${items.length} slide hero image(s)...`);
    const result = await generateHeroesBatch(items, heroWidth, heroHeight);
    console.log(`[hero] Slide heroes done: ${result.generated} generated, ${result.failed} failed`);
    return result;
  }
  return { generated: 0, failed: 0 };
}

// Helper: generate hero for a slide deck (renders first slide as thumbnail)
async function generateSlideHero(deckId) {
  try {
    const folderPath = path.join(slidesDir, deckId);
    const slidesPath = path.join(folderPath, 'slides.md');
    const metadataPath = path.join(folderPath, 'metadata.json');
    
    if (!fs.existsSync(slidesPath)) return false;
    
    const markdown = fs.readFileSync(slidesPath, 'utf-8');
    const slides = parseMarkdownToSlides(markdown);
    
    if (slides.length === 0) return false;
    
    // Load metadata for aspect ratio and template info
    let metadata = { title: deckId, template: 'uxd', aspectRatio: '16:9' };
    if (fs.existsSync(metadataPath)) {
      try {
        metadata = { ...metadata, ...JSON.parse(fs.readFileSync(metadataPath, 'utf-8')) };
      } catch (e) { /* use defaults */ }
    }
    
    // Render the first slide at hero dimensions
    const heroWidth = 640;
    const heroHeight = 360;
    const html = generateSingleSlideHtml(metadata, slides[0], 0, heroWidth, heroHeight);
    
    return await generateHeroFromHtml(folderPath, html, heroWidth, heroHeight);
  } catch (error) {
    console.error(`[hero] Failed to generate slide hero for ${deckId}:`, error.message);
    return false;
  }
}

// GET /api/slides/:id/hero - Serve hero image
router.get('/:id/hero', (req, res) => {
  const folderPath = path.join(slidesDir, req.params.id);
  const heroPath = getHeroPath(folderPath);
  
  if (!fs.existsSync(heroPath)) {
    return res.status(404).json({ success: false, error: 'No hero image available' });
  }
  
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  fs.createReadStream(heroPath).pipe(res);
});

// POST /api/slides/hero/generate-all - Generate heroes for all decks missing them
router.post('/hero/generate-all', async (req, res) => {
  try {
    const entries = fs.readdirSync(slidesDir, { withFileTypes: true });
    const missingIds = entries
      .filter(e => e.isDirectory() && e.name !== 'templates')
      .filter(e => {
        const heroPath = path.join(slidesDir, e.name, 'hero.png');
        return !fs.existsSync(heroPath) && fs.existsSync(path.join(slidesDir, e.name, 'slides.md'));
      })
      .map(e => e.name);

    if (missingIds.length === 0) {
      return res.json({ success: true, message: 'All decks already have heroes', generated: 0 });
    }

    const result = await generateMissingSlideHeroes(missingIds);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in bulk hero generation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/slides/:id/hero/generate - Generate hero image on demand
router.post('/:id/hero/generate', async (req, res) => {
  try {
    const folderPath = path.join(slidesDir, req.params.id);
    
    if (!fs.existsSync(folderPath)) {
      return res.status(404).json({ success: false, error: 'Slide deck not found' });
    }
    
    const success = await generateSlideHero(req.params.id);
    
    res.json({ 
      success, 
      message: success ? 'Hero image generated' : 'Failed to generate hero image',
      heroUrl: success ? `/api/slides/${req.params.id}/hero` : null
    });
  } catch (error) {
    console.error('Error generating hero:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// Export Endpoints
// ============================================

// Export to standalone HTML
router.get('/:id/export/html', (req, res) => {
  try {
    const slideDeck = loadSlideMetadata(req.params.id);
    
    if (!slideDeck) {
      return res.status(404).json({ success: false, error: 'Slide deck not found' });
    }
    
    const slidesPath = path.join(slidesDir, req.params.id, 'slides.md');
    const markdown = fs.readFileSync(slidesPath, 'utf-8');
    const slides = parseMarkdownToSlides(markdown);
    
    const html = generateStandaloneHtml(slideDeck, slides);
    const filename = `${slideDeck.title || req.params.id}.html`.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(html);
  } catch (error) {
    console.error('Error exporting to HTML:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export to PDF using Puppeteer
router.get('/:id/export/pdf', async (req, res) => {
  try {
    const slideDeck = loadSlideMetadata(req.params.id);
    
    if (!slideDeck) {
      return res.status(404).json({ success: false, error: 'Slide deck not found' });
    }
    
    const slidesPath = path.join(slidesDir, req.params.id, 'slides.md');
    const markdown = fs.readFileSync(slidesPath, 'utf-8');
    const slides = parseMarkdownToSlides(markdown);
    
    const pdfBuffer = await exportToPdf(slideDeck, slides);
    const filename = `${slideDeck.title || req.params.id}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export individual slides as PNG images
router.get('/:id/export/png', async (req, res) => {
  try {
    const slideDeck = loadSlideMetadata(req.params.id);
    
    if (!slideDeck) {
      return res.status(404).json({ success: false, error: 'Slide deck not found' });
    }
    
    const slidesPath = path.join(slidesDir, req.params.id, 'slides.md');
    const markdown = fs.readFileSync(slidesPath, 'utf-8');
    const slides = parseMarkdownToSlides(markdown);
    
    const images = await exportToPng(slideDeck, slides);
    
    // Return as JSON with base64 encoded images
    res.json({
      success: true,
      title: slideDeck.title,
      slideCount: slides.length,
      images
    });
  } catch (error) {
    console.error('Error exporting to PNG:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// Google Slides Export
// ============================================

// Check Google Slides connection status
router.get('/google/status', async (req, res) => {
  try {
    const status = checkGoogleSlidesStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start OAuth flow for Google Slides
router.get('/google/oauth/authorize', (req, res) => {
  try {
    const authUrl = getOAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// OAuth callback for Google Slides
router.get('/google/oauth/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.send(`
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1 style="color: #c9190b;">Authorization Failed</h1>
          <p>Error: ${error}</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  }
  
  if (!code) {
    return res.send(`
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1 style="color: #c9190b;">Authorization Failed</h1>
          <p>No authorization code received.</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  }
  
  try {
    await handleOAuthCallback(code);
    
    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1 style="color: #3e8635;">✓ Google Slides Connected!</h1>
          <p>Your refresh token has been saved automatically.</p>
          <p>You can close this window and return to Apollo.</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 2000);
          </script>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Slides OAuth callback error:', error);
    res.send(`
      <html>
        <body style="font-family: system-ui; padding: 2rem; text-align: center;">
          <h1 style="color: #c9190b;">Authorization Failed</h1>
          <p>${error.message}</p>
          <p>You can close this window.</p>
        </body>
      </html>
    `);
  }
});

// Export to Google Slides
router.post('/:id/export/google-slides', async (req, res) => {
  try {
    const slideDeck = loadSlideMetadata(req.params.id);
    
    if (!slideDeck) {
      return res.status(404).json({ success: false, error: 'Slide deck not found' });
    }
    
    const slidesPath = path.join(slidesDir, req.params.id, 'slides.md');
    const markdown = fs.readFileSync(slidesPath, 'utf-8');
    const slides = parseMarkdownToSlides(markdown);
    
    const result = await exportToGoogleSlides(slideDeck, slides);
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Error exporting to Google Slides:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
