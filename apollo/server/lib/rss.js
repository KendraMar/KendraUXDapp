const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const xml2js = require('xml2js');
const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

// Initialize DOMPurify for server-side HTML sanitization
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Directory paths
const dataDir = path.join(__dirname, '..', '..', 'data');
const rssDir = path.join(dataDir, 'rss');
const rssCacheDir = path.join(dataDir, 'cache', 'rss');
const feedsCacheDir = path.join(rssCacheDir, 'feeds');
const imagesDir = path.join(rssCacheDir, 'images');

// Ensure directories exist
if (!fs.existsSync(rssDir)) {
  fs.mkdirSync(rssDir, { recursive: true });
}
if (!fs.existsSync(rssCacheDir)) {
  fs.mkdirSync(rssCacheDir, { recursive: true });
}
if (!fs.existsSync(feedsCacheDir)) {
  fs.mkdirSync(feedsCacheDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Initialize RSS parser with custom fields
const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['enclosure', 'enclosure'],
      ['dc:creator', 'creator']
    ]
  },
  timeout: 30000
});

// Subscriptions file path
const subscriptionsFile = path.join(rssDir, 'subscriptions.json');

/**
 * Load subscriptions from JSON file
 */
function loadSubscriptions() {
  try {
    if (fs.existsSync(subscriptionsFile)) {
      return JSON.parse(fs.readFileSync(subscriptionsFile, 'utf-8'));
    }
  } catch (error) {
    console.error('Error loading subscriptions:', error);
  }
  return { version: '1.0', lastUpdated: null, feeds: [] };
}

/**
 * Save subscriptions to JSON file
 */
function saveSubscriptions(subscriptions) {
  subscriptions.lastUpdated = new Date().toISOString();
  fs.writeFileSync(subscriptionsFile, JSON.stringify(subscriptions, null, 2));
}

/**
 * Load cached items for a feed
 */
function loadCachedItems(feedId) {
  const cacheFile = path.join(feedsCacheDir, `feed_${feedId}.json`);
  try {
    if (fs.existsSync(cacheFile)) {
      return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
    }
  } catch (error) {
    console.error(`Error loading cached items for feed ${feedId}:`, error);
  }
  return { feedId, feedTitle: '', lastFetched: null, items: [] };
}

/**
 * Save cached items for a feed
 */
function saveCachedItems(feedId, data) {
  const cacheFile = path.join(feedsCacheDir, `feed_${feedId}.json`);
  data.lastFetched = new Date().toISOString();
  fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
}

/**
 * Delete cached items for a feed
 */
function deleteCachedItems(feedId) {
  const cacheFile = path.join(feedsCacheDir, `feed_${feedId}.json`);
  try {
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
    }
  } catch (error) {
    console.error(`Error deleting cache for feed ${feedId}:`, error);
  }
}

/**
 * Fetch and parse RSS/Atom feed
 */
async function fetchFeed(url) {
  return parser.parseURL(url);
}

/**
 * Generate unique item ID from GUID or hash of link+title
 */
function generateItemId(item) {
  if (item.guid) {
    // Hash the GUID for consistent, shorter IDs
    return crypto.createHash('md5').update(item.guid).digest('hex').slice(0, 16);
  }
  // Fallback: hash of link + title
  const source = `${item.link || ''}${item.title || ''}`;
  return crypto.createHash('md5').update(source).digest('hex').slice(0, 16);
}

/**
 * Truncate text to specified length, preserving word boundaries
 */
function truncateDescription(text, maxLength = 200) {
  if (!text) return '';
  // Strip HTML tags for truncated version
  const stripped = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (stripped.length <= maxLength) return stripped;
  const truncated = stripped.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + '...';
}

/**
 * Extract first image URL from HTML content
 */
function extractImageFromContent(htmlContent) {
  if (!htmlContent) return null;
  
  // Try to find img tag
  const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  
  return null;
}

/**
 * Extract image URL from RSS item (checks multiple sources)
 */
function extractItemImage(item) {
  // Check enclosure
  if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image/')) {
    return item.enclosure.url;
  }
  
  // Check media:content
  if (item.mediaContent && item.mediaContent.length > 0) {
    const media = item.mediaContent[0];
    if (media.$ && media.$.url) {
      return media.$.url;
    }
  }
  
  // Check media:thumbnail
  if (item.mediaThumbnail) {
    const thumb = item.mediaThumbnail;
    if (thumb.$ && thumb.$.url) {
      return thumb.$.url;
    }
  }
  
  // Check content for images
  const contentImage = extractImageFromContent(item.contentEncoded || item.content || item.description);
  if (contentImage) {
    return contentImage;
  }
  
  return null;
}

