// Enhanced Analytics Service dengan Real-Time Data Collection
import axios from 'axios';
import { UAParser } from 'ua-parser-js';

// Dynamic import for server-side only
let geoip: any = null;
if (typeof window === 'undefined') {
  try {
    geoip = require('geoip-lite');
  } catch (err) {
    console.warn('geoip-lite not available:', err);
  }
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'tv' | 'console' | 'wearable' | 'embedded';
  brand: string;
  model: string;
  vendor?: string;
}

export interface BrowserInfo {
  name: string;
  version: string;
  major: string;
  engine: {
    name: string;
    version: string;
  };
}

export interface OSInfo {
  name: string;
  version: string;
  architecture?: string;
  platform?: string;
}

export interface LocationInfo {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  isp?: string;
  org?: string;
  asn?: string;
  proxy?: boolean;
  hosting?: boolean;
}

export interface NetworkInfo {
  ip: string;
  userAgent: string;
  language: string;
  languages: string[];
  connectionType?: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'ethernet' | 'unknown';
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelDepth: number;
  orientation: 'portrait' | 'landscape';
  devicePixelRatio: number;
}

export interface RealTimeAnalytics {
  device: DeviceInfo;
  browser: BrowserInfo;
  os: OSInfo;
  location: LocationInfo;
  network: NetworkInfo;
  screen: ScreenInfo;
  timestamp: Date;
  sessionId: string;
  fingerprint?: string;
}

