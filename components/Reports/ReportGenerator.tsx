"use client";

import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  DocumentArrowDownIcon, 
  ArrowPathIcon,
  CalendarDaysIcon,
  FolderIcon,
  DocumentIcon,
  ChartBarIcon,
  QrCodeIcon,
  LinkIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  DocumentTextIcon as DocumentTextSolidIcon,
  QrCodeIcon as QrCodeSolidIcon,
  LinkIcon as LinkSolidIcon
} from '@heroicons/react/24/solid';

// Inline type definitions
interface QRCategory {
  id: string;
  name: string;
  description?: string;
}

interface URLCategory {
  id: string;
  name: string;
  description?: string;
}

interface ReportParams {
  startDate: string;
  endDate: string;
  categoryId: string;
  format: 'pdf' | 'csv' | 'excel';
}

// Inline API client
const reportsAPI = {
  async getQRCategories() {
    const response = await fetch('/api/qr-categories');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async getURLCategories() {
    const response = await fetch('/api/url-categories');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  },

  async generateReport(params: ReportParams, type: string) {
    const response = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, type }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.blob();
  }
};

interface ReportGeneratorProps {
  type: 'qr-codes' | 'short-urls';
}

type CategoryType = QRCategory | URLCategory;

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ type }) => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReportParams>({
    startDate: '',
    endDate: '',
    categoryId: '',
    format: 'pdf'
  });

  // Load categories on component mount, menyesuaikan type
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        let response;
        if (type === 'qr-codes') {
          response = await reportsAPI.getQRCategories();
        } else {
          response = await reportsAPI.getURLCategories();
        }
        setCategories(Array.isArray(response.categories) ? response.categories : []);
      } catch (_error: any) {
        console.error('Error fetching categories:', _error);
        setCategories([]);
        setError(_error?.message || 'Failed to load categories');
      }
    };

    fetchCategories();
  }, [type]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const fileName = `${type}-report-${new Date().toISOString().split('T')[0]}.${formData.format}`;
      const blob = await reportsAPI.generateReport(formData, type);
      
      // Download the blob
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (_error: any) {
      console.error(`Error generating ${type} report:`, _error);
      setError(_error?.message || `Failed to generate ${type} report`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative group">
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      {/* Card */}
      <div className="relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-40"></div>
              <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                {type === 'qr-codes' ? (
                  <QrCodeSolidIcon className="h-6 w-6 text-white" />
                ) : (
                  <LinkSolidIcon className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {type === 'qr-codes' ? 'QR Code Analytics' : 'Short URL Analytics'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Generate comprehensive {type === 'qr-codes' ? 'QR code' : 'short URL'} performance reports
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl px-3 py-2">
            <SparklesIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Professional</span>
          </div>
        </div>

        {/* Enhanced Error Display */}
        {error && (
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-500/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-red-50/80 dark:bg-red-900/30 backdrop-blur-lg border border-red-200/50 dark:border-red-800/50 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modern Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Range Section */}
          <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200/30 dark:border-blue-700/30">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <CalendarDaysIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
              Date Range Selection
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Start Date */}
              <div className="space-y-2">
                <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
                />
                <CalendarDaysIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            {/* End Date */}
            <div className="space-y-2">
              <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
                />
                <CalendarDaysIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          </div>

          {/* Filters Section */}
          <div className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200/30 dark:border-purple-700/30">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FolderIcon className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
              Filters & Format
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category */}
              <div className="space-y-2">
                <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Category Filter
                </label>
                <div className="relative">
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
                  >
                  <option value="">All Categories</option>
                  {categories.map((category: CategoryType) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <FolderIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            {/* Format */}
            <div className="space-y-2">
              <label htmlFor="format" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Export Format
              </label>
              <div className="relative">
                <select
                  id="format"
                  name="format"
                  value={formData.format}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
                >
                  <option value="pdf">📄 Professional PDF Report</option>
                  <option value="csv">📊 Raw CSV Data Export</option>
                </select>
                <DocumentIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          </div>

          {/* Generate Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg group"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  <span>Generating Professional Report...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  <span>Generate {formData.format.toUpperCase()} Report</span>
                  <ChartBarIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                </>
              )}
            </button>
            
            {/* Success Indicator */}
            {!isLoading && !error && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center space-x-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Ready to generate professional analytics report</span>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Enhanced Info Section */}
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl border border-gray-200/50 dark:border-gray-600/50">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
              <DocumentArrowDownIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {type === 'qr-codes' ? 'QR Code Analytics' : 'Short URL Analytics'}
              </h4>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Comprehensive analytics data including scan/click statistics and user behavior</span>
                </p>
                <p className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>PDF:</strong> Professional reports with visual charts and formatted summaries
                  </span>
                </p>
                <p className="flex items-start space-x-2">
                  <CheckCircleIcon className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>CSV:</strong> Raw structured data perfect for spreadsheet analysis
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
