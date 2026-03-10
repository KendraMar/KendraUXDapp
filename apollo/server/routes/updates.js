const express = require('express');
const { execSync, exec } = require('child_process');
const path = require('path');
const router = express.Router();

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const UPSTREAM_URL = 'https://gitlab.cee.redhat.com/uxd/apollo/apollo';
const CHECK_INTERVAL = 8 * 60 * 60 * 1000; // 8 hours (3x per day)

// In-memory state for update info
let updateState = {
  available: false,
  localCommit: null,
  remoteCommit: null,
  newCommits: [],
  lastChecked: null,
  checking: false,
  error: null
};

/**
 * Run a git command in the repo root and return trimmed stdout.
 */
function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: REPO_ROOT, encoding: 'utf-8', timeout: 30000 }).trim();
}

/**
 * Check if there are upstream updates available beyond the current local commit.
 */
async function checkForUpdates() {
  if (updateState.checking) return updateState;

  updateState.checking = true;
  updateState.error = null;

  try {
    // Fetch latest from origin without merging
    git('fetch origin main --quiet');

    // Get local HEAD commit
    const localCommit = git('rev-parse HEAD');
    const remoteCommit = git('rev-parse origin/main');

    updateState.localCommit = localCommit;
    updateState.remoteCommit = remoteCommit;

    if (localCommit === remoteCommit) {
      updateState.available = false;
      updateState.newCommits = [];
    } else {
      // Check if local is behind remote
      const behindCount = git(`rev-list --count HEAD..origin/main`);
      const behind = parseInt(behindCount, 10);

      if (behind > 0) {
        // Get the new commits (most recent first, limit to 20)
        const logOutput = git(
          `log HEAD..origin/main --format="%H|||%h|||%s|||%an|||%ai" --max-count=20`
        );

        const newCommits = logOutput
          .split('\n')
          .filter(Boolean)
          .map(line => {
            const [hash, shortHash, subject, author, date] = line.split('|||');
            return { hash, shortHash, subject, author, date };
          });

        updateState.available = true;
        updateState.newCommits = newCommits;
      } else {
        updateState.available = false;
        updateState.newCommits = [];
      }
    }

    updateState.lastChecked = new Date().toISOString();
  } catch (err) {
    updateState.error = err.message;
    console.error('[updates] Failed to check for updates:', err.message);
  } finally {
    updateState.checking = false;
  }

  return updateState;
}

/**
 * GET /api/updates/status
 * Returns current update state (cached, does not trigger a new check).
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    ...updateState,
    upstreamUrl: UPSTREAM_URL,
    changelogUrl: `${UPSTREAM_URL}/-/commits/main`
  });
});

/**
 * POST /api/updates/check
 * Trigger a fresh check for updates from upstream.
 */
router.post('/check', async (req, res) => {
  try {
    const state = await checkForUpdates();
    res.json({
      success: true,
      ...state,
      upstreamUrl: UPSTREAM_URL,
      changelogUrl: `${UPSTREAM_URL}/-/commits/main`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/updates/apply
 * Pull the latest changes from upstream (rebase onto origin/main).
 */
router.post('/apply', async (req, res) => {
  try {
    // Stash any uncommitted changes first
    let stashed = false;
    try {
      const stashOutput = git('stash');
      stashed = !stashOutput.includes('No local changes');
    } catch {
      // No changes to stash
    }

    // Pull with rebase
    const pullOutput = git('pull --rebase origin main');

    // Pop stash if we stashed
    if (stashed) {
      try {
        git('stash pop');
      } catch (stashErr) {
        console.error('[updates] Warning: stash pop failed:', stashErr.message);
      }
    }

    // Re-check state after update
    const newLocalCommit = git('rev-parse HEAD');

    updateState.localCommit = newLocalCommit;
    updateState.remoteCommit = git('rev-parse origin/main');
    updateState.available = false;
    updateState.newCommits = [];
    updateState.lastChecked = new Date().toISOString();

    res.json({
      success: true,
      message: 'Apollo updated successfully. Restart the server to apply changes.',
      output: pullOutput,
      currentCommit: newLocalCommit,
      needsRestart: true
    });
  } catch (err) {
    // If rebase failed, try to abort it
    try {
      git('rebase --abort');
    } catch {
      // Ignore abort errors
    }

    res.status(500).json({
      success: false,
      error: `Update failed: ${err.message}`,
      hint: 'You may need to resolve conflicts manually.'
    });
  }
});

/**
 * Start periodic update checks (3x per day).
 */
function startPeriodicChecks() {
  // Run initial check after a short delay (let server finish startup)
  setTimeout(() => {
    checkForUpdates().then(state => {
      if (state.available) {
        console.log(`  Update available — ${state.newCommits.length} new commit(s) on origin/main`);
      }
    });
  }, 10000);

  // Then check every 8 hours
  setInterval(() => {
    checkForUpdates().then(state => {
      if (state.available) {
        console.log(`  Update available — ${state.newCommits.length} new commit(s) on origin/main`);
      }
    });
  }, CHECK_INTERVAL);
}

module.exports = router;
module.exports.startPeriodicChecks = startPeriodicChecks;
