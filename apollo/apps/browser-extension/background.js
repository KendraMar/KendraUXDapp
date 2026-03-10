// Apollo Capture - Background Service Worker
// Captures tab changes and sends them to the Apollo server

const DEFAULT_SERVER_URL = 'http://localhost:1226';

// Default settings
const DEFAULT_SETTINGS = {
  enabled: true,
  excludedDomains: ['localhost', 'chrome://', 'chrome-extension://', 'about:', 'edge://', 'moz-extension://'],
  serverUrl: DEFAULT_SERVER_URL
};

// Clean URL by removing query parameters and fragments
function cleanUrl(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  } catch (e) {
    return url;
  }
}

// Check if domain should be excluded
function shouldExclude(url, excludedDomains) {
  return excludedDomains.some(domain => url.includes(domain));
}

// Get current server URL from storage
async function getServerUrl() {
  const settings = await chrome.storage.local.get({ serverUrl: DEFAULT_SERVER_URL });
  return settings.serverUrl;
}

// Register extension with the Apollo server
async function registerExtension() {
  try {
    const serverUrl = await getServerUrl();
    const response = await fetch(`${serverUrl}/api/browser/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Apollo Capture: Registered with server', data);
      await chrome.storage.local.set({ registered: true });
      return true;
    } else {
      const error = await response.json();
      console.error('Apollo Capture: Registration failed', error);
      return false;
    }
  } catch (error) {
    console.error('Apollo Capture: Could not register with server', error);
    return false;
  }
}

// Send capture to Apollo server
async function sendCapture(data) {
  try {
    const serverUrl = await getServerUrl();
    const response = await fetch(`${serverUrl}/api/browser/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      console.error('Apollo Capture: Failed to send capture', response.status);
    }
  } catch (error) {
    console.error('Apollo Capture: Error sending capture', error);
  }
}

// Capture all open tabs and send to server
async function captureAllTabs() {
  try {
    const serverUrl = await getServerUrl();
    const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
    
    // Get all tabs from all windows
    const allTabs = await chrome.tabs.query({});
    
    // Filter and clean tabs
    const cleanedTabs = allTabs
      .filter(tab => tab.url && !shouldExclude(tab.url, settings.excludedDomains))
      .map(tab => ({
        id: tab.id,
        windowId: tab.windowId,
        index: tab.index,
        url: cleanUrl(tab.url),
        title: tab.title || 'Untitled',
        active: tab.active,
        pinned: tab.pinned
      }));
    
    const response = await fetch(`${serverUrl}/api/browser/tabs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tabs: cleanedTabs })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('Apollo Capture: Captured', data.count, 'tabs');
      return { success: true, count: data.count, timestamp: data.timestamp };
    } else {
      console.error('Apollo Capture: Failed to capture tabs', response.status);
      return { success: false, error: 'Server error' };
    }
  } catch (error) {
    console.error('Apollo Capture: Error capturing tabs', error);
    return { success: false, error: error.message };
  }
}

// Handle tab activation (switching tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
  
  if (!settings.enabled) return;
  
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    
    if (!tab.url || shouldExclude(tab.url, settings.excludedDomains)) {
      return;
    }
    
    await sendCapture({
      timestamp: new Date().toISOString(),
      url: cleanUrl(tab.url),
      title: tab.title || 'Untitled'
    });
  } catch (error) {
    console.error('Apollo Capture: Error handling tab activation', error);
  }
});

// Handle tab updates (navigation within a tab)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only capture when the page has finished loading
  if (changeInfo.status !== 'complete') return;
  
  const settings = await chrome.storage.local.get(DEFAULT_SETTINGS);
  
  if (!settings.enabled) return;
  
  if (!tab.url || shouldExclude(tab.url, settings.excludedDomains)) {
    return;
  }
  
  // Check if this tab is the active tab
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab || activeTab.id !== tabId) {
    return;
  }
  
  await sendCapture({
    timestamp: new Date().toISOString(),
    url: cleanUrl(tab.url),
    title: tab.title || 'Untitled'
  });
});

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(null);
  if (!existing.enabled) {
    await chrome.storage.local.set(DEFAULT_SETTINGS);
  }
  console.log('Apollo Capture: Extension installed');
  
  // Try to register with the server
  await registerExtension();
});

// Re-register on browser startup (in case server was restarted)
chrome.runtime.onStartup.addListener(async () => {
  console.log('Apollo Capture: Browser started, checking registration');
  await registerExtension();
});

// Open settings page when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

// Listen for messages from settings page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'captureAllTabs') {
    captureAllTabs().then(sendResponse);
    return true; // Keep the message channel open for async response
  }
});
