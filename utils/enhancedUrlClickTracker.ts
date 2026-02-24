// Enhanced URL Click Tracker dengan Real-Time Analytics
import { enhancedAnalytics } from '../services/enhancedAnalytics';

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
    brand: string;
    model: string;
    os: string;
    browser: string;
    userAgent: string;
  };
  ipAddress: string;
  sessionId: string;
}

interface FailedClickEvent {
  id: string;
  urlId: string;
  urlTitle: string;
  timestamp: string;
  _error?: string;
  userAgent?: string;
  language?: string;
}

// Track URL click dengan enhanced analytics
export const trackURLClick = async (urlId: string, urlTitle: string = 'Unknown URL', customData?: any) => {
  try {
    console.warn(`🔗 [URL TRACKER] Tracking click for URL: ${urlId} (${urlTitle})`);
    
    // Collect real-time analytics
    const analytics = await enhancedAnalytics.collectRealTimeAnalytics();
    
    console.warn('📊 [URL TRACKER] Analytics collected:', {
      device: `${analytics.device.brand} ${analytics.device.model} (${analytics.device.type})`,
      os: analytics.os.name,
      browser: analytics.browser.name,
      location: `${analytics.location.city}, ${analytics.location.country}`,
      ip: analytics.network.ip,
      timestamp: analytics.timestamp
    });

    // Save to database via API
    const response = await fetch('/api/analytics/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventType: 'url_click',
        resourceId: urlId,
        customData
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save URL click analytics');
    }

    const result = await response.json();
    console.warn('✅ [URL TRACKER] Analytics saved successfully');

    // Store in localStorage for offline access
    if (typeof window !== 'undefined') {
      const clickEvent: StoredClickEvent = {
        id: `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        urlId,
        urlTitle,
        clickedAt: new Date().toISOString(),
        location: {
          country: analytics.location.country,
          city: analytics.location.city,
          latitude: analytics.location.latitude,
          longitude: analytics.location.longitude
        },
        device: {
          type: analytics.device.type === 'tv' ? 'desktop' : analytics.device.type as 'mobile' | 'tablet' | 'desktop',
          brand: analytics.device.brand,
          model: analytics.device.model,
          os: analytics.os.name,
          browser: analytics.browser.name,
          userAgent: analytics.network.userAgent
        },
        ipAddress: analytics.network.ip,
        sessionId: analytics.sessionId
      };
      
      const existingClicks = JSON.parse(localStorage.getItem('url_clicks') || '[]');
      existingClicks.push(clickEvent);
      
      // Keep only last 100 clicks to manage storage
      if (existingClicks.length > 100) {
        existingClicks.splice(0, existingClicks.length - 100);
      }
      
      localStorage.setItem('url_clicks', JSON.stringify(existingClicks));
    }

    return result;

  } catch (err) {
    console.error('❌ [URL TRACKER] Error tracking URL click:', err);
    
    // Fallback: store locally for later sync
    if (typeof window !== 'undefined') {
      const fallbackClick = {
        id: `failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        urlId,
        urlTitle,
        timestamp: new Date().toISOString(),
        _error: (err as Error).message,
        userAgent: navigator.userAgent,
        language: navigator.language
      };
      
      const failedClicks = JSON.parse(localStorage.getItem('failed_url_clicks') || '[]');
      failedClicks.push(fallbackClick);
      localStorage.setItem('failed_url_clicks', JSON.stringify(failedClicks));
    }
    
    throw err;
  }
};

// Get recent clicks from localStorage
export const getRecentURLClicks = (): StoredClickEvent[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem('url_clicks') || '[]') as StoredClickEvent[];
  } catch (err) {
    console.error('Error reading URL clicks from localStorage:', err);
    return [];
  }
};

// Clear stored clicks
export const clearStoredURLClicks = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('url_clicks');
    localStorage.removeItem('failed_url_clicks');
  }
};

// Retry failed clicks
export const retryFailedURLClicks = async () => {
  if (typeof window === 'undefined') return;
  
  const failedClicks: FailedClickEvent[] = JSON.parse(localStorage.getItem('failed_url_clicks') || '[]');
  if (failedClicks.length === 0) return;
  
  console.warn(`🔄 [URL TRACKER] Retrying ${failedClicks.length} failed clicks`);
  
  const successfulRetries: FailedClickEvent[] = [];
  
  for (const click of failedClicks) {
    try {
      await trackURLClick(click.urlId, click.urlTitle);
      successfulRetries.push(click);
    } catch (_err) {
      console.warn('Retry failed for click:', click.urlId);
    }
  }
  
  // Remove successful retries
  const remainingFailed = failedClicks.filter((click: FailedClickEvent) =>
    !successfulRetries.some(success => success.urlId === click.urlId && success.timestamp === click.timestamp)
  );
  
  localStorage.setItem('failed_url_clicks', JSON.stringify(remainingFailed));
  
  console.warn(`✅ [URL TRACKER] Retried ${successfulRetries.length}/${failedClicks.length} failed clicks`);
};

// Legacy compatibility - keeping existing functions
export const storeURLClick = async (urlId: string, urlTitle: string = 'Unknown URL') => {
  return trackURLClick(urlId, urlTitle);
};

// Get click data for analytics
export const getClickAnalytics = () => {
  return getRecentURLClicks();
};

// Get device info (for backward compatibility)
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      type: 'desktop' as const,
      os: 'Unknown',
      browser: 'Unknown',
      userAgent: 'Server-side'
    };
  }

  const userAgent = navigator.userAgent;
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  let os = 'Unknown';
  let browser = 'Unknown';

  // Detect device type
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    if (/iPad|Android.*Tablet/i.test(userAgent)) {
      deviceType = 'tablet';
    } else {
      deviceType = 'mobile';
    }
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

// Get location info (for backward compatibility)
export const getLocationInfo = async (): Promise<{ country: string; city: string; latitude?: number; longitude?: number }> => {
  try {
    const analytics = await enhancedAnalytics.collectRealTimeAnalytics();
    return {
      country: analytics.location.country,
      city: analytics.location.city,
      latitude: analytics.location.latitude,
      longitude: analytics.location.longitude
    };
  } catch (err) {
    console.error('Error getting location:', err);
    return {
      country: 'Indonesia',
      city: 'Jakarta'
    };
  }
};
