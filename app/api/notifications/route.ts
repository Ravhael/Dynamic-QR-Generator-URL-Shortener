import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId, isAdministrator } from '@/lib/auth'
import { listUserNotifications, listUserNotificationsCursor, createNotification } from '@/lib/services/notificationService'

// Modernized notifications endpoint using service layer (no direct raw SQL view dependency)
// Supported query params:
//  - limit: number (<=100)
//  - offset: number (legacy pagination)
//  - cursor: notification id for cursor pagination (preferred)
//  - unreadOnly: 'true' to filter unread
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 100)
    const offset = Number(searchParams.get('offset')) || 0
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const cursor = searchParams.get('cursor') || null

    if (cursor) {
      const page = await listUserNotificationsCursor({ userId, limit, cursor, unreadOnly })
      const unreadCount = page.items.filter(i => !i.isRead).length // window unread, not global
      return NextResponse.json({ items: page.items, meta: { limit, cursor, nextCursor: page.nextCursor, unreadOnly, total: page.total, unreadCountWindow: unreadCount } })
    } else {
      const items = await listUserNotifications({ userId, limit, offset, unreadOnly })
      const unreadCount = items.filter(i => !i.isRead).length
      return NextResponse.json({ items, meta: { limit, offset, unreadOnly, unreadCount } })
    }
  } catch (err: any) {
    console.error('[NOTIFICATIONS][GET] Error', err)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST /api/notifications (admin broadcast or self-targeted for normal user)
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const body = await request.json()
    if (!body?.title || !body?.message) {
      return NextResponse.json({ error: 'title and message required' }, { status: 400 })
    }
    if (body.userIds && !Array.isArray(body.userIds)) {
      return NextResponse.json({ error: 'userIds must be array' }, { status: 400 })
    }

    const isAdmin = await isAdministrator(request)
    if (!isAdmin) {
      // Force userIds to self if not admin
      body.userIds = [userId]
    }

    const id = await createNotification({
      title: body.title,
      message: body.message,
      createdBy: userId,
      category: body.category,
      priority: body.priority,
      icon: body.icon,
      color: body.color,
      actionUrl: body.actionUrl,
      actionLabel: body.actionLabel,
      userIds: body.userIds,
    })
    return NextResponse.json({ id }, { status: 201 })
  } catch (err: any) {
    console.error('[NOTIFICATIONS][POST] Error', err)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
