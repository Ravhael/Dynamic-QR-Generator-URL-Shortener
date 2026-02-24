import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermission } from '@/lib/ensurePermission'
import { getUserFromRequest } from '@/lib/api-permissions'
import { checkPermission } from '@/lib/permissions'

// POST /api/qr-codes/bulk - Bulk operations (delete, update status)
export const POST = withPermission(
  {
    resource: 'qr_code',
    action: 'update', // baseline (we'll re-check delete inside if needed)
  },
  async (request: NextRequest) => {
    console.warn('[QR CODES BULK API][Prisma] POST bulk operation')
    try {
      const body = await request.json()
      const { operation, qrCodeIds, status } = body
      if (!operation || !Array.isArray(qrCodeIds) || qrCodeIds.length === 0) {
        return NextResponse.json({ success: false, error: 'Invalid request. Operation and qrCodeIds are required.' }, { status: 400 })
      }

      const auth = await getUserFromRequest(request)
      if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      const isAdmin = auth.userRole === 'admin'

      // If operation is delete, ensure delete permission explicitly
      if (operation === 'delete') {
        const deleteAllowed = await checkPermission({
          userId: auth.userId,
          userRole: auth.userRole,
          userGroupId: auth.userGroupId,
          resourceType: 'qr_code',
          permissionType: 'delete'
        })
        if (!deleteAllowed) {
          return NextResponse.json({ success: false, error: 'Not allowed to delete qr_code(s)' }, { status: 403 })
        }
        // Scope filter
        const baseFilter = isAdmin ? { in: qrCodeIds } : { in: qrCodeIds }
        // Fetch both sets
        const [codes, migrations] = await Promise.all([
          prisma.qr_codes.findMany({ where: isAdmin ? { id: baseFilter } : { id: baseFilter, user_id: auth.userId }, select: { id: true, name: true } }),
          prisma.qr_migration.findMany({ where: isAdmin ? { id: baseFilter } : { id: baseFilter, user_id: auth.userId }, select: { id: true, name: true } })
        ])
        if (codes.length === 0 && migrations.length === 0) {
          return NextResponse.json({ success: true, message: 'No matching QR codes (standard or migration) to delete', deletedCount: 0, deletedItems: [], deletedFromQrCodes: 0, deletedFromMigration: 0 })
        }
        // Collect IDs for deletion (unique sets)
        const codeIds = codes.map(c => c.id)
        const migrationIds = migrations.map(m => m.id)
        // Perform transactional cleanup
        const result = await prisma.$transaction(async (tx) => {
          // Delete analytics & events referencing these IDs (either as qr_code_id or migration_qr_id)
          if (codeIds.length || migrationIds.length) {
            const allIds = [...new Set([...codeIds, ...migrationIds])]
            await tx.scan_events.deleteMany({ where: { OR: [ { qr_code_id: { in: allIds } }, { migration_qr_id: { in: allIds } } ] } })
            await tx.qr_scan_analytics.deleteMany({ where: { OR: [ { qr_code_id: { in: allIds } }, { migration_qr_id: { in: allIds } } ] } })
          }
          if (codeIds.length) await tx.qr_codes.deleteMany({ where: { id: { in: codeIds } } })
          if (migrationIds.length) await tx.qr_migration.deleteMany({ where: { id: { in: migrationIds } } })
          return { deletedFromQrCodes: codeIds.length, deletedFromMigration: migrationIds.length }
        })
        return NextResponse.json({
          success: true,
          message: `Deleted ${result.deletedFromQrCodes} standard + ${result.deletedFromMigration} migrated QR code(s)` ,
          deletedCount: result.deletedFromQrCodes + result.deletedFromMigration,
          deletedFromQrCodes: result.deletedFromQrCodes,
          deletedFromMigration: result.deletedFromMigration,
          deletedItems: [...codes, ...migrations]
        })
      }

      if (operation === 'updateStatus') {
        if (typeof status !== 'boolean') {
          return NextResponse.json({ success: false, error: 'Status must be a boolean value.' }, { status: 400 })
        }
        const where = isAdmin ? { id: { in: qrCodeIds } } : { id: { in: qrCodeIds }, user_id: auth.userId }
        const result = await prisma.qr_codes.updateMany({ where, data: { is_active: status, updated_at: new Date() } })
        return NextResponse.json({ success: true, message: `Successfully updated ${result.count} QR code(s) to ${status ? 'active' : 'inactive'}`, updatedCount: result.count })
      }

      return NextResponse.json({ success: false, error: 'Invalid operation. Supported: delete, updateStatus' }, { status: 400 })
    } catch (error: any) {
      console.error('[QR CODES BULK API][Prisma] Error:', error)
      return NextResponse.json({ success: false, error: 'Failed to perform bulk operation', details: error.message }, { status: 500 })
    }
  }
)