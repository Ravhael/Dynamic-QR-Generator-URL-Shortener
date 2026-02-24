// services/api/urlCategoryService.ts

import axios from 'axios';

// Tipe kategori URL
export interface URLCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ✅ Fungsi GET dengan return object: { categories: [...] }
const getURLCategories = async (): Promise<{ categories: URLCategory[] }> => {
  const res = await axios.get('/api/url-categories');
  return { categories: res.data.categories };
};

// Fungsi CREATE
const createURLCategory = async (data: {
  name: string;
  description?: string;
  color?: string;
}) => {
  const res = await axios.post('/api/url-categories', data);
  return res.data;
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
  const res = await axios.put(`/api/url-categories/${id}`, data);
  return res.data;
};

// Fungsi DELETE
const deleteURLCategory = async (id: string) => {
  const res = await axios.delete(`/api/url-categories/${id}`);
  return res.data;
};

// Fungsi GET CATEGORY COUNTS - mengambil jumlah URL per kategori
const getCategoryCounts = async (): Promise<{ counts: { [key: string]: number } }> => {
  const res = await axios.get('/api/url-categories/count');
  return res.data as { counts: { [key: string]: number } };
};

// Export semua service dalam satu objek
export const urlCategoryService = {
  getURLCategories,
  createURLCategory,
  updateURLCategory,
  deleteURLCategory,
  getCategoryCounts,
};
