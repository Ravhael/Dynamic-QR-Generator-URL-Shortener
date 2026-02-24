// src/services/api/qrCategoryService.ts

import axios from 'axios';

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
const getQRCategories = async (): Promise<{ categories: QRCategory[] }> => {
  const res = await axios.get('/api/qr-categories');
  return { categories: res.data.categories }; // pastikan backend return { categories: [...] }
};

// Fungsi CREATE
const createQRCategory = async (_data: {
  name: string;
  description?: string;
  color?: string;
}) => {
  const res = await axios.post('/api/qr-categories', _data);
  return res.data;
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
  const res = await axios.put(`/api/qr-categories/${id}`, _data);
  return res.data;
};

// Fungsi DELETE
const deleteQRCategory = async (id: string) => {
  const res = await axios.delete(`/api/qr-categories/${id}`);
  return res.data;
};

// Fungsi GET COUNT - Dapatkan jumlah QR codes per category
const getQRCategoriesCount = async (): Promise<{ counts: { [key: string]: number }, details: unknown[] }> => {
  const res = await axios.get('/api/qr-categories/count');
  return res.data;
};

// Export semua method
export const qrCategoryService = {
  getQRCategories,
  createQRCategory,
  updateQRCategory,
  deleteQRCategory,
  getQRCategoriesCount,
};
