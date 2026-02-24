import { NextRequest, NextResponse } from "next/server"
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId, isAdministrator } from '@/lib/auth'
import { withPermission } from '@/lib/ensurePermission'

console.warn("[QR CODES API] Loading route (Prisma version)...")

export const GET = withPermission({ resource: 'qr_code', action: 'read' }, async (request: NextRequest) => {
  console.warn("[QR CODES API] GET - Fetching QR codes with unified data from qr_codes and qr_migration")
  
  try {
    // ✅ Clean authentication check
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login first.' },
        { status: 401 }
      )
    }

  // Use centralized auth helper (already Prisma-based) instead of local raw SQL
  const isAdmin = await isAdministrator(request)

    // Parse search params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const status = searchParams.get('status') || 'all' // all, active, inactive
    const sortBy = searchParams.get('sortBy') || 'newest' // newest, oldest, most_scanned, least_scanned, name_asc, name_desc

    console.warn(`[QR CODES API] Params: page=${page}, limit=${limit}, category=${category}, search=${search}, status=${status}, sortBy=${sortBy}`)

    const params: any[] = []
    let paramCount = 0

    // Build the base UNION query
    let unionQuery = `
      (
        SELECT 
          qr.id,
          qr.name,
          qr.type,
          qr.content,
          qr.is_dynamic as "isDynamic",
          qr.tags,
          qr.scans,
          qr.is_active as "isActive",
          qr.expires_at as "expiresAt",
          qr.max_scans as "maxScans",
          CASE 
            WHEN qr.qr_code_data LIKE 'data:%' THEN qr.qr_code_data
            WHEN qr.qr_code_data LIKE '%<svg%' THEN qr.qr_code_data
            ELSE null
          END as "qrCodeData",
          qr.customization,
          qr.user_id as "userId",
          qr.category_id as "categoryId",
          qr.created_at as "createdAt",
          qr.updated_at as "updatedAt",
          cat.name as "categoryName",
          cat.color as "categoryColor",
          'qr_code' as source_type
        FROM qr_codes qr
        LEFT JOIN qr_categories cat ON qr.category_id = cat.id
        WHERE NOT EXISTS (SELECT 1 FROM qr_migration qm_dup WHERE qm_dup.id = qr.id)
      )
      UNION ALL
      (
        SELECT 
          qm.id,
          qm.name,
          'url' as type,
          qm.redirect_url as content,
          true as "isDynamic",
          '[]'::jsonb as tags,
          qm.scans,
          CASE WHEN qm.status = 'active' THEN true ELSE false END as "isActive",
          null as "expiresAt",
          null as "maxScans",
          CASE 
            WHEN qm.qr_image LIKE 'data:%' THEN qm.qr_image
            WHEN qm.qr_image LIKE '%<svg%' THEN qm.qr_image
            WHEN qm.qr_image LIKE '/uploads/%' OR qm.qr_image LIKE '/public/%' THEN qm.qr_image
            ELSE null
          END as "qrCodeData",
          json_build_object(
            'key', qm.key,
            'redirect_url', qm.redirect_url,
            'url_update', qm.url_update,
            'migration', true,
            'qr_image_path', qm.qr_image
          )::jsonb as customization,
          qm.user_id as "userId",
          qm.category_id as "categoryId",
          qm.created_at as "createdAt",
          qm.updated_at as "updatedAt",
          cat.name as "categoryName",
          cat.color as "categoryColor",
          'migration' as source_type
        FROM qr_migration qm
        LEFT JOIN qr_categories cat ON qm.category_id = cat.id
      )
    `

    // Build WHERE conditions for the outer query
    const whereConditions: string[] = []

    // For non-admin users, filter by user_id. Admin can see all data.
    if (!isAdmin && userId) {
      paramCount++
      whereConditions.push(`"userId" = $${paramCount}`)
      params.push(userId)
    }

    // Add category filter
    if (category && category !== 'all') {
      paramCount++
      whereConditions.push(`"categoryId" = $${paramCount}`)
      params.push(category)
    }

    // Add search filter
    if (search && search.trim()) {
      paramCount++
      whereConditions.push(`(name ILIKE $${paramCount} OR content ILIKE $${paramCount})`)
      params.push(`%${search.trim()}%`)
    }

    // Add status filter
    if (status && status !== 'all') {
      if (status === 'active') {
        whereConditions.push(`"isActive" = true`)
        console.warn("[QR CODES API] ✅ Adding ACTIVE filter")
      } else if (status === 'inactive') {
        whereConditions.push(`"isActive" = false`)
        console.warn("[QR CODES API] ✅ Adding INACTIVE filter")
      }
    }

    // Construct the complete query with subquery
    let sqlQuery = `SELECT * FROM (${unionQuery}) AS combined_qr`
    
    if (whereConditions.length > 0) {
      sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`
    }

    // Add sorting based on sortBy parameter
    let orderByClause = ''
    switch (sortBy) {
      case 'newest':
        orderByClause = 'ORDER BY "createdAt" DESC'
        break
      case 'oldest':
        orderByClause = 'ORDER BY "createdAt" ASC'
        break
      case 'most_scanned':
        orderByClause = 'ORDER BY scans DESC, "createdAt" DESC'
        break
      case 'least_scanned':
        orderByClause = 'ORDER BY scans ASC, "createdAt" DESC'
        break
      case 'name_asc':
        orderByClause = 'ORDER BY name ASC'
        break
      case 'name_desc':
        orderByClause = 'ORDER BY name DESC'
        break
      default:
        orderByClause = 'ORDER BY "createdAt" DESC'
    }
    
    sqlQuery += ` ${orderByClause}`

    // Add pagination
    const offset = (page - 1) * limit
    paramCount++
    sqlQuery += ` LIMIT $${paramCount}`
    params.push(limit)
    
    paramCount++
    sqlQuery += ` OFFSET $${paramCount}`
    params.push(offset)

    // DEBUG: Log final query and parameters (Prisma raw)
    console.warn("[QR CODES API] (Prisma) Final Query:", sqlQuery)
    console.warn("[QR CODES API] (Prisma) Parameters:", params)

    // Execute the main query (manual interpolation + fallback)
    const serializeParam = (v: any) => {
      if (v === null || v === undefined) return 'NULL'
      if (typeof v === 'number') return v.toString()
      if (typeof v === 'boolean') return v ? 'true' : 'false'
      if (v instanceof Date) return `'${v.toISOString().replace(/'/g, "''")}'`
      return `'${String(v).replace(/'/g, "''")}'`
    }
    const finalSql = sqlQuery.replace(/\$(\d+)/g, (_m, i) => serializeParam(params[Number(i)-1]))
  console.warn('[QR CODES API] (Prisma) Transformed Final SQL (first 400 chars):', finalSql.slice(0,400))
    let qrCodes: any[] = []
    try {
      qrCodes = await prisma.$queryRawUnsafe(finalSql)
    } catch (rawErr: any) {
      console.error('[QR CODES API] Raw UNION query failed, fallback to prisma.qr_codes.findMany()', rawErr?.message)
      const fallbackWhere: any = {}
      if (!isAdmin) fallbackWhere.user_id = userId
      if (category && category !== 'all') fallbackWhere.category_id = category
      if (search && search.trim()) fallbackWhere.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { content: { contains: search.trim(), mode: 'insensitive' } }
      ]
      if (status && status !== 'all') fallbackWhere.is_active = status === 'active'
      const order: any = (() => {
        switch (sortBy) {
          case 'oldest': return { created_at: 'asc' }
          case 'most_scanned': return [{ scans: 'desc' as const }, { created_at: 'desc' as const }]
          case 'least_scanned': return [{ scans: 'asc' as const }, { created_at: 'desc' as const }]
          case 'name_asc': return { name: 'asc' }
          case 'name_desc': return { name: 'desc' }
          default: return { created_at: 'desc' }
        }
      })()
      qrCodes = await prisma.qr_codes.findMany({
        where: fallbackWhere,
        orderBy: Array.isArray(order) ? order : [order],
        skip: offset,
        take: limit,
        include: { qr_categories: { select: { name: true, color: true } } }
      }) as any
      qrCodes = qrCodes.map((qr: any) => ({
        id: qr.id,
        name: qr.name,
        type: qr.type,
        content: qr.content,
        isDynamic: qr.is_dynamic,
        tags: qr.tags,
        scans: qr.scans,
        isActive: qr.is_active,
        expiresAt: qr.expires_at,
        maxScans: qr.max_scans,
        qrCodeData: qr.qr_code_data,
        customization: qr.customization,
        userId: qr.user_id,
        categoryId: qr.category_id,
        createdAt: qr.created_at,
        updatedAt: qr.updated_at,
        categoryName: qr.qr_categories?.name || null,
        categoryColor: qr.qr_categories?.color || null,
        source_type: 'qr_code'
      }))
    }

    // Enrich with creator user name (avoid front-end showing generic 'Administrator')
    try {
      const distinctUserIds = Array.from(new Set(qrCodes.map((q: any) => q.userId).filter(Boolean)))
      if (distinctUserIds.length > 0) {
        const users = await prisma.users.findMany({
          where: { id: { in: distinctUserIds } },
          select: { id: true, name: true, email: true }
        })
        const userMap: Record<string,string|undefined> = {}
        for (const u of users) userMap[u.id] = u.name || u.email || undefined
        qrCodes = qrCodes.map((q: any) => ({ ...q, userName: userMap[q.userId] }))
      }
    } catch (enrichErr) {
      console.warn('[QR CODES API] Failed enriching user names:', (enrichErr as any)?.message)
    }

    // Count query (with fallback)
    let total = 0
    try {
      let countQuery = `SELECT COUNT(*) as total FROM (${unionQuery}) AS combined_qr`
      const countParams: any[] = []
      if (whereConditions.length > 0) {
        countQuery += ` WHERE ${whereConditions.join(' AND ')}`
        countParams.push(...params.slice(0, params.length - 2))
      }
      const finalCountSql = countQuery.replace(/\$(\d+)/g, (_m, i) => serializeParam(countParams[Number(i)-1]))
      const countRows: Array<{ total: string }> = await prisma.$queryRawUnsafe(finalCountSql)
      total = parseInt(countRows[0]?.total || '0')
    } catch (countErr: any) {
      console.error('[QR CODES API] Count fallback using prisma.qr_codes.count()', countErr?.message)
      const fallbackCountWhere: any = {}
      if (!isAdmin) fallbackCountWhere.user_id = userId
      if (category && category !== 'all') fallbackCountWhere.category_id = category
      if (search && search.trim()) fallbackCountWhere.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { content: { contains: search.trim(), mode: 'insensitive' } }
      ]
      if (status && status !== 'all') fallbackCountWhere.is_active = status === 'active'
      total = await prisma.qr_codes.count({ where: fallbackCountWhere })
    }
    const totalPages = Math.ceil(total / limit)

    const pagination = {
      total,
      page,
      pages: totalPages,
      limit,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }

    console.warn(`[QR CODES API]  Found ${qrCodes.length} QR codes (${total} total)`)

    return NextResponse.json({
      success: true,
      qrCodes,
      pagination,
      sortingOptions: {
        current: sortBy,
        available: [
          { value: 'newest', label: 'Terbaru' },
          { value: 'oldest', label: 'Terlama' },
          { value: 'most_scanned', label: 'Paling Banyak Discan' },
          { value: 'least_scanned', label: 'Paling Sedikit Discan' },
          { value: 'name_asc', label: 'Nama A-Z' },
          { value: 'name_desc', label: 'Nama Z-A' }
        ]
      },
      message: `Found ${qrCodes.length} QR codes`
    })

  } catch (error: any) {
    console.error('[QR CODES API]  Error in GET:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch QR codes',
        details: error.message 
      },
      { status: 500 }
    )
  }
})

