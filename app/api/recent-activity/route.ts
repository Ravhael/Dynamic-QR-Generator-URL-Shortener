import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/ensurePermission'
import { getUserFromRequest } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'

export const GET = withPermission({ resource: 'analytics', action: 'read' }, async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
  let limit = parseInt(searchParams.get('limit') || '20')
  if (isNaN(limit) || limit < 1) limit = 20
  if (limit > 200) limit = 200
    
    // Get authenticated user ID
    const auth = await getUserFromRequest(request)
    if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const userId = auth.userId

    // Validate userId is a UUID (avoid operator mismatch uuid = text)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ error: 'Invalid user id format' }, { status: 400 })
    }
    
    // Query gabungan memakai prisma.$queryRaw (tagged template parameterized)
    const startTime = Date.now()
    let activityRows: any[] = []
    try {
      activityRows = await prisma.$queryRaw<any[]>`
      WITH scan_activity AS (
        SELECT 
          se.id,
          'scan' as activity_type,
          se.scanned_at as activity_time,
          qr.name as item_name,
          qr.type as item_type
        FROM scan_events se
        JOIN qr_codes qr ON se.qr_code_id = qr.id
        WHERE qr.user_id = ${userId}::uuid
      ),
      click_activity AS (
        SELECT 
          ce.id,
          'click' as activity_type,
          ce.clicked_at as activity_time,
          su.short_code as item_name,
          'url' as item_type
        FROM click_events ce
        JOIN short_urls su ON ce.url_id = su.id
        WHERE su.user_id = ${userId}::uuid
      ),
      combined_activity AS (
        SELECT * FROM scan_activity
        UNION ALL
        SELECT * FROM click_activity
      )
      SELECT * FROM combined_activity
      ORDER BY activity_time DESC
      LIMIT ${limit}
      `
    } catch (sqlErr: any) {
      console.error('[RECENT ACTIVITY API] SQL Error:', sqlErr?.message, sqlErr)
      throw sqlErr
    }

    const activities = activityRows.map(row => ({
      id: row.id,
      type: row.activity_type,
      title: row.activity_type === 'scan' 
        ? `QR Code Scanned: ${row.item_name}`
        : `Short URL Clicked: ${row.item_name}`,
      description: row.activity_type === 'scan'
        ? `${row.item_type.toUpperCase()} QR code was scanned`
        : `Short URL was accessed`,
      timestamp: row.activity_time,
      itemName: row.item_name,
      itemType: row.item_type,
      // Analytics data available in separate tables
      analyticsNote: 'Detailed analytics available in qr_scan_analytics/url_click_analytics'
    }))

  const duration = Date.now() - startTime
  console.warn('[RECENT ACTIVITY API] Returning activities:', { count: activities.length, durationMs: duration, userId, limit })
    return NextResponse.json({ 
      activity: activities,
      total: activities.length 
    })
    
  } catch (error: any) {
    console.error('[RECENT ACTIVITY API] Error (outer):', error?.message, error)
    return NextResponse.json({ error: 'Failed to fetch recent activity', details: error?.message }, { status: 500 })
  }
})
