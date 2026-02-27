const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { dataDir } = require('./config');

// Directory paths
const sharedDir = path.join(dataDir, 'shared');
const reposFile = path.join(sharedDir, 'repos.json');

// Ensure shared directory exists
if (!fs.existsSync(sharedDir)) {
  fs.mkdirSync(sharedDir, { recursive: true });
}

// ============================================================
// GIT HELPERS
// ============================================================

/**
 * Run a git command in a given directory
 */
function runGit(cwd, args, options = {}) {
  try {
    const result = execSync(`git ${args}`, {
      cwd,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: options.timeout || 30000,
      ...options
    });
    return { success: true, output: result.trim() };
  } catch (err) {
    return { success: false, error: err.stderr?.trim() || err.message };
  }
}

/**
 * Check if a directory is a git repo
 */
function isGitRepo(dirPath) {
  const result = runGit(dirPath, 'rev-parse --is-inside-work-tree');
  return result.success && result.output === 'true';
}

// ============================================================
// REPOSITORY REGISTRY
// ============================================================

/**
 * Load the repos registry from disk
 */
function loadRepos() {
  try {
    if (fs.existsSync(reposFile)) {
      return JSON.parse(fs.readFileSync(reposFile, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading repos.json:', err);
  }
  return { repositories: [] };
}

/**
 * Save the repos registry to disk
 */
function saveRepos(data) {
  fs.writeFileSync(reposFile, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Generate a slug ID from a repo URL or name
 */
function generateRepoId(url, name) {
  if (name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  // Extract repo name from URL
  const match = url.match(/\/([^/]+?)(?:\.git)?$/);
  if (match) {
    return match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  return 'repo-' + Date.now().toString(36);
}

// ============================================================
// REPOSITORY OPERATIONS
// ============================================================

/**
 * Clone a remote repository into data/shared/<id>/
 */
function cloneRepo(url, branch, name) {
  const id = generateRepoId(url, name);
  const repoPath = path.join(sharedDir, id);

  if (fs.existsSync(repoPath)) {
    throw new Error(`Repository directory already exists: ${id}`);
  }

  const branchArg = branch ? `-b ${branch} ` : '';
  const result = runGit(sharedDir, `clone ${branchArg}${url} ${id}`, { timeout: 120000 });

  if (!result.success) {
    // Clean up partial clone
    if (fs.existsSync(repoPath)) {
      fs.rmSync(repoPath, { recursive: true, force: true });
    }
    throw new Error(`Clone failed: ${result.error}`);
  }

  // Determine actual branch
  let actualBranch = branch;
  if (!actualBranch) {
    const branchResult = runGit(repoPath, 'branch --show-current');
    actualBranch = branchResult.success ? branchResult.output : 'main';
  }

  // Read or create manifest
  const manifestPath = path.join(repoPath, 'manifest.json');
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (e) { /* ignore */ }
  }

  // Register the repo
  const registry = loadRepos();
  const repoEntry = {
    id,
    name: name || manifest.name || id,
    url,
    branch: actualBranch,
    lastSync: new Date().toISOString(),
    status: 'synced',
    autoSync: true
  };
  registry.repositories.push(repoEntry);
  saveRepos(registry);

  return repoEntry;
}

/**
 * Remove a shared repository (deletes local clone and registry entry)
 */
function removeRepo(id) {
  const repoPath = path.join(sharedDir, id);

  // Remove from registry
  const registry = loadRepos();
  registry.repositories = registry.repositories.filter(r => r.id !== id);
  saveRepos(registry);

  // Delete local clone
  if (fs.existsSync(repoPath)) {
    fs.rmSync(repoPath, { recursive: true, force: true });
  }

  return true;
}

/**
 * Get the sync status of a repository (ahead/behind/conflicts)
 */
function getRepoStatus(id) {
  const repoPath = path.join(sharedDir, id);

  if (!fs.existsSync(repoPath) || !isGitRepo(repoPath)) {
    throw new Error(`Repository not found: ${id}`);
  }

  // Fetch to get latest remote state
  runGit(repoPath, 'fetch', { timeout: 60000 });

  // Get current branch
  const branchResult = runGit(repoPath, 'branch --show-current');
  const branch = branchResult.success ? branchResult.output : 'main';

  // Get ahead/behind counts
  let ahead = 0, behind = 0;
  const trackingResult = runGit(repoPath, 'rev-list --left-right --count HEAD...@{upstream}');
  if (trackingResult.success) {
    const parts = trackingResult.output.split('\t');
    ahead = parseInt(parts[0]) || 0;
    behind = parseInt(parts[1]) || 0;
  }

  // Check for uncommitted changes
  const statusResult = runGit(repoPath, 'status --porcelain');
  const hasUncommittedChanges = statusResult.success && statusResult.output.length > 0;

  // Check for merge conflicts
  const conflictResult = runGit(repoPath, 'diff --name-only --diff-filter=U');
  const conflicts = conflictResult.success && conflictResult.output.length > 0
    ? conflictResult.output.split('\n').filter(Boolean)
    : [];

  // Get remote URL
  const remoteResult = runGit(repoPath, 'remote get-url origin');
  const remoteUrl = remoteResult.success ? remoteResult.output : null;

  return {
    id,
    branch,
    ahead,
    behind,
    hasUncommittedChanges,
    conflicts,
    remoteUrl,
    isClean: !hasUncommittedChanges && conflicts.length === 0
  };
}

/**
 * Sync a repository: commit local changes, pull remote, push local
 * @param {string} id - Repository ID
 * @param {string} resolveStrategy - 'ours' (keep local) or 'theirs' (use remote) for conflicts
 */
function syncRepo(id, resolveStrategy) {
  const repoPath = path.join(sharedDir, id);

  if (!fs.existsSync(repoPath) || !isGitRepo(repoPath)) {
    throw new Error(`Repository not found: ${id}`);
  }

  const results = {
    committed: false,
    pulled: false,
    pushed: false,
    conflicts: [],
    error: null
  };

  // Step 1: Stage and commit any local changes
  const statusResult = runGit(repoPath, 'status --porcelain');
  if (statusResult.success && statusResult.output.length > 0) {
    runGit(repoPath, 'add -A');
    const commitResult = runGit(repoPath, 'commit -m "Sync: update shared artifacts"');
    results.committed = commitResult.success;
  }

  // Step 2: If there's a conflict resolution strategy, apply it first
  if (resolveStrategy === 'theirs') {
    // Reset local changes and pull remote (accept all remote changes)
    runGit(repoPath, 'reset --hard HEAD');
    const pullResult = runGit(repoPath, 'pull', { timeout: 60000 });
    results.pulled = pullResult.success;
    if (!pullResult.success) {
      results.error = pullResult.error;
    }
  } else if (resolveStrategy === 'ours') {
    // Force push local changes (keep local, overwrite remote)
    const pushResult = runGit(repoPath, 'push --force-with-lease', { timeout: 60000 });
    results.pushed = pushResult.success;
    if (!pushResult.success) {
      results.error = pushResult.error;
    }
  } else {
    // Normal sync: pull with rebase
    const pullResult = runGit(repoPath, 'pull --rebase', { timeout: 60000 });
    if (pullResult.success) {
      results.pulled = true;
    } else {
      // Check for conflicts
      const conflictCheck = runGit(repoPath, 'diff --name-only --diff-filter=U');
      if (conflictCheck.success && conflictCheck.output.length > 0) {
        results.conflicts = conflictCheck.output.split('\n').filter(Boolean);
        // Abort the rebase so the user can resolve
        runGit(repoPath, 'rebase --abort');
        results.error = 'Merge conflicts detected. Please resolve manually.';
      } else {
        results.error = pullResult.error;
      }
    }
  }

  // Step 3: Push local commits
  if (results.pulled && results.conflicts.length === 0) {
    const pushResult = runGit(repoPath, 'push', { timeout: 60000 });
    results.pushed = pushResult.success;
    if (!pushResult.success) {
      results.error = pushResult.error;
    }
  }

  // Update registry
  const registry = loadRepos();
  const repo = registry.repositories.find(r => r.id === id);
  if (repo) {
    repo.lastSync = new Date().toISOString();
    repo.status = results.conflicts.length > 0 ? 'conflict' : 'synced';
    saveRepos(registry);
  }

  return results;
}

// ============================================================
// ARTIFACT SHARING OPERATIONS
// ============================================================

/**
 * Get the artifact type from a path (e.g., 'documents', 'slides', 'canvas')
 */
function getArtifactType(artifactPath) {
  // artifactPath is relative to dataDir, e.g., 'documents/my-doc'
  const parts = artifactPath.split(path.sep);
  return parts[0];
}

/**
 * Share an artifact: move from data/<type>/<id> to data/shared/<repo>/<type>/<id>
 */
function shareArtifact(artifactType, artifactId, repoId) {
  const registry = loadRepos();
  const repo = registry.repositories.find(r => r.id === repoId);
  if (!repo) {
    throw new Error(`Repository not found: ${repoId}`);
  }

  const sourcePath = path.join(dataDir, artifactType, artifactId);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Artifact not found: ${artifactType}/${artifactId}`);
  }

  const repoPath = path.join(sharedDir, repoId);
  const destTypeDir = path.join(repoPath, artifactType);
  const destPath = path.join(destTypeDir, artifactId);

  if (fs.existsSync(destPath)) {
    throw new Error(`Artifact already exists in shared repo: ${artifactType}/${artifactId}`);
  }

  // Ensure artifact type directory exists in the shared repo
  if (!fs.existsSync(destTypeDir)) {
    fs.mkdirSync(destTypeDir, { recursive: true });
  }

  // Move the artifact
  fs.renameSync(sourcePath, destPath);

  // Git add, commit, and push
  runGit(repoPath, `add "${artifactType}/${artifactId}"`);
  const commitMsg = `Share: add ${artifactType}/${artifactId}`;
  const commitResult = runGit(repoPath, `commit -m "${commitMsg}"`);

  // Push (non-blocking, best-effort)
  if (commitResult.success) {
    runGit(repoPath, 'push', { timeout: 60000 });
  }

  // Update last sync time
  repo.lastSync = new Date().toISOString();
  saveRepos(registry);

  return {
    artifactType,
    artifactId,
    repoId,
    status: commitResult.success ? 'shared' : 'shared-locally'
  };
}

/**
 * Unshare an artifact: move from data/shared/<repo>/<type>/<id> back to data/<type>/<id>
 */
function unshareArtifact(artifactType, artifactId, repoId) {
  const registry = loadRepos();
  const repo = registry.repositories.find(r => r.id === repoId);
  if (!repo) {
    throw new Error(`Repository not found: ${repoId}`);
  }

  const repoPath = path.join(sharedDir, repoId);
  const sourcePath = path.join(repoPath, artifactType, artifactId);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Artifact not found in shared repo: ${artifactType}/${artifactId}`);
  }

  const destTypeDir = path.join(dataDir, artifactType);
  const destPath = path.join(destTypeDir, artifactId);

  if (fs.existsSync(destPath)) {
    throw new Error(`Artifact already exists locally: ${artifactType}/${artifactId}`);
  }

  // Ensure local type directory exists
  if (!fs.existsSync(destTypeDir)) {
    fs.mkdirSync(destTypeDir, { recursive: true });
  }

  // Move the artifact back to local
  fs.renameSync(sourcePath, destPath);

  // Git add the removal, commit, and push
  runGit(repoPath, `add "${artifactType}/${artifactId}"`);
  const commitMsg = `Unshare: remove ${artifactType}/${artifactId}`;
  const commitResult = runGit(repoPath, `commit -m "${commitMsg}"`);

  if (commitResult.success) {
    runGit(repoPath, 'push', { timeout: 60000 });
  }

  repo.lastSync = new Date().toISOString();
  saveRepos(registry);

  return {
    artifactType,
    artifactId,
    repoId,
    status: 'unshared'
  };
}

// ============================================================
// SHARED ARTIFACT SCANNING
// ============================================================

/**
 * List all shared artifacts of a given type across all repos.
 * Returns array of { ...artifactDir entries, _repoId, _repoName }
 */
function listSharedArtifactDirs(artifactType) {
  const registry = loadRepos();
  const results = [];

  for (const repo of registry.repositories) {
    const typeDir = path.join(sharedDir, repo.id, artifactType);
    if (!fs.existsSync(typeDir)) continue;

    try {
      const entries = fs.readdirSync(typeDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          results.push({
            id: entry.name,
            dirPath: path.join(typeDir, entry.name),
            repoId: repo.id,
            repoName: repo.name,
            shared: true
          });
        }
      }
    } catch (err) {
      console.error(`Error scanning shared artifacts in ${repo.id}/${artifactType}:`, err);
    }
  }

  return results;
}

/**
 * List shared artifacts that are stored as JSON files (e.g., prototypes)
 */
function listSharedArtifactFiles(artifactType, extension = '.json') {
  const registry = loadRepos();
  const results = [];

  for (const repo of registry.repositories) {
    const typeDir = path.join(sharedDir, repo.id, artifactType);
    if (!fs.existsSync(typeDir)) continue;

    try {
      const files = fs.readdirSync(typeDir);
      const matching = files.filter(f => f.endsWith(extension));
      for (const file of matching) {
        results.push({
          fileName: file,
          filePath: path.join(typeDir, file),
          repoId: repo.id,
          repoName: repo.name,
          shared: true
        });
      }
    } catch (err) {
      console.error(`Error scanning shared artifact files in ${repo.id}/${artifactType}:`, err);
    }
  }

  return results;
}

// ============================================================
// AUTO-SYNC
// ============================================================

let syncInterval = null;

/**
 * Start auto-sync for all repos with autoSync enabled
 */
function startAutoSync(intervalMs = 5 * 60 * 1000) {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  syncInterval = setInterval(() => {
    const registry = loadRepos();
    for (const repo of registry.repositories) {
      if (repo.autoSync) {
        try {
          syncRepo(repo.id);
        } catch (err) {
          console.error(`[sharing] Auto-sync failed for ${repo.id}:`, err.message);
        }
      }
    }
  }, intervalMs);

  // Auto-sync running silently — errors will still be logged
}

/**
 * Stop auto-sync
 */
function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

/**
 * Auto-commit changes for a specific artifact in a shared repo
 */
function autoCommitArtifact(repoId, artifactType, artifactId) {
  const repoPath = path.join(sharedDir, repoId);
  if (!fs.existsSync(repoPath) || !isGitRepo(repoPath)) {
    return { success: false, error: 'Repository not found' };
  }

  const artifactRelPath = `${artifactType}/${artifactId}`;

  // Check if there are changes to this artifact
  const statusResult = runGit(repoPath, `status --porcelain -- "${artifactRelPath}"`);
  if (!statusResult.success || statusResult.output.length === 0) {
    return { success: true, committed: false, message: 'No changes to commit' };
  }

  // Stage and commit
  runGit(repoPath, `add "${artifactRelPath}"`);
  const commitResult = runGit(repoPath, `commit -m "Update ${artifactRelPath}"`);

  if (!commitResult.success) {
    return { success: false, error: commitResult.error };
  }

  // Push (best-effort)
  const pushResult = runGit(repoPath, 'push', { timeout: 60000 });

  return {
    success: true,
    committed: true,
    pushed: pushResult.success,
    message: pushResult.success ? 'Committed and pushed' : 'Committed locally (push pending)'
  };
}

// ============================================================
// RESOLVE HELPERS
// ============================================================

/**
 * Given an artifact type and ID, determine if it lives in a shared repo.
 * Returns { shared: true, repoId, repoName, repoPath } or { shared: false }
 */
function resolveArtifactLocation(artifactType, artifactId) {
  // Check local first
  const localPath = path.join(dataDir, artifactType, artifactId);
  if (fs.existsSync(localPath)) {
    return { shared: false, path: localPath };
  }

  // Check shared repos
  const registry = loadRepos();
  for (const repo of registry.repositories) {
    const sharedPath = path.join(sharedDir, repo.id, artifactType, artifactId);
    if (fs.existsSync(sharedPath)) {
      return {
        shared: true,
        repoId: repo.id,
        repoName: repo.name,
        path: sharedPath
      };
    }
  }

  return { shared: false, path: localPath, exists: false };
}

module.exports = {
  sharedDir,
  runGit,
  isGitRepo,
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
  startAutoSync,
  stopAutoSync,
  autoCommitArtifact,
  resolveArtifactLocation
};
