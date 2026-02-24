import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get URLs by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('category')
    
    console.warn('[URL BY CATEGORY API] 🔥 GET URLs by category:', categoryId)

    if (!categoryId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category ID is required',
          urls: []
        },
        { status: 400 }
      )
    }

    const urls = await prisma.short_urls.findMany({
      where: {
        category_id: categoryId,
        is_active: true
      },
      orderBy: { created_at: 'desc' },
      include: { url_categories: { select: { name: true, color: true } } }
    })

    console.warn('[URL BY CATEGORY API] ✅ FOUND', urls.length, 'URLs for category:', categoryId)
    if (urls.length > 0) {
      console.warn('[URL BY CATEGORY API] 🔍 Sample URL:', {
        title: urls[0].title,
        short_code: urls[0].short_code,
        clicks: urls[0].clicks,
        category_name: urls[0].url_categories?.name
      })
    }

    const mapped = urls.map(u => ({
      id: u.id,
      original_url: u.original_url,
      short_code: u.short_code,
      short_url: u.short_url,
      title: u.title,
      description: u.description,
      tags: u.tags,
      clicks: u.clicks,
      is_active: u.is_active,
      expires_at: u.expires_at,
      max_clicks: u.max_clicks,
      custom_domain: u.custom_domain,
      created_at: u.created_at,
      updated_at: u.updated_at,
      category_name: u.url_categories?.name || null,
      category_color: u.url_categories?.color || null
    }))

    return NextResponse.json({ 
      success: true,
      urls: mapped,
      count: mapped.length,
      categoryId,
      message: `Retrieved ${mapped.length} URLs for category`
    })

  } catch (error: any) {
    console.error('[URL BY CATEGORY API] ❌ Database error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch URLs by category',
        details: error.message,
        urls: []
      },
      { status: 500 }
    )
  }
}
