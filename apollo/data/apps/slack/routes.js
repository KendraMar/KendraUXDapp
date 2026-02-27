const express = require('express');
const fs = require('fs');
const { loadSlackConfig } = require('../../../server/lib/config');
const { makeSlackRequest, getCachedUserImage, getUserImageCachePath } = require('../../../server/lib/slack');

const router = express.Router();

// API endpoint for serving cached user images
router.get('/images/:userId', (req, res) => {
  const userId = req.params.userId;
  const imagePath = getUserImageCachePath(userId);
  
  if (fs.existsSync(imagePath)) {
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    fs.createReadStream(imagePath).pipe(res);
  } else {
    res.status(404).json({ error: 'Image not found' });
  }
});

// API endpoint for testing Slack connection
router.get('/test', async (req, res) => {
  const slackConfig = loadSlackConfig();
  
  if (!slackConfig || !slackConfig.xoxcToken || !slackConfig.xoxdToken) {
    return res.json({ 
      success: false, 
      error: 'Slack is not configured. Please set up your Slack tokens in Settings.'
    });
  }

  try {
    // Test auth by getting user info
    const userData = await makeSlackRequest(slackConfig, '/api/auth.test');
    
    res.json({ 
      success: true, 
      message: 'Successfully connected to Slack',
      user: {
        name: userData.user,
        userId: userData.user_id,
        team: userData.team
      }
    });
  } catch (error) {
    console.error('Error testing Slack connection:', error);
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

// API endpoint for getting Slack channels the user is a member of
router.get('/channels', async (req, res) => {
  const slackConfig = loadSlackConfig();
  
  if (!slackConfig || !slackConfig.xoxcToken || !slackConfig.xoxdToken) {
    return res.json({ 
      success: false, 
      error: 'Slack is not configured. Please set up your Slack tokens in Settings.',
      channels: []
    });
  }

  try {
    const limit = parseInt(req.query.limit) || 200;
    let channels = [];
    
    // Try conversations.list first (works in more enterprise setups)
    try {
      const data = await makeSlackRequest(
        slackConfig, 
        `/api/conversations.list?types=public_channel,private_channel&exclude_archived=true&limit=${limit}`
      );
      
      channels = (data.channels || []).map(channel => ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.is_private,
        isMember: channel.is_member,
        numMembers: channel.num_members,
        topic: channel.topic?.value || '',
        purpose: channel.purpose?.value || ''
      }));
    } catch (listError) {
      console.log('conversations.list failed, trying users.conversations:', listError.message);
      
      // Fallback to users.conversations
      const data = await makeSlackRequest(
        slackConfig, 
        `/api/users.conversations?types=public_channel,private_channel&exclude_archived=true&limit=${limit}`
      );
      
      channels = (data.channels || []).map(channel => ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.is_private,
        isMember: channel.is_member,
        numMembers: channel.num_members,
        topic: channel.topic?.value || '',
        purpose: channel.purpose?.value || ''
      }));
    }

    // Sort alphabetically by name
    channels.sort((a, b) => a.name.localeCompare(b.name));

    res.json({ success: true, channels });
  } catch (error) {
    console.error('Error fetching Slack channels:', error);
    res.json({ 
      success: false, 
      error: error.message,
      channels: []
    });
  }
});

// API endpoint for getting channel history/messages
router.get('/channels/:channelId/messages', async (req, res) => {
  const slackConfig = loadSlackConfig();
  
  if (!slackConfig || !slackConfig.xoxcToken || !slackConfig.xoxdToken) {
    return res.json({ 
      success: false, 
      error: 'Slack is not configured. Please set up your Slack tokens in Settings.',
      messages: []
    });
  }

  try {
    const channelId = req.params.channelId;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get channel history
    const data = await makeSlackRequest(
      slackConfig, 
      `/api/conversations.history?channel=${channelId}&limit=${limit}`
    );
    
    const messages = (data.messages || []).map(msg => ({
      ts: msg.ts,
      text: msg.text,
      user: msg.user,
      type: msg.type,
      subtype: msg.subtype,
      threadTs: msg.thread_ts,
      replyCount: msg.reply_count,
      reactions: msg.reactions,
      timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString()
    }));

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching Slack messages:', error);
    res.json({ 
      success: false, 
      error: error.message,
      messages: []
    });
  }
});

