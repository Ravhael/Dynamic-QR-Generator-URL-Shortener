"use client";

import React, { useState, useEffect } from 'react';
import { Link, Copy, Settings, Globe, Palette } from 'lucide-react';
// Switched to unified lib/api services (Prisma-backed, /api/* endpoints)
import { shortUrlService, urlCategoryService, domainService } from '@/lib/api';

// Types
interface ShortURL {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title?: string;
  description?: string;
  clicks: number;
  maxClicks?: number;
  createdAt: string;
  expiresAt?: string;
  categoryId?: string;
  category?: { name: string };
  customDomain?: string;
}

interface URLCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export const URLGenerator: React.FC = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [title, setTitle] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<URLCategory[]>([]);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxClicks, setMaxClicks] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [generatedURL, setGeneratedURL] = useState<ShortURL | null>(null);
  const [useTracking, setUseTracking] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domains, setDomains] = useState<string[]>([]);
  const [domainsLoading, setDomainsLoading] = useState<boolean>(false);

  // Fetch categories and domains on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await urlCategoryService.getURLCategories();
        setCategories(response.categories);
        if (response.categories.length > 0) {
          setCategoryId(response.categories[0].id);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
      }
    };

    const fetchDomains = async () => {
      setDomainsLoading(true);
      try {
        let fetched = await domainService.getDomains();
        if (!fetched || fetched.length === 0) {
          // Fallback to current location host if running in browser
            if (typeof window !== 'undefined' && window.location.host) {
              fetched = [window.location.host];
            } else {
              fetched = ['localhost:3000'];
            }
        }
        setDomains(fetched);
        setCustomDomain(fetched[0]);
      } catch (err) {
        console.error('Error fetching domains:', err);
        const fallback = typeof window !== 'undefined' ? window.location.host || 'localhost:3000' : 'localhost:3000';
        setDomains([fallback]);
        setCustomDomain(fallback);
      } finally {
        setDomainsLoading(false);
      }
    };

    fetchCategories();
    fetchDomains();
  }, []);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleGenerateURL = async () => {
    if (!originalUrl.trim() || !title.trim()) return;
    if (!validateUrl(originalUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await shortUrlService.createShortURL({
        originalUrl,
        title,
        description: description || undefined,
        customCode: customCode || undefined,
        categoryId: categoryId || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        expiresAt: expiresAt || undefined,
        maxClicks: maxClicks ? parseInt(maxClicks) : undefined,
        customDomain: customDomain || undefined,
        trackingEnabled: useTracking
      });

      setGeneratedURL(response.shortUrl);
    } catch (err: any) {
      console.error('Error generating short URL:', err);
      setError(err.response?.data?.error || 'Error generating short URL. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedURL) return;
    try {
      // Rebuild the exact URL shown in preview so user gets full absolute link
      const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : `http://${customDomain || 'localhost:3000'}`;
      const trackingUrl = useTracking
        ? `${origin}/u/${generatedURL.shortCode}`
        : (generatedURL.shortUrl.startsWith('http') ? generatedURL.shortUrl : `${origin}/${generatedURL.shortCode}`);
      await navigator.clipboard.writeText(trackingUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const resetForm = () => {
    setOriginalUrl('');
    setTitle('');
    setCustomCode('');
    setDescription('');
    setTags('');
    setExpiresAt('');
    setMaxClicks('');
    setGeneratedURL(null);
    setError(null);
  };

  return (
  <div className="min-h-screen bg-white dark:bg-gray-900 px-4 py-6 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">URL Shortener Generator</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 max-w-2xl">Generate short URLs with custom domains, categories, and tracking options.</p>
      </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Form Controls */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" /> URL Details
              </h3>
              <div className="space-y-5">
                {/* --- FORM FIELDS --- */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Original URL *</label>
                  <input type="url" value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)} placeholder="https://example.com/very-long-url" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Title *</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter a title" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Description (Optional)</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Category</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Tags (comma separated)</label>
                  <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="marketing, campaign" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input id="useTracking" type="checkbox" checked={useTracking} onChange={e => setUseTracking(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                  <label htmlFor="useTracking" className="text-xs text-gray-600 dark:text-gray-300 select-none">Use tracking redirect (recommended)</label>
                </div>
                <button onClick={handleGenerateURL} disabled={!originalUrl.trim() || !title.trim() || isGenerating} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-md font-medium transition-colors text-sm flex items-center justify-center gap-2">
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Link className="w-4 h-4" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column - Customization */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-600" />Customization</h3>
                <button onClick={() => setShowCustomization(!showCustomization)} className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs font-medium">{showCustomization ? 'Hide' : 'Show'}</button>
              </div>
              {showCustomization && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Custom Domain</label>
                    {domainsLoading ? (
                      <div className="text-xs text-gray-500">Loading domains...</div>
                    ) : (
                      <select value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                        {domains.map((domain) => (
                          <option key={domain} value={domain}>{domain}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Custom Short Code (Optional)</label>
                    <input type="text" value={customCode} onChange={(e) => setCustomCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))} placeholder="custom-code" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                    <p className="text-[10px] text-gray-500 mt-1">Leave empty for auto-generated code</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Expiration Date (Optional)</label>
                    <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Max Clicks (Optional)</label>
                    <input type="number" value={maxClicks} onChange={(e) => setMaxClicks(e.target.value)} placeholder="1000" min="1" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={resetForm} className="w-full px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Reset Form</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><Link className="w-5 h-5 text-indigo-600" />Live Preview</h3>
              <div className="flex flex-col items-center space-y-5">
                {generatedURL ? (
                  <div className="w-full">
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-900">
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-12 h-12 rounded-md bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                          <Link className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-[11px] font-medium text-gray-500 mb-1">Short URL</div>
                          <div className="text-indigo-600 dark:text-indigo-400 font-mono text-sm break-all font-semibold">{useTracking ? `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${generatedURL.shortCode}` : generatedURL.shortUrl}</div>
                        </div>
                        <div>
                          <div className="text-[11px] font-medium text-gray-500 mb-1">Original URL</div>
                          <div className="text-gray-800 dark:text-gray-200 text-xs break-all">{generatedURL.originalUrl}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-center gap-2 flex-wrap mt-4">
                      <button onClick={copyToClipboard} className={copySuccess ? 'bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-xs rounded-md flex items-center gap-1 font-medium' : 'bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 text-xs rounded-md flex items-center gap-1 font-medium'}>
                        <Copy className="w-4 h-4" /> {copySuccess ? 'Copied!' : 'Copy'}
                      </button>
                      <button onClick={() => window.open(generatedURL.originalUrl, '_blank')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-xs rounded-md flex items-center gap-1 font-medium">
                        <Globe className="w-4 h-4" /> Visit
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <div className="text-center space-y-1">
                      <Link className="w-10 h-10 text-gray-400 mx-auto" />
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Preview will appear here</p>
                      <p className="text-[11px] text-gray-500">Fill form & generate</p>
                    </div>
                  </div>
                )}
                {/* Status Info */}
                {generatedURL && (
                  <div className="w-full p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md mt-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Short URL generated.</span>
                  </div>
                )}
                {!generatedURL && (
                  <div className="w-full p-3 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-md mt-2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Fill the form and generate.</span>
                  </div>
                )}
                {/* Details Panel */}
                {generatedURL && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 w-full mt-2">
                    <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2 text-xs">URL Details</h4>
                    <div className="space-y-1 text-[11px] text-blue-800 dark:text-blue-200">
                      <div className="flex justify-between"><span className="font-medium">Title</span><span>{generatedURL.title}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Category</span><span>{generatedURL.category?.name}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Domain</span><span>{generatedURL.customDomain || domains[0]}</span></div>
                      <div className="flex justify-between"><span className="font-medium">Code</span><span className="font-mono">{generatedURL.shortCode}</span></div>
                      {generatedURL.expiresAt && (<div className="flex justify-between"><span className="font-medium">Expires</span><span>{new Date(generatedURL.expiresAt).toLocaleDateString()}</span></div>)}
                      {generatedURL.maxClicks && (<div className="flex justify-between"><span className="font-medium">Max</span><span>{generatedURL.maxClicks.toLocaleString()}</span></div>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
