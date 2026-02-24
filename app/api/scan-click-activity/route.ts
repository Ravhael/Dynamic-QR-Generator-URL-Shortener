import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import getNextAuthToken from '@/lib/getNextAuthToken'
import { isAdministrator } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withPermission } from '@/lib/ensurePermission'
import { getUserFromRequest } from '@/lib/api-permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

type ActivityType = 'scan' | 'click'

interface ActivityItem {
  id: string
  type: ActivityType
  source_id: string
  item_name: string
  item_type: string
  timestamp: Date
  ip_address: string | null
  device_type: string | null
  country: string | null
  city: string | null
}

export const GET = withPermission({ resource: 'analytics', action: 'read' }, async (request: NextRequest) => {
  try {
    // Support runtime debugging
    const { searchParams } = new URL(request.url)
    const debug = searchParams.get('debug') === '1'

    let token: any = null
    try {
      token = await getNextAuthToken(request as any)
    } catch (e: any) {
      const details = { message: e?.message, stack: e?.stack }
      console.error('[SCAN-CLICK ACTIVITY API] Token error:', details)
      const payload: any = { success: false, error: 'Not authenticated' }
      if (debug) payload.details = details
      return NextResponse.json(payload, { status: 401 })
    }
    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
    }

    // Previously restricted to admins; now permission-based. If role not admin, we still allow if permission granted.
    const auth = await getUserFromRequest(request)
    const roleLower = auth?.userRole?.toLowerCase()
    const admin = !!roleLower && ['admin','administrator','superadmin'].includes(roleLower)
    const groupId = auth?.userGroupId ?? null

    // If not admin and no group yet -> return empty items
    if (!admin && !groupId) {
      return NextResponse.json({
        success: true,
        data: { items: [], pagination: { page: 1, limit: 25, total: 0, pages: 1, nextCursor: null } }
      })
    }

    const rawPage = Number(searchParams.get('page')) // kept for backward compatibility (first page only)
    const rawLimit = Number(searchParams.get('limit'))
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(100, Math.floor(rawLimit)) : 25
    const typeParam = (searchParams.get('type') || 'all').toLowerCase()
    const q = (searchParams.get('q') || '').trim()
    const from = searchParams.get('from') || undefined
    const to = searchParams.get('to') || undefined
    const includeAnalytics = (searchParams.get('includeAnalytics') === '1' || searchParams.get('analytics') === '1')
    const cursorRaw = searchParams.get('cursor') || undefined
    const usingCursor = Boolean(cursorRaw)
    let cursorTimestamp: Date | null = null
    let cursorId: string | null = null
    if (cursorRaw) {
      try {
        const decoded = Buffer.from(cursorRaw, 'base64').toString('utf8')
        const [ts, id] = decoded.split('|')
        if (ts && id) {
          cursorTimestamp = new Date(ts)
          cursorId = id
        }
      } catch {
        // ignore malformed cursor
      }
    }

    // Construct Prisma filters
    const scanFilters: any = {}
    const clickFilters: any = {}

    // Group scoping for non-admin: only events whose owner is in same group
    if (!admin) {
      scanFilters.qr_codes = { ...(scanFilters.qr_codes || {}), users_qr_codes_user_idTousers: { group_id: groupId } }
      clickFilters.short_urls = { ...(clickFilters.short_urls || {}), users_short_urls_user_idTousers: { group_id: groupId } }
    }

    if (q) {
      scanFilters.qr_codes = { name: { contains: q, mode: 'insensitive' } }
      clickFilters.short_urls = {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { short_code: { contains: q, mode: 'insensitive' } },
          { original_url: { contains: q, mode: 'insensitive' } },
          { short_url: { contains: q, mode: 'insensitive' } }
        ]
      }
    }
    if (from) {
      scanFilters.OR = [
        { scanned_at: { gte: new Date(from) } },
        { AND: [{ scanned_at: null }, { created_at: { gte: new Date(from) } }] }
      ]
      clickFilters.OR = [
        { clicked_at: { gte: new Date(from) } },
        { AND: [{ clicked_at: null }, { created_at: { gte: new Date(from) } }] }
      ]
    }
    if (to) {
      const toDate = new Date(to)
      const addToScan = {
        OR: [
          { scanned_at: { lte: toDate } },
          { AND: [{ scanned_at: null }, { created_at: { lte: toDate } }] }
        ]
      }
      const addToClick = {
        OR: [
          { clicked_at: { lte: toDate } },
          { AND: [{ clicked_at: null }, { created_at: { lte: toDate } }] }
        ]
      }
      // Merge existing OR arrays if both from & to present
      if (scanFilters.OR) scanFilters.AND = [...(scanFilters.AND || []), addToScan]
      else Object.assign(scanFilters, addToScan)
      if (clickFilters.OR) clickFilters.AND = [...(clickFilters.AND || []), addToClick]
      else Object.assign(clickFilters, addToClick)
    }

    // Fetch counts + data (overfetch to merge fairly)
  const overfetch = limit * 2
    const needScan = typeParam === 'all' || typeParam === 'scan'
    const needClick = typeParam === 'all' || typeParam === 'click'

    // Apply cursor (keyset) if present
    if (cursorTimestamp) {
      const cursorClauseScan = {
        OR: [
          { scanned_at: { lt: cursorTimestamp } },
          { AND: [{ scanned_at: null }, { created_at: { lt: cursorTimestamp } }] },
        ],
      }
      const cursorClauseClick = {
        OR: [
          { clicked_at: { lt: cursorTimestamp } },
          { AND: [{ clicked_at: null }, { created_at: { lt: cursorTimestamp } }] },
        ],
      }
      scanFilters.AND = [...(scanFilters.AND || []), cursorClauseScan]
      clickFilters.AND = [...(clickFilters.AND || []), cursorClauseClick]
    }

    const shouldCount = !usingCursor // only first (page-based) access gets totals to avoid expensive counts each cursor page
    const [scanCount, clickCount] = await Promise.all([
  needScan && shouldCount ? prisma.scan_events.count({ where: scanFilters }) : Promise.resolve(0),
  needClick && shouldCount ? prisma.click_events.count({ where: clickFilters }) : Promise.resolve(0),
    ])

    const [scanRows, clickRows] = await Promise.all([
      needScan
        ? prisma.scan_events.findMany({
            where: scanFilters,
            take: overfetch,
            orderBy: [{ scanned_at: 'desc' }, { created_at: 'desc' }],
            select: {
              id: true,
              qr_code_id: true,
              scanned_at: true,
              created_at: true,
              qr_codes: { select: { name: true, type: true } },
            },
          })
        : Promise.resolve([]),
      needClick
        ? prisma.click_events.findMany({
            where: clickFilters,
            take: overfetch,
            orderBy: [{ clicked_at: 'desc' }, { created_at: 'desc' }],
            select: {
              id: true,
              url_id: true,
              clicked_at: true,
              created_at: true,
              short_urls: { select: { title: true, short_code: true, short_url: true, original_url: true } },
            },
          })
        : Promise.resolve([]),
    ])

    const activities: ActivityItem[] = []
    if (needScan) {
      for (const s of scanRows) {
        const ts = (s as any).scanned_at || (s as any).created_at
        activities.push({
          id: String((s as any).id),
            type: 'scan',
          source_id: String((s as any).qr_code_id),
          item_name: (s as any).qr_codes?.name || 'QR Code',
          item_type: (s as any).qr_codes?.type || 'qr',
          timestamp: ts,
          ip_address: null,
          device_type: null,
          country: null,
          city: null,
        })
      }
    }
    if (needClick) {
      for (const c of clickRows) {
        const ts = (c as any).clicked_at || (c as any).created_at
        const su = (c as any).short_urls
        const name = su?.title || su?.short_code || su?.short_url || su?.original_url || 'URL'
        const srcId = (c as any).short_url_id || (c as any).url_id
        activities.push({
          id: String((c as any).id),
          type: 'click',
          source_id: String(srcId),
          item_name: name,
          item_type: 'url',
          timestamp: ts,
          ip_address: null,
          device_type: null,
          country: null,
          city: null,
        })
      }
    }

    // Sort unified list by timestamp desc
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Merge & generate cursor next
    // Already sorted desc; if cursor provided we already fetched records < cursor
    const moreAvailable = activities.length > limit
    const pageItems = moreAvailable ? activities.slice(0, limit) : activities

    let nextCursor: string | null = null
    if (moreAvailable) {
      const last = pageItems[pageItems.length - 1]
      nextCursor = Buffer.from(`${last.timestamp.toISOString()}|${last.id}`).toString('base64')
    }

    // If analytics requested, augment items
    let finalItems = pageItems
    if (includeAnalytics && finalItems.length) {
      const scanIds: number[] = []
      const clickIds: number[] = []
      for (const i of finalItems) {
        if (i.type === 'scan') {
          const parsed = Number(i.id)
            if (!Number.isNaN(parsed)) scanIds.push(parsed)
        } else if (i.type === 'click') {
          const parsed = Number(i.id)
          if (!Number.isNaN(parsed)) clickIds.push(parsed)
        }
      }
      const [scanAnalytics, clickAnalytics] = await Promise.all([
        scanIds.length
          ? prisma.qr_scan_analytics.findMany({
              where: { scan_event_id: { in: scanIds } },
              orderBy: { scanned_at: 'desc' },
              select: { scan_event_id: true, ip_address: true, device_type: true, country: true, city: true },
            })
          : Promise.resolve([]),
        clickIds.length
          ? prisma.url_click_analytics.findMany({
              where: { click_event_id: { in: clickIds } },
              orderBy: { clicked_at: 'desc' },
              select: { click_event_id: true, ip_address: true, device_type: true, country: true, city: true },
            })
          : Promise.resolve([]),
      ])
      const scanMap = new Map<number, any>()
      for (const a of scanAnalytics) if (!scanMap.has((a as any).scan_event_id)) scanMap.set((a as any).scan_event_id, a)
      const clickMap = new Map<number, any>()
      for (const a of clickAnalytics) if (!clickMap.has((a as any).click_event_id)) clickMap.set((a as any).click_event_id, a)
      finalItems = finalItems.map(item => {
        if (item.type === 'scan') {
          const aid = Number(item.id)
          const a = scanMap.get(aid)
          if (a) {
            return { ...item, ip_address: a.ip_address, device_type: a.device_type, country: a.country, city: a.city }
          }
        } else if (item.type === 'click') {
          const aid = Number(item.id)
          const a = clickMap.get(aid)
          if (a) {
            return { ...item, ip_address: a.ip_address, device_type: a.device_type, country: a.country, city: a.city }
          }
        }
        return item
      })
    }

    const total = usingCursor ? undefined : (needScan ? scanCount : 0) + (needClick ? clickCount : 0)

    return NextResponse.json({
      success: true,
      data: {
        items: finalItems,
        pagination: usingCursor
          ? {
              limit,
              nextCursor,
              total, // only on first page (undefined afterwards)
            }
          : {
              page: Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1,
              limit,
              total: total || 0,
              pages: total ? Math.ceil(total / limit) || 1 : 1,
              nextCursor,
            },
      },
    })
  } catch (error: any) {
    const payload: any = { success: false, error: 'Failed to fetch scan/click activity' }
    const details = { message: error?.message, stack: error?.stack }
    console.error('[SCAN-CLICK ACTIVITY API] Error:', details)
    if (process.env.NODE_ENV !== 'production') {
      payload.details = details
    }
    return NextResponse.json(payload, { status: 500 })
  }
})
