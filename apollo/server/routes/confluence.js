const express = require('express');
const fs = require('fs');
const path = require('path');
const { loadConfluenceConfig, confluenceCacheDir } = require('../lib/config');
const { makeConfluenceRequest, parseConfluenceUrl, getBaseUrl, getApiPrefix, getViewPrefix } = require('../lib/confluence');

const router = express.Router();

// Cache file paths
const getCacheFilePath = (type, id) => path.join(confluenceCacheDir, `${type}_${id}.json`);
const getMetadataPath = () => path.join(confluenceCacheDir, 'metadata.json');

// Read/write cache helpers
function readCache(type, id) {
  const filePath = getCacheFilePath(type, id);
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    console.error(`Error reading cache for ${type}_${id}:`, error);
  }
  return null;
}

function writeCache(type, id, data) {
  const filePath = getCacheFilePath(type, id);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`Error writing cache for ${type}_${id}:`, error);
  }
}

function readMetadata() {
  const filePath = getMetadataPath();
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (error) {
    console.error('Error reading cache metadata:', error);
  }
  return { lastSync: null, pagesCount: 0 };
}

function writeMetadata(data) {
  const filePath = getMetadataPath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing cache metadata:', error);
  }
}

// Helper to make request with fallback to Bearer auth
async function makeRequestWithFallback(config, baseUrl, endpoint, configUrl) {
  const apiPrefix = getApiPrefix(configUrl);
  const fullEndpoint = `${apiPrefix}${endpoint}`;
  
  try {
    return await makeConfluenceRequest(
      { ...config, url: baseUrl },
      fullEndpoint,
      false
    );
  } catch (basicAuthError) {
    if (basicAuthError.message.includes('401')) {
      console.log('Basic Auth failed, trying Bearer token...');
      return await makeConfluenceRequest(
        { ...config, url: baseUrl },
        fullEndpoint,
        true
      );
    }
    throw basicAuthError;
  }
}

// API endpoint for getting cache status
router.get('/cache/status', (req, res) => {
  const metadata = readMetadata();
  res.json({
    success: true,
    lastSync: metadata.lastSync,
    pagesCount: metadata.pagesCount || 0,
    hasCache: !!metadata.lastSync
  });
});

