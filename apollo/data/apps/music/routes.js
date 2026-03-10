const express = require('express');
const { loadAppleMusicConfig } = require('../../../server/lib/config');

const router = express.Router();

// Apple Music AMP API (used by web player)
const APPLE_MUSIC_AMP_API = 'https://amp-api.music.apple.com/v1';

// Helper to clean up tokens (remove prefixes, trim whitespace)
function cleanToken(token) {
  if (!token) return null;
  let cleaned = token.trim();
  // Remove "Bearer " prefix if accidentally included
  if (cleaned.toLowerCase().startsWith('bearer ')) {
    cleaned = cleaned.substring(7).trim();
  }
  // Remove any quotes that might have been copied
  cleaned = cleaned.replace(/^["']|["']$/g, '');
  return cleaned;
}

// Get the bearer token from Apple Music web (this is a public token embedded in their JS)
// This token is used by the web player and changes periodically
const getAppleMusicWebToken = async () => {
  try {
    // First, try to get the token from the main music.apple.com page
    const response = await fetch('https://music.apple.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch Apple Music page:', response.status);
      return null;
    }
    
    const html = await response.text();
    
    // Look for JWT token patterns in the page
    // Apple embeds the token in various places
    const patterns = [
      // Pattern in script tags or JSON config
      /"(?:developerToken|token)"\s*:\s*"(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)"/,
      // Pattern in meta tags
      /content="(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)"/,
      // Pattern in inline JavaScript
      /['"]?(eyJ[A-Za-z0-9_-]{100,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)['"]?/
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].startsWith('eyJ')) {
        // Verify it's a valid JWT structure (3 parts separated by dots)
        const parts = match[1].split('.');
        if (parts.length === 3 && parts[0].length > 10) {
          console.log('Found Apple Music web token');
          return match[1];
        }
      }
    }
    
    // If we couldn't find it in the main page, try the JS bundle
    // Look for script src that might contain the token
    const scriptMatch = html.match(/src="([^"]*assets[^"]*\.js)"/);
    if (scriptMatch && scriptMatch[1]) {
      let jsUrl = scriptMatch[1];
      if (jsUrl.startsWith('/')) {
        jsUrl = 'https://music.apple.com' + jsUrl;
      }
      
      try {
        const jsResponse = await fetch(jsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
          }
        });
        
        if (jsResponse.ok) {
          const jsContent = await jsResponse.text();
          const jsTokenMatch = jsContent.match(/(eyJ[A-Za-z0-9_-]{100,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/);
          if (jsTokenMatch && jsTokenMatch[1]) {
            console.log('Found Apple Music token in JS bundle');
            return jsTokenMatch[1];
          }
        }
      } catch (e) {
        console.error('Error fetching JS bundle:', e.message);
      }
    }
    
    console.error('Could not find Apple Music token in page');
    return null;
  } catch (error) {
    console.error('Error fetching Apple Music web token:', error);
    return null;
  }
};

// Cache the web token (it's valid for a while)
let cachedWebToken = null;
let tokenFetchTime = 0;
const TOKEN_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

const getWebToken = async () => {
  const now = Date.now();
  if (cachedWebToken && (now - tokenFetchTime) < TOKEN_CACHE_DURATION) {
    return cachedWebToken;
  }
  
  cachedWebToken = await getAppleMusicWebToken();
  tokenFetchTime = now;
  return cachedWebToken;
};

