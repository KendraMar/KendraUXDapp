const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const YAML = require('yaml');
const multer = require('multer');
const { dataDir } = require('../lib/config');

const router = express.Router();

// Get the conversations directory
const getConversationsDir = () => path.join(dataDir, 'conversations');

// Ensure conversations directory exists
const ensureConversationsDir = () => {
  const dir = getConversationsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

/**
 * Generate a session folder name from a timestamp.
 * Format: YYYY-MM-DD-HH-mm-ss-SSS-<short-uuid>
 * Example: 2026-02-08-14-30-45-123-a1b2c3d4
 */
const generateSessionFolderName = (timestamp) => {
  const date = new Date(timestamp);
  const pad = (n, len = 2) => String(n).padStart(len, '0');
  const uid = crypto.randomBytes(4).toString('hex'); // 8-char hex

  const parts = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
    pad(date.getMilliseconds(), 3),
    uid
  ];

  return parts.join('-');
};

/**
 * Read a conversation session from its folder.
 * Returns { metadata, messages } or null.
 */
const readSession = (folderName) => {
  const dir = path.join(getConversationsDir(), folderName);
  if (!fs.existsSync(dir)) return null;

  let metadata = null;
  let messages = [];

  const metaPath = path.join(dir, 'metadata.yaml');
  const messagesPath = path.join(dir, 'messages.json');

  try {
    if (fs.existsSync(metaPath)) {
      metadata = YAML.parse(fs.readFileSync(metaPath, 'utf-8'));
    }
  } catch (err) {
    console.error(`Error reading metadata for ${folderName}:`, err);
  }

  try {
    if (fs.existsSync(messagesPath)) {
      messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    }
  } catch (err) {
    console.error(`Error reading messages for ${folderName}:`, err);
  }

  return { metadata, messages, folder: folderName };
};

/**
 * Write a conversation session to its folder.
 */
