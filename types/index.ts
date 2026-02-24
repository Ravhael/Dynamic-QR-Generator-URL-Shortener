export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface QRCode {
  id: string;
  name: string;
  type: 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'location';
  content: string;
  isDynamic: boolean;
  category: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  scans: number;
  isActive: boolean;
  expiresAt?: Date;
  maxScans?: number;
  qrCodeData: string;
}

export interface ShortURL {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  title: string;
  description?: string;
  category: string;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  clicks: number;
  isActive: boolean;
  expiresAt?: Date;
  maxClicks?: number;
  customDomain?: string;
}

export interface ScanEvent {
  id: string;
  qrCodeId: string;
  scannedAt: Date;
  userAgent: string;
  ipAddress: string;
  location: {
    country: string;
    city: string;
    coordinates?: [number, number];
  };
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
  };
  referrer?: string;
}

export interface AnalyticsData {
  totalScans: number;
  totalQRCodes: number;
  activeQRCodes: number;
  scansByDay: Array<{ date: string; scans: number }>;
  scansByDevice: Array<{ device: string; count: number }>;
  scansByCountry: Array<{ country: string; count: number }>;
  scansByLocation: Array<{ location: string; count: number }>;
  topQRCodes: Array<{ id: string; name: string; scans: number }>;
  topShortURLs: Array<{ id: string; title: string; clicks: number }>;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  qrCodeCount: number;
}

// Mock exports removed as the source file does not exist in workspace
