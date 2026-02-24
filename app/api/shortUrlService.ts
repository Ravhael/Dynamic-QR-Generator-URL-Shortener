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
}

export interface ShortURLCreateData extends Record<string, unknown> {
  originalUrl: string;
  title: string;
  description?: string;
  customCode?: string;
  categoryId?: string;
  tags?: string[];
  expiresAt?: string;
  maxClicks?: number;
  customDomain?: string;
}

export interface ShortURLUpdateData extends Record<string, unknown> {
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
    
    const url = `/short-urls?${queryParams.toString()}`;
    return apiClient.get(url);
  }

  // Get a single short URL by ID
  public async getShortURL(id: string): Promise<{ shortUrl: ShortURL }> {
    return apiClient.get(`/short-urls/${id}`);
  }

  // Create a new short URL
  public async createShortURL(data: ShortURLCreateData): Promise<{ message: string; shortUrl: ShortURL }> {
    return apiClient.post('/short-urls', data);
  }

  // Update an existing short URL
  public async updateShortURL(id: string, data: ShortURLUpdateData): Promise<{ message: string; shortUrl: ShortURL }> {
    return apiClient.put(`/short-urls/${id}`, data);
  }

  // Delete a short URL
  public async deleteShortURL(id: string): Promise<{ message: string }> {
    return apiClient.delete(`/short-urls/${id}`);
  }
}

const instance = new ShortURLService();

export default instance