const express = require('express');
const path = require('path');
const fs = require('fs');
const { dataDir } = require('../../../server/lib/config');

const discussionsDir = path.join(dataDir, 'discussions');

// Ensure discussions directory exists
if (!fs.existsSync(discussionsDir)) {
  fs.mkdirSync(discussionsDir, { recursive: true });
}

// Generate a unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Load a discussion from disk
function loadDiscussion(discussionId) {
  const discussionPath = path.join(discussionsDir, `${discussionId}.json`);
  
  if (!fs.existsSync(discussionPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(discussionPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error loading discussion ${discussionId}:`, err);
    return null;
  }
}

// Save a discussion to disk
function saveDiscussion(discussion) {
  const discussionPath = path.join(discussionsDir, `${discussion.id}.json`);
  
  try {
    fs.writeFileSync(discussionPath, JSON.stringify(discussion, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error saving discussion ${discussion.id}:`, err);
    return false;
  }
}

// Delete a discussion from disk
function deleteDiscussion(discussionId) {
  const discussionPath = path.join(discussionsDir, `${discussionId}.json`);
  
  try {
    if (fs.existsSync(discussionPath)) {
      fs.unlinkSync(discussionPath);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Error deleting discussion ${discussionId}:`, err);
    return false;
  }
}

// List all discussions
function listDiscussions() {
  try {
    const files = fs.readdirSync(discussionsDir)
      .filter(f => f.endsWith('.json'));
    
    return files
      .map(file => {
        const discussionId = file.replace('.json', '');
        return loadDiscussion(discussionId);
      })
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by pinned first, then by last activity
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.lastActivity || b.created) - new Date(a.lastActivity || a.created);
      });
  } catch (err) {
    console.error('Error listing discussions:', err);
    return [];
  }
}

// Count replies recursively
function countReplies(replies) {
  if (!replies || !Array.isArray(replies)) return 0;
  
  let count = replies.length;
  replies.forEach(reply => {
    count += countReplies(reply.replies);
  });
  return count;
}

// Find a reply by ID recursively
function findReply(replies, replyId) {
  if (!replies || !Array.isArray(replies)) return null;
  
  for (const reply of replies) {
    if (reply.id === replyId) return reply;
    const found = findReply(reply.replies, replyId);
    if (found) return found;
  }
  return null;
}

// Find parent and index of a reply
function findReplyParent(replies, replyId, parent = null) {
  if (!replies || !Array.isArray(replies)) return null;
  
  for (let i = 0; i < replies.length; i++) {
    if (replies[i].id === replyId) {
      return { parent, index: i, array: replies };
    }
    const found = findReplyParent(replies[i].replies, replyId, replies[i]);
    if (found) return found;
  }
  return null;
}

const router = express.Router();

// List all discussions
router.get('/', (req, res) => {
  try {
    const discussions = listDiscussions();
    
    // Return summary data for list view
    const summaries = discussions.map(d => ({
      id: d.id,
      title: d.title,
      category: d.category,
      author: d.author,
      created: d.created,
      lastActivity: d.lastActivity,
      replyCount: countReplies(d.replies),
      viewCount: d.viewCount || 0,
      isPinned: d.isPinned || false,
      isLocked: d.isLocked || false,
      tags: d.tags || [],
      excerpt: d.content ? d.content.substring(0, 200) + (d.content.length > 200 ? '...' : '') : ''
    }));
    
    res.json({ success: true, discussions: summaries });
  } catch (error) {
    console.error('Error listing discussions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new discussion
router.post('/', (req, res) => {
  try {
    const { title, content, category, tags, author } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    
    const discussion = {
      id: generateId(),
      title: title.trim(),
      content: content || '',
      category: category || 'General',
      tags: tags || [],
      author: author || { name: 'Anonymous', avatar: null },
      created: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      replies: [],
      viewCount: 0,
      isPinned: false,
      isLocked: false
    };
    
    if (!saveDiscussion(discussion)) {
      return res.status(500).json({ success: false, error: 'Failed to save discussion' });
    }
    
    res.json({ success: true, discussion });
  } catch (error) {
    console.error('Error creating discussion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single discussion
router.get('/:id', (req, res) => {
  try {
    const discussion = loadDiscussion(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }
    
    // Increment view count
    discussion.viewCount = (discussion.viewCount || 0) + 1;
    saveDiscussion(discussion);
    
    res.json({ success: true, discussion });
  } catch (error) {
    console.error('Error getting discussion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update discussion
router.put('/:id', (req, res) => {
  try {
    const discussion = loadDiscussion(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }
    
    const { title, content, category, tags, isPinned, isLocked } = req.body;
    
    if (title !== undefined) discussion.title = title.trim();
    if (content !== undefined) discussion.content = content;
    if (category !== undefined) discussion.category = category;
    if (tags !== undefined) discussion.tags = tags;
    if (isPinned !== undefined) discussion.isPinned = isPinned;
    if (isLocked !== undefined) discussion.isLocked = isLocked;
    
    discussion.lastActivity = new Date().toISOString();
    
    if (!saveDiscussion(discussion)) {
      return res.status(500).json({ success: false, error: 'Failed to save discussion' });
    }
    
    res.json({ success: true, discussion });
  } catch (error) {
    console.error('Error updating discussion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete discussion
router.delete('/:id', (req, res) => {
  try {
    if (!deleteDiscussion(req.params.id)) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }
    
    res.json({ success: true, message: 'Discussion deleted' });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add reply to discussion
router.post('/:id/replies', (req, res) => {
  try {
    const discussion = loadDiscussion(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }
    
    if (discussion.isLocked) {
      return res.status(403).json({ success: false, error: 'Discussion is locked' });
    }
    
    const { content, author, parentReplyId } = req.body;
    
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }
    
    const reply = {
      id: generateId(),
      content: content.trim(),
      author: author || { name: 'Anonymous', avatar: null },
      created: new Date().toISOString(),
      edited: null,
      replies: [],
      upvotes: 0,
      downvotes: 0
    };
    
    // Add as nested reply or top-level reply
    if (parentReplyId) {
      const parentReply = findReply(discussion.replies, parentReplyId);
      if (!parentReply) {
        return res.status(404).json({ success: false, error: 'Parent reply not found' });
      }
      if (!parentReply.replies) parentReply.replies = [];
      parentReply.replies.push(reply);
    } else {
      discussion.replies.push(reply);
    }
    
    discussion.lastActivity = new Date().toISOString();
    
    if (!saveDiscussion(discussion)) {
      return res.status(500).json({ success: false, error: 'Failed to save reply' });
    }
    
    res.json({ success: true, reply, discussion });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a reply
router.put('/:id/replies/:replyId', (req, res) => {
  try {
    const discussion = loadDiscussion(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }
    
    const reply = findReply(discussion.replies, req.params.replyId);
    
    if (!reply) {
      return res.status(404).json({ success: false, error: 'Reply not found' });
    }
    
    const { content } = req.body;
    
    if (content !== undefined) {
      reply.content = content.trim();
      reply.edited = new Date().toISOString();
    }
    
    if (!saveDiscussion(discussion)) {
      return res.status(500).json({ success: false, error: 'Failed to save reply' });
    }
    
    res.json({ success: true, reply });
  } catch (error) {
    console.error('Error updating reply:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a reply
router.delete('/:id/replies/:replyId', (req, res) => {
  try {
    const discussion = loadDiscussion(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }
    
    const replyInfo = findReplyParent(discussion.replies, req.params.replyId);
    
    if (!replyInfo) {
      return res.status(404).json({ success: false, error: 'Reply not found' });
    }
    
    // Remove the reply from its parent array
    replyInfo.array.splice(replyInfo.index, 1);
    
    if (!saveDiscussion(discussion)) {
      return res.status(500).json({ success: false, error: 'Failed to delete reply' });
    }
    
    res.json({ success: true, message: 'Reply deleted' });
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vote on a reply
router.post('/:id/replies/:replyId/vote', (req, res) => {
  try {
    const discussion = loadDiscussion(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ success: false, error: 'Discussion not found' });
    }
    
    const reply = findReply(discussion.replies, req.params.replyId);
    
    if (!reply) {
      return res.status(404).json({ success: false, error: 'Reply not found' });
    }
    
    const { vote } = req.body; // 'up' or 'down'
    
    if (vote === 'up') {
      reply.upvotes = (reply.upvotes || 0) + 1;
    } else if (vote === 'down') {
      reply.downvotes = (reply.downvotes || 0) + 1;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid vote type' });
    }
    
    if (!saveDiscussion(discussion)) {
      return res.status(500).json({ success: false, error: 'Failed to save vote' });
    }
    
    res.json({ success: true, reply });
  } catch (error) {
    console.error('Error voting on reply:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get categories (derived from existing discussions)
router.get('/meta/categories', (req, res) => {
  try {
    const discussions = listDiscussions();
    const categories = [...new Set(discussions.map(d => d.category).filter(Boolean))];
    
    // Add default categories if none exist
    const defaultCategories = ['General', 'Questions', 'Ideas', 'Feedback', 'Announcements'];
    const allCategories = [...new Set([...defaultCategories, ...categories])];
    
    res.json({ success: true, categories: allCategories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