// Helper function to make Apple Music API requests
async function makeAppleMusicRequest(config, endpoint, method = 'GET', body = null) {
  // Clean and use the user-provided developer token, or try to get one from the web as fallback
  let developerToken = cleanToken(config.developerToken);
  
  if (!developerToken) {
    // Try to get token from web as fallback
    developerToken = await getWebToken();
  }
  
  if (!developerToken) {
    throw new Error('No Developer Token available. Please provide the Authorization Bearer token from music.apple.com.');
  }
  
  // Clean the media user token
  const mediaUserToken = cleanToken(config.mediaUserToken);
  
  if (!mediaUserToken) {
    throw new Error('No Media User Token available. Please provide the media-user-token cookie from music.apple.com.');
  }
  
  const url = `${APPLE_MUSIC_AMP_API}${endpoint}`;
  
  // Log token info for debugging (prefixes only)
  console.log(`Developer token starts with: ${developerToken.substring(0, 20)}...`);
  console.log(`Media user token starts with: ${mediaUserToken.substring(0, 20)}...`);
  
  // Build headers - Apple uses 'Media-User-Token' header for the AMP API
  const headers = {
    'Authorization': `Bearer ${developerToken}`,
    'Media-User-Token': mediaUserToken,
    'Content-Type': 'application/json',
    'Origin': 'https://music.apple.com',
    'Referer': 'https://music.apple.com/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9'
  };
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`Making Apple Music request to: ${url}`);
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Apple Music API error response: ${response.status} - ${errorText.substring(0, 500)}`);
    
    // Check if we got HTML instead of JSON (auth error)
    if (errorText.startsWith('<!DOCTYPE') || errorText.startsWith('<html')) {
      // Try to extract any error message from the HTML
      const titleMatch = errorText.match(/<title>([^<]+)<\/title>/i);
      const errorTitle = titleMatch ? titleMatch[1] : 'Unknown error';
      
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed (${response.status}). Your tokens may be expired or invalid. Please get fresh tokens from music.apple.com.`);
      }
      
      throw new Error(`Apple Music returned an error page: ${errorTitle} (${response.status})`);
    }
    
    // For 401 errors, provide more specific guidance
    if (response.status === 401) {
      throw new Error(`Authentication failed (401). This usually means your tokens have expired. Please get fresh tokens from music.apple.com. The Developer Token (JWT) typically expires after a short period.`);
    }
    
    throw new Error(`Apple Music API error: ${response.status} - ${errorText.substring(0, 200)}`);
  }
  
  // Verify we got JSON
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      throw new Error('Authentication failed. Your tokens may be expired or invalid.');
    }
    throw new Error(`Unexpected response type: ${contentType}`);
  }
  
  return response.json();
}

// Debug endpoint to check token status
router.get('/debug', async (req, res) => {
  try {
    const config = loadAppleMusicConfig();
    const webToken = await getWebToken();
    
    // Clean tokens for analysis
    const cleanedDevToken = cleanToken(config?.developerToken);
    const cleanedMediaToken = cleanToken(config?.mediaUserToken);
    
    // Check if developer token looks like a JWT (has 3 dot-separated parts)
    const devTokenParts = cleanedDevToken ? cleanedDevToken.split('.') : [];
    const isValidJwtFormat = devTokenParts.length === 3 && devTokenParts[0].startsWith('eyJ');
    
    res.json({
      hasConfig: !!config,
      developerToken: {
        provided: !!(config?.developerToken),
        cleanedLength: cleanedDevToken?.length || 0,
        prefix: cleanedDevToken?.substring(0, 30) || 'N/A',
        looksLikeJwt: isValidJwtFormat,
        jwtParts: devTokenParts.length
      },
      mediaUserToken: {
        provided: !!(config?.mediaUserToken),
        cleanedLength: cleanedMediaToken?.length || 0,
        prefix: cleanedMediaToken?.substring(0, 20) || 'N/A'
      },
      webTokenFallback: {
        available: !!webToken,
        length: webToken?.length || 0
      }
    });
  } catch (error) {
    res.json({
      error: error.message
    });
  }
});

// Get tokens for MusicKit JS initialization (frontend)
router.get('/musickit-token', async (req, res) => {
  const config = loadAppleMusicConfig();
  
  if (!config || !config.developerToken) {
    return res.json({ 
      success: false, 
      error: 'Apple Music is not configured.'
    });
  }
  
  const developerToken = cleanToken(config.developerToken);
  const mediaUserToken = cleanToken(config.mediaUserToken);
  
  if (!developerToken) {
    return res.json({
      success: false,
      error: 'Developer token not available.'
    });
  }
  
  res.json({
    success: true,
    developerToken,
    mediaUserToken: mediaUserToken || null
  });
});

