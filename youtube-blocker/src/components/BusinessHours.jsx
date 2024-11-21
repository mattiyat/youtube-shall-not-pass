import React, { useState, useEffect } from 'react';
import './BusinessHours.css';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

const BusinessHours = () => {
  const [businessHours, setBusinessHours] = useState({});
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Load saved business hours and email from storage
    chrome.storage.sync.get(['businessHours', 'email'], (result) => {
      if (result.businessHours) {
        setBusinessHours(result.businessHours);
      } else {
        // Initialize default business hours (9 AM to 5 PM on weekdays)
        const defaultHours = {};
        DAYS_OF_WEEK.forEach(day => {
          defaultHours[day] = {
            enabled: day !== 'Saturday' && day !== 'Sunday',
            start: '09:00',
            end: '17:00'
          };
        });
        setBusinessHours(defaultHours);
      }
      if (result.email) {
        setEmail(result.email);
      }
    });
  }, []);

  const handleTimeChange = (day, field, value) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleDayToggle = (day) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day]?.enabled
      }
    }));
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const saveSettings = () => {
    chrome.storage.sync.set({
      businessHours,
      email
    }, () => {
      // Notify background script to update blocking schedule
      chrome.runtime.sendMessage({
        type: 'UPDATE_SETTINGS',
        data: { businessHours, email }
      });
    });
  };

  return (
    <div className="business-hours">
      <div className="email-settings">
        <label htmlFor="email">Email for daily reports:</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Enter your email"
        />
      </div>

      <div className="hours-settings">
        <h2>Set Business Hours</h2>
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="day-row">
            <label className="day-toggle">
              <input
                type="checkbox"
                checked={businessHours[day]?.enabled}
                onChange={() => handleDayToggle(day)}
              />
              <span>{day}</span>
            </label>
            <div className="time-inputs">
              <input
                type="time"
                value={businessHours[day]?.start || '09:00'}
                onChange={(e) => handleTimeChange(day, 'start', e.target.value)}
                disabled={!businessHours[day]?.enabled}
              />
              <span>to</span>
              <input
                type="time"
                value={businessHours[day]?.end || '17:00'}
                onChange={(e) => handleTimeChange(day, 'end', e.target.value)}
                disabled={!businessHours[day]?.enabled}
              />
            </div>
          </div>
        ))}
      </div>

      <button className="save-button" onClick={saveSettings}>
        Save Settings
      </button>
    </div>
  );
};

export default BusinessHours;
