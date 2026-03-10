const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { dataDir } = require('../../../../server/lib/config');

// Lazy-loaded puppeteer instance
let puppeteerModule = null;
async function getPuppeteer() {
  if (!puppeteerModule) {
    puppeteerModule = require('puppeteer');
  }
  return puppeteerModule;
}

// Screenshot cache directory
const screenshotCacheDir = path.join(dataDir, 'cache', 'slide-screenshots');
if (!fs.existsSync(screenshotCacheDir)) {
  fs.mkdirSync(screenshotCacheDir, { recursive: true });
}

// Generate a hash for URL to use as cache filename
function getUrlHash(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

// Get screenshot cache paths
function getScreenshotPaths(url) {
  const hash = getUrlHash(url);
  return {
    imagePath: path.join(screenshotCacheDir, `${hash}.png`),
    metaPath: path.join(screenshotCacheDir, `${hash}.json`)
  };
}

// Check if screenshot is cached and still valid
function isScreenshotCached(url) {
  const { imagePath, metaPath } = getScreenshotPaths(url);
  return fs.existsSync(imagePath) && fs.existsSync(metaPath);
}

// Get screenshot metadata
function getScreenshotMetadata(url) {
  const { metaPath } = getScreenshotPaths(url);
  if (fs.existsSync(metaPath)) {
    try {
      return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    } catch (err) {
      return null;
    }
  }
  return null;
}

// Save screenshot metadata
function saveScreenshotMetadata(url, metadata) {
  const { metaPath } = getScreenshotPaths(url);
  fs.writeFileSync(metaPath, JSON.stringify({
    url,
    capturedAt: new Date().toISOString(),
    ...metadata
  }, null, 2));
}

// Capture screenshot of a URL using Puppeteer
async function captureScreenshot(url, baseUrl) {
  const puppeteer = await getPuppeteer();
  let browser = null;
  
  // Determine if this is a local path or external URL
  const isLocalPath = url.startsWith('/');
  const isExternalUrl = url.startsWith('http://') || url.startsWith('https://');
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    // Use 4:5 aspect ratio for side panel screenshots (more vertical to fit slide layout)
    // Use larger dimensions (1440x1800) to capture proper desktop layout, will scale down in slide
    await page.setViewport({ width: 1440, height: 1800 });
    
    // Set a reasonable user agent for external sites
    if (isExternalUrl) {
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }
    
    // Construct full URL for local paths
    let fullUrl = url;
    if (isLocalPath) {
      fullUrl = `${baseUrl}${url}`;
    }
    
    // Navigate to the page - use networkidle2 as initial wait (allows 2 pending requests)
    // This is more forgiving for SPAs that may have long-polling or websocket connections
    await page.goto(fullUrl, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    
    if (isLocalPath) {
      // For local Apollo pages (React SPAs), poll for content to render
      const maxWaitTime = 8000; // Max 8 seconds for content to load
      const pollInterval = 500;
      let waited = 0;
      
      while (waited < maxWaitTime) {
        // Check if the page has meaningful content beyond just the shell
        const hasContent = await page.evaluate(() => {
          // Look for common indicators that the page has fully loaded:
          // 1. No spinners visible
          const hasSpinner = document.querySelector('.pf-v6-c-spinner, .pf-c-spinner, [class*="spinner"]');
          // 2. Main content area has children
          const mainContent = document.querySelector('main, [class*="page-section"], [class*="PageSection"]');
          const hasMainContent = mainContent && mainContent.children.length > 1;
          // 3. No loading states
          const hasLoadingText = document.body.innerText.toLowerCase().includes('loading...');
          // 4. Check for empty states that might indicate loading is done
          const hasEmptyState = document.querySelector('[class*="empty-state"], [class*="EmptyState"]');
          // 5. Cards or data display elements present
          const hasDataElements = document.querySelector('[class*="card"], [class*="Card"], table, [class*="gallery"], [class*="list"]');
          
          // Page is ready if: no spinner AND (has data elements OR has empty state)
          // OR if main content has substantial children
          const isReady = !hasSpinner && !hasLoadingText && (hasDataElements || hasEmptyState || hasMainContent);
          return isReady;
        });
        
        if (hasContent) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        waited += pollInterval;
      }
      
      // Additional wait for any final animations/transitions to settle
      await new Promise(resolve => setTimeout(resolve, 1500));
    } else {
      // For external URLs, use a simpler wait strategy
      // Wait for the page to stabilize (no DOM changes for a period)
      const maxWaitTime = 5000;
      const pollInterval = 500;
      let waited = 0;
      let lastBodyLength = 0;
      let stableCount = 0;
      
      while (waited < maxWaitTime && stableCount < 2) {
        const bodyLength = await page.evaluate(() => document.body.innerHTML.length);
        
        if (bodyLength === lastBodyLength && bodyLength > 0) {
          stableCount++;
        } else {
          stableCount = 0;
        }
        
        lastBodyLength = bodyLength;
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        waited += pollInterval;
      }
      
      // Additional wait for lazy-loaded images and animations
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Capture screenshot
    const { imagePath } = getScreenshotPaths(url);
    await page.screenshot({
      path: imagePath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1440, height: 1800 }
    });
    
    // Save metadata
    saveScreenshotMetadata(url, {
      width: 1440,
      height: 1800,
      fullUrl,
      isExternal: isExternalUrl
    });
    
    await browser.close();
    return imagePath;
    
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}

// Clear all cached screenshots
function clearAllScreenshots() {
  if (!fs.existsSync(screenshotCacheDir)) {
    return 0;
  }
  
  const files = fs.readdirSync(screenshotCacheDir);
  let deletedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(screenshotCacheDir, file);
    if (fs.statSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
      deletedCount++;
    }
  }
  
  return deletedCount;
}

// Delete cached screenshot for a URL
function deleteScreenshot(url) {
  const { imagePath, metaPath } = getScreenshotPaths(url);
  
  let deleted = false;
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
    deleted = true;
  }
  if (fs.existsSync(metaPath)) {
    fs.unlinkSync(metaPath);
    deleted = true;
  }
  
  return deleted;
}

module.exports = {
  getPuppeteer,
  getScreenshotPaths,
  isScreenshotCached,
  getScreenshotMetadata,
  captureScreenshot,
  clearAllScreenshots,
  deleteScreenshot
};