// Test connection endpoint
router.get('/test', async (req, res) => {
  const config = loadAppleMusicConfig();
  
  if (!config || !config.mediaUserToken) {
    return res.json({ 
      success: false, 
      error: 'Apple Music is not configured. Please set up your tokens in Settings.'
    });
  }
  
  // Validate token formats
  if (config.mediaUserToken.length < 100) {
    return res.json({
      success: false,
      error: 'The Media User Token appears to be too short. Make sure you copied the entire value.'
    });
  }
  
  // Check for developer token
  if (!config.developerToken) {
    // Try to get web token as fallback
    const webToken = await getWebToken();
    if (!webToken) {
      return res.json({
        success: false,
        error: 'No Developer Token provided. Please provide the Authorization Bearer token from the Network tab when browsing music.apple.com.'
      });
    }
  }

  try {
    // Test by getting the user's storefront (region)
    const data = await makeAppleMusicRequest(config, '/me/storefront');
    
    res.json({ 
      success: true, 
      message: 'Successfully connected to Apple Music',
      info: {
        storefront: data.data?.[0]?.id || 'Unknown',
        name: data.data?.[0]?.attributes?.name || 'Apple Music'
      }
    });
  } catch (error) {
    console.error('Error testing Apple Music connection:', error);
    
    let errorMessage = error.message;
    
    // Provide helpful suggestions based on the error
    if (errorMessage.includes('expired') || errorMessage.includes('invalid') || errorMessage.includes('Authentication')) {
      errorMessage += '\n\nTip: Both tokens expire periodically. Please get fresh tokens from music.apple.com and try again.';
    }
    
    res.json({ 
      success: false, 
      error: errorMessage
    });
  }
});

// Get user's library songs
router.get('/library/songs', async (req, res) => {
  const config = loadAppleMusicConfig();
  
  if (!config || !config.mediaUserToken) {
    return res.json({ 
      success: false, 
      error: 'Apple Music is not configured.',
      songs: []
    });
  }

  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const data = await makeAppleMusicRequest(
      config, 
      `/me/library/songs?limit=${limit}&offset=${offset}&include=artists,albums`
    );
    
    const songs = (data.data || []).map(song => ({
      id: song.id,
      title: song.attributes?.name || 'Unknown',
      artist: song.attributes?.artistName || 'Unknown Artist',
      album: song.attributes?.albumName || 'Unknown Album',
      duration: song.attributes?.durationInMillis || 0,
      genre: song.attributes?.genreNames?.[0] || 'Unknown',
      playCount: song.attributes?.playParams?.playCount || 0,
      trackNumber: song.attributes?.trackNumber,
      discNumber: song.attributes?.discNumber,
      artwork: song.attributes?.artwork ? {
        url: song.attributes.artwork.url
          ?.replace('{w}', '200')
          ?.replace('{h}', '200'),
        width: 200,
        height: 200
      } : null,
      playParams: song.attributes?.playParams,
      releaseDate: song.attributes?.releaseDate
    }));
    
    res.json({ 
      success: true, 
      songs,
      meta: {
        total: data.meta?.total || songs.length,
        offset,
        limit
      },
      next: data.next || null
    });
  } catch (error) {
    console.error('Error fetching Apple Music library songs:', error);
    res.json({ 
      success: false, 
      error: error.message,
      songs: []
    });
  }
});

// Search library
router.get('/library/search', async (req, res) => {
  const config = loadAppleMusicConfig();
  
  if (!config || !config.mediaUserToken) {
    return res.json({ 
      success: false, 
      error: 'Apple Music is not configured.',
      results: []
    });
  }

  try {
    const term = req.query.term || '';
    const types = req.query.types || 'library-songs';
    const limit = parseInt(req.query.limit) || 25;
    
    if (!term) {
      return res.json({
        success: true,
        results: []
      });
    }
    
    const data = await makeAppleMusicRequest(
      config, 
      `/me/library/search?term=${encodeURIComponent(term)}&types=${types}&limit=${limit}`
    );
    
    // Extract songs from search results
    const songs = (data.results?.['library-songs']?.data || []).map(song => ({
      id: song.id,
      title: song.attributes?.name || 'Unknown',
      artist: song.attributes?.artistName || 'Unknown Artist',
      album: song.attributes?.albumName || 'Unknown Album',
      duration: song.attributes?.durationInMillis || 0,
      genre: song.attributes?.genreNames?.[0] || 'Unknown',
      playCount: song.attributes?.playParams?.playCount || 0,
      artwork: song.attributes?.artwork ? {
        url: song.attributes.artwork.url
          ?.replace('{w}', '200')
          ?.replace('{h}', '200'),
        width: 200,
        height: 200
      } : null,
      playParams: song.attributes?.playParams
    }));
    
    res.json({ 
      success: true, 
      results: songs
    });
  } catch (error) {
    console.error('Error searching Apple Music library:', error);
    res.json({ 
      success: false, 
      error: error.message,
      results: []
    });
  }
});

