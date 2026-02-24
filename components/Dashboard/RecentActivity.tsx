"use client"

import React, { useState, useEffect } from "react"
import { ClockIcon, ComputerDesktopIcon, SparklesIcon, MapPinIcon, BoltIcon } from "@heroicons/react/24/outline"
import { formatDistance } from "date-fns"
import { authenticatedGet } from "@/lib/auth-fetch"

interface ActivityEvent {
  id: string
  type: "scan" | "click"
  title: string
  description: string
  timestamp: string | Date
  location?: {
    country?: string
    city?: string
  }
  device?: {
    type?: string
    browser?: string
    os?: string
  }
  ipAddress?: string
  itemName?: string
  itemType?: string
}

export const RecentActivity: React.FC = () => {
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const loadActivityEvents = async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const response = await authenticatedGet('/api/recent-activity?limit=20')
      if (!response.ok) {
        throw new Error('Failed to fetch recent activity')
      }
      
      const data = await response.json()
      let events = data.activity.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }))
      // Deduplicate by id + timestamp combo (fallback to JSON string) to avoid React duplicate key warnings
      const seen = new Set<string>()
      const dedup: typeof events = []
      for (const ev of events) {
        const key = `${ev.id || 'noid'}-${(ev.timestamp as Date).getTime?.() || ev.timestamp}`
        if (!seen.has(key)) {
          seen.add(key)
          dedup.push(ev)
        }
      }
      if (dedup.length !== events.length) {
        console.warn('[RecentActivity] Removed duplicate events:', events.length - dedup.length)
      }
      events = dedup
      setActivityEvents(events)
    } catch (error: any) {
      setActivityEvents([])
      setFetchError(error.message || "Failed to fetch recent activity")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadActivityEvents()
    const interval = setInterval(loadActivityEvents, 10000)
    return () => clearInterval(interval)
  }, [])

  const getDeviceIcon = () => {
    // Default to desktop since we don't have device info in current backend response
    return ComputerDesktopIcon
  }

  return (
    <div className="relative bg-gradient-to-br from-white via-rose-50/30 to-pink-50/50 dark:from-gray-900 dark:via-rose-900/10 dark:to-pink-900/20 rounded-2xl shadow-xl border border-rose-200/50 dark:border-rose-800/30 p-6 backdrop-blur-sm overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-pink-500/5 dark:from-rose-400/5 dark:to-pink-400/5 rounded-2xl"></div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg">
            <BoltIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-rose-800 to-pink-800 dark:from-white dark:via-rose-200 dark:to-pink-200 bg-clip-text text-transparent">
              Recent Activity
            </h3>
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
              <SparklesIcon className="h-3 w-3" />
              <span>Live updates from scan_events & click_events</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-full">
            {activityEvents.length} activities
          </div>
        </div>
      </div>

      {/* Error State */}
      {fetchError && (
        <div className="relative z-10 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 border border-red-200/50 dark:border-red-800/50 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-4 text-sm backdrop-blur-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>{fetchError}</span>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="relative z-10 h-80 overflow-y-auto scrollbar-none space-y-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {activityEvents.length > 0 ? (
          activityEvents.map((event, idx) => {
            const DeviceIcon = getDeviceIcon()
            const dateObj = event.timestamp instanceof Date ? event.timestamp : new Date(event.timestamp)

            return (
              <div
                key={`act-${event.id}-${(event.timestamp as Date).getTime?.() || event.timestamp}-${idx}`}
                className="group relative bg-white/70 dark:bg-gray-800/70 rounded-xl p-4 border border-rose-200/50 dark:border-rose-700/50 hover:bg-white/90 dark:hover:bg-gray-700/90 hover:scale-[1.01] transition-all duration-300 hover:shadow-lg"
              >
                {/* Activity Type Badge */}
                <div className="absolute top-3 right-3">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      event.type === "scan"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                    }`}
                  >
                    {event.type === "scan" ? "QR Scan" : "URL Click"}
                  </div>
                </div>

                <div className="flex items-start space-x-4 pr-16">
                  {/* Device Icon */}
                  <div className="flex-shrink-0 p-2.5 bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30 rounded-xl">
                    <DeviceIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                      {event.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{event.description}</p>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-3 w-3" />
                        <span className="font-medium">{formatDistance(dateObj, new Date(), { addSuffix: true })}</span>
                      </div>

                      {event.location?.country && (
                        <div className="flex items-center space-x-1">
                          <MapPinIcon className="h-3 w-3" />
                          <span>
                            {event.location?.city || "-"}, {event.location?.country || "-"}
                          </span>
                        </div>
                      )}

                      {event.device?.browser && (
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">
                          {event.device.browser} • {event.device.type || 'Unknown'}
                        </span>
                      )}

                      <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        {dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle animation dot */}
                <div className="absolute top-2 left-2 w-2 h-2 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full opacity-60 animate-pulse"></div>
              </div>
            )
          })
        ) : !fetchError ? (
          <div className="text-center py-16">
            <div className="relative">
              <ClockIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-6 h-6 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full opacity-20 animate-ping"></div>
            </div>
            <h4 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No recent activity</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create and use QR codes or short URLs to see activity here
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default RecentActivity