// API endpoint for testing Confluence connection
router.get('/test', async (req, res) => {
  const confluenceConfig = loadConfluenceConfig();
  
  if (!confluenceConfig || !confluenceConfig.url || !confluenceConfig.token || !confluenceConfig.username) {
    return res.json({ 
      success: false, 
      error: 'Confluence is not configured. Please set up your Confluence credentials in Settings.'
    });
  }

  try {
    const baseUrl = getBaseUrl(confluenceConfig.url) || confluenceConfig.url;
    const userData = await makeRequestWithFallback(
      confluenceConfig,
      baseUrl,
      '/user/current',
      confluenceConfig.url
    );

    res.json({ 
      success: true, 
      message: 'Successfully connected to Confluence',
      authMethod: 'Personal Access Token',
      user: {
        name: userData.displayName || userData.username,
        email: userData.email,
        username: userData.username
      }
    });
  } catch (error) {
    console.error('Error testing Confluence connection:', error);
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

// API endpoint for getting a specific page by ID (from cache or fresh)
router.get('/pages/:pageId', async (req, res) => {
  const confluenceConfig = loadConfluenceConfig();
  const pageId = req.params.pageId;
  const forceRefresh = req.query.refresh === 'true';
  
  if (!confluenceConfig || !confluenceConfig.url) {
    return res.json({ 
      success: false, 
      error: 'Confluence is not configured.'
    });
  }

  // Try cache first unless force refresh
  if (!forceRefresh) {
    const cached = readCache('page', pageId);
    if (cached) {
      return res.json({ success: true, page: cached, fromCache: true });
    }
  }

  // Need credentials to fetch fresh
  if (!confluenceConfig.token || !confluenceConfig.username) {
    return res.json({ 
      success: false, 
      error: 'Confluence is not configured. Please set up your Confluence credentials in Settings.'
    });
  }

  try {
    const baseUrl = getBaseUrl(confluenceConfig.url) || confluenceConfig.url;
    const viewPrefix = getViewPrefix(confluenceConfig.url);
    
    const pageData = await makeRequestWithFallback(
      confluenceConfig,
      baseUrl,
      `/content/${pageId}?expand=body.view,version,space,ancestors,children.page`,
      confluenceConfig.url
    );

    const page = {
      id: pageData.id,
      title: pageData.title,
      type: pageData.type,
      status: pageData.status,
      body: pageData.body?.view?.value || '',
      version: pageData.version?.number,
      lastUpdated: pageData.version?.when,
      lastUpdatedBy: pageData.version?.by?.displayName || pageData.version?.by?.username,
      space: {
        key: pageData.space?.key,
        name: pageData.space?.name
      },
      ancestors: (pageData.ancestors || []).map(a => ({
        id: a.id,
        title: a.title
      })),
      children: (pageData.children?.page?.results || []).map(c => ({
        id: c.id,
        title: c.title
      })),
      url: `${baseUrl}${viewPrefix}/spaces/${pageData.space?.key}/pages/${pageData.id}`
    };

    // Cache the page
    writeCache('page', pageId, page);

    res.json({ success: true, page, fromCache: false });
  } catch (error) {
    console.error('Error fetching Confluence page:', error);
    
    // If fetch fails, try returning cached version
    const cached = readCache('page', pageId);
    if (cached) {
      return res.json({ success: true, page: cached, fromCache: true, fetchError: error.message });
    }
    
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

// API endpoint for getting child pages (from cache or fresh)
router.get('/pages/:pageId/children', async (req, res) => {
  const confluenceConfig = loadConfluenceConfig();
  const pageId = req.params.pageId;
  const forceRefresh = req.query.refresh === 'true';
  const limit = parseInt(req.query.limit) || 50;
  
  if (!confluenceConfig || !confluenceConfig.url) {
    return res.json({ 
      success: false, 
      error: 'Confluence is not configured.'
    });
  }

  // Try cache first unless force refresh
  if (!forceRefresh) {
    const cached = readCache('children', pageId);
    if (cached) {
      return res.json({ success: true, children: cached, fromCache: true });
    }
  }

  if (!confluenceConfig.token || !confluenceConfig.username) {
    return res.json({ 
      success: false, 
      error: 'Confluence is not configured. Please set up your Confluence credentials in Settings.'
    });
  }

  try {
    const baseUrl = getBaseUrl(confluenceConfig.url) || confluenceConfig.url;
    
    const childrenData = await makeRequestWithFallback(
      confluenceConfig,
      baseUrl,
      `/content/${pageId}/child/page?limit=${limit}&expand=version`,
      confluenceConfig.url
    );

    const children = (childrenData.results || []).map(page => ({
      id: page.id,
      title: page.title,
      type: page.type,
      status: page.status,
      version: page.version?.number,
      lastUpdated: page.version?.when,
      lastUpdatedBy: page.version?.by?.displayName || page.version?.by?.username,
      hasChildren: true // Assume they might have children
    }));

    // Cache the children
    writeCache('children', pageId, children);

    res.json({ success: true, children, fromCache: false });
  } catch (error) {
    console.error('Error fetching Confluence child pages:', error);
    
    // If fetch fails, try returning cached version
    const cached = readCache('children', pageId);
    if (cached) {
      return res.json({ success: true, children: cached, fromCache: true, fetchError: error.message });
    }
    
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

// API endpoint for getting space content (from cache or fresh)
router.get('/spaces/:spaceKey', async (req, res) => {
  const confluenceConfig = loadConfluenceConfig();
  const spaceKey = req.params.spaceKey;
  const forceRefresh = req.query.refresh === 'true';
  const limit = parseInt(req.query.limit) || 50;
  
  if (!confluenceConfig || !confluenceConfig.url) {
    return res.json({ 
      success: false, 
      error: 'Confluence is not configured.'
    });
  }

  // Try cache first unless force refresh
  if (!forceRefresh) {
    const cached = readCache('space', spaceKey);
    if (cached) {
      return res.json({ success: true, ...cached, fromCache: true });
    }
  }

  if (!confluenceConfig.token || !confluenceConfig.username) {
    return res.json({ 
      success: false, 
      error: 'Confluence is not configured. Please set up your Confluence credentials in Settings.'
    });
  }

  try {
    const baseUrl = getBaseUrl(confluenceConfig.url) || confluenceConfig.url;
    const viewPrefix = getViewPrefix(confluenceConfig.url);
    
    const spaceData = await makeRequestWithFallback(
      confluenceConfig,
      baseUrl,
      `/space/${spaceKey}?expand=description.plain,homepage`,
      confluenceConfig.url
    );

    // Get recent pages in the space
    const pagesData = await makeRequestWithFallback(
      confluenceConfig,
      baseUrl,
      `/content?spaceKey=${spaceKey}&type=page&limit=${limit}&expand=version,space&orderby=modified%20desc`,
      confluenceConfig.url
    );

    const space = {
      key: spaceData.key,
      name: spaceData.name,
      description: spaceData.description?.plain?.value || '',
      homepage: spaceData.homepage ? {
        id: spaceData.homepage.id,
        title: spaceData.homepage.title
      } : null,
      url: `${baseUrl}${viewPrefix}/spaces/${spaceData.key}`
    };

    const pages = (pagesData.results || []).map(page => ({
      id: page.id,
      title: page.title,
      type: page.type,
      status: page.status,
      version: page.version?.number,
      lastUpdated: page.version?.when,
      lastUpdatedBy: page.version?.by?.displayName || page.version?.by?.username,
      url: `${baseUrl}${viewPrefix}/spaces/${spaceKey}/pages/${page.id}`
    }));

    // Cache the space data
    writeCache('space', spaceKey, { space, pages });

    res.json({ success: true, space, pages, fromCache: false });
  } catch (error) {
    console.error('Error fetching Confluence space:', error);
    
    // If fetch fails, try returning cached version
    const cached = readCache('space', spaceKey);
    if (cached) {
      return res.json({ success: true, ...cached, fromCache: true, fetchError: error.message });
    }
    
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

// API endpoint to sync/refresh all data from Confluence
router.post('/sync', async (req, res) => {
  const confluenceConfig = loadConfluenceConfig();
  
  if (!confluenceConfig || !confluenceConfig.url || !confluenceConfig.token || !confluenceConfig.username) {
    return res.json({ 
      success: false, 
      error: 'Confluence is not configured. Please set up your Confluence credentials in Settings.'
    });
  }

  try {
    const parsed = parseConfluenceUrl(confluenceConfig.url);
    const baseUrl = getBaseUrl(confluenceConfig.url) || confluenceConfig.url;
    const viewPrefix = getViewPrefix(confluenceConfig.url);
    
    let rootPageId = parsed.pageId;
    let pagesCount = 0;
    
    // If we have a space key but no page ID, get the homepage
    if (!rootPageId && parsed.spaceKey) {
      const spaceData = await makeRequestWithFallback(
        confluenceConfig,
        baseUrl,
        `/space/${parsed.spaceKey}?expand=homepage`,
        confluenceConfig.url
      );
      
      if (spaceData.homepage) {
        rootPageId = spaceData.homepage.id;
      }
    }
    
    if (!rootPageId) {
      return res.json({ 
        success: false, 
        error: 'Could not determine root page to sync.'
      });
    }

    // Recursive function to sync a page and its children
    const syncPage = async (pageId, depth = 0, maxDepth = 3) => {
      try {
        // Fetch page content
        const pageData = await makeRequestWithFallback(
          confluenceConfig,
          baseUrl,
          `/content/${pageId}?expand=body.view,version,space,ancestors,children.page`,
          confluenceConfig.url
        );

        const page = {
          id: pageData.id,
          title: pageData.title,
          type: pageData.type,
          status: pageData.status,
          body: pageData.body?.view?.value || '',
          version: pageData.version?.number,
          lastUpdated: pageData.version?.when,
          lastUpdatedBy: pageData.version?.by?.displayName || pageData.version?.by?.username,
          space: {
            key: pageData.space?.key,
            name: pageData.space?.name
          },
          ancestors: (pageData.ancestors || []).map(a => ({
            id: a.id,
            title: a.title
          })),
          children: (pageData.children?.page?.results || []).map(c => ({
            id: c.id,
            title: c.title
          })),
          url: `${baseUrl}${viewPrefix}/spaces/${pageData.space?.key}/pages/${pageData.id}`
        };

        // Cache the page
        writeCache('page', pageId, page);
        pagesCount++;

        // Fetch and cache children
        if (page.children.length > 0) {
          const childrenData = await makeRequestWithFallback(
            confluenceConfig,
            baseUrl,
            `/content/${pageId}/child/page?limit=100&expand=version`,
            confluenceConfig.url
          );

          const children = (childrenData.results || []).map(child => ({
            id: child.id,
            title: child.title,
            type: child.type,
            status: child.status,
            version: child.version?.number,
            lastUpdated: child.version?.when,
            lastUpdatedBy: child.version?.by?.displayName || child.version?.by?.username,
            hasChildren: true
          }));

          writeCache('children', pageId, children);

          // Recursively sync children (with depth limit to avoid rate limiting)
          if (depth < maxDepth) {
            for (const child of children) {
              await syncPage(child.id, depth + 1, maxDepth);
              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } else {
          writeCache('children', pageId, []);
        }

        return page;
      } catch (error) {
        console.error(`Error syncing page ${pageId}:`, error.message);
        throw error;
      }
    };

    // Start sync from root page
    await syncPage(rootPageId);

    // Update metadata
    const metadata = {
      lastSync: new Date().toISOString(),
      pagesCount,
      rootPageId
    };
    writeMetadata(metadata);

    res.json({ 
      success: true, 
      message: `Successfully synced ${pagesCount} pages from Confluence`,
      ...metadata
    });
  } catch (error) {
    console.error('Error syncing Confluence:', error);
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

// API endpoint to parse a Confluence URL and get page/space info
router.post('/parse-url', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.json({ 
      success: false, 
      error: 'URL is required'
    });
  }

  const parsed = parseConfluenceUrl(url);
  const baseUrl = getBaseUrl(url);
  
  res.json({ 
    success: true, 
    parsed: {
      ...parsed,
      baseUrl
    }
  });
});

// API endpoint to get the configured space/page
router.get('/configured', async (req, res) => {
  const confluenceConfig = loadConfluenceConfig();
  
  if (!confluenceConfig || !confluenceConfig.url) {
    return res.json({ 
      success: false, 
      error: 'Confluence is not configured.'
    });
  }

  const parsed = parseConfluenceUrl(confluenceConfig.url);
  const baseUrl = getBaseUrl(confluenceConfig.url);
  const metadata = readMetadata();
  
  res.json({ 
    success: true, 
    config: {
      url: confluenceConfig.url,
      spaceKey: parsed.spaceKey,
      pageId: parsed.pageId,
      baseUrl
    },
    cache: {
      lastSync: metadata.lastSync,
      pagesCount: metadata.pagesCount || 0,
      hasCache: !!metadata.lastSync
    }
  });
});

// API endpoint for searching Confluence content
router.get('/search', async (req, res) => {
  const confluenceConfig = loadConfluenceConfig();
  
  if (!confluenceConfig || !confluenceConfig.url || !confluenceConfig.token || !confluenceConfig.username) {
    return res.json({ 
      success: false, 
      error: 'Confluence is not configured. Please set up your Confluence credentials in Settings.'
    });
  }

  try {
    const query = req.query.q || '';
    const spaceKey = req.query.spaceKey || '';
    const limit = parseInt(req.query.limit) || 25;
    const baseUrl = getBaseUrl(confluenceConfig.url) || confluenceConfig.url;
    const viewPrefix = getViewPrefix(confluenceConfig.url);
    
    // Build CQL query
    let cql = `type=page`;
    if (spaceKey) {
      cql += ` AND space="${spaceKey}"`;
    }
    if (query) {
      cql += ` AND (title~"${query}" OR text~"${query}")`;
    }
    cql += ` ORDER BY lastModified DESC`;
    
    const searchData = await makeRequestWithFallback(
      confluenceConfig,
      baseUrl,
      `/content/search?cql=${encodeURIComponent(cql)}&limit=${limit}&expand=version,space`,
      confluenceConfig.url
    );

    const results = (searchData.results || []).map(page => ({
      id: page.id,
      title: page.title,
      type: page.type,
      status: page.status,
      space: {
        key: page.space?.key,
        name: page.space?.name
      },
      version: page.version?.number,
      lastUpdated: page.version?.when,
      lastUpdatedBy: page.version?.by?.displayName || page.version?.by?.username,
      url: `${baseUrl}${viewPrefix}/spaces/${page.space?.key}/pages/${page.id}`
    }));

    res.json({ success: true, results });
  } catch (error) {
    console.error('Error searching Confluence:', error);
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

module.exports = router;
