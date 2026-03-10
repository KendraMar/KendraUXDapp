const express = require('express');
const path = require('path');
const fs = require('fs');
const YAML = require('yaml');
const { dataDir } = require('../lib/config');

const router = express.Router();

// Get the chats directory
const getChatsDir = () => path.join(dataDir, 'chats');

// Ensure chats directory exists
const ensureChatsDir = () => {
  const chatsDir = getChatsDir();
  if (!fs.existsSync(chatsDir)) {
    fs.mkdirSync(chatsDir, { recursive: true });
  }
  return chatsDir;
};

// Generate a filename from a timestamp
const generateFilename = (timestamp) => {
  const date = new Date(timestamp);
  return date.toISOString().replace(/[:.]/g, '-') + '.yaml';
};

// Parse a filename to get the timestamp
const parseFilename = (filename) => {
  const base = filename.replace('.yaml', '');
  // Convert back from ISO-like format to proper ISO
  const isoString = base.replace(/-(\d{2})-(\d{2})-(\d{3})Z$/, ':$1:$2.$3Z');
  return new Date(isoString).getTime();
};

// Get all chat files sorted by date (newest first)
const getChatFiles = () => {
  const chatsDir = ensureChatsDir();
  try {
    const files = fs.readdirSync(chatsDir)
      .filter(f => f.endsWith('.yaml'))
      .sort((a, b) => {
        // Sort by filename (which is timestamp-based) descending
        return b.localeCompare(a);
      });
    return files;
  } catch (error) {
    console.error('Error reading chats directory:', error);
    return [];
  }
};

// Read a chat file
const readChatFile = (filename) => {
  const chatsDir = getChatsDir();
  const filePath = path.join(chatsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return YAML.parse(content);
  } catch (error) {
    console.error('Error reading chat file:', filename, error);
    return null;
  }
};

// Write a chat file
const writeChatFile = (filename, data) => {
  const chatsDir = ensureChatsDir();
  const filePath = path.join(chatsDir, filename);
  
  try {
    const content = YAML.stringify(data);
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing chat file:', filename, error);
    return false;
  }
};

// Delete a chat file
const deleteChatFile = (filename) => {
  const chatsDir = getChatsDir();
  const filePath = path.join(chatsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting chat file:', filename, error);
    return false;
  }
};

// Group chats by relative date
const groupChatsByDate = (chats) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const groups = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    Older: []
  };
  
  chats.forEach(chat => {
    const chatDate = new Date(chat.createdAt);
    const chatDay = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());
    
    if (chatDay.getTime() >= today.getTime()) {
      groups.Today.push(chat);
    } else if (chatDay.getTime() >= yesterday.getTime()) {
      groups.Yesterday.push(chat);
    } else if (chatDay.getTime() >= lastWeek.getTime()) {
      groups['Previous 7 Days'].push(chat);
    } else if (chatDay.getTime() >= lastMonth.getTime()) {
      groups['Previous 30 Days'].push(chat);
    } else {
      groups.Older.push(chat);
    }
  });
  
  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });
  
  return groups;
};

// GET /api/chat-history - List all chats
router.get('/', (req, res) => {
  try {
    const files = getChatFiles();
    const chats = files.map(filename => {
      const chat = readChatFile(filename);
      if (chat) {
        return {
          ...chat,
          filename
        };
      }
      return null;
    }).filter(Boolean);
    
    // Group by date for the sidebar
    const grouped = groupChatsByDate(chats);
    
    res.json({ 
      success: true, 
      conversations: grouped,
      total: chats.length
    });
  } catch (error) {
    console.error('Error listing chats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/chat-history/:id - Get a specific chat
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const files = getChatFiles();
    
    // Find the file that matches this chat ID
    for (const filename of files) {
      const chat = readChatFile(filename);
      if (chat && chat.id === id) {
        return res.json({ 
          success: true, 
          chat: { ...chat, filename }
        });
      }
    }
    
    res.status(404).json({ success: false, error: 'Chat not found' });
  } catch (error) {
    console.error('Error getting chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/chat-history - Create a new chat
router.post('/', (req, res) => {
  try {
    const { id, title, messages, model } = req.body;
    
    const now = Date.now();
    const chatId = id || `chat-${now}`;
    const filename = generateFilename(now);
    
    const chatData = {
      id: chatId,
      title: title || 'New conversation',
      messages: messages || [],
      model: model || null,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString()
    };
    
    if (writeChatFile(filename, chatData)) {
      res.json({ 
        success: true, 
        chat: { ...chatData, filename }
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create chat' });
    }
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/chat-history/:id - Update a chat
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const files = getChatFiles();
    
    // Find the file that matches this chat ID
    for (const filename of files) {
      const chat = readChatFile(filename);
      if (chat && chat.id === id) {
        const updatedChat = {
          ...chat,
          ...updates,
          id, // Preserve the original ID
          createdAt: chat.createdAt, // Preserve original creation time
          updatedAt: new Date().toISOString()
        };
        
        if (writeChatFile(filename, updatedChat)) {
          return res.json({ 
            success: true, 
            chat: { ...updatedChat, filename }
          });
        } else {
          return res.status(500).json({ success: false, error: 'Failed to update chat' });
        }
      }
    }
    
    res.status(404).json({ success: false, error: 'Chat not found' });
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/chat-history/:id - Delete a chat
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const files = getChatFiles();
    
    // Find the file that matches this chat ID
    for (const filename of files) {
      const chat = readChatFile(filename);
      if (chat && chat.id === id) {
        if (deleteChatFile(filename)) {
          return res.json({ success: true, chat });
        } else {
          return res.status(500).json({ success: false, error: 'Failed to delete chat' });
        }
      }
    }
    
    res.status(404).json({ success: false, error: 'Chat not found' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
