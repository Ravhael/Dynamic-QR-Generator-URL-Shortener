import { NextRequest, NextResponse } from 'next/server'
// Removed legacy db import – now fully Prisma-based
import { authService } from '@/app/api/authService'
import { prisma } from '@/lib/prisma'
import QRCode from 'qrcode'
import { withPermission } from '@/lib/ensurePermission'
import { getUserFromRequest as getAuthUserInfo } from '@/lib/api-permissions'

console.warn("[QR CODES DYNAMIC API] Loading route...")

// Legacy token-based helper (currently retained for backward compatibility if needed elsewhere in file)
async function getLegacyUserFromRequest(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cookieToken = request.cookies.get('token')?.value
    const token = authHeader?.replace('Bearer ', '') || cookieToken
    
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

// GET /api/qr-codes/[id] - Get single QR code
export const GET = withPermission(
  {
    resource: 'qr_code',
    action: 'read',
    resolveOwner: async ({ params }) => {
      if (!params?.id) return null; 
      const row = await prisma.qr_codes.findUnique({ where: { id: params.id }, select: { user_id: true, created_by: true } });
      if (!row) return null;
      const ownerId = row.user_id || row.created_by || undefined;
      if (!ownerId) return null;
      const owner = await prisma.users.findUnique({ where: { id: ownerId }, select: { group_id: true } });
      return { ownerId, ownerGroupId: owner?.group_id };
    }
  },
  async (request: NextRequest, { params }) => {
    console.warn("[QR CODES DYNAMIC API] GET - Getting QR code:", params.id)
    try {
      const { id } = params
      const auth = await getAuthUserInfo(request)
      const where: any = { id }
      if (auth && auth.userRole !== 'admin') {
        // enforce ownership restriction
        where.user_id = auth.userId
      }
      const qr = await prisma.qr_codes.findFirst({
        where,
        include: {
          qr_categories: { select: { name: true, color: true } }
        }
      })
      if (!qr) {
        return NextResponse.json({ success: false, error: 'QR code not found or access denied' }, { status: 404 })
      }
      const qrCode = {
        id: qr.id,
        name: qr.name,
        content: qr.content,
        type: qr.type,
        tags: qr.tags,
        category_id: qr.category_id,
        user_id: qr.user_id,
        created_at: qr.created_at,
        updated_at: qr.updated_at,
        isActive: qr.is_active,
        scans: qr.scans,
        qr_code_data: qr.qr_code_data,
        category_name: qr.qr_categories?.name || null,
        category_color: qr.qr_categories?.color || null
      }
      return NextResponse.json({ success: true, qrCode })
    } catch (error: any) {
      console.error('[QR CODES DYNAMIC API] ❌ Error in GET:', error)
      return NextResponse.json({ success: false, error: 'Failed to get QR code', details: error.message }, { status: 500 })
    }
  }
)

// PUT /api/qr-codes/[id] - Update QR code
export const PUT = withPermission(
  {
    resource: 'qr_code',
    action: 'update',
    resolveOwner: async ({ params }) => {
      if (!params?.id) return null;
      const row = await prisma.qr_codes.findUnique({ where: { id: params.id }, select: { user_id: true, created_by: true } });
      if (!row) return null;
      const ownerId = row.user_id || row.created_by || undefined;
      if (!ownerId) return null;
      const owner = await prisma.users.findUnique({ where: { id: ownerId }, select: { group_id: true } });
      return { ownerId, ownerGroupId: owner?.group_id };
    }
  },
  async (request: NextRequest, { params }) => {
    console.warn("[QR CODES DYNAMIC API] PUT - Updating QR code:", params.id)
    try {
      const body = await request.json()
      const { name, content, tags = [], categoryId, isActive } = body
      const { id } = params
      const existing = await prisma.qr_codes.findUnique({ where: { id } })
      if (!existing) {
        return NextResponse.json({ success: false, error: 'QR code not found or access denied' }, { status: 404 })
      }
      const data: any = {
        name: name ?? existing.name,
        tags: tags ?? existing.tags,
        category_id: categoryId !== undefined ? categoryId : existing.category_id,
        is_active: isActive !== undefined ? isActive : existing.is_active,
        updated_at: new Date()
      }
      if (content && content !== existing.content) {
        data.content = content
        try {
          data.qr_code_data = await QRCode.toString(content, { type: 'svg', width: 300, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } })
        } catch (qrError) {
          console.warn('[QR CODES DYNAMIC API] ⚠️ Failed to generate QR code:', qrError)
        }
      }
      const updated = await prisma.qr_codes.update({ where: { id }, data, include: { qr_categories: { select: { name: true, color: true } } } })
      const qrCode = {
        id: updated.id,
        name: updated.name,
        content: updated.content,
        type: updated.type,
        tags: updated.tags,
        category_id: updated.category_id,
        user_id: updated.user_id,
        created_at: updated.created_at,
        updated_at: updated.updated_at,
        isActive: updated.is_active,
        scans: updated.scans,
        qr_code_data: updated.qr_code_data,
        category_name: updated.qr_categories?.name || null,
        category_color: updated.qr_categories?.color || null
      }
      return NextResponse.json({ success: true, qrCode, message: 'QR code updated successfully' })
    } catch (error: any) {
      console.error('[QR CODES DYNAMIC API] ❌ Error in PUT:', error)
      return NextResponse.json({ success: false, error: 'Failed to update QR code', details: error.message }, { status: 500 })
    }
  }
)

