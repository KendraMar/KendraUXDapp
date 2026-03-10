const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const rss = require('../../../server/lib/rss');
const { loadAiConfig } = require('../../../server/lib/config');
const { summarizeRssItem } = require('../../../server/lib/ai');

const router = express.Router();

// Configure multer for OPML file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * GET /api/rss/feeds
 * Returns list of subscribed feeds with metadata
 */
router.get('/feeds', (req, res) => {
  try {
    const subscriptions = rss.loadSubscriptions();
    
    // Add unseen counts to each feed
    const feeds = subscriptions.feeds.map(feed => {
      const cache = rss.loadCachedItems(feed.id);
      const unseenCount = cache.items.filter(item => item.state === 'unseen' && !item.archived).length;
      const totalCount = cache.items.filter(item => !item.archived).length;
      
      return {
        ...feed,
        unseenCount,
        totalCount,
        lastFetched: cache.lastFetched,
        hasError: feed.hasError || false
      };
    });
    
    // Sort alphabetically by title
    feeds.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    
    res.json({ success: true, feeds });
  } catch (error) {
    console.error('Error fetching feeds:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rss/feeds
 * Add a new feed subscription
 */
router.post('/feeds', async (req, res) => {
  try {
    const { xmlUrl, title, description } = req.body;
    
    if (!xmlUrl) {
      return res.status(400).json({ success: false, error: 'xmlUrl is required' });
    }
    
    // Validate URL format
    try {
      new URL(xmlUrl);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL format' });
    }
    
    const subscriptions = rss.loadSubscriptions();
    
    // Check for duplicate
    if (subscriptions.feeds.some(f => f.xmlUrl === xmlUrl)) {
      return res.status(400).json({ success: false, error: 'Feed already subscribed' });
    }
    
    // Fetch the feed to validate and get title
    let feedData;
    try {
      feedData = await rss.fetchFeed(xmlUrl);
    } catch (fetchError) {
      return res.status(400).json({ 
        success: false, 
        error: `Failed to fetch feed: ${fetchError.message}` 
      });
    }
    
    // Create new feed entry
    const newFeed = {
      id: uuidv4().slice(0, 8),
      title: title || feedData.title || 'Untitled Feed',
      xmlUrl,
      htmlUrl: feedData.link || '',
      description: description || feedData.description || '',
      customOrder: subscriptions.feeds.length,
      lastFetched: null,
      errorCount: 0,
      lastError: null
    };
    
    subscriptions.feeds.push(newFeed);
    rss.saveSubscriptions(subscriptions);
    
    // Cache initial items
    const existingCache = { feedId: newFeed.id, feedTitle: newFeed.title, items: [] };
    const cachedData = await rss.processAndCacheItems(newFeed.id, feedData, existingCache);
    rss.saveCachedItems(newFeed.id, cachedData);
    
    // Update feed with lastFetched
    newFeed.lastFetched = cachedData.lastFetched;
    newFeed.unseenCount = cachedData.items.filter(i => i.state === 'unseen').length;
    newFeed.totalCount = cachedData.items.length;
    
    res.json({ success: true, feed: newFeed });
  } catch (error) {
    console.error('Error adding feed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/rss/feeds/:id
 * Update feed (rename, description, order)
 */
router.put('/feeds/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, customOrder } = req.body;
    
    const subscriptions = rss.loadSubscriptions();
    const feedIndex = subscriptions.feeds.findIndex(f => f.id === id);
    
    if (feedIndex === -1) {
      return res.status(404).json({ success: false, error: 'Feed not found' });
    }
    
    if (title !== undefined) {
      subscriptions.feeds[feedIndex].title = title;
    }
    if (description !== undefined) {
      subscriptions.feeds[feedIndex].description = description;
    }
    if (customOrder !== undefined) {
      subscriptions.feeds[feedIndex].customOrder = customOrder;
    }
    
    rss.saveSubscriptions(subscriptions);
    
    res.json({ success: true, feed: subscriptions.feeds[feedIndex] });
  } catch (error) {
    console.error('Error updating feed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/rss/feeds/:id
 * Remove a feed subscription
 */
router.delete('/feeds/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const subscriptions = rss.loadSubscriptions();
    const feedIndex = subscriptions.feeds.findIndex(f => f.id === id);
    
    if (feedIndex === -1) {
      return res.status(404).json({ success: false, error: 'Feed not found' });
    }
    
    subscriptions.feeds.splice(feedIndex, 1);
    rss.saveSubscriptions(subscriptions);
    
    // Delete cached items
    rss.deleteCachedItems(id);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting feed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rss/import
 * Import feeds from OPML file
 */
router.post('/import', upload.single('opml'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No OPML file provided' });
    }
    
    const opmlContent = req.file.buffer.toString('utf-8');
    const importedFeeds = await rss.parseOpml(opmlContent);
    
    const subscriptions = rss.loadSubscriptions();
    const existingUrls = new Set(subscriptions.feeds.map(f => f.xmlUrl));
    
    let imported = 0;
    let skipped = 0;
    const errors = [];
    
    for (const feed of importedFeeds) {
      if (existingUrls.has(feed.xmlUrl)) {
        skipped++;
        continue;
      }
      
      // Generate new ID and set order
      feed.id = uuidv4().slice(0, 8);
      feed.customOrder = subscriptions.feeds.length;
      feed.lastFetched = null;
      feed.errorCount = 0;
      feed.lastError = null;
      
      subscriptions.feeds.push(feed);
      existingUrls.add(feed.xmlUrl);
      imported++;
    }
    
    rss.saveSubscriptions(subscriptions);
    
    res.json({ success: true, imported, skipped, errors });
  } catch (error) {
    console.error('Error importing OPML:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/rss/export
 * Export subscriptions as OPML file
 */
router.get('/export', (req, res) => {
  try {
    const subscriptions = rss.loadSubscriptions();
    const opml = rss.generateOpml(subscriptions.feeds);
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename="apollo-rss-subscriptions.opml"');
    res.send(opml);
  } catch (error) {
    console.error('Error exporting OPML:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/rss/items
 * Get items from all feeds or specific feed, with filtering
 */
router.get('/items', (req, res) => {
  try {
    const { feedId, limit = 100, offset = 0, stateFilter = 'all' } = req.query;
    
    const result = rss.getAllItems(
      feedId || null,
      stateFilter,
      parseInt(limit, 10),
      parseInt(offset, 10)
    );
    
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/rss/items/:id
 * Get full item details including content
 */
router.get('/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const item = rss.getItemById(id);
    
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/rss/items/:id
 * Update item state (seen/unseen, saved, archived)
 */
router.patch('/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { state, saved, archived } = req.body;
    
    const item = rss.updateItemState(id, { state, saved, archived });
    
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    res.json({ success: true, item });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rss/refresh
 * Refresh all feeds or specific feed
 */
router.post('/refresh', async (req, res) => {
  try {
    const { feedId } = req.body;
    
    const subscriptions = rss.loadSubscriptions();
    const feedsToRefresh = feedId 
      ? subscriptions.feeds.filter(f => f.id === feedId)
      : subscriptions.feeds;
    
    if (feedId && feedsToRefresh.length === 0) {
      return res.status(404).json({ success: false, error: 'Feed not found' });
    }
    
    let refreshed = 0;
    let newItems = 0;
    const errors = [];
    
    for (const feed of feedsToRefresh) {
      try {
        const feedData = await rss.fetchFeed(feed.xmlUrl);
        const existingCache = rss.loadCachedItems(feed.id);
        const existingCount = existingCache.items.length;
        
        const cachedData = await rss.processAndCacheItems(feed.id, feedData, existingCache);
        rss.saveCachedItems(feed.id, cachedData);
        
        // Count new items (items that didn't exist before)
        const addedItems = cachedData.items.length - existingCount;
        newItems += Math.max(0, addedItems);
        
        // Update feed in subscriptions
        const feedIndex = subscriptions.feeds.findIndex(f => f.id === feed.id);
        if (feedIndex !== -1) {
          subscriptions.feeds[feedIndex].lastFetched = cachedData.lastFetched;
          subscriptions.feeds[feedIndex].hasError = false;
          subscriptions.feeds[feedIndex].lastError = null;
        }
        
        refreshed++;
      } catch (fetchError) {
        console.error(`Error refreshing feed ${feed.id}:`, fetchError);
        errors.push({ feedId: feed.id, error: fetchError.message });
        
        // Mark feed as having error
        const feedIndex = subscriptions.feeds.findIndex(f => f.id === feed.id);
        if (feedIndex !== -1) {
          subscriptions.feeds[feedIndex].hasError = true;
          subscriptions.feeds[feedIndex].lastError = fetchError.message;
        }
      }
    }
    
    rss.saveSubscriptions(subscriptions);
    
    res.json({ success: true, refreshed, newItems, errors });
  } catch (error) {
    console.error('Error refreshing feeds:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rss/feeds/:id/mark-all-seen
 * Mark all items in a feed as seen
 */
router.post('/feeds/:id/mark-all-seen', (req, res) => {
  try {
    const { id } = req.params;
    
    const subscriptions = rss.loadSubscriptions();
    const feed = subscriptions.feeds.find(f => f.id === id);
    
    if (!feed) {
      return res.status(404).json({ success: false, error: 'Feed not found' });
    }
    
    const count = rss.markAllSeen(id);
    
    res.json({ success: true, marked: count });
  } catch (error) {
    console.error('Error marking all as seen:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rss/feeds/:id/archive-all-seen
 * Archive all seen items in a feed
 */
router.post('/feeds/:id/archive-all-seen', (req, res) => {
  try {
    const { id } = req.params;
    
    const subscriptions = rss.loadSubscriptions();
    const feed = subscriptions.feeds.find(f => f.id === id);
    
    if (!feed) {
      return res.status(404).json({ success: false, error: 'Feed not found' });
    }
    
    const count = rss.archiveAllSeen(id);
    
    res.json({ success: true, archived: count });
  } catch (error) {
    console.error('Error archiving seen items:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rss/mark-all-seen
 * Mark all items in ALL feeds as seen
 */
router.post('/mark-all-seen', (req, res) => {
  try {
    const count = rss.markAllSeenAllFeeds();
    
    res.json({ success: true, marked: count });
  } catch (error) {
    console.error('Error marking all as seen:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/rss/images/:filename
 * Serve cached preview images
 */
router.get('/images/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(rss.imagesDir, filename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }
    
    // Determine content type from extension
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    };
    
    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/rss/items/:id/summarize
 * Generate an AI summary for an RSS item
 */
router.post('/items/:id/summarize', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the item
    const item = rss.getItemById(id);
    
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }
    
    // Check if AI is configured
    const aiConfig = loadAiConfig();
    if (!aiConfig || !aiConfig.apiUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'AI is not configured. Please set up AI in Settings.' 
      });
    }
    
    // Get the text content to summarize (strip HTML tags)
    const content = item.content || item.description || '';
    const textContent = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    if (!textContent || textContent.length < 50) {
      return res.status(400).json({ 
        success: false, 
        error: 'Not enough content to summarize' 
      });
    }
    
    // Truncate very long content to avoid token limits
    const maxLength = 8000;
    const truncatedContent = textContent.length > maxLength 
      ? textContent.slice(0, maxLength) + '...' 
      : textContent;
    
    // Generate the summary using the dedicated RSS summarization function
    const summary = await summarizeRssItem(aiConfig, item.title, truncatedContent);
    
    // Store the summary in the item, including the model name
    const updatedItem = rss.updateItemAiSummary(id, summary, aiConfig.model);
    
    if (!updatedItem) {
      return res.status(500).json({ success: false, error: 'Failed to save summary' });
    }
    
    res.json({ success: true, summary, item: updatedItem });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
