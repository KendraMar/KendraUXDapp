/**
 * Prototype Process Manager
 * 
 * Manages server processes for prototypes with:
 * - Maximum of 3 concurrent processes
 * - Auto-shutdown after 30 minutes of inactivity
 * - Dynamic port allocation
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const MAX_PROCESSES = 3;
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const PORT_RANGE_START = 4000;
const PORT_RANGE_END = 4099;

// Active processes: Map<prototypeId, ProcessInfo>
const activeProcesses = new Map();

// Used ports set
const usedPorts = new Set();

/**
 * Get an available port in the range
 */
function getAvailablePort() {
  for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
    if (!usedPorts.has(port)) {
      return port;
    }
  }
  return null;
}

/**
 * Get process info for a prototype
 */
function getProcessInfo(prototypeId) {
  const info = activeProcesses.get(prototypeId);
  if (!info) {
    return null;
  }
  
  return {
    prototypeId: info.prototypeId,
    port: info.port,
    status: info.status,
    startedAt: info.startedAt,
    lastActivity: info.lastActivity,
    url: `http://localhost:${info.port}`,
    logs: info.logs.slice(-50) // Last 50 log lines
  };
}

/**
 * Get all running processes
 */
function getAllProcesses() {
  const processes = [];
  for (const [id, info] of activeProcesses) {
    processes.push({
      prototypeId: id,
      prototypeName: info.prototypeName,
      port: info.port,
      status: info.status,
      startedAt: info.startedAt,
      lastActivity: info.lastActivity,
      url: `http://localhost:${info.port}`
    });
  }
  return processes;
}

/**
 * Update last activity timestamp (resets inactivity timer)
 */
function touchProcess(prototypeId) {
  const info = activeProcesses.get(prototypeId);
  if (info) {
    info.lastActivity = new Date().toISOString();
    resetInactivityTimer(prototypeId);
  }
}

/**
 * Reset the inactivity timer for a process
 */
function resetInactivityTimer(prototypeId) {
  const info = activeProcesses.get(prototypeId);
  if (!info) return;
  
  if (info.inactivityTimer) {
    clearTimeout(info.inactivityTimer);
  }
  
  info.inactivityTimer = setTimeout(() => {
    console.log(`[ProcessManager] Auto-stopping ${prototypeId} due to inactivity`);
    stopProcess(prototypeId);
  }, INACTIVITY_TIMEOUT_MS);
}

/**
 * Start a prototype server process
 */
