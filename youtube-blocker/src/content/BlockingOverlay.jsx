import React from 'react';
import './BlockingOverlay.css';

const BlockingOverlay = () => {
  return (
    <div className="blocking-overlay">
      <div className="blocking-content">
        <h2>Video Blocked</h2>
        <p>Available after work hours</p>
      </div>
    </div>
  );
};

export default BlockingOverlay;
