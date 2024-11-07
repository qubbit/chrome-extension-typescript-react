let isExtensionActive = false;

// Initialize highlight overlay
const createHighlightOverlay = () => {
  const overlay = document.createElement('div');
  overlay.className = 'selector-highlight';
  overlay.style.display = 'none';
  document.body.appendChild(overlay);
  return overlay;
};

const highlightOverlay = createHighlightOverlay();

function generateSelector(element: Element): string {
  if (!element || element.tagName === 'BODY') return '';

  let selector = element.tagName.toLowerCase();
  
  if (element.id) {
    return `#${element.id}`;
  }

  const classes = Array.from(element.classList).join('.');
  if (classes) {
    selector += `.${classes}`;
  }

  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children);
    if (siblings.length > 1) {
      const index = siblings.indexOf(element as Element) + 1;
      selector += `:nth-child(${index})`;
    }
  }

  const parentSelector = element.parentElement ? 
    generateSelector(element.parentElement) : '';
  
  return parentSelector ? `${parentSelector} > ${selector}` : selector;
}

const highlightElement = (element: Element) => {
  const rect = element.getBoundingClientRect();
  highlightOverlay.style.cssText = `
    position: fixed;
    z-index: 10000;
    border: 2px solid #3b82f6;
    background-color: rgba(59, 130, 246, 0.1);
    pointer-events: none;
    transition: all 0.2s ease-in-out;
    top: ${rect.top + window.scrollY}px;
    left: ${rect.left + window.scrollX}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    display: block;
  `;
};

const handleClick = (event: MouseEvent) => {
  if (!isExtensionActive) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  const element = event.target as Element;
  if (element) {
    const selector = generateSelector(element);
    highlightElement(element);
    
    chrome.runtime.sendMessage({
      type: 'SELECTOR_UPDATED',
      selector
    }).catch(error => {
      console.warn('Failed to send message:', error);
    });
  }
};

// Listen for state changes from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STATE_CHANGED') {
    isExtensionActive = message.isActive;
    if (!isExtensionActive) {
      highlightOverlay.style.display = 'none';
    }
  }
  sendResponse({ received: true });
  return true;
});

// Initialize extension state
chrome.storage.local.get(['isActive'], (result) => {
  isExtensionActive = result.isActive || false;
});

// Add event listeners
document.addEventListener('click', handleClick, true);

// Add hover effect when extension is active
document.addEventListener('mouseover', (event) => {
  if (!isExtensionActive) return;
  const element = event.target as Element;
  if (element) {
    element.style.cursor = 'crosshair';
  }
}, true);

document.addEventListener('mouseout', (event) => {
  if (!isExtensionActive) return;
  const element = event.target as Element;
  if (element) {
    element.style.cursor = '';
  }
}, true);