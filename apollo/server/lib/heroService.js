/**
 * Hero Image Service
 * 
 * Generates and manages hero.png preview thumbnails for artifacts
 * (slides, canvas, prototypes). These are cached in each artifact's
 * folder and used as card previews in gallery views.
 */

const path = require('path');
const fs = require('fs');

// Hero image dimensions (16:9 for card thumbnails)
const HERO_WIDTH = 640;
const HERO_HEIGHT = 360;

// Lazy-loaded puppeteer
let puppeteerModule = null;
async function getPuppeteer() {
  if (!puppeteerModule) {
    puppeteerModule = require('puppeteer');
  }
  return puppeteerModule;
}

/**
 * Check if a hero image exists for an artifact
 * @param {string} artifactDir - Path to the artifact's folder
 * @returns {boolean}
 */
function hasHeroImage(artifactDir) {
  const heroPath = path.join(artifactDir, 'hero.png');
  return fs.existsSync(heroPath);
}

/**
 * Get the path to an artifact's hero image
 * @param {string} artifactDir - Path to the artifact's folder
 * @returns {string}
 */
function getHeroPath(artifactDir) {
  return path.join(artifactDir, 'hero.png');
}

/**
 * Render HTML content to a PNG buffer using Puppeteer
 * @param {string} html - Full HTML document to render
 * @param {number} [width=HERO_WIDTH] - Viewport width
 * @param {number} [height=HERO_HEIGHT] - Viewport height
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function renderHtmlToBuffer(html, width = HERO_WIDTH, height = HERO_HEIGHT) {
  const puppeteer = await getPuppeteer();
  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });

    // Wait for fonts
    try {
      await page.evaluate(() => document.fonts.ready);
    } catch {
      // Fonts may not be available, continue
    }

    const buffer = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: { x: 0, y: 0, width, height }
    });

    await browser.close();
    browser = null;

    return buffer;
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

/**
 * Save a hero image buffer to an artifact directory
 * @param {string} artifactDir - Path to the artifact's folder
 * @param {Buffer} buffer - PNG image buffer
 */
function saveHeroImage(artifactDir, buffer) {
  // Ensure directory exists
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }
  const heroPath = path.join(artifactDir, 'hero.png');
  fs.writeFileSync(heroPath, buffer);
}

/**
 * Generate hero image from HTML content and save it
 * @param {string} artifactDir - Path to the artifact's folder
 * @param {string} html - HTML to render
 * @param {number} [width] - Optional viewport width
 * @param {number} [height] - Optional viewport height
 * @returns {Promise<boolean>} True if successful
 */
async function generateHeroFromHtml(artifactDir, html, width, height) {
  try {
    const buffer = await renderHtmlToBuffer(html, width, height);
    saveHeroImage(artifactDir, buffer);
    return true;
  } catch (error) {
    console.error(`[hero] Failed to generate hero for ${artifactDir}:`, error.message);
    return false;
  }
}

/**
 * Capture a hero image from a URL using Puppeteer
 * @param {string} artifactDir - Path to the artifact's folder
 * @param {string} url - URL to screenshot
 * @param {string} [baseUrl] - Base URL for local paths
 * @returns {Promise<boolean>} True if successful
 */
async function generateHeroFromUrl(artifactDir, url, baseUrl) {
  const puppeteer = await getPuppeteer();
  let browser = null;

  try {
    // Resolve URL
    let targetUrl = url;
    if (url.startsWith('/') && baseUrl) {
      targetUrl = `${baseUrl}${url}`;
    }

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: HERO_WIDTH, height: HERO_HEIGHT });
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Wait a moment for rendering
    await new Promise(resolve => setTimeout(resolve, 1000));

    const buffer = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: { x: 0, y: 0, width: HERO_WIDTH, height: HERO_HEIGHT }
    });

    await browser.close();
    browser = null;

    // Ensure directory exists
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }

    saveHeroImage(artifactDir, buffer);
    return true;
  } catch (error) {
    if (browser) await browser.close();
    console.error(`[hero] Failed to capture hero from URL ${url}:`, error.message);
    return false;
  }
}

/**
 * Batch-render multiple HTML documents to hero images using a single browser.
 * Much more efficient than calling generateHeroFromHtml() in a loop.
 * 
 * @param {Array<{artifactDir: string, html: string}>} items
 * @param {number} [width=HERO_WIDTH]
 * @param {number} [height=HERO_HEIGHT]
 * @returns {Promise<{generated: number, failed: number}>}
 */
async function generateHeroesBatch(items, width = HERO_WIDTH, height = HERO_HEIGHT) {
  if (!items || items.length === 0) return { generated: 0, failed: 0 };

  const puppeteer = await getPuppeteer();
  let browser = null;
  let generated = 0;
  let failed = 0;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height });

    for (const item of items) {
      try {
        await page.setContent(item.html, { waitUntil: 'networkidle0', timeout: 15000 });

        try {
          await page.evaluate(() => document.fonts.ready);
        } catch {
          // Fonts may not be available
        }

        const buffer = await page.screenshot({
          type: 'png',
          fullPage: false,
          clip: { x: 0, y: 0, width, height }
        });

        saveHeroImage(item.artifactDir, buffer);
        generated++;
      } catch (err) {
        console.error(`[hero] Batch: failed for ${item.artifactDir}:`, err.message);
        failed++;
      }
    }

    await browser.close();
    browser = null;
  } catch (error) {
    if (browser) await browser.close();
    console.error('[hero] Batch generation error:', error.message);
  }

  return { generated, failed };
}

// Track in-progress batch operations to prevent overlapping runs
const _batchLocks = new Set();

/**
 * Check if a batch generation is already running for a given key
 */
function isBatchRunning(key) {
  return _batchLocks.has(key);
}

/**
 * Mark a batch as running / finished
 */
function setBatchRunning(key, running) {
  if (running) _batchLocks.add(key);
  else _batchLocks.delete(key);
}

/**
 * Save a base64-encoded image as the hero
 * @param {string} artifactDir - Path to the artifact's folder
 * @param {string} base64Data - Base64-encoded PNG data (with or without data URL prefix)
 * @returns {boolean} True if successful
 */
function saveHeroFromBase64(artifactDir, base64Data) {
  try {
    const cleanData = base64Data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanData, 'base64');
    saveHeroImage(artifactDir, buffer);
    return true;
  } catch (error) {
    console.error(`[hero] Failed to save hero from base64:`, error.message);
    return false;
  }
}

module.exports = {
  HERO_WIDTH,
  HERO_HEIGHT,
  hasHeroImage,
  getHeroPath,
  renderHtmlToBuffer,
  saveHeroImage,
  generateHeroFromHtml,
  generateHeroFromUrl,
  generateHeroesBatch,
  isBatchRunning,
  setBatchRunning,
  saveHeroFromBase64,
  getPuppeteer
};
