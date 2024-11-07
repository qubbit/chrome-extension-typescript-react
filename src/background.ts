// Track window and activation state
let windowId: number | null = null;
let isActive = false;

// Initialize extension state
chrome.storage.local.set({ isActive: false });

// Handle opening the extension window
chrome.action.onClicked.addListener(async () => {
  if (windowId === null) {
    chrome.windows.create({
      url: 'index.html',
      type: 'popup',
      width: 400,
      height: 600,
      alwaysOnTop: true,
      focused: true
    }, (window) => {
      windowId = window?.id || null;
    });
  } else {
    chrome.windows.update(windowId, { focused: true });
  }
});

// Handle window close
chrome.windows.onRemoved.addListener((removedWindowId) => {
  if (removedWindowId === windowId) {
    windowId = null;
  }
});

// Toggle extension state and notify content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_EXTENSION') {
    isActive = message.isActive;
    chrome.storage.local.set({ isActive });
    
    // Notify all tabs about the state change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type: 'STATE_CHANGED', isActive });
        }
      });
    });
  } else if (message.type === 'SELECTOR_UPDATED' && isActive) {
    chrome.storage.local.set({ lastSelector: message.selector });
  }
  sendResponse({ received: true });
  return true;
});
