import React from 'react';
import { createRoot } from 'react-dom/client';
import BlockingOverlay from './BlockingOverlay';
import './content.css';

let businessHours = {};

// Check if current time is within blocking hours
const isWithinBlockingHours = () => {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false });

  if (!businessHours[day]?.enabled) return false;

  const start = businessHours[day].start;
  const end = businessHours[day].end;

  return currentTime >= start && currentTime <= end;
};

// Function to extract video information
const getVideoInfo = () => {
  const title = document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent || 'Unknown Title';
  const url = window.location.href;
  const thumbnail = document.querySelector('.ytp-cued-thumbnail-overlay-image')?.style.backgroundImage.slice(5, -2) || '';

  return {
    title,
    url,
    thumbnail,
    timestamp: new Date().toISOString()
  };
};

// Function to block video playback
const blockVideo = () => {
  const video = document.querySelector('video');
  if (video) {
    video.pause();
    
    // Create blocking overlay if it doesn't exist
    if (!document.getElementById('blocking-overlay')) {
      const overlayContainer = document.createElement('div');
      overlayContainer.id = 'blocking-overlay-container';
      document.body.appendChild(overlayContainer);
      
      const root = createRoot(overlayContainer);
      root.render(<BlockingOverlay videoInfo={getVideoInfo()} />);
    }
  }
};

// Initialize extension
const init = async () => {
  try {
    // Load business hours from storage
    const result = await chrome.storage.sync.get(['businessHours']);
    businessHours = result.businessHours || {};

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.businessHours) {
        businessHours = changes.businessHours.newValue;
      }
    });

    // Set up mutation observer to handle dynamic video loading
    const observer = new MutationObserver(() => {
      if (isWithinBlockingHours()) {
        blockVideo();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial check
    if (isWithinBlockingHours()) {
      blockVideo();
    }
  } catch (error) {
    console.error('Failed to initialize YouTube blocker:', error);
  }
};

// Start the extension
init();
