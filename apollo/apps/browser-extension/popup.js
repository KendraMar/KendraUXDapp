// Apollo Capture - Popup Script

const API_BASE = 'http://localhost:1226';

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
const excludedTextarea = document.getElementById('excludedDomains');
const saveBtn = document.getElementById('saveBtn');
const historyContainer = document.getElementById('history');
const statusDiv = document.getElementById('status');

// Load settings
async function loadSettings() {
  const settings = await chrome.storage.local.get({
    enabled: true,
    excludedDomains: DEFAULT_EXCLUDED
  });
  
  enabledCheckbox.checked = settings.enabled;
  excludedTextarea.value = settings.excludedDomains.join('\n');
}

// Save settings
async function saveSettings() {
  const enabled = enabledCheckbox.checked;
  const excludedDomains = excludedTextarea.value
    .split('\n')
    .map(d => d.trim())
    .filter(d => d.length > 0);
  
  await chrome.storage.local.set({ enabled, excludedDomains });
  
  showStatus('Settings saved!', 'success');
}

// Show status message
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  setTimeout(() => {
    statusDiv.className = 'status';
  }, 2000);
}

// Format relative time
function formatRelativeTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  
  return date.toLocaleDateString();
}

// Load recent history from server
async function loadHistory() {
  try {
    const response = await fetch(`${API_BASE}/api/browser/history?limit=10`);
    
    if (!response.ok) {
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
        <div class="time">${formatRelativeTime(item.timestamp)}</div>
      </div>
    `).join('');
    
  } catch (error) {
    historyContainer.innerHTML = `<p class="error">Could not connect to Apollo server</p>`;
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadHistory();
});

saveBtn.addEventListener('click', saveSettings);
