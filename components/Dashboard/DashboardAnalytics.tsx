"use client"

import React, { useState, useEffect } from "react"
import { QrCode, Eye, Link } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import { DASHBOARDanalyticsService } from "../../services/api/index"
import type { AnalyticsSummary } from "../../app/api/DASHBOARDanalyticsService"

type CountItem = { date?: string; count?: number; scans?: number }

type TopQR = { id: string; name: string; scans: number }
type TopURL = { id: string; title: string; clicks: number }

// Komponen StatsCard
const StatsCard = ({ title, value, change, changeType, icon: Icon, color }: any) => (
  <div className="bg-white rounded-xl shadow border p-4 text-center">
    <div className="flex items-center justify-center mb-2">
      <Icon className={`h-6 w-6 ${color ? `text-${color}-600` : ""}`} />
    </div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-xs text-gray-500">{title}</div>
    {typeof change === "number" && (
      <div
        className={`text-xs mt-1 ${
          changeType === "positive" ? "text-green-600" : changeType === "negative" ? "text-red-600" : "text-gray-400"
        }`}
      >
        {change > 0 && "+"}
        {change}%
      </div>
    )}
  </div>
)

export const DashboardAnalytics: React.FC = () => {
  const [dashboard, setDashboard] = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
  const data = await DASHBOARDanalyticsService.getSummary()
  setDashboard(data)
    } catch (err) {
      setDashboard(null)
      setError("Failed to load dashboard analytics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
    // DISABLED: Auto-refresh to prevent excessive requests
    // const interval = setInterval(fetchDashboard, 15000);
    // return () => clearInterval(interval);
  }, [])

  const calculateGrowth = (arr: CountItem[] = [], days = 7) => {
    if (!arr || arr.length === 0) return 0
    const recent = arr.slice(-days).reduce((a, b) => a + (b.count ?? b.scans ?? 0), 0)
    const prev = arr.slice(-2 * days, -days).reduce((a, b) => a + (b.count ?? b.scans ?? 0), 0)
    if (prev === 0) return 0
    return Math.round(((recent - prev) / prev) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading dashboard analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-500">{error}</div>
      </div>
    )
  }

  // Data mapping dari backend
  const scansByDay: CountItem[] = dashboard?.scansByDay || []
  const clicksByDay: CountItem[] = dashboard?.clicksByDay || []
  const qrGrowth = calculateGrowth((dashboard as any)?.qrCreatedByDay || [])
  const urlGrowth = calculateGrowth((dashboard as any)?.urlCreatedByDay || [])
  const summary = {
    qrCodeCount: dashboard?.qrCodeCount,
    shortUrlCount: dashboard?.shortUrlCount,
    totalScans: dashboard?.totalScans,
    totalClicks: dashboard?.totalClicks,
    activeQrCodeCount: (dashboard as any)?.activeQRCodes,
    activeShortUrlCount: (dashboard as any)?.activeShortURLs,
  }
  const scanGrowth = calculateGrowth(scansByDay)
  const clickGrowth = calculateGrowth(clicksByDay)

  const avgScansPerDay =
    scansByDay.length > 0
      ? Math.round(
          scansByDay.reduce((sum: number, day: CountItem) => sum + (day.count ?? day.scans ?? 0), 0) / scansByDay.length,
        )
      : 0

  const avgClicksPerURL = (summary.shortUrlCount || 0) > 0 ? Math.round((summary.totalClicks || 0) / (summary.shortUrlCount || 1)) : 0

  const TopQRCodes = ({ data, totalScans }: { data: TopQR[]; totalScans: number }) => (
    <div>
      <h4 className="font-semibold mb-2">Top QR Codes</h4>
      <ul className="space-y-2">
        {(data || []).map((qr: TopQR, i: number) => (
          <li key={qr.id} className="flex justify-between items-center">
            <span>
              {i + 1}. {qr.name}
            </span>
            <span className="font-bold">{qr.scans}</span>
            <span className="text-xs text-gray-400">
              {totalScans > 0 ? ((qr.scans / totalScans) * 100).toFixed(1) : 0}%
            </span>
          </li>
        ))}
        {(!data || data.length === 0) && <li className="text-gray-400 text-sm">No QR Codes found</li>}
      </ul>
    </div>
  )

  const TopURLs = ({ data, totalClicks }: { data: TopURL[]; totalClicks: number }) => (
    <div>
      <h4 className="font-semibold mb-2">Top URLs</h4>
      <ul className="space-y-2">
        {(data || []).map((url: TopURL, i: number) => (
          <li key={url.id} className="flex justify-between items-center">
            <span>
              {i + 1}. {url.title}
            </span>
            <span className="font-bold">{url.clicks}</span>
            <span className="text-xs text-gray-400">
              {totalClicks > 0 ? ((url.clicks / totalClicks) * 100).toFixed(1) : 0}%
            </span>
          </li>
        ))}
        {(!data || data.length === 0) && <li className="text-gray-400 text-sm">No URLs found</li>}
      </ul>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total QR Codes"
          value={summary.qrCodeCount ?? 0}
          change={qrGrowth}
          changeType={qrGrowth > 0 ? "positive" : qrGrowth < 0 ? "negative" : "neutral"}
          icon={QrCode}
          color="blue"
        />
        <StatsCard
          title="Total Scans"
          value={summary.totalScans?.toLocaleString?.() || summary.totalScans}
          change={scanGrowth}
          changeType={scanGrowth > 0 ? "positive" : scanGrowth < 0 ? "negative" : "neutral"}
          icon={Eye}
          color="green"
        />
        <StatsCard
          title="Total Short URLs"
          value={summary.shortUrlCount ?? 0}
          change={urlGrowth}
          changeType={urlGrowth > 0 ? "positive" : urlGrowth < 0 ? "negative" : "neutral"}
          icon={Link}
          color="yellow"
        />
        <StatsCard
          title="Total Clicks"
          value={summary.totalClicks?.toLocaleString?.() || summary.totalClicks}
          change={clickGrowth}
          changeType={clickGrowth > 0 ? "positive" : clickGrowth < 0 ? "negative" : "neutral"}
          icon={Eye}
          color="red"
        />
      </div>
      {/* Average & Top */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-base font-semibold mb-2">Averages</h3>
          <div className="flex flex-col gap-1">
            <div>
              Avg. Scans per Day: <b>{avgScansPerDay}</b>
            </div>
            <div>
              Avg. Clicks per URL: <b>{avgClicksPerURL}</b>
            </div>
            <div>
              Active QR Codes: <b>{summary.activeQrCodeCount ?? 0}</b>
            </div>
            <div>
              Active URLs: <b>{summary.activeShortUrlCount ?? 0}</b>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow border p-3">
            <TopQRCodes data={dashboard?.topQRCodes || []} totalScans={summary.totalScans || 0} />
          </div>
          <div className="bg-white rounded-lg shadow border p-3">
            <TopURLs data={dashboard?.topShortUrls || []} totalClicks={summary.totalClicks || 0} />
          </div>
        </div>
      </div>
      {/* Scan/Click Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-base font-semibold mb-4">Scan & Click Trends (30 days)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Scans per Day</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scansByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Clicks per Day</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clicksByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#F59E0B" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
