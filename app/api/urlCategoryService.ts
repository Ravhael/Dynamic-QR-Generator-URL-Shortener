// services/api/urlCategoryService.ts

import apiClient from './apiClient';

// Tipe kategori URL
export interface URLCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
  userId?: string;
  urlCount?: number; // Tambahkan field untuk jumlah URL dalam kategori
  createdAt?: string;
  updatedAt?: string;
}

// ✅ Fungsi GET dengan return object: { categories: [...] }
const getURLCategories = async (): Promise<{ categories: URLCategory[] }> => {
  const res = await apiClient.get('/url-categories');
  return { categories: (res as any).categories }; // ✔️ disesuaikan agar cocok dengan frontend
};

// Fungsi CREATE
const createURLCategory = async (data: {
  name: string;
  description?: string;
  color?: string;
}) => {
  const res = await apiClient.post('/url-categories', data);
  if (!res?.success) {
    throw new Error(res?.error || 'Failed to create category');
  }
  return res;
};

// Fungsi UPDATE
const updateURLCategory = async (
  id: string,
  data: {
    name: string;
    description?: string;
    color?: string;
  }
) => {
  const res = await apiClient.put(`/url-categories/${id}`, data);
  if (!res?.success) {
    throw new Error(res?.error || 'Failed to update category');
  }
  return res;
};

// Fungsi DELETE
const deleteURLCategory = async (id: string) => {
  const res = await apiClient.delete(`/url-categories/${id}`);
  if (!res?.success) {
    throw new Error(res?.error || 'Failed to delete category');
  }
  return res;
};

// Fungsi GET CATEGORY COUNTS - mengambil jumlah URL per kategori
const getCategoryCounts = async (): Promise<{ counts: { [key: string]: number } }> => {
  const res = await apiClient.get('/url-categories/count');
  return res as { counts: { [key: string]: number } };
};

// Export semua service dalam satu objek
export const urlCategoryService = {
  getURLCategories,
  createURLCategory,
  updateURLCategory,
  deleteURLCategory,
  getCategoryCounts,
};
