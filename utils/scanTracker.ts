import React from 'react';
// Utility to track and store scan events consistently
interface StoredScanEvent {
  id: string;
  qrCodeId: string;
  qrCodeName: string;
  scannedAt: string;
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

// Record a new scan event
export const recordScanEvent = async (qrCodeId: string, qrCodeName: string): Promise<void> => {
  try {
    const deviceInfo = getDeviceInfo();
    const locationInfo = await getLocationInfo();
    
    const scanEvent: StoredScanEvent = {
      id: `scan_${qrCodeId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      qrCodeId,
      qrCodeName,
      scannedAt: new Date().toISOString(),
      location: locationInfo,
      device: deviceInfo,
      ipAddress: generateDemoIP()
    };

    // Get existing scan events
    const existingScanEvents = getScanEvents();
    existingScanEvents.unshift(scanEvent); // Add to beginning (most recent first)
    
    // Keep only last 1000 scan events to prevent storage bloat
    const limitedEvents = existingScanEvents.slice(0, 1000);
    
    // Save to localStorage
    localStorage.setItem('scanEvents', JSON.stringify(limitedEvents));
    
    // Update QR code scan count
    const savedQRCodes = localStorage.getItem('qrCodes');
    if (savedQRCodes) {
      const qrCodes: any[] = JSON.parse(savedQRCodes);
      const updatedQRCodes = qrCodes.map((qr: any) => {
        if (qr?.id === qrCodeId) {
          return { ...qr, scans: (qr.scans || 0) + 1 };
        }
        return qr;
      });
      localStorage.setItem('qrCodes', JSON.stringify(updatedQRCodes));
    }
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('qrCodeScanned', { 
      detail: { qrCodeId, scanEvent } 
    }));
    
  } catch (_error) {
    console.error('Error recording scan event:', _error);
  }
};

// Get all stored scan events
export const getScanEvents = (): StoredScanEvent[] => {
  try {
    const stored = localStorage.getItem('scanEvents');
    return stored ? JSON.parse(stored) : [];
  } catch (_error) {
    console.error('Error getting scan events:', _error);
    return [];
  }
};

// Get scan events for a specific QR code
export const getScanEventsForQR = (qrCodeId: string): StoredScanEvent[] => {
  return getScanEvents().filter(event => event.qrCodeId === qrCodeId);
};

// Get scan events within a date range
export const getScanEventsInRange = (startDate: Date, endDate: Date): StoredScanEvent[] => {
  return getScanEvents().filter(event => {
    const eventDate = new Date(event.scannedAt);
    return eventDate >= startDate && eventDate <= endDate;
  });
};

// Clear all scan events (for testing)
export const clearScanEvents = (): void => {
  localStorage.removeItem('scanEvents');
  window.dispatchEvent(new CustomEvent('scanEventsCleared'));
};

// Get analytics data from stored scan events
export const getAnalyticsFromScanEvents = () => {
  const scanEvents = getScanEvents();
  const now = new Date();
  
  // Group scans by day for the last 30 days
  const scansByDay = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const scansForDay = scanEvents.filter(event => 
      event.scannedAt.startsWith(dateStr)
    ).length;
    
    scansByDay.push({
      date: dateStr,
      scans: scansForDay
    });
  }
  
  // Group by device
  const deviceCounts: { [key: string]: number } = {};
  scanEvents.forEach(event => {
    const deviceKey = event.device.type.charAt(0).toUpperCase() + event.device.type.slice(1);
    deviceCounts[deviceKey] = (deviceCounts[deviceKey] || 0) + 1;
  });
  
  const scansByDevice = Object.entries(deviceCounts).map(([device, count]) => ({
    device,
    count
  }));
  
  // Group by location (city, country)
  const locationCounts: { [key: string]: number } = {};
  scanEvents.forEach(event => {
    const locationKey = `${event.location.city}, ${event.location.country}`;
    locationCounts[locationKey] = (locationCounts[locationKey] || 0) + 1;
  });
  
  const scansByLocation = Object.entries(locationCounts)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count);
  
  // Also keep country data for backward compatibility
  const countryCounts: { [key: string]: number } = {};
  scanEvents.forEach(event => {
    countryCounts[event.location.country] = (countryCounts[event.location.country] || 0) + 1;
  });
  
  const scansByCountry = Object.entries(countryCounts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);
  
  return {
    scansByDay,
    scansByDevice,
    scansByCountry,
    scansByLocation
  };
};
