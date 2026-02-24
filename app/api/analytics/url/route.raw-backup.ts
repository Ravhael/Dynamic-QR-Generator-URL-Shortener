// Backup of the original raw SQL implementation of URL analytics prior to Prisma migration.
// Retained temporarily for rollback/reference. Do NOT modify during Prisma migration validation.
// If migration validated, this file can be deleted.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database/client'
import { authService } from '@/lib/auth/authService'
import { getToken } from 'next-auth/jwt'

async function getUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.cookies.get('scanly_auth')?.value
    const token = authHeader?.replace('Bearer ', '')
    if (token) {
      const payload = authService.verifyToken(token)
      if (payload) {
        const user = await authService.getUserById(payload.userId)
        if (user) return user
      }
    }
    const nextAuthToken = await getToken({ req: request as any })
    if (nextAuthToken?.id) {
      return {
        id: String(nextAuthToken.id),
        name: nextAuthToken.name || '',
        email: nextAuthToken.email || '',
        role: (nextAuthToken.role as string) || 'user',
        avatar: undefined,
        is_active: true,
        group_id: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    return null
  } catch (error) {
    console.error('[AUTH] Error getting user from request:', error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    const isAdmin = user.role === 'admin';
    const analyticsData = {
      totalUrls: 0,
      totalClicks: 0,
      activeUrls: 0,
      clicksOverTime: [] as Array<{ date: string; count: number }> ,
      clicksByDay: [] as Array<{ date: string; count: number }> ,
      clicksByDevice: [] as Array<{ device: string; count: number }> ,
      clicksByLocation: [] as Array<{ location: string; count: number }> ,
      clicksByOS: [] as Array<{ os: string; count: number }> ,
      clicksByIp: [] as Array<{ ip: string; count: number }> ,
      topUrls: [] as Array<{ id: string; title: string; short_code: string; original_url: string; count: number }> ,
      avgClicksPerUrl: 0,
      dailyAverage: 0
    };
    const tableCheck = await db.query(`
      SELECT 
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'short_urls') AS has_short_urls,
        EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'url_click_analytics') AS has_url_click_analytics
    `)
    const hasShortUrlsTable = Boolean(tableCheck.rows?.[0]?.has_short_urls)
    const hasAnalyticsTable = Boolean(tableCheck.rows?.[0]?.has_url_click_analytics)
    if (!hasShortUrlsTable) {
      return NextResponse.json(analyticsData, { status: 200 })
    }
    let urlIdCol: 'url_id' | 'short_url_id' | null = null
    let hasDevice = false, hasLocation = false, hasUserAgent = false, hasIp = false, hasClickedAt = false
    if (hasAnalyticsTable) {
      const colCheck = await db.query(`
        SELECT 
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'url_click_analytics' AND column_name = 'url_id') AS has_url_id,
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'url_click_analytics' AND column_name = 'short_url_id') AS has_short_url_id,
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'url_click_analytics' AND column_name = 'device') AS has_device,
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'url_click_analytics' AND column_name = 'location') AS has_location,
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'url_click_analytics' AND column_name = 'user_agent') AS has_user_agent,
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'url_click_analytics' AND column_name = 'ip_address') AS has_ip,
          EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'url_click_analytics' AND column_name = 'clicked_at') AS has_clicked_at
      `)
      const r = colCheck.rows?.[0]
      const hasUrlId = Boolean(r?.has_url_id)
      const hasShortUrlId = Boolean(r?.has_short_url_id)
      hasDevice = Boolean(r?.has_device)
      hasLocation = Boolean(r?.has_location)
      hasUserAgent = Boolean(r?.has_user_agent)
      hasIp = Boolean(r?.has_ip)
      hasClickedAt = Boolean(r?.has_clicked_at)
      if (hasUrlId) urlIdCol = 'url_id'; else if (hasShortUrlId) urlIdCol = 'short_url_id'
    }
    const urlCountQuery = isAdmin ? `SELECT COUNT(*) as count FROM short_urls WHERE is_active = true` : `SELECT COUNT(*) as count FROM short_urls WHERE user_id = $1 AND is_active = true`;
    const urlCountResult = isAdmin ? await db.query(urlCountQuery) : await db.query(urlCountQuery, [user.id]);
    analyticsData.totalUrls = parseInt(urlCountResult.rows[0].count) || 0;
    const activeUrlsQuery = isAdmin ? `SELECT COUNT(*) as count FROM short_urls WHERE is_active = true` : `SELECT COUNT(*) as count FROM short_urls WHERE user_id = $1 AND is_active = true`;
    const activeUrlsResult = isAdmin ? await db.query(activeUrlsQuery) : await db.query(activeUrlsQuery, [user.id]);
    analyticsData.activeUrls = parseInt(activeUrlsResult.rows[0].count) || 0;
    if (hasAnalyticsTable && urlIdCol) {
      const totalClicksQuery = isAdmin ? `SELECT COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id` : `SELECT COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id WHERE su.user_id = $1`;
      const totalClicksResult = isAdmin ? await db.query(totalClicksQuery) : await db.query(totalClicksQuery, [user.id]);
      analyticsData.totalClicks = parseInt(totalClicksResult.rows[0]?.count) || 0;
    }
    if (hasAnalyticsTable && urlIdCol && hasClickedAt) {
      const clicksByDayQuery = isAdmin ? `SELECT DATE(ce.clicked_at) as date, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id WHERE ce.clicked_at >= NOW() - INTERVAL '30 days' GROUP BY DATE(ce.clicked_at) ORDER BY date DESC` : `SELECT DATE(ce.clicked_at) as date, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id WHERE su.user_id = $1 AND ce.clicked_at >= NOW() - INTERVAL '30 days' GROUP BY DATE(ce.clicked_at) ORDER BY date DESC`;
      const clicksByDayResult = isAdmin ? await db.query(clicksByDayQuery) : await db.query(clicksByDayQuery, [user.id]);
      analyticsData.clicksByDay = clicksByDayResult.rows.map((row:any) => ({ date: row.date, count: parseInt(row.count) }));
      analyticsData.clicksOverTime = analyticsData.clicksByDay;
    }
    if (hasAnalyticsTable && urlIdCol) {
      if (hasDevice) {
        const q = isAdmin ? `SELECT COALESCE(ce.device->>'type', 'Unknown') as device, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id GROUP BY 1 ORDER BY count DESC` : `SELECT COALESCE(ce.device->>'type', 'Unknown') as device, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id WHERE su.user_id = $1 GROUP BY 1 ORDER BY count DESC`;
        const r = isAdmin ? await db.query(q) : await db.query(q, [user.id])
        analyticsData.clicksByDevice = r.rows.map((row:any) => ({ device: row.device, count: parseInt(row.count) }))
      } else if (hasUserAgent) {
        const q = isAdmin ? `SELECT CASE WHEN ce.user_agent ILIKE '%Mobile%' OR ce.user_agent ILIKE '%Android%' OR ce.user_agent ILIKE '%iPhone%' THEN 'mobile' WHEN ce.user_agent ILIKE '%iPad%' OR ce.user_agent ILIKE '%Tablet%' THEN 'tablet' ELSE 'desktop' END AS device, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id GROUP BY 1 ORDER BY count DESC` : `SELECT CASE WHEN ce.user_agent ILIKE '%Mobile%' OR ce.user_agent ILIKE '%Android%' OR ce.user_agent ILIKE '%iPhone%' THEN 'mobile' WHEN ce.user_agent ILIKE '%iPad%' OR ce.user_agent ILIKE '%Tablet%' THEN 'tablet' ELSE 'desktop' END AS device, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id WHERE su.user_id = $1 GROUP BY 1 ORDER BY count DESC`;
        const r = isAdmin ? await db.query(q) : await db.query(q, [user.id])
        analyticsData.clicksByDevice = r.rows.map((row:any) => ({ device: row.device, count: parseInt(row.count) }))
      }
    }
    if (hasAnalyticsTable && urlIdCol && hasLocation) {
      const q = isAdmin ? `SELECT COALESCE(ce.location->>'country', 'Unknown') as location, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id WHERE ce.location IS NOT NULL GROUP BY 1 ORDER BY count DESC LIMIT 10` : `SELECT COALESCE(ce.location->>'country', 'Unknown') as location, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id WHERE su.user_id = $1 AND ce.location IS NOT NULL GROUP BY 1 ORDER BY count DESC LIMIT 10`;
      const r = isAdmin ? await db.query(q) : await db.query(q, [user.id])
      analyticsData.clicksByLocation = r.rows.map((row:any) => ({ location: row.location, count: parseInt(row.count) }))
    }
    const topUrlsQuery = isAdmin ? `SELECT su.id, su.title, su.short_code, su.original_url, su.category_id, COUNT(ce.id) as count FROM short_urls su LEFT JOIN url_click_analytics ce ON ${hasAnalyticsTable && urlIdCol ? 'su.id = ce.' + urlIdCol : 'FALSE'} WHERE su.is_active = true GROUP BY su.id, su.title, su.short_code, su.original_url, su.category_id ORDER BY count DESC LIMIT 10` : `SELECT su.id, su.title, su.short_code, su.original_url, su.category_id, COUNT(ce.id) as count FROM short_urls su LEFT JOIN url_click_analytics ce ON ${hasAnalyticsTable && urlIdCol ? 'su.id = ce.' + urlIdCol : 'FALSE'} WHERE su.user_id = $1 AND su.is_active = true GROUP BY su.id, su.title, su.short_code, su.original_url, su.category_id ORDER BY count DESC LIMIT 10`;
    const topUrlsResult = isAdmin ? await db.query(topUrlsQuery) : await db.query(topUrlsQuery, [user.id]);
    analyticsData.topUrls = topUrlsResult.rows.map((row:any) => ({ id: row.id, title: row.title, short_code: row.short_code, original_url: row.original_url, category_id: row.category_id, count: parseInt(row.count) }));
    if (hasAnalyticsTable && urlIdCol) {
      if (hasDevice) {
        const q = isAdmin ? `SELECT COALESCE(ce.device->>'os', 'Unknown') as os, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id GROUP BY 1 ORDER BY count DESC LIMIT 10` : `SELECT COALESCE(ce.device->>'os', 'Unknown') as os, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id WHERE su.user_id = $1 GROUP BY 1 ORDER BY count DESC LIMIT 10`;
        const r = isAdmin ? await db.query(q) : await db.query(q, [user.id])
        analyticsData.clicksByOS = r.rows.map((row:any) => ({ os: row.os, count: parseInt(row.count) }))
      } else if (hasUserAgent) {
        const q = isAdmin ? `SELECT CASE WHEN ce.user_agent ILIKE '%Windows%' THEN 'Windows' WHEN ce.user_agent ILIKE '%Android%' THEN 'Android' WHEN ce.user_agent ILIKE '%iPhone%' OR ce.user_agent ILIKE '%iPad%' OR ce.user_agent ILIKE '%iOS%' THEN 'iOS' WHEN ce.user_agent ILIKE '%Mac OS X%' OR ce.user_agent ILIKE '%Macintosh%' THEN 'macOS' WHEN ce.user_agent ILIKE '%Linux%' THEN 'Linux' ELSE 'Other' END AS os, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id GROUP BY 1 ORDER BY count DESC LIMIT 10` : `SELECT CASE WHEN ce.user_agent ILIKE '%Windows%' THEN 'Windows' WHEN ce.user_agent ILIKE '%Android%' THEN 'Android' WHEN ce.user_agent ILIKE '%iPhone%' OR ce.user_agent ILIKE '%iPad%' OR ce.user_agent ILIKE '%iOS%' THEN 'iOS' WHEN ce.user_agent ILIKE '%Mac OS X%' OR ce.user_agent ILIKE '%Macintosh%' THEN 'macOS' WHEN ce.user_agent ILIKE '%Linux%' THEN 'Linux' ELSE 'Other' END AS os, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id WHERE su.user_id = $1 GROUP BY 1 ORDER BY count DESC LIMIT 10`;
        const r = isAdmin ? await db.query(q) : await db.query(q, [user.id])
        analyticsData.clicksByOS = r.rows.map((row:any) => ({ os: row.os, count: parseInt(row.count) }))
      }
    }
    if (hasAnalyticsTable && urlIdCol && hasIp) {
      const q = isAdmin ? `SELECT COALESCE(ce.ip_address::text, 'Unknown') as ip, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id GROUP BY ce.ip_address ORDER BY count DESC LIMIT 15` : `SELECT COALESCE(ce.ip_address::text, 'Unknown') as ip, COUNT(*) as count FROM url_click_analytics ce INNER JOIN short_urls su ON ce.${urlIdCol} = su.id WHERE su.user_id = $1 GROUP BY ce.ip_address ORDER BY count DESC LIMIT 15`;
      const r = isAdmin ? await db.query(q) : await db.query(q, [user.id])
      analyticsData.clicksByIp = r.rows.map((row:any) => ({ ip: row.ip, count: parseInt(row.count) }))
    }
    analyticsData.avgClicksPerUrl = analyticsData.totalUrls > 0 ? Math.round(analyticsData.totalClicks / analyticsData.totalUrls) : 0;
    analyticsData.dailyAverage = analyticsData.clicksByDay.length > 0 ? Math.round(analyticsData.totalClicks / analyticsData.clicksByDay.length) : 0;
    return NextResponse.json(analyticsData, { status: 200 });
  } catch (error:any) {
    return NextResponse.json({ success: false, error: 'Internal server error', details: error.message }, { status: 500 })
  }
}