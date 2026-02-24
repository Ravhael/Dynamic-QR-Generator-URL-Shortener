"use client";

import Image from "next/image"
import React, { useState, useEffect } from 'react';
import {
  QrCodeIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  TagIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export const QRMigration: React.FC = () => {
  const [description, setDescription] = useState('');
  const [key, setKey] = useState('');
  const [name, setName] = useState(''); // Nama QR Code
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [qrImage, setQrImage] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [outputRedirect, setOutputRedirect] = useState<string | null>(null);
  const [migrationResult, setMigrationResult] = useState<Record<string, any> | null>(null);

  // Ambil kategori dan pilih default "Migration QR Code"
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.warn('🔍 QRMigration: Fetching categories...')
        const response = await fetch('/api/qr-categories')
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const res = await response.json()
        
        console.warn('📦 QRMigration: Categories response:', res)
        
        let cats = []
        if (res.data && Array.isArray(res.data.categories)) {
          cats = res.data.categories
        } else if (Array.isArray(res.categories)) {
          cats = res.categories
        } else if (Array.isArray(res)) {
          cats = res
        }
        console.warn('📋 QRMigration: Processed categories:', cats)
        setCategories(cats)

        const migrationCat = cats.find(
          (cat: any) =>
            typeof cat.name === 'string' &&
            cat.name.trim().toLowerCase() === "migration qr code"
        )
        console.warn('🎯 QRMigration: Found migration category:', migrationCat)
        
        if (migrationCat) {
          setCategoryId(migrationCat.id)
          setError(null)
          console.warn('✅ QRMigration: Migration category set successfully')
        } else {
          console.warn('❌ QRMigration: Migration category not found')
          setError('Kategori tidak ditemukan. Silakan buat kategori "Migration QR Code" dulu.')
        }
      } catch (e) {
        console.error('❌ QRMigration: Error fetching categories:', e)
        setCategories([])
        setError('Gagal mengambil data kategori')
      }
    }
    fetchCategories()
  }, [])

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setQrImage(e.target.files[0]);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!key.trim() || !redirectUrl.trim() || !name.trim() || !categoryId) {
      setError('Key, Nama QR, Redirect URL, dan Category wajib diisi.');
      setIsSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('key', key);
      formData.append('name', name);
      formData.append('redirect_url', redirectUrl);
      formData.append('categoryId', categoryId);
      if (qrImage) formData.append('qr_image', qrImage);

      // Tambahkan url_update ke FormData
      const urlUpdate = `${window.location.origin}/qr-redirect/${key}`;
      formData.append('url_update', urlUpdate);

      console.warn('🚀 QRMigration: Submitting migration data...')
      const response = await fetch('/api/qr-migration', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.warn('✅ QRMigration: Migration successful:', result)

      setSuccess('Migrasi QR Code berhasil disimpan!')
      setMigrationResult(result.data) // Store the complete result
      console.warn('[QR MIGRATION UI] Migration result:', result.data) // Debug log
      setOutputRedirect(urlUpdate)
      setDescription('')
      setKey('')
      setName('')
      setRedirectUrl('')
      setQrImage(null)
    } catch (_err: any) {
      console.error('❌ QRMigration: Migration failed:', _err)
      setError(_err.response?.data?.message || _err.message || 'Gagal migrasi QR Code. Coba lagi.')
      setMigrationResult(null) // Clear result on error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-start sm:items-center flex-col sm:flex-row gap-4">
            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
              <ArrowPathIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">QR Code Migration</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Migrate existing QR codes into the new system and preserve redirect behavior.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1"><QrCodeIcon className="h-4 w-4" /> Import existing QR codes</span>
                <span className="inline-flex items-center gap-1"><LinkIcon className="h-4 w-4" /> Maintain redirect functionality</span>
              </div>
            </div>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="mt-0.5 text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">Migration Successful</h3>
                  <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
                </div>
                {migrationResult && migrationResult.qrCodeImageUrl && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                    <div className="flex gap-4">
                      <img
                        src={migrationResult.qrCodeImageUrl}
                        alt="Generated QR Code"
                        className="w-24 h-24 object-contain border border-gray-200 dark:border-gray-600 rounded"
                        onError={(e) => {
                          console.error('QR Image failed to load:', migrationResult.qrCodeImageUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="text-sm space-y-1">
                        <p className="text-gray-800 dark:text-gray-200"><span className="font-medium">Name:</span> {migrationResult.name}</p>
                        <p className="text-gray-800 dark:text-gray-200"><span className="font-medium">Key:</span> {migrationResult.key}</p>
                        <a
                          href={migrationResult.qrCodeImageUrl}
                          download={`qr-migration-${migrationResult.key}.png`}
                          className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-medium transition-colors"
                        >
                          <CloudArrowUpIcon className="w-4 h-4" /> Download QR Code
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-sm">
            <div className="flex gap-3">
              <div className="mt-0.5 text-red-600 dark:text-red-400">
                <ExclamationTriangleIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Migration Error</h3>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Migration Details</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description..."
                    disabled={categories.length === 0}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  />
                  <TagIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">QR Code Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="QR Code name..."
                    required
                    disabled={categories.length === 0}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  />
                  <QrCodeIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Key */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Migration Key <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="Existing QR key..."
                  required
                  disabled={categories.length === 0}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                />
                <DocumentDuplicateIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Used to build the redirect URL for the migrated QR.</p>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category <span className="text-red-500">*</span></label>
              <div className="relative">
                <select
                  value={categoryId}
                  disabled
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-70 text-gray-700 dark:text-gray-300"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">Auto</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Migration QR codes are auto-categorized.</p>
            </div>

            {/* Redirect URL */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Redirect URL <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://example.com/destination"
                  required
                  disabled={categories.length === 0}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                />
                <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Destination users are sent to after scanning.</p>
            </div>

            {/* File Upload */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">QR Code Image (Optional)</label>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={categories.length === 0}
                  className="hidden"
                  id="qr-upload"
                />
                <label
                  htmlFor="qr-upload"
                  className="flex flex-col items-center justify-center w-full rounded-md border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  <CloudArrowUpIcon className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag & drop</span>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB</p>
                  {qrImage && (
                    <div className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">✓ {qrImage.name}</div>
                  )}
                </label>
              </div>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting || categories.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Migrating...</span>
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-5 w-5" />
                    <span>Complete Migration</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Success Output */}
        {outputRedirect && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Migration Complete</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Update your legacy system with the new redirect URL.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" /> Redirect URL
                </label>
                <div className="flex items-stretch rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 overflow-hidden">
                  <div className="flex-1 px-3 py-2 text-xs sm:text-sm font-mono break-all text-gray-800 dark:text-gray-100 select-all">{outputRedirect}</div>
                  <button
                    type="button"
                    onClick={() => { navigator.clipboard.writeText(outputRedirect); toast.success('URL copied'); }}
                    className="px-3 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm font-medium"
                    title="Copy"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Copy this URL into your previous system to finalize the migration.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