class EnhancedAnalyticsService {
  private sessionId: string;
  private cache: Map<string, any> = new Map();
  private geoServices = [
    {
      name: 'ipapi.co',
      url: (ip: string) => `https://ipapi.co/${ip}/json/`,
      parse: (data: any) => ({
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        timezone: data.timezone,
        latitude: data.latitude,
        longitude: data.longitude,
        isp: data.org,
        org: data.org,
        asn: data.asn
      })
    },
    {
      name: 'ip-api.com', 
      url: (ip: string) => `http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting`,
      parse: (data: any) => ({
        country: data.country,
        countryCode: data.countryCode,
        region: data.regionName,
        city: data.city,
        timezone: data.timezone,
        latitude: data.lat,
        longitude: data.lon,
        isp: data.isp,
        org: data.org,
        asn: data.as,
        proxy: data.proxy,
        hosting: data.hosting
      })
    },
    {
      name: 'ipgeolocation.io',
      url: (ip: string) => `https://api.ipgeolocation.io/ipgeo?apiKey=${process.env.IPGEOLOCATION_API_KEY}&ip=${ip}`,
      parse: (data: any) => ({
        country: data.country_name,
        countryCode: data.country_code2,
        region: data.state_prov,
        city: data.city,
        timezone: data.time_zone?.name,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        isp: data.isp,
        org: data.organization,
        asn: data.asn
      })
    }
  ];

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private async getRealIP(request?: any): Promise<string> {
    if (typeof window !== 'undefined') {
      // Client-side: Use external service
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
      } catch (err) {
        console.error('Failed to get IP:', err);
        return '127.0.0.1';
      }
    } else {
      // Server-side: Extract from request headers
      if (!request) return '127.0.0.1';
      
      const forwarded = request.headers.get('x-forwarded-for');
      const realIP = request.headers.get('x-real-ip');
      const cfConnectingIP = request.headers.get('cf-connecting-ip');
      
      // Priority: CF-Connecting-IP > X-Real-IP > X-Forwarded-For > Remote Address
      if (cfConnectingIP) return cfConnectingIP;
      if (realIP) return realIP;
      if (forwarded) return forwarded.split(',')[0].trim();
      
      return request.ip || '127.0.0.1';
    }
  }

  // Enhanced Device Detection
  getDeviceInfo(userAgent?: string): DeviceInfo {
    const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    const parser = new UAParser(ua);
    const result = parser.getResult();
    
    return {
      type: this.normalizeDeviceType(result.device?.type),
      brand: result.device?.vendor || 'Unknown',
      model: result.device?.model || 'Unknown',
      vendor: result.device?.vendor
    };
  }

  private normalizeDeviceType(type?: string): 'mobile' | 'tablet' | 'desktop' | 'tv' | 'console' | 'wearable' | 'embedded' {
    if (!type) return 'desktop';
    
    const normalized = type.toLowerCase();
    if (normalized.includes('mobile') || normalized.includes('phone')) return 'mobile';
    if (normalized.includes('tablet')) return 'tablet';
    if (normalized.includes('tv')) return 'tv';
    if (normalized.includes('console')) return 'console';
    if (normalized.includes('wearable') || normalized.includes('watch')) return 'wearable';
    if (normalized.includes('embedded')) return 'embedded';
    
    return 'desktop';
  }

  // Enhanced Browser Detection
  getBrowserInfo(userAgent?: string): BrowserInfo {
    const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    const parser = new UAParser(ua);
    const result = parser.getResult();
    
    return {
      name: result.browser?.name || 'Unknown',
      version: result.browser?.version || 'Unknown',
      major: result.browser?.major || 'Unknown',
      engine: {
        name: result.engine?.name || 'Unknown',
        version: result.engine?.version || 'Unknown'
      }
    };
  }

  // Enhanced OS Detection
  getOSInfo(userAgent?: string): OSInfo {
    const ua = userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    const parser = new UAParser(ua);
    const result = parser.getResult();
    
    return {
      name: result.os?.name || 'Unknown',
      version: result.os?.version || 'Unknown',
      architecture: result.cpu?.architecture || undefined,
      platform: typeof navigator !== 'undefined' ? navigator.platform : undefined
    };
  }

  // Enhanced Location Detection with Multi-Service Fallback
  async getLocationInfo(targetIP?: string): Promise<LocationInfo> {
    const ip = targetIP || await this.getRealIP();
    
    // Check cache first
    const cacheKey = `location_${ip}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Check if IP is private/local
    if (this.isPrivateIP(ip)) {
      return this.getDefaultLocationInfo();
    }

    // Try browser geolocation first (client-side only)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const position = await this.getCurrentPosition();
        const locationData = await this.reverseGeocode(position.coords.latitude, position.coords.longitude);
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
        const response = await axios.get(service.url(ip), { 
          timeout: 5000,
          headers: {
            'User-Agent': 'ScanlyAnalytics/1.0'
          }
        });

        if (response.data && (response.data.status !== 'fail')) {
          const locationInfo = service.parse(response.data);
          this.cache.set(cacheKey, locationInfo);
          return locationInfo;
        }
      } catch (err) {
        console.warn(`${service.name} failed:`, (err as Error).message);
        continue;
      }
    }

    // Fallback to local geoip-lite (server-side only)
    if (typeof window === 'undefined' && geoip) {
      try {
        const geo = geoip.lookup(ip);
        if (geo) {
          const fallbackLocation = {
            country: geo.country,
            countryCode: geo.country,
            region: geo.region,
            city: geo.city,
            timezone: geo.timezone,
            latitude: geo.ll[0],
            longitude: geo.ll[1],
            isp: 'Unknown',
            org: 'Unknown'
          };
          this.cache.set(cacheKey, fallbackLocation);
          return fallbackLocation;
        }
      } catch (err) {
        console.warn('Local GeoIP lookup failed:', err);
      }
    }

    // Final fallback
    return this.getDefaultLocationInfo();
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

  private async reverseGeocode(lat: number, lon: number): Promise<LocationInfo | null> {
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
          accuracy: 1 // High accuracy from GPS
        };
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
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

  private getDefaultLocationInfo(): LocationInfo {
    return {
      country: 'Indonesia',
      countryCode: 'ID',
      region: 'DKI Jakarta',
      city: 'Jakarta',
      timezone: 'Asia/Jakarta',
      latitude: -6.2088,
      longitude: 106.8456,
      isp: 'Unknown ISP',
      org: 'Unknown Organization'
    };
  }

  // Network Information
  getNetworkInfo(request?: any): NetworkInfo {
    const getUserAgent = () => {
      if (request?.headers?.get) {
        return request.headers.get('user-agent') || '';
      }
      return typeof navigator !== 'undefined' ? navigator.userAgent : '';
    };

    const getLanguage = () => {
      if (request?.headers?.get) {
        return request.headers.get('accept-language')?.split(',')[0] || 'en';
      }
      return typeof navigator !== 'undefined' ? navigator.language : 'en';
    };

    const userAgent = getUserAgent();
    const language = getLanguage();

    const networkInfo: NetworkInfo = {
      ip: '127.0.0.1', // Will be updated by getRealIP
      userAgent,
      language,
      languages: typeof navigator !== 'undefined' ? [...navigator.languages] : [language]
    };

    // Add connection info if available (client-side only)
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        networkInfo.connectionType = connection.effectiveType || 'unknown';
        networkInfo.effectiveType = connection.effectiveType;
        networkInfo.downlink = connection.downlink;
        networkInfo.rtt = connection.rtt;
      }
    }

    return networkInfo;
  }

  // Screen Information (client-side only)
  getScreenInfo(): ScreenInfo {
    if (typeof window === 'undefined') {
      return {
        width: 1920,
        height: 1080,
        availWidth: 1920,
        availHeight: 1040,
        colorDepth: 24,
        pixelDepth: 24,
        orientation: 'landscape',
        devicePixelRatio: 1
      };
    }

    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      orientation: screen.width > screen.height ? 'landscape' : 'portrait',
      devicePixelRatio: window.devicePixelRatio || 1
    };
  }

  // Generate Browser Fingerprint
  generateFingerprint(): string {
    if (typeof window === 'undefined') return 'server-side';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Browser fingerprint', 2, 2);
    }

    const fingerprint = btoa(JSON.stringify({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency,
      maxTouchPoints: navigator.maxTouchPoints,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL()
    }));

    return fingerprint.substring(0, 32); // Truncate for storage
  }

  // Main method to collect all analytics
  async collectAnalytics(request?: any): Promise<RealTimeAnalytics> {
    const ip = await this.getRealIP(request);
    
    const [device, browser, os, location, screen] = await Promise.all([
      Promise.resolve(this.getDeviceInfo(request?.headers?.get('user-agent'))),
      Promise.resolve(this.getBrowserInfo(request?.headers?.get('user-agent'))),
      Promise.resolve(this.getOSInfo(request?.headers?.get('user-agent'))),
      this.getLocationInfo(ip),
      Promise.resolve(this.getScreenInfo())
    ]);

    const network = this.getNetworkInfo(request);
    network.ip = ip; // Update with real IP

    return {
      device,
      browser,
      os,
      location,
      network,
      screen,
      timestamp: new Date(),
      sessionId: this.sessionId,
      fingerprint: this.generateFingerprint()
    };
  }

  // Alias method for backward compatibility
  async collectRealTimeAnalytics(request?: any): Promise<RealTimeAnalytics> {
    return this.collectAnalytics(request);
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
    } catch (err) {
      console.error('Error saving analytics:', err);
      throw err;
    }
  }
}

// Export singleton instance
export const enhancedAnalytics = new EnhancedAnalyticsService();
export default enhancedAnalytics;
