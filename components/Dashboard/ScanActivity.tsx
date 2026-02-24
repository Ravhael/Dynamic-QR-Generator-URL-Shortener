"use client"

import React, { useState, useEffect } from "react"
import { ClockIcon, EyeIcon, QrCodeIcon } from "@heroicons/react/24/outline"
import { authenticatedGet } from "@/lib/auth-fetch"
// import { QrCodeIcon, EyeIcon, ClockIcon } - unused import from "@heroicons/react/24/outline"

interface ScanEvent {
  id: string
  qrCodeId: string
  qrCodeName: string
  qrCodeType: string
  scannedAt: string
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

interface ScanActivityProps {
  className?: string
}

export const ScanActivity: React.FC<ScanActivityProps> = ({ className = "" }) => {
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchScanActivity = async () => {
      try {
        const response = await authenticatedGet('/api/scan-events?limit=15')
        if (!response.ok) {
          throw new Error('Failed to fetch scan events')
        }
        
        const data = await response.json()
        const processedEvents = data.scanEvents.map((event: any) => ({
          id: event.id,
          qrCodeId: event.qrCodeId,
          qrCodeName: event.qrCodeName,
          qrCodeType: event.qrCodeType,
          scannedAt: event.scannedAt,
          location: event.location || {},
          device: event.device || {},
          ipAddress: event.ipAddress
        }))
        
        setScanEvents(processedEvents)
      } catch (error) {
        console.error("Error fetching scan activity:", error)
        // Fallback to empty array if API fails
        setScanEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchScanActivity()
  }, [])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'url':
        return '🔗'
      case 'text':
        return '📝'
      case 'wifi':
        return '📶'
      case 'email':
        return '📧'
      case 'phone':
        return '📞'
      default:
        return '📱'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const scannedTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - scannedTime.getTime()) / (1000 * 60))
    
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
              <div className="absolute inset-0 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm">Loading scan activity...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-slate-700/50 rounded-xl p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100/70 dark:bg-blue-900/30 rounded-lg">
            <QrCodeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Recent Scan Activity</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Latest QR code scans</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <EyeIcon className="w-4 h-4" />
          <span>{scanEvents.length} scans</span>
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
          {scanEvents.length === 0 ? (
            <div className="text-center py-8">
              <QrCodeIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">No scan activity yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">QR code scans will appear here</p>
            </div>
          ) : (
            scanEvents.map((scan) => (
              <div
                key={scan.id}
                className="flex items-start gap-4 p-4 rounded-lg bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg">
                  {getTypeIcon(scan.qrCodeType)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {scan.qrCodeName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                          {scan.qrCodeType.toUpperCase()}
                        </span>
                        {scan.location && scan.location.city && (
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            📍 {scan.location.city}{scan.location.country ? `, ${scan.location.country}` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                        <ClockIcon className="w-3 h-3" />
                        <span>{formatTimeAgo(scan.scannedAt)}</span>
                      </div>
                      {scan.device && (scan.device.type || scan.device.browser) && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {scan.device.type || 'Unknown'} • {scan.device.browser || scan.device.os || 'Unknown'}
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

export default ScanActivity
