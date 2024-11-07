import React, { useEffect, useState } from 'react';
import { Crosshair, Copy, Trash } from 'lucide-react';

function App() {
  const [selector, setSelector] = useState<string>('');
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Get initial state
    chrome.storage.local.get(['lastSelector', 'selectorHistory', 'isActive'], (result) => {
      if (result.lastSelector) {
        setSelector(result.lastSelector);
      }
      if (result.selectorHistory) {
        setHistory(result.selectorHistory);
      }
      setIsActive(result.isActive || false);
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.lastSelector) {
        const newSelector = changes.lastSelector.newValue;
        setSelector(newSelector);
        setHistory(prev => {
          const newHistory = [newSelector, ...prev.filter(s => s !== newSelector)].slice(0, 10);
          chrome.storage.local.set({ selectorHistory: newHistory });
          return newHistory;
        });
      }
      if (changes.isActive) {
        setIsActive(changes.isActive.newValue);
      }
    });
  }, []);

  const toggleExtension = () => {
    const newState = !isActive;
    setIsActive(newState);
    chrome.runtime.sendMessage({
      type: 'TOGGLE_EXTENSION',
      isActive: newState
    });
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 5000);
  };

  const clearHistory = () => {
    setHistory([]);
    chrome.storage.local.remove('selectorHistory');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Crosshair className="w-6 h-6 text-blue-600" />
            <h1 className="text-lg font-semibold text-gray-800">Element Selector</h1>
          </div>
          <button
            onClick={toggleExtension}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isActive 
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>

        {/* Status Message */}
        <div className={`mb-6 p-3 rounded-lg ${
          isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
        }`}>
          <p className="text-sm">
            {isActive 
              ? 'Extension is active. Click on any element to get its selector.' 
              : 'Extension is inactive. Activate it to start selecting elements.'}
          </p>
        </div>

        {/* Current Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">Current Selection</h2>
          {selector ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <pre className="text-sm font-mono bg-gray-50 p-2 rounded flex-1 overflow-x-auto">
                  {selector}
                </pre>
                <button
                  onClick={() => copyToClipboard(selector)}
                  className="p-2 hover:bg-gray-100 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 mt-2">Copied to clipboard!</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-600">
              {isActive 
                ? 'Click any element on the page to see its selector'
                : 'Activate the extension to start selecting elements'}
            </p>
          )}
        </div>

        {/* History Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-gray-700">History</h2>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
              >
                <Trash className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
          {history.length > 0 ? (
            <ul className="space-y-2">
              {history.map((item, index) => (
                <li key={index} className="flex items-start justify-between gap-2 p-2 hover:bg-gray-50 rounded">
                  <pre className="text-xs font-mono text-gray-600 flex-1 overflow-x-auto">
                    {item}
                  </pre>
                  <div className="flex gap-1">
                    <button
                      onClick={() => copyToClipboard(item)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No history yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
