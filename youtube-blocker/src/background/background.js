// Initialize alarms for daily email
chrome.runtime.onInstalled.addListener(() => {
  // Set up daily alarm for sending emails
  chrome.alarms.create('sendDailyEmail', {
    periodInMinutes: 1440, // 24 hours
    when: getNextEmailTime()
  });
});

// Get the next time to send email (default to 6 PM)
function getNextEmailTime() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(18, 0, 0, 0);

  if (now >= target) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime();
}

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sendDailyEmail') {
    sendDailyEmail();
  }
});

// Send daily email with blocked videos
async function sendDailyEmail() {
  try {
    const { email } = await chrome.storage.sync.get(['email']);
    if (!email) return;

    const today = new Date().toISOString().split('T')[0];
    const { blockedVideos } = await chrome.storage.local.get(['blockedVideos']);
    const todayVideos = blockedVideos?.[today] || [];

    if (todayVideos.length === 0) return;

    // Format email content
    const emailContent = formatEmailContent(todayVideos);

    // Create notification instead of sending email directly
    chrome.notifications.create('dailyReport', {
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'YouTube Productivity Report',
      message: `${todayVideos.length} videos were blocked today. Check your extension popup to view the list.`
    });

  } catch (error) {
    console.error('Failed to process daily report:', error);
  }
}

// Format email content
function formatEmailContent(videos) {
  return videos.map(video => ({
    title: video.title,
    url: video.url,
    timestamp: new Date(video.timestamp).toLocaleTimeString()
  }));
}

// Listen for settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'UPDATE_SETTINGS') {
    // Update any necessary background state
    console.log('Settings updated:', message.data);
  }
});