export const POST = withPermission({ resource: 'qr_code', action: 'create' }, async (request: NextRequest) => {
  console.warn("[QR CODES API] POST - Creating new QR code")
  
  try {
    // ✅ Clean authentication check
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login first.' },
        { status: 401 }
      )
    }

  const body = await request.json()
  const { name, content, type = 'url', tags = [], categoryId, tracked } = body as any

    // Validation
    if (!name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      )
    }

    // Determine tracking mode
    const isUrlType = type === 'url'
    const trackedFinal: boolean = isUrlType ? (tracked === undefined ? true : !!tracked) : false

    // Step 1: create base record first (placeholder qr_code_data) for ID reference
    let newQRCode = await prisma.qr_codes.create({
      data: {
        name,
        content, // always store original target content here
        type,
        tags: tags as any,
        category_id: categoryId || null,
        user_id: userId,
        qr_code_data: '', // temporary
        is_dynamic: trackedFinal, // reflect tracking decision
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    // Step 2: build final QR payload (tracking or direct)
    const origin = request.nextUrl.origin
    let trackingUrl: string | null = null
    let qrPayload = content
    if (trackedFinal) {
      trackingUrl = `${origin}/api/qr/${newQRCode.id}?utm_source=qr_direct`
      qrPayload = trackingUrl
    }

    // Step 3: generate SVG for the chosen payload
    let generatedSvg: string = ''
    try {
      generatedSvg = await QRCode.toString(qrPayload, {
        type: 'svg',
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' }
      })
    } catch (svgErr) {
      console.warn('[QR CODES API] ⚠️ Failed generating SVG, leaving empty', svgErr)
    }

    // Step 4: update record with final svg & dynamic flag (if changed)
    if (generatedSvg) {
      newQRCode = await prisma.qr_codes.update({
        where: { id: newQRCode.id },
        data: { qr_code_data: generatedSvg, is_dynamic: trackedFinal, updated_at: new Date() }
      })
    }

    console.warn(`[QR CODES API]  Created QR code: ${newQRCode.id}`)

    return NextResponse.json({
      success: true,
      qrCode: newQRCode,
      tracked: trackedFinal,
      trackingUrl: trackingUrl,
      directTarget: content,
      message: trackedFinal ? 'QR code created with tracking redirect' : 'QR code created (direct target)'
    }, { status: 201 })

  } catch (error: any) {
    console.error('[QR CODES API]  Error in POST:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create QR code',
        details: error.message 
      },
      { status: 500 }
    )
  }
})