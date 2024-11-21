import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import './HistoryViewer.css';

const HistoryViewer = () => {
  const [blockedVideos, setBlockedVideos] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    loadBlockedVideos();
  }, [selectedDate]);

  const loadBlockedVideos = () => {
    chrome.storage.local.get(['blockedVideos'], (result) => {
      const videos = result.blockedVideos || {};
      setBlockedVideos(videos[selectedDate] || []);
    });
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Title', 'URL', 'Timestamp'],
      ...blockedVideos.map(video => [
        video.title,
        video.url,
        format(new Date(video.timestamp), 'HH:mm:ss')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blocked-videos-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear the history for this day?')) {
      chrome.storage.local.get(['blockedVideos'], (result) => {
        const videos = result.blockedVideos || {};
        delete videos[selectedDate];
        chrome.storage.local.set({ blockedVideos: videos }, () => {
          loadBlockedVideos();
        });
      });
    }
  };

  return (
    <div className="history-viewer">
      <div className="history-controls">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')}
        />
        <button onClick={exportToCSV} disabled={!blockedVideos.length}>
          Export to CSV
        </button>
        <button onClick={clearHistory} disabled={!blockedVideos.length}>
          Clear History
        </button>
      </div>

      <div className="videos-list">
        {blockedVideos.length === 0 ? (
          <p className="no-videos">No blocked videos for this date</p>
        ) : (
          blockedVideos.map((video, index) => (
            <div key={index} className="video-item">
              <img src={video.thumbnail} alt={video.title} />
              <div className="video-info">
                <h3>{video.title}</h3>
                <a href={video.url} target="_blank" rel="noopener noreferrer">
                  {video.url}
                </a>
                <span className="timestamp">
                  {format(new Date(video.timestamp), 'HH:mm:ss')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryViewer;
