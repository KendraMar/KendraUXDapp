const express = require('express');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const Y = require('yjs');
const { dataDir } = require('../../../server/lib/config');
const { listSharedArtifactDirs, resolveArtifactLocation, autoCommitArtifact } = require('../../../server/lib/sharing');

const documentsDir = path.join(dataDir, 'documents');

// Ensure documents directory exists
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// ---- Discussion helpers ----

// Ensure discussions directory exists for a document
function ensureDiscussionsDir(docId) {
  const discussionsDir = path.join(documentsDir, docId, 'discussions');
  if (!fs.existsSync(discussionsDir)) {
    fs.mkdirSync(discussionsDir, { recursive: true });
  }
  return discussionsDir;
}

// Generate a short unique ID for threads/comments
function generateShortId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

// Load all discussion threads for a document
function loadDiscussions(docId) {
  const discussionsDir = path.join(documentsDir, docId, 'discussions');
  if (!fs.existsSync(discussionsDir)) return [];

  try {
    const files = fs.readdirSync(discussionsDir)
      .filter(f => f.endsWith('.json'))
      .sort((a, b) => {
        // Sort by creation date (newest first)
        try {
          const dataA = JSON.parse(fs.readFileSync(path.join(discussionsDir, a), 'utf-8'));
          const dataB = JSON.parse(fs.readFileSync(path.join(discussionsDir, b), 'utf-8'));
          return new Date(dataB.created) - new Date(dataA.created);
        } catch {
          return 0;
        }
      });

    return files.map(file => {
      try {
        return JSON.parse(fs.readFileSync(path.join(discussionsDir, file), 'utf-8'));
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch (err) {
    console.error(`Error loading discussions for ${docId}:`, err);
    return [];
  }
}

// Load a single discussion thread
function loadDiscussion(docId, threadId) {
  const filePath = path.join(documentsDir, docId, 'discussions', `${threadId}.json`);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

// Save a discussion thread
function saveDiscussion(docId, thread) {
  const discussionsDir = ensureDiscussionsDir(docId);
  const filePath = path.join(discussionsDir, `${thread.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(thread, null, 2), 'utf-8');
  return thread;
}

// Delete a discussion thread
function deleteDiscussion(docId, threadId) {
  const filePath = path.join(documentsDir, docId, 'discussions', `${threadId}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

// Store active Yjs documents and their connections
const activeDocuments = new Map(); // docId -> { ydoc, connections: Set, saveTimeout, lastRevisionContent, lastRevisionTime }

// Revision settings
const REVISION_INTERVAL_MS = 5 * 60 * 1000; // Create revision every 5 minutes minimum
const MAX_REVISIONS = 50; // Keep last 50 revisions per document

// Generate a unique ID for new documents
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Ensure revisions directory exists for a document
function ensureRevisionsDir(docId) {
  const revisionsDir = path.join(documentsDir, docId, 'revisions');
  if (!fs.existsSync(revisionsDir)) {
    fs.mkdirSync(revisionsDir, { recursive: true });
  }
  return revisionsDir;
}

// Create a revision of the document
function createRevision(docId, content, metadata) {
  const revisionsDir = ensureRevisionsDir(docId);
  const timestamp = Date.now();
  const revisionFile = path.join(revisionsDir, `${timestamp}.md`);

  const frontmatter = {
    title: metadata.title || 'Untitled',
    tags: metadata.tags || [],
    created: metadata.created,
    savedAt: new Date(timestamp).toISOString(),
    author: metadata.author || null
  };

  const fileContent = matter.stringify(content || '', frontmatter);
  fs.writeFileSync(revisionFile, fileContent, 'utf-8');

  // Prune old revisions
  pruneRevisions(docId);

  return {
    id: timestamp.toString(),
    savedAt: new Date(timestamp).toISOString(),
    title: metadata.title
  };
}

// Prune old revisions, keeping only the most recent MAX_REVISIONS
function pruneRevisions(docId) {
  const revisionsDir = path.join(documentsDir, docId, 'revisions');
  if (!fs.existsSync(revisionsDir)) return;

  try {
    const files = fs.readdirSync(revisionsDir)
      .filter(f => f.endsWith('.md'))
      .sort((a, b) => parseInt(b) - parseInt(a)); // Sort descending by timestamp

    if (files.length > MAX_REVISIONS) {
      const toDelete = files.slice(MAX_REVISIONS);
      toDelete.forEach(file => {
        fs.unlinkSync(path.join(revisionsDir, file));
      });
    }
  } catch (err) {
    console.error(`Error pruning revisions for ${docId}:`, err);
  }
}

// List revisions for a document
function listRevisions(docId) {
  const revisionsDir = path.join(documentsDir, docId, 'revisions');
  if (!fs.existsSync(revisionsDir)) return [];

  try {
    const files = fs.readdirSync(revisionsDir)
      .filter(f => f.endsWith('.md'))
      .sort((a, b) => parseInt(b.replace('.md', '')) - parseInt(a.replace('.md', ''))); // Sort descending

    return files.map(file => {
      const filePath = path.join(revisionsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data: frontmatter } = matter(fileContent);
      const timestamp = parseInt(file.replace('.md', ''));

      return {
        id: timestamp.toString(),
        savedAt: frontmatter.savedAt || new Date(timestamp).toISOString(),
        title: frontmatter.title || 'Untitled'
      };
    });
  } catch (err) {
    console.error(`Error listing revisions for ${docId}:`, err);
    return [];
  }
}

// Get a specific revision
function getRevision(docId, revisionId) {
  const revisionFile = path.join(documentsDir, docId, 'revisions', `${revisionId}.md`);
  if (!fs.existsSync(revisionFile)) return null;

  try {
    const fileContent = fs.readFileSync(revisionFile, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);
    return {
      id: revisionId,
      title: frontmatter.title || 'Untitled',
      tags: frontmatter.tags || [],
      savedAt: frontmatter.savedAt,
      content: content.trim()
    };
  } catch (err) {
    console.error(`Error loading revision ${revisionId} for ${docId}:`, err);
    return null;
  }
}

// Check if we should create a new revision
function shouldCreateRevision(docData, currentContent) {
  const now = Date.now();
  
  // No previous revision recorded
  if (!docData.lastRevisionTime) {
    return true;
  }

  // Check time since last revision
  if (now - docData.lastRevisionTime < REVISION_INTERVAL_MS) {
    return false;
  }

  // Check if content has changed significantly
  if (docData.lastRevisionContent === currentContent) {
    return false;
  }

  return true;
}

// Load document metadata and content from markdown file
function loadDocument(docId, baseDir) {
  const dir = baseDir || documentsDir;
  const docDir = path.join(dir, docId);
  const docPath = path.join(docDir, 'document.md');

  if (!fs.existsSync(docDir) || !fs.statSync(docDir).isDirectory()) {
    return null;
  }

  if (!fs.existsSync(docPath)) {
    return null;
  }

  try {
    const fileContent = fs.readFileSync(docPath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);
    const stats = fs.statSync(docPath);

    return {
      id: docId,
      title: frontmatter.title || 'Untitled',
      tags: frontmatter.tags || [],
      author: frontmatter.author || null,
      created: frontmatter.created || stats.birthtime.toISOString(),
      modified: frontmatter.modified || stats.mtime.toISOString(),
      content: content.trim()
    };
  } catch (err) {
    console.error(`Error loading document ${docId}:`, err);
    return null;
  }
}

// Save document to markdown file with frontmatter
function saveDocument(docId, metadata, content, source = 'unknown') {
  const docDir = path.join(documentsDir, docId);
  const docPath = path.join(docDir, 'document.md');

  console.log(`[DocumentSave] saveDocument called from ${source}`);
  console.log(`[DocumentSave] Document ID: ${docId}`);
  console.log(`[DocumentSave] Content length: ${content ? content.length : 0} chars`);
  console.log(`[DocumentSave] File path: ${docPath}`);

  // Ensure directory exists
  if (!fs.existsSync(docDir)) {
    console.log(`[DocumentSave] Creating directory: ${docDir}`);
    fs.mkdirSync(docDir, { recursive: true });
  }

  const frontmatter = {
    title: metadata.title || 'Untitled',
    tags: metadata.tags || [],
    created: metadata.created || new Date().toISOString(),
    modified: new Date().toISOString(),
    author: metadata.author || null
  };

  const fileContent = matter.stringify(content || '', frontmatter);
  console.log(`[DocumentSave] Writing ${fileContent.length} bytes to file`);
  fs.writeFileSync(docPath, fileContent, 'utf-8');
  console.log(`[DocumentSave] File written successfully`);

  return {
    id: docId,
    ...frontmatter,
    content: content || ''
  };
}

// Convert Yjs text to plain text (simple extraction)
function yjsTextToPlainText(ytext) {
  return ytext.toString();
}

// Debounced save for active documents (WebSocket-based)
function scheduleSave(docId) {
  const docData = activeDocuments.get(docId);
  if (!docData) return;

  // Clear existing timeout
  if (docData.saveTimeout) {
    clearTimeout(docData.saveTimeout);
  }

  console.log(`[DocumentSave] WebSocket scheduleSave called for ${docId}`);

  // Schedule save after 2 seconds of inactivity
  docData.saveTimeout = setTimeout(() => {
    try {
      const ytext = docData.ydoc.getText('content');
      const content = yjsTextToPlainText(ytext);
      console.log(`[DocumentSave] WebSocket auto-save executing for ${docId}, content length: ${content.length}`);
      
      // Load current metadata
      const existing = loadDocument(docId);
      const metadata = existing ? {
        title: existing.title,
        tags: existing.tags,
        author: existing.author,
        created: existing.created
      } : {
        title: 'Untitled',
        tags: [],
        created: new Date().toISOString()
      };

      saveDocument(docId, metadata, content, 'WebSocket-AutoSave');
      console.log(`[DocumentSave] WebSocket auto-saved document: ${docId}`);

      // Check if we should create a revision
      if (shouldCreateRevision(docData, content)) {
        createRevision(docId, content, metadata);
        docData.lastRevisionContent = content;
        docData.lastRevisionTime = Date.now();
        console.log(`[DocumentSave] Created revision for document: ${docId}`);
      }
    } catch (err) {
      console.error(`[DocumentSave] Error auto-saving document ${docId}:`, err);
    }
  }, 2000);
}

// WebSocket handler for Yjs collaboration
function handleWebSocket(ws, req) {
  const docId = req.params.id;
  console.log(`WebSocket connection for document: ${docId}`);

  // Get or create active document
  let docData = activeDocuments.get(docId);
  
  if (!docData) {
    // Create new Yjs document
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('content');

    // Load existing content from file
    const existing = loadDocument(docId);
    if (existing && existing.content) {
      ytext.insert(0, existing.content);
    }

    docData = {
      ydoc,
      connections: new Set(),
      saveTimeout: null,
      lastRevisionContent: existing ? existing.content : '',
      lastRevisionTime: Date.now()
    };
    activeDocuments.set(docId, docData);

    // Listen for updates to schedule saves
    ydoc.on('update', () => {
      scheduleSave(docId);
    });
  }

  docData.connections.add(ws);

  // Send initial state
  const initialState = Y.encodeStateAsUpdate(docData.ydoc);
  ws.send(initialState);

  // Handle incoming messages (Yjs updates)
  ws.on('message', (message) => {
    try {
      // Apply update to Yjs document
      const update = new Uint8Array(message);
      Y.applyUpdate(docData.ydoc, update);

      // Broadcast to other connections
      docData.connections.forEach(client => {
        if (client !== ws && client.readyState === 1) {
          client.send(update);
        }
      });
    } catch (err) {
      console.error('Error processing WebSocket message:', err);
    }
  });

  // Handle close
  ws.on('close', () => {
    console.log(`WebSocket closed for document: ${docId}`);
    docData.connections.delete(ws);

    // If no more connections, save and cleanup after a delay
    if (docData.connections.size === 0) {
      setTimeout(() => {
        const current = activeDocuments.get(docId);
        if (current && current.connections.size === 0) {
          // Final save
          try {
            const ytext = current.ydoc.getText('content');
            const content = yjsTextToPlainText(ytext);
            const existing = loadDocument(docId);
            if (existing) {
              saveDocument(docId, {
                title: existing.title,
                tags: existing.tags,
                author: existing.author,
                created: existing.created
              }, content, 'WebSocket-FinalSave');
              console.log(`[DocumentSave] Final save for document: ${docId}`);
            }
          } catch (err) {
            console.error(`Error in final save for ${docId}:`, err);
          }

          // Cleanup
          if (current.saveTimeout) {
            clearTimeout(current.saveTimeout);
          }
          activeDocuments.delete(docId);
        }
      }, 5000);
    }
  });

  // Handle errors
  ws.on('error', (err) => {
    console.error(`WebSocket error for document ${docId}:`, err);
    docData.connections.delete(ws);
  });
}

// Factory function to create router with WebSocket support
function createDocumentsRouter(app) {
  const router = express.Router();

  // List all documents (local + shared)
  router.get('/', (req, res) => {
    try {
      // Load local documents
      const entries = fs.readdirSync(documentsDir, { withFileTypes: true });

      const documents = entries
        .filter(entry => entry.isDirectory())
        .map(entry => {
          try {
            const doc = loadDocument(entry.name);
            if (doc) {
              return {
                id: doc.id,
                title: doc.title,
                tags: doc.tags,
                author: doc.author,
                created: doc.created,
                modified: doc.modified,
                shared: false
              };
            }
            return null;
          } catch (err) {
            console.error(`Error loading document ${entry.name}:`, err);
            return null;
          }
        })
        .filter(Boolean);

      // Load shared documents from all connected repos
      try {
        const sharedDirs = listSharedArtifactDirs('documents');
        for (const shared of sharedDirs) {
          try {
            const baseDir = path.dirname(shared.dirPath);
            const doc = loadDocument(shared.id, baseDir);
            if (doc) {
              documents.push({
                id: doc.id,
                title: doc.title,
                tags: doc.tags,
                author: doc.author,
                created: doc.created,
                modified: doc.modified,
                shared: true,
                repoId: shared.repoId,
                repoName: shared.repoName
              });
            }
          } catch (err) {
            console.error(`Error loading shared document ${shared.id}:`, err);
          }
        }
      } catch (err) {
        console.error('Error loading shared documents:', err);
      }

      documents.sort((a, b) => new Date(b.modified) - new Date(a.modified));

      res.json({ success: true, documents });
    } catch (error) {
      console.error('Error listing documents:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create new document
  router.post('/', (req, res) => {
    try {
      const { title, tags, content, author } = req.body;
      const docId = generateId();

      const metadata = {
        title: title || 'Untitled',
        tags: tags || [],
        author: author || null,
        created: new Date().toISOString()
      };

      const document = saveDocument(docId, metadata, content || '', 'REST-POST-Create');

      res.json({ success: true, document });
    } catch (error) {
      console.error('Error creating document:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get single document
  router.get('/:id', (req, res) => {
    try {
      let document = loadDocument(req.params.id);

      // If not found locally, check shared repos
      if (!document) {
        const location = resolveArtifactLocation('documents', req.params.id);
        if (location.shared) {
          const baseDir = path.dirname(location.path);
          document = loadDocument(req.params.id, baseDir);
          if (document) {
            document.shared = true;
            document.repoId = location.repoId;
            document.repoName = location.repoName;
          }
        }
      }

      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      res.json({ success: true, document });
    } catch (error) {
      console.error('Error getting document:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Update document metadata and/or content
  router.put('/:id', (req, res) => {
    try {
      const docId = req.params.id;
      console.log(`[DocumentSave] PUT /api/documents/${docId} received`);
      console.log(`[DocumentSave] Request body keys: ${Object.keys(req.body).join(', ')}`);
      console.log(`[DocumentSave] Content provided: ${req.body.content !== undefined}, length: ${req.body.content?.length || 0}`);

      // Try loading from local first, then check shared repos
      let existing = loadDocument(docId);
      if (!existing) {
        const location = resolveArtifactLocation('documents', docId);
        if (location.shared) {
          const baseDir = path.dirname(location.path);
          existing = loadDocument(docId, baseDir);
        }
      }

      if (!existing) {
        console.log(`[DocumentSave] Document ${docId} not found`);
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      console.log(`[DocumentSave] Existing content length: ${existing.content?.length || 0}`);

      const { title, tags, author, content } = req.body;

      const metadata = {
        title: title !== undefined ? title : existing.title,
        tags: tags !== undefined ? tags : existing.tags,
        author: author !== undefined ? author : existing.author,
        created: existing.created
      };

      // Use provided content or keep existing
      const newContent = content !== undefined ? content : existing.content;
      console.log(`[DocumentSave] New content to save: ${newContent?.length || 0} chars`);
      console.log(`[DocumentSave] Content preview: "${(newContent || '').substring(0, 100)}${(newContent?.length || 0) > 100 ? '...' : ''}"`);
      
      const document = saveDocument(docId, metadata, newContent, 'REST-PUT');

      // Check if we should create a revision (content changed significantly)
      if (content !== undefined && content !== existing.content) {
        const now = Date.now();
        // Create revision if content changed and it's been at least 5 minutes
        // We'll track this simply by checking if revisions exist and the last one is old enough
        const existingRevisions = listRevisions(docId);
        const shouldRevision = existingRevisions.length === 0 || 
          (now - parseInt(existingRevisions[0]?.id || '0')) > REVISION_INTERVAL_MS;
        
        if (shouldRevision) {
          createRevision(docId, newContent, metadata);
          console.log(`[DocumentSave] Created revision for document: ${docId}`);
        }
      }

      console.log(`[DocumentSave] PUT response success for ${docId}`);
      res.json({ success: true, document, savedAt: new Date().toISOString() });

      // Auto-commit if this document lives in a shared repo
      try {
        const location = resolveArtifactLocation('documents', docId);
        if (location.shared) {
          autoCommitArtifact(location.repoId, 'documents', docId);
          console.log(`[DocumentSave] Auto-committed shared document ${docId} to repo ${location.repoId}`);
        }
      } catch (commitErr) {
        console.error(`[DocumentSave] Auto-commit failed for ${docId}:`, commitErr.message);
      }
    } catch (error) {
      console.error('[DocumentSave] Error updating document:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Delete document
  router.delete('/:id', (req, res) => {
    try {
      const docId = req.params.id;
      const docDir = path.join(documentsDir, docId);

      if (!fs.existsSync(docDir)) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      // Clean up active connections
      const docData = activeDocuments.get(docId);
      if (docData) {
        if (docData.saveTimeout) {
          clearTimeout(docData.saveTimeout);
        }
        docData.connections.forEach(ws => ws.close());
        activeDocuments.delete(docId);
      }

      // Delete directory and contents
      fs.rmSync(docDir, { recursive: true });

      res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // List revisions for a document
  router.get('/:id/revisions', (req, res) => {
    try {
      const docId = req.params.id;
      const document = loadDocument(docId);

      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      const revisions = listRevisions(docId);
      res.json({ success: true, revisions });
    } catch (error) {
      console.error('Error listing revisions:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get a specific revision
  router.get('/:id/revisions/:revisionId', (req, res) => {
    try {
      const { id: docId, revisionId } = req.params;
      const document = loadDocument(docId);

      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      const revision = getRevision(docId, revisionId);
      if (!revision) {
        return res.status(404).json({ success: false, error: 'Revision not found' });
      }

      res.json({ success: true, revision });
    } catch (error) {
      console.error('Error getting revision:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Restore a revision (copies revision content to current document)
  router.post('/:id/revisions/:revisionId/restore', (req, res) => {
    try {
      const { id: docId, revisionId } = req.params;
      const document = loadDocument(docId);

      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      const revision = getRevision(docId, revisionId);
      if (!revision) {
        return res.status(404).json({ success: false, error: 'Revision not found' });
      }

      // Create a revision of current state before restoring
      createRevision(docId, document.content, {
        title: document.title,
        tags: document.tags,
        author: document.author,
        created: document.created
      });

      // Save the restored content
      const restored = saveDocument(docId, {
        title: document.title,
        tags: document.tags,
        author: document.author,
        created: document.created
      }, revision.content, 'REST-RevisionRestore');

      // Update active Yjs document if any
      const docData = activeDocuments.get(docId);
      if (docData) {
        const ytext = docData.ydoc.getText('content');
        docData.ydoc.transact(() => {
          ytext.delete(0, ytext.length);
          ytext.insert(0, revision.content);
        });
        docData.lastRevisionContent = revision.content;
        docData.lastRevisionTime = Date.now();
      }

      res.json({ success: true, document: restored });
    } catch (error) {
      console.error('Error restoring revision:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create a manual revision (snapshot)
  router.post('/:id/revisions', (req, res) => {
    try {
      const docId = req.params.id;
      const document = loadDocument(docId);

      if (!document) {
        return res.status(404).json({ success: false, error: 'Document not found' });
      }

      // Get current content from active document if available
      let content = document.content;
      const docData = activeDocuments.get(docId);
      if (docData) {
        const ytext = docData.ydoc.getText('content');
        content = yjsTextToPlainText(ytext);
      }

      const revision = createRevision(docId, content, {
        title: document.title,
        tags: document.tags,
        author: document.author,
        created: document.created
      });

      // Update tracking
      if (docData) {
        docData.lastRevisionContent = content;
        docData.lastRevisionTime = Date.now();
      }

      res.json({ success: true, revision });
    } catch (error) {
      console.error('Error creating revision:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // ---- Discussion routes ----

  // List all discussion threads for a document
  router.get('/:id/discussions', (req, res) => {
    try {
      const docId = req.params.id;
      const document = loadDocument(docId);
      if (!document) {
        // Check shared repos
        const location = resolveArtifactLocation('documents', docId);
        if (!location.shared) {
          return res.status(404).json({ success: false, error: 'Document not found' });
        }
      }

      const discussions = loadDiscussions(docId);
      res.json({ success: true, discussions });
    } catch (error) {
      console.error('Error listing discussions:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create a new discussion thread
  router.post('/:id/discussions', (req, res) => {
    try {
      const docId = req.params.id;
      const { anchor, content, author } = req.body;

      if (!anchor || !anchor.text) {
        return res.status(400).json({ success: false, error: 'Anchor with text is required' });
      }
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: 'Comment content is required' });
      }

      const threadId = generateShortId();
      const commentId = generateShortId();
      const now = new Date().toISOString();

      const thread = {
        id: threadId,
        anchor: {
          text: anchor.text,
          prefix: anchor.prefix || '',
          suffix: anchor.suffix || '',
          startOffset: anchor.startOffset != null ? anchor.startOffset : null,
          endOffset: anchor.endOffset != null ? anchor.endOffset : null
        },
        status: 'open',
        created: now,
        lastActivity: now,
        comments: [
          {
            id: commentId,
            author: author || 'Anonymous',
            content: content.trim(),
            created: now,
            edited: null
          }
        ]
      };

      ensureDiscussionsDir(docId);
      saveDiscussion(docId, thread);

      res.json({ success: true, thread });
    } catch (error) {
      console.error('Error creating discussion:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Update a discussion thread (resolve/reopen)
  router.put('/:id/discussions/:threadId', (req, res) => {
    try {
      const { id: docId, threadId } = req.params;
      const thread = loadDiscussion(docId, threadId);

      if (!thread) {
        return res.status(404).json({ success: false, error: 'Discussion thread not found' });
      }

      const { status } = req.body;
      if (status) {
        thread.status = status;
      }
      thread.lastActivity = new Date().toISOString();

      saveDiscussion(docId, thread);
      res.json({ success: true, thread });
    } catch (error) {
      console.error('Error updating discussion:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Delete a discussion thread
  router.delete('/:id/discussions/:threadId', (req, res) => {
    try {
      const { id: docId, threadId } = req.params;
      const deleted = deleteDiscussion(docId, threadId);

      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Discussion thread not found' });
      }

      res.json({ success: true, message: 'Discussion deleted' });
    } catch (error) {
      console.error('Error deleting discussion:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Add a comment to a discussion thread
  router.post('/:id/discussions/:threadId/comments', (req, res) => {
    try {
      const { id: docId, threadId } = req.params;
      const { content, author } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: 'Comment content is required' });
      }

      const thread = loadDiscussion(docId, threadId);
      if (!thread) {
        return res.status(404).json({ success: false, error: 'Discussion thread not found' });
      }

      const commentId = generateShortId();
      const now = new Date().toISOString();

      const comment = {
        id: commentId,
        author: author || 'Anonymous',
        content: content.trim(),
        created: now,
        edited: null
      };

      thread.comments.push(comment);
      thread.lastActivity = now;
      saveDiscussion(docId, thread);

      res.json({ success: true, comment, thread });
    } catch (error) {
      console.error('Error adding comment:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Edit a comment
  router.put('/:id/discussions/:threadId/comments/:commentId', (req, res) => {
    try {
      const { id: docId, threadId, commentId } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: 'Comment content is required' });
      }

      const thread = loadDiscussion(docId, threadId);
      if (!thread) {
        return res.status(404).json({ success: false, error: 'Discussion thread not found' });
      }

      const comment = thread.comments.find(c => c.id === commentId);
      if (!comment) {
        return res.status(404).json({ success: false, error: 'Comment not found' });
      }

      comment.content = content.trim();
      comment.edited = new Date().toISOString();
      thread.lastActivity = new Date().toISOString();
      saveDiscussion(docId, thread);

      res.json({ success: true, comment, thread });
    } catch (error) {
      console.error('Error editing comment:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Delete a comment
  router.delete('/:id/discussions/:threadId/comments/:commentId', (req, res) => {
    try {
      const { id: docId, threadId, commentId } = req.params;

      const thread = loadDiscussion(docId, threadId);
      if (!thread) {
        return res.status(404).json({ success: false, error: 'Discussion thread not found' });
      }

      const idx = thread.comments.findIndex(c => c.id === commentId);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Comment not found' });
      }

      // Don't allow deleting the first comment (it's the thread starter)
      if (idx === 0) {
        return res.status(400).json({ success: false, error: 'Cannot delete the initial comment. Delete the thread instead.' });
      }

      thread.comments.splice(idx, 1);
      thread.lastActivity = new Date().toISOString();
      saveDiscussion(docId, thread);

      res.json({ success: true, thread });
    } catch (error) {
      console.error('Error deleting comment:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // WebSocket endpoint for Yjs collaboration - registered on the app directly
  app.ws('/api/documents/collaborate/:id', handleWebSocket);

  return router;
}

module.exports = createDocumentsRouter;