const writeSession = (folderName, metadata, messages) => {
  const dir = path.join(ensureConversationsDir(), folderName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const metaPath = path.join(dir, 'metadata.yaml');
  const messagesPath = path.join(dir, 'messages.json');

  try {
    fs.writeFileSync(metaPath, YAML.stringify(metadata), 'utf-8');
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing session ${folderName}:`, err);
    return false;
  }
};

/**
 * List all session folders sorted by name descending (newest first).
 */
const listSessionFolders = () => {
  const dir = ensureConversationsDir();
  try {
    return fs.readdirSync(dir)
      .filter(f => {
        const fullPath = path.join(dir, f);
        return fs.statSync(fullPath).isDirectory();
      })
      .sort((a, b) => b.localeCompare(a));
  } catch (err) {
    console.error('Error listing conversations:', err);
    return [];
  }
};

// ─── ROUTES ────────────────────────────────────────────────────────────────

/**
 * POST /api/conversations
 * Create a new conversation session.
 *
 * Body: {
 *   source: 'chat' | 'omnibar',
 *   model?: string,
 *   provider?: string,          // e.g. 'local', 'claude-code', 'cursor-cli', 'ambient', 'kagi'
 *   title?: string,
 *   messages?: Array,           // initial messages (optional)
 *   settings?: object,          // any model settings (temperature, max_tokens, etc.)
 *   assistant?: object,         // assistant metadata from the omnibar
 *   conversationId?: string     // optional link back to chat-history id
 * }
 *
 * Returns: { success, session: { id, folder, metadata } }
 */
router.post('/', (req, res) => {
  try {
    const {
      source,
      model,
      provider,
      title,
      messages,
      settings,
      assistant,
      conversationId
    } = req.body;

    const now = Date.now();
    const folderName = generateSessionFolderName(now);
    const sessionId = folderName; // The folder name IS the unique id

    const metadata = {
      id: sessionId,
      conversationId: conversationId || null,
      source: source || 'unknown',
      title: title || 'Untitled conversation',
      model: model || null,
      provider: provider || null,
      assistant: assistant ? {
        id: assistant.id,
        name: assistant.name,
        type: assistant.type || null,
        isClaudeCode: assistant.isClaudeCode || false,
        isCursorCli: assistant.isCursorCli || false,
        isKagi: assistant.isKagi || false
      } : null,
      settings: settings || {},
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
      messageCount: (messages || []).length,
      status: 'active'
    };

    const sessionMessages = messages || [];

    if (writeSession(folderName, metadata, sessionMessages)) {
      res.json({
        success: true,
        session: { id: sessionId, folder: folderName, metadata }
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create conversation session' });
    }
  } catch (error) {
    console.error('Error creating conversation session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/conversations/:id
 * Update an existing conversation session (append messages, update metadata).
 *
 * Body: {
 *   messages?: Array,         // full replacement messages array
 *   title?: string,
 *   model?: string,
 *   status?: string,          // 'active' | 'completed' | 'error'
 *   settings?: object
 * }
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = readSession(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Conversation session not found' });
    }

    const updatedMetadata = {
      ...existing.metadata,
      updatedAt: new Date().toISOString()
    };

    if (updates.title !== undefined) updatedMetadata.title = updates.title;
    if (updates.model !== undefined) updatedMetadata.model = updates.model;
    if (updates.status !== undefined) updatedMetadata.status = updates.status;
    if (updates.settings !== undefined) {
      updatedMetadata.settings = { ...updatedMetadata.settings, ...updates.settings };
    }

    const updatedMessages = updates.messages !== undefined ? updates.messages : existing.messages;
    updatedMetadata.messageCount = updatedMessages.length;

    if (writeSession(id, updatedMetadata, updatedMessages)) {
      res.json({
        success: true,
        session: { id, folder: id, metadata: updatedMetadata }
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update conversation session' });
    }
  } catch (error) {
    console.error('Error updating conversation session:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/conversations/:id/messages
 * Append one or more messages to an existing session.
 *
 * Body: {
 *   messages: Array<{ role, content, name?, avatar?, timestamp?, ... }>
 * }
 */
router.post('/:id/messages', (req, res) => {
  try {
    const { id } = req.params;
    const { messages: newMessages } = req.body;

    if (!newMessages || !Array.isArray(newMessages)) {
      return res.status(400).json({ success: false, error: 'messages must be an array' });
    }

    const existing = readSession(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Conversation session not found' });
    }

    const updatedMessages = [...existing.messages, ...newMessages];
    const updatedMetadata = {
      ...existing.metadata,
      updatedAt: new Date().toISOString(),
      messageCount: updatedMessages.length
    };

    if (writeSession(id, updatedMetadata, updatedMessages)) {
      res.json({
        success: true,
        session: { id, folder: id, metadata: updatedMetadata }
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to append messages' });
    }
  } catch (error) {
    console.error('Error appending messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/conversations
 * List all conversation sessions (metadata only, no messages).
 * Query params: ?limit=50&offset=0&source=chat
 */
router.get('/', (req, res) => {
  try {
    const { limit = 50, offset = 0, source } = req.query;
    const folders = listSessionFolders();

    let sessions = folders.map(folder => {
      const session = readSession(folder);
      if (!session || !session.metadata) return null;
      return {
        id: folder,
        folder,
        ...session.metadata
      };
    }).filter(Boolean);

    // Filter by source if provided
    if (source) {
      sessions = sessions.filter(s => s.source === source);
    }

    const total = sessions.length;
    // limit=0 means "return all"
    const numLimit = Number(limit);
    const numOffset = Number(offset);
    const paginated = numLimit === 0
      ? sessions.slice(numOffset)
      : sessions.slice(numOffset, numOffset + numLimit);

    res.json({
      success: true,
      conversations: paginated,
      total,
      limit: numLimit,
      offset: numOffset
    });
  } catch (error) {
    console.error('Error listing conversations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/conversations/:id
 * Get a full conversation session (metadata + messages).
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const session = readSession(id);

    if (!session) {
      return res.status(404).json({ success: false, error: 'Conversation session not found' });
    }

    res.json({
      success: true,
      session: {
        id,
        folder: id,
        metadata: session.metadata,
        messages: session.messages
      }
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/conversations/:id
 * Delete a conversation session folder and all its contents.
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const dir = path.join(getConversationsDir(), id);

    if (!fs.existsSync(dir)) {
      return res.status(404).json({ success: false, error: 'Conversation session not found' });
    }

    // Recursively remove the folder and all its contents (including attachments/)
    const removeDir = (dirPath) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          removeDir(fullPath);
        } else {
          fs.unlinkSync(fullPath);
        }
      }
      fs.rmdirSync(dirPath);
    };

    removeDir(dir);

    res.json({ success: true, deleted: id });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── CURSOR SYNC ────────────────────────────────────────────────────────────

// Lazy-load the migration module (it lives in scripts/)
const getMigrator = () => {
  try {
    return require('../../scripts/migrate-cursor-conversations');
  } catch (err) {
    console.error('Could not load Cursor migration module:', err.message);
    return null;
  }
};

/**
 * GET /api/conversations/sync/cursor/status
 * Check how many Cursor conversations are available to import or update.
 *
 * Returns: { success, available, stale, alreadyImported, total }
 */
router.get('/sync/cursor/status', (req, res) => {
  try {
    const migrator = getMigrator();
    if (!migrator) {
      return res.status(500).json({
        success: false,
        error: 'Migration module not available'
      });
    }

    const status = migrator.checkForNew();
    res.json({ success: true, ...status });
  } catch (error) {
    console.error('Error checking Cursor sync status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/conversations/sync/cursor
 * Import new Cursor conversations and update stale (recently imported but
 * modified since) conversations.
 *
 * Body (optional): { dryRun?: boolean }
 *
 * Returns: { success, imported, updated, skipped, failed, alreadyImported, total }
 */
router.post('/sync/cursor', (req, res) => {
  try {
    const migrator = getMigrator();
    if (!migrator) {
      return res.status(500).json({
        success: false,
        error: 'Migration module not available'
      });
    }

    const { dryRun = false } = req.body || {};

    const results = migrator.migrateAll({ dryRun, verbose: false });

    res.json({
      success: true,
      imported: results.imported,
      updated: results.updated,
      skipped: results.skipped,
      failed: results.failed,
      alreadyImported: results.alreadyImported,
      total: results.total
    });
  } catch (error) {
    console.error('Error syncing Cursor conversations:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── ATTACHMENTS ────────────────────────────────────────────────────────────

/**
 * Multer storage: save uploaded files into
 * data/conversations/<session-id>/attachments/<timestamp>-<originalname>
 */
const attachmentStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const sessionId = req.params.id;
    const attachDir = path.join(getConversationsDir(), sessionId, 'attachments');
    if (!fs.existsSync(attachDir)) {
      fs.mkdirSync(attachDir, { recursive: true });
    }
    cb(null, attachDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${safeOriginal}`);
  }
});