// API endpoint for getting unread counts for channels
// Uses client.counts API which works with enterprise Slack
router.get('/unread', async (req, res) => {
  const slackConfig = loadSlackConfig();
  
  if (!slackConfig || !slackConfig.xoxcToken || !slackConfig.xoxdToken) {
    return res.json({ 
      success: false, 
      error: 'Slack is not configured. Please set up your Slack tokens in Settings.',
      channels: [],
      directMessages: []
    });
  }

  try {
    // Use client.counts API which works with session tokens in enterprise workspaces
    const countsData = await makeSlackRequest(
      slackConfig, 
      '/api/client.counts'
    );
    
    // client.counts returns channels with unread info
    const channelsWithUnread = [];
    const directMessages = [];
    
    // Process channels from the counts response
    const allChannels = countsData.channels || [];
    const allIms = countsData.ims || [];
    const allMpims = countsData.mpims || [];
    
    // Filter to regular channels (C prefix) and sort by has_unreads first
    const sortedChannels = allChannels
      .filter(ch => ch.id && ch.id.startsWith('C')) // Only regular channels (C prefix)
      .sort((a, b) => {
        if (a.has_unreads && !b.has_unreads) return -1;
        if (!a.has_unreads && b.has_unreads) return 1;
        return (b.mention_count || 0) - (a.mention_count || 0);
      });
    
    // Process DMs (D prefix) and Group DMs (G prefix)
    const sortedDMs = [...allIms, ...allMpims]
      .filter(dm => dm.id && (dm.id.startsWith('D') || dm.id.startsWith('G')))
      .sort((a, b) => {
        if (a.has_unreads && !b.has_unreads) return -1;
        if (!a.has_unreads && b.has_unreads) return 1;
        return (b.mention_count || 0) - (a.mention_count || 0);
      });
    
    // Fetch channel info for each (limit to 100 to avoid rate limiting)
    const channelsToFetch = sortedChannels.slice(0, 100);
    
    // Fetch in parallel batches of 10 to speed things up
    const batchSize = 10;
    for (let i = 0; i < channelsToFetch.length; i += batchSize) {
      const batch = channelsToFetch.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (channel) => {
          try {
            const infoData = await makeSlackRequest(
              slackConfig,
              `/api/conversations.info?channel=${channel.id}`
            );
            return {
              id: channel.id,
              name: infoData.channel?.name || channel.id,
              isPrivate: infoData.channel?.is_private || false,
              unreadCount: channel.mention_count || 0,
              unreadCountDisplay: channel.mention_count || 0,
              hasUnread: channel.has_unreads || false
            };
          } catch (infoError) {
            // If we can't get info, use the ID as name
            return {
              id: channel.id,
              name: channel.id,
              isPrivate: false,
              unreadCount: channel.mention_count || 0,
              hasUnread: channel.has_unreads || false
            };
          }
        })
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          channelsWithUnread.push(result.value);
        }
      }
    }
    
    // Fetch DM info for each (limit to 50 to avoid rate limiting)
    const dmsToFetch = sortedDMs.slice(0, 50);
    
    for (let i = 0; i < dmsToFetch.length; i += batchSize) {
      const batch = dmsToFetch.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (dm) => {
          try {
            const infoData = await makeSlackRequest(
              slackConfig,
              `/api/conversations.info?channel=${dm.id}`
            );
            
            const channel = infoData.channel;
            const isGroupDM = dm.id.startsWith('G') || channel?.is_mpim;
            let displayName = dm.id;
            let userIds = [];
            let userImage = null;
            
            if (isGroupDM) {
              // Group DM - try to get member names
              if (channel?.purpose?.value && channel.purpose.value.trim()) {
                displayName = channel.purpose.value;
              } else if (channel?.name && !channel.name.startsWith('mpdm-')) {
                displayName = channel.name;
              } else {
                // Try to fetch member names for better display
                try {
                  const membersData = await makeSlackRequest(
                    slackConfig,
                    `/api/conversations.members?channel=${dm.id}&limit=10`
                  );
                  const memberIds = membersData.members || [];
                  
                  // Fetch names for up to 5 members
                  const memberNames = [];
                  for (const memberId of memberIds.slice(0, 5)) {
                    try {
                      const userData = await makeSlackRequest(
                        slackConfig,
                        `/api/users.info?user=${memberId}`
                      );
                      const name = userData.user?.profile?.display_name || 
                                   userData.user?.real_name || 
                                   userData.user?.name;
                      if (name) memberNames.push(name);
                    } catch (e) {
                      // Skip failed user lookups
                    }
                  }
                  
                  if (memberNames.length > 0) {
                    displayName = memberNames.join(', ');
                    if (memberIds.length > 5) {
                      displayName += ` +${memberIds.length - 5}`;
                    }
                  } else {
                    displayName = `Group (${channel?.num_members || memberIds.length || 'unknown'} people)`;
                  }
                } catch (membersError) {
                  displayName = channel?.name || `Group (${channel?.num_members || 'unknown'} people)`;
                }
              }
            } else {
              // 1:1 DM - we need to get the user info
              const userId = channel?.user;
              if (userId) {
                userIds = [userId];
                try {
                  const userData = await makeSlackRequest(
                    slackConfig,
                    `/api/users.info?user=${userId}`
                  );
                  displayName = userData.user?.profile?.display_name || 
                               userData.user?.real_name || 
                               userData.user?.name || 
                               userId;
                  
                  // Cache the user's profile image
                  const originalImageUrl = userData.user?.profile?.image_72;
                  if (originalImageUrl) {
                    try {
                      const cachedImageUrl = await getCachedUserImage(originalImageUrl, userId);
                      userIds.push(cachedImageUrl); // Store cached URL at index 1
                    } catch (cacheError) {
                      console.log(`Could not cache image for ${userId}:`, cacheError.message);
                      userIds.push(originalImageUrl); // Fallback to original URL
                    }
                  }
                } catch (userError) {
                  displayName = userId;
                }
              }
            }
            
            return {
              id: dm.id,
              name: displayName,
              isGroupDM: isGroupDM,
              userId: userIds[0] || null,
              unreadCount: dm.mention_count || 0,
              unreadCountDisplay: dm.mention_count || 0,
              hasUnread: dm.has_unreads || false,
              userImage: userIds[1] || null // Cached image URL
            };
          } catch (infoError) {
            // If we can't get info, use the ID as name
            return {
              id: dm.id,
              name: dm.id,
              isGroupDM: dm.id.startsWith('G'),
              userId: null,
              unreadCount: dm.mention_count || 0,
              hasUnread: dm.has_unreads || false
            };
          }
        })
      );
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          directMessages.push(result.value);
        }
      }
    }

    // If no channels from counts, try alternative method
    if (channelsWithUnread.length === 0) {
      // Fallback: try conversations.list which sometimes works - get all channels
      try {
        const listData = await makeSlackRequest(
          slackConfig,
          '/api/conversations.list?types=public_channel,private_channel&exclude_archived=true&limit=200'
        );
        
        for (const channel of (listData.channels || [])) {
          channelsWithUnread.push({
            id: channel.id,
            name: channel.name,
            isPrivate: channel.is_private,
            unreadCount: 0,
            hasUnread: false
          });
        }
      } catch (listError) {
        console.error('Fallback conversations.list also failed:', listError.message);
      }
    }
    
    // If no DMs from counts, try alternative method
    if (directMessages.length === 0) {
      try {
        const listData = await makeSlackRequest(
          slackConfig,
          '/api/conversations.list?types=im,mpim&exclude_archived=true&limit=50'
        );
        
        for (const dm of (listData.channels || [])) {
          directMessages.push({
            id: dm.id,
            name: dm.user || dm.name || dm.id,
            isGroupDM: dm.is_mpim || false,
            userId: dm.user || null,
            unreadCount: 0,
            hasUnread: false
          });
        }
      } catch (listError) {
        console.error('Fallback conversations.list for DMs also failed:', listError.message);
      }
    }

    // Sort alphabetically by name
    channelsWithUnread.sort((a, b) => a.name.localeCompare(b.name));
    
    // Sort DMs: unreads first, then alphabetically
    directMessages.sort((a, b) => {
      if (a.hasUnread && !b.hasUnread) return -1;
      if (!a.hasUnread && b.hasUnread) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ success: true, channels: channelsWithUnread, directMessages });
  } catch (error) {
    console.error('Error fetching Slack unread counts:', error);
    
    // If client.counts fails, try simpler approach with conversations.list - get all channels
    try {
      const listData = await makeSlackRequest(
        slackConfig,
        '/api/conversations.list?types=public_channel&exclude_archived=true&limit=200'
      );
      
      const channels = (listData.channels || []).map(channel => ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.is_private || false,
        unreadCount: 0,
        hasUnread: false
      }));
      
      // Sort alphabetically by name
      channels.sort((a, b) => a.name.localeCompare(b.name));
      
      res.json({ success: true, channels, directMessages: [] });
    } catch (fallbackError) {
      res.json({ 
        success: false, 
        error: `${error.message}. Fallback also failed: ${fallbackError.message}`,
        channels: [],
        directMessages: []
      });
    }
  }
});

