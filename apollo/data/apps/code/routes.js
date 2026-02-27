const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_DIR = path.join(__dirname, '../../data');
const CODE_DIR = path.join(DATA_DIR, 'code');
const APOLLO_ROOT = path.join(__dirname, '../../..');

// Ensure code directory exists
if (!fs.existsSync(CODE_DIR)) {
  fs.mkdirSync(CODE_DIR, { recursive: true });
}

// Built-in projects that are always visible and cannot be deleted
const BUILT_IN_PROJECTS = [
  {
    id: 'apollo',
    name: 'Apollo',
    description: 'The Apollo application — your local integrated design environment',
    language: 'JavaScript',
    builtIn: true,
    rootPath: APOLLO_ROOT
  }
];

// Resolve the filesystem path for a project (handles built-in vs user projects)
const resolveProjectPath = (id) => {
  const builtIn = BUILT_IN_PROJECTS.find(p => p.id === id);
  if (builtIn) {
    return { projectPath: builtIn.rootPath, builtIn: true, meta: builtIn };
  }
  return { projectPath: path.join(CODE_DIR, id), builtIn: false, meta: null };
};

// Helper function to get file stats
const getFileStats = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  } catch (err) {
    return null;
  }
};

// Helper function to count files in a directory recursively
const countFiles = (dirPath) => {
  let count = 0;
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      if (stats.isFile()) {
        count++;
      } else if (stats.isDirectory()) {
        count += countFiles(itemPath);
      }
    }
  } catch (err) {
    console.error('Error counting files:', err);
  }
  return count;
};

// Helper function to detect primary language
const detectLanguage = (dirPath) => {
  const extensions = {};
  const languageMap = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.py': 'Python',
    '.rb': 'Ruby',
    '.go': 'Go',
    '.rs': 'Rust',
    '.java': 'Java',
    '.c': 'C',
    '.cpp': 'C++',
    '.html': 'HTML',
    '.css': 'CSS'
  };

  const scanDir = (dir) => {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules') continue;
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        if (stats.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (languageMap[ext]) {
            extensions[ext] = (extensions[ext] || 0) + 1;
          }
        } else if (stats.isDirectory()) {
          scanDir(itemPath);
        }
      }
    } catch (err) {
      // Ignore errors
    }
  };

  scanDir(dirPath);

  // Find the most common extension
  let maxCount = 0;
  let primaryExt = null;
  for (const [ext, count] of Object.entries(extensions)) {
    if (count > maxCount) {
      maxCount = count;
      primaryExt = ext;
    }
  }

  return primaryExt ? languageMap[primaryExt] : null;
};

// Helper function to read directory tree
const readDirectoryTree = (dirPath, relativePath = '') => {
  const result = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    
    // Sort: directories first, then files
    const sorted = items
      .filter(item => !item.startsWith('.') && item !== 'node_modules')
      .sort((a, b) => {
        const aIsDir = fs.statSync(path.join(dirPath, a)).isDirectory();
        const bIsDir = fs.statSync(path.join(dirPath, b)).isDirectory();
        if (aIsDir && !bIsDir) return -1;
        if (!aIsDir && bIsDir) return 1;
        return a.localeCompare(b);
      });

    for (const item of sorted) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        result.push({
          name: item,
          type: 'directory',
          children: readDirectoryTree(itemPath, path.join(relativePath, item))
        });
      } else {
        result.push({
          name: item,
          type: 'file',
          size: stats.size
        });
      }
    }
  } catch (err) {
    console.error('Error reading directory:', err);
  }
  
  return result;
};

