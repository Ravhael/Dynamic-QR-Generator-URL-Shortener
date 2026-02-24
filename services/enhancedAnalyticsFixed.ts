// Enhanced Analytics Service dengan Real-Time Data Collection
import axios from 'axios';

// Simplified interfaces without external dependencies
export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop';
  brand: string;
  model: string;
  os: string;
  browser: string;
}

export interface LocationInfo {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  latitude: number;
  longitude: number;
  ip: string;
  isp?: string;
  org?: string;
}

export interface RealTimeAnalytics {
  device: DeviceInfo;
  location: LocationInfo;
  timestamp: Date;
  sessionId: string;
  userAgent: string;
  language: string;
  screenWidth: number;
  screenHeight: number;
}

class EnhancedAnalyticsService {
  private sessionId: string;
  private cache: Map<string, any> = new Map();
  
  private geoServices = [
    {
      name: 'ipapi.co',
      url: (ip: string) => `https://ipapi.co/${ip}/json/`,
      parse: (data: any) => ({
        country: data?.country_name || 'Unknown',
        countryCode: data?.country_code || 'XX',
        region: data?.region || 'Unknown',
        city: data?.city || 'Unknown',
        timezone: data?.timezone || 'UTC',
        latitude: data?.latitude || 0,
        longitude: data?.longitude || 0,
        isp: data?.org || 'Unknown ISP',
        org: data?.org || 'Unknown Org'
      })
    },
    {
      name: 'ip-api.com', 
      url: (ip: string) => `http://ip-api.com/json/${ip}`,
      parse: (data: any) => ({
        country: data?.country || 'Unknown',
        countryCode: data?.countryCode || 'XX',
        region: data?.regionName || 'Unknown',
        city: data?.city || 'Unknown',
        timezone: data?.timezone || 'UTC',
        latitude: data?.lat || 0,
        longitude: data?.lon || 0,
        isp: data?.isp || 'Unknown ISP',
        org: data?.org || 'Unknown Org'
      })
    }
  ];

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get Real IP Address
  async getRealIP(request?: any): Promise<string> {
    if (typeof window !== 'undefined') {
      // Client-side: Use external service
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
      } catch (_error) {
        console.error('Failed to get IP:', _error);
        return '127.0.0.1';
      }
    } else {
      // Server-side: Extract from request headers
      if (!request) return '127.0.0.1';
      
      const forwarded = request.headers.get('x-forwarded-for');
      const realIP = request.headers.get('x-real-ip');
      const cfConnectingIP = request.headers.get('cf-connecting-ip');
      
      if (cfConnectingIP) return cfConnectingIP;
      if (realIP) return realIP;
      if (forwarded) return forwarded.split(',')[0].trim();
      
      return request.ip || '127.0.0.1';
    }
  }

  // Enhanced Device Detection from User Agent
  getDeviceInfo(userAgent?: string): DeviceInfo {
    const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
    let os = 'Unknown';
    let browser = 'Unknown';

    // Detect device type
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      if (/iPad|Android.*Tablet/i.test(ua)) {
        deviceType = 'tablet';
      } else {
        deviceType = 'mobile';
      }
    }

    // Detect OS
    if (/Windows NT 10/i.test(ua)) os = 'Windows 10';
    else if (/Windows NT 11/i.test(ua)) os = 'Windows 11';
    else if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac OS X 10[._](\d+)/i.test(ua)) {
      const match = ua.match(/Mac OS X 10[._](\d+)/i);
      os = match ? `macOS 10.${match[1]}` : 'macOS';
    }
    else if (/Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/Android (\d+)/i.test(ua)) {
      const match = ua.match(/Android (\d+)/i);
      os = match ? `Android ${match[1]}` : 'Android';
    }
    else if (/iPhone|iPad|iPod/i.test(ua)) {
      if (/OS (\d+_\d+)/i.test(ua)) {
        const match = ua.match(/OS (\d+_\d+)/i);
        os = match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
      } else {
        os = 'iOS';
      }
    }

    // Detect browser with version
    if (/Chrome\/([0-9.]+)/i.test(ua) && !/Edge/i.test(ua)) {
      const match = ua.match(/Chrome\/([0-9.]+)/i);
      browser = match ? `Chrome ${match[1].split('.')[0]}` : 'Chrome';
    }
    else if (/Firefox\/([0-9.]+)/i.test(ua)) {
      const match = ua.match(/Firefox\/([0-9.]+)/i);
      browser = match ? `Firefox ${match[1].split('.')[0]}` : 'Firefox';
    }
    else if (/Safari\/([0-9.]+)/i.test(ua) && !/Chrome/i.test(ua)) {
      if (/Version\/([0-9.]+)/i.test(ua)) {
        const match = ua.match(/Version\/([0-9.]+)/i);
        browser = match ? `Safari ${match[1].split('.')[0]}` : 'Safari';
      } else {
        browser = 'Safari';
      }
    }
    else if (/Edg\/([0-9.]+)/i.test(ua)) {
      const match = ua.match(/Edg\/([0-9.]+)/i);
      browser = match ? `Edge ${match[1].split('.')[0]}` : 'Edge';
    }
    else if (/Opera\/([0-9.]+)/i.test(ua) || /OPR\/([0-9.]+)/i.test(ua)) {
      const operaMatch = ua.match(/Opera\/([0-9.]+)/i) || ua.match(/OPR\/([0-9.]+)/i);
      browser = operaMatch ? `Opera ${operaMatch[1].split('.')[0]}` : 'Opera';
    }

    // Detect device brand and model
    let brand = 'Unknown';
    let model = 'Unknown';

    if (/iPhone/i.test(ua)) {
      brand = 'Apple';
      if (/iPhone OS ([0-9_]+)/i.test(ua)) {
        model = 'iPhone';
      }
    } else if (/iPad/i.test(ua)) {
      brand = 'Apple';
      model = 'iPad';
    } else if (/Samsung/i.test(ua)) {
      brand = 'Samsung';
      const samsungMatch = ua.match(/SM-([A-Z0-9]+)/i);
      model = samsungMatch ? samsungMatch[1] : 'Galaxy';
    } else if (/Xiaomi|Mi /i.test(ua)) {
      brand = 'Xiaomi';
      const xiaomiMatch = ua.match(/(Mi [A-Z0-9 ]+|Redmi [A-Z0-9 ]+)/i);
      model = xiaomiMatch ? xiaomiMatch[1].trim() : 'Mi';
    } else if (/HUAWEI/i.test(ua)) {
      brand = 'Huawei';
      const huaweiMatch = ua.match(/HUAWEI ([A-Z0-9-]+)/i);
      model = huaweiMatch ? huaweiMatch[1] : 'Huawei';
    } else if (/OPPO/i.test(ua)) {
      brand = 'OPPO';
      const oppoMatch = ua.match(/OPPO ([A-Z0-9]+)/i);
      model = oppoMatch ? oppoMatch[1] : 'OPPO';
    } else if (/vivo/i.test(ua)) {
      brand = 'Vivo';
      const vivoMatch = ua.match(/vivo ([A-Z0-9]+)/i);
      model = vivoMatch ? vivoMatch[1] : 'Vivo';
    }

    return {
      type: deviceType,
      brand,
      model,
      os,
      browser
    };
  }

  // Enhanced Location Detection
  async getLocationInfo(ip?: string): Promise<LocationInfo> {
    const targetIP = ip || await this.getRealIP();
    
    // Check cache first
    const cacheKey = `location_${targetIP}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check if IP is private/local
    if (this.isPrivateIP(targetIP)) {
      return this.getDefaultLocationInfo(targetIP);
    }

    // Try browser geolocation first (client-side only)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const position = await this.getCurrentPosition();
        const locationData = await this.reverseGeocode(position.coords.latitude, position.coords.longitude, targetIP);
        if (locationData) {
          this.cache.set(cacheKey, locationData);
          return locationData;
        }
      } catch (_error) {
        console.warn('Browser geolocation failed, falling back to IP geolocation');
      }
    }

    // Fallback to IP geolocation services
    for (const service of this.geoServices) {
      try {
        const response = await axios.get(service.url(targetIP), { 
          timeout: 5000,
          headers: {
            'User-Agent': 'ScanlyAnalytics/1.0'
          }
        });

        if (response.data && (response.data.status !== 'fail')) {
          const locationInfo = {
            ...service.parse(response.data),
            ip: targetIP
          };
          this.cache.set(cacheKey, locationInfo);
          return locationInfo;
        }
      } catch (_error) {
    console.warn(`${service.name} failed:`, (_error as Error).message);
        continue;
      }
    }

    // Final fallback
    return this.getDefaultLocationInfo(targetIP);
  }

  private async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  private async reverseGeocode(lat: number, lon: number, ip: string): Promise<LocationInfo | null> {
    try {
      // Use OpenStreetMap Nominatim for reverse geocoding
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          timeout: 5000,
          headers: {
            'User-Agent': 'ScanlyAnalytics/1.0'
          }
        }
      );

      if (response.data && response.data.address) {
        const addr = response.data.address;
        return {
          country: addr.country || 'Unknown',
          countryCode: addr.country_code?.toUpperCase() || 'XX',
          region: addr.state || addr.province || addr.region || 'Unknown',
          city: addr.city || addr.town || addr.village || 'Unknown',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          latitude: lat,
          longitude: lon,
          ip: ip
        };
      }
    } catch (_error) {
  console.warn('Reverse geocoding failed:', _error);
    }
    return null;
  }

  private isPrivateIP(ip: string): boolean {
    if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
      return true;
    }

    const privateRanges = [
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00:/,
      /^fe80:/
    ];

    return privateRanges.some(range => range.test(ip));
  }

  private getDefaultLocationInfo(ip: string): LocationInfo {
    return {
      country: 'Indonesia',
      countryCode: 'ID',
      region: 'DKI Jakarta',
      city: 'Jakarta',
      timezone: 'Asia/Jakarta',
      latitude: -6.2088,
      longitude: 106.8456,
      ip: ip,
      isp: 'Unknown ISP',
      org: 'Unknown Organization'
    };
  }

  // Collect Complete Analytics Data
  async collectRealTimeAnalytics(request?: any): Promise<RealTimeAnalytics> {
    const userAgent = request?.headers?.get('user-agent') || 
                     (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    
    const [device, location] = await Promise.all([
      Promise.resolve(this.getDeviceInfo(userAgent)),
      this.getLocationInfo(await this.getRealIP(request))
    ]);

    const language = request?.headers?.get('accept-language')?.split(',')[0] ||
                    (typeof navigator !== 'undefined' ? navigator.language : 'en');

    const screenWidth = typeof window !== 'undefined' ? window.screen.width : 1920;
    const screenHeight = typeof window !== 'undefined' ? window.screen.height : 1080;

    return {
      device,
      location,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userAgent,
      language,
      screenWidth,
      screenHeight
    };
  }

  // Save Analytics to Database
  async saveAnalytics(data: RealTimeAnalytics, eventType: 'qr_scan' | 'url_click', resourceId: string) {
    try {
      const response = await fetch('/api/analytics/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          resourceId,
          analytics: data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save analytics');
      }

      return await response.json();
    } catch (_error) {
  console.error('Error saving analytics:', _error);
  throw _error;
    }
  }
}

// Export singleton instance
export const enhancedAnalytics = new EnhancedAnalyticsService();
export default enhancedAnalytics;
