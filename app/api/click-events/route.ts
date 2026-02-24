import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/ensurePermission'
import { getUserFromRequest } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'

export const GET = withPermission(
  { resource: 'click_events', action: 'read' },
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url)
      let limit = parseInt(searchParams.get('limit') || '10')
      if (isNaN(limit) || limit < 1) limit = 10
      if (limit > 200) limit = 200
      const auth = await getUserFromRequest(request)
      if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      const userId = auth.userId
      const userRole = auth.userRole?.toLowerCase()
  const userGroupId = auth.userGroupId && auth.userGroupId !== 0 ? auth.userGroupId : null
      const isAdmin = !!userRole && ['admin','administrator','superadmin'].includes(userRole)

      // Quick existence guard: if click_events table is missing, return empty gracefully
      try {
        const reg: any = await prisma.$queryRaw`SELECT to_regclass('public.click_events') as reg`
        const exists = Array.isArray(reg) && reg[0]?.reg
        if (!exists) {
          return NextResponse.json({ clickEvents: [], total: 0 })
        }
      } catch {}

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      const start = Date.now()
      let rows: any[] = []
      try {
        if (isAdmin) {
          rows = await prisma.$queryRaw<any[]>`
            SELECT 
              ce.id,
              ce.url_id,
              ce.clicked_at,
              su.short_code,
              su.title,
              su.original_url
            FROM click_events ce
            JOIN short_urls su ON ce.url_id = su.id
            ORDER BY ce.clicked_at DESC
            LIMIT ${limit}
          `
        } else {
          if (!userGroupId) {
            // Per-user fallback: validate userId only when used in filter
            if (!uuidRegex.test(userId)) {
              return NextResponse.json({ clickEvents: [], total: 0 })
            }
            // Per-user fallback: list clicks for URLs owned by this user
            rows = await prisma.$queryRaw<any[]>`
              SELECT 
                ce.id,
                ce.url_id,
                ce.clicked_at,
                su.short_code,
                su.title,
                su.original_url
              FROM click_events ce
              JOIN short_urls su ON ce.url_id = su.id
              WHERE su.user_id = ${userId}::uuid
              ORDER BY ce.clicked_at DESC
              LIMIT ${limit}
            `
          } else {
            rows = await prisma.$queryRaw<any[]>`
              SELECT 
                ce.id,
                ce.url_id,
                ce.clicked_at,
                su.short_code,
                su.title,
                su.original_url
              FROM click_events ce
              JOIN short_urls su ON ce.url_id = su.id
              JOIN users u ON su.user_id = u.id
              WHERE u.group_id = ${userGroupId}
              ORDER BY ce.clicked_at DESC
              LIMIT ${limit}
            `
          }
        }
      } catch (sqlErr: any) {
        console.error('[CLICK EVENTS API] SQL Error:', sqlErr?.message, sqlErr)
        throw sqlErr
      }

      const clickEvents = rows.map(row => ({
        id: row.id,
        shortUrlId: row.url_id,
        shortCode: row.short_code,
        title: row.title,
        originalUrl: row.original_url,
        clickedAt: row.clicked_at,
        analyticsNote: 'Detailed analytics available in url_click_analytics'
      }))
      const duration = Date.now() - start
      console.warn('[CLICK EVENTS API] Success:', { count: clickEvents.length, durationMs: duration, userId, limit })
      return NextResponse.json({ clickEvents, total: clickEvents.length })
    } catch (error) {
      console.error('[CLICK EVENTS API] Error (outer):', (error as any)?.message, error)
      return NextResponse.json({ error: 'Failed to fetch click events', details: (error as any)?.message }, { status: 500 })
    }
  }
)
