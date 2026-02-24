import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/api-permissions'

interface BulkRequestBody {
  operation: 'delete' | 'updateStatus'
  shortUrlIds: string[]
  status?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const body = (await request.json()) as BulkRequestBody
    const { operation, shortUrlIds, status } = body

    if (!operation || !Array.isArray(shortUrlIds) || shortUrlIds.length === 0) {
      return NextResponse.json({ success: false, error: 'operation and shortUrlIds are required' }, { status: 400 })
    }

    // Fetch target records (enforce ownership for non-admin)
    const targets = await prisma.short_urls.findMany({
      where: {
        id: { in: shortUrlIds },
        ...(user.userRole !== 'admin' ? { user_id: user.userId } : {})
      },
      select: { id: true }
    })

    if (targets.length === 0) {
      return NextResponse.json({ success: false, message: 'No matching short URLs found or not permitted.' })
    }

    const targetIds = targets.map(t => t.id)

    if (operation === 'delete') {
      const deleteResult = await prisma.short_urls.deleteMany({ where: { id: { in: targetIds } } })
      return NextResponse.json({ success: true, message: 'Short URLs deleted', deletedCount: deleteResult.count })
    }

    if (operation === 'updateStatus') {
      if (typeof status !== 'boolean') {
        return NextResponse.json({ success: false, error: 'status boolean is required for updateStatus' }, { status: 400 })
      }
      const updateResult = await prisma.short_urls.updateMany({
        where: { id: { in: targetIds } },
        data: { is_active: status }
      })
      return NextResponse.json({ success: true, message: 'Short URLs updated', updatedCount: updateResult.count })
    }

    return NextResponse.json({ success: false, error: 'Unsupported operation' }, { status: 400 })
  } catch (error: any) {
    console.error('[SHORT URL BULK API] Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
