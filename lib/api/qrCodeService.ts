import apiClient from './apiClient';

export interface QRCode {
  id: string;
  name: string;
  type: 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'location';
  content: string;
  isDynamic: boolean;
  tags: string[];
  scans: number;
  isActive: boolean;
  expiresAt?: string;
  maxScans?: number;
  qrCodeData: string;
  customization: QRCodeCustomization;
  userId: string;
  // Added by enrichment layer in /api/qr-codes GET
  userName?: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface QRCodeCustomization {
  size?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  foregroundColor?: string;
  backgroundColor?: string;
  logoSize?: number;
  cornerRadius?: number;
}

export interface QRCodeCreateData {
  name: string;
  type: 'url' | 'text' | 'email' | 'phone' | 'wifi' | 'location';
  content: string;
  isDynamic?: boolean;
  categoryId?: string;
  tags?: string[];
  expiresAt?: string;
  maxScans?: number;
  customization?: QRCodeCustomization;
}

export interface QRCodeUpdateData {
  name?: string;
  content?: string;
  categoryId?: string;
  tags?: string[];
  isActive?: boolean;
  expiresAt?: string;
  maxScans?: number;
  customization?: QRCodeCustomization;
}

export interface QRCodeListParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  status?: string; // 'all', 'active', 'inactive'
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface QRCodeListResponse {
  qrCodes: QRCode[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

class QRCodeService {
  // Get all QR codes with pagination and filters
  public async getQRCodes(params: QRCodeListParams = {}): Promise<QRCodeListResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.status) queryParams.append('status', params.status);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/api/qr-codes?${queryParams.toString()}`;
    
    // DEBUG: Log parameters being sent
    console.warn("[QR CODE SERVICE] Parameters:", params);
    console.warn("[QR CODE SERVICE] URL:", url);
    
    const res = await apiClient.get(url);

    // DEBUG LOG
    console.warn("DEBUG AXIOS RAW:", res);
    console.warn("DEBUG AXIOS DATA:", res.data);

    // PERBAIKI: axios selalu return data di res.data!
    const responseData = res.data;
    
    // Defensive fallback
    if (!responseData || typeof responseData !== 'object' || !Array.isArray(responseData.qrCodes)) {
      console.error("Invalid response format:", responseData);
      return {
        qrCodes: [],
        pagination: { total: 0, page: 1, pages: 1, limit: params.limit || 9 }
      };
    }

    return responseData;
  }

  // Get a single QR code by ID
  public async getQRCode(id: string): Promise<{ qrCode: QRCode }> {
    const res = await apiClient.get(`/api/qr-codes/${id}`);
    return res.data;
  }

  // Create a new QR code
  public async createQRCode(data: QRCodeCreateData): Promise<{ message: string; qrCode: QRCode }> {
    const res = await apiClient.post('/api/qr-codes', data);
    return res.data;
  }

  // Update an existing QR code
  public async updateQRCode(id: string, data: QRCodeUpdateData): Promise<{ message: string; qrCode: QRCode }> {
    const res = await apiClient.put(`/api/qr-codes/${id}`, data);
    return res.data;
  }

  // Delete a QR code
  public async deleteQRCode(id: string): Promise<{ message: string }> {
    const res = await apiClient.delete(`/api/qr-codes/${id}`);
    return res.data;
  }

  // Record a QR code scan (public endpoint, no auth required)
  public async recordScan(id: string): Promise<{ message: string; content: string; scans: number }> {
    const res = await apiClient.post(`/qr-codes/${id}/scan`);
    return res.data;
  }

  // Bulk delete QR codes
  public async bulkDeleteQRCodes(qrCodeIds: string[]): Promise<{ message: string; deletedCount: number }> {
    const res = await apiClient.post('/api/qr-codes/bulk', {
      operation: 'delete',
      qrCodeIds
    });
    return res.data;
  }

  // Bulk update QR codes status
  public async bulkUpdateStatus(qrCodeIds: string[], status: boolean): Promise<{ message: string; updatedCount: number }> {
    const res = await apiClient.post('/api/qr-codes/bulk', {
      operation: 'updateStatus',
      qrCodeIds,
      status
    });
    return res.data;
  }

  // Get QR codes statistics
  public async getStatistics(): Promise<{ total: number; activeCount: number; inactiveCount: number; totalScans: number }> {
    const res = await apiClient.get('/api/qr-codes/stats');
    return res.data.statistics;
  }
}

const instance = new QRCodeService();
export { QRCodeService };

export default instance