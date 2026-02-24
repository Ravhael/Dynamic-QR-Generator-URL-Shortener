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
  Zap,
  Link
} from 'lucide-react';
// qrAnalyticsService not imported; using direct fetch to /api/analytics/url.

function getCount(item: any): number {
  return (typeof item === 'object' && item !== null) ? (item.count ?? item.clicks ?? 0) : 0;
}

// Flat color palette for charts
const COLORS = [
  '#2563eb', // blue
  '#7c3aed', // violet
  '#db2777', // pink
  '#dc2626', // red
  '#0ea5e9', // light blue
  '#059669', // green
  '#d97706', // amber
  '#ca8a04'  // yellow
];

export const URLAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>({
    totalUrls: 0,
    totalClicks: 0,
    totalScans: 0,
    activeUrls: 0,
    clicksOverTime: [],
    topUrls: [],
    clicksByDevice: [],
    clicksByLocation: [],
    clicksByOS: [],
    clicksByIp: [],
    avgClicksPerUrl: 0,
    dailyAverage: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchAnalytics = async () => {
    try {
      setIsRefreshing(true);
      // Use the dedicated URL analytics API
      const response = await fetch('/api/analytics/url', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.warn('📊 [URL Analytics] Data received from URL analytics API:', data);
      
      // Set analytics data directly since it matches the expected format
      setAnalytics(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('❌ [URL Analytics] Error:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

    useEffect(() => {
        fetchAnalytics();
        // DISABLED: Auto-refresh to prevent excessive requests
        // const interval = setInterval(fetchAnalytics, 30000);
        // return () => clearInterval(interval);
    }, []);

  // Metrics calculations
  const totalUrls = analytics.totalUrls || 0;
  const totalClicks = analytics.totalClicks || 0;
  const totalScans = analytics.totalScans || totalClicks;
  const clicksOverTime = analytics.clicksOverTime || [];
  const avgClicksPerUrl = analytics.avgClicksPerUrl || 0;
  const dailyAverage = analytics.dailyAverage || 0;
  
  // Growth rate calculation
  let growthRate = 0;
  if (clicksOverTime.length >= 6) {
    const last3 = clicksOverTime.slice(-3).reduce((sum: number, d: any) => sum + getCount(d), 0) / 3;
    const prev3 = clicksOverTime.slice(-6, -3).reduce((sum: number, d: any) => sum + getCount(d), 0) / 3;
    if (prev3 > 0) growthRate = Math.round((last3 - prev3) / prev3 * 100);
  }

  const clicksByDevice = (analytics.clicksByDevice || []).map((item: any) => ({
    device: item.device ? item.device.charAt(0).toUpperCase() + item.device.slice(1) : 'Unknown',
    count: getCount(item)
  }));

  // Peak day calculation
  const peakDay = clicksOverTime.length > 0 
    ? clicksOverTime.reduce((peak: any, current: any) => 
        getCount(current) > getCount(peak) ? current : peak
      ) 
    : null;

  // Process combined locations data
  const combinedLocations = (analytics.clicksByLocation || []).map((item: any) => ({
    location: item.location || item.country || 'Unknown',
    count: getCount(item)
  })).sort((a: any, b: any) => b.count - a.count);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center space-y-3">
          <div className="h-10 w-10 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading URL analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                <Link className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">URL Analytics</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Real-time insights for your short URLs</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Activity className="h-4 w-4 mr-1" />
                <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              </div>
              <button
                onClick={fetchAnalytics}
                disabled={isRefreshing}
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors"
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                <MousePointer className="h-5 w-5" />
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${growthRate >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>{growthRate >= 0 ? '+' : ''}{growthRate}%</span>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{totalClicks.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Clicks</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300">
                <Link className="h-5 w-5" />
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">{analytics.activeUrls ?? '0'} active</span>
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{totalUrls.toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Short URLs</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300">
                <TrendingUp className="h-5 w-5" />
              </div>
              <Zap className="h-4 w-4 text-amber-500 dark:text-amber-400" />
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{Math.round(avgClicksPerUrl).toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Avg / URL</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                <Calendar className="h-5 w-5" />
              </div>
              <Activity className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{Math.round(dailyAverage).toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Daily Avg</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 rounded-md bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300">
                <Eye className="h-5 w-5" />
              </div>
              <TrendingUp className="h-4 w-4 text-rose-500 dark:text-rose-400" />
            </div>
            <p className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">{analytics.topUrls && analytics.topUrls.length > 0 ? getCount(analytics.topUrls[0]).toLocaleString() : '0'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Top URL</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Clicks Over Time</h3>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">30d</span>
            </div>
            <div className="h-80">
              {clicksOverTime && clicksOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={clicksOverTime.map((d: any) => ({
                    ...d,
                    count: getCount(d)
                  }))}>
                    <defs>
                      <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      stroke="#64748b"
                      fontSize={12}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={12} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      formatter={(value: number) => [value, 'Clicks']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        backdropFilter: 'blur(10px)',
                        color: '#374151'
                      }}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#667eea" 
                      strokeWidth={3}
                      fill="url(#clicksGradient)"
                      dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#667eea', strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">No click data yet</div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Smartphone className="h-4 w-4" /> Device Distribution</h3>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">All</span>
            </div>
            <div className="h-80 flex flex-col items-center justify-center">
              {clicksByDevice && clicksByDevice.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={clicksByDevice}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ percent, device }: any) => `${device} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="device"
                      >
                        {clicksByDevice.map((_: any, _index: number) => (
                          <Cell key={`cell-${_index}`} fill={COLORS[_index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [value, 'Clicks']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '16px',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          backdropFilter: 'blur(10px)',
                          color: '#374151'
                        }}
                        labelStyle={{ color: '#374151' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-4 text-sm">
                    {clicksByDevice.map((entry: any, _idx: number) => (
                      <div key={entry.device} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-full">
                        <span 
                          style={{ backgroundColor: COLORS[_idx % COLORS.length] }} 
                          className="inline-block w-3 h-3 rounded-full shadow-sm"
                        ></span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{entry.device}</span>
                        <span className="text-gray-500 dark:text-gray-400">({entry.count})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">No device data</div>
              )}
            </div>
          </div>
        </div>

        {/* Top Performing URLs */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Top URLs</h3>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Top 5</span>
          </div>
          
          <div className="space-y-4">
            {(analytics.topUrls || []).slice(0, 5).map((url: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-semibold text-xs">
                      #{index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-tight">
                      {url.title || 'Untitled URL'}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                      {url.shortUrl || url.short_url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right leading-tight">
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {getCount(url).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">clicks</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Analytics */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Globe className="h-4 w-4" /> Locations</h3>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Top regions</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Location Chart */}
            <div className="h-80">
              {combinedLocations && combinedLocations.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={combinedLocations.slice(0, 8)}
                    layout="vertical"
                    margin={{ top: 10, right: 40, left: 100, bottom: 10 }}
                    barCategoryGap={8}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                    <XAxis type="number" fontSize={12} stroke="#059669" axisLine={false} tickLine={false} />
                    <YAxis 
                      dataKey="location" 
                      type="category" 
                      width={120} 
                      fontSize={12} 
                      stroke="#059669"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Total Activity']}
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        backdropFilter: 'blur(10px)',
                        color: '#374151'
                      }}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                      {combinedLocations.slice(0, 8).map((_: any, _idx: number) => (
                        <Cell key={`cell-${_idx}`} fill={COLORS[_idx % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">No location data</div>
              )}
            </div>

            {/* Location List */}
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">Regional Activity</h4>
              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {combinedLocations.slice(0, 12).map((locationData: any, index: number) => (
                  <div key={locationData.location} className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-emerald-600 rounded-md flex items-center justify-center text-white text-[10px] font-medium">#{index + 1}</div>
                      <div>
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight">{locationData.location}</span>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">activity</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded h-2 overflow-hidden">
                        <div className="bg-emerald-500 h-2" style={{ width: `${(locationData.count / (combinedLocations[0]?.count || 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[2.5rem] text-right">{locationData.count.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Operating System & IP Analytics */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Smartphone className="h-4 w-4" /> Operating System</h3>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">Platform</span>
            </div>
            
            <div className="h-80">
              {analytics.clicksByOS && analytics.clicksByOS.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={analytics.clicksByOS.map((item: any) => ({
                          ...item,
                          os: (item as any).os || 'Unknown',
                          count: getCount(item)
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="os"
                      >
                        {analytics.clicksByOS.map((_: any, _index: number) => (
                          <Cell key={`os-cell-${_index}`} fill={COLORS[_index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [value, 'Clicks']}
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          backdropFilter: 'blur(10px)',
                          color: '#374151'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-2 max-h-24 overflow-y-auto custom-scrollbar">
                    {analytics.clicksByOS.map((entry: any, _idx: number) => (
                      <div key={entry.os || _idx} className="flex items-center justify-between p-2 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl border border-orange-100 dark:border-orange-800/50">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full shadow-sm" 
                            style={{ backgroundColor: COLORS[_idx % COLORS.length] }}
                          ></div>
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {entry.os || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 w-12">
                            <div
                              className="bg-gradient-to-r from-orange-400 to-red-500 h-1.5 rounded-full transition-all duration-1000"
                              style={{
                                width: `${(getCount(entry) / (analytics.totalClicks || 1)) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 min-w-[1.5rem] text-right">
                            {getCount(entry)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">No OS data</div>
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Globe className="h-4 w-4" /> Top IP Addresses</h3>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">Sources</span>
            </div>
            
            <div className="h-80 space-y-2 overflow-y-auto custom-scrollbar pr-1">
              {analytics.clicksByIp && analytics.clicksByIp.length > 0 ? (
                analytics.clicksByIp.slice(0, 12).map((ipData: any, _index: number) => {
                  const label = ipData.ipLabel || ipData.ip || 'Unknown IP';
                  const scope = ipData.scope || 'unknown';
                  const scopeStyles: Record<string, string> = {
                    loopback: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
                    private: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                    public: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                    unknown: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  };
                  return (
                    <div key={ipData.ip || _index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-cyan-600 rounded text-white flex items-center justify-center text-[10px] font-medium">#{_index + 1}</div>
                        <div>
                          <span className="font-mono text-[11px] font-medium text-gray-900 dark:text-gray-100">{label}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${scopeStyles[scope]}`}>{scope}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-200 dark:bg-gray-600 rounded h-1.5 w-14 overflow-hidden">
                          <div className="bg-cyan-500 h-1.5" style={{ width: `${(ipData.count / (analytics.clicksByIp[0]?.count || 1)) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 min-w-[1.5rem] text-right">{ipData.count || 0}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">No IP data</div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Insights */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2"><Activity className="h-4 w-4" /> Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md p-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-2">Peak Day</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">{peakDay ? new Date(peakDay.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{getCount(peakDay).toLocaleString()}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Total clicks</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md p-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-2">Growth</p>
              <p className={`text-lg font-semibold ${growthRate >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{growthRate >= 0 ? '+' : ''}{Math.abs(growthRate)}%</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">vs last week</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md p-4">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium mb-2">Top Platform</p>
              {clicksByDevice && clicksByDevice.length > 0 ? (
                <>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{clicksByDevice[0]?.device || 'Mobile'}</p>
                  <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">{((clicksByDevice[0]?.count || 0) / (totalScans || 1) * 100).toFixed(0)}%</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">No data</p>
                  <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">0%</p>
                </>
              )}
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Audience share</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
