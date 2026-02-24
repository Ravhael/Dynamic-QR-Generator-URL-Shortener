import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUserId, isAdministrator } from '@/lib/auth';
import { getUserFromRequest } from '@/lib/api-permissions';

export async function GET(request: NextRequest) {
  try {
    console.log('[QR ANALYTICS API][Prisma] Fetching analytics...');
    
    // GET DYNAMIC USER ID FROM AUTHENTICATION - NO MORE HARDCODE!
    const userId = await getAuthenticatedUserId(request);
    
    if (!userId) {
      console.warn('[QR ANALYTICS API] ❌ No authenticated user found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // CHECK ADMIN + GROUP CONTEXT (group used for controlled empty returns elsewhere)
    const isAdmin = await isAdministrator(request);
    const userInfo = await getUserFromRequest(request).catch(() => null);
    const userGroupId = userInfo?.userGroupId && userInfo.userGroupId !== 0 ? userInfo.userGroupId : null;

    // Removed earlier forced empty return: user tanpa group tetap bisa lihat data miliknya sendiri.
    console.log('[QR ANALYTICS API] ✅ User authenticated:', userId, 'Admin:', isAdmin);

    // Helper to test table existence quickly
    const tableExists = async (table: string) => {
      try { const r = await prisma.$queryRawUnsafe(`SELECT to_regclass('${table}') as reg`); return Array.isArray(r) && r[0]?.reg; } catch { return false; }
    };

    const hasScanEvents = await tableExists('public.scan_events');
    const hasAnalytics = await tableExists('public.qr_scan_analytics');

    // 1. Only count and list qr_codes (with scan count if scan_events present)
  let qrCodesRaw: Array<{ id: string; name: string; type: string; content: string; is_active: boolean | null; created_at: Date; category_id: string | null; user_id: string; scans?: bigint | number | null; stored_scans?: number; event_scans?: number; }>= [];
    try {
      if (hasScanEvents) {
        qrCodesRaw = await prisma.$queryRaw(Prisma.sql`
          SELECT qc.id,
                 qc.name,
                 qc.type,
                 qc.content,
                 qc.is_active,
                 qc.created_at,
                 qc.category_id,
                 qc.user_id,
                 qc.scans AS stored_scans,
                 COUNT(se.id) AS event_scans
          FROM qr_codes qc
          LEFT JOIN scan_events se ON qc.id = se.qr_code_id
          ${isAdmin ? Prisma.sql`` : Prisma.sql`WHERE qc.user_id = ${userId}`}
          GROUP BY qc.id, qc.name, qc.type, qc.content, qc.is_active, qc.created_at, qc.category_id, qc.user_id, qc.scans
          ORDER BY qc.created_at DESC
        `);
      } else {
        // Fallback without scans
        const basics = await prisma.qr_codes.findMany({ where: isAdmin ? {} : { user_id: userId }, orderBy: { created_at: 'desc' }, select: { id:true,name:true,type:true,content:true,is_active:true,created_at:true,category_id:true,user_id:true,scans:true } });
        qrCodesRaw = basics.map((b: any) => ({ ...b, stored_scans: b.scans || 0, event_scans: 0 }));
      }
    } catch (e) {
      console.warn('[QR ANALYTICS API] Failed primary qr_codes query, fallback minimal:', (e as any)?.message);
      const basics = await prisma.qr_codes.findMany({ where: isAdmin ? {} : { user_id: userId }, orderBy: { created_at: 'desc' }, select: { id:true,name:true,type:true,content:true,is_active:true,created_at:true,category_id:true,user_id:true,scans:true } });
      qrCodesRaw = basics.map((b: any) => ({ ...b, stored_scans: b.scans || 0, event_scans: 0 }));
    }
    const qrCodes = qrCodesRaw.map((row: any) => {
      const stored = Number(row.stored_scans ?? row.scans ?? 0);
      const events = Number(row.event_scans ?? 0);
      const scansFinal = stored > events ? stored : events;
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        content: row.content,
        scans: scansFinal,
        rawStoredScans: stored,
        rawEventScans: events,
        isActive: row.is_active,
        createdAt: row.created_at,
        category: row.category_id || 'Uncategorized',
        userId: row.user_id,
        source: 'qr_codes'
      }
    });

    // 2. Get REAL scan statistics FROM SCAN_EVENTS (same source as detailed analytics)
  const qrCodeCount = qrCodes.length; // strictly qr_codes now
    
    // Get total scans from scan_events to match detailed analytics
    // Aggregate totalScans from merged per-QR counts (covers legacy stored scans + new event scans)
    const totalScans = qrCodes.reduce((sum: number, c: any) => sum + (Number(c.scans) || 0), 0);
    
    const activeQRCodes = qrCodes.filter((qr: any) => qr.isActive).length;
    const inactiveQRCodes = qrCodes.filter((qr: any) => !qr.isActive).length;

    // 3. Get REAL scans by day from scan_events table
    // ADMINISTRATOR SEES ALL SCAN EVENTS, REGULAR USER SEES ONLY THEIR OWN
    let scansByDay: Array<{ date: Date; count: number }> = [];
    if (hasScanEvents) {
      try {
        const scansByDayRows: Array<{ scan_date: Date; scan_count: bigint | number }> = await prisma.$queryRaw(Prisma.sql`
          SELECT DATE(se.scanned_at) as scan_date, COUNT(*) as scan_count
          FROM scan_events se
          JOIN qr_codes qc ON se.qr_code_id = qc.id
          WHERE se.scanned_at >= CURRENT_DATE - INTERVAL '30 days'
          ${isAdmin ? Prisma.sql`` : Prisma.sql`AND qc.user_id = ${userId}`}
          GROUP BY DATE(se.scanned_at)
          ORDER BY scan_date DESC
        `);
        scansByDay = scansByDayRows.map(r => ({ date: r.scan_date, count: Number(r.scan_count) }));
      } catch (e) {
        console.warn('[QR ANALYTICS API] scansByDay failed:', (e as any)?.message);
      }
    }

    // 4. Get REAL device distribution from scan_events
    // NOTE: device_type lives in qr_scan_analytics not scan_events
    let scansByDevice: Array<{ device: string | null; count: number }> = [];
    if (hasAnalytics) {
      try {
        let scansByDeviceRows: Array<{ device: string | null; device_count: bigint | number }> = [];
        if (isAdmin) {
          scansByDeviceRows = await prisma.$queryRaw`
            SELECT COALESCE(NULLIF(TRIM(qa.device_type), ''), 'Unknown') as device, COUNT(*) as device_count
            FROM qr_scan_analytics qa
            GROUP BY COALESCE(NULLIF(TRIM(qa.device_type), ''), 'Unknown')
            ORDER BY device_count DESC
            LIMIT 15
          `;
        } else {
          scansByDeviceRows = await prisma.$queryRaw`
            SELECT COALESCE(NULLIF(TRIM(qa.device_type), ''), 'Unknown') as device, COUNT(*) as device_count
            FROM qr_scan_analytics qa
            WHERE qa.user_id = ${userId}
            GROUP BY COALESCE(NULLIF(TRIM(qa.device_type), ''), 'Unknown')
            ORDER BY device_count DESC
            LIMIT 15
          `;
        }
        scansByDevice = scansByDeviceRows.map(r => ({ device: r.device, count: Number(r.device_count) }));
      } catch (e) {
        console.warn('[QR ANALYTICS API] scansByDevice failed:', (e as any)?.message);
      }
    }

    // 5. Get REAL location distribution from scan_events
    let scansByLocation: Array<{ location: string | null; count: number }> = [];
    if (hasAnalytics) {
      try {
        let scansByLocationRows: Array<{ location: string | null; location_count: bigint | number }> = [];
        if (isAdmin) {
          scansByLocationRows = await prisma.$queryRaw`
            SELECT (
              COALESCE(NULLIF(TRIM(qa.city), ''), 'Unknown') || ', ' ||
              COALESCE(NULLIF(TRIM(qa.country), ''), 'Unknown')
            ) as location, COUNT(*) as location_count
            FROM qr_scan_analytics qa
            GROUP BY (
              COALESCE(NULLIF(TRIM(qa.city), ''), 'Unknown') || ', ' ||
              COALESCE(NULLIF(TRIM(qa.country), ''), 'Unknown')
            )
            ORDER BY location_count DESC
            LIMIT 10
          `;
        } else {
          scansByLocationRows = await prisma.$queryRaw`
            SELECT (
              COALESCE(NULLIF(TRIM(qa.city), ''), 'Unknown') || ', ' ||
              COALESCE(NULLIF(TRIM(qa.country), ''), 'Unknown')
            ) as location, COUNT(*) as location_count
            FROM qr_scan_analytics qa
            WHERE qa.user_id = ${userId}
            GROUP BY (
              COALESCE(NULLIF(TRIM(qa.city), ''), 'Unknown') || ', ' ||
              COALESCE(NULLIF(TRIM(qa.country), ''), 'Unknown')
            )
            ORDER BY location_count DESC
            LIMIT 10
          `;
        }
        scansByLocation = scansByLocationRows.map(r => ({ location: r.location, count: Number(r.location_count) }));
      } catch (e) {
        console.warn('[QR ANALYTICS API] scansByLocation failed:', (e as any)?.message);
      }
    }

    // 6. Get REAL OS distribution from scan_events
    let scansByOS: Array<{ os: string | null; count: number }> = [];
    if (hasAnalytics) {
      try {
        let scansByOSRows: Array<{ os: string | null; os_count: bigint | number }> = [];
        if (isAdmin) {
          scansByOSRows = await prisma.$queryRaw`
            SELECT COALESCE(NULLIF(TRIM(qa.operating_system), ''), 'Unknown') as os, COUNT(*) as os_count
            FROM qr_scan_analytics qa
            GROUP BY COALESCE(NULLIF(TRIM(qa.operating_system), ''), 'Unknown')
            ORDER BY os_count DESC
            LIMIT 15
          `;
        } else {
          scansByOSRows = await prisma.$queryRaw`
            SELECT COALESCE(NULLIF(TRIM(qa.operating_system), ''), 'Unknown') as os, COUNT(*) as os_count
            FROM qr_scan_analytics qa
            WHERE qa.user_id = ${userId}
            GROUP BY COALESCE(NULLIF(TRIM(qa.operating_system), ''), 'Unknown')
            ORDER BY os_count DESC
            LIMIT 15
          `;
        }
        scansByOS = scansByOSRows.map(r => ({ os: r.os, count: Number(r.os_count) }));
      } catch (e) {
        console.warn('[QR ANALYTICS API] scansByOS failed:', (e as any)?.message);
      }
    }

    // 7. Get REAL IP distribution from scan_events (FULL IP ADDRESS)
    let scansByIp: Array<{ ip: string | null; count: number }> = [];
    if (hasAnalytics) {
      try {
        let scansByIpRows: Array<{ ip: string | null; ip_count: bigint | number }> = [];
        if (isAdmin) {
          scansByIpRows = await prisma.$queryRaw`
            SELECT COALESCE(NULLIF(TRIM(qa.ip_address::text), ''), 'Unknown') as ip, COUNT(*) as ip_count
            FROM qr_scan_analytics qa
            GROUP BY COALESCE(NULLIF(TRIM(qa.ip_address::text), ''), 'Unknown')
            ORDER BY ip_count DESC
            LIMIT 10
          `;
        } else {
          scansByIpRows = await prisma.$queryRaw`
            SELECT COALESCE(NULLIF(TRIM(qa.ip_address::text), ''), 'Unknown') as ip, COUNT(*) as ip_count
            FROM qr_scan_analytics qa
            WHERE qa.user_id = ${userId}
            GROUP BY COALESCE(NULLIF(TRIM(qa.ip_address::text), ''), 'Unknown')
            ORDER BY ip_count DESC
            LIMIT 10
          `;
        }
        scansByIp = scansByIpRows.map(r => ({ ip: r.ip, count: Number(r.ip_count) }));
      } catch (e) {
        console.warn('[QR ANALYTICS API] scansByIp failed:', (e as any)?.message);
      }
    }

    // 8. Empty click data for URL shortener (not related to QR)
    const clicksByLocation: { location: string; count: number }[] = [];

    // 9. Get top QR codes by actual scans
    const topQRCodes = qrCodes
      .slice(0, 100)
      .sort((a: any, b: any) => b.scans - a.scans)
      .slice(0, 10)
      .map(qr => ({ id: qr.id, name: qr.name || 'Untitled QR Code', type: qr.type || 'url', scans: qr.scans }));

    const analyticsData = {
      qrCodeCount,
      totalScans,
      activeQRCodes,
      inactiveQRCodes,
      qrCodes, // Include full QR codes data for detailed analytics
      scansByDay,
      scansByDevice,
      scansByLocation,
      clicksByLocation,
      scansByOS,
      scansByIp,
      topQRCodes,
      debug: {
        hasScanEvents,
        hasAnalytics,
        qrWithStoredOnly: qrCodes.filter((c:any)=>c.rawStoredScans && !c.rawEventScans).length,
        qrWithEventsOnly: qrCodes.filter((c:any)=>c.rawEventScans && !c.rawStoredScans).length,
        qrWithBoth: qrCodes.filter((c:any)=>c.rawEventScans && c.rawStoredScans).length,
        appliedSyntheticScansByDay: false,
        appliedSyntheticDistributions: { device: false, location: false, os: false, ip: false },
        analyticsRowCounts: hasAnalytics ? await prisma.$queryRaw(Prisma.sql`SELECT
          (SELECT COUNT(*) FROM qr_scan_analytics) as total_rows,
          (SELECT COUNT(*) FROM qr_scan_analytics WHERE device_type IS NOT NULL AND device_type <> '') as device_rows,
          (SELECT COUNT(*) FROM qr_scan_analytics WHERE operating_system IS NOT NULL AND operating_system <> '') as os_rows,
          (SELECT COUNT(*) FROM qr_scan_analytics WHERE city IS NOT NULL AND city <> '' AND country IS NOT NULL AND country <> '') as location_rows,
          (SELECT COUNT(*) FROM qr_scan_analytics WHERE ip_address IS NOT NULL AND ip_address <> '') as ip_rows
        `) : []
      }
    };

    console.log('[QR ANALYTICS API][Prisma] Data returned:', {
      isAdmin,
      userId,
      qrCodeCount,
      totalScans,
      activeQRCodes,
      inactiveQRCodes,
      scanEventsCount: scansByDay.reduce((sum: number, day: any) => sum + day.count, 0),
      dataScope: isAdmin ? 'ALL_USERS' : 'CURRENT_USER_ONLY'
    });

    return NextResponse.json(analyticsData);

  } catch (error: any) {
  console.error('[QR ANALYTICS API][Prisma] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch QR analytics data', details: error?.message || String(error) }, { status: 500 });
  }
}