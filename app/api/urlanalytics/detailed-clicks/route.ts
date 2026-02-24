import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authService } from '@/lib/auth/authService'
import { withPermission } from '@/lib/ensurePermission'

// Type definitions for database rows
interface DetailedClickRow {
  id: string;
  url_id: string;
  clicked_at: string;
  ip_address: string;
  user_agent: string;
  referer: string;
  country: string;
  city: string;
  device: string;
  browser: string;
  os: string;
  short_url: string;
  original_url: string;
}

// Helper function to get user from request
async function getUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.cookies.get('scanly_auth')?.value
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) return null
    return await authService.verifyToken(token)
  } catch {
    return null
  }
}

export const GET = withPermission({ resource: 'url_analytics', action: 'read' }, async (request: NextRequest) => {
  try {
    // Check user authentication
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Check if user is admin - if admin, get all data; if not, filter by user
    const isAdmin = user.role === 'admin' || user.role === 'administrator';

  const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const urlId = searchParams.get('urlId')
    const limit = parseInt(searchParams.get('limit') || '100')
  const includeMeta = searchParams.get('meta') === '1'
    
    console.log(`[URL DETAILED CLICKS API] Getting data for ${isAdmin ? 'ADMIN' : 'USER'}: ${user.email}`)
    
    console.warn(`[URL DETAILED CLICKS API] 🔥 GET DETAILED CLICKS from database!`)
    console.warn(`[URL DETAILED CLICKS API] Params:`, { startDate, endDate, urlId, limit })

    // Build dynamic WHERE clause
    const whereConditions: string[] = []
    const params: unknown[] = []
    let paramIndex = 1

    // Date filtering
    if (startDate && endDate) {
      whereConditions.push(`COALESCE(ce.created_at, uca.clicked_at) >= $${paramIndex}`)
      params.push(startDate)
      paramIndex++
      
      whereConditions.push(`COALESCE(ce.created_at, uca.clicked_at) <= $${paramIndex}`)
      params.push(endDate)
      paramIndex++
    } else {
      // Default to last 30 days if no date range provided
      whereConditions.push(`COALESCE(ce.created_at, uca.clicked_at) >= NOW() - INTERVAL '30 days'`)
    }

    // URL filtering
    if (urlId && urlId !== 'all') {
      whereConditions.push(`(ce.short_url_id = $${paramIndex} OR uca.url_id = $${paramIndex})`)
      params.push(urlId)
      paramIndex++
    }

    // Admin privilege: if not admin, only show user's own URLs
    if (!isAdmin) {
      whereConditions.push(`su.user_id = $${paramIndex}`)
      params.push(user.userId)
      paramIndex++
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Complex query to get detailed click events from both tables
    const query = `
      SELECT DISTINCT
        COALESCE(ce.id::text, uca.id::text) as id,
        COALESCE(ce.short_url_id::text, uca.url_id::text) as url_id,
        su.title as url_title,
        uc.name as url_category,
        su.original_url,
        su.short_url,
        COALESCE(ce.created_at, uca.clicked_at) as clicked_at,
        -- Location data
        COALESCE(ce.country, (uca.location->>'country_name')::text) as country,
        COALESCE(ce.city, (uca.location->>'city')::text) as city,
        -- Device data
        COALESCE(ce.device_type, (uca.device->>'type')::text) as device_type,
        COALESCE(ce.os, (uca.device->>'os')::text) as os,
        COALESCE(ce.browser, (uca.device->>'browser')::text) as browser,
        -- Additional data
        COALESCE(ce.user_agent, uca.user_agent) as user_agent,
        COALESCE(ce.referer, uca.referrer) as referrer,
        COALESCE(ce.ip_address::text, uca.ip_address::text) as ip_address
      FROM click_events ce
      FULL OUTER JOIN url_click_analytics uca ON ce.short_url_id = uca.url_id
      LEFT JOIN short_urls su ON COALESCE(ce.short_url_id, uca.url_id) = su.id
      LEFT JOIN url_categories uc ON su.category_id = uc.id
      ${whereClause}
      ORDER BY COALESCE(ce.created_at, uca.clicked_at) DESC
      LIMIT $${paramIndex}
    `
    
    params.push(limit)
    
    console.warn(`[URL DETAILED CLICKS API] Executing query with ${params.length} parameters`)
    // Prisma tidak mendukung placeholder numerik $1,$2 dalam string mentah secara otomatis.
    // Kita substitusi aman manual karena jumlah parameter kecil dan dikontrol (bukan user direct SQL).
    // Gunakan mapping untuk tipe Date / string agar di-quote benar.
    const serializedParams = params.map(p => {
      if (p === null || p === undefined) return 'NULL';
      if (typeof p === 'number') return p.toString();
      // ISO date string detection
      if (p instanceof Date) return `'${p.toISOString()}'`;
      return `'${String(p).replace(/'/g, "''")}'`;
    });
    const finalSql = query.replace(/\$(\d+)/g, (_, idx) => serializedParams[Number(idx)-1] ?? 'NULL');
    const result = await prisma.$queryRawUnsafe<any[]>(finalSql)
    
    // Transform data to match interface
  const detailedClicks = (result as any[]).map(row => ({
      id: row.id,
      urlId: row.url_id,
      urlTitle: row.url_title || 'Untitled URL',
      urlCategory: row.url_category || 'Uncategorized',
      originalUrl: row.original_url || '',
      shortUrl: row.short_url || '',
      clickedAt: row.clicked_at?.toISOString() || new Date().toISOString(),
      location: {
        country: row.country || 'Unknown',
        city: row.city || 'Unknown'
      },
      device: {
        type: row.device_type === 'mobile' ? 'mobile' : 
              row.device_type === 'tablet' ? 'tablet' : 
              row.device_type === 'desktop' ? 'desktop' : 'desktop',
        os: row.os || 'Unknown',
        browser: row.browser || 'Unknown'
      }
    }))

    console.warn(`[URL DETAILED CLICKS API] ✅ FOUND ${detailedClicks.length} DETAILED CLICKS from database!`)
    console.warn(`[URL DETAILED CLICKS API] 🔍 Sample click:`, detailedClicks[0] || 'No data')

    if (!includeMeta) {
      return NextResponse.json(detailedClicks)
    }

    // Build lightweight filterOptions from current result (fallback if filters endpoint not called)
    const norm = (v: string | undefined) => (v || 'Unknown').trim()
    const devices = Array.from(new Set(detailedClicks.map(c => norm(c.device.type)))).sort()
    const countries = Array.from(new Set(detailedClicks.map(c => norm(c.location.country)).filter(c => c !== 'Unknown'))).sort()
    const cities = Array.from(new Set(detailedClicks.map(c => norm(c.location.city)).filter(c => c !== 'Unknown'))).sort()
    const browsers = Array.from(new Set(detailedClicks.map(c => norm(c.device.browser)).filter(c => c !== 'Unknown'))).sort()
    const operatingSystems = Array.from(new Set(detailedClicks.map(c => norm(c.device.os)).filter(c => c !== 'Unknown'))).sort()

    return NextResponse.json({
      data: detailedClicks,
      filterOptions: { devices, countries, cities, browsers, operatingSystems }
    })
    
  } catch (_error) {
    console.error('[URL DETAILED CLICKS API] Error:', _error)
    return NextResponse.json(
      { _error: 'Failed to fetch detailed click data' },
      { status: 500 }
    )
  }
})
