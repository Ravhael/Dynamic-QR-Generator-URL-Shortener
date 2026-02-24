import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authService } from '@/lib/auth/authService'

console.warn("[URL CATEGORIES BULK DELETE API][PRISMA] Loading route...")

// Helper function to get user from request
async function getUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || request.cookies.get('scanly_auth')?.value
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) return null
    
    const payload = authService.verifyToken(token)
    if (!payload) return null
    
    const user = await authService.getUserById(payload.userId)
    return user
  } catch (error) {
    console.error('[AUTH] Error getting user from request:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  console.warn("[URL CATEGORIES BULK DELETE API] 🔥 POST BULK DELETE URL CATEGORIES!")
  
  try {
    // Authentication check
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid or empty ids array' },
        { status: 400 }
      )
    }

    console.warn(`[URL CATEGORIES BULK DELETE API] Attempting to delete ${ids.length} categories:`, ids)

    // Fetch categories to validate
    const categories = await prisma.url_categories.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, is_default: true, user_id: true }
    })

    if (categories.length === 0) {
      return NextResponse.json({ success: false, error: 'No matching categories found' }, { status: 404 })
    }

    if (user.role !== 'admin') {
      for (const cat of categories) {
        if (cat.is_default) {
          return NextResponse.json({ success: false, error: `Cannot delete default category: ${cat.name}` }, { status: 403 })
        }
        if (cat.user_id !== user.id) {
          return NextResponse.json({ success: false, error: `You can only delete your own categories: ${cat.name}` }, { status: 403 })
        }
      }
    }

    // Nullify category references in short_urls first
    const updateResult = await prisma.short_urls.updateMany({
      where: { category_id: { in: ids } },
      data: { category_id: null }
    })
    console.warn(`[URL CATEGORIES BULK DELETE API][PRISMA] Updated ${updateResult.count} URLs to uncategorized`)

    // Delete categories
    const deleteResult = await prisma.url_categories.deleteMany({ where: { id: { in: ids } } })
    console.warn(`[URL CATEGORIES BULK DELETE API][PRISMA] Deleted ${deleteResult.count} categories`)

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.count} categories`,
      deletedCount: deleteResult.count,
      updatedUrls: updateResult.count,
      deletedCategories: categories.map(c => ({ id: c.id, name: c.name }))
    })

  } catch (error: any) {
    console.error('[URL CATEGORIES BULK DELETE API] ❌ Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete categories',
        details: error.message 
      },
      { status: 500 }
    )
  }
}