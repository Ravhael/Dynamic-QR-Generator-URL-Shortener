import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/api-permissions'
import { withPermission } from '@/lib/ensurePermission'

export const GET = withPermission(
  {
    resource: 'short_url',
    action: 'read',
    resolveOwner: async ({ params }) => {
      const id = await params?.id
      if (!id) return null
      const row = await prisma.short_urls.findUnique({ where: { id }, select: { user_id: true, created_by: true } })
      if (!row) return null
      const ownerId = row.user_id || row.created_by || undefined
      if (!ownerId) return null
      const owner = await prisma.users.findUnique({ where: { id: ownerId }, select: { group_id: true } })
      return { ownerId, ownerGroupId: owner?.group_id }
    }
  },
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params
      const record = await prisma.short_urls.findUnique({ where: { id }, include: { url_categories: true } })
      if (!record) return NextResponse.json({ _error: 'Short URL not found' }, { status: 404 })
      const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const transformedUrl = {
        id: record.id,
        originalUrl: record.original_url,
        shortCode: record.short_code,
        shortUrl: `${baseAppUrl}/${record.short_code}`,
        title: record.title,
        description: record.description,
        tags: Array.isArray(record.tags) ? record.tags : [],
        clicks: record.clicks || 0,
        isActive: record.is_active,
        expiresAt: record.expires_at,
        maxClicks: record.max_clicks,
        customDomain: record.custom_domain,
        userId: record.user_id,
        categoryId: record.category_id ?? undefined,
        category: record.url_categories ? { id: record.url_categories.id, name: record.url_categories.name } : null,
        createdAt: record.created_at,
        updatedAt: record.updated_at
      }
      return NextResponse.json({ success: true, shortUrl: transformedUrl })
    } catch (e: any) {
      console.error('❌ Get short URL error:', e)
      return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 })
    }
  }
)

export const PUT = withPermission(
  {
    resource: 'short_url',
    action: 'update',
    resolveOwner: async ({ params }) => {
      const id = await params?.id
      if (!id) return null
      const row = await prisma.short_urls.findUnique({ where: { id }, select: { user_id: true, created_by: true } })
      if (!row) return null
      const ownerId = row.user_id || row.created_by || undefined
      if (!ownerId) return null
      const owner = await prisma.users.findUnique({ where: { id: ownerId }, select: { group_id: true } })
      return { ownerId, ownerGroupId: owner?.group_id }
    }
  },
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params
      const body = await request.json()
      const { originalUrl, title, description, categoryId, tags, isActive, expiresAt, maxClicks } = body
      const updated = await prisma.short_urls.update({
        where: { id },
        data: {
          original_url: originalUrl,
          title,
          description: description || null,
          category_id: categoryId || null,
          tags: tags || [],
          is_active: isActive,
          expires_at: expiresAt || null,
          max_clicks: maxClicks || null,
          updated_at: new Date()
        }
      }).catch(() => null)
      if (!updated) return NextResponse.json({ _error: 'Short URL not found' }, { status: 404 })
      const baseAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const transformedUrl = {
        id: updated.id,
        originalUrl: updated.original_url,
        shortCode: updated.short_code,
        shortUrl: `${baseAppUrl}/${updated.short_code}`,
        title: updated.title,
        description: updated.description,
        tags: Array.isArray(updated.tags) ? updated.tags : [],
        clicks: updated.clicks || 0,
        isActive: updated.is_active,
        expiresAt: updated.expires_at,
        maxClicks: updated.max_clicks,
        customDomain: updated.custom_domain,
        userId: updated.user_id,
        categoryId: updated.category_id ?? undefined,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      }
      return NextResponse.json({ success: true, message: 'Short URL updated successfully', shortUrl: transformedUrl })
    } catch (e: any) {
      console.error('❌ Update short URL error:', e)
      return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 })
    }
  }
)

export const DELETE = withPermission(
  {
    resource: 'short_url',
    action: 'delete',
    resolveOwner: async ({ params }) => {
      const id = await params?.id
      if (!id) return null
      const row = await prisma.short_urls.findUnique({ where: { id }, select: { user_id: true, created_by: true } })
      if (!row) return null
      const ownerId = row.user_id || row.created_by || undefined
      if (!ownerId) return null
      const owner = await prisma.users.findUnique({ where: { id: ownerId }, select: { group_id: true } })
      return { ownerId, ownerGroupId: owner?.group_id }
    }
  },
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params
      const deleted = await prisma.short_urls.delete({ where: { id } }).catch(() => null)
      if (!deleted) return NextResponse.json({ _error: 'Short URL not found' }, { status: 404 })
      return NextResponse.json({ success: true, message: 'Short URL deleted successfully' })
    } catch (e: any) {
      console.error('❌ Delete short URL error:', e)
      return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 })
    }
  }
)
