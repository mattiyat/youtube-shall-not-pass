import React from 'react';
import { createRoot } from 'react-dom/client';
import BlockingOverlay from './BlockingOverlay';

interface VideoThumbnail {
  element: HTMLElement;
  link: HTMLAnchorElement;
  root?: any;
  container?: HTMLDivElement;
}

const thumbnails: VideoThumbnail[] = [];

function checkIfShouldBlock() {
  return new Promise<boolean>((resolve) => {
    chrome.storage.local.get(['isBlocking'], (result) => {
      resolve(result.isBlocking || false);
    });
  });
}

function isVideoLink(element: HTMLElement): element is HTMLAnchorElement {
  return element.tagName === 'A' && (
    element.href.includes('/watch?v=') || // Regular video
    element.href.includes('/shorts/') // Shorts
  );
}

function findVideoThumbnails(): VideoThumbnail[] {
  const newThumbnails: VideoThumbnail[] = [];
  
  // Find all video thumbnails
  document.querySelectorAll('ytd-thumbnail, ytd-rich-grid-media').forEach((thumbnail) => {
    const link = thumbnail.querySelector('a[href*="/watch?v="], a[href*="/shorts/"]');
    if (link && isVideoLink(link)) {
      // Check if we already have this thumbnail
      if (!thumbnails.some(t => t.element === thumbnail)) {
        newThumbnails.push({
          element: thumbnail as HTMLElement,
          link: link
        });
      }
    }
  });

  return newThumbnails;
}

function createOverlay(thumbnail: VideoThumbnail) {
  if (!thumbnail.container) {
    // Create container for overlay
    thumbnail.container = document.createElement('div');
    thumbnail.container.style.position = 'relative';
    
    // Wrap the link in our container
    thumbnail.link.parentNode?.insertBefore(thumbnail.container, thumbnail.link);
    thumbnail.container.appendChild(thumbnail.link);
    
    // Create overlay
    const overlayDiv = document.createElement('div');
    overlayDiv.style.position = 'absolute';
    overlayDiv.style.top = '0';
    overlayDiv.style.left = '0';
    overlayDiv.style.width = '100%';
    overlayDiv.style.height = '100%';
    overlayDiv.style.zIndex = '1';
    thumbnail.container.appendChild(overlayDiv);
    
    // Create React root and render overlay
    thumbnail.root = createRoot(overlayDiv);
    thumbnail.root.render(<BlockingOverlay />);
    
    // Prevent video clicks
    thumbnail.link.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }
}

function removeOverlay(thumbnail: VideoThumbnail) {
  if (thumbnail.container && thumbnail.root) {
    // Unwrap the link
    const parent = thumbnail.container.parentNode;
    if (parent) {
      parent.insertBefore(thumbnail.link, thumbnail.container);
      parent.removeChild(thumbnail.container);
    }
    
    // Cleanup
    thumbnail.root.unmount();
    thumbnail.root = undefined;
    thumbnail.container = undefined;
  }
}

async function updateThumbnails() {
  const shouldBlock = await checkIfShouldBlock();
  
  // Find new thumbnails
  const newThumbnails = findVideoThumbnails();
  thumbnails.push(...newThumbnails);
  
  // Update all thumbnails
  thumbnails.forEach(thumbnail => {
    if (shouldBlock) {
      createOverlay(thumbnail);
    } else {
      removeOverlay(thumbnail);
    }
  });
}

// Initial update
updateThumbnails();

// Watch for new thumbnails (YouTube loads content dynamically)
const observer = new MutationObserver(() => {
  updateThumbnails();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.isBlocking) {
    updateThumbnails();
  }
});

// Check blocking status periodically
setInterval(() => {
  chrome.runtime.sendMessage({ type: 'CHECK_BLOCKING_STATUS' });
}, 60000); // Every minute