/**
 * Download and cache an image, returning the local path
 */
async function cacheImage(imageUrl, feedId) {
  if (!imageUrl) return null;
  
  return new Promise((resolve) => {
    try {
      // Generate filename from URL hash
      const urlHash = crypto.createHash('md5').update(imageUrl).digest('hex');
      const ext = path.extname(new URL(imageUrl).pathname).slice(0, 5) || '.jpg';
      const filename = `${urlHash}${ext}`;
      const localPath = path.join(imagesDir, filename);
      
      // Check if already cached
      if (fs.existsSync(localPath)) {
        resolve(`/api/rss/images/${filename}`);
        return;
      }
      
      // Download the image
      const protocol = imageUrl.startsWith('https') ? https : http;
      const request = protocol.get(imageUrl, { timeout: 10000 }, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          cacheImage(response.headers.location, feedId).then(resolve);
          return;
        }
        
        if (response.statusCode !== 200) {
          resolve(null);
          return;
        }
        
        const fileStream = fs.createWriteStream(localPath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(`/api/rss/images/${filename}`);
        });
        
        fileStream.on('error', () => {
          fs.unlink(localPath, () => {});
          resolve(null);
        });
      });
      
      request.on('error', () => {
        resolve(null);
      });
      
      request.on('timeout', () => {
        request.destroy();
        resolve(null);
      });
    } catch (error) {
      resolve(null);
    }
  });
}

/**
 * Sanitize HTML content for safe rendering
 */
function sanitizeContent(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                   'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
                   'figure', 'figcaption', 'div', 'span'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class', 'style']
  });
}

/**
 * Sanitize OPML content to fix common XML issues
 * Handles unescaped ampersands, non-standard whitespace, and other issues
 */
function sanitizeOpmlContent(opmlContent) {
  let sanitized = opmlContent;
  
  // Replace non-breaking spaces and other problematic whitespace with regular spaces
  // This handles \u00A0 (non-breaking space), \u2003 (em space), \u2002 (en space), etc.
  sanitized = sanitized.replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ');
  
  // Normalize multiple spaces between attributes to single space (inside tags only)
  // This is a bit tricky - we need to be careful not to mess with content
  sanitized = sanitized.replace(/<([^>]+)>/g, (match, inner) => {
    // Replace multiple whitespace with single space inside tags
    const normalized = inner.replace(/\s+/g, ' ').trim();
    return `<${normalized}>`;
  });
  
  // Fix unescaped ampersands in attribute values
  // This regex finds & that are not already part of an entity (like &amp; &lt; etc.)
  sanitized = sanitized.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
  
  return sanitized;
}

/**
 * Parse OPML content and return array of feed objects
 */
function parseOpml(opmlContent) {
  return new Promise((resolve, reject) => {
    // Sanitize the OPML content to fix common XML issues
    const sanitizedContent = sanitizeOpmlContent(opmlContent);
    
    const parser = new xml2js.Parser({ explicitArray: false });
    parser.parseString(sanitizedContent, (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      
      const feeds = [];
      
      function extractFeeds(outlines) {
        if (!outlines) return;
        
        const items = Array.isArray(outlines) ? outlines : [outlines];
        
        for (const outline of items) {
          if (outline.$ && outline.$.xmlUrl) {
            feeds.push({
              id: uuidv4().slice(0, 8),
              title: outline.$.title || outline.$.text || 'Untitled Feed',
              xmlUrl: outline.$.xmlUrl,
              htmlUrl: outline.$.htmlUrl || '',
              description: outline.$.description || '',
              customOrder: feeds.length
            });
          }
          
          // Handle nested folders
          if (outline.outline) {
            extractFeeds(outline.outline);
          }
        }
      }
      
      if (result.opml && result.opml.body) {
        extractFeeds(result.opml.body.outline);
      }
      
      resolve(feeds);
    });
  });
}

/**
 * Generate OPML content from feeds array
 */
