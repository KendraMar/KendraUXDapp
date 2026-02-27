const express = require('express');
const path = require('path');
const fs = require('fs');
const { dataDir } = require('../lib/config');

const router = express.Router();

const getChatsFile = () => path.join(dataDir, 'chats.json');

const readChats = () => {
  const file = getChatsFile();
  
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  }
  
  return { pinnedChats: [], dockedChats: [] };
};

const writeChats = (data) => {
  const file = getChatsFile();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Get all pinned chats
router.get('/pinned', (req, res) => {
  try {
    const data = readChats();
    res.json({ success: true, pinnedChats: data.pinnedChats || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pinned chats for a specific space
router.get('/pinned/space/:spaceId', (req, res) => {
  try {
    const { spaceId } = req.params;
    const data = readChats();
    const spacePinnedChats = (data.pinnedChats || []).filter(
      chat => chat.spaceId === spaceId || (!chat.spaceId && spaceId === 'default')
    );
    res.json({ success: true, pinnedChats: spacePinnedChats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pin a new chat
router.post('/pinned', (req, res) => {
  try {
    const { query, response, history, assistant, spaceId } = req.body;
    const data = readChats();
    
    const newChat = {
      id: `chat-${Date.now()}`,
      spaceId: spaceId || 'default',
      query,
      response,
      history: history || [],
      assistant: assistant || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.pinnedChats = data.pinnedChats || [];
    data.pinnedChats.unshift(newChat); // Add to beginning (most recent first)
    
    writeChats(data);
    res.json({ success: true, chat: newChat });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a pinned chat
router.put('/pinned/:chatId', (req, res) => {
  try {
    const { chatId } = req.params;
    const updates = req.body;
    const data = readChats();
    
    const chatIndex = (data.pinnedChats || []).findIndex(c => c.id === chatId);
    if (chatIndex === -1) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    data.pinnedChats[chatIndex] = {
      ...data.pinnedChats[chatIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    writeChats(data);
    res.json({ success: true, chat: data.pinnedChats[chatIndex] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unpin (delete) a chat
router.delete('/pinned/:chatId', (req, res) => {
  try {
    const { chatId } = req.params;
    const data = readChats();
    
    const chatIndex = (data.pinnedChats || []).findIndex(c => c.id === chatId);
    if (chatIndex === -1) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }
    
    const removedChat = data.pinnedChats.splice(chatIndex, 1)[0];
    writeChats(data);
    
    res.json({ success: true, chat: removedChat });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reorder pinned chats
router.put('/pinned/reorder', (req, res) => {
  try {
    const { chatIds } = req.body;
    const data = readChats();
    
    // Create a map of existing chats
    const chatMap = {};
    (data.pinnedChats || []).forEach(chat => {
      chatMap[chat.id] = chat;
    });
    
    // Reorder based on provided IDs
    const reorderedChats = chatIds
      .filter(id => chatMap[id])
      .map(id => chatMap[id]);
    
    // Add any chats that weren't in the provided list (shouldn't happen, but safety)
    const reorderedIds = new Set(chatIds);
    (data.pinnedChats || []).forEach(chat => {
      if (!reorderedIds.has(chat.id)) {
        reorderedChats.push(chat);
      }
    });
    
    data.pinnedChats = reorderedChats;
    writeChats(data);
    
    res.json({ success: true, pinnedChats: data.pinnedChats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DOCKED CHATS ====================

// Get all docked chats
router.get('/docked', (req, res) => {
  try {
    const data = readChats();
    res.json({ success: true, dockedChats: data.dockedChats || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get docked chat for a specific space
router.get('/docked/space/:spaceId', (req, res) => {
  try {
    const { spaceId } = req.params;
    const data = readChats();
    const spaceDockedChat = (data.dockedChats || []).find(
      chat => chat.spaceId === spaceId || (!chat.spaceId && spaceId === 'default')
    );
    res.json({ success: true, dockedChat: spaceDockedChat || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create/save a docked chat
router.post('/docked', (req, res) => {
  try {
    const { query, response, history, assistant, spaceId, isLoading, isComplete } = req.body;
    const data = readChats();
    
    const newChat = {
      id: `docked-${Date.now()}`,
      spaceId: spaceId || 'default',
      query,
      response: response || '',
      history: history || [],
      assistant: assistant || null,
      isLoading: isLoading !== undefined ? isLoading : true,
      isComplete: isComplete || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.dockedChats = data.dockedChats || [];
    
    // Add the new docked chat (multiple docked chats per space are allowed)
    data.dockedChats.push(newChat);
    
    writeChats(data);
    res.json({ success: true, chat: newChat });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a docked chat (for streaming updates)
router.put('/docked/:chatId', (req, res) => {
  try {
    const { chatId } = req.params;
    const updates = req.body;
    const data = readChats();
    
    const chatIndex = (data.dockedChats || []).findIndex(c => c.id === chatId);
    if (chatIndex === -1) {
      return res.status(404).json({ success: false, error: 'Docked chat not found' });
    }
    
    data.dockedChats[chatIndex] = {
      ...data.dockedChats[chatIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    writeChats(data);
    res.json({ success: true, chat: data.dockedChats[chatIndex] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a docked chat
router.delete('/docked/:chatId', (req, res) => {
  try {
    const { chatId } = req.params;
    const data = readChats();
    
    const chatIndex = (data.dockedChats || []).findIndex(c => c.id === chatId);
    if (chatIndex === -1) {
      return res.status(404).json({ success: false, error: 'Docked chat not found' });
    }
    
    const removedChat = data.dockedChats.splice(chatIndex, 1)[0];
    writeChats(data);
    
    res.json({ success: true, chat: removedChat });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete docked chat by space
router.delete('/docked/space/:spaceId', (req, res) => {
  try {
    const { spaceId } = req.params;
    const data = readChats();
    
    const initialLength = (data.dockedChats || []).length;
    data.dockedChats = (data.dockedChats || []).filter(
      c => c.spaceId !== spaceId && (c.spaceId || spaceId !== 'default')
    );
    
    if (data.dockedChats.length === initialLength) {
      return res.status(404).json({ success: false, error: 'No docked chat found for this space' });
    }
    
    writeChats(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
