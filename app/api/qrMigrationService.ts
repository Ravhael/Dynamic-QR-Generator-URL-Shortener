import apiClient from './apiClient';

// Struktur data QRMigration sesuai kebutuhan table baru
export interface QRMigration {
  id: string;
  description?: string;
  key: string;
  name: string;              // <-- Tambah field name
  redirect_url: string;
  qr_image?: string;         // Path/URL gambar hasil upload (optional)
  categoryId?: string;       // jika ingin support kategori
  created_at: string;
  updated_at: string;
}

export interface QRMigrationCreateData {
  description?: string;
  key: string;
  name: string;              // <-- Tambah field name
  redirect_url: string;
  qr_image?: File | null; // File upload (opsional)
  categoryId?: string;       // jika ingin support kategori dari form
}

export interface QRMigrationListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface QRMigrationListResponse {
  qrMigrations: QRMigration[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

class QRMigrationService {
  // Ambil semua data migrasi (list)
  public async getQRMigrations(params: QRMigrationListParams = {}): Promise<QRMigrationListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);

    const url = `/qr-migration?${queryParams.toString()}`;
    return apiClient.get(url);
  }

  // Ambil detail migrasi by id
  public async getQRMigration(id: string): Promise<{ qrMigration: QRMigration }> {
    return apiClient.get(`/qr-migration/${id}`);
  }

  // Create data migrasi baru
  public async createQRMigration(data: QRMigrationCreateData): Promise<{ message: string; qrMigration: QRMigration }> {
    const formData = new FormData();
    formData.append('key', data.key);
    formData.append('name', data.name);                // <-- Tambah field name
    formData.append('redirect_url', data.redirect_url);
    if (data.description) formData.append('description', data.description);
    if (data.qr_image) formData.append('qr_image', data.qr_image);
    if (data.categoryId) formData.append('categoryId', data.categoryId);

    return apiClient.post(
      '/qr-migration',
      formData
    );
  }
}

const instance = new QRMigrationService();

export default instance