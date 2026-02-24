import { NextRequest, NextResponse } from 'next/server'
import { withPermission } from '@/lib/ensurePermission'
import { getUserFromRequest } from '@/lib/api-permissions'
import { prisma } from '@/lib/prisma'

export const GET = withPermission(
  { resource: 'scan_events', action: 'read' },
  async (request: NextRequest) => {
    try {
      const auth = await getUserFromRequest(request)
      if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      const userId = auth.userId
      const userRole = auth.userRole?.toLowerCase()
  const userGroupId = auth.userGroupId && auth.userGroupId !== 0 ? auth.userGroupId : null
      const isAdmin = !!userRole && ['admin','administrator','superadmin'].includes(userRole)

      // Quick existence guard: if scan_events table does not exist, return empty gracefully
      try {
        const reg: any = await prisma.$queryRaw`SELECT to_regclass('public.scan_events') as reg`
        const exists = Array.isArray(reg) && reg[0]?.reg
        if (!exists) {
          return NextResponse.json({ scanEvents: [], total: 0 })
        }
      } catch {}

      // If not admin and no group yet -> fallback to per-user scope instead of empty
      // Validate UUID format to avoid operator mismatch
      // Validate UUID only when used in filter (no group case)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      const { searchParams } = new URL(request.url)
      let limit = parseInt(searchParams.get('limit') || '10')
      if (isNaN(limit) || limit < 1) limit = 10
      if (limit > 200) limit = 200

      const start = Date.now()
      let rows: any[] = []
      try {
        if (isAdmin) {
          rows = await prisma.$queryRaw<any[]>`
            SELECT 
              se.id,
              se.qr_code_id,
              se.scanned_at,
              qr.name as qr_code_name,
              qr.type as qr_code_type,
              se.migration_qr_id
            FROM scan_events se
            JOIN qr_codes qr ON se.qr_code_id = qr.id
            ORDER BY se.scanned_at DESC
            LIMIT ${limit}
          `
        } else {
          if (!userGroupId) {
            // Per-user fallback: validate id if the schema expects UUID; if not UUID, query may fail
            if (!uuidRegex.test(userId)) {
              // If user_id is not a UUID in this deployment, prefer a safe empty response
              return NextResponse.json({ scanEvents: [], total: 0 })
            }
            // List scans for QR codes owned by this user
            rows = await prisma.$queryRaw<any[]>`
              SELECT 
                se.id,
                se.qr_code_id,
                se.scanned_at,
                qr.name as qr_code_name,
                qr.type as qr_code_type,
                se.migration_qr_id
              FROM scan_events se
              JOIN qr_codes qr ON se.qr_code_id = qr.id
              WHERE qr.user_id = ${userId}::uuid
              ORDER BY se.scanned_at DESC
              LIMIT ${limit}
            `
          } else {
            rows = await prisma.$queryRaw<any[]>`
              SELECT 
                se.id,
                se.qr_code_id,
                se.scanned_at,
                qr.name as qr_code_name,
                qr.type as qr_code_type,
                se.migration_qr_id
              FROM scan_events se
              JOIN qr_codes qr ON se.qr_code_id = qr.id
              JOIN users u ON qr.user_id = u.id
              WHERE u.group_id = ${userGroupId}
              ORDER BY se.scanned_at DESC
              LIMIT ${limit}
            `
          }
        }
      } catch (sqlErr: any) {
        console.error('[SCAN EVENTS API] SQL Error:', sqlErr?.message, sqlErr)
        throw sqlErr
      }

      const scanEvents = rows.map((row: any) => ({
        id: row.id,
        qrCodeId: row.qr_code_id,
        qrCodeName: row.qr_code_name,
        qrCodeType: row.qr_code_type,
        scannedAt: row.scanned_at,
        migrationQrId: row.migration_qr_id,
        analyticsNote: 'Detailed analytics available in qr_scan_analytics'
      }))
      const duration = Date.now() - start
      console.warn('[SCAN EVENTS API] Success:', { count: scanEvents.length, durationMs: duration, userId, limit })
      return NextResponse.json({ scanEvents, total: scanEvents.length })
    } catch (error) {
      console.error('[SCAN EVENTS API] Error (outer):', (error as any)?.message, error)
      return NextResponse.json({ error: 'Failed to fetch scan events', details: (error as any)?.message }, { status: 500 })
    }
  }
)