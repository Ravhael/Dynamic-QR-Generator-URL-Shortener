import apiClient from './apiClient';

export interface ShortURL {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  title: string;
  description?: string;
  tags: string[];
  clicks: number;
  isActive: boolean;
  expiresAt?: string;
  maxClicks?: number;
  customDomain?: string;
  userId: string;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  trackingEnabled?: boolean;
}

export interface ShortURLCreateData {
  originalUrl: string;
  title: string;
  description?: string;
  customCode?: string;
  categoryId?: string;
  tags?: string[];
  expiresAt?: string;
  maxClicks?: number;
  customDomain?: string;
  trackingEnabled?: boolean;
}

export interface ShortURLUpdateData {
  originalUrl?: string;
  title?: string;
  description?: string;
  categoryId?: string;
  tags?: string[];
  isActive?: boolean;
  expiresAt?: string;
  maxClicks?: number;
}

export interface ShortURLListParams {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ShortURLListResponse {
  shortUrls: ShortURL[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

class ShortURLService {
  // Get all short URLs with pagination and filters
  public async getShortURLs(params: ShortURLListParams = {}): Promise<ShortURLListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.category) queryParams.append('category', params.category);
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    
    const url = `/api/short-urls?${queryParams.toString()}`;
    const { data } = await apiClient.get<ShortURLListResponse>(url);
    return data;
  }

  // Get a single short URL by ID
  public async getShortURL(id: string): Promise<{ shortUrl: ShortURL }> {
    const { data } = await apiClient.get<{ shortUrl: ShortURL }>(`/api/short-urls/${id}`);
    return data;
  }

  // Create a new short URL
  public async createShortURL(data: ShortURLCreateData): Promise<{ message: string; shortUrl: ShortURL }> {
    const response = await apiClient.post<{ message: string; shortUrl: ShortURL }>(
      '/api/short-urls',
      data
    );
    return response.data;
  }

  // Update an existing short URL
  public async updateShortURL(id: string, data: ShortURLUpdateData): Promise<{ message: string; shortUrl: ShortURL }> {
    const response = await apiClient.put<{ message: string; shortUrl: ShortURL }>(
      `/api/short-urls/${id}`,
      data
    );
    return response.data;
  }

  // Delete a short URL
  public async deleteShortURL(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/api/short-urls/${id}`);
    return response.data;
  }

  // Bulk delete short URLs
  public async bulkDeleteShortURLs(shortUrlIds: string[]): Promise<{ message: string; deletedCount: number }> {
    const response = await apiClient.post<{ message: string; deletedCount: number }>(
      '/api/short-urls/bulk',
      { operation: 'delete', shortUrlIds }
    );
    return response.data;
  }

  // Bulk update status (activate/deactivate)
  public async bulkUpdateStatus(shortUrlIds: string[], status: boolean): Promise<{ message: string; updatedCount: number }> {
    const response = await apiClient.post<{ message: string; updatedCount: number }>(
      '/api/short-urls/bulk',
      { operation: 'updateStatus', shortUrlIds, status }
    );
    return response.data;
  }
}

const instance = new ShortURLService();

export default instance