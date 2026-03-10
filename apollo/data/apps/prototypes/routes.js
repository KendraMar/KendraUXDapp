const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const processManager = require('../../../server/lib/prototypeProcessManager');
const { listSharedArtifactFiles } = require('../../../server/lib/sharing');
const { hasHeroImage, getHeroPath, generateHeroFromUrl } = require('../../../server/lib/heroService');

const DATA_DIR = path.join(__dirname, '../../prototypes');

// Helper to read all prototype files
async function getAllPrototypes() {
  try {
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    const prototypes = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
        return JSON.parse(content);
      })
    );
    
    // Sort by modifiedAt descending
    return prototypes.sort((a, b) => 
      new Date(b.modifiedAt) - new Date(a.modifiedAt)
    );
  } catch (error) {
    console.error('Error reading prototypes:', error);
    return [];
  }
}

// Helper to read a single prototype
async function getPrototype(id) {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// Helper to save a prototype
async function savePrototype(prototype) {
  const filePath = path.join(DATA_DIR, `${prototype.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(prototype, null, 2));
}

// ============================================
// Static routes (must be defined BEFORE dynamic :id routes)
// ============================================

// GET /api/prototypes - List all prototypes (local + shared)
router.get('/', async (req, res) => {
  try {
    const prototypes = await getAllPrototypes();
    
    // Return summary info for list view
    const summaries = prototypes.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      product: p.product,
      release: p.release,
      modifiedAt: p.modifiedAt,
      createdAt: p.createdAt,
      shared: false,
      imported: p.imported || false,
      repositoryUrl: p.repository?.url || null,
      hasHero: hasHeroImage(path.join(DATA_DIR, p.id))
    }));

    // Load shared prototypes from all connected repos
    try {
      const sharedFiles = listSharedArtifactFiles('prototypes', '.json');
      for (const shared of sharedFiles) {
        try {
          const content = fsSync.readFileSync(shared.filePath, 'utf-8');
          const p = JSON.parse(content);
          summaries.push({
            id: p.id,
            name: p.name,
            description: p.description,
            product: p.product,
            release: p.release,
            modifiedAt: p.modifiedAt,
            createdAt: p.createdAt,
            shared: true,
            repoId: shared.repoId,
            repoName: shared.repoName
          });
        } catch (err) {
          console.error(`Error loading shared prototype ${shared.fileName}:`, err);
        }
      }
    } catch (err) {
      console.error('Error loading shared prototypes:', err);
    }

    // Sort by modifiedAt descending
    summaries.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
    
    res.json({ success: true, prototypes: summaries });
  } catch (error) {
    console.error('Error fetching prototypes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch prototypes' });
  }
});

// Available products for dropdown
router.get('/meta/products', async (req, res) => {
  const products = [
    { key: 'acm', label: 'ACM', description: 'Red Hat Advanced Cluster Management for Kubernetes' },
    { key: 'acs', label: 'ACS', description: 'Red Hat Advanced Cluster Security for Kubernetes' },
    { key: 'ansible', label: 'Ansible', description: 'Red Hat Ansible Automation Platform' },
    { key: 'consoledot', label: 'ConsoleDot', description: 'Red Hat ConsoleDot' },
    { key: 'openshift', label: 'OCP', description: 'Red Hat OpenShift Container Platform' },
    { key: 'openshift-virtualization', label: 'OCP Virt', description: 'Red Hat OpenShift Virtualization' },
    { key: 'rhdh', label: 'RHDH', description: 'Red Hat Developer Hub' },
    { key: 'rhel', label: 'RHEL', description: 'Red Hat Enterprise Linux' },
    { key: 'rhoai', label: 'RHOAI', description: 'Red Hat OpenShift AI' }
  ];
  
  res.json({ success: true, products });
});

// GET /api/prototypes/processes/list - List all running prototype processes
router.get('/processes/list', async (req, res) => {
  try {
    const processes = processManager.getAllProcesses();
    res.json({ 
      success: true, 
      processes,
      limits: {
        maxProcesses: processManager.MAX_PROCESSES,
        inactivityTimeoutMs: processManager.INACTIVITY_TIMEOUT_MS
      }
    });
  } catch (error) {
    console.error('Error listing processes:', error);
    res.status(500).json({ success: false, error: 'Failed to list processes' });
  }
});

// ============================================
// Hero Image Endpoints (before dynamic :id routes)
// ============================================

// GET /api/prototypes/:id/hero - Serve hero image
router.get('/:id/hero', (req, res) => {
  const protoDir = path.join(DATA_DIR, req.params.id);
  const heroPath = getHeroPath(protoDir);
  
  if (!fsSync.existsSync(heroPath)) {
    return res.status(404).json({ success: false, error: 'No hero image available' });
  }
  
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  fsSync.createReadStream(heroPath).pipe(res);
});

// POST /api/prototypes/:id/hero/generate - Generate hero image from embed URL
router.post('/:id/hero/generate', async (req, res) => {
  try {
    const prototype = await getPrototype(req.params.id);
    
    if (!prototype) {
      return res.status(404).json({ success: false, error: 'Prototype not found' });
    }
    
    const embedUrl = prototype.embed?.url;
    if (!embedUrl) {
      return res.status(400).json({ success: false, error: 'No embed URL configured' });
    }
    
    const protoDir = path.join(DATA_DIR, req.params.id);
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    const success = await generateHeroFromUrl(protoDir, embedUrl, baseUrl);
    
    res.json({
      success,
      message: success ? 'Hero image generated' : 'Failed to generate hero image',
      heroUrl: success ? `/api/prototypes/${req.params.id}/hero` : null
    });
  } catch (error) {
    console.error('Error generating hero:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/prototypes/:id/hero/upload - Upload a hero image (base64)
router.post('/:id/hero/upload', async (req, res) => {
  try {
    const { data } = req.body;
    if (!data) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }
    
    const protoDir = path.join(DATA_DIR, req.params.id);
    if (!fsSync.existsSync(protoDir)) {
      fsSync.mkdirSync(protoDir, { recursive: true });
    }
    
    const cleanData = data.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanData, 'base64');
    fsSync.writeFileSync(path.join(protoDir, 'hero.png'), buffer);
    
    res.json({
      success: true,
      message: 'Hero image uploaded',
      heroUrl: `/api/prototypes/${req.params.id}/hero`
    });
  } catch (error) {
    console.error('Error uploading hero:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// Dynamic :id routes
// ============================================

// GET /api/prototypes/:id - Get a single prototype with full details
router.get('/:id', async (req, res) => {
  try {
    const prototype = await getPrototype(req.params.id);
    
    if (!prototype) {
      return res.status(404).json({ success: false, error: 'Prototype not found' });
    }
    
    res.json({ success: true, prototype });
  } catch (error) {
    console.error('Error fetching prototype:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch prototype' });
  }
});

// POST /api/prototypes - Create a new prototype
router.post('/', async (req, res) => {
  try {
    const { name, description, product, embedUrl, repositoryUrl } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    
    // Generate ID from name
    const id = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Check if already exists
    const existing = await getPrototype(id);
    if (existing) {
      return res.status(400).json({ success: false, error: 'A prototype with this name already exists' });
    }
    
    const now = new Date().toISOString();
    
    const prototype = {
      id,
      name,
      description: description || '',
      product: product || { key: 'custom', label: 'Custom', description: 'Custom prototype' },
      release: { key: '1.0', label: '1.0', group: 'Prototypes' },
      embed: {
        type: 'iframe',
        url: embedUrl || 'http://localhost:1225',
        fallbackUrl: null
      },
      repository: {
        url: repositoryUrl || null,
        branch: 'main',
        localPath: null
      },
      scope: {
        selected: 'All',
        options: [{ id: 'all', label: 'All', type: 'default' }]
      },
      context: {
        overview: {
          title: 'What is this?',
          description: description || 'A new prototype.',
          rationale: '',
          deliverables: '',
          team: [],
          personas: []
        },
        sources: { jira: [], drive: [], slack: [] },
        history: []
      },
      discussions: [],
      createdAt: now,
      modifiedAt: now
    };
    
    await savePrototype(prototype);
    
    res.json({ success: true, prototype });
  } catch (error) {
    console.error('Error creating prototype:', error);
    res.status(500).json({ success: false, error: 'Failed to create prototype' });
  }
});

// POST /api/prototypes/import - Import a prototype from a Git repository
router.post('/import', async (req, res) => {
  try {
    const { name, description, repositoryUrl, branch } = req.body;

    if (!repositoryUrl) {
      return res.status(400).json({ success: false, error: 'Repository URL is required' });
    }

    // Derive name from repo URL if not provided
    const derivedName = name || repositoryUrl.split('/').pop().replace(/\.git$/, '');

    // Generate ID from name
    const id = derivedName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if already exists
    const existing = await getPrototype(id);
    if (existing) {
      return res.status(400).json({ success: false, error: 'A prototype with this name already exists' });
    }

    const now = new Date().toISOString();
    const prototypeDir = path.join(DATA_DIR, id);
    const repoDir = path.join(prototypeDir, 'repo');
    const repoBranch = branch || 'main';

    // Create prototype directory
    await fs.mkdir(prototypeDir, { recursive: true });

    // Git clone the repository
    console.log(`[import] Cloning ${repositoryUrl} into ${repoDir}...`);
    try {
      execSync(`git clone --branch ${repoBranch} --single-branch "${repositoryUrl}" "${repoDir}"`, {
        timeout: 120000, // 2 min timeout for clone
        stdio: 'pipe'
      });
    } catch (cloneErr) {
      // If branch-specific clone fails, try without --branch (use default branch)
      console.log(`[import] Branch '${repoBranch}' clone failed, trying default branch...`);
      try {
        execSync(`git clone "${repositoryUrl}" "${repoDir}"`, {
          timeout: 120000,
          stdio: 'pipe'
        });
      } catch (fallbackErr) {
        // Clean up on failure
        await fs.rm(prototypeDir, { recursive: true, force: true });
        return res.status(400).json({
          success: false,
          error: `Failed to clone repository: ${fallbackErr.stderr?.toString() || fallbackErr.message}`
        });
      }
    }

    // Detect build system and run build
    let buildLog = [];
    const packageJsonPath = path.join(repoDir, 'package.json');

    try {
      await fs.access(packageJsonPath);
      const pkgContent = await fs.readFile(packageJsonPath, 'utf-8');
      const pkg = JSON.parse(pkgContent);

      if (pkg.scripts && pkg.scripts.build) {
        console.log(`[import] Detected npm build script, running npm install && npm run build...`);
        buildLog.push('Detected package.json with build script');

        // npm install
        try {
          buildLog.push('Running npm install...');
          execSync('npm install --legacy-peer-deps', {
            cwd: repoDir,
            timeout: 300000, // 5 min for install
            stdio: 'pipe',
            env: { ...process.env, NODE_ENV: 'production' }
          });
          buildLog.push('npm install completed');
        } catch (installErr) {
          buildLog.push(`npm install warning: ${installErr.stderr?.toString().slice(0, 500) || 'unknown'}`);
          // Don't fail - some warnings are okay
        }

        // npm run build
        try {
          buildLog.push('Running npm run build...');
          execSync('npm run build', {
            cwd: repoDir,
            timeout: 300000, // 5 min for build
            stdio: 'pipe',
            env: { ...process.env, NODE_ENV: 'production' }
          });
          buildLog.push('npm run build completed');
        } catch (buildErr) {
          buildLog.push(`Build failed: ${buildErr.stderr?.toString().slice(0, 500) || buildErr.message}`);
        }
      }
    } catch {
      buildLog.push('No package.json found, skipping build step');
    }

    // Detect build output directory
    const buildDirCandidates = ['dist', 'build', 'public', 'out', '_site', '.next/out'];
    let detectedBuildDir = null;

    for (const candidate of buildDirCandidates) {
      const candidatePath = path.join(repoDir, candidate);
      try {
        const stat = await fs.stat(candidatePath);
        if (stat.isDirectory()) {
          // Check if it contains an index.html
          try {
            await fs.access(path.join(candidatePath, 'index.html'));
            detectedBuildDir = candidate;
            buildLog.push(`Found build output with index.html at ${candidate}/`);
            break;
          } catch {
            // No index.html, but mark it as a candidate if nothing else found
            if (!detectedBuildDir) {
              detectedBuildDir = candidate;
              buildLog.push(`Found build output directory at ${candidate}/ (no index.html)`);
            }
          }
        }
      } catch {
        // Directory doesn't exist
      }
    }

    // If no build output dir, check for index.html in repo root
    if (!detectedBuildDir) {
      try {
        await fs.access(path.join(repoDir, 'index.html'));
        detectedBuildDir = '.';
        buildLog.push('Found index.html in repository root');
      } catch {
        buildLog.push('No build output or index.html detected');
      }
    }

    // Determine embed URL
    let embedUrl;
    if (detectedBuildDir && detectedBuildDir === '.') {
      embedUrl = `/data/prototypes/${id}/repo/index.html`;
    } else if (detectedBuildDir) {
      embedUrl = `/data/prototypes/${id}/repo/${detectedBuildDir}/index.html`;
    } else {
      // Fallback - no build artifacts found
      embedUrl = `/data/prototypes/${id}/repo/index.html`;
    }

    // Create the prototype metadata
    const prototype = {
      id,
      name: derivedName,
      description: description || `Imported from ${repositoryUrl}`,
      product: { key: 'custom', label: 'Custom', description: 'Custom prototype' },
      release: { key: '1.0', label: '1.0', group: 'Prototypes' },
      embed: {
        type: 'iframe',
        url: embedUrl,
        fallbackUrl: null
      },
      repository: {
        url: repositoryUrl,
        branch: repoBranch,
        localPath: repoDir
      },
      imported: true,
      buildInfo: {
        hasBuildScript: buildLog.some(l => l.includes('Detected package.json')),
        buildDir: detectedBuildDir,
        log: buildLog
      },
      scope: {
        selected: 'All',
        options: [{ id: 'all', label: 'All', type: 'default' }]
      },
      context: {
        overview: {
          title: derivedName,
          description: description || `Imported from ${repositoryUrl}`,
          rationale: 'Imported from external Git repository',
          deliverables: '',
          team: [],
          personas: []
        },
        sources: { jira: [], drive: [], slack: [] },
        history: [
          {
            id: 'h-1',
            date: now.split('T')[0],
            title: 'Imported from Git',
            description: `Cloned from ${repositoryUrl} (branch: ${repoBranch})`
          }
        ]
      },
      discussions: [],
      createdAt: now,
      modifiedAt: now
    };

    await savePrototype(prototype);

    console.log(`[import] Prototype '${id}' imported successfully. Build log:`, buildLog);

    res.json({
      success: true,
      prototype,
      buildLog
    });
  } catch (error) {
    console.error('Error importing prototype:', error);
    res.status(500).json({ success: false, error: `Failed to import prototype: ${error.message}` });
  }
});

// PUT /api/prototypes/:id - Update a prototype
router.put('/:id', async (req, res) => {
  try {
    const prototype = await getPrototype(req.params.id);
    
    if (!prototype) {
      return res.status(404).json({ success: false, error: 'Prototype not found' });
    }
    
    const updates = req.body;
    const updatedPrototype = {
      ...prototype,
      ...updates,
      id: prototype.id, // Prevent ID changes
      modifiedAt: new Date().toISOString()
    };
    
    await savePrototype(updatedPrototype);
    
    res.json({ success: true, prototype: updatedPrototype });
  } catch (error) {
    console.error('Error updating prototype:', error);
    res.status(500).json({ success: false, error: 'Failed to update prototype' });
  }
});

// POST /api/prototypes/:id/discussions - Add a discussion thread
router.post('/:id/discussions', async (req, res) => {
  try {
    const prototype = await getPrototype(req.params.id);
    
    if (!prototype) {
      return res.status(404).json({ success: false, error: 'Prototype not found' });
    }
    
    const { title, comment } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    
    const thread = {
      id: `thread-${Date.now()}`,
      title,
      comments: comment ? [{
        id: `c-${Date.now()}`,
        author: 'You',
        content: comment,
        timestamp: new Date().toISOString()
      }] : []
    };
    
    prototype.discussions = [...(prototype.discussions || []), thread];
    prototype.modifiedAt = new Date().toISOString();
    
    await savePrototype(prototype);
    
    res.json({ success: true, thread });
  } catch (error) {
    console.error('Error adding discussion:', error);
    res.status(500).json({ success: false, error: 'Failed to add discussion' });
  }
});

// POST /api/prototypes/:id/discussions/:threadId/comments - Add a comment to a thread
router.post('/:id/discussions/:threadId/comments', async (req, res) => {
  try {
    const prototype = await getPrototype(req.params.id);
    
    if (!prototype) {
      return res.status(404).json({ success: false, error: 'Prototype not found' });
    }
    
    const thread = prototype.discussions?.find(t => t.id === req.params.threadId);
    
    if (!thread) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    
    const { content, author } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }
    
    const comment = {
      id: `c-${Date.now()}`,
      author: author || 'You',
      content,
      timestamp: new Date().toISOString()
    };
    
    thread.comments = [...(thread.comments || []), comment];
    prototype.modifiedAt = new Date().toISOString();
    
    await savePrototype(prototype);
    
    res.json({ success: true, comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

// DELETE /api/prototypes/:id - Delete a prototype
router.delete('/:id', async (req, res) => {
  try {
    const filePath = path.join(DATA_DIR, `${req.params.id}.json`);
    
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ success: false, error: 'Prototype not found' });
    }
    
    await fs.unlink(filePath);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting prototype:', error);
    res.status(500).json({ success: false, error: 'Failed to delete prototype' });
  }
});

// GET /api/prototypes/:id/process - Get process status for a prototype
router.get('/:id/process', async (req, res) => {
  try {
    const info = processManager.getProcessInfo(req.params.id);
    
    if (!info) {
      return res.json({ 
        success: true, 
        running: false,
        process: null
      });
    }
    
    // Touch the process to reset inactivity timer
    processManager.touchProcess(req.params.id);
    
    res.json({ 
      success: true, 
      running: info.status === 'running',
      process: info
    });
  } catch (error) {
    console.error('Error getting process status:', error);
    res.status(500).json({ success: false, error: 'Failed to get process status' });
  }
});

// POST /api/prototypes/:id/process/start - Start a prototype server
router.post('/:id/process/start', async (req, res) => {
  try {
    const prototype = await getPrototype(req.params.id);
    
    if (!prototype) {
      return res.status(404).json({ success: false, error: 'Prototype not found' });
    }
    
    // Get server configuration from prototype or request body
    const serverConfig = prototype.server || {};
    const { 
      startCommand = req.body.startCommand || serverConfig.startCommand,
      workingDirectory = req.body.workingDirectory || serverConfig.workingDirectory,
      env = req.body.env || serverConfig.env
    } = {};
    
    const result = await processManager.startProcess(
      prototype.id,
      prototype.name,
      {
        startCommand: startCommand || 'npx serve -l $PORT .',
        workingDirectory: workingDirectory || path.join(__dirname, '../../public/prototypes', prototype.id),
        env: env || {}
      }
    );
    
    if (result.success) {
      res.json({
        success: true,
        ...result,
        message: result.alreadyRunning 
          ? 'Server is already running' 
          : 'Server started successfully'
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error starting process:', error);
    res.status(500).json({ success: false, error: 'Failed to start process' });
  }
});

// POST /api/prototypes/:id/process/stop - Stop a prototype server
router.post('/:id/process/stop', async (req, res) => {
  try {
    const result = await processManager.stopProcess(req.params.id);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.alreadyStopped 
          ? 'Server was already stopped' 
          : 'Server stopped successfully'
      });
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error stopping process:', error);
    res.status(500).json({ success: false, error: 'Failed to stop process' });
  }
});

// POST /api/prototypes/:id/process/touch - Reset inactivity timer (called on iframe interaction)
router.post('/:id/process/touch', async (req, res) => {
  try {
    processManager.touchProcess(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to touch process' });
  }
});

module.exports = router;