// GET /api/code - List all code projects
router.get('/', (req, res) => {
  try {
    const projects = [];

    // Add built-in projects first
    for (const bp of BUILT_IN_PROJECTS) {
      try {
        const stats = fs.statSync(bp.rootPath);
        projects.push({
          id: bp.id,
          name: bp.name,
          description: bp.description,
          language: bp.language,
          builtIn: true,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        });
      } catch (err) {
        // Built-in project path not accessible, skip it
        console.error(`Built-in project ${bp.id} not accessible:`, err.message);
      }
    }
    
    if (fs.existsSync(CODE_DIR)) {
      const items = fs.readdirSync(CODE_DIR);
      
      for (const item of items) {
        const itemPath = path.join(CODE_DIR, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          // Read metadata if available
          const metadataPath = path.join(itemPath, '.project.json');
          let metadata = {};
          if (fs.existsSync(metadataPath)) {
            try {
              metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            } catch (err) {
              // Ignore parse errors
            }
          }

          projects.push({
            id: item,
            name: metadata.name || item,
            description: metadata.description || null,
            language: metadata.language || detectLanguage(itemPath),
            fileCount: countFiles(itemPath),
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          });
        }
      }
    }

    // Sort: built-in projects first, then by modified date (newest first)
    projects.sort((a, b) => {
      if (a.builtIn && !b.builtIn) return -1;
      if (!a.builtIn && b.builtIn) return 1;
      return new Date(b.modifiedAt) - new Date(a.modifiedAt);
    });

    res.json({ success: true, projects });
  } catch (err) {
    console.error('Error listing code projects:', err);
    res.status(500).json({ success: false, error: 'Failed to list projects' });
  }
});

// POST /api/code - Create a new project
router.post('/', (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Project name is required' });
    }

    // Sanitize project ID
    const id = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Prevent creating a project with a built-in project ID
    if (BUILT_IN_PROJECTS.find(p => p.id === id)) {
      return res.status(400).json({ success: false, error: 'This name is reserved for a built-in project' });
    }

    const projectPath = path.join(CODE_DIR, id);

    if (fs.existsSync(projectPath)) {
      return res.status(400).json({ success: false, error: 'Project already exists' });
    }

    // Create project directory
    fs.mkdirSync(projectPath, { recursive: true });

    // Create metadata file
    const metadata = {
      name,
      description: '',
      createdAt: new Date().toISOString()
    };
    fs.writeFileSync(
      path.join(projectPath, '.project.json'),
      JSON.stringify(metadata, null, 2)
    );

    // Create a sample file
    fs.writeFileSync(
      path.join(projectPath, 'index.js'),
      `// ${name}\n// Created on ${new Date().toLocaleDateString()}\n\nconsole.log('Hello, World!');\n`
    );

    const stats = fs.statSync(projectPath);

    res.json({
      success: true,
      project: {
        id,
        name,
        description: '',
        language: 'JavaScript',
        fileCount: 1,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      }
    });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
});

// GET /api/code/:id - Get project details and file tree
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { projectPath, builtIn, meta } = resolveProjectPath(id);

    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    let projectInfo;

    if (builtIn) {
      const stats = fs.statSync(projectPath);
      projectInfo = {
        id,
        name: meta.name,
        description: meta.description,
        language: meta.language,
        builtIn: true,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    } else {
      // Read metadata if available
      const metadataPath = path.join(projectPath, '.project.json');
      let metadata = {};
      if (fs.existsSync(metadataPath)) {
        try {
          metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        } catch (err) {
          // Ignore parse errors
        }
      }

      const stats = fs.statSync(projectPath);
      projectInfo = {
        id,
        name: metadata.name || id,
        description: metadata.description || null,
        language: metadata.language || detectLanguage(projectPath),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    }

    const files = readDirectoryTree(projectPath);

    res.json({
      success: true,
      project: projectInfo,
      files
    });
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch project' });
  }
});

// GET /api/code/:id/file - Get file contents
router.get('/:id/file', (req, res) => {
  try {
    const { id } = req.params;
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path is required' });
    }

    const { projectPath } = resolveProjectPath(id);
    const fullPath = path.join(projectPath, filePath);

    // Security check: ensure the path is within the project directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedProjectPath = path.resolve(projectPath);
    if (!resolvedPath.startsWith(resolvedProjectPath)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    res.json({ success: true, content });
  } catch (err) {
    console.error('Error reading file:', err);
    res.status(500).json({ success: false, error: 'Failed to read file' });
  }
});

