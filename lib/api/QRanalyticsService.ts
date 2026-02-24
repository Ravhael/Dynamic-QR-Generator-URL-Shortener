import apiClient from './apiClient';

// Disalin & disesuaikan dari app/api/QRanalyticsService.ts agar konsisten di lib/api
export interface DetailedScanEvent {
  id: string; qrCodeId: string; qrCodeName: string; qrCodeType: string; qrCodeCategory: string; qrCodeUrl: string; scannedAt: string; ipAddress: string; location: { country: string; city: string; region?: string; timezone?: string; latitude?: number; longitude?: number; isp?: string; }; device: { type: 'mobile' | 'tablet' | 'desktop'; os: string; browser: string; }; }
export interface DetailedClickEvent { id: string; urlId: string; urlTitle: string; urlCategory: string; originalUrl: string; shortUrl: string; clickedAt: string; ipAddress: string; location: { country: string; city: string; region?: string; timezone?: string; latitude?: number; longitude?: number; isp?: string; }; device: { type: 'mobile' | 'tablet' | 'desktop'; os: string; browser: string; }; }
export interface AnalyticsSummary { qrCodeCount: number; shortUrlCount: number; totalScans: number; totalClicks: number; activeQRCodes?: number; scansByDay: { date: string; count: number; }[]; clicksByDay: { date: string; count: number; }[]; scansByDevice: { device: string; count: number; }[]; clicksByDevice: { device: string; count: number; }[]; scansByLocation?: { location: string; count: number; }[]; clicksByLocation?: { location: string; count: number; }[]; scansByOS?: { os: string; count: number; }[]; scansByIp?: { ip: string; location: string; count: number; }[]; topQRCodes: { id: string; name: string; scans: number; }[]; topShortUrls: { id: string; title: string; clicks: number; }[]; }
export interface AnalyticsParams { startDate?: string; endDate?: string; days?: number; limit?: number; qrCodeId?: string; urlId?: string; }

class QRAnalyticsService {
  private buildParams(params: AnalyticsParams, extra?: Record<string, string | number | undefined>) {
    const q = new URLSearchParams();
    if (params.startDate) q.append('startDate', params.startDate);
    if (params.endDate) q.append('endDate', params.endDate);
    if (params.days) q.append('days', params.days.toString());
    if (params.qrCodeId) q.append('qrCodeId', params.qrCodeId);
    if (params.urlId) q.append('urlId', params.urlId);
    if (params.limit) q.append('limit', params.limit.toString());
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => {
        if (v !== undefined) q.append(k, String(v));
      });
    }
    return q.toString();
  }

  public async getSummary(params: AnalyticsParams = {}): Promise<AnalyticsSummary> {
    const query = this.buildParams(params);
    const res = await apiClient.get(`/qr-analytics/summary?${query}`);
    return res.data;
  }

  public async getDetailedScans(params: AnalyticsParams = {}): Promise<DetailedScanEvent[]> {
    const query = this.buildParams(params);
    const res = await apiClient.get(`/qr-analytics/detailed-scans?${query}`);
    return res.data;
  }

  public async getDetailedClicks(params: AnalyticsParams = {}): Promise<DetailedClickEvent[]> {
    const query = this.buildParams(params);
    const res = await apiClient.get(`/qr-analytics/detailed-clicks?${query}`);
    return res.data;
  }

  public async getRecentActivity(limit: number = 10): Promise<{ activity: Array<DetailedScanEvent | DetailedClickEvent> }> {
    const res = await apiClient.get(`/qr-analytics/activity?limit=${limit}`);
    return res.data;
  }
}

export const qrAnalyticsService = new QRAnalyticsService();
export default qrAnalyticsService;
// Backward compatible named export
export const QRanalyticsService = qrAnalyticsService;