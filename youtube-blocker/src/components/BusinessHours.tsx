import React, { useState, useEffect } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface BusinessHour {
  enabled: boolean;
  start: string;
  end: string;
}

interface BusinessHours {
  [key: string]: BusinessHour;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

const BusinessHoursComponent: React.FC = () => {
  const [businessHours, setBusinessHours] = useState<BusinessHours>({});

  useEffect(() => {
    // Load business hours from storage
    chrome.storage.sync.get(['businessHours'], (result) => {
      if (result.businessHours) {
        setBusinessHours(result.businessHours);
      } else {
        // Initialize with default values
        const defaultHours: BusinessHours = {};
        DAYS_OF_WEEK.forEach((day) => {
          defaultHours[day] = {
            enabled: false,
            start: '09:00',
            end: '17:00',
          };
        });
        setBusinessHours(defaultHours);
        chrome.storage.sync.set({ businessHours: defaultHours });
      }
    });
  }, []);

  const handleToggleDay = (day: string) => {
    const updatedHours = {
      ...businessHours,
      [day]: {
        ...businessHours[day],
        enabled: !businessHours[day]?.enabled,
      },
    };
    setBusinessHours(updatedHours);
    chrome.storage.sync.set({ businessHours: updatedHours });
  };

  const handleTimeChange = (day: string, type: 'start' | 'end', value: string) => {
    const updatedHours = {
      ...businessHours,
      [day]: {
        ...businessHours[day],
        [type]: value,
      },
    };
    setBusinessHours(updatedHours);
    chrome.storage.sync.set({ businessHours: updatedHours });
  };

  return (
    <Accordion type="single" collapsible className="w-full space-y-3">
      {DAYS_OF_WEEK.map((day) => (
        <AccordionItem key={day} value={day} className="border rounded-lg overflow-hidden">
          <AccordionTrigger className="flex items-center justify-between px-4 py-3 hover:no-underline">
            <div className="flex items-center space-x-4">
              <Switch
                checked={businessHours[day]?.enabled}
                onCheckedChange={() => handleToggleDay(day)}
              />
              <span className="text-sm font-medium">{day}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 py-3">
            <div className="flex flex-col space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Start Time
                  </label>
                  <Select
                    value={businessHours[day]?.start}
                    onValueChange={(value) => handleTimeChange(day, 'start', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] min-w-[150px]">
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    End Time
                  </label>
                  <Select
                    value={businessHours[day]?.end}
                    onValueChange={(value) => handleTimeChange(day, 'end', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px] min-w-[150px]">
                      {TIME_OPTIONS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default BusinessHoursComponent;
