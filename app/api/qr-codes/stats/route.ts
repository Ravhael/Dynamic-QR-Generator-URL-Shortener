import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermission } from '@/lib/ensurePermission'
import { getUserFromRequest } from '@/lib/api-permissions'

// GET /api/qr-codes/stats - Get QR codes statistics
export const GET = withPermission(
  { resource: 'qr_code', action: 'read' },
  async (request: NextRequest) => {
    console.warn("[QR CODES STATS API] GET - Getting QR codes statistics")
    try {
      const auth = await getUserFromRequest(request)
      if (!auth) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      const isAdmin = ['admin','administrator','superadmin'].includes(auth.userRole.toLowerCase())
      // NOTE: We no longer zero-out stats just because user has no group.
      // A user without a group can still have personally created QR codes.
      // --- Enhanced counting logic ---
      // We need to merge qr_codes + qr_migration (while avoiding double counting when an id exists in migration)
      let total = 0
      let activeCount = 0
      let inactiveCount = 0
      let totalScans = 0
      const totalCategories = await prisma.qr_categories.count()

      if (isAdmin) {
        // Use a single raw query for aggregate counts across both tables
        try {
          const rows: Array<{ total: bigint | number; active_count: bigint | number; inactive_count: bigint | number; }> = await prisma.$queryRawUnsafe(`
            WITH combined AS (
              SELECT qr.id, qr.is_active
              FROM qr_codes qr
              WHERE NOT EXISTS (SELECT 1 FROM qr_migration qm_dup WHERE qm_dup.id = qr.id)
              UNION ALL
              SELECT qm.id, (CASE WHEN qm.status = 'active' THEN true ELSE false END) AS is_active
              FROM qr_migration qm
            )
            SELECT 
              COUNT(*) AS total,
              COUNT(*) FILTER (WHERE is_active) AS active_count,
              COUNT(*) FILTER (WHERE NOT is_active) AS inactive_count
            FROM combined;
          `)
          if (rows && rows[0]) {
            total = Number(rows[0].total || 0)
            activeCount = Number(rows[0].active_count || 0)
            inactiveCount = Number(rows[0].inactive_count || 0)
          }
        } catch (aggErr) {
          console.warn('[QR CODES STATS API] Aggregate raw query failed, falling back:', (aggErr as any)?.message)
          const [qrAll, migrationAll] = await Promise.all([
            prisma.qr_codes.findMany({ select: { id: true, is_active: true } }),
            prisma.qr_migration.findMany({ select: { id: true, status: true } })
          ])
            const migrationIds = new Set(migrationAll.map(m => m.id))
            const filteredQRCodes = qrAll.filter(q => !migrationIds.has(q.id))
            const migrationMapped = migrationAll.map(m => ({ is_active: m.status === 'active' }))
            const combined = [...filteredQRCodes, ...migrationMapped]
            total = combined.length
            activeCount = combined.filter(c => c.is_active).length
            inactiveCount = combined.filter(c => !c.is_active).length
        }
        // Total scans for admin: count all scan_events (existing logic) + (optionally future: migration scans, assumed same table)
        totalScans = await prisma.scan_events.count()
      } else {
        // Non-admin: restrict to user's own codes (both tables)
        const [userQRCodes, userMigration] = await Promise.all([
          prisma.qr_codes.findMany({ where: { user_id: auth.userId }, select: { id: true, is_active: true } }),
          prisma.qr_migration.findMany({ where: { user_id: auth.userId }, select: { id: true, status: true } })
        ])
        const migrationIds = new Set(userMigration.map(m => m.id))
        const filteredQRCodes = userQRCodes.filter(q => !migrationIds.has(q.id))
        const migrationMapped = userMigration.map(m => ({ id: m.id, is_active: m.status === 'active' }))
        const combined = [...filteredQRCodes, ...migrationMapped]
        total = combined.length
        activeCount = combined.filter(c => c.is_active).length
        inactiveCount = combined.filter(c => !c.is_active).length

        // Collect all ids for scan counting
        const allIds = [...new Set(combined.map(c => c.id))]
        if (allIds.length > 0) {
          // scan_events has relation to qr_codes -> filter where qr_code_id in ids
          try {
            totalScans = await prisma.scan_events.count({ where: { qr_code_id: { in: allIds } } })
          } catch (scanErr) {
            console.warn('[QR CODES STATS API] Failed counting scans for user codes:', (scanErr as any)?.message)
            totalScans = 0
          }
        }
      }

      const statistics = { total, activeCount, inactiveCount, totalScans, totalCategories }
      return NextResponse.json({ success: true, statistics })
    } catch (error: any) {
      console.error('[QR CODES STATS API] ❌ Error in GET:', error)
      return NextResponse.json({ success: false, error: 'Failed to get QR codes statistics', details: error.message }, { status: 500 })
    }
  }
)