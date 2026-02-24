"use client"

import React, { useState, useEffect } from "react"
import dashboardanalyticsService from "../../app/api/DASHBOARDanalyticsService"
// import { QrCodeIcon, EyeIcon, LinkIcon, ArrowTrendingUpIcon, UsersIcon, ChartBarIcon } - unused import from "@heroicons/react/24/outline"
import { StatsCard } from "./StatsCard"
import { ScanChart } from "./ScanChart"
import { ClickChart } from "./ClickChart"
import { TopQRCodes } from "./TopQRCodes"
import { TopURL } from "./TopURL"
import { RecentActivity } from "./RecentActivity"
import { ScanActivity } from "./ScanActivity"
import { ClickActivity } from "./ClickActivity"

import { EyeIcon, LinkIcon, ChartBarIcon, UsersIcon, ArrowTrendingUpIcon, QrCodeIcon } from '@heroicons/react/24/outline'
// Dashboard component props (currently no props needed)
interface DashboardProps {
  // Reserved for future props as the dashboard grows
  readonly className?: string; // Optional styling prop
}

const Dashboard: React.FC<DashboardProps> = () => {
  const [analytics, setAnalytics] = useState<{
    qrCodeCount: number
    totalScans: number
    activeQRCodes: number
    scansByDay: Array<{ date: string; count: number }>
    effectiveDays?: number
    topQRCodes: unknown[]
  }>({
    qrCodeCount: 0,
    totalScans: 0,
    activeQRCodes: 0,
    scansByDay: [],
    effectiveDays: 30,
    topQRCodes: [],
  })

  const [urlAnalytics, setUrlAnalytics] = useState<{
    shortUrlCount: number
    totalClicks: number
    activeShortURLs: number
    clicksByDay: Array<{ date: string; count: number }>
    effectiveDays?: number
    topURLs: unknown[]
  }>({
    shortUrlCount: 0,
    totalClicks: 0,
    activeShortURLs: 0,
    clicksByDay: [],
    effectiveDays: 30,
    topURLs: [],
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const summaryData = await dashboardanalyticsService.getSummary()

        setAnalytics({
          qrCodeCount: summaryData.qrCodeCount || 0,
          totalScans: summaryData.totalScans || 0,
          activeQRCodes: summaryData.activeQRCodes || 0,
          scansByDay: summaryData.scansByDay || [],
          effectiveDays: summaryData.effectiveDays || 30,
          topQRCodes: summaryData.topQRCodes || [],
        })
        setUrlAnalytics({
          shortUrlCount: summaryData.shortUrlCount || 0,
          totalClicks: summaryData.totalClicks || 0,
          activeShortURLs: summaryData.activeShortURLs || 0,
          clicksByDay: summaryData.clicksByDay || [],
          effectiveDays: summaryData.effectiveDays || 30,
          topURLs: summaryData.topShortUrls || [],
        })
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const calculateGrowth = (_data: any[]) => {
    if (!_data || _data.length < 2) return 0
    const getVal = (i: number) => {
      const item = _data[i] || {}
      // Prefer 'count' when provided by API series; else fall back
      if (typeof item.count === 'number') return item.count
      if (typeof item.scans === 'number') return item.scans
      if (typeof item.clicks === 'number') return item.clicks
      return 0
    }
    const current = getVal(_data.length - 1)
    const previous = getVal(_data.length - 2)
    if (previous === 0) return 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const qrGrowth = calculateGrowth(analytics.scansByDay)
  const scanGrowth = qrGrowth
  const urlGrowth = calculateGrowth(urlAnalytics.clicksByDay)

  // Footer metrics: use effectiveDays and show 1-decimal precision
  const scansSeriesSum = analytics.scansByDay.reduce((s, d: any) => s + (typeof d.count === 'number' ? d.count : (d.scans ?? 0) ?? 0), 0)
  const scansWindowDays = analytics.effectiveDays ?? (analytics.scansByDay?.length || 30)
  const avgScansPerDay = scansWindowDays > 0
    ? Math.round((((scansSeriesSum > 0 ? scansSeriesSum : analytics.totalScans) / scansWindowDays) * 10)) / 10
    : 0

  const avgClicksPerURL = urlAnalytics.shortUrlCount > 0
    ? Math.round(((urlAnalytics.totalClicks / urlAnalytics.shortUrlCount) * 10)) / 10
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
        <div className="container mx-auto px-3 sm:px-5 lg:px-8 py-6 sm:py-8 max-w-7xl">
          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center">
              <div className="relative w-12 h-12 mx-auto mb-4">
                <div className="absolute inset-0 border-2 border-gray-200 dark:border-slate-700 rounded-full"></div>
                <div className="absolute inset-0 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
      <div className="mx-auto px-3 sm:px-5 lg:px-8 py-5 sm:py-7 lg:py-8 w-full max-w-[1550px]">
        
        {/* Clean Minimal Header */}
  <div className="mb-5 sm:mb-7">
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-slate-900 dark:text-white mb-1 tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-normal">
              Welcome back! Here's your analytics overview
            </p>
          </div>
        </div>

        {/* Quick Actions (Mobile First) */}
  <div className="flex flex-wrap gap-2 mb-5 sm:mb-7 -mx-1">
          <a href="/generate" className="flex-1 min-w-[140px] mx-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/70 dark:bg-slate-800/70 backdrop-blur border border-slate-200/60 dark:border-slate-700/60 hover:shadow-sm hover:bg-white dark:hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <QrCodeIcon className="w-4 h-4" /> New QR
          </a>
          <a href="/generate-url" className="flex-1 min-w-[140px] mx-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/70 dark:bg-slate-800/70 backdrop-blur border border-slate-200/60 dark:border-slate-700/60 hover:shadow-sm hover:bg-white dark:hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <LinkIcon className="w-4 h-4" /> New URL
          </a>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            <StatsCard 
              title="QR Codes" 
              value={analytics.qrCodeCount} 
              icon={QrCodeIcon} 
              growth={qrGrowth}
              subtitle="Total Created"
              className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-blue-200/40 dark:border-blue-800/40 hover:border-blue-300/60 dark:hover:border-blue-700/60"
            />
            <StatsCard 
              title="Total Scans" 
              value={analytics.totalScans} 
              icon={EyeIcon} 
              growth={scanGrowth}
              subtitle="Lifetime Views"
              className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-green-200/40 dark:border-green-800/40 hover:border-green-300/60 dark:hover:border-green-700/60"
            />
            <StatsCard 
              title="Short URLs" 
              value={urlAnalytics.shortUrlCount} 
              icon={LinkIcon} 
              growth={urlGrowth}
              subtitle="Links Created"
              className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-purple-200/40 dark:border-purple-800/40 hover:border-purple-300/60 dark:hover:border-purple-700/60"
            />
            <StatsCard 
              title="Total Clicks" 
              value={urlAnalytics.totalClicks} 
              icon={ArrowTrendingUpIcon} 
              growth={urlGrowth}
              subtitle="URL Interactions"
              className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-orange-200/40 dark:border-orange-800/40 hover:border-orange-300/60 dark:hover:border-orange-700/60"
            />
          </div>
        </div>

        {/* Analytics QR Charts Section */}
  <div className="mb-8 sm:mb-10">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white mb-1">
              Analytics QR Overview
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Track your performance with real-time insights
            </p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6 mb-6">
            <div className="xl:col-span-2 min-w-0">
              <div className="rounded-xl h-full flex flex-col">
                <ScanActivity />
              </div>
            </div>
            <div className="min-w-0">
              <TopQRCodes topQRCodes={analytics.topQRCodes as any} totalScans={analytics.totalScans} />
            </div>
          </div>
          <div className="-mx-2 sm:mx-0 mb-2">
            <div className="overflow-x-auto rounded-lg px-2 sm:px-0">
              <div className="min-w-[560px] sm:min-w-0">
                <ScanChart
                  scansByDay={analytics.scansByDay}
                  totalScans={analytics.totalScans}
                  effectiveDays={analytics.effectiveDays ?? 30}
                  title={`Scan Activity (Last ${analytics.effectiveDays ?? 30} Days)`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics URL Charts Section */}
  <div className="mb-8 sm:mb-10">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white mb-1">
              Analytics URL Overview
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Track your performance with real-time insights
            </p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6 mb-6">
            <div className="xl:col-span-2 min-w-0">
              <ClickActivity />
            </div>
            <div className="min-w-0">
              <TopURL topURL={urlAnalytics.topURLs as any} totalClick={urlAnalytics.totalClicks} />
            </div>
          </div>
          <div className="-mx-2 sm:mx-0 mb-2">
            <div className="overflow-x-auto rounded-lg px-2 sm:px-0">
              <div className="min-w-[560px] sm:min-w-0">
                <ClickChart
                  clicksByDay={urlAnalytics.clicksByDay}
                  totalClicks={urlAnalytics.totalClicks}
                  effectiveDays={urlAnalytics.effectiveDays ?? 30}
                  title={`Click Activity (Last ${urlAnalytics.effectiveDays ?? 30} Days)`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Metrics Footer */}
        <div className="mt-8">
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="p-1.5 sm:p-2 bg-blue-100/70 dark:bg-blue-900/30 rounded-lg mb-1.5 sm:mb-2">
                  <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  {avgScansPerDay.toLocaleString()}
                </div>
                <p className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                  Avg Scans/Day
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-1.5 sm:p-2 bg-green-100/70 dark:bg-green-900/30 rounded-lg mb-1.5 sm:mb-2">
                  <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  {avgClicksPerURL.toLocaleString()}
                </div>
                <p className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                  Avg Clicks/URL
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div className="p-1.5 sm:p-2 bg-purple-100/70 dark:bg-purple-900/30 rounded-lg mb-1.5 sm:mb-2">
                  <ArrowTrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white">
                  {(() => {
                    const denom = (analytics.qrCodeCount + urlAnalytics.shortUrlCount) || 0
                    if (denom === 0) return 0
                    const val = (analytics.totalScans + urlAnalytics.totalClicks) / denom
                    return Math.round(val * 10) / 10
                  })()}
                </div>
                <p className="text-[11px] sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                  Engagement Rate
                </p>
              </div>
              
            </div>
          </div>
        </div>
        <br></br>
        {/* Recent Activity Section */}
        <div className="mt-10">
          <RecentActivity />
        </div>

        
      </div>
    </div>
  )
}

export default Dashboard
export { Dashboard }
