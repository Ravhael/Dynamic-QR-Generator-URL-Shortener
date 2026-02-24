"use client";

import React, { useState, useEffect } from 'react';
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
// qrAnalyticsService not used directly; using fetch endpoints
import type { DetailedScanEvent, DetailedClickEvent } from '@/lib/api/qrAnalyticsTypes';

interface DetailedAnalyticsProps {
  type?: 'qr' | 'url';
}

export const QRDetailedAnalytics: React.FC<DetailedAnalyticsProps> = ({ type = 'qr' }) => {
  // States untuk data
  const [scanEvents, setScanEvents] = useState<DetailedScanEvent[]>([]);
  const [clickEvents, setClickEvents] = useState<DetailedClickEvent[]>([]);
  const [allQRCodes, setAllQRCodes] = useState<any[]>([]); // ALL QR codes from API
  const [summary, setSummary] = useState<any>(null); // REAL summary data from API
  const [filterOptions, setFilterOptions] = useState<{
    [x: string]: string[];
    categories: string[];
    devices: string[];
    countries: string[];
  }>({ categories: [], devices: [], countries: [] }); // DYNAMIC filter options
  // Filter states
  const [selectedQRCode, setSelectedQRCode] = useState<string>('all');
  const [selectedURL, setSelectedURL] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [selectedCitys, setSelectedCitys] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');
  // Sort & pagination
  const [sortBy, setSortBy] = useState<'date' | 'qrcode' | 'url' | 'location' | 'device'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [loading, setLoading] = useState(false);

  // Fetch data dari database real
  const fetchData = async () => {
    setLoading(true);
    try {
      if (type === 'qr') {
        // Parallel fetch: detailed + main analytics
        const [detailedRes, analyticsRes] = await Promise.all([
          fetch('/api/qr-analytics/detailed-scans'),
          fetch('/api/analytics/qr')
        ]);

        let detailedData: any = null;
        let analyticsData: any = null;

        if (detailedRes.ok) detailedData = await detailedRes.json();
        if (analyticsRes.ok) analyticsData = await analyticsRes.json();

        if (detailedData && detailedData.detailedScans) {
          const realScanEvents: DetailedScanEvent[] = detailedData.detailedScans.map((scan: any) => ({
            id: scan.id,
            qrCodeId: scan.qrCodeId,
            qrCodeName: scan.qrName || 'Untitled QR',
            qrCodeType: scan.qrType || 'url',
            qrCodeCategory: scan.qrCategory || 'Uncategorized',
            qrCodeUrl: scan.qrContent || '',
            scannedAt: scan.scannedAt,
            ipAddress: scan.location?.ipAddress || 'Unknown',
            location: {
              country: scan.location?.country || 'Unknown',
              city: scan.location?.city || 'Unknown',
              region: undefined,
              timezone: undefined,
              latitude: undefined,
              longitude: undefined,
              isp: undefined
            },
            device: {
              type: (scan.device?.type || 'desktop') as 'mobile' | 'desktop' | 'tablet',
              os: scan.device?.os || 'Unknown',
              browser: scan.device?.browser || 'Unknown'
            }
          }));
          setScanEvents(realScanEvents);

          if (Array.isArray(detailedData.allQRCodes)) {
            setAllQRCodes(detailedData.allQRCodes);
          }
          if (detailedData.filterOptions) setFilterOptions(detailedData.filterOptions);
        } else {
          setScanEvents([]);
          setAllQRCodes([]);
        }

        // Unified summary: prefer detailed summary for scan metrics, but always take totalCreated from analytics main endpoint
        const unifiedSummary = (() => {
          const detailedSummary = detailedData?.summary || {};
          const mainTotal = analyticsData?.qrCodeCount;
          return {
            totalScans: detailedSummary.totalScans ?? detailedSummary.total_scans ?? 0,
            uniqueQRCodes: detailedSummary.uniqueQRCodes ?? detailedSummary.unique_qr_codes ?? 0,
            totalCreated: mainTotal ?? detailedSummary.totalCreated ?? detailedSummary.totalQRCodes ?? (detailedData?.allQRCodes?.length || 0),
            totalQRCodes: mainTotal ?? detailedSummary.totalQRCodes ?? (detailedData?.allQRCodes?.length || 0),
            scannedQRCodes: detailedSummary.scannedQRCodes ?? detailedSummary.unique_qr_codes ?? 0,
            neverScanned: (() => {
              const created = mainTotal ?? detailedSummary.totalCreated ?? 0;
              const scanned = detailedSummary.scannedQRCodes ?? detailedSummary.unique_qr_codes ?? 0;
              return created - scanned;
            })(),
            uniqueVisitors: detailedSummary.uniqueVisitors ?? detailedSummary.unique_visitors ?? 0,
            scanDays: detailedSummary.scanDays ?? detailedSummary.scan_days ?? 0
          };
        })();
        setSummary(unifiedSummary);
      } else {
        setClickEvents([]);
      }
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
      setScanEvents([]);
      setAllQRCodes([]);
      setFilterOptions({ categories: [], devices: [], countries: [] });
      setClickEvents([]);
    }
    setLoading(false);
    setCurrentPage(1);
  };

  // Setiap filter berubah → fetch ulang
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [type, selectedQRCode, selectedURL, dateRange]);

  // Apply filtering & sorting frontend (karena user bisa ganti filter lain tanpa refetch, misal device/category/Citys)
  const filterAndSort = () => {
    let data: (DetailedScanEvent | DetailedClickEvent)[] = type === 'qr' ? scanEvents : clickEvents;
    
    // Filter by Date Range
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      data = data.filter(ev => {
        const eventDate = new Date(type === 'qr' ? (ev as DetailedScanEvent).scannedAt : (ev as DetailedClickEvent).clickedAt);
        return eventDate >= cutoffDate;
      });
    }
    
    // Filter by specific QR Code
    if (selectedQRCode !== 'all') {
      data = data.filter(ev =>
        type === 'qr' ? (ev as DetailedScanEvent).qrCodeId === selectedQRCode : true
      );
    }
    
    // Filter kategori, device, Citys
    if (selectedCategory !== 'all') {
      data = data.filter(ev =>
        type === 'qr'
          ? (ev as DetailedScanEvent).qrCodeCategory === selectedCategory
          : (ev as DetailedClickEvent).urlCategory === selectedCategory
      );
    }
    if (selectedDevice !== 'all') {
      data = data.filter(ev =>
        ev.device.type === selectedDevice
      );
    }
    if (selectedCitys !== 'all') {
      const sel = selectedCitys.toLowerCase();
      data = data.filter(ev => ev.location.city?.toLowerCase() === sel);
    }
    // Sorting
    data = data.sort((a, b) => {
      let aVal: any, bVal: any;
      if (sortBy === 'date') {
        aVal = type === 'qr' ? (a as DetailedScanEvent).scannedAt : (a as DetailedClickEvent).clickedAt;
        bVal = type === 'qr' ? (b as DetailedScanEvent).scannedAt : (b as DetailedClickEvent).clickedAt;
      } else if (sortBy === 'qrcode') {
        aVal = (a as DetailedScanEvent).qrCodeName?.toLowerCase?.() || '';
        bVal = (b as DetailedScanEvent).qrCodeName?.toLowerCase?.() || '';
      } else if (sortBy === 'url') {
        aVal = (a as DetailedClickEvent).urlTitle?.toLowerCase?.() || '';
        bVal = (b as DetailedClickEvent).urlTitle?.toLowerCase?.() || '';
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

  const filteredEvents = filterAndSort();
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage);

  // Get unique values for filters - NOW USING ALL QR CODES (not just those with scan events)
  const uniqueQRCodes = type === 'qr'
    ? // deduplicate by id in case API returns duplicates
      Array.from(new Map(allQRCodes.map((qr: any) => [qr.id, { id: qr.id, name: qr.name }])).values())
    : [];
  const uniqueURLs = type === 'url'
    ? Array.from(new Map(clickEvents.map(ev => [ev.urlId, (ev as DetailedClickEvent).urlTitle])).entries())
      .map(([id, title]) => ({ id, title }))
    : [];
  // Use DYNAMIC categories from API instead of local scan events
  const uniqueCategories = type === 'qr' ? filterOptions.categories : 
    Array.from(new Set(clickEvents.map(ev => (ev as DetailedClickEvent).urlCategory).filter(Boolean)));
  // Use DYNAMIC devices from API instead of local scan events
  const uniqueDevices = type === 'qr' ? filterOptions.devices :
    Array.from(new Set(clickEvents.map(ev => ev.device.type).filter(Boolean)));
  // Use DYNAMIC countries from API instead of local scan events
  const uniqueCitys = (filterOptions.cities || filterOptions.countries || [])
    .filter(c => !!c)
    .map(c => c.charAt(0).toUpperCase() + c.slice(1));

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
    setSelectedQRCode('all');
    setSelectedURL('all');
    setSelectedCategory('all');
    setSelectedDevice('all');
    setSelectedCitys('all');
    setDateRange('7d');
    setSortBy('date');
    setSortOrder('desc');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-indigo-600 text-white"><MagnifyingGlassIcon className="h-8 w-8" /></div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100">{type === 'qr' ? 'QR Code' : 'URL'} Detailed Analytics</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Complete {type === 'qr' ? 'scan' : 'click'} data with filtering and sorting</p>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <SparklesIcon className="h-4 w-4 mr-2" />
              Showing {filteredEvents.length.toLocaleString()} of {(type === 'qr' ? scanEvents : clickEvents).length.toLocaleString()} {type === 'qr' ? 'scans' : 'clicks'}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Scans / Clicks */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2.5 rounded-md bg-blue-600 text-white"><EyeIcon className="h-5 w-5" /></div>
              <ShareIcon className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{summary ? summary.totalScans.toLocaleString() : filteredEvents.length.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total {type === 'qr' ? 'Scans' : 'Clicks'}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{summary ? 'Database total' : 'Filtered results'}</p>
          </div>
          {/* Total Created */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="p-2.5 rounded-md bg-green-600 text-white">{type === 'qr' ? <QrCodeIcon className="h-5 w-5" /> : <GlobeAltIcon className="h-5 w-5" />}</div>
              <ClockIcon className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{(() => { if (summary) { const totalCreated = summary.totalCreated ?? summary.totalQRCodes ?? 0; return totalCreated === 0 && allQRCodes?.length > 0 ? allQRCodes.length : totalCreated; } return type === 'qr' ? (allQRCodes?.length || new Set(filteredEvents.map(e => (e as DetailedScanEvent).qrCodeId)).size) : new Set(filteredEvents.map(e => (e as DetailedClickEvent).urlId)).size; })()}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total {type === 'qr' ? 'QR Codes' : 'URLs'}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{summary ? 'All created' : 'Fallback'}</p>
          </div>
          {/* Cities */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2 sm:mb-3"><div className="p-2.5 rounded-md bg-amber-500 text-white"><MapPinIcon className="h-5 w-5" /></div><GlobeAltIcon className="h-4 w-4 text-amber-500" /></div>
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{new Set(scanEvents.map(e => e.location.city)).size}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Cities</p>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Total reach</p>
          </div>
            {/* Daily Average */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2 sm:mb-3"><div className="p-2.5 rounded-md bg-purple-600 text-white"><CalendarIcon className="h-5 w-5" /></div><DevicePhoneMobileIcon className="h-4 w-4 text-purple-600" /></div>
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{summary ? Math.round(summary.totalScans / Math.max(1, summary.scanDays || 7)) : Math.round(filteredEvents.length / Math.max(1, dateRange === 'all' ? 7 : parseInt(dateRange)))}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Daily Average</p>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{summary ? 'Total activity' : 'Per day activity'}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3"><div className="p-2 rounded-md bg-indigo-600 text-white"><FunnelIcon className="h-5 w-5" /></div><h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters & Sorting</h3></div>
            <button onClick={resetFilters} className="px-4 py-2 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Reset</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center"><CalendarIcon className="h-4 w-4 mr-1 text-indigo-600" />Date Range</label>
              <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="1d">Last 24 hours</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="all">All time</option>
              </select>
            </div>
            {type === 'qr' ? (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center"><QrCodeIcon className="h-4 w-4 mr-1 text-green-600" />QR Code</label>
                <select value={selectedQRCode} onChange={e => setSelectedQRCode(e.target.value)} className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="all">All QR Codes</option>
                  {uniqueQRCodes.map(qr => <option key={qr.id} value={qr.id}>{qr.name}</option>)}
                </select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center"><GlobeAltIcon className="h-4 w-4 mr-1 text-green-600" />Short URL</label>
                <select value={selectedURL} onChange={e => setSelectedURL(e.target.value)} className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="all">All URLs</option>
                  {uniqueURLs.map(url => <option key={url.id} value={url.id}>{url.title}</option>)}
                </select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center"><ShareIcon className="h-4 w-4 mr-1 text-blue-600" />Category</label>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center"><DevicePhoneMobileIcon className="h-4 w-4 mr-1 text-purple-600" />Device</label>
              <select value={selectedDevice} onChange={e => setSelectedDevice(e.target.value)} className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All Devices</option><option value="mobile">Mobile</option><option value="desktop">Desktop</option><option value="tablet">Tablet</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center"><MapPinIcon className="h-4 w-4 mr-1 text-amber-500" />City</label>
              <select value={selectedCitys} onChange={e => setSelectedCitys(e.target.value)} className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="all">All Cities</option>
                {uniqueCitys.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center"><ArrowsUpDownIcon className="h-4 w-4 mr-1 text-red-600" />Sort</label>
              <div className="flex">
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="flex-1 px-3 py-2.5 text-xs sm:text-sm rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="date">Date</option>{type === 'qr' ? <option value="qrcode">QR Code</option> : <option value="url">URL</option>}<option value="location">Location</option><option value="device">Device</option>
                </select>
                <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`} className={`px-3 py-2.5 text-xs sm:text-sm border border-l-0 rounded-r-md transition-colors ${sortOrder === 'desc' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'} hover:bg-indigo-200 dark:hover:bg-indigo-800/60`}>
                  <ArrowsUpDownIcon className={`h-4 w-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="h-16 w-16 mx-auto animate-spin rounded-full border-4 border-indigo-200 dark:border-gray-600 border-t-indigo-600 dark:border-t-indigo-400" />
              <p className="mt-6 text-sm font-medium text-gray-700 dark:text-gray-300">Loading detailed data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/60 border-b border-gray-200 dark:border-gray-600">
                  <tr className="text-[11px] uppercase tracking-wide text-gray-600 dark:text-gray-300">
                    <th className="px-6 py-3 text-left font-semibold">{type === 'qr' ? 'QR Code' : 'Short URL'}</th>
                    <th className="px-6 py-3 text-left font-semibold">{type === 'qr' ? 'Type & Cat.' : 'Category'}</th>
                    <th className="px-6 py-3 text-left font-semibold">{type === 'qr' ? 'URL/Content' : 'Original URL'}</th>
                    <th className="px-6 py-3 text-left font-semibold">{type === 'qr' ? 'Scan Time' : 'Click Time'}</th>
                    <th className="px-6 py-3 text-left font-semibold">Location</th>
                    <th className="px-6 py-3 text-left font-semibold">Device</th>
                    <th className="px-6 py-3 text-left font-semibold">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedEvents.map((event: DetailedScanEvent | DetailedClickEvent, idx: number) => {
                    const DeviceIcon = getDeviceIcon(event.device.type);
                    const deviceColor = getDeviceColor(event.device.type);
                    const isQREvent = type === 'qr';
                    const qrEvent = event as DetailedScanEvent;
                    const clickEvent = event as DetailedClickEvent;
                    return (
                      <tr key={`${(event as any).id ?? 'evt'}-${startIndex + idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap text-gray-900 dark:text-gray-100 font-medium">{isQREvent ? qrEvent.qrCodeName : clickEvent.urlTitle}</td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          {isQREvent ? (
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-medium capitalize">{qrEvent.qrCodeType}</span>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">{qrEvent.qrCodeCategory}</div>
                            </div>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[11px] font-medium">{clickEvent.urlCategory}</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="max-w-xs truncate font-mono text-[11px] bg-gray-100 dark:bg-gray-700/70 px-2 py-1 rounded" title={isQREvent ? qrEvent.qrCodeUrl : clickEvent.originalUrl}>{isQREvent ? qrEvent.qrCodeUrl : clickEvent.originalUrl}</div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-[11px]">
                          {isQREvent ? (
                            <div className="space-y-0.5">
                              <div className="font-medium text-gray-900 dark:text-gray-100">{format(qrEvent.scannedAt, 'MMM dd, yyyy')}</div>
                              <div className="text-gray-500 dark:text-gray-400 font-mono">{format(qrEvent.scannedAt, 'HH:mm:ss')}</div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <div className="font-medium text-gray-900 dark:text-gray-100">{format(clickEvent.clickedAt, 'MMM dd, yyyy')}</div>
                              <div className="text-gray-500 dark:text-gray-400 font-mono">{format(clickEvent.clickedAt, 'HH:mm:ss')}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-[11px]">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1 font-medium text-gray-900 dark:text-gray-100"><MapPinIcon className="h-3 w-3 text-amber-500" /><span>{event.location.city}</span></div>
                            <div className="text-gray-500 dark:text-gray-400">{event.location.country}{event.location.region && event.location.region !== '-' ? ` • ${event.location.region}` : ''}</div>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-[11px]">
                          <div className="flex items-center space-x-2">
                            <span className={`p-1.5 rounded-lg ${deviceColor}`}><DeviceIcon className="h-3.5 w-3.5" /></span>
                            <div className="space-y-0.5">
                              <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">{event.device.type}</div>
                              <div className="text-gray-500 dark:text-gray-400">{event.device.os} • {event.device.browser}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-[11px]">
                          <div className="font-mono bg-gray-100 dark:bg-gray-700/70 px-2 py-1 rounded text-gray-800 dark:text-gray-100">{event.ipAddress || '-'}</div>
                          {event.location.isp && event.location.isp !== '-' && <div className="text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[8rem]">{event.location.isp}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!loading && totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/60">
              <div className="flex-1 flex justify-between sm:hidden">
                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-4 py-2 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50">Prev</button>
                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-50">Next</button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <p className="text-xs text-gray-600 dark:text-gray-400">Showing <span className="font-semibold text-gray-900 dark:text-gray-200">{startIndex + 1}</span>-<span className="font-semibold text-gray-900 dark:text-gray-200">{Math.min(startIndex + itemsPerPage, filteredEvents.length)}</span> of <span className="font-semibold text-gray-900 dark:text-gray-200">{filteredEvents.length}</span></p>
                <nav className="inline-flex rounded-md shadow-sm">
                  <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50">Prev</button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => { const page = i + 1; return (<button key={page} onClick={() => setCurrentPage(page)} className={clsx('px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300', currentPage === page && 'bg-indigo-600 dark:bg-indigo-600 text-white')}>{page}</button>); })}
                  <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-r-md bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50">Next</button>
                </nav>
              </div>
            </div>
          )}
        </div>

        {!loading && filteredEvents.length === 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-10 text-center shadow-sm">
            <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-6"><EyeIcon className="h-10 w-10 text-gray-400" /></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No {type === 'qr' ? 'scan' : 'click'} data</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">{type === 'qr' ? 'Create and scan QR codes to see analytics here. Adjust filters or create your first QR code.' : 'Create and use short URLs to see analytics here. Adjust filters or create your first short URL.'}</p>
            <button onClick={resetFilters} className="inline-flex items-center px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors"><SparklesIcon className="h-4 w-4 mr-2" />Reset Filters</button>
          </div>
        )}
      </div>
    </div>
  );
};