// DELETE /api/qr-codes/[id] - Delete QR code
export const DELETE = withPermission(
  {
    resource: 'qr_code',
    action: 'delete',
    resolveOwner: async ({ params }) => {
      if (!params?.id) return null;
      // Coba cari di qr_codes, jika tidak ada coba di qr_migration (kolom created_by mungkin tidak ada di migration)
      let row: any = await prisma.qr_codes.findUnique({ where: { id: params.id }, select: { user_id: true, created_by: true } });
      if (!row) {
        const mig = await prisma.qr_migration.findUnique({ where: { id: params.id }, select: { user_id: true } });
        if (mig) {
          row = { user_id: mig.user_id, created_by: null };
        }
      }
      if (!row) return null;
      const ownerId = row.user_id || row.created_by || undefined;
      if (!ownerId) return null;
      const owner = await prisma.users.findUnique({ where: { id: ownerId }, select: { group_id: true } });
      return { ownerId, ownerGroupId: owner?.group_id };
    }
  },
  async (_request: NextRequest, { params }) => {
    console.warn("[QR CODES DYNAMIC API] DELETE - Deleting QR code (and migration link if exists):", params.id)
    try {
      const { id } = params
      const deletionResult = await prisma.$transaction(async (tx) => {
        // 1. Cek di qr_codes
        const qrRow = await tx.qr_codes.findFirst({ where: { id }, select: { id: true, name: true } });
        // 2. Cek di qr_migration jika tidak ada di qr_codes
        const migRow = !qrRow ? await tx.qr_migration.findUnique({ where: { id }, select: { id: true, name: true } }) : null;
        if (!qrRow && !migRow) return { notFound: true } as const;
        // Hapus events & analytics (kolom OR keduanya)
        await tx.scan_events.deleteMany({ where: { OR: [ { migration_qr_id: id }, { qr_code_id: id } ] } });
        await tx.qr_scan_analytics.deleteMany({ where: { OR: [ { migration_qr_id: id }, { qr_code_id: id } ] } });
        // Hapus sumber data utama
        if (qrRow) {
          await tx.qr_codes.delete({ where: { id } });
          // Jika juga ada migration row dengan id sama, bersihkan supaya tidak yatim
          const migrationRow = await tx.qr_migration.findUnique({ where: { id } });
          if (migrationRow) await tx.qr_migration.delete({ where: { id } });
        } else if (migRow) {
          await tx.qr_migration.delete({ where: { id } });
        }
        return { name: (qrRow?.name || migRow?.name || 'QR'), source: qrRow ? 'qr_codes' : 'qr_migration' } as const;
      });
      if ((deletionResult as any).notFound) {
        return NextResponse.json({ success: false, error: 'QR code not found or access denied' }, { status: 404 })
      }
      return NextResponse.json({ success: true, message: `QR code "${(deletionResult as any).name}" deleted successfully from ${(deletionResult as any).source} (related events & analytics purged)` })
    } catch (error: any) {
      console.error('[QR CODES DYNAMIC API] ❌ Error in DELETE:', error)
      return NextResponse.json({ success: false, error: 'Failed to delete QR code', details: error.message }, { status: 500 })
    }
  }
)