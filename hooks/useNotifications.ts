import { useState, useCallback, useMemo, useEffect, useRef } from 'react'

/**
 * useNotifications (backend-integrated)
 * ---------------------------------------------------------------------------
 * Fetches notifications from /api/notifications and exposes helpers to mark
 * single / all as read. Polls periodically (default 60s) and supports manual
 * refresh. Future upgrades: WebSocket/SSE push, pagination, filters, caching.
 */

export interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  isRead: boolean
}

// Utility to format relative time (simple; can replace with dayjs/timeago later)
function relativeTime(from: Date): string {
  const diffMs = Date.now() - from.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

export function useNotifications(pollMs: number = 60000) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false)
  const [unreadExternal, setUnreadExternal] = useState<number | null>(null) // from SSE
  const abortRef = useRef<AbortController | null>(null)
  const sseRef = useRef<EventSource | null>(null)

  const mapApi = useCallback((items: any[]): NotificationItem[] => {
    return items.map(it => {
      const createdAt = new Date(it.createdAt || it.created_at || it.created_at || Date.now())
      return {
        id: it.id,
        title: it.title,
        message: it.message,
        time: relativeTime(createdAt),
        isRead: !!it.isRead,
      }
    })
  }, [])

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '20' })
      if (unreadOnly) params.set('unreadOnly', 'true')
      const res = await fetch(`/api/notifications?${params.toString()}`, { signal: controller.signal, credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const items = data.items || data.notifications || []
      setNotifications(mapApi(items))
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.error('[useNotifications] fetch error', e)
        setError(e.message || 'Failed to load notifications')
      }
    } finally {
      setLoading(false)
    }
  }, [mapApi, unreadOnly])

  // Polling
  useEffect(() => {
    load()
    if (pollMs <= 0) return
    const id = setInterval(load, pollMs)
    return () => { clearInterval(id); abortRef.current?.abort() }
  }, [load, pollMs])

  // SSE subscription for global unread count (decoupled from list window)
  useEffect(() => {
    try {
      const es = new EventSource('/api/notifications/stream')
      sseRef.current = es
      es.onmessage = (ev) => {
        // generic message not used; events have explicit names
      }
      es.addEventListener('unread', (ev: MessageEvent) => {
        try {
          const data = JSON.parse(ev.data)
          if (typeof data.unread === 'number') setUnreadExternal(data.unread)
        } catch { /* ignore */ }
      })
      es.onerror = () => {
        // attempt lightweight retry after delay
        es.close()
        if (sseRef.current === es) sseRef.current = null
        setTimeout(() => {
          if (!sseRef.current) {
            // trigger new subscription by changing state (hack: toggle noop)
            setUnreadExternal(prev => prev === null ? 0 : prev)
          }
        }, 8000)
      }
      return () => { es.close(); if (sseRef.current === es) sseRef.current = null }
    } catch {
      // SSE unsupported; silently ignore
    }
  }, [])

  const markAllRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/read', { method: 'POST', body: JSON.stringify({ all: true }) })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (e) {
      console.error('[useNotifications] markAllRead error', e)
    }
  }, [])

  const markReadById = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    try {
      await fetch('/api/notifications/read', { method: 'POST', body: JSON.stringify({ id }) })
    } catch (e) {
      console.error('[useNotifications] markReadById error', e)
    }
  }, [])

  const unreadLocal = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications])
  const unreadCount = unreadExternal != null ? unreadExternal : unreadLocal

  return {
    notifications,
    unreadCount,
    markAllRead,
    markReadById,
    reload: load,
    loading,
    error,
    unreadOnly,
    setUnreadOnly,
  }
}

export default useNotifications
