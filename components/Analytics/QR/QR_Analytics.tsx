"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  RefreshCcw, 
  TrendingUp, 
  BarChart3, 
  Users, 
  Smartphone,
  Globe,
  Calendar,
  Activity,
  Eye,
  MousePointer,
  Zap
} from 'lucide-react';
// qrAnalyticsService intentionally not imported; using direct fetch to /api/analytics/qr.

function getCount(item: any): number {
  return (typeof item === 'object' && item !== null) ? (item.count ?? item.scans ?? 0) : 0;
}

// Modern gradient color palette
const COLORS = [
  '#667eea', // Gradient blue
  '#764ba2', // Gradient purple
  '#f093fb', // Gradient pink
  '#f5576c', // Gradient red
  '#4facfe', // Gradient light blue
  '#43e97b', // Gradient green
  '#fa709a', // Gradient coral
  '#fee140'  // Gradient yellow
];

const GRADIENT_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
];

export const QRAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>({
    qrCodeCount: 0,
    totalScans: 0,
    activeQRCodes: 0,
    scansByDay: [],
    scansByDevice: [],
    scansByLocation: [],
    clicksByLocation: [],
    scansByOS: [],
    scansByIp: [],
    topQRCodes: [],
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchAnalytics = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/analytics/qr');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setAnalytics(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  const combinedLocations = (() => {
    const combined: Record<string, number> = {};
    (Array.isArray(analytics.scansByLocation) ? analytics.scansByLocation : []).forEach((loc: any) => {
      if (loc?.location) combined[loc.location] = (combined[loc.location] || 0) + getCount(loc);
    });
    (Array.isArray(analytics.clicksByLocation) ? analytics.clicksByLocation : []).forEach((loc: any) => {
      if (loc?.location) combined[loc.location] = (combined[loc.location] || 0) + getCount(loc);
    });
    return Object.entries(combined).map(([location, count]) => ({ location, count })).sort((a, b) => b.count - a.count);
  })();

  const totalQRCodes = analytics.qrCodeCount || 0;
  const totalScans = analytics.totalScans || 0;
  const scansByDay = analytics.scansByDay || [];
  const avgScansPerQR = totalQRCodes > 0 ? Math.round(totalScans / totalQRCodes) : 0;
  const avgDailyScans = scansByDay.length > 0 ? Math.round(scansByDay.reduce((s: number, d: any) => s + getCount(d), 0) / scansByDay.length) : 0;
  const peakDay = scansByDay.length > 0 ? scansByDay.reduce((m: any, d: any) => (getCount(d) > getCount(m) ? d : m), scansByDay[0]) : { date: new Date().toISOString(), count: 0 };
  let growthRate = 0;
  if (scansByDay.length >= 6) {
    const last3 = scansByDay.slice(-3).reduce((s: number, d: any) => s + getCount(d), 0) / 3;
    const prev3 = scansByDay.slice(-6, -3).reduce((s: number, d: any) => s + getCount(d), 0) / 3;
    if (prev3 > 0) growthRate = Math.round(((last3 - prev3) / prev3) * 100);
  }
  const scansByDevice = (analytics.scansByDevice || []).map((i: any) => ({ device: i.device ? i.device[0].toUpperCase() + i.device.slice(1) : 'Unknown', count: getCount(i) }));

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 mx-auto animate-spin rounded-full border-4 border-blue-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400" />
          <p className="mt-6 text-sm font-medium text-gray-700 dark:text-gray-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-blue-600 text-white"><BarChart3 className="h-8 w-8" /></div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100">QR Analytics Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-1">Real-time insights for your QR codes</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <Activity className="h-4 w-4" />
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
              <button onClick={fetchAnalytics} disabled={isRefreshing} className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                <RefreshCcw className={`h-5 w-5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg mb-8 text-sm">
            {error}
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
          {/* Total Scans */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-md bg-blue-600 text-white"><Eye className="h-5 w-5" /></div>
              <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${growthRate >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'}`}>{growthRate >= 0 ? '+' : ''}{growthRate}%</div>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{totalScans.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Total Scans</p>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">vs last week</p>
          </div>
          {/* Total QR Codes */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-md bg-green-600 text-white"><MousePointer className="h-5 w-5" /></div>
              <div className="px-2.5 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-[10px] font-medium">{analytics.activeQRCodes ?? 'N/A'} active</div>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{totalQRCodes.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">QR Codes</p>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Total created</p>
          </div>
          {/* Avg per QR */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-md bg-amber-500 text-white"><TrendingUp className="h-5 w-5" /></div>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{avgScansPerQR.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Avg per QR</p>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Engagement rate</p>
          </div>
          {/* Daily Average */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-md bg-purple-600 text-white"><Calendar className="h-5 w-5" /></div>
              <Activity className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{avgDailyScans.toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Daily Average</p>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Last 30 days</p>
          </div>
          {/* Inactive */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:px-6 sm:py-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-md bg-red-600 text-white"><Eye className="h-5 w-5" /></div>
              <div className="px-2.5 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full text-[10px] font-medium">Disabled</div>
            </div>
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{(analytics.inactiveQRCodes ?? 0).toLocaleString()}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Inactive QR</p>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Not active</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-blue-600 text-white"><TrendingUp className="h-5 w-5" /></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Scan Trends</h3>
              </div>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">30 Days</span>
            </div>
            <div className="h-72 sm:h-80">
              {scansByDay.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={scansByDay.map((d: any) => ({ ...d, count: getCount(d) }))}>
                    <defs>
                      <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.7} />
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tickFormatter={(d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} fontSize={12} stroke="#64748b" axisLine={false} tickLine={false} />
                    <YAxis fontSize={12} stroke="#64748b" axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [v, 'Scans']} labelFormatter={(d: string) => new Date(d).toLocaleDateString()} />
                    <Area dataKey="count" stroke="#667eea" strokeWidth={2} fill="url(#scanGradient)" dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-500 dark:text-gray-400">No scan data</div>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-md bg-purple-600 text-white"><Smartphone className="h-5 w-5" /></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Device Distribution</h3>
              </div>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">All Time</span>
            </div>
            <div className="h-72 sm:h-80 flex flex-col items-center justify-center">
              {scansByDevice.length ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={scansByDevice} cx="50%" cy="50%" outerRadius={80} dataKey="count" nameKey="device" labelLine={false} label={({ percent, device }: any) => `${device} ${(percent * 100).toFixed(0)}%`}>
                        {scansByDevice.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, 'Scans']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm">
                    {scansByDevice.map((d: any, i: number) => (
                      <div key={d.device} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-full">
                        <span style={{ backgroundColor: COLORS[i % COLORS.length] }} className="w-3 h-3 rounded-full" />
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{d.device}</span>
                        <span className="text-gray-500 dark:text-gray-400">({d.count})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-500 dark:text-gray-400">No device data</div>
              )}
            </div>
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-md bg-green-600 text-white"><Globe className="h-5 w-5" /></div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Locations</h3>
            </div>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">Combined Activity</span>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            <div className="h-72 sm:h-80 rounded-lg bg-gray-50 dark:bg-gray-900 p-4">
              {combinedLocations.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={combinedLocations.slice(0, 8)} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 10 }} barCategoryGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" fontSize={12} stroke="#64748b" axisLine={false} tickLine={false} />
                    <YAxis dataKey="location" type="category" width={100} fontSize={12} stroke="#64748b" axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: number) => [v, 'Activity']} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>{combinedLocations.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-500 dark:text-gray-400">No location data</div>
              )}
            </div>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {combinedLocations.slice(0, 12).map((l, idx) => (
                <div key={l.location} className="flex items-center justify-between gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-green-500 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-semibold">#{idx + 1}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{l.location}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Activity hotspot</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 flex-1 max-w-xs">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div className="h-2 bg-green-500" style={{ width: `${(l.count / (combinedLocations[0]?.count || 1)) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">{l.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* OS & IP */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3"><div className="p-2 rounded-md bg-orange-500 text-white"><Smartphone className="h-5 w-5" /></div><h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Operating System</h3></div>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">Platform</span>
            </div>
            <div className="h-72 sm:h-80">
              {analytics.scansByOS?.length ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={analytics.scansByOS.map((o: any) => ({ ...o, os: o.os || 'Unknown', count: getCount(o) }))} cx="50%" cy="50%" outerRadius={60} dataKey="count" nameKey="os" labelLine={false}>
                        {analytics.scansByOS.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, 'Scans']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 max-h-24 overflow-y-auto pr-1 text-xs">
                    {analytics.scansByOS.map((o: any, i: number) => (
                      <div key={o.os || i} className="flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <div className="flex items-center space-x-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="font-medium text-gray-800 dark:text-gray-200 text-xs">{o.os || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-1.5 bg-orange-500" style={{ width: `${(getCount(o) / (analytics.totalScans || 1)) * 100}%` }} /></div>
                          <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{getCount(o)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-500 dark:text-gray-400">No OS data</div>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6"><div className="flex items-center space-x-3"><div className="p-2 rounded-md bg-cyan-600 text-white"><Globe className="h-5 w-5" /></div><h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top IP Addresses</h3></div><span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">Scan Sources</span></div>
            <div className="h-80 space-y-2 overflow-y-auto pr-1 text-xs">
              {analytics.scansByIp?.length ? (
                analytics.scansByIp.slice(0, 12).map((ip: any, i: number) => (
                  <div key={ip.ip || i} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-semibold">#{i + 1}</div>
                      <div>
                        <p className="font-mono text-[11px] font-medium text-gray-900 dark:text-gray-100">{ip.ip || 'Unknown IP'}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 max-w-28 truncate">{ip.location || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-14 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-1.5 bg-cyan-600" style={{ width: `${(ip.count / (analytics.scansByIp[0]?.count || 1)) * 100}%` }} /></div>
                      <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{ip.count || 0}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-500 dark:text-gray-400">No IP data</div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-6"><div className="p-3 rounded-lg bg-indigo-600 text-white"><Activity className="h-5 w-5" /></div><h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Performance Insights</h3></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="rounded-lg p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between mb-4"><h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">Peak Performance</h4><TrendingUp className="h-5 w-5 text-blue-600" /></div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Best day: {new Date(peakDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">{getCount(peakDay).toLocaleString()}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Total scans</p>
            </div>
            <div className="rounded-lg p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between mb-4"><h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">Growth Trend</h4><Activity className="h-5 w-5 text-green-600" /></div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{growthRate >= 0 ? 'Positive' : 'Negative'} growth</p>
              <p className={`text-xl sm:text-2xl font-semibold ${growthRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{growthRate >= 0 ? '+' : ''}{Math.abs(growthRate)}%</p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">vs last week</p>
            </div>
            <div className="rounded-lg p-5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between mb-4"><h4 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">Top Platform</h4><Users className="h-5 w-5 text-purple-600" /></div>
              {scansByDevice.length ? (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{scansByDevice[0].device} users</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">{((scansByDevice[0].count / (totalScans || 1)) * 100).toFixed(0)}%</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Main audience</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">No data</p>
                  <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">0%</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Start scanning</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
