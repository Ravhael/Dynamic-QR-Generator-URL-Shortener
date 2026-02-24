import React, { useState, useEffect } from 'react';
import dashboardanalyticsService from '../../app/api/DASHBOARDanalyticsService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import { 
  ChartBarIcon, 
  CursorArrowRaysIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  MinusIcon
  // CalendarDaysIcon - unused import
} from '@heroicons/react/24/outline';

interface ScanChartProps {
  data?: Array<{ date: string; scans: number }>;
  scansByDay?: Array<{ date: string; count: number }>;
  title?: string;
  totalScans?: number; // optional: lifetime or window total from API
  effectiveDays?: number; // optional: window length from API
}

// Lebih "aman" untuk SSR: deteksi dark mode via effect
function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    // Optional: listen for class change if dark mode bisa toggle saat runtime
    const observer = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export const ScanChart: React.FC<ScanChartProps> = ({ data, scansByDay, title = "Scan Activity (Last 30 Days)", totalScans: totalScansProp, effectiveDays: effectiveDaysProp }) => {
  const dark = useDarkMode();
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');
  const [autoScansByDay, setAutoScansByDay] = useState<Array<{ date: string; count: number }> | null>(null);
  const [autoTitle, setAutoTitle] = useState<string>(title);
  const [autoTotalScans, setAutoTotalScans] = useState<number | null>(null);
  const [autoEffectiveDays, setAutoEffectiveDays] = useState<number | null>(null);

  // Auto-fetch from summary API if parent didn't provide data
  useEffect(() => {
    let cancelled = false;
    const maybeFetch = async () => {
      if (!data && !scansByDay) {
        try {
          const summary = await dashboardanalyticsService.getSummary({ days: 30 });
          if (cancelled) return;
          setAutoScansByDay(summary.scansByDay || []);
          setAutoTotalScans(typeof summary.totalScans === 'number' ? summary.totalScans : null);
          setAutoEffectiveDays(typeof summary.effectiveDays === 'number' ? summary.effectiveDays : 30);
          if (summary.effectiveDays && summary.effectiveDays !== 30) {
            setAutoTitle(`Scan Activity (Last ${summary.effectiveDays} Days)`);
          }
        } catch {
          // swallow – chart will show empty state
        }
      }
    };
    maybeFetch();
    return () => { cancelled = true; };
  }, [data, scansByDay]);
  
  // Early return check after hooks
  // Use scansByDay if available, otherwise use data
  const chartData = React.useMemo(() => {
    const sourceData = scansByDay || autoScansByDay || data || [] as any[];
    return sourceData.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      scans: 'count' in item ? item.count : item.scans
    }));
  }, [data, scansByDay, autoScansByDay]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    const seriesSum = chartData.reduce((sum, item) => sum + (item.scans ?? 0), 0);
    const total = (typeof totalScansProp === 'number')
      ? totalScansProp
      : (seriesSum > 0 ? seriesSum : (autoTotalScans ?? 0));
    const windowDays = (typeof effectiveDaysProp === 'number')
      ? effectiveDaysProp
      : (chartData.length > 0 ? chartData.length : (autoEffectiveDays ?? 30));
    const average = windowDays > 0 ? Math.round((total / windowDays) * 10) / 10 : 0;

    if (!chartData.length) {
      return { total, average, peakDay: 'N/A', trend: 0 };
    }

    const maxVal = Math.max(...chartData.map(d => d.scans ?? 0));
    const peakDay = maxVal > 0
      ? chartData.reduce((max, item) => (item.scans > max.scans ? item : max), chartData[0]).date
      : 'N/A';

    if (chartData.length < 14) {
      return { total, average, peakDay, trend: 0 };
    }
    
    const lastWeek = chartData.slice(-7);
    const prevWeek = chartData.slice(-14, -7);
    
    if (lastWeek.length < 7 || prevWeek.length < 7) {
      return { total, average, peakDay, trend: 0 };
    }
    
  const lastWeekAvg = lastWeek.reduce((sum, item) => sum + (item.scans ?? 0), 0) / lastWeek.length;
  const prevWeekAvg = prevWeek.reduce((sum, item) => sum + (item.scans ?? 0), 0) / prevWeek.length;
    
    const trend = prevWeekAvg === 0 ? 0 : ((lastWeekAvg - prevWeekAvg) / prevWeekAvg) * 100;
    
    return { total, average, peakDay, trend };
  }, [chartData, autoTotalScans, autoEffectiveDays, totalScansProp, effectiveDaysProp]);

  // Helper to widen range on-demand if series is flat but totals exist
  // Removed widen-range UI per request

  const gradientData = React.useMemo(() => {
    return (data || []).map((item, index) => ({
      ...item,
      fill: `url(#colorUv${index})`
    }))
  }, [data])

  const renderGradient = React.useCallback(() => {
    return (data || []).map((_item, index) => (
      <defs key={`item-${index}`}>
        <linearGradient id={`colorUv${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
        </linearGradient>
      </defs>
    ))
  }, [data])

  const getTrendIcon = () => {
    if (Math.abs(stats.trend) < 1) return MinusIcon;
    return stats.trend > 0 ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  };

  const getTrendColor = () => {
    if (Math.abs(stats.trend) < 1) return 'text-slate-500 dark:text-slate-400';
    return stats.trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const chartId = React.useMemo(() => Math.random().toString(36).substring(2, 9), []);

  const renderChart = React.useCallback(() => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    const gridAndAxis = (
      <>
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke={dark ? "#475569" : "#E2E8F0"}
          opacity={0.6}
        />
        <XAxis 
          dataKey="date" 
          tick={{ 
            fontSize: 12,
            fill: dark ? "#94A3B8" : "#64748B"
          }}
          tickLine={{ stroke: dark ? "#64748B" : "#CBD5E1" }}
          axisLine={{ stroke: dark ? "#64748B" : "#CBD5E1" }}
        />
        <YAxis 
          tick={{ 
            fontSize: 12,
            fill: dark ? "#94A3B8" : "#64748B"
          }}
          tickLine={{ stroke: dark ? "#64748B" : "#CBD5E1" }}
          axisLine={{ stroke: dark ? "#64748B" : "#CBD5E1" }}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: dark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${dark ? '#475569' : '#E2E8F0'}`,
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            color: dark ? '#F1F5F9' : '#0F172A'
          }}
          labelStyle={{ 
            color: dark ? '#94A3B8' : '#64748B',
            fontWeight: '600'
          }}
        />
      </>
    );

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <defs>
              <filter id={`glow-${chartId}`}>
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            {gridAndAxis}
            <Line 
              type="monotone" 
              dataKey="scans" 
              stroke={dark ? "#60A5FA" : "#3B82F6"}
              strokeWidth={3}
              dot={{
                fill: dark ? "#60A5FA" : "#3B82F6",
                stroke: dark ? "#1E40AF" : "#1D4ED8",
                strokeWidth: 2,
                r: 4
              }}
              activeDot={{
                r: 6,
                stroke: dark ? "#F59E0B" : "#F59E0B",
                strokeWidth: 2,
                fill: dark ? "#FCD34D" : "#F59E0B"
              }}
            />
          </LineChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <defs>
              <linearGradient id={`bar-gradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={dark ? "#60A5FA" : "#3B82F6"} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={dark ? "#60A5FA" : "#3B82F6"} stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            {gridAndAxis}
            <Bar 
              dataKey="scans" 
              fill={`url(#bar-gradient-${chartId})`}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
      
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={`area-gradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={dark ? "#60A5FA" : "#3B82F6"} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={dark ? "#60A5FA" : "#3B82F6"} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            {gridAndAxis}
            <Area 
              type="monotone" 
              dataKey="scans" 
              stroke={dark ? "#60A5FA" : "#3B82F6"}
              fill={`url(#area-gradient-${chartId})`}
              strokeWidth={2}
            />
          </AreaChart>
        );
      
      default:
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={`area-gradient-${chartId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={dark ? "#60A5FA" : "#3B82F6"} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={dark ? "#60A5FA" : "#3B82F6"} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            {gridAndAxis}
            <Area 
              type="monotone" 
              dataKey="scans" 
              stroke={dark ? "#60A5FA" : "#3B82F6"}
              fill={`url(#area-gradient-${chartId})`}
              strokeWidth={2}
            />
          </AreaChart>
        );
    }
  }, [chartType, chartData, dark, chartId]);

  // Early return after all hooks
  if (!data && !scansByDay && !autoScansByDay) {
    return <div className="text-center py-4">No scan data available</div>
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-slate-700/30 p-6 lg:p-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"></div>
      {typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1' && (
        <div className="relative z-10 mb-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">props.totalScans: {String(totalScansProp)}</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">computed.total: {String(stats.total)}</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">seriesSum: {chartData.reduce((s, d) => s + (d.scans ?? 0), 0)}</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">effectiveDays: {String(effectiveDaysProp ?? autoEffectiveDays ?? chartData.length)}</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">len.props.scansByDay: {String(scansByDay ? scansByDay.length : 0)}</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">len.props.data: {String(data ? data.length : 0)}</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">len.autoScansByDay: {String(autoScansByDay ? autoScansByDay.length : 0)}</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">len.chartData: {String(chartData.length)}</span>
          </div>
        </div>
      )}
      
      {/* Header with Chart Type Selector */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {autoTitle}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Track your QR code performance over time
            </p>
          </div>
        </div>
        
        {/* Chart Type Selector */}
        <div className="flex bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-1 shadow-inner">
          {[
            { type: 'area' as const, icon: CursorArrowRaysIcon, label: 'Area' },
            { type: 'line' as const, icon: ArrowTrendingUpIcon, label: 'Line' },
            { type: 'bar' as const, icon: ChartBarIcon, label: 'Bar' }
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                chartType === type
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-md scale-105'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 hover:scale-102'
              }`}
              title={`Switch to ${label} chart`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Widen-range banner removed */}

      {/* Enhanced Statistics Cards */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-950/50 dark:to-cyan-950/50 backdrop-blur-sm p-4 border border-blue-200/30 dark:border-blue-800/30">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-cyan-400/10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">Total Scans</p>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-blue-800 dark:text-blue-200">
              {stats.total.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-950/50 dark:to-emerald-950/50 backdrop-blur-sm p-4 border border-green-200/30 dark:border-green-800/30">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/10 to-emerald-400/10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-green-600 dark:text-green-400 font-semibold">Avg/Day</p>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-green-800 dark:text-green-200">
              {stats.average.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50/80 to-violet-50/80 dark:from-purple-950/50 dark:to-violet-950/50 backdrop-blur-sm p-4 border border-purple-200/30 dark:border-purple-800/30">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-violet-400/10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">Peak Day</p>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-lg lg:text-xl font-bold text-purple-800 dark:text-purple-200 truncate">
              {stats.peakDay}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50/80 to-amber-50/80 dark:from-orange-950/50 dark:to-amber-950/50 backdrop-blur-sm p-4 border border-orange-200/30 dark:border-orange-800/30">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-amber-400/10"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-orange-600 dark:text-orange-400 font-semibold">7-Day Trend</p>
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                Math.abs(stats.trend) < 1 ? 'bg-slate-400' : 
                stats.trend > 0 ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            </div>
            <div className="flex items-center gap-2">
              <p className={`text-2xl lg:text-3xl font-bold ${getTrendColor()}`}>
                {Math.abs(stats.trend) < 1 ? '0' : `${stats.trend > 0 ? '+' : ''}${stats.trend.toFixed(1)}`}%
              </p>
              {React.createElement(getTrendIcon(), { 
                className: `h-5 w-5 ${getTrendColor()}` 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative z-10 h-72 lg:h-80">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
