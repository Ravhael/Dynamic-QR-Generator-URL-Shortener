import { NextRequest } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth'
import { countUnread } from '@/lib/services/notificationService'
import { getEffectiveUserSettings } from '@/lib/userSettingsCache'

/**
 * SSE endpoint streaming unread count every 15s (lightweight polling server-side)
 * Future upgrade: push via listener on NOTIFY/LISTEN or Redis pub/sub.
 */
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUserId(req)
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const encoder = new TextEncoder()
  // Respect per-user toggle scan_alerts: if disabled, short-circuit with 0 unread then close.
  try {
    const eff = await getEffectiveUserSettings(userId)
    if (eff.scan_alerts === false) {
      const payload = `event: unread\n` + `data: {"unread":0,"disabled":true}\n\n`
      return new Response(payload, { status: 200, headers: { 'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'close' } })
    }
  } catch (e) {
    // Fail-open (continue streaming)
    console.warn('[SSE_SCAN_ALERTS_TOGGLE_LOAD_FAIL]', e)
  }
  let closed = false
  let tickTimer: NodeJS.Timeout | null = null
  let keepAliveTimer: NodeJS.Timeout | null = null

  const sendUnread = async (enqueue: (s: string) => void, shutdown: () => void) => {
    if (closed) return
    try {
      const unread = await countUnread(userId)
      enqueue(`event: unread\n`)
      enqueue(`data: {"unread":${unread}}\n\n`)
    } catch (e) {
      enqueue(`event: error\n`)
      enqueue(`data: "fetch_failed"\n\n`)
      shutdown()
    }
  }

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (val: string) => {
        if (closed) return
        try { controller.enqueue(encoder.encode(val)) } catch { /* swallow */ }
      }
      const shutdown = () => {
        if (closed) return
        closed = true
        if (tickTimer) clearInterval(tickTimer)
        if (keepAliveTimer) clearInterval(keepAliveTimer)
        try { controller.close() } catch { /* ignore */ }
      }

      // Initial flush
      sendUnread(enqueue, shutdown)
      tickTimer = setInterval(() => sendUnread(enqueue, shutdown), 15000)
      keepAliveTimer = setInterval(() => enqueue(`: keep-alive\n\n`), 30000)

      // Abort support
      const abortHandler = () => shutdown()
      // @ts-ignore optional chaining for environments without signal
      req.signal?.addEventListener?.('abort', abortHandler)
      // @ts-ignore expose for internal debugging
      controller._onClose = shutdown
    },
    cancel() {
      if (!closed) {
        closed = true
        if (tickTimer) clearInterval(tickTimer)
        if (keepAliveTimer) clearInterval(keepAliveTimer)
      }
    }
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  })
}
