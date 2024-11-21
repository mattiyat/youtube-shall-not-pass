chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with default values
  chrome.storage.local.set({
    blockedCount: 0,
  });
});

// Reset blocked count at midnight
chrome.alarms.create('resetBlockedCount', {
  when: getNextMidnight(),
  periodInMinutes: 24 * 60, // Daily
});

// Check blocking status every minute
chrome.alarms.create('checkBlockingStatus', {
  periodInMinutes: 1,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'resetBlockedCount') {
    chrome.storage.local.set({ blockedCount: 0 });
  } else if (alarm.name === 'checkBlockingStatus') {
    updateBlockingStatus();
  }
});

function getNextMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

function checkIfBlocking(businessHours: any): boolean {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false });

  if (!businessHours[day]?.enabled) return false;

  const start = businessHours[day].start;
  const end = businessHours[day].end;

  return currentTime >= start && currentTime <= end;
}

function updateBlockingStatus() {
  chrome.storage.sync.get(['businessHours'], (result) => {
    if (result.businessHours) {
      const isBlocking = checkIfBlocking(result.businessHours);
      chrome.storage.local.set({ isBlocking });
    }
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'VIDEO_BLOCKED') {
    // Increment blocked count
    chrome.storage.local.get(['blockedCount'], (result) => {
      const newCount = (result.blockedCount || 0) + 1;
      chrome.storage.local.set({ blockedCount: newCount });
    });

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Video Blocked',
      message: `"${request.videoTitle}" was blocked during work hours.`,
    });
  } else if (request.type === 'CHECK_BLOCKING_STATUS') {
    updateBlockingStatus();
    sendResponse({});
  }
});

// Initial status check
updateBlockingStatus();