// PUT /api/code/:id/file - Save file contents
router.put('/:id/file', (req, res) => {
  try {
    const { id } = req.params;
    const { path: filePath, content } = req.body;

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path is required' });
    }

    const { projectPath } = resolveProjectPath(id);
    const fullPath = path.join(projectPath, filePath);

    // Security check: ensure the path is within the project directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedProjectPath = path.resolve(projectPath);
    if (!resolvedPath.startsWith(resolvedProjectPath)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content || '');
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving file:', err);
    res.status(500).json({ success: false, error: 'Failed to save file' });
  }
});

// POST /api/code/:id/file - Create new file
router.post('/:id/file', (req, res) => {
  try {
    const { id } = req.params;
    const { path: filePath, content = '' } = req.body;

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path is required' });
    }

    const { projectPath } = resolveProjectPath(id);
    const fullPath = path.join(projectPath, filePath);

    // Security check
    const resolvedPath = path.resolve(fullPath);
    const resolvedProjectPath = path.resolve(projectPath);
    if (!resolvedPath.startsWith(resolvedProjectPath)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (fs.existsSync(fullPath)) {
      return res.status(400).json({ success: false, error: 'File already exists' });
    }

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content);
    res.json({ success: true });
  } catch (err) {
    console.error('Error creating file:', err);
    res.status(500).json({ success: false, error: 'Failed to create file' });
  }
});

// DELETE /api/code/:id/file - Delete file
router.delete('/:id/file', (req, res) => {
  try {
    const { id } = req.params;
    const { path: filePath } = req.query;

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path is required' });
    }

    const { projectPath } = resolveProjectPath(id);
    const fullPath = path.join(projectPath, filePath);

    // Security check
    const resolvedPath = path.resolve(fullPath);
    const resolvedProjectPath = path.resolve(projectPath);
    if (!resolvedPath.startsWith(resolvedProjectPath)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    fs.unlinkSync(fullPath);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ success: false, error: 'Failed to delete file' });
  }
});

// DELETE /api/code/:id - Delete a project
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deletion of built-in projects
    if (BUILT_IN_PROJECTS.find(p => p.id === id)) {
      return res.status(400).json({ success: false, error: 'Cannot delete a built-in project' });
    }

    const projectPath = path.join(CODE_DIR, id);

    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    fs.rmSync(projectPath, { recursive: true });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
});

// ============================================================
// GIT ENDPOINTS
// ============================================================

// Helper: run a git command in a project directory
const runGit = (projectPath, args, options = {}) => {
  try {
    const result = execSync(`git ${args}`, {
      cwd: projectPath,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
      ...options
    });
    return { success: true, output: result.trim() };
  } catch (err) {
    return { success: false, error: err.stderr?.trim() || err.message };
  }
};

// Helper: check if a directory is a git repo
const isGitRepo = (projectPath) => {
  const result = runGit(projectPath, 'rev-parse --is-inside-work-tree');
  return result.success && result.output === 'true';
};

