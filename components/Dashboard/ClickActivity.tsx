"use client"

import React, { useState, useEffect } from "react"
import { ClockIcon, EyeIcon, LinkIcon } from "@heroicons/react/24/outline"
import { authenticatedGet } from "@/lib/auth-fetch"
// import { LinkIcon, EyeIcon, ClockIcon } - unused import from "@heroicons/react/24/outline"

interface ClickEvent {
  id: string
  shortUrlId: string
  shortCode: string
  title: string
  originalUrl: string
  clickedAt: string
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
}

interface ClickActivityProps {
  className?: string
}

export const ClickActivity: React.FC<ClickActivityProps> = ({ className = "" }) => {
  const [clickEvents, setClickEvents] = useState<ClickEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClickActivity = async () => {
      try {
        const response = await authenticatedGet('/api/click-events?limit=15')
        if (!response.ok) {
          throw new Error('Failed to fetch click events')
        }
        
        const data = await response.json()
        const processedEvents = data.clickEvents.map((event: any) => ({
          id: event.id,
          shortUrlId: event.shortUrlId,
          shortCode: event.shortCode,
          title: event.title,
          originalUrl: event.originalUrl,
          clickedAt: event.clickedAt,
          location: event.location || {},
          device: event.device || {},
          ipAddress: event.ipAddress
        }))
        
        setClickEvents(processedEvents)
      } catch (error) {
        console.error("Error fetching click activity:", error)
        // Fallback to empty array if API fails
        setClickEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchClickActivity()
  }, [])

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const clickedTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - clickedTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (loading) {
    return (
      <div className={`bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative w-8 h-8 mx-auto mb-3">
              <div className="absolute inset-0 border-2 border-gray-200 dark:border-slate-600 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-purple-600 dark:border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm">Loading click activity...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100/70 dark:bg-purple-900/30 rounded-lg">
            <LinkIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Click Activity</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Latest short URL clicks</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <EyeIcon className="w-4 h-4" />
          <span>{clickEvents.length} clicks</span>
        </div>
      </div>

      {/* Scrollable content area with hidden scrollbar */}
      <div className="h-80 overflow-y-auto scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="space-y-4 pr-2">
          {clickEvents.length === 0 ? (
            <div className="text-center py-8">
              <LinkIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">No click activity yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Short URL clicks will appear here</p>
            </div>
          ) : (
            clickEvents.map((click) => (
              <div
                key={click.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white text-lg">
                  🔗
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {click.title || click.shortCode}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                        {click.originalUrl}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300">
                          {click.shortCode}
                        </span>
                        {click.location && click.location.city && (
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            📍 {click.location.city}{click.location.country ? `, ${click.location.country}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                        <ClockIcon className="w-3 h-3" />
                        <span>{formatTimeAgo(click.clickedAt)}</span>
                      </div>
                      {click.device && (click.device.type || click.device.browser) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {click.device.type || 'Unknown'} • {click.device.browser || click.device.os || 'Unknown'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ClickActivity
