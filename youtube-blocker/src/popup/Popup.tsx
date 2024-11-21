import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import BusinessHours from '../components/BusinessHours';
import { HistoryViewer } from '../components/HistoryViewer';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface BusinessHour {
  enabled: boolean;
  start: string;
  end: string;
}

interface BusinessHours {
  [key: string]: BusinessHour;
}

const Popup: React.FC = () => {
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockedCount, setBlockedCount] = useState(0);

  const checkIfBlocking = (businessHours: BusinessHours) => {
    const now = new Date();
    const day = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });

    if (!businessHours[day]?.enabled) return false;

    const start = businessHours[day].start;
    const end = businessHours[day].end;

    return currentTime >= start && currentTime <= end;
  };

  useEffect(() => {
    const updateBlockingStatus = () => {
      chrome.storage.sync.get(['businessHours'], (result) => {
        const isCurrentlyBlocking = result.businessHours ? checkIfBlocking(result.businessHours) : false;
        setIsBlocking(isCurrentlyBlocking);
      });
    };

    // Initial check
    updateBlockingStatus();

    // Update status every minute
    const interval = setInterval(updateBlockingStatus, 60000);

    // Get blocked count
    chrome.storage.local.get(['blockedCount'], (result) => {
      setBlockedCount(result.blockedCount || 0);
    });

    // Listen for changes in business hours
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.businessHours) {
        updateBlockingStatus();
      }
      if (changes.blockedCount) {
        setBlockedCount(changes.blockedCount.newValue || 0);
      }
    });

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-background">
      <div className="h-full overflow-auto">
        <div className="p-6">
          <header className="space-y-2 mb-4">
            <h1 className="text-2xl font-bold">YouTube Productivity Blocker</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isBlocking ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-500 font-medium">Blocking Active</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-yellow-500 font-medium">Blocking Inactive</span>
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Videos blocked today: {blockedCount}
              </div>
            </div>
          </header>

          <Tabs defaultValue="business-hours" className="w-full">
            <TabsList className="w-full mb-6 grid grid-cols-2">
              <TabsTrigger value="business-hours">
                Business Hours
              </TabsTrigger>
              <TabsTrigger value="history">
                History
              </TabsTrigger>
            </TabsList>
            <TabsContent value="business-hours" className="mt-0">
              <BusinessHours />
            </TabsContent>
            <TabsContent value="history" className="mt-0">
              <HistoryViewer />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Popup;