// API endpoint for getting thread replies
router.get('/channels/:channelId/threads/:threadTs', async (req, res) => {
  const slackConfig = loadSlackConfig();
  
  if (!slackConfig || !slackConfig.xoxcToken || !slackConfig.xoxdToken) {
    return res.json({ 
      success: false, 
      error: 'Slack is not configured. Please set up your Slack tokens in Settings.',
      replies: []
    });
  }

  try {
    const channelId = req.params.channelId;
    const threadTs = req.params.threadTs;
    const limit = parseInt(req.query.limit) || 50;
    
    // Get thread replies using conversations.replies
    const data = await makeSlackRequest(
      slackConfig, 
      `/api/conversations.replies?channel=${channelId}&ts=${threadTs}&limit=${limit}`
    );
    
    // Filter out the parent message (first message in replies is the parent)
    const replies = (data.messages || [])
      .slice(1) // Skip the parent message
      .map(msg => ({
        ts: msg.ts,
        text: msg.text,
        user: msg.user,
        type: msg.type,
        subtype: msg.subtype,
        threadTs: msg.thread_ts,
        timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString()
      }));

    res.json({ success: true, replies });
  } catch (error) {
    console.error('Error fetching Slack thread replies:', error);
    res.json({ 
      success: false, 
      error: error.message,
      replies: []
    });
  }
});

// API endpoint for getting user info by ID
router.get('/users/:userId', async (req, res) => {
  const slackConfig = loadSlackConfig();
  
  if (!slackConfig || !slackConfig.xoxcToken || !slackConfig.xoxdToken) {
    return res.json({ 
      success: false, 
      error: 'Slack is not configured.'
    });
  }

  try {
    const userId = req.params.userId;
    const data = await makeSlackRequest(
      slackConfig, 
      `/api/users.info?user=${userId}`
    );
    
    // Cache the profile image
    const originalImageUrl = data.user?.profile?.image_72;
    let cachedImageUrl = originalImageUrl;
    
    if (originalImageUrl) {
      try {
        cachedImageUrl = await getCachedUserImage(originalImageUrl, userId);
      } catch (cacheError) {
        console.log(`Could not cache image for ${userId}:`, cacheError.message);
      }
    }
    
    res.json({ 
      success: true, 
      user: {
        id: data.user?.id,
        name: data.user?.name,
        realName: data.user?.real_name,
        displayName: data.user?.profile?.display_name,
        image: cachedImageUrl
      }
    });
  } catch (error) {
    console.error('Error fetching Slack user:', error);
    res.json({ 
      success: false, 
      error: error.message
    });
  }
});

module.exports = router;

