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
  MinusIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

interface ClickChartProps {
  data?: Array<{ date: string; clicks: number }>;
  clicksByDay?: Array<{ date: string; count: number }>;
  title?: string;
  totalClicks?: number; // optional: lifetime or window total from API
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

export const ClickChart: React.FC<ClickChartProps> = ({ data = [], clicksByDay, title = 'Click Activity (Last 30 Days)', totalClicks: totalClicksProp, effectiveDays: effectiveDaysProp }) => {
  const dark = useDarkMode();
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');
  const [autoClicksByDay, setAutoClicksByDay] = useState<Array<{ date: string; count: number }> | null>(null);
  const [subtitle, setSubtitle] = useState<string>(`Last ${effectiveDaysProp ?? 30} Days`);
  const [autoTotalClicks, setAutoTotalClicks] = useState<number | null>(null);
  const [autoEffectiveDays, setAutoEffectiveDays] = useState<number | null>(null);

  // Keep subtitle in sync when parent passes new effectiveDays
  useEffect(() => {
    if (typeof effectiveDaysProp === 'number') {
      setSubtitle(`Last ${effectiveDaysProp} Days`)
    }
  }, [effectiveDaysProp]);

  // Auto-fetch if parent didn't provide data
  useEffect(() => {
    let cancelled = false;
    const maybeFetch = async () => {
      if (!clicksByDay && (!data || data.length === 0)) {
        try {
          const summary = await dashboardanalyticsService.getSummary({ days: 30 });
          if (cancelled) return;
          setAutoClicksByDay(summary.clicksByDay || []);
          setAutoTotalClicks(typeof summary.totalClicks === 'number' ? summary.totalClicks : null);
          setAutoEffectiveDays(typeof summary.effectiveDays === 'number' ? summary.effectiveDays : 30);
          setSubtitle(`Last ${summary.effectiveDays || 30} Days`);
        } catch {
          // ignore – will render empty state
        }
      }
    };
    maybeFetch();
    return () => { cancelled = true; };
  }, [clicksByDay, data]);
  
  // Use clicksByDay if available, otherwise use data
  const chartData = React.useMemo(() => {
    if (clicksByDay) {
      return clicksByDay.map(item => ({ date: item.date, clicks: item.count }));
    }
    if (autoClicksByDay) {
      return autoClicksByDay.map(item => ({ date: item.date, clicks: item.count }));
    }
    return data || [];
  }, [data, clicksByDay, autoClicksByDay]);
  
  // Calculate analytics
  const sumFromSeries = chartData.reduce((sum, day) => sum + (day.clicks ?? 0), 0);
  const totalClicks = (typeof totalClicksProp === 'number')
    ? totalClicksProp
    : (sumFromSeries > 0 ? sumFromSeries : (autoTotalClicks ?? 0));
  const windowDays = (typeof effectiveDaysProp === 'number')
    ? effectiveDaysProp
    : (chartData.length > 0 ? chartData.length : (autoEffectiveDays ?? 30));
  const avgClicks = windowDays > 0 ? Math.round((totalClicks / windowDays) * 10) / 10 : 0;
  const maxClicks = Math.max(...chartData.map(d => d.clicks ?? 0));
  
  // Calculate trend (last 7 days vs previous 7 days)
  const last7Days = chartData.slice(-7).reduce((sum, day) => sum + (day.clicks ?? 0), 0);
  const prev7Days = chartData.slice(-14, -7).reduce((sum, day) => sum + (day.clicks ?? 0), 0);
  const trendPercentage = prev7Days > 0 ? Math.round(((last7Days - prev7Days) / prev7Days) * 100) : 0;
  
  // Find peak day
  const peakDay = maxClicks > 0 ? chartData.find(d => d.clicks === maxClicks) : undefined;
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={dark ? "#34d399" : "#10b981"} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={dark ? "#34d399" : "#10b981"} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#374151" : "#f0f0f0"} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke={dark ? "#d1d5db" : "#6b7280"}
              fontSize={12}
            />
            <YAxis stroke={dark ? "#d1d5db" : "#6b7280"} fontSize={12} />
            <Tooltip
              labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
              formatter={(value: number) => [value.toLocaleString(), 'Clicks']}
              contentStyle={{
                backgroundColor: dark ? '#111827' : 'white',
                color: dark ? '#f3f4f6' : '#111827',
                border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                fontSize: '14px'
              }}
            />
            <Area
              type="monotone"
              dataKey="clicks"
              stroke={dark ? "#34d399" : "#10b981"}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#clickGradient)"
              dot={{ fill: dark ? "#34d399" : "#10b981", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: dark ? "#34d399" : "#10b981", strokeWidth: 3, fill: dark ? '#111827' : 'white' }}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#374151" : "#f0f0f0"} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke={dark ? "#d1d5db" : "#6b7280"}
              fontSize={12}
            />
            <YAxis stroke={dark ? "#d1d5db" : "#6b7280"} fontSize={12} />
            <Tooltip
              labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
              formatter={(value: number) => [value.toLocaleString(), 'Clicks']}
              contentStyle={{
                backgroundColor: dark ? '#111827' : 'white',
                color: dark ? '#f3f4f6' : '#111827',
                border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar 
              dataKey="clicks" 
              fill={dark ? "#34d399" : "#10b981"}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
      
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#374151" : "#f0f0f0"} />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatDate}
              stroke={dark ? "#d1d5db" : "#6b7280"}
              fontSize={12}
            />
            <YAxis stroke={dark ? "#d1d5db" : "#6b7280"} fontSize={12} />
            <Tooltip
              labelFormatter={(date) => new Date(date).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
              formatter={(value: number) => [value.toLocaleString(), 'Clicks']}
              contentStyle={{
                backgroundColor: dark ? '#111827' : 'white',
                color: dark ? '#f3f4f6' : '#111827',
                border: `1px solid ${dark ? '#374151' : '#e5e7eb'}`,
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line
              type="monotone"
              dataKey="clicks"
              stroke={dark ? "#34d399" : "#10b981"}
              strokeWidth={3}
              dot={{ fill: dark ? "#34d399" : "#10b981", strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, stroke: dark ? "#34d399" : "#10b981", strokeWidth: 3, fill: dark ? '#111827' : 'white' }}
            />
          </LineChart>
        );
    }
  };

  // Helper to widen range on-demand if series is flat but totals exist
  // Removed widen-range UI per request

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <ChartBarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <CalendarDaysIcon className="h-4 w-4 mr-1" />
              {subtitle}
            </p>
          </div>
        </div>
        
        {/* Chart Type Selector */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {(['area', 'line', 'bar'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                chartType === type
                  ? 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Debug: show totals when enabled */}
      {typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === '1' && (
        <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap gap-3">
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">props.totalClicks: {String(totalClicksProp)}</span>
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">computed.totalClicks: {String(totalClicks)}</span>
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">seriesSum: {chartData.reduce((s, d) => s + (d.clicks ?? 0), 0)}</span>
            <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800">effectiveDays: {String(effectiveDaysProp ?? autoEffectiveDays ?? chartData.length)}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">{totalClicks.toLocaleString()}</p>
            </div>
            <CursorArrowRaysIcon className="h-8 w-8 text-green-500 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">Avg/Day</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{avgClicks}</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">Peak Day</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{maxClicks}</p>
              {peakDay && (
                <p className="text-xs text-purple-600 dark:text-purple-400">{formatDate(peakDay.date)}</p>
              )}
            </div>
            <ArrowTrendingUpIcon className="h-8 w-8 text-purple-500 dark:text-purple-400" />
          </div>
        </div>

        <div className={`bg-gradient-to-br ${
          trendPercentage > 0 
            ? 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20' 
            : trendPercentage < 0 
              ? 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20'
              : 'from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20'
        } rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium uppercase tracking-wide ${
                trendPercentage > 0 
                  ? 'text-emerald-600 dark:text-emerald-400' 
                  : trendPercentage < 0 
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-gray-400'
              }`}>
                7-Day Trend
              </p>
              <p className={`text-lg font-bold ${
                trendPercentage > 0 
                  ? 'text-emerald-700 dark:text-emerald-300' 
                  : trendPercentage < 0 
                    ? 'text-red-700 dark:text-red-300'
                    : 'text-gray-700 dark:text-gray-300'
              }`}>
                {trendPercentage > 0 ? '+' : ''}{trendPercentage}%
              </p>
            </div>
            {trendPercentage > 0 ? (
              <ArrowTrendingUpIcon className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
            ) : trendPercentage < 0 ? (
              <ArrowTrendingDownIcon className="h-8 w-8 text-red-500 dark:text-red-400" />
            ) : (
              <MinusIcon className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Widen-range banner removed */}

      {/* Chart */}
      <div className="h-80">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
            <ChartBarIcon className="h-16 w-16 mb-4 opacity-30" />
            <div className="text-lg font-medium">No click data available</div>
            <div className="text-sm mt-1">Data will appear when URLs are clicked</div>
          </div>
        )}
      </div>
    </div>
  );
};