// GET /api/code/:id/git/status - Get git status
router.get('/:id/git/status', (req, res) => {
  try {
    const { id } = req.params;
    const { projectPath } = resolveProjectPath(id);

    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    if (!isGitRepo(projectPath)) {
      return res.json({ success: true, isRepo: false });
    }

    // Get porcelain status for parsing
    const statusResult = runGit(projectPath, 'status --porcelain=v1 -uall');
    if (!statusResult.success) {
      return res.status(500).json({ success: false, error: statusResult.error });
    }

    const files = [];
    if (statusResult.output) {
      const lines = statusResult.output.split('\n');
      for (const line of lines) {
        if (!line) continue;
        const indexStatus = line[0];
        const workTreeStatus = line[1];
        const filePath = line.substring(3);

        // Determine the display status
        let status = 'unmodified';
        let staged = false;

        if (indexStatus === '?' && workTreeStatus === '?') {
          status = 'untracked';
        } else if (indexStatus === 'A') {
          status = 'added';
          staged = true;
        } else if (indexStatus === 'M') {
          status = 'modified';
          staged = true;
        } else if (indexStatus === 'D') {
          status = 'deleted';
          staged = true;
        } else if (indexStatus === 'R') {
          status = 'renamed';
          staged = true;
        }

        // Work tree changes (unstaged)
        if (workTreeStatus === 'M') {
          if (!staged) status = 'modified';
          // If both staged and work tree modified, it's partially staged
        } else if (workTreeStatus === 'D') {
          if (!staged) status = 'deleted';
        }

        files.push({
          path: filePath,
          indexStatus,
          workTreeStatus,
          status,
          staged: indexStatus !== '?' && indexStatus !== ' ' && indexStatus !== '!'
        });
      }
    }

    // Get current branch
    const branchResult = runGit(projectPath, 'branch --show-current');
    const branch = branchResult.success ? branchResult.output : 'HEAD';

    // Get ahead/behind counts
    let ahead = 0, behind = 0;
    const trackingResult = runGit(projectPath, 'rev-list --left-right --count HEAD...@{upstream}');
    if (trackingResult.success) {
      const parts = trackingResult.output.split('\t');
      ahead = parseInt(parts[0]) || 0;
      behind = parseInt(parts[1]) || 0;
    }

    // Get remote URL
    const remoteResult = runGit(projectPath, 'remote get-url origin');
    const remoteUrl = remoteResult.success ? remoteResult.output : null;

    res.json({
      success: true,
      isRepo: true,
      branch,
      ahead,
      behind,
      remoteUrl,
      files,
      staged: files.filter(f => f.staged),
      unstaged: files.filter(f => !f.staged && f.status !== 'untracked'),
      untracked: files.filter(f => f.status === 'untracked')
    });
  } catch (err) {
    console.error('Error getting git status:', err);
    res.status(500).json({ success: false, error: 'Failed to get git status' });
  }
});

// GET /api/code/:id/git/log - Get commit log
router.get('/:id/git/log', (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, skip = 0, branch } = req.query;
    const { projectPath } = resolveProjectPath(id);

    if (!fs.existsSync(projectPath) || !isGitRepo(projectPath)) {
      return res.status(404).json({ success: false, error: 'Not a git repository' });
    }

    const branchArg = branch || '';
    const format = '--format=%H%n%h%n%an%n%ae%n%aI%n%s%n%P%n%D%n---END---';
    const logResult = runGit(projectPath, `log ${branchArg} ${format} -n ${limit} --skip=${skip}`);

    if (!logResult.success) {
      return res.json({ success: true, commits: [] });
    }

    const commits = [];
    if (logResult.output) {
      const entries = logResult.output.split('---END---\n');
      for (const entry of entries) {
        const trimmed = entry.trim();
        if (!trimmed) continue;
        const lines = trimmed.split('\n');
        if (lines.length < 6) continue;

        commits.push({
          hash: lines[0],
          shortHash: lines[1],
          author: lines[2],
          email: lines[3],
          date: lines[4],
          message: lines[5],
          parents: lines[6] ? lines[6].split(' ').filter(Boolean) : [],
          refs: lines[7] ? lines[7].split(', ').filter(Boolean) : []
        });
      }
    }

    res.json({ success: true, commits });
  } catch (err) {
    console.error('Error getting git log:', err);
    res.status(500).json({ success: false, error: 'Failed to get git log' });
  }
});