// Get library playlists
router.get('/library/playlists', async (req, res) => {
  const config = loadAppleMusicConfig();
  
  if (!config || !config.mediaUserToken) {
    return res.json({ 
      success: false, 
      error: 'Apple Music is not configured.',
      playlists: []
    });
  }

  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const data = await makeAppleMusicRequest(
      config, 
      `/me/library/playlists?limit=${limit}&offset=${offset}`
    );
    
    const playlists = (data.data || []).map(playlist => ({
      id: playlist.id,
      name: playlist.attributes?.name || 'Unknown Playlist',
      description: playlist.attributes?.description?.standard || '',
      trackCount: playlist.attributes?.playParams?.tracks?.length || 0,
      artwork: playlist.attributes?.artwork ? {
        url: playlist.attributes.artwork.url
          ?.replace('{w}', '200')
          ?.replace('{h}', '200'),
        width: 200,
        height: 200
      } : null,
      canEdit: playlist.attributes?.canEdit || false,
      dateAdded: playlist.attributes?.dateAdded
    }));
    
    res.json({ 
      success: true, 
      playlists,
      meta: {
        total: data.meta?.total || playlists.length,
        offset,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching Apple Music playlists:', error);
    res.json({ 
      success: false, 
      error: error.message,
      playlists: []
    });
  }
});

// Get library albums
router.get('/library/albums', async (req, res) => {
  const config = loadAppleMusicConfig();
  
  if (!config || !config.mediaUserToken) {
    return res.json({ 
      success: false, 
      error: 'Apple Music is not configured.',
      albums: []
    });
  }

  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const data = await makeAppleMusicRequest(
      config, 
      `/me/library/albums?limit=${limit}&offset=${offset}`
    );
    
    const albums = (data.data || []).map(album => ({
      id: album.id,
      name: album.attributes?.name || 'Unknown Album',
      artist: album.attributes?.artistName || 'Unknown Artist',
      trackCount: album.attributes?.trackCount || 0,
      genre: album.attributes?.genreNames?.[0] || 'Unknown',
      artwork: album.attributes?.artwork ? {
        url: album.attributes.artwork.url
          ?.replace('{w}', '200')
          ?.replace('{h}', '200'),
        width: 200,
        height: 200
      } : null,
      releaseDate: album.attributes?.releaseDate,
      dateAdded: album.attributes?.dateAdded
    }));
    
    res.json({ 
      success: true, 
      albums,
      meta: {
        total: data.meta?.total || albums.length,
        offset,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching Apple Music albums:', error);
    res.json({ 
      success: false, 
      error: error.message,
      albums: []
    });
  }
});

// Get library artists
router.get('/library/artists', async (req, res) => {
  const config = loadAppleMusicConfig();
  
  if (!config || !config.mediaUserToken) {
    return res.json({ 
      success: false, 
      error: 'Apple Music is not configured.',
      artists: []
    });
  }

  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const data = await makeAppleMusicRequest(
      config, 
      `/me/library/artists?limit=${limit}&offset=${offset}`
    );
    
    const artists = (data.data || []).map(artist => ({
      id: artist.id,
      name: artist.attributes?.name || 'Unknown Artist'
    }));
    
    res.json({ 
      success: true, 
      artists,
      meta: {
        total: data.meta?.total || artists.length,
        offset,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching Apple Music artists:', error);
    res.json({ 
      success: false, 
      error: error.message,
      artists: []
    });
  }
});

// Get recently played
router.get('/recent', async (req, res) => {
  const config = loadAppleMusicConfig();
  
  if (!config || !config.mediaUserToken) {
    return res.json({ 
      success: false, 
      error: 'Apple Music is not configured.',
      tracks: []
    });
  }

  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const data = await makeAppleMusicRequest(
      config, 
      `/me/recent/played/tracks?limit=${limit}`
    );
    
    const tracks = (data.data || []).map(track => ({
      id: track.id,
      title: track.attributes?.name || 'Unknown',
      artist: track.attributes?.artistName || 'Unknown Artist',
      album: track.attributes?.albumName || 'Unknown Album',
      duration: track.attributes?.durationInMillis || 0,
      artwork: track.attributes?.artwork ? {
        url: track.attributes.artwork.url
          ?.replace('{w}', '200')
          ?.replace('{h}', '200'),
        width: 200,
        height: 200
      } : null,
      playParams: track.attributes?.playParams
    }));
    
    res.json({ 
      success: true, 
      tracks
    });
  } catch (error) {
    console.error('Error fetching recently played:', error);
    res.json({ 
      success: false, 
      error: error.message,
      tracks: []
    });
  }
});

// Get a specific song by ID
router.get('/library/songs/:id', async (req, res) => {
  const config = loadAppleMusicConfig();
  
  if (!config || !config.mediaUserToken) {
    return res.json({ 
      success: false, 
      error: 'Apple Music is not configured.',
      song: null
    });
  }

  try {
    const songId = req.params.id;
    
    const data = await makeAppleMusicRequest(
      config, 
      `/me/library/songs/${songId}`
    );
    
    const song = data.data?.[0];
    if (!song) {
      return res.json({
        success: false,
        error: 'Song not found',
        song: null
      });
    }
    
    res.json({ 
      success: true, 
      song: {
        id: song.id,
        title: song.attributes?.name || 'Unknown',
        artist: song.attributes?.artistName || 'Unknown Artist',
        album: song.attributes?.albumName || 'Unknown Album',
        duration: song.attributes?.durationInMillis || 0,
        genre: song.attributes?.genreNames?.[0] || 'Unknown',
        playCount: song.attributes?.playParams?.playCount || 0,
        trackNumber: song.attributes?.trackNumber,
        discNumber: song.attributes?.discNumber,
        artwork: song.attributes?.artwork ? {
          url: song.attributes.artwork.url
            ?.replace('{w}', '400')
            ?.replace('{h}', '400'),
          width: 400,
          height: 400
        } : null,
        playParams: song.attributes?.playParams,
        releaseDate: song.attributes?.releaseDate
      }
    });
  } catch (error) {
    console.error('Error fetching song:', error);
    res.json({ 
      success: false, 
      error: error.message,
      song: null
    });
  }
});

// Get library summary/stats
router.get('/summary', async (req, res) => {
  const config = loadAppleMusicConfig();
  
  if (!config || !config.mediaUserToken) {
    return res.json({ 
      success: false, 
      error: 'Apple Music is not configured.',
      summary: null
    });
  }

  try {
    // Fetch counts for songs, albums, artists, playlists in parallel
    const [songs, albums, artists, playlists] = await Promise.all([
      makeAppleMusicRequest(config, '/me/library/songs?limit=1'),
      makeAppleMusicRequest(config, '/me/library/albums?limit=1'),
      makeAppleMusicRequest(config, '/me/library/artists?limit=1'),
      makeAppleMusicRequest(config, '/me/library/playlists?limit=1')
    ]);
    
    res.json({ 
      success: true, 
      summary: {
        songCount: songs.meta?.total || 0,
        albumCount: albums.meta?.total || 0,
        artistCount: artists.meta?.total || 0,
        playlistCount: playlists.meta?.total || 0
      }
    });
  } catch (error) {
    console.error('Error fetching Apple Music summary:', error);
    res.json({ 
      success: false, 
      error: error.message,
      summary: null
    });
  }
});

module.exports = router;
