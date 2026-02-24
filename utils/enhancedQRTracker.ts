// Enhanced QR Scan Tracker dengan Real-Time Analytics
import { enhancedAnalytics } from '../services/enhancedAnalytics';

interface StoredScanEvent {
  id: string;
  qrCodeId: string;
  qrCodeTitle: string;
  scannedAt: string;
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

// Track QR scan dengan enhanced analytics
export const trackQRScan = async (qrCodeId: string, qrCodeTitle: string = 'Unknown QR Code', customData?: any) => {
  try {
    console.warn(`📱 [QR TRACKER] Tracking scan for QR: ${qrCodeId} (${qrCodeTitle})`);
    
    // Collect real-time analytics
    const analytics = await enhancedAnalytics.collectRealTimeAnalytics();
    
    console.warn('📊 [QR TRACKER] Analytics collected:', {
      device: `${analytics.device.brand} ${analytics.device.model} (${analytics.device.type})`,
      os: analytics.os.name,
      browser: analytics.browser.name,
      location: `${analytics.location.city}, ${analytics.location.country}`,
      ip: analytics.network.ip,
      timestamp: analytics.timestamp
    });

    // Save to database via QR scan API
    const response = await fetch('/api/qr-scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        qrCodeId: qrCodeId,
        qrCodeTitle: qrCodeTitle,
        customData
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save QR scan analytics');
    }

    const result = await response.json();
    console.warn('✅ [QR TRACKER] Analytics saved successfully');

    // Store in localStorage for offline access
    if (typeof window !== 'undefined') {
      const scanEvent: StoredScanEvent = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        qrCodeId,
        qrCodeTitle,
        scannedAt: new Date().toISOString(),
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
      
      const existingScans = JSON.parse(localStorage.getItem('qr_scans') || '[]');
      existingScans.push(scanEvent);
      
      // Keep only last 100 scans to manage storage
      if (existingScans.length > 100) {
        existingScans.splice(0, existingScans.length - 100);
      }
      
      localStorage.setItem('qr_scans', JSON.stringify(existingScans));
    }

    return result;

  } catch (err) {
    console.error('❌ [QR TRACKER] Error tracking QR scan:', err);
    
    // Fallback: store locally for later sync
    if (typeof window !== 'undefined') {
      const fallbackScan = {
        id: `failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        qrCodeId,
        qrCodeTitle,
        timestamp: new Date().toISOString(),
  _error: (err as Error).message,
        userAgent: navigator.userAgent,
        language: navigator.language
      };
      
      const failedScans = JSON.parse(localStorage.getItem('failed_qr_scans') || '[]');
      failedScans.push(fallbackScan);
      localStorage.setItem('failed_qr_scans', JSON.stringify(failedScans));
    }
    
  throw err;
  }
};

// Get recent scans from localStorage
export const getRecentQRScans = (): StoredScanEvent[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem('qr_scans') || '[]');
  } catch (err) {
    console.error('Error reading QR scans from localStorage:', err);
    return [];
  }
};

// Clear stored scans
export const clearStoredQRScans = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('qr_scans');
    localStorage.removeItem('failed_qr_scans');
  }
};

// Retry failed scans
export const retryFailedQRScans = async () => {
  if (typeof window === 'undefined') return;
  
  const failedScans = JSON.parse(localStorage.getItem('failed_qr_scans') || '[]');
  if (failedScans.length === 0) return;
  
  console.warn(`🔄 [QR TRACKER] Retrying ${failedScans.length} failed scans`);
  
  const successfulRetries: Array<{ qrCodeId: string; timestamp: string }> = [];
  
  for (const scan of failedScans) {
    try {
      await trackQRScan(scan.qrCodeId, scan.qrCodeTitle);
      successfulRetries.push(scan);
    } catch (_error) {
      console.warn('Retry failed for scan:', scan.qrCodeId);
    }
  }
  
  // Remove successful retries
  const remainingFailed = failedScans.filter((scan: { qrCodeId: string; timestamp: string }) => 
    !successfulRetries.some((success) => success.qrCodeId === scan.qrCodeId && success.timestamp === scan.timestamp)
  );
  
  localStorage.setItem('failed_qr_scans', JSON.stringify(remainingFailed));
  
  console.warn(`✅ [QR TRACKER] Retried ${successfulRetries.length}/${failedScans.length} failed scans`);
};

// Legacy compatibility - keeping existing functions
export const storeQRScan = async (qrCodeId: string, qrCodeTitle: string = 'Unknown QR Code') => {
  return trackQRScan(qrCodeId, qrCodeTitle);
};

// Get scan data for analytics
export const getScanAnalytics = () => {
  return getRecentQRScans();
};

// Get QR scanner capability check
export const checkQRScannerCapability = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  // Check for camera API support
  const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  
  // Check if it's a mobile device (better QR scanning experience)
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return hasGetUserMedia && isMobile;
};

// Get optimal QR scan settings based on device
export const getQRScanSettings = () => {
  if (typeof navigator === 'undefined') {
    return {
      width: 640,
      height: 480,
      facingMode: 'environment'
    };
  }

  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isTablet = /iPad|Android.*Tablet/i.test(navigator.userAgent);
  
  if (isMobile) {
    return {
      width: 1280,
      height: 720,
      facingMode: 'environment', // Back camera
      aspectRatio: 16/9
    };
  } else if (isTablet) {
    return {
      width: 1920,
      height: 1080,
      facingMode: 'environment',
      aspectRatio: 16/9
    };
  } else {
    return {
      width: 1280,
      height: 720,
      facingMode: 'user', // Front camera for desktop
      aspectRatio: 16/9
    };
  }
};
