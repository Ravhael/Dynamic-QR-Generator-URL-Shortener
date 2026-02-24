import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUserId, isAdministrator } from '@/lib/auth'
import { withPermission } from '@/lib/ensurePermission'

console.warn("[QR ANALYTICS SUMMARY API] Loading route...")

export const GET = withPermission({ resource: 'qr_analytics', action: 'read' }, async (request: NextRequest) => {
  try {
    // GET DYNAMIC USER ID FROM AUTHENTICATION - NO MORE HARDCODE!
    const userId = await getAuthenticatedUserId(request);
    
    if (!userId) {
      console.warn('[QR ANALYTICS SUMMARY API] ❌ No authenticated user found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // CHECK IF USER IS ADMINISTRATOR - ADMIN SEES ALL DATA!
    const isAdmin = await isAdministrator(request);
    console.log('[QR ANALYTICS SUMMARY API] ✅ User authenticated:', userId, 'Admin:', isAdmin);
    
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    
    console.warn(`[QR ANALYTICS SUMMARY API] 🔥 GET ANALYTICS DATA - ${days} DAYS`)

    // 1. QR CODES COUNT & SCANS SUMMARY using shared connection
    // ADMINISTRATOR SEES ALL QR CODES, REGULAR USER SEES ONLY THEIR OWN
    const qrCodesResult: any[] = await (isAdmin
      ? prisma.$queryRaw`SELECT COUNT(*) as qr_code_count, COUNT(*) FILTER (WHERE is_active = true) as active_qr_codes, SUM(scans) as total_scans FROM qr_codes`
      : prisma.$queryRaw`SELECT COUNT(*) as qr_code_count, COUNT(*) FILTER (WHERE is_active = true) as active_qr_codes, SUM(scans) as total_scans FROM qr_codes WHERE user_id = ${userId}::uuid`
    );

    // 2. SCANS BY DAY using shared connection
    // ADMINISTRATOR SEES ALL SCAN EVENTS, REGULAR USER SEES ONLY THEIR OWN
    const scansByDayResult: any[] = await (isAdmin
      ? prisma.$queryRaw`SELECT DATE(se.scanned_at) as scan_date, COUNT(*) as scan_count FROM scan_events se JOIN qr_codes qc ON se.qr_code_id = qc.id WHERE se.scanned_at >= CURRENT_DATE - INTERVAL '${days} days' GROUP BY DATE(se.scanned_at) ORDER BY scan_date DESC`
      : prisma.$queryRaw`SELECT DATE(se.scanned_at) as scan_date, COUNT(*) as scan_count FROM scan_events se JOIN qr_codes qc ON se.qr_code_id = qc.id WHERE se.scanned_at >= CURRENT_DATE - INTERVAL '${days} days' AND qc.user_id = ${userId}::uuid GROUP BY DATE(se.scanned_at) ORDER BY scan_date DESC`
    );

    // 3. SCANS BY DEVICE using shared connection
    const scansByDeviceResult: any[] = await (isAdmin
      ? prisma.$queryRaw`SELECT COALESCE(se.device_type, 'Unknown') as device, COUNT(*) as count FROM scan_events se JOIN qr_codes qc ON se.qr_code_id = qc.id WHERE se.scanned_at >= CURRENT_DATE - INTERVAL '${days} days' GROUP BY se.device_type ORDER BY count DESC`
      : prisma.$queryRaw`SELECT COALESCE(se.device_type, 'Unknown') as device, COUNT(*) as count FROM scan_events se JOIN qr_codes qc ON se.qr_code_id = qc.id WHERE se.scanned_at >= CURRENT_DATE - INTERVAL '${days} days' AND qc.user_id = ${userId}::uuid GROUP BY se.device_type ORDER BY count DESC`
    );

    // 4. SCANS BY LOCATION using shared connection
    const scansByLocationResult: any[] = await (isAdmin
      ? prisma.$queryRaw`SELECT CONCAT(COALESCE(se.city, 'Unknown'), ', ', COALESCE(se.country, 'Unknown')) as location, COUNT(*) as count FROM scan_events se JOIN qr_codes qc ON se.qr_code_id = qc.id WHERE se.scanned_at >= CURRENT_DATE - INTERVAL '${days} days' GROUP BY se.city, se.country ORDER BY count DESC LIMIT 10`
      : prisma.$queryRaw`SELECT CONCAT(COALESCE(se.city, 'Unknown'), ', ', COALESCE(se.country, 'Unknown')) as location, COUNT(*) as count FROM scan_events se JOIN qr_codes qc ON se.qr_code_id = qc.id WHERE se.scanned_at >= CURRENT_DATE - INTERVAL '${days} days' AND qc.user_id = ${userId}::uuid GROUP BY se.city, se.country ORDER BY count DESC LIMIT 10`
    );

    // 5. TOP QR CODES using shared connection
    const topQRCodesResult: any[] = await (isAdmin
      ? prisma.$queryRaw`SELECT qc.id, qc.name, qc.type, COUNT(se.id) as recent_scans, qc.scans as total_scans FROM qr_codes qc LEFT JOIN scan_events se ON qc.id = se.qr_code_id AND se.scanned_at >= CURRENT_DATE - INTERVAL '${days} days' GROUP BY qc.id, qc.name, qc.type, qc.scans ORDER BY recent_scans DESC, qc.scans DESC LIMIT 10`
      : prisma.$queryRaw`SELECT qc.id, qc.name, qc.type, COUNT(se.id) as recent_scans, qc.scans as total_scans FROM qr_codes qc LEFT JOIN scan_events se ON qc.id = se.qr_code_id AND se.scanned_at >= CURRENT_DATE - INTERVAL '${days} days' WHERE qc.user_id = ${userId}::uuid GROUP BY qc.id, qc.name, qc.type, qc.scans ORDER BY recent_scans DESC, qc.scans DESC LIMIT 10`
    );

    const analyticsData = {
      // Summary stats
  qrCodeCount: parseInt(qrCodesResult[0]?.qr_code_count) || 0,
  activeQRCodes: parseInt(qrCodesResult[0]?.active_qr_codes) || 0,
  totalScans: parseInt(qrCodesResult[0]?.total_scans) || 0,

      // Detailed analytics
      scansByDay: scansByDayResult.map((row: any) => ({
        date: row.scan_date,
        scans: parseInt(row.scan_count)
      })),

      scansByDevice: scansByDeviceResult.map((row: any) => ({
        device: row.device,
        count: parseInt(row.count)
      })),

      scansByLocation: scansByLocationResult.map((row: any) => ({
        location: row.location,
        count: parseInt(row.count)
      })),

      topQRCodes: topQRCodesResult.map((row: any) => ({
        id: row.id,
        name: row.name || 'Untitled QR Code',
        type: row.type,
        recentScans: parseInt(row.recent_scans),
        totalScans: parseInt(row.total_scans) || 0
      }))
    }

    console.warn('[QR ANALYTICS SUMMARY API] ✅ ANALYTICS DATA:', {
      isAdmin,
      userId,
      qrCodeCount: analyticsData.qrCodeCount,
      totalScans: analyticsData.totalScans,
      activeQRCodes: analyticsData.activeQRCodes,
      recentScansByDay: analyticsData.scansByDay.length,
      dataScope: isAdmin ? 'ALL_USERS' : 'CURRENT_USER_ONLY'
    })

    return NextResponse.json(analyticsData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error: any) {
    console.error('[QR ANALYTICS SUMMARY API] ❌ ERROR:', error)
    return NextResponse.json(
      { _error: 'Failed to fetch QR analytics summary: ' + error.message },
      { status: 500 }
    )
  }
})