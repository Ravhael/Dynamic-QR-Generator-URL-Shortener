import React from 'react';
// Utility to track and store URL click events consistently
interface StoredClickEvent {
  id: string;
  urlId: string;
  urlTitle: string;
  clickedAt: string;
  location: {
    country: string;
    city: string;
    latitude?: number;
    longitude?: number;
  };
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
    userAgent: string;
  };
  ipAddress: string;
}

// Get real device information
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent;
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  let os = 'Unknown';
  let browser = 'Unknown';

  // Detect device type
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    if (/iPad/i.test(userAgent)) {
      deviceType = 'tablet';
    } else {
      deviceType = 'mobile';
    }
  } else if (/Tablet|PlayBook/i.test(userAgent)) {
    deviceType = 'tablet';
  }

  // Detect OS
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Mac/i.test(userAgent)) os = 'macOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';

  // Detect browser
  if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) browser = 'Chrome';
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
  else if (/Edge/i.test(userAgent)) browser = 'Edge';
  else if (/Opera/i.test(userAgent)) browser = 'Opera';

  return {
    type: deviceType,
    os,
    browser,
    userAgent
  };
};

// Get location using IP geolocation (fallback to default)
const getLocationInfo = async (): Promise<{ country: string; city: string; latitude?: number; longitude?: number }> => {
  try {
    // Try to get user's location with geolocation API
    if (navigator.geolocation) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // In a real app, you would use a reverse geocoding service
              // For now, we'll use a default location with coordinates
              resolve({
                country: 'Indonesia',
                city: 'Jakarta',
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              });
            } catch (_error) {
              resolve(getDefaultLocation());
            }
          },
          () => {
            resolve(getDefaultLocation());
          },
          { timeout: 5000 }
        );
      });
    }
  } catch (_error) {
    console.error('Error getting location:', _error);
  }
  
  return getDefaultLocation();
};

const getDefaultLocation = () => ({
  country: 'Indonesia',
  city: 'Jakarta'
});

// Generate a simple IP address for demo
const generateDemoIP = () => {
  return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

// Record a new click event
export const recordClickEvent = async (urlId: string, urlTitle: string): Promise<void> => {
  try {
    const deviceInfo = getDeviceInfo();
    const locationInfo = await getLocationInfo();
    
    const clickEvent: StoredClickEvent = {
      id: `click_${urlId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      urlId,
      urlTitle,
      clickedAt: new Date().toISOString(),
      location: locationInfo,
      device: deviceInfo,
      ipAddress: generateDemoIP()
    };

    // Get existing click events
    const existingClickEvents = getClickEvents();
    existingClickEvents.unshift(clickEvent); // Add to beginning (most recent first)
    
    // Keep only last 1000 click events to prevent storage bloat
    const limitedEvents = existingClickEvents.slice(0, 1000);
    
    // Save to localStorage
    localStorage.setItem('clickEvents', JSON.stringify(limitedEvents));
    
    // Update URL click count
    const savedURLs = localStorage.getItem('shortURLs');
    if (savedURLs) {
      const urls: any[] = JSON.parse(savedURLs);
      const updatedURLs = urls.map((url: any) => {
        if (url?.id === urlId) {
          return { ...url, clicks: (url.clicks || 0) + 1 };
        }
        return url;
      });
      localStorage.setItem('shortURLs', JSON.stringify(updatedURLs));
    }
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('urlClicked', { 
      detail: { urlId, clickEvent } 
    }));
    
  } catch (_error) {
    console.error('Error recording click event:', _error);
  }
};

// Get all stored click events
export const getClickEvents = (): StoredClickEvent[] => {
  try {
    const stored = localStorage.getItem('clickEvents');
    return stored ? JSON.parse(stored) : [];
  } catch (_error) {
    console.error('Error getting click events:', _error);
    return [];
  }
};

// Get click events for a specific URL
export const getClickEventsForURL = (urlId: string): StoredClickEvent[] => {
  return getClickEvents().filter(event => event.urlId === urlId);
};

// Get click events within a date range
export const getClickEventsInRange = (startDate: Date, endDate: Date): StoredClickEvent[] => {
  return getClickEvents().filter(event => {
    const eventDate = new Date(event.clickedAt);
    return eventDate >= startDate && eventDate <= endDate;
  });
};

// Clear all click events (for testing)
export const clearClickEvents = (): void => {
  localStorage.removeItem('clickEvents');
  window.dispatchEvent(new CustomEvent('clickEventsCleared'));
};

// Get analytics data from stored click events
export const getAnalyticsFromClickEvents = () => {
  const clickEvents = getClickEvents();
  const now = new Date();
  
  // Group clicks by day for the last 30 days
  const clicksByDay = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const clicksForDay = clickEvents.filter(event => 
      event.clickedAt.startsWith(dateStr)
    ).length;
    
    clicksByDay.push({
      date: dateStr,
      clicks: clicksForDay
    });
  }
  
  // Group by device
  const deviceCounts: { [key: string]: number } = {};
  clickEvents.forEach(event => {
    const deviceKey = event.device.type.charAt(0).toUpperCase() + event.device.type.slice(1);
    deviceCounts[deviceKey] = (deviceCounts[deviceKey] || 0) + 1;
  });
  
  const clicksByDevice = Object.entries(deviceCounts).map(([device, count]) => ({
    device,
    count
  }));
  
  // Group by location (city, country)
  const locationCounts: { [key: string]: number } = {};
  clickEvents.forEach(event => {
    const locationKey = `${event.location.city}, ${event.location.country}`;
    locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;
  });
  
  const clicksByLocation = Object.entries(locationCounts)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count);
  
  // Also keep country data for backward compatibility
  const countryCounts: { [key: string]: number } = {};
  clickEvents.forEach(event => {
    countryCounts[event.location.country] = (countryCounts[event.location.country] || 0) + 1;
  });
  
  const clicksByCountry = Object.entries(countryCounts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
  
  return {
    clicksByDay,
    clicksByDevice,
    clicksByCountry,
    clicksByLocation
  };
};