async function startProcess(prototypeId, prototypeName, options = {}) {
  // Check if already running
  if (activeProcesses.has(prototypeId)) {
    const info = activeProcesses.get(prototypeId);
    if (info.status === 'running') {
      touchProcess(prototypeId);
      return { success: true, alreadyRunning: true, ...getProcessInfo(prototypeId) };
    }
  }
  
  // Check process limit
  const runningCount = Array.from(activeProcesses.values())
    .filter(p => p.status === 'running').length;
  
  if (runningCount >= MAX_PROCESSES) {
    // Find the oldest inactive process to stop
    let oldestProcess = null;
    let oldestActivity = new Date();
    
    for (const [id, info] of activeProcesses) {
      if (info.status === 'running') {
        const activityDate = new Date(info.lastActivity);
        if (activityDate < oldestActivity) {
          oldestActivity = activityDate;
          oldestProcess = id;
        }
      }
    }
    
    if (oldestProcess) {
      console.log(`[ProcessManager] Stopping oldest process ${oldestProcess} to make room`);
      await stopProcess(oldestProcess);
    } else {
      return { 
        success: false, 
        error: `Maximum of ${MAX_PROCESSES} prototype processes already running. Stop one first.`
      };
    }
  }
  
  // Get available port
  const port = getAvailablePort();
  if (!port) {
    return { success: false, error: 'No available ports' };
  }
  
  // Determine start command and working directory
  const {
    startCommand = 'npx serve -l $PORT .',
    workingDirectory = path.join(__dirname, '../../public/prototypes', prototypeId),
    env = {}
  } = options;
  
  // Replace $PORT placeholder in command
  const finalCommand = startCommand.replace(/\$PORT/g, port.toString());
  
  // Parse command into executable and args
  const parts = finalCommand.split(' ');
  const executable = parts[0];
  const args = parts.slice(1);
  
  console.log(`[ProcessManager] Starting ${prototypeId} on port ${port}`);
  console.log(`[ProcessManager] Command: ${finalCommand}`);
  console.log(`[ProcessManager] Working directory: ${workingDirectory}`);
  
  try {
    // Spawn the process
    const childProcess = spawn(executable, args, {
      cwd: workingDirectory,
      env: { ...process.env, PORT: port.toString(), ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });
    
    const processInfo = {
      prototypeId,
      prototypeName,
      port,
      process: childProcess,
      status: 'starting',
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      logs: [],
      inactivityTimer: null
    };
    
    // Capture stdout
    childProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      processInfo.logs.push(...lines.map(l => ({ type: 'stdout', text: l, time: new Date().toISOString() })));
      // Keep only last 100 lines
      if (processInfo.logs.length > 100) {
        processInfo.logs = processInfo.logs.slice(-100);
      }
    });
    
    // Capture stderr
    childProcess.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(l => l.trim());
      processInfo.logs.push(...lines.map(l => ({ type: 'stderr', text: l, time: new Date().toISOString() })));
      if (processInfo.logs.length > 100) {
        processInfo.logs = processInfo.logs.slice(-100);
      }
    });
    
    // Handle process exit
    childProcess.on('exit', (code, signal) => {
      console.log(`[ProcessManager] Process ${prototypeId} exited with code ${code}, signal ${signal}`);
      processInfo.status = 'stopped';
      processInfo.exitCode = code;
      processInfo.exitSignal = signal;
      usedPorts.delete(port);
      
      if (processInfo.inactivityTimer) {
        clearTimeout(processInfo.inactivityTimer);
      }
    });
    
    // Handle errors
    childProcess.on('error', (err) => {
      console.error(`[ProcessManager] Process ${prototypeId} error:`, err);
      processInfo.status = 'error';
      processInfo.error = err.message;
      usedPorts.delete(port);
    });
    
    // Mark as running after a short delay (give it time to start)
    setTimeout(() => {
      if (processInfo.status === 'starting') {
        processInfo.status = 'running';
      }
    }, 1000);
    
    activeProcesses.set(prototypeId, processInfo);
    usedPorts.add(port);
    
    // Start inactivity timer
    resetInactivityTimer(prototypeId);
    
    return { 
      success: true, 
      port,
      url: `http://localhost:${port}`,
      status: 'starting'
    };
    
  } catch (error) {
    console.error(`[ProcessManager] Failed to start ${prototypeId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Stop a prototype server process
 */
async function stopProcess(prototypeId) {
  const info = activeProcesses.get(prototypeId);
  
  if (!info) {
    return { success: false, error: 'Process not found' };
  }
  
  if (info.status !== 'running' && info.status !== 'starting') {
    activeProcesses.delete(prototypeId);
    return { success: true, alreadyStopped: true };
  }
  
  console.log(`[ProcessManager] Stopping ${prototypeId}`);
  
  // Clear inactivity timer
  if (info.inactivityTimer) {
    clearTimeout(info.inactivityTimer);
  }
  
  // Kill the process
  try {
    info.process.kill('SIGTERM');
    
    // Force kill after 5 seconds if still running
    setTimeout(() => {
      try {
        if (!info.process.killed) {
          info.process.kill('SIGKILL');
        }
      } catch (e) {
        // Process already dead
      }
    }, 5000);
    
    info.status = 'stopping';
    usedPorts.delete(info.port);
    
    // Clean up after a delay
    setTimeout(() => {
      if (activeProcesses.get(prototypeId)?.status === 'stopping') {
        activeProcesses.delete(prototypeId);
      }
    }, 6000);
    
    return { success: true };
    
  } catch (error) {
    console.error(`[ProcessManager] Failed to stop ${prototypeId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Stop all processes (for cleanup on server shutdown)
 */
async function stopAllProcesses() {
  console.log('[ProcessManager] Stopping all processes...');
  const promises = [];
  for (const [id] of activeProcesses) {
    promises.push(stopProcess(id));
  }
  await Promise.all(promises);
}

// Cleanup on server shutdown
process.on('SIGINT', async () => {
  await stopAllProcesses();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopAllProcesses();
  process.exit(0);
});

module.exports = {
  startProcess,
  stopProcess,
  stopAllProcesses,
  getProcessInfo,
  getAllProcesses,
  touchProcess,
  MAX_PROCESSES,
  INACTIVITY_TIMEOUT_MS
};
