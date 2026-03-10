const express = require('express');
const router = express.Router();
const {
  loadRepos,
  saveRepos,
  cloneRepo,
  removeRepo,
  getRepoStatus,
  syncRepo,
  shareArtifact,
  unshareArtifact,
  listSharedArtifactDirs,
  listSharedArtifactFiles,
  autoCommitArtifact
} = require('../lib/sharing');

// ============================================================
// REPOSITORY MANAGEMENT
// ============================================================

// GET /api/sharing/repos - List all connected repositories
router.get('/repos', (req, res) => {
  try {
    const registry = loadRepos();
    res.json({ success: true, repositories: registry.repositories });
  } catch (error) {
    console.error('Error listing repos:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sharing/repos - Add (clone) a new repository
router.post('/repos', async (req, res) => {
  try {
    const { url, branch, name } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: 'Repository URL is required' });
    }

    const repo = cloneRepo(url, branch, name);
    res.json({ success: true, repository: repo });
  } catch (error) {
    console.error('Error cloning repo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sharing/repos/:id - Get a single repository
router.get('/repos/:id', (req, res) => {
  try {
    const registry = loadRepos();
    const repo = registry.repositories.find(r => r.id === req.params.id);

    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }

    res.json({ success: true, repository: repo });
  } catch (error) {
    console.error('Error getting repo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/sharing/repos/:id - Update repository settings
router.patch('/repos/:id', (req, res) => {
  try {
    const { name, autoSync } = req.body;
    const registry = loadRepos();
    const repo = registry.repositories.find(r => r.id === req.params.id);

    if (!repo) {
      return res.status(404).json({ success: false, error: 'Repository not found' });
    }

    if (name !== undefined) repo.name = name;
    if (autoSync !== undefined) repo.autoSync = autoSync;

    saveRepos(registry);
    res.json({ success: true, repository: repo });
  } catch (error) {
    console.error('Error updating repo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/sharing/repos/:id - Remove a repository
router.delete('/repos/:id', (req, res) => {
  try {
    removeRepo(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing repo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// SYNC OPERATIONS
// ============================================================

// POST /api/sharing/repos/:id/sync - Sync a repository (pull + push)
router.post('/repos/:id/sync', (req, res) => {
  try {
    const { resolveStrategy } = req.body || {};
    const result = syncRepo(req.params.id, resolveStrategy);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error syncing repo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sharing/repos/:id/status - Get sync status
router.get('/repos/:id/status', (req, res) => {
  try {
    const status = getRepoStatus(req.params.id);
    res.json({ success: true, ...status });
  } catch (error) {
    console.error('Error getting repo status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ARTIFACT SHARING
// ============================================================

// POST /api/sharing/artifacts/share - Share an artifact to a repo
router.post('/artifacts/share', (req, res) => {
  try {
    const { artifactType, artifactId, repoId } = req.body;

    if (!artifactType || !artifactId || !repoId) {
      return res.status(400).json({
        success: false,
        error: 'artifactType, artifactId, and repoId are required'
      });
    }

    const result = shareArtifact(artifactType, artifactId, repoId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error sharing artifact:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sharing/artifacts/unshare - Unshare an artifact (move back to local)
router.post('/artifacts/unshare', (req, res) => {
  try {
    const { artifactType, artifactId, repoId } = req.body;

    if (!artifactType || !artifactId || !repoId) {
      return res.status(400).json({
        success: false,
        error: 'artifactType, artifactId, and repoId are required'
      });
    }

    const result = unshareArtifact(artifactType, artifactId, repoId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error unsharing artifact:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sharing/artifacts/commit - Auto-commit changes to a shared artifact
router.post('/artifacts/commit', (req, res) => {
  try {
    const { repoId, artifactType, artifactId } = req.body;

    if (!repoId || !artifactType || !artifactId) {
      return res.status(400).json({
        success: false,
        error: 'repoId, artifactType, and artifactId are required'
      });
    }

    const result = autoCommitArtifact(repoId, artifactType, artifactId);
    res.json(result);
  } catch (error) {
    console.error('Error committing artifact:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sharing/artifacts/:type - List all shared artifacts of a given type
router.get('/artifacts/:type', (req, res) => {
  try {
    const { type } = req.params;
    const { format } = req.query; // 'files' for file-based artifacts, default is directory-based

    let artifacts;
    if (format === 'files') {
      artifacts = listSharedArtifactFiles(type);
    } else {
      artifacts = listSharedArtifactDirs(type);
    }

    res.json({ success: true, artifacts });
  } catch (error) {
    console.error('Error listing shared artifacts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
