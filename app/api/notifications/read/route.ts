import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/services/notificationService'

// POST /api/notifications/read
// { id: string } -> mark single
// { all: true }  -> mark all
export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(req)
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    if (body.all) {
      await markAllNotificationsRead(userId)
      return NextResponse.json({ status: 'ok', scope: 'all' })
    }
    if (!body.id) {
      return NextResponse.json({ error: 'id or all:true required' }, { status: 400 })
    }
    await markNotificationRead(userId, body.id)
    return NextResponse.json({ status: 'ok', scope: 'single', id: body.id })
  } catch (err) {
    console.error('[NOTIFICATIONS][READ] Error', err)
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }
}
