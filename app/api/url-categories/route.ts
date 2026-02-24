import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/lib/auth/authService'
import { getToken } from 'next-auth/jwt'
import getNextAuthToken from '@/lib/getNextAuthToken';
import { prisma } from '@/lib/prisma'

console.warn("[URL CATEGORIES API] Loading route...")

// Helper function to get user from request
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

    // Fallback to NextAuth session (JWT strategy)
    const nextAuthToken = await getNextAuthToken(request as any)
    if (nextAuthToken?.id) {
      // Build minimal user object compatible with route usage
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
  console.warn('[URL CATEGORIES API][PRISMA] 🔥 GET URL CATEGORIES!')
  try {
    const user = await getUserFromRequest(request)
    const isAdmin = !!user && user.role === 'admin'

    let where: any = undefined
    if (!isAdmin) {
      if (user) {
        where = { OR: [ { is_default: true }, { user_id: user.id } ] }
      } else {
        where = { is_default: true }
      }
    }

    const categories = await prisma.url_categories.findMany({
      where,
      orderBy: [ { is_default: 'desc' }, { name: 'asc' } ]
    })

    const transformed = categories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description || undefined,
      color: c.color || undefined,
      isDefault: c.is_default ?? false,
      userId: c.user_id || undefined,
      createdAt: c.created_at,
      updatedAt: c.updated_at
    }))

    return NextResponse.json({ success: true, categories: transformed })
  } catch (error: any) {
    console.error('[URL CATEGORIES API][PRISMA] ❌ ERROR:', error)
    return NextResponse.json({ success: false, error: 'Failed to load categories', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.warn('[URL CATEGORIES API][PRISMA] 🔥 POST CREATE URL CATEGORY!')
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }
    const body = await request.json()
    const { name, description, color } = body
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 })
    }
    // Create via Prisma
    const created = await prisma.url_categories.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        color: color || null,
        is_default: false,
        user_id: user.id
      }
    })
    const transformed = {
      id: created.id,
      name: created.name,
      description: created.description || undefined,
      color: created.color || undefined,
      isDefault: created.is_default ?? false,
      userId: created.user_id,
      createdAt: created.created_at,
      updatedAt: created.updated_at
    }
    return NextResponse.json({ success: true, category: transformed, message: 'Category created successfully' })
  } catch (error: any) {
    console.error('[URL CATEGORIES API][PRISMA] ❌ CREATE ERROR:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Category name already exists' }, { status: 409 })
    }
    return NextResponse.json({ success: false, error: 'Failed to create category', details: error.message }, { status: 500 })
  }
}