const upload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20 MB per file
});

/**
 * POST /api/conversations/:id/attachments
 * Upload one or more files to the conversation's attachments folder.
 * Returns metadata about the saved files.
 */
router.post('/:id/attachments', upload.array('files', 10), (req, res) => {
  try {
    const { id } = req.params;

    // Verify the conversation exists
    const session = readSession(id);
    if (!session) {
      // Clean up uploaded files since conversation doesn't exist
      if (req.files) {
        req.files.forEach(f => {
          try { fs.unlinkSync(f.path); } catch { /* ignore */ }
        });
      }
      return res.status(404).json({ success: false, error: 'Conversation session not found' });
    }

    const attachments = (req.files || []).map(f => ({
      filename: f.filename,
      originalName: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      url: `/api/conversations/${id}/attachments/${f.filename}`
    }));

    res.json({ success: true, attachments });
  } catch (error) {
    console.error('Error uploading attachments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/conversations/:id/attachments/:filename
 * Serve a previously uploaded attachment file.
 */
router.get('/:id/attachments/:filename', (req, res) => {
  try {
    const { id, filename } = req.params;
    // Sanitize to prevent directory traversal
    const safeName = path.basename(filename);
    const filePath = path.join(getConversationsDir(), id, 'attachments', safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Attachment not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving attachment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
