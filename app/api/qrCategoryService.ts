// src/services/api/qrCategoryService.ts

import apiClient from './apiClient';

// Tipe kategori QR
export interface QRCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ✅ Fungsi GET: Ambil daftar kategori QR (kembalikan { categories: [...] })
const getQRCategories = async (page: number = 1, limit: number = 10): Promise<{ categories: QRCategory[]; pagination?: any }> => {
  const res = await apiClient.get(`/qr-categories?page=${page}&limit=${limit}`);
  // apiClient sudah return data langsung dari interceptor
  return { categories: res.categories || [], pagination: res.pagination };
};

// Fungsi CREATE
const createQRCategory = async (_data: {
  name: string;
  description?: string;
  color?: string;
}) => {
  const res = await apiClient.post('/qr-categories', _data);
  return res;
};

// Fungsi UPDATE
const updateQRCategory = async (
  id: string,
  _data: {
    name: string;
    description?: string;
    color?: string;
  }
) => {
  const res = await apiClient.put(`/qr-categories/${id}`, _data);
  return res;
};

// Fungsi DELETE
const deleteQRCategory = async (id: string) => {
  const res = await apiClient.delete(`/qr-categories/${id}`);
  return res;
};

// Fungsi BULK DELETE
const bulkDeleteCategories = async (categoryIds: string[]) => {
  const res = await apiClient.post('/qr-categories/bulk', {
    operation: 'delete',
    categoryIds
  });
  return res;
};

// Fungsi GET COUNT - Dapatkan jumlah QR codes per category
const getQRCategoriesCount = async (): Promise<{ counts: { [key: string]: number }, details: unknown[] }> => {
  const res = await apiClient.get('/qr-categories/count');
  return res;
};

// Export semua method
export const qrCategoryService = {
  getQRCategories,
  createQRCategory,
  updateQRCategory,
  deleteQRCategory,
  bulkDeleteCategories,
  getQRCategoriesCount,
};
