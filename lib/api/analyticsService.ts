import apiClient from './apiClient';

// 1. TIPE DATA DETAIL QR & URL EVENTS UNTUK DETAILED ANALYTICS
export interface DetailedScanEvent {
  id: string;
  qrCodeId: string;
  qrCodeName: string;
  qrCodeType: string;
  qrCodeCategory: string;
  qrCodeUrl: string;
  scannedAt: string; // gunakan string, di frontend baru diubah ke Date
  location: {
    country: string;
    city: string;
  };
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
  };
}

export interface DetailedClickEvent {
  id: string;
  urlId: string;
  urlTitle: string;
  urlCategory: string;
  originalUrl: string;
  shortUrl: string;
  clickedAt: string;
  location: {
    country: string;
    city: string;
  };
  device: {
    type: 'mobile' | 'tablet' | 'desktop';
    os: string;
    browser: string;
  };
}

// 2. TIPE DATA UNTUK SUMMARY ANALYTICS
export interface AnalyticsSummary {
  qrCodeCount: number;
  shortUrlCount: number;
  totalScans: number;
  totalClicks: number;
  activeQRCodes?: number;
  scansByDay: {
    date: string;
    count: number;
  }[];
  clicksByDay: {
    date: string;
    count: number;
  }[];
  scansByDevice: {
    device: string;
    count: number;
  }[];
  clicksByDevice: {
    device: string;
    count: number;
  }[];
  scansByLocation?: {
    location: string;
    count: number;
  }[];
  clicksByLocation?: {
    location: string;
    count: number;
  }[];
  topQRCodes: {
    id: string;
    name: string;
    scans: number;
  }[];
  topShortUrls: {
    id: string;
    title: string;
    clicks: number;
  }[];
}

// 3. PARAMETER FILTERING (OPSIONAL UNTUK API)
export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  days?: number;
  limit?: number;
  qrCodeId?: string;
  urlId?: string;
}

// 4. SERVICE CLASS
class AnalyticsService {
  // --- RINGKASAN ANALYTICS UNTUK DASHBOARD, CHART, DLL ---
  public async getSummary(params: AnalyticsParams = {}): Promise<AnalyticsSummary> {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.days) query.append('days', params.days.toString());
    const url = `/analytics/summary?${query.toString()}`;
    return apiClient.get(url);
  }

  // --- DATA SCAN DETAIL UNTUK DETAILED ANALYTICS QR CODE ---
  public async getDetailedScans(params: AnalyticsParams = {}): Promise<DetailedScanEvent[]> {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.qrCodeId) query.append('qrCodeId', params.qrCodeId);
    if (params.limit) query.append('limit', params.limit.toString());
    const url = `/analytics/detailed-scans?${query.toString()}`;
    return apiClient.get(url);
  }

  // --- DATA CLICK DETAIL UNTUK DETAILED ANALYTICS SHORT URL ---
  public async getDetailedClicks(params: AnalyticsParams = {}): Promise<DetailedClickEvent[]> {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.urlId) query.append('urlId', params.urlId);
    if (params.limit) query.append('limit', params.limit.toString());
    const url = `/analytics/detailed-clicks?${query.toString()}`;
    return apiClient.get(url);
  }

  // --- AKTIVITAS TERBARU (SCAN & CLICK, LIMIT BISA DISESUAIKAN) ---
  public async getRecentActivity(limit: number = 10): Promise<{ activity: Array<DetailedScanEvent | DetailedClickEvent> }> {
    const url = `/analytics/activity?limit=${limit}`;
    return apiClient.get(url);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
