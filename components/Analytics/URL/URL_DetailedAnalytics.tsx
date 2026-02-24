"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import {
  FunnelIcon,
  ArrowsUpDownIcon,
  EyeIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
  GlobeAltIcon,
  QrCodeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  ShareIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { clsx } from 'clsx';
// qrAnalyticsService not used directly in this file
import type { DetailedScanEvent, DetailedClickEvent } from '@/lib/api/qrAnalyticsTypes';

interface DetailedAnalyticsProps {
  type?: 'url';
}

// New runtime type matching API response
interface RealClickEvent extends DetailedClickEvent {
  nextCursor?: string | null;
}

const URLDetailedAnalyticsComponent: React.FC<DetailedAnalyticsProps> = ({ type = 'url' }) => {
  // Hydration fix
  const [mounted, setMounted] = useState(false);
  
  // States untuk data
  const [scanEvents, setScanEvents] = useState<DetailedScanEvent[]>([]);
  const [clickEvents, setClickEvents] = useState<DetailedClickEvent[]>([]);
  const [allURLs, setAllURLs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<{
    categories: string[];
    devices: string[];
    countries: string[]; // countries list (may drive future aggregations)
    cities: string[];     // distinct city names
    browsers: string[];
    operatingSystems: string[];
  }>({ categories: [], devices: [], countries: [], cities: [], browsers: [], operatingSystems: [] });
  const [filtersUnavailable, setFiltersUnavailable] = useState(false);
  const { data: session, status: sessionStatus } = useSession();
  
  // Filter states
  const [selectedQRCode, setSelectedQRCode] = useState<string>('all');
  const [selectedURL, setSelectedURL] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedBrowser, setSelectedBrowser] = useState<string>('all');
  const [selectedOS, setSelectedOS] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');
  // Sort & pagination
  const [sortBy, setSortBy] = useState<'date' | 'qrcode' | 'url' | 'location' | 'device'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);

  // NEW: raw events cursor pagination state (server-side)
  const [serverCursor, setServerCursor] = useState<string | null>(null);
  const [hasMoreServer, setHasMoreServer] = useState<boolean>(false);

  // Build query string for events endpoint
  const buildEventQuery = (cursor?: string | null) => {
    const params = new URLSearchParams();
    if (selectedURL !== 'all') params.set('urlId', selectedURL);
    if (dateRange) params.set('dateRange', dateRange);
    if (selectedDevice !== 'all') params.set('device', selectedDevice);
    if (selectedCategory !== 'all') params.set('category', selectedCategory); // category currently not used server-side but reserved
  if (selectedCity !== 'all') params.set('city', selectedCity);
  if (selectedCountry !== 'all') params.set('country', selectedCountry);
  if (selectedBrowser !== 'all') params.set('browser', selectedBrowser);
  if (selectedOS !== 'all') params.set('os', selectedOS);
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(itemsPerPage));
    return params.toString();
  };

  // Fetch aggregated summary (existing endpoint)
  const fetchSummary = async () => {
    const response = await fetch('/api/analytics/url', { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to load summary');
    const data = await response.json();
    setSummary({
      totalClicks: data.totalClicks || 0,
      totalURLs: data.totalUrls || 0,
      totalQRCodes: data.totalUrls || 0,
      averageScansPerDay: data.dailyAverage || 0,
    });
    setAllURLs(data.topUrls || []);
  };

  // Fetch real events (server-side pagination)
  const fetchEvents = async () => {
    setLoading(true);
    try {
      const qs = buildEventQuery();
      const res = await fetch(`/api/analytics/url/events?${qs}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load events');
      const json = await res.json();
      const events = (json.events || []) as DetailedClickEvent[];
      setClickEvents(events);
      setServerCursor(json.nextCursor || null);
      setHasMoreServer(Boolean(json.hasMore));
      // Fallback derive (will not overwrite existing authoritative lists)
      deriveDynamicFallbackFilters(events);
    } catch (e) {
      console.error('[URL DETAILED ANALYTICS] fetchEvents error', e);
      setClickEvents([]);
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  // Fetch authoritative filter options from backend filters endpoint
  const fetchFilters = async () => {
    try {
      // If running on client and no auth present, skip server filters to avoid 401s
      if (typeof window !== 'undefined') {
        const cookieStr = document.cookie || '';
        // Legacy cookies visible to document.cookie
        const hasLegacy = cookieStr.includes('scanly_auth=') || cookieStr.includes('token=') || cookieStr.includes('auth_token=');
        // NextAuth cookies are HTTP-only; rely on sessionStatus from useSession
        const hasNextAuthSession = sessionStatus === 'authenticated';
        if (!hasLegacy && !hasNextAuthSession) {
          // If next-auth session is still loading, wait and retry by returning (do not mark unavailable yet).
          if (sessionStatus === 'loading') return;
          console.warn('[URL DETAILED ANALYTICS] no auth detected (legacy cookie or NextAuth session) - skipping filters fetch to avoid 401');
          setFiltersUnavailable(true);
          return;
        }
      }

      const res = await fetch('/api/urlanalytics/filters', { credentials: 'include' });
      if (res.status === 401) {
        // Not authorized: likely user not logged in or session expired. Use derived filters.
        console.warn('[URL DETAILED ANALYTICS] filters endpoint returned 401 (unauthorized) - using derived fallback filters');
        setFiltersUnavailable(true);
        return;
      }
      if (!res.ok) {
        // Try to parse server error for debugging
        let errMsg = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          if (errJson?.error) errMsg = errJson.error;
          else if (errJson?.details) errMsg = errJson.details;
        } catch {}
        console.warn('[URL DETAILED ANALYTICS] filters endpoint failed:', errMsg);
        return;
      }
      const data = await res.json();
      if (data?.filterOptions) {
        setFiltersUnavailable(false);
        setFilterOptions(prev => ({
          categories: (data.filterOptions.categories || []).map((c: any) => c.name || c) || prev.categories,
          devices: data.filterOptions.devices || prev.devices,
          countries: data.filterOptions.countries || prev.countries,
          cities: data.filterOptions.cities || prev.cities,
          browsers: data.filterOptions.browsers || prev.browsers,
          operatingSystems: data.filterOptions.operatingSystems || prev.operatingSystems,
        }));
      }
    } catch (e) {
      console.warn('[URL DETAILED ANALYTICS] filters endpoint failed, using fallback only', (e as any)?.message);
    }
  };

  // Derive fallback filters from events (only fill empty lists)
  const deriveDynamicFallbackFilters = (events: DetailedClickEvent[]) => {
    setFilterOptions(prev => ({
  categories: prev.categories.length ? prev.categories : Array.from(new Set(events.map(e => (e.urlCategory || 'Uncategorized')).filter(Boolean))) as string[],
      devices: prev.devices.length ? prev.devices : Array.from(new Set(events.map(e => e.device.type))),
      countries: prev.countries.length ? prev.countries : Array.from(new Set(events.map(e => e.location.country))),
      cities: prev.cities.length ? prev.cities : Array.from(new Set(events.map(e => e.location.city).filter(Boolean))),
      browsers: prev.browsers.length ? prev.browsers : Array.from(new Set(events.map(e => (e as any).device.browser).filter(Boolean))),
      operatingSystems: prev.operatingSystems.length ? prev.operatingSystems : Array.from(new Set(events.map(e => (e as any).device.os).filter(Boolean))),
    }));
  };

  // Load more (append) real events using cursor (server-side pagination)
  const loadMoreServerEvents = async () => {
    if (!hasMoreServer || !serverCursor) return;
    setLoading(true);
    try {
      const qs = buildEventQuery(serverCursor);
      const res = await fetch(`/api/analytics/url/events?${qs}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load more events');
      const json = await res.json();
      const events = (json.events || []) as DetailedClickEvent[];
      setClickEvents(prev => [...prev, ...events]);
      setServerCursor(json.nextCursor || null);
      setHasMoreServer(Boolean(json.hasMore));
      // Update filters (union)
      setFilterOptions(prev => ({
        categories: Array.from(new Set([
          ...prev.categories,
          ...((events.map(e => (e.urlCategory || 'Uncategorized')).filter(Boolean)) as string[])
        ])),
        devices: Array.from(new Set([
          ...prev.devices,
          ...events.map(e => e.device.type)
        ])),
        countries: Array.from(new Set([
          ...prev.countries,
          ...events.map(e => e.location.country)
        ])),
        cities: Array.from(new Set([
          ...prev.cities,
          ...events.map(e => e.location.city).filter(Boolean)
        ])),
        browsers: Array.from(new Set([
          ...prev.browsers,
          ...events.map(e => (e as any).device.browser).filter(Boolean)
        ])),
        operatingSystems: Array.from(new Set([
          ...prev.operatingSystems,
          ...events.map(e => (e as any).device.os).filter(Boolean)
        ])),
      }));
    } catch (e) {
      console.error('[URL DETAILED ANALYTICS] loadMore error', e);
    } finally {
      setLoading(false);
    }
  };

  // Unified data fetch when filters change
  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSummary(), fetchFilters(), fetchEvents()]);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setClickEvents([]);
      setScanEvents([]);
      setAllURLs([]);
      setSummary({
        totalClicks: 0,
        totalURLs: 0,
        totalQRCodes: 0,
        averageScansPerDay: 0
      });
      setFilterOptions({ categories: [], devices: [], countries: [], cities: [], browsers: [], operatingSystems: [] });
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on relevant filter changes
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedURL, dateRange, selectedDevice, selectedCategory, selectedCity, selectedCountry, selectedBrowser, selectedOS, sessionStatus]);

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply filtering & sorting frontend
  const filterAndSort = () => {
    if (!clickEvents || clickEvents.length === 0) {
      return [];
    }
    
    let data: DetailedClickEvent[] = [...clickEvents];
    
    // Filter by Date Range
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      data = data.filter(ev => {
        const eventDate = new Date(ev.clickedAt);
        return eventDate >= cutoffDate;
      });
    }
    
    // Filter by specific URL
    if (selectedURL !== 'all') {
      data = data.filter(ev => ev.urlId === selectedURL);
    }
    
    // Filter kategori, device, cities
    if (selectedCategory !== 'all') {
      data = data.filter(ev => ev.urlCategory === selectedCategory);
    }
    if (selectedDevice !== 'all') {
      data = data.filter(ev => ev.device.type === selectedDevice);
    }
    if (selectedCity !== 'all') {
      data = data.filter(ev => ev.location.city === selectedCity);
    }
    if (selectedCountry !== 'all') {
      data = data.filter(ev => ev.location.country === selectedCountry);
    }
    if (selectedBrowser !== 'all') {
      data = data.filter(ev => (ev as any).device.browser === selectedBrowser);
    }
    if (selectedOS !== 'all') {
      data = data.filter(ev => (ev as any).device.os === selectedOS);
    }
    
    // Sorting
    data = data.sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === 'date') {
        aVal = a.clickedAt;
        bVal = b.clickedAt;
      } else if (sortBy === 'url') {
        aVal = a.urlTitle?.toLowerCase?.() || '';
        bVal = b.urlTitle?.toLowerCase?.() || '';
      } else if (sortBy === 'location') {
        aVal = `${a.location.country} ${a.location.city}`.toLowerCase();
        bVal = `${b.location.country} ${b.location.city}`.toLowerCase();
      } else if (sortBy === 'device') {
        aVal = a.device.type?.toLowerCase() || '';
        bVal = b.device.type?.toLowerCase() || '';
      }
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
    return data;
  };

  const filteredEvents = filterAndSort() || [];
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  // Get unique values for filters - URL focused
  const uniqueURLs = clickEvents ? Array.from(new Map(clickEvents.map(ev => [ev.urlId, ev.urlTitle])).entries())
    .map(([id, title]) => ({ id, title })) : [];
  
  // Use DYNAMIC categories from API 
  const uniqueCategories = filterOptions.categories;
  
  // Use DYNAMIC devices from API
  const uniqueDevices = filterOptions.devices;
  
  // Use DYNAMIC countries from API
  const uniqueCities = filterOptions.cities;
  const uniqueCountries = filterOptions.countries;
  const uniqueBrowsers = filterOptions.browsers;
  const uniqueOS = filterOptions.operatingSystems;

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return DevicePhoneMobileIcon;
      case 'tablet': return DeviceTabletIcon;
      default: return ComputerDesktopIcon;
    }
  };
  const getDeviceColor = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return 'text-blue-600 bg-blue-50';
      case 'tablet': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const resetFilters = () => {
    setSelectedURL('all');
    setSelectedCategory('all');
    setSelectedDevice('all');
  setSelectedCity('all');
  setSelectedCountry('all');
  setSelectedBrowser('all');
  setSelectedOS('all');
    setDateRange('7d');
    setSortBy('date');
    setSortOrder('desc');
    setServerCursor(null);
    setHasMoreServer(false);
  };

  // Hydration fix - don't render until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 border border-white/20 dark:border-gray-700/30 rounded-3xl shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  {/* Modern Header */}
  <div className="bg-white dark:bg-gray-800 border border-white/10 dark:border-gray-700 rounded-3xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-lg">
                  <MagnifyingGlassIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
                    URL Detailed Analytics
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mt-1">
                    Complete click data with advanced filtering and sorting
                  </p>
                </div>
              </div>
            </div>
            
              {filtersUnavailable && (
                <div className="w-full mb-3">
                  <div className="text-sm text-yellow-800 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-200 px-3 py-2 rounded-md">
                    Some filter options are unavailable while you are not signed in or your session expired. Sign in to load full filters.
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full">
                  <SparklesIcon className="h-4 w-4" />
                  <span>Showing {filteredEvents.length.toLocaleString()} of {clickEvents.length.toLocaleString()} clicks</span>
                </div>
                <button
                  onClick={() => fetchFilters()}
                  className="px-4 py-2 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                >Refresh Filters</button>
              </div>
          </div>
        </div>

  {/* Enhanced Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Scans/Clicks */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
                  <EyeIcon className="h-6 w-6 text-white" />
                </div>
                <div className="text-blue-500 dark:text-blue-400">
                  <ShareIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {summary ? summary.totalClicks?.toLocaleString() || '0' : filteredEvents.length.toLocaleString()}
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Clicks</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{summary ? 'Database total' : 'Filtered results'}</p>
              </div>
            </div>
          </div>

          {/* Unique QRs/URLs */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500 rounded-xl shadow-sm">
                  <GlobeAltIcon className="h-6 w-6 text-white" />
                </div>
                <div className="text-green-500 dark:text-green-400">
                  <ClockIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {summary ? (summary.totalURLs || 0) : (filteredEvents ? new Set(filteredEvents.map(e => e.urlId)).size : 0)}
                </p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total URLs</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{summary ? 'All in system' : 'Active items'}</p>
              </div>
            </div>
          </div>

          {/* Citys */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500 rounded-xl shadow-sm">
                  <MapPinIcon className="h-6 w-6 text-white" />
                </div>
                <div className="text-amber-500 dark:text-amber-400">
                  <GlobeAltIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {clickEvents ? new Set(clickEvents.map(e => e.location?.city).filter(Boolean)).size : 0}
                </p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cities</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total reach</p>
              </div>
            </div>
          </div>

          {/* Daily Average */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500 rounded-xl shadow-sm">
                  <CalendarIcon className="h-6 w-6 text-white" />
                </div>
                <div className="text-purple-500 dark:text-purple-400">
                  <DevicePhoneMobileIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {summary ? Math.round((summary.totalClicks || 0) / Math.max(1, 7)) : Math.round(filteredEvents.length / Math.max(1, dateRange === 'all' ? 7 : parseInt(dateRange)))}
                </p>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Daily Average</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{summary ? 'Total activity' : 'Per day activity'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters and Controls */}
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-500 rounded-xl shadow-sm">
                <FunnelIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Advanced Filters & Sorting</h3>
            </div>
            <button
              onClick={resetFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium shadow-sm"
            >
              <SparklesIcon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-300" />
              <span>Reset All</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CalendarIcon className="h-4 w-4 text-indigo-500" />
                <span>Date Range</span>
              </label>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-gray-800"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            {/* URL Select */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <GlobeAltIcon className="h-4 w-4 text-green-500" />
                <span>Short URL</span>
              </label>
              <select
                value={selectedURL}
                onChange={e => setSelectedURL(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-gray-800"
              >
                <option value="all">All URLs</option>
                {uniqueURLs.map(url => (
                  <option key={url.id} value={url.id}>{url.title}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <ShareIcon className="h-4 w-4 text-blue-500" />
                <span>Category</span>
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-gray-800"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Device */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <DevicePhoneMobileIcon className="h-4 w-4 text-purple-500" />
                <span>Device</span>
              </label>
              <select
                value={selectedDevice}
                onChange={e => setSelectedDevice(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-gray-800"
              >
                <option value="all">All Devices</option>
                <option value="mobile">Mobile</option>
                <option value="desktop">Desktop</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>

            {/* City */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <MapPinIcon className="h-4 w-4 text-amber-500" />
                <span>City</span>
              </label>
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-gray-800"
              >
                <option value="all">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <GlobeAltIcon className="h-4 w-4 text-green-500" />
                <span>Country</span>
              </label>
              <select
                value={selectedCountry}
                onChange={e => setSelectedCountry(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-gray-800"
              >
                <option value="all">All Countries</option>
                {uniqueCountries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Browser */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <DevicePhoneMobileIcon className="h-4 w-4 text-purple-500" />
                <span>Browser</span>
              </label>
              <select
                value={selectedBrowser}
                onChange={e => setSelectedBrowser(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-gray-800"
              >
                <option value="all">All Browsers</option>
                {uniqueBrowsers.map(browser => (
                  <option key={browser} value={browser}>{browser}</option>
                ))}
              </select>
            </div>

            {/* Operating System */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <ComputerDesktopIcon className="h-4 w-4 text-gray-500" />
                <span>OS</span>
              </label>
              <select
                value={selectedOS}
                onChange={e => setSelectedOS(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-gray-800"
              >
                <option value="all">All OS</option>
                {uniqueOS.map(os => (
                  <option key={os} value={os}>{os}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <ArrowsUpDownIcon className="h-4 w-4 text-red-500" />
                <span>Sort By</span>
              </label>
              <div className="flex space-x-1">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="flex-1 px-4 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-l-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 shadow-sm hover:shadow-md bg-white dark:bg-gray-800"
                >
                  <option value="date">Date</option>
                  <option value="url">URL</option>
                  <option value="location">Location</option>
                  <option value="device">Device</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className={`px-4 py-3 border border-l-0 border-gray-200 dark:border-gray-600 rounded-r-2xl transition-all duration-200 shadow-sm hover:shadow-md ${
                    sortOrder === 'desc' 
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  } hover:bg-indigo-200 dark:hover:bg-indigo-800/50`}
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  <ArrowsUpDownIcon className={`h-4 w-4 transition-transform duration-200 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Data Table */}
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="relative mx-auto w-16 h-16 mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-100 dark:border-gray-700"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 dark:border-indigo-400 absolute top-0"></div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">Loading Analytics</p>
                <p className="text-gray-600 dark:text-gray-400">Fetching detailed data...</p>
              </div>
              <div className="flex justify-center mt-4 space-x-1">
                <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <GlobeAltIcon className="h-4 w-4" />
                        <span>Short URL</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <ShareIcon className="h-4 w-4" />
                        <span>Category</span>
                      </div>
                    </th>
                        <th className="px-6 py-4 hidden sm:table-cell text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <GlobeAltIcon className="h-4 w-4" />
                        <span>Original URL</span>
                      </div>
                    </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4" />
                        <span>Click Time</span>
                      </div>
                    </th>
                        <th className="px-6 py-4 hidden sm:table-cell text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <MapPinIcon className="h-4 w-4" />
                        <span>Location</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                      <div className="flex items-center space-x-2">
                        <DevicePhoneMobileIcon className="h-4 w-4" />
                        <span>Device</span>
                      </div>
                    </th>
                        <th className="px-6 py-4 hidden sm:table-cell text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {paginatedEvents.map((event: DetailedClickEvent, index: number) => {
                    const DeviceIcon = getDeviceIcon(event.device.type);
                    const deviceColor = getDeviceColor(event.device.type);
                    return (
                      <tr 
                        key={`${event.id ?? 'evt'}-${startIndex + index}`} 
                        className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} transition-all`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {event.urlTitle}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                            {event.urlCategory}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded" title={event.originalUrl}>
                            {event.originalUrl}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {event.clickedAt ? format(new Date(event.clickedAt), 'MMM dd, yyyy') : 'Unknown date'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                              {event.clickedAt ? format(new Date(event.clickedAt), 'HH:mm:ss') : '--:--:--'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <MapPinIcon className="h-3 w-3 text-amber-500" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.location.city}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {event.location.country}
                              {event.location.region && event.location.region !== '-' && ` • ${event.location.region}`}
                            </div>
                            {event.location.timezone && event.location.timezone !== '-' && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">{event.location.timezone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded ${deviceColor} shadow-sm`}>
                              <DeviceIcon className="h-4 w-4" />
                            </div>
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{event.device.type}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{event.device.os} • {event.device.browser}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-900 dark:text-gray-100 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {event.ipAddress || '-'}
                            </div>
                            {event.location.isp && event.location.isp !== '-' && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{event.location.isp}</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Modern Pagination */}
          {!loading && totalPages > 1 && (
            <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-600">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-2xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <ChevronLeftIcon className="h-4 w-4 mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-2xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Next
                  <ChevronRightIcon className="h-4 w-4 ml-1" />
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center space-x-2">
                  <SparklesIcon className="h-4 w-4 text-indigo-500" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing <span className="font-semibold text-indigo-600 dark:text-indigo-400">{startIndex + 1}</span> to{' '}
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {Math.min(startIndex + itemsPerPage, filteredEvents.length)}
                    </span>{' '}
                    of <span className="font-semibold text-indigo-600 dark:text-indigo-400">{filteredEvents.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-2xl shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      <span className="ml-1 hidden sm:inline">Previous</span>
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={clsx(
                            'relative inline-flex items-center px-4 py-2 border text-sm font-semibold transition-all duration-200',
                            currentPage === page
                              ? 'z-10 bg-indigo-500 border-indigo-500 text-white shadow-sm'
                              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900'
                          )}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <span className="mr-1 hidden sm:inline">Next</span>
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Empty State */}
        {!loading && filteredEvents.length === 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-12 text-center">
            <div className="mx-auto w-24 h-24 mb-6 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full">
              <EyeIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">No click data found</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Create and use short URLs to see detailed analytics here. Try adjusting your filters or create your first short URL.
            </p>
            <button
              onClick={resetFilters}
              className="mt-6 inline-flex items-center space-x-2 px-6 py-3 bg-indigo-500 text-white rounded-xl font-medium shadow-sm"
            >
              <SparklesIcon className="h-4 w-4" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Export dengan dynamic import untuk menghindari hydration error
export const URLDetailedAnalytics = dynamic(
  () => Promise.resolve(URLDetailedAnalyticsComponent),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-8 mb-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }
);