function generateOpml(feeds, title = 'Apollo RSS Subscriptions') {
  const now = new Date().toISOString();
  
  let opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${title}</title>
    <dateCreated>${now}</dateCreated>
    <dateModified>${now}</dateModified>
  </head>
  <body>
`;
  
  for (const feed of feeds) {
    const escapedTitle = (feed.title || '').replace(/"/g, '&quot;').replace(/&/g, '&amp;');
    const escapedDescription = (feed.description || '').replace(/"/g, '&quot;').replace(/&/g, '&amp;');
    const escapedXmlUrl = (feed.xmlUrl || '').replace(/&/g, '&amp;');
    const escapedHtmlUrl = (feed.htmlUrl || '').replace(/&/g, '&amp;');
    
    opml += `    <outline text="${escapedTitle}" title="${escapedTitle}" type="rss"
             xmlUrl="${escapedXmlUrl}"
             htmlUrl="${escapedHtmlUrl}"
             description="${escapedDescription}"
             id="${feed.id}"
             customOrder="${feed.customOrder || 0}" />\n`;
  }
  
  opml += `  </body>
</opml>`;
  
  return opml;
}

/**
 * Process RSS items and merge with existing cache
 */
async function processAndCacheItems(feedId, feedData, existingCache) {
  const existingItems = existingCache.items || [];
  const existingItemsMap = new Map(existingItems.map(item => [item.id, item]));
  
  const newItems = [];
  
  for (const item of (feedData.items || [])) {
    const itemId = generateItemId(item);
    
    // Check if item already exists
    if (existingItemsMap.has(itemId)) {
      // Keep existing item with its state
      newItems.push(existingItemsMap.get(itemId));
      continue;
    }
    
    // Get or cache image
    const originalImageUrl = extractItemImage(item);
    let imageUrl = null;
    if (originalImageUrl) {
      imageUrl = await cacheImage(originalImageUrl, feedId);
    }
    
    // Create new item
    const newItem = {
      id: itemId,
      title: item.title || 'Untitled',
      link: item.link || '',
      description: item.description || item.contentSnippet || '',
      descriptionTruncated: truncateDescription(item.description || item.contentSnippet),
      content: sanitizeContent(item.contentEncoded || item.content || item.description || ''),
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      author: item.creator || item.author || '',
      categories: item.categories || [],
      imageUrl: imageUrl,
      originalImageUrl: originalImageUrl,
      state: 'unseen',
      seenAt: null,
      saved: false,
      archived: false
    };
    
    newItems.push(newItem);
  }
  
  // Sort by pubDate (newest first)
  newItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  
  return {
    feedId,
    feedTitle: feedData.title || existingCache.feedTitle,
    lastFetched: new Date().toISOString(),
    items: newItems
  };
}

/**
 * Calculate unseen count for a feed
 */
function calculateUnseenCount(feedId) {
  const cache = loadCachedItems(feedId);
  return cache.items.filter(item => item.state === 'unseen' && !item.archived).length;
}

/**
 * Get all items from all feeds or a specific feed, with filtering
 */
function getAllItems(feedId = null, stateFilter = 'all', limit = 100, offset = 0) {
  const subscriptions = loadSubscriptions();
  let allItems = [];
  
  const feedsToProcess = feedId 
    ? subscriptions.feeds.filter(f => f.id === feedId)
    : subscriptions.feeds;
  
  for (const feed of feedsToProcess) {
    const cache = loadCachedItems(feed.id);
    const itemsWithFeedInfo = cache.items.map(item => ({
      ...item,
      feedId: feed.id,
      feedTitle: feed.title
    }));
    allItems = allItems.concat(itemsWithFeedInfo);
  }
  
  // Apply state filter
  switch (stateFilter) {
    case 'unseen':
      allItems = allItems.filter(item => item.state === 'unseen' && !item.archived);
      break;
    case 'seen':
      allItems = allItems.filter(item => item.state === 'seen' && !item.archived);
      break;
    case 'saved':
      allItems = allItems.filter(item => item.saved && !item.archived);
      break;
    case 'archive':
      allItems = allItems.filter(item => item.archived);
      break;
    case 'all':
    default:
      allItems = allItems.filter(item => !item.archived);
      break;
  }
  
  // Sort by pubDate (newest first)
  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  
  const total = allItems.length;
  const paginatedItems = allItems.slice(offset, offset + limit);
  
  return { items: paginatedItems, total, offset, limit };
}

/**
 * Get a single item by ID (searches all feeds)
 */
function getItemById(itemId) {
  const subscriptions = loadSubscriptions();
  
  for (const feed of subscriptions.feeds) {
    const cache = loadCachedItems(feed.id);
    const item = cache.items.find(i => i.id === itemId);
    if (item) {
      return {
        ...item,
        feedId: feed.id,
        feedTitle: feed.title
      };
    }
  }
  
  return null;
}

/**
 * Update item state (seen/unseen, saved, archived)
 */
function updateItemState(itemId, updates) {
  const subscriptions = loadSubscriptions();
  
  for (const feed of subscriptions.feeds) {
    const cache = loadCachedItems(feed.id);
    const itemIndex = cache.items.findIndex(i => i.id === itemId);
    
    if (itemIndex !== -1) {
      const item = cache.items[itemIndex];
      
      // Handle state transitions
      if (updates.state !== undefined) {
        if (updates.state === 'seen' && item.state === 'unseen') {
          item.seenAt = new Date().toISOString();
        } else if (updates.state === 'unseen') {
          item.seenAt = null;
        }
        item.state = updates.state;
      }
      
      if (updates.saved !== undefined) {
        item.saved = updates.saved;
      }
      
      if (updates.archived !== undefined) {
        item.archived = updates.archived;
      }
      
      cache.items[itemIndex] = item;
      saveCachedItems(feed.id, cache);
      
      return {
        ...item,
        feedId: feed.id,
        feedTitle: feed.title
      };
    }
  }
  
  return null;
}

/**
 * Mark all items in a feed as seen
 */
function markAllSeen(feedId) {
  const cache = loadCachedItems(feedId);
  const now = new Date().toISOString();
  
  let count = 0;
  for (const item of cache.items) {
    if (item.state === 'unseen') {
      item.state = 'seen';
      item.seenAt = now;
      count++;
    }
  }
  
  saveCachedItems(feedId, cache);
  return count;
}

/**
 * Archive all seen items in a feed
 */
function archiveAllSeen(feedId) {
  const cache = loadCachedItems(feedId);
  
  let count = 0;
  for (const item of cache.items) {
    if (item.state === 'seen' && !item.archived) {
      item.archived = true;
      count++;
    }
  }
  
  saveCachedItems(feedId, cache);
  return count;
}

/**
 * Mark all items in ALL feeds as seen
 */
function markAllSeenAllFeeds() {
  const subscriptions = loadSubscriptions();
  const now = new Date().toISOString();
  
  let totalCount = 0;
  for (const feed of subscriptions.feeds) {
    const cache = loadCachedItems(feed.id);
    
    let count = 0;
    for (const item of cache.items) {
      if (item.state === 'unseen') {
        item.state = 'seen';
        item.seenAt = now;
        count++;
      }
    }
    
    if (count > 0) {
      saveCachedItems(feed.id, cache);
      totalCount += count;
    }
  }
  
  return totalCount;
}

/**
 * Update an item's AI summary
 * @param {string} itemId - The item ID
 * @param {string} aiSummary - The AI-generated summary text
 * @param {string} model - The AI model name used to generate the summary
 */
function updateItemAiSummary(itemId, aiSummary, model) {
  const subscriptions = loadSubscriptions();
  
  for (const feed of subscriptions.feeds) {
    const cache = loadCachedItems(feed.id);
    const itemIndex = cache.items.findIndex(i => i.id === itemId);
    
    if (itemIndex !== -1) {
      const item = cache.items[itemIndex];
      
      // Store the AI summary with metadata
      item.aiSummary = {
        text: aiSummary,
        generatedAt: new Date().toISOString(),
        model: model || 'unknown'
      };
      
      cache.items[itemIndex] = item;
      saveCachedItems(feed.id, cache);
      
      return {
        ...item,
        feedId: feed.id,
        feedTitle: feed.title
      };
    }
  }
  
  return null;
}

module.exports = {
  loadSubscriptions,
  saveSubscriptions,
  loadCachedItems,
  saveCachedItems,
  deleteCachedItems,
  fetchFeed,
  generateItemId,
  truncateDescription,
  extractItemImage,
  cacheImage,
  sanitizeContent,
  parseOpml,
  generateOpml,
  processAndCacheItems,
  calculateUnseenCount,
  getAllItems,
  getItemById,
  updateItemState,
  updateItemAiSummary,
  markAllSeen,
  markAllSeenAllFeeds,
  archiveAllSeen,
  rssDir,
  rssCacheDir,
  imagesDir
};
