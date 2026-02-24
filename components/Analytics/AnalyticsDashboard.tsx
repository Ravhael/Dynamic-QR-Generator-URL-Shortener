import React, { useState, useEffect } from 'react';
import Image from "next/image"
import {
  ChartBarIcon,
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  MapPinIcon,
  ComputerDesktopIcon,
  EyeIcon,
  QrCodeIcon,
  LinkIcon,
  CalendarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import analyticsService from '../../lib/api/analyticsService';

// Enhanced interfaces for precise analytics
interface DeviceInfo {
  type: 'mobile' | 'desktop' | 'tablet' | 'smart-tv' | 'unknown';
  brand: string;
  model: string;
  screenResolution?: string;
  userAgent?: string;
}

interface LocationInfo {
  ip: string;
  country: string;
  countryCode: string;
  region?: string;
  city: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  org?: string;
  as?: string;
}

interface OperatingSystem {
  name: string;
  version: string;
  platform?: string;
  architecture?: string;
}

interface BrowserInfo {
  name: string;
  version: string;
  engine?: string;
}

interface ScanEvent {
  id: string;
  qrId?: string;
  urlId?: string;
  type: 'qr' | 'url';
  timestamp: string;
  device: DeviceInfo;
  location: LocationInfo;
  os: OperatingSystem;
  browser: BrowserInfo;
  referrer?: string;
  sessionId: string;
  duration?: number;
  exitUrl?: string;
}

interface AnalyticsStats {
  totalScans: number;
  uniqueVisitors: number;
  uniqueIPs: number;
  topCountries: Array<{ country: string; countryCode: string; count: number; percentage: number }>;
  topCities: Array<{ city: string; country: string; count: number; percentage: number }>;
  topDevices: Array<{ device: string; count: number; percentage: number }>;
  topOperatingSystems: Array<{ os: string; version: string; count: number; percentage: number }>;
  topBrowsers: Array<{ browser: string; version: string; count: number; percentage: number }>;
  scansByHour: Array<{ hour: number; count: number }>;
  scansByDate: Array<{ date: string; qrScans: number; urlClicks: number }>;
  averageSessionDuration: number;
  bounceRate: number;
}

const AnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsStats | null>(null);
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [selectedMetric, setSelectedMetric] = useState<'all' | 'qr' | 'url'>('all');

  useEffect(() => {
    fetchAnalyticsData();
    fetchRecentScans();
  }, [timeRange, selectedMetric]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Create params object based on timeRange
      const params = {
        days: timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : undefined
      };
      const data = await analyticsService.getSummary(params);
      if (data) {
        // Transform data to match AnalyticsStats interface
        const transformedData: AnalyticsStats = {
          totalScans: data.totalScans || 0,
          uniqueVisitors: 0, // Not available in AnalyticsSummary
          uniqueIPs: 0, // Not available in AnalyticsSummary  
          topCountries: [], // Not available in AnalyticsSummary
          topCities: [], // Not available in AnalyticsSummary
          topDevices: data.scansByDevice?.map(d => ({ 
            device: d.device, 
            count: d.count, 
            percentage: 0 
          })) || [],
          topOperatingSystems: [], // Not available in AnalyticsSummary
          topBrowsers: [], // Not available in AnalyticsSummary
          scansByHour: [], // Not available in AnalyticsSummary
          scansByDate: data.scansByDay?.map(d => ({ 
            date: d.date, 
            qrScans: d.count, 
            urlClicks: 0 
          })) || [],
          averageSessionDuration: 0, // Not available in AnalyticsSummary
          bounceRate: 0 // Not available in AnalyticsSummary
        };
        setAnalyticsData(transformedData);
      } else {
        // Fallback to empty data structure if API fails
        setAnalyticsData({
          totalScans: 0,
          uniqueVisitors: 0,
          uniqueIPs: 0,
          topCountries: [],
          topCities: [],
          topDevices: [],
          topOperatingSystems: [],
          topBrowsers: [],
          scansByHour: [],
          scansByDate: [],
          averageSessionDuration: 0,
          bounceRate: 0
        });
      }
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentScans = async () => {
    try {
      const data = await analyticsService.getRecentActivity(20);
      // Transform the activity data to match ScanEvent interface
      const transformedScans: ScanEvent[] = data.activity.map(event => {
        const isDetailedScanEvent = 'type' in event; // Differentiate event types
        return {
          id: 'id' in event ? String(event.id) : Math.random().toString(),
          type: isDetailedScanEvent ? 'qr' : 'url',
          timestamp: 'timestamp' in event ? String(event.timestamp) : new Date().toISOString(),
          device: typeof event.device === 'object' && event.device ? {
            type: event.device.type || 'desktop',
            brand: 'Unknown',
            model: 'Unknown',
            screenResolution: 'Unknown',
            userAgent: String('userAgent' in event ? event.userAgent : 'Unknown')
          } : { type: 'desktop', brand: 'Unknown', model: 'Unknown', screenResolution: 'Unknown', userAgent: 'Unknown' },
          location: typeof event.location === 'object' && event.location ? {
            ip: String('ipAddress' in event ? event.ipAddress : '0.0.0.0'),
            country: event.location.country || 'Unknown',
            countryCode: 'XX',
            city: event.location.city || 'Unknown'
          } : { ip: '0.0.0.0', country: 'Unknown', countryCode: 'XX', city: 'Unknown' },
          os: typeof event.device === 'object' && event.device ? {
            name: event.device.os || 'Unknown',
            version: 'Unknown'
          } : { name: 'Unknown', version: 'Unknown' },
          browser: typeof event.device === 'object' && event.device ? {
            name: event.device.browser || 'Unknown', 
            version: 'Unknown'
          } : { name: 'Unknown', version: 'Unknown' },
          sessionId: Math.random().toString()
        };
      });
      setScanEvents(transformedScans);
    } catch (err) {
      console.error('Error fetching recent scans:', err);
      setScanEvents([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAnalyticsData(), fetchRecentScans()]);
    setRefreshing(false);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getCountryFlag = (countryCode: string): string => {
    return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <DevicePhoneMobileIcon className="w-5 h-5" />;
      case 'desktop':
        return <ComputerDesktopIcon className="w-5 h-5" />;
      default:
        return <DevicePhoneMobileIcon className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading analytics data...</span>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Failed to load analytics data</div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time data from your QR codes and short URLs</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Activities</option>
            <option value="qr">QR Scans Only</option>
            <option value="url">URL Clicks Only</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 ${
              refreshing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Scans</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.totalScans)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <EyeIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unique Visitors</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(analyticsData.uniqueVisitors)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DevicePhoneMobileIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Session</p>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(analyticsData.averageSessionDuration)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bounce Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.bounceRate}%</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowTrendingDownIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scans by Date */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scans Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.scansByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="qrScans"
                  stackId="1"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  name="QR Scans"
                />
                <Area
                  type="monotone"
                  dataKey="urlClicks"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  name="URL Clicks"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Countries */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries</h3>
          <div className="space-y-3">
            {analyticsData.topCountries.slice(0, 8).map((country, index) => (
              <div key={country.countryCode} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-4">{index + 1}</span>
                  <img
                    src={getCountryFlag(country.countryCode)}
                    alt={country.country}
                    className="w-6 h-4"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900">{country.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{country.count}</span>
                  <span className="text-xs text-gray-500">({country.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Device and Browser Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Devices */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Devices</h3>
          <div className="space-y-3">
            {analyticsData.topDevices.slice(0, 6).map((device, index) => (
              <div key={device.device} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-4">{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900">{device.device}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{device.count}</span>
                  <span className="text-xs text-gray-500">({device.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Operating Systems */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Systems</h3>
          <div className="space-y-3">
            {analyticsData.topOperatingSystems.slice(0, 6).map((os, index) => (
              <div key={`${os.os}-${os.version}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-4">{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900">{os.os} {os.version}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{os.count}</span>
                  <span className="text-xs text-gray-500">({os.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Browsers */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Browsers</h3>
          <div className="space-y-3">
            {analyticsData.topBrowsers.slice(0, 6).map((browser, index) => (
              <div key={`${browser.browser}-${browser.version}`} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-4">{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900">{browser.browser}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{browser.count}</span>
                  <span className="text-xs text-gray-500">({browser.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Scan Events */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Scan Events</h3>
          <p className="text-sm text-gray-600">Live tracking of your QR codes and short URLs</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OS & Browser
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scanEvents.slice(0, 10).map((event, idx) => (
                <tr key={`${event.id ?? 'scan'}-${idx}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {event.type === 'qr' ? (
                        <QrCodeIcon className="w-5 h-5 text-blue-600 mr-2" />
                      ) : (
                        <LinkIcon className="w-5 h-5 text-green-600 mr-2" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {event.type === 'qr' ? 'QR Scan' : 'URL Click'}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {event.qrId || event.urlId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getDeviceIcon(event.device.type)}
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900">
                          {event.device.brand} {event.device.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.device.screenResolution || 'Unknown Resolution'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={getCountryFlag(event.location.countryCode)}
                        alt={event.location.country}
                        className="w-5 h-3 mr-2"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {event.location.city}, {event.location.country}
                        </div>
                        <div className="text-sm text-gray-500">
                          {event.location.ip}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {event.os.name} {event.os.version}
                      </div>
                      <div className="text-sm text-gray-500">
                        {event.browser.name} {event.browser.version}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;