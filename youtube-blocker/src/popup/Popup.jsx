import React, { useState, useEffect } from 'react';
import BusinessHours from '../components/BusinessHours';
import HistoryViewer from '../components/HistoryViewer';
import './popup.css';

const Popup = () => {
  const [activeTab, setActiveTab] = useState('settings');
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);

  useEffect(() => {
    // Check if blocking is currently active
    chrome.storage.local.get(['isBlocking', 'blockedCount'], (result) => {
      setIsBlocking(result.isBlocking || false);
      setBlockedCount(result.blockedCount || 0);
    });
  }, []);

  return (
    <div className="popup-container">
      <header className="popup-header">
        <h1>YouTube Productivity Blocker</h1>
        <div className="status-indicator">
          {isBlocking ? (
            <span className="status active">Blocking Active</span>
          ) : (
            <span className="status inactive">Blocking Inactive</span>
          )}
        </div>
        <div className="blocked-count">
          Videos blocked today: {blockedCount}
        </div>
      </header>

      <nav className="popup-nav">
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </nav>

      <main className="popup-content">
        {activeTab === 'settings' ? (
          <BusinessHours />
        ) : (
          <HistoryViewer />
        )}
      </main>
    </div>
  );
};

export default Popup;
