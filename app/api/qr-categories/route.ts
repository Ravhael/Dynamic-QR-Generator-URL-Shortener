import { NextRequest, NextResponse } from "next/server"
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId, isAdministrator } from '@/lib/auth'

console.log("[QR CATEGORIES API] ✅ Loading route...")

export async function GET(request: NextRequest) {
  console.log("[QR CATEGORIES API][Prisma] GET qr_categories")
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const admin = await isAdministrator(request)
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const skip = (page - 1) * limit

    const where = admin ? {} : { OR: [ { is_default: true }, { user_id: userId } ] }

    const [categories, total] = await Promise.all([
      prisma.qr_categories.findMany({
        where,
        orderBy: [ { is_default: 'desc' }, { name: 'asc' } ],
        skip,
        take: limit,
        select: {
          id: true,
            name: true,
            description: true,
            color: true,
            is_default: true,
            user_id: true,
            created_at: true,
            updated_at: true,
        }
      }),
      prisma.qr_categories.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)
    return NextResponse.json({
      success: true,
      categories: categories.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        color: c.color,
        isDefault: c.is_default ?? false,
        userId: c.user_id ?? null,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    })
  } catch (error: any) {
    console.error('[QR CATEGORIES API][Prisma] GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch categories', details: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log("[QR CATEGORIES API][Prisma] POST create category")
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please login first.' }, { status: 401 })
    }
    const body = await request.json()
    const { name, description, color } = body
    if (!name || !color) {
      return NextResponse.json({ success: false, error: 'Name and color are required' }, { status: 400 })
    }
    const created = await prisma.qr_categories.create({
      data: {
        name,
        description: description || '',
        color,
        is_default: false,
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      }
    })
    return NextResponse.json({
      success: true,
      category: {
        id: created.id,
        name: created.name,
        description: created.description,
        color: created.color,
        isDefault: created.is_default ?? false,
        userId: created.user_id,
        createdAt: created.created_at,
        updatedAt: created.updated_at
      },
      message: 'Category created successfully'
    }, { status: 201 })
  } catch (error: any) {
    console.error('[QR CATEGORIES API][Prisma] POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create category', details: error.message }, { status: 500 })
  }
}