// GET /api/code/:id/git/branches - List branches
router.get('/:id/git/branches', (req, res) => {
  try {
    const { id } = req.params;
    const { projectPath } = resolveProjectPath(id);

    if (!fs.existsSync(projectPath) || !isGitRepo(projectPath)) {
      return res.status(404).json({ success: false, error: 'Not a git repository' });
    }

    // Local branches
    const localResult = runGit(projectPath, 'branch --format="%(refname:short)|%(objectname:short)|%(upstream:short)|%(HEAD)"');
    const branches = [];

    if (localResult.success && localResult.output) {
      const lines = localResult.output.split('\n');
      for (const line of lines) {
        const cleaned = line.replace(/"/g, '');
        const [name, hash, upstream, isCurrent] = cleaned.split('|');
        if (!name) continue;
        branches.push({
          name: name.trim(),
          hash: hash?.trim(),
          upstream: upstream?.trim() || null,
          current: isCurrent?.trim() === '*',
          remote: false
        });
      }
    }

    // Remote branches
    const remoteResult = runGit(projectPath, 'branch -r --format="%(refname:short)|%(objectname:short)"');
    const remoteBranches = [];

    if (remoteResult.success && remoteResult.output) {
      const lines = remoteResult.output.split('\n');
      for (const line of lines) {
        const cleaned = line.replace(/"/g, '');
        const [name, hash] = cleaned.split('|');
        if (!name || name.includes('HEAD')) continue;
        remoteBranches.push({
          name: name.trim(),
          hash: hash?.trim(),
          remote: true
        });
      }
    }

    const currentResult = runGit(projectPath, 'branch --show-current');
    const currentBranch = currentResult.success ? currentResult.output : '';

    res.json({
      success: true,
      branches,
      remoteBranches,
      currentBranch
    });
  } catch (err) {
    console.error('Error getting branches:', err);
    res.status(500).json({ success: false, error: 'Failed to get branches' });
  }
});

// GET /api/code/:id/git/diff - Get diff for a file or all changes
router.get('/:id/git/diff', (req, res) => {
  try {
    const { id } = req.params;
    const { file, staged } = req.query;
    const { projectPath } = resolveProjectPath(id);

    if (!fs.existsSync(projectPath) || !isGitRepo(projectPath)) {
      return res.status(404).json({ success: false, error: 'Not a git repository' });
    }

    const stagedFlag = staged === 'true' ? '--cached ' : '';
    const fileArg = file ? `-- "${file}"` : '';
    const diffResult = runGit(projectPath, `diff ${stagedFlag}${fileArg}`);

    res.json({
      success: true,
      diff: diffResult.success ? diffResult.output : ''
    });
  } catch (err) {
    console.error('Error getting diff:', err);
    res.status(500).json({ success: false, error: 'Failed to get diff' });
  }
});

// POST /api/code/:id/git/stage - Stage files
router.post('/:id/git/stage', (req, res) => {
  try {
    const { id } = req.params;
    const { files } = req.body; // Array of file paths, or ['*'] for all
    const { projectPath } = resolveProjectPath(id);

    if (!fs.existsSync(projectPath) || !isGitRepo(projectPath)) {
      return res.status(404).json({ success: false, error: 'Not a git repository' });
    }

    const fileArgs = files && files.length > 0
      ? files.map(f => `"${f}"`).join(' ')
      : '.';

    const result = runGit(projectPath, `add ${fileArgs}`);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error staging files:', err);
    res.status(500).json({ success: false, error: 'Failed to stage files' });
  }
});

// POST /api/code/:id/git/unstage - Unstage files
router.post('/:id/git/unstage', (req, res) => {
  try {
    const { id } = req.params;
    const { files } = req.body;
    const { projectPath } = resolveProjectPath(id);

    if (!fs.existsSync(projectPath) || !isGitRepo(projectPath)) {
      return res.status(404).json({ success: false, error: 'Not a git repository' });
    }

    const fileArgs = files && files.length > 0
      ? files.map(f => `"${f}"`).join(' ')
      : '.';

    const result = runGit(projectPath, `reset HEAD ${fileArgs}`);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error unstaging files:', err);
    res.status(500).json({ success: false, error: 'Failed to unstage files' });
  }
});

// POST /api/code/:id/git/commit - Commit staged changes
router.post('/:id/git/commit', (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const { projectPath } = resolveProjectPath(id);

    if (!message) {
      return res.status(400).json({ success: false, error: 'Commit message is required' });
    }

    if (!fs.existsSync(projectPath) || !isGitRepo(projectPath)) {
      return res.status(404).json({ success: false, error: 'Not a git repository' });
    }

    // Escape the message for shell
    const escapedMessage = message.replace(/"/g, '\\"');
    const result = runGit(projectPath, `commit -m "${escapedMessage}"`);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({ success: true, output: result.output });
  } catch (err) {
    console.error('Error committing:', err);
    res.status(500).json({ success: false, error: 'Failed to commit' });
  }
});

// POST /api/code/:id/git/push - Push to remote
router.post('/:id/git/push', (req, res) => {
  try {
    const { id } = req.params;
    const { remote = 'origin', branch } = req.body;
    const { projectPath } = resolveProjectPath(id);

    if (!fs.existsSync(projectPath) || !isGitRepo(projectPath)) {
      return res.status(404).json({ success: false, error: 'Not a git repository' });
    }

    const branchArg = branch ? ` ${branch}` : '';
    const result = runGit(projectPath, `push ${remote}${branchArg}`, { timeout: 60000 });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({ success: true, output: result.output });
  } catch (err) {
    console.error('Error pushing:', err);
    res.status(500).json({ success: false, error: 'Failed to push' });
  }
});

// POST /api/code/:id/git/pull - Pull from remote
router.post('/:id/git/pull', (req, res) => {
  try {
    const { id } = req.params;
    const { remote = 'origin', branch } = req.body;
    const { projectPath } = resolveProjectPath(id);

    if (!fs.existsSync(projectPath) || !isGitRepo(projectPath)) {
      return res.status(404).json({ success: false, error: 'Not a git repository' });
    }

    const branchArg = branch ? ` ${branch}` : '';
    const result = runGit(projectPath, `pull ${remote}${branchArg}`, { timeout: 60000 });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({ success: true, output: result.output });
  } catch (err) {
    console.error('Error pulling:', err);
    res.status(500).json({ success: false, error: 'Failed to pull' });
  }
});

// POST /api/code/:id/git/fetch - Fetch from remote
router.post('/:id/git/fetch', (req, res) => {
  try {
    const { id } = req.params;
    const { remote = 'origin' } = req.body;
    const { projectPath } = resolveProjectPath(id);

    if (!fs.existsSync(projectPath) || !isGitRepo(projectPath)) {
      return res.status(404).json({ success: false, error: 'Not a git repository' });
    }

    const result = runGit(projectPath, `fetch ${remote}`, { timeout: 60000 });

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({ success: true, output: result.output });
  } catch (err) {
    console.error('Error fetching:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch' });
  }
});

// POST /api/code/:id/git/checkout - Checkout a branch
router.post('/:id/git/checkout', (req, res) => {
  try {
    const { id } = req.params;
    const { branch, create } = req.body;
    const { projectPath } = resolveProjectPath(id);

    if (!branch) {
      return res.status(400).json({ success: false, error: 'Branch name is required' });
    }

    if (!fs.existsSync(projectPath) || !isGitRepo(projectPath)) {
      return res.status(404).json({ success: false, error: 'Not a git repository' });
    }

    const createFlag = create ? '-b ' : '';
    const result = runGit(projectPath, `checkout ${createFlag}${branch}`);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({ success: true, output: result.output });
  } catch (err) {
    console.error('Error checking out branch:', err);
    res.status(500).json({ success: false, error: 'Failed to checkout branch' });
  }
});

// POST /api/code/:id/git/discard - Discard changes to a file
router.post('/:id/git/discard', (req, res) => {
  try {
    const { id } = req.params;
    const { files } = req.body;
    const { projectPath } = resolveProjectPath(id);

    if (!fs.existsSync(projectPath) || !isGitRepo(projectPath)) {
      return res.status(404).json({ success: false, error: 'Not a git repository' });
    }

    const fileArgs = files && files.length > 0
      ? files.map(f => `"${f}"`).join(' ')
      : '.';

    const result = runGit(projectPath, `checkout -- ${fileArgs}`);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error discarding changes:', err);
    res.status(500).json({ success: false, error: 'Failed to discard changes' });
  }
});

// GET /api/code/:id/git/file-diff - Get diff content for rendering in Monaco diff editor
router.get('/:id/git/file-diff', (req, res) => {
  try {
    const { id } = req.params;
    const { file, staged } = req.query;
    const { projectPath } = resolveProjectPath(id);

    if (!file) {
      return res.status(400).json({ success: false, error: 'File path is required' });
    }

    if (!fs.existsSync(projectPath) || !isGitRepo(projectPath)) {
      return res.status(404).json({ success: false, error: 'Not a git repository' });
    }

    // Get the original (HEAD) version of the file
    const origResult = runGit(projectPath, `show HEAD:"${file}"`);
    const original = origResult.success ? origResult.output : '';

    // Get the current version of the file
    const fullPath = path.join(projectPath, file);
    let modified = '';
    if (fs.existsSync(fullPath)) {
      modified = fs.readFileSync(fullPath, 'utf-8');
    }

    res.json({ success: true, original, modified });
  } catch (err) {
    console.error('Error getting file diff:', err);
    res.status(500).json({ success: false, error: 'Failed to get file diff' });
  }
});

// GET /api/code/:id/search - Search for text across project files
router.get('/:id/search', (req, res) => {
  try {
    const { id } = req.params;
    const { query, regex, caseSensitive } = req.query;
    const { projectPath } = resolveProjectPath(id);

    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query is required' });
    }

    if (!fs.existsSync(projectPath)) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const results = [];
    const maxResults = 200;

    const searchDir = (dir, relativePath = '') => {
      if (results.length >= maxResults) return;
      try {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          if (results.length >= maxResults) return;
          if (item.startsWith('.') || item === 'node_modules' || item === 'vendor' || item === 'dist' || item === 'build') continue;
          const itemPath = path.join(dir, item);
          const relPath = relativePath ? `${relativePath}/${item}` : item;
          const stats = fs.statSync(itemPath);

          if (stats.isDirectory()) {
            searchDir(itemPath, relPath);
          } else if (stats.isFile() && stats.size < 1024 * 512) { // Skip files > 512KB
            try {
              const content = fs.readFileSync(itemPath, 'utf-8');
              const lines = content.split('\n');
              const flags = caseSensitive === 'true' ? 'g' : 'gi';
              const searchRegex = regex === 'true'
                ? new RegExp(query, flags)
                : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

              for (let i = 0; i < lines.length; i++) {
                if (results.length >= maxResults) return;
                if (searchRegex.test(lines[i])) {
                  results.push({
                    file: relPath,
                    line: i + 1,
                    content: lines[i].trim().substring(0, 200),
                    column: lines[i].search(searchRegex)
                  });
                }
                searchRegex.lastIndex = 0; // Reset regex state
              }
            } catch (err) {
              // Skip binary or unreadable files
            }
          }
        }
      } catch (err) {
        // Skip unreadable directories
      }
    };

    searchDir(projectPath);

    res.json({ success: true, results, total: results.length, truncated: results.length >= maxResults });
  } catch (err) {
    console.error('Error searching:', err);
    res.status(500).json({ success: false, error: 'Failed to search' });
  }
});

module.exports = router;
