import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withPermission } from '@/lib/ensurePermission'
import { getUserFromRequest } from '@/lib/api-permissions'

export const GET = withPermission({ resource: 'user_analytics', action: 'read' }, async (request: NextRequest) => {
  try {
    const auth = await getUserFromRequest(request)
    if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    const userId = auth.userId
    console.log('[USER STATS API] ✅ User authenticated (Prisma):', userId);

    // Parallel aggregate queries
    const [
      qrCodesCreated,
      shortUrlsCreated,
      totalScans,
      totalClicks,
      userRecord
    ] = await Promise.all([
      prisma.qr_codes.count({ where: { user_id: userId } }),
      prisma.short_urls.count({ where: { user_id: userId } }),
      prisma.scan_events.count({ where: { qr_codes: { user_id: userId } } }),
      prisma.click_events.count({ where: { short_urls: { user_id: userId } } }),
      prisma.users.findUnique({ where: { id: userId }, select: { created_at: true } })
    ])

    // Recent scans
    const recentScans = await prisma.scan_events.findMany({
      where: { qr_codes: { user_id: userId } },
      select: { scanned_at: true, qr_codes: { select: { name: true } } },
      orderBy: { scanned_at: 'desc' },
      take: 10
    })

    // Recent clicks
    const recentClicks = await prisma.click_events.findMany({
      where: { short_urls: { user_id: userId } },
      select: { clicked_at: true, short_urls: { select: { title: true, short_code: true } } },
      orderBy: { clicked_at: 'desc' },
      take: 10
    })

    // Merge & sort by timestamp desc then slice 10
    const merged = [
      ...recentScans.map(r => ({
        type: 'qr_scan' as const,
        description: `QR Code "${r.qr_codes.name}" was scanned`,
        timestamp: r.scanned_at
      })),
      ...recentClicks.map(r => ({
        type: 'url_click' as const,
        description: `Short URL "${r.short_urls.title || r.short_urls.short_code}" was clicked`,
        timestamp: r.clicked_at
      }))
    ].sort((a, b) => (b.timestamp?.getTime() || 0) - (a.timestamp?.getTime() || 0)).slice(0, 10)

    return NextResponse.json({
      qrCodesCreated,
      shortUrlsCreated,
      totalScans,
      totalClicks,
      joinedDate: userRecord?.created_at || null,
      recentActivity: merged
    })
  } catch (error) {
    console.error('[USER STATS API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
})