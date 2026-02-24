import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/authService'
import { getToken } from 'next-auth/jwt'
import getNextAuthToken from '@/lib/getNextAuthToken'
import { prisma } from '@/lib/prisma'
import { withPermission } from '@/lib/ensurePermission'

// Helper function to get user from request
async function getUserFromRequest(request: NextRequest) {
  try {
    console.log('[AUTH] Getting user from request...')
    const authHeader = request.headers.get('authorization') || request.cookies.get('scanly_auth')?.value
    console.log('[AUTH] Auth header:', authHeader ? 'Present' : 'Missing')
    console.log('[AUTH] Cookie scanly_auth:', request.cookies.get('scanly_auth')?.value ? 'Present' : 'Missing')
    
    const token = authHeader?.replace('Bearer ', '')
    console.log('[AUTH] Token extracted:', token ? 'Present' : 'Missing')
    
    if (token) {
      const payload = authService.verifyToken(token)
      console.log('[AUTH] Token payload:', payload ? 'Valid' : 'Invalid')
      if (payload) {
        const user = await authService.getUserById(payload.userId)
        console.log('[AUTH] User found (custom JWT):', user ? user.email : 'Not found')
        if (user) return user
      }
    }

    // Fallback to NextAuth session (JWT strategy)
    const nextAuthToken = await getNextAuthToken(request as any)
    if (nextAuthToken?.id) {
      const user = {
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
      console.log('[AUTH] User resolved via NextAuth token:', user.email)
      return user
    }

    return null
  } catch (error) {
    console.error('[AUTH] Error getting user from request:', error)
    return null
  }
}

export const GET = withPermission({ resource: 'short_url', action: 'read' }, async (request: NextRequest) => {
  try {
    const user = await getUserFromRequest(request);
    if (!user) { 
      return NextResponse.json({
        success: false,
        shortUrls: [],
        pagination: { total: 0, page: 1, pages: 0, limit: 12 },
        message: 'Please login to view your short URLs'
      })
    }

    const { searchParams } = new URL(request.url) 
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '12'))
    const category = searchParams.get('category')
    const search = searchParams.get('search')?.trim()

    // Build Prisma where clause
    const where: any = {}
    if (user.role !== 'admin') {
      where.user_id = user.id
    }
    if (category && category !== 'all') { 
      where.category_id = category
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { original_url: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [items, total] = await Promise.all([
      prisma.short_urls.findMany({
        where,
        include: { url_categories: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.short_urls.count({ where })
    ])

    const pages = Math.max(1, Math.ceil(total / limit) || 1)

    const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const transformed = items.map(su => ({
      id: su.id,
      originalUrl: su.original_url,
      shortCode: su.short_code,
      shortUrl: `${baseAppUrl}/${su.short_code}`,
      title: su.title,
      description: su.description,
      clicks: su.clicks || 0,
      isActive: su.is_active,
      category: su.url_categories ? {
        id: su.url_categories.id,
        name: su.url_categories.name,
        description: su.url_categories.description || undefined
      } : null,
      createdAt: su.created_at,
      updatedAt: su.updated_at
    }))

    return NextResponse.json({
      success: true,
      shortUrls: transformed,
      pagination: {
        page,
        pages,
        total,
        limit,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    })
  } catch (error: any) {
    console.error('[SHORT URLS API][PRISMA] ❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
})

export const POST = withPermission({ resource: 'short_url', action: 'create' }, async (request: NextRequest) => {
  try {
    console.log('[POST SHORT URL] Starting request...')
    
    // Check user authentication
    const user = await getUserFromRequest(request);
    console.log('[POST SHORT URL] User from request:', user ? user.email : 'No user')
    
    if (!user) {
      console.log('[POST SHORT URL] No user found, returning 401')
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const body = await request.json()
    const { 
      originalUrl, 
      title, 
      description, 
      customCode, 
      categoryId, 
      tags, 
      expiresAt, 
      maxClicks, 
      customDomain,
      trackingEnabled
    } = body

    // Validate required fields
    if (!originalUrl || !title) {
      return NextResponse.json({
        success: false,
        error: 'Original URL and title are required'
      }, { status: 400 })
    }

    // Generate short code if not provided
    const shortCode = customCode || Math.random().toString(36).substring(2, 8)

    // Check if custom code already exists
    if (customCode) {
      const existing = await prisma.short_urls.findUnique({ where: { short_code: customCode } })
      if (existing) {
        return NextResponse.json({ success: false, error: 'Custom short code already exists' }, { status: 400 })
      }
    }

    // Build short_url value (required by schema)
    const baseShortUrl = customDomain
      ? `${String(customDomain).replace(/\/$/, '')}/${shortCode}`
      : `http://localhost:3000/${shortCode}`

    // Persist via Prisma
    const created = await prisma.short_urls.create({
      data: {
        original_url: originalUrl,
        short_code: shortCode,
        short_url: baseShortUrl,
        title,
        description: description || null,
        category_id: categoryId || null,
        tags: tags ? tags : [],
        expires_at: expiresAt || null,
        max_clicks: maxClicks || null,
        custom_domain: customDomain || null,
        user_id: user.id
      },
      include: { url_categories: true }
    })

    const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const transformedShortUrl = {
      id: created.id,
      originalUrl: created.original_url,
      shortCode: created.short_code,
      shortUrl: created.short_url || `${baseAppUrl}/${created.short_code}`,
      title: created.title,
      description: created.description,
      clicks: created.clicks || 0,
      isActive: created.is_active,
      category: created.url_categories ? {
        id: created.url_categories.id,
        name: created.url_categories.name,
        description: created.url_categories.description || undefined
      } : null,
      tags: Array.isArray(created.tags) ? created.tags : [],
      expiresAt: created.expires_at,
      maxClicks: created.max_clicks,
      customDomain: created.custom_domain,
      createdAt: created.created_at,
      updatedAt: created.updated_at,
      trackingEnabled: trackingEnabled !== false // default true
    }

    return NextResponse.json({ success: true, message: 'Short URL created successfully', shortUrl: transformedShortUrl }, { status: 201 })

  } catch (_error: any) {
    console.error('[SHORT URLS API] ❌ Create Error:', _error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error', 
        details: _error.message 
      },
      { status: 500 }
    )
  }
})