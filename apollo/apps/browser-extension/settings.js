// Apollo Capture - Settings Script

const DEFAULT_SERVER_URL = 'http://localhost:1226';

const DEFAULT_EXCLUDED = [
  'localhost',
  'chrome://',
  'chrome-extension://',
  'about:',
  'edge://',
  'moz-extension://'
];

// DOM elements
const enabledCheckbox = document.getElementById('enabled');
const toggleLabel = document.querySelector('.toggle-label');
const excludedTextarea = document.getElementById('excludedDomains');
const saveBtn = document.getElementById('saveBtn');
const historyContainer = document.getElementById('history');
const statusDiv = document.getElementById('status');
const serverUrlInput = document.getElementById('serverUrl');
const testConnectionBtn = document.getElementById('testConnectionBtn');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const registerBtn = document.getElementById('registerBtn');
const extensionInfo = document.getElementById('extensionInfo');
const captureTabsBtn = document.getElementById('captureTabsBtn');
const tabsContainer = document.getElementById('tabs');
const tabsStatus = document.getElementById('tabsStatus');

// Current server URL
let currentServerUrl = DEFAULT_SERVER_URL;

// Update toggle label based on state
function updateToggleLabel() {
  toggleLabel.textContent = enabledCheckbox.checked ? 'Capture Enabled' : 'Capture Disabled';
}

// Update connection status UI
function setConnectionStatus(status, message, showRegister = false) {
  statusIndicator.className = 'status-indicator ' + status;
  statusText.textContent = message;
  registerBtn.style.display = showRegister ? 'inline-block' : 'none';
}

// Register extension with server
async function registerExtension() {
  const url = serverUrlInput.value.trim() || DEFAULT_SERVER_URL;
  
  setConnectionStatus('checking', 'Registering...');
  
  try {
    const response = await fetch(`${url}/api/browser/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setConnectionStatus('connected', `Registered and connected to ${url}`);
      showStatus('Registration successful!', 'success');
      await chrome.storage.local.set({ registered: true, serverUrl: url });
      currentServerUrl = url;
      loadHistory();
      updateExtensionInfo();
      return true;
    } else {
      setConnectionStatus('disconnected', data.error || 'Registration failed', false);
      showStatus(data.error || 'Registration failed', 'error');
      return false;
    }
  } catch (error) {
    setConnectionStatus('disconnected', `Cannot connect to ${url}`, false);
    showStatus('Could not connect to server', 'error');
    return false;
  }
}

// Test connection to server
async function testConnection(showSuccess = true) {
  const url = serverUrlInput.value.trim() || DEFAULT_SERVER_URL;
  
  setConnectionStatus('checking', 'Checking connection...');
  
  try {
    const response = await fetch(`${url}/api/browser/history?limit=1`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      setConnectionStatus('connected', `Connected to ${url}`);
      currentServerUrl = url;
      
      // Save the server URL
      await chrome.storage.local.set({ serverUrl: url });
      
      // Reload history with new URL
      loadHistory();
      updateExtensionInfo();
      
      if (showSuccess) {
        showStatus('Connection successful!', 'success');
      }
      return true;
    } else {
      const data = await response.json();
      
      // Check if we need to register
      if (data.needsRegistration) {
        setConnectionStatus('disconnected', 'Extension not registered', true);
        historyContainer.innerHTML = '<p class="empty">Please register the extension first</p>';
        return false;
      }
      
      throw new Error(data.error || `Server returned ${response.status}`);
    }
  } catch (error) {
    const message = error.message || `Cannot connect to ${url}`;
    setConnectionStatus('disconnected', message, message.includes('not registered'));
    historyContainer.innerHTML = `<p class="error">Could not connect to Apollo server at <strong>${escapeHtml(url)}</strong></p>`;
    return false;
  }
}

// Update extension info display
async function updateExtensionInfo() {
  const extensionId = chrome.runtime.id;
  const url = serverUrlInput.value.trim() || DEFAULT_SERVER_URL;
  
  try {
    const response = await fetch(`${url}/api/browser/status`);
    if (response.ok) {
      const data = await response.json();
      if (data.registered && data.extensionId === extensionId) {
        extensionInfo.innerHTML = `<small>Extension ID: <code>${extensionId}</code> (registered)</small>`;
        extensionInfo.className = 'extension-info registered';
      } else if (data.registered) {
        extensionInfo.innerHTML = `<small>Another extension is registered: <code>${data.extensionId}</code></small>`;
        extensionInfo.className = 'extension-info warning';
      } else {
        extensionInfo.innerHTML = `<small>Extension ID: <code>${extensionId}</code> (not registered)</small>`;
        extensionInfo.className = 'extension-info';
      }
    }
  } catch (error) {
    extensionInfo.innerHTML = `<small>Extension ID: <code>${extensionId}</code></small>`;
    extensionInfo.className = 'extension-info';
  }
}

// Load settings
async function loadSettings() {
  const settings = await chrome.storage.local.get({
    enabled: true,
    excludedDomains: DEFAULT_EXCLUDED,
    serverUrl: DEFAULT_SERVER_URL
  });
  
  enabledCheckbox.checked = settings.enabled;
  excludedTextarea.value = settings.excludedDomains.join('\n');
  serverUrlInput.value = settings.serverUrl;
  currentServerUrl = settings.serverUrl;
  updateToggleLabel();
}

// Save settings
async function saveSettings() {
  const enabled = enabledCheckbox.checked;
  const excludedDomains = excludedTextarea.value
    .split('\n')
    .map(d => d.trim())
    .filter(d => d.length > 0);
  const serverUrl = serverUrlInput.value.trim() || DEFAULT_SERVER_URL;
  
  await chrome.storage.local.set({ enabled, excludedDomains, serverUrl });
  currentServerUrl = serverUrl;
  
  showStatus('Settings saved!', 'success');
  
  // Test connection with new URL
  testConnection(false);
}

// Show status message
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  setTimeout(() => {
    statusDiv.className = 'status';
  }, 2000);
}

// Format timestamp as YYYY-MM-DD_HH-MM-SS-SSS
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}-${ms}`;
}

// Load recent history from server
async function loadHistory() {
  try {
    const response = await fetch(`${currentServerUrl}/api/browser/history?limit=10`);
    
    if (!response.ok) {
      const data = await response.json();
      if (data.needsRegistration) {
        historyContainer.innerHTML = '<p class="empty">Please register the extension first</p>';
        return;
      }
      throw new Error('Failed to load history');
    }
    
    const data = await response.json();
    
    if (!data.history || data.history.length === 0) {
      historyContainer.innerHTML = '<p class="empty">No history yet</p>';
      return;
    }
    
    historyContainer.innerHTML = data.history.map(item => `
      <div class="history-item">
        <div class="title">${escapeHtml(item.title)}</div>
        <div class="url">${escapeHtml(item.url)}</div>
        <div class="time">${formatTimestamp(item.timestamp)}</div>
      </div>
    `).join('');
    
  } catch (error) {
    historyContainer.innerHTML = `<p class="error">Could not connect to Apollo server at <strong>${escapeHtml(currentServerUrl)}</strong></p>`;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Capture all tabs
async function captureAllTabs() {
  captureTabsBtn.disabled = true;
  captureTabsBtn.textContent = 'Capturing...';
  
  try {
    const result = await chrome.runtime.sendMessage({ action: 'captureAllTabs' });
    
    if (result.success) {
      tabsStatus.innerHTML = `<span class="success">Captured ${result.count} tabs at ${formatTimestamp(result.timestamp)}</span>`;
      tabsStatus.className = 'tabs-status success';
      loadTabs();
    } else {
      tabsStatus.innerHTML = `<span class="error">Failed: ${result.error}</span>`;
      tabsStatus.className = 'tabs-status error';
    }
  } catch (error) {
    tabsStatus.innerHTML = `<span class="error">Error: ${error.message}</span>`;
    tabsStatus.className = 'tabs-status error';
  } finally {
    captureTabsBtn.disabled = false;
    captureTabsBtn.textContent = 'Capture All Tabs';
  }
}

// Load saved tabs from server
async function loadTabs() {
  try {
    const response = await fetch(`${currentServerUrl}/api/browser/tabs`);
    
    if (!response.ok) {
      throw new Error('Failed to load tabs');
    }
    
    const data = await response.json();
    
    if (!data.tabs || data.tabs.length === 0) {
      tabsContainer.innerHTML = '<p class="empty">No tabs captured yet</p>';
      tabsStatus.innerHTML = '';
      return;
    }
    
    tabsStatus.innerHTML = `<span>Last captured: ${formatTimestamp(data.timestamp)} (${data.tabs.length} tabs)</span>`;
    tabsStatus.className = 'tabs-status';
    
    tabsContainer.innerHTML = data.tabs.map(tab => `
      <div class="history-item ${tab.active ? 'active-tab' : ''} ${tab.pinned ? 'pinned-tab' : ''}">
        <div class="title">
          ${tab.pinned ? '<span class="pin-icon">📌</span>' : ''}
          ${tab.active ? '<span class="active-icon">●</span>' : ''}
          ${escapeHtml(tab.title)}
        </div>
        <div class="url">${escapeHtml(tab.url)}</div>
      </div>
    `).join('');
    
  } catch (error) {
    tabsContainer.innerHTML = '<p class="empty">Could not load tabs</p>';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await testConnection(false);
  await updateExtensionInfo();
  await loadTabs();
});

saveBtn.addEventListener('click', saveSettings);
enabledCheckbox.addEventListener('change', updateToggleLabel);
testConnectionBtn.addEventListener('click', () => testConnection(true));
registerBtn.addEventListener('click', registerExtension);

// Also test connection when Enter is pressed in the URL field
serverUrlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    testConnection(true);
  }
});

captureTabsBtn.addEventListener('click', captureAllTabs);
