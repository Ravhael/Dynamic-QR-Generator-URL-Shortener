import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getAuthenticatedUserId, isAdministrator } from '@/lib/auth';
// PATCH NOTE: Mengganti penggunaan Prisma.empty (tidak ada) dengan builder WHERE dinamis.

export async function GET(request: NextRequest) {
  try {
    // GET DYNAMIC USER ID FROM AUTHENTICATION - NO MORE HARDCODE!
    const userId = await getAuthenticatedUserId(request);
    
    if (!userId) {
      console.warn('[DETAILED SCANS API] ❌ No authenticated user found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // CHECK IF USER IS ADMINISTRATOR - ADMIN SEES ALL DATA!
    const isAdmin = await isAdministrator(request);
    console.log('[DETAILED SCANS API] ✅ User authenticated:', userId, 'Admin:', isAdmin);
        
    // Helper safeQuery using Prisma raw queries; always return { rows } style for backwards compatibility
    const safeQuery = async <T = any>(sql: Prisma.Sql, label: string): Promise<{ rows: T[] } | null> => {
      try {
        const rows = await prisma.$queryRaw<T[]>(sql);
        return { rows };
      } catch (err) {
        console.warn('[DETAILED SCANS API][safeQuery] warning:', label, err);
        return null;
      }
    };

  // Check tables exist (Postgres catalog) – if missing, short‑circuit
  const qrCodesReg = await safeQuery<{ reg: string | null }>(Prisma.sql`SELECT to_regclass('public.qr_codes') as reg`, 'reg_qr_codes');
  const qsaReg = await safeQuery<{ reg: string | null }>(Prisma.sql`SELECT to_regclass('public.qr_scan_analytics') as reg`, 'reg_qr_scan_analytics');
  const scanEventsReg = await safeQuery<{ reg: string | null }>(Prisma.sql`SELECT to_regclass('public.scan_events') as reg`, 'reg_scan_events');
  // Extended env diagnostics
  const dbName = await safeQuery<{ db: string }>(Prisma.sql`SELECT current_database() as db`, 'current_database');
  const dbUser = await safeQuery<{ usr: string }>(Prisma.sql`SELECT current_user as usr`, 'current_user');
  const searchPath = await safeQuery<{ sp: string }>(Prisma.sql`SHOW search_path`, 'search_path');
  const backendPid = await safeQuery<{ pid: number }>(Prisma.sql`SELECT pg_backend_pid() as pid`, 'backend_pid');
  const listQrTables = await safeQuery<{ relname: string }>(Prisma.sql`SELECT relname FROM pg_class WHERE relname LIKE 'qr_%' ORDER BY relname`, 'list_qr_tables');
  const listAllPublic = await safeQuery<{ relname: string }>(Prisma.sql`SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname='public' AND c.relkind='r' ORDER BY relname LIMIT 50`, 'list_public_tables');
    const qrCodesExists = !!qrCodesReg?.rows?.[0]?.reg;
    const qsaExists = !!qsaReg?.rows?.[0]?.reg;

    // Secondary validation using COUNT(*) to detect schema vs connection mismatch
    const checkTableExistViaCount = async (table: string) => {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`);
        return true;
      } catch (_e) { return false; }
    };
    const qrCodesExistsCount = await checkTableExistViaCount('qr_codes');
    const qsaExistsCount = await checkTableExistViaCount('qr_scan_analytics');
    const scanEventsExistsCount = await checkTableExistViaCount('scan_events');

    // Raw counts (best effort) for diagnostics
    let diagCounts = { qr_codes: 0, scan_events: 0, qr_scan_analytics: 0 };
    try {
      if (qrCodesExists || qrCodesExistsCount) diagCounts.qr_codes = await prisma.qr_codes.count();
      if (scanEventsReg?.rows?.[0]?.reg || scanEventsExistsCount) diagCounts.scan_events = await prisma.scan_events.count();
      if (qsaExists || qsaExistsCount) diagCounts.qr_scan_analytics = await prisma.qr_scan_analytics.count();
    } catch (e) {
      console.warn('[DETAILED SCANS API][DIAG] Failed counting tables', e);
    }
    if (!qrCodesExists && !qrCodesExistsCount) {
      console.warn('[DETAILED SCANS API] qr_codes truly missing (both catalog + count probe failed). Returning empty dataset.');
      return NextResponse.json({
        detailedScans: [],
        allQRCodes: [],
        filterOptions: { categories: [], devices: [], countries: [] },
        summary: { totalScans: 0, uniqueQRCodes: 0, totalQRCodes: 0, uniqueVisitors: 0, scanDays: 0 },
        metadata: { isAdmin, dataScope: isAdmin ? 'ALL_USERS' : 'CURRENT_USER_ONLY', requestedBy: userId, totalQRCodesInSystem: 0, qrCodesWithScans: 0, diagnostics: { tableCounts: diagCounts, reg: { qr_codes: qrCodesExists, qr_scan_analytics: qsaExists }, regCountProbe: { qr_codes: qrCodesExistsCount, qr_scan_analytics: qsaExistsCount, scan_events: scanEventsExistsCount }, env: { db: dbName?.rows?.[0]?.db, user: dbUser?.rows?.[0]?.usr, search_path: searchPath?.rows?.[0]?.sp, pid: backendPid?.rows?.[0]?.pid, qrTables: listQrTables?.rows?.map(r=>r.relname) || [], publicTablesSample: listAllPublic?.rows?.map(r=>r.relname) || [] } } }
      });
    }

    // EARLY COUNT (qr_codes only)
    const earlyQrCount = await prisma.qr_codes.count();
    console.log('[DETAILED SCANS API][EARLY_COUNTS]', { earlyQrCount });

    // Build dynamic WHERE (now supports migration QR: either owned by user via qr_codes OR qr_migration)
    // For admin: no restriction. For non-admin: (qc.user_id = userId OR qm.user_id = userId)
    const whereClause = isAdmin
      ? Prisma.sql``
      : Prisma.sql`WHERE (qc.user_id = ${userId} OR qm.user_id = ${userId})`;

    // Query detailed scans (tambahkan referrer_domain, UTM, scan_event_id, operating_system)
    let scanEventsResult = await safeQuery(Prisma.sql`
      SELECT 
        qsa.id,
        qsa.qr_code_id,
        qsa.scan_event_id,
        qsa.scanned_at,
        qsa.ip_address,
        qsa.user_agent,
        qsa.country,
        qsa.city,
        qsa.device_type,
        qsa.browser,
        qsa.operating_system,
        qsa.referrer_domain,
        qsa.utm_source,
        qsa.utm_medium,
        qsa.utm_campaign,
        qsa.utm_term,
        qsa.utm_content,
        COALESCE(qc.name, qm.name) as qr_name,
        COALESCE(qc.type, 'migration') as qr_type,
        COALESCE(qc.content, qm.redirect_url) as qr_content,
        COALESCE(qc.category_id, qm.category_id) as category_id,
        cat.name as category_name,
        CASE WHEN qc.id IS NULL AND qm.id IS NOT NULL THEN true ELSE false END as is_migration
      FROM qr_scan_analytics qsa
      LEFT JOIN qr_codes qc ON qsa.qr_code_id = qc.id
      LEFT JOIN qr_migration qm ON qsa.migration_qr_id = qm.id
      LEFT JOIN qr_categories cat ON COALESCE(qc.category_id, qm.category_id) = cat.id
      ${whereClause}
      ORDER BY qsa.scanned_at DESC
      LIMIT 100
    `,'detailed_scans');

    // Orphan diagnostics: scan_events that have no matching qr_scan_analytics (or vice versa)
    let orphanCounts = { scan_events_without_analytics: 0, analytics_without_scan_events: 0 };
    try {
      if (scanEventsReg?.rows?.[0]?.reg) {
        const orphanA = await safeQuery<{ cnt: bigint | number }>(Prisma.sql`
          SELECT COUNT(*) as cnt FROM scan_events se
          LEFT JOIN qr_scan_analytics qa ON qa.scan_event_id = se.id
          WHERE qa.id IS NULL
        `,'orphan_se_without_qa');
        const orphanB = await safeQuery<{ cnt: bigint | number }>(Prisma.sql`
          SELECT COUNT(*) as cnt FROM qr_scan_analytics qa
          LEFT JOIN scan_events se ON se.id = qa.scan_event_id
          WHERE se.id IS NULL
        `,'orphan_qa_without_se');
        orphanCounts.scan_events_without_analytics = Number(orphanA?.rows?.[0]?.cnt || 0);
        orphanCounts.analytics_without_scan_events = Number(orphanB?.rows?.[0]?.cnt || 0);
      }
    } catch (e) {
      console.warn('[DETAILED SCANS API][DIAG] orphan count failed', e);
    }

    const needFallback = (!qsaExists || (scanEventsResult && scanEventsResult.rows.length === 0));
    // Fallback: if qr_scan_analytics table missing OR zero rows (even though counts show data) -> use scan_events
    if (needFallback && scanEventsReg?.rows?.[0]?.reg) {
      const fallbackWhere = isAdmin ? Prisma.sql`` : Prisma.sql`WHERE qc.user_id = ${userId}`;
      const fallback = await safeQuery(Prisma.sql`
        SELECT 
          se.id as scan_event_id,
          se.qr_code_id,
          se.scanned_at,
          se.ip_address,
          se.user_agent,
          qc.name as qr_name,
          qc.type as qr_type,
          qc.content as qr_content,
          qc.category_id,
          cat.name as category_name,
          qc.id as qc_id
        FROM scan_events se
        JOIN qr_codes qc ON se.qr_code_id = qc.id
        LEFT JOIN qr_categories cat ON qc.category_id = cat.id
        ${fallbackWhere}
        ORDER BY se.scanned_at DESC
        LIMIT 100
      `,'fallback_scan_events');
      if (fallback && fallback.rows.length > 0) {
        console.warn('[DETAILED SCANS API][FALLBACK] Using scan_events because qr_scan_analytics unavailable or empty. Rows:', fallback.rows.length);
        // Normalize shape to mimic qsa result minimally
        scanEventsResult = { rows: fallback.rows.map((r: any) => ({
          id: r.scan_event_id, // synthetic id
          qr_code_id: r.qr_code_id,
          scan_event_id: r.scan_event_id,
          scanned_at: r.scanned_at,
          ip_address: r.ip_address,
          user_agent: r.user_agent,
          country: null,
          city: null,
          device_type: null,
          browser: null,
          operating_system: null,
          referrer_domain: null,
          utm_source: null,
          utm_medium: null,
          utm_campaign: null,
          utm_term: null,
          utm_content: null,
          qr_name: r.qr_name,
          qr_type: r.qr_type,
            qr_content: r.qr_content,
          category_id: r.category_id,
          category_name: r.category_name,
          is_migration: false
        })) };
      }
  }
    
    // Get ALL QR codes (qr_codes only now)
    // Collect ALL QR codes + migration rows (so UI can list them even if not scanned)
    const allQRCodesResult = await safeQuery(Prisma.sql`
      SELECT id, name, type, content, is_active, user_id, created_at, 'qr_codes' AS source_table
      FROM qr_codes
      ${isAdmin ? Prisma.sql`` : Prisma.sql`WHERE user_id = ${userId}`}
      UNION ALL
      SELECT id, name, 'migration' AS type, redirect_url AS content, (CASE WHEN status = 'active' THEN true ELSE false END) AS is_active,
             user_id, created_at, 'qr_migration' AS source_table
      FROM qr_migration
      ${isAdmin ? Prisma.sql`` : Prisma.sql`WHERE user_id = ${userId}`}
      ORDER BY created_at DESC
    `,'all_qr_codes');
    let unionRows = allQRCodesResult?.rows || [];

    const qrCount = await prisma.qr_codes.count({ where: isAdmin ? {} : { user_id: userId } as any });
    
    const detailedScans = (scanEventsResult?.rows || []).map((row: any) => ({
      id: row.id,
      scanEventId: row.scan_event_id || null,
      qrCodeId: row.qr_code_id,
      qrName: row.qr_name,
      qrType: row.qr_type,
      qrContent: row.qr_content,
      qrCategory: row.category_name || 'Uncategorized',
      qrSource: 'qr_codes',
      isMigration: row.is_migration === true,
      scannedAt: row.scanned_at,
      location: {
        country: row.country,
        city: row.city,
        ipAddress: row.ip_address
      },
      device: {
        type: row.device_type,
        browser: row.browser,
    os: row.operating_system || null,
        userAgent: row.user_agent
      },
      referrerDomain: row.referrer_domain || null,
      utm: {
        source: row.utm_source || null,
        medium: row.utm_medium || null,
        campaign: row.utm_campaign || null,
        term: row.utm_term || null,
        content: row.utm_content || null
      },
      // compatibility alias
      referrer: row.referrer_domain || null
    }));
    if (!scanEventsResult) {
      console.warn('[DETAILED SCANS API][DIAG] Main query failed (null result).');
    } else if (scanEventsResult.rows.length === 0) {
      console.warn('[DETAILED SCANS API][DIAG] No rows returned for scope.', { isAdmin, userId });
    }

    // Get summary statistics using shared connection - updated for both sources
    const summaryFilter = isAdmin ? Prisma.sql`` : Prisma.sql`WHERE (qc.user_id = ${userId} OR qm.user_id = ${userId})`;
    const summaryResult = qsaExists ? await safeQuery(Prisma.sql`
      SELECT 
        COUNT(*) as total_scans,
        COUNT(DISTINCT qsa.qr_code_id) as unique_qr_codes,
        COUNT(DISTINCT qsa.ip_address) as unique_visitors,
        COUNT(DISTINCT DATE(qsa.scanned_at)) as scan_days
      FROM qr_scan_analytics qsa
      LEFT JOIN qr_codes qc ON qsa.qr_code_id = qc.id
      LEFT JOIN qr_migration qm ON qsa.migration_qr_id = qm.id
      ${summaryFilter}
    `,'summary_stats') : null;
    const summary = summaryResult?.rows?.[0] || { total_scans: 0, unique_qr_codes: 0, unique_visitors: 0, scan_days: 0 };

    // Fallback summary if main summary shows zeros but we have detailedScans (from fallback path)
    if ((Number(summary.total_scans) === 0) && detailedScans.length > 0) {
      const distinctCodes = new Set(detailedScans.map(d=>d.qrCodeId)).size;
      const distinctVisitors = new Set(detailedScans.map(d=>d.location.ipAddress || d.id)).size; // naive
      const distinctDays = new Set(detailedScans.map(d=> new Date(d.scannedAt).toISOString().substring(0,10))).size;
      summary.total_scans = detailedScans.length;
      summary.unique_qr_codes = distinctCodes;
      summary.unique_visitors = distinctVisitors;
      summary.scan_days = distinctDays;
    }

    // Strengthen mismatch handling: if we have created codes but summary shows zeros (e.g. no scans yet), ensure counts reflect creation
  const createdTotal = qrCount; // only qr_codes
  let uniqueQrCodesComputed = Number(summary.unique_qr_codes) || 0;
  let totalScansComputed = Number(summary.total_scans) || 0;
    let overrideReason: string | null = null;
    if (createdTotal > 0 && uniqueQrCodesComputed === 0 && detailedScans.length === 0) {
      // No scans yet: unique should be 0 but we still want to surface created total via totalCreated (handled below)
      overrideReason = 'NO_SCANS_YET';
    } else if (createdTotal > 0 && unionRows.length === createdTotal && uniqueQrCodesComputed > createdTotal) {
      // Defensive: cannot have more unique scanned codes than created
      uniqueQrCodesComputed = createdTotal;
      overrideReason = 'CLAMP_UNIQUE_GT_CREATED';
    }

    console.log('[DETAILED SCANS API] ✅ Returning detailed scans:', detailedScans.length, 'Admin:', isAdmin);
    console.log('[DETAILED SCANS API] ✅ Total QR codes available (union):', allQRCodesResult?.rows?.length || 0);
    if ((allQRCodesResult?.rows?.length || 0) === 0) {
      const directQrCount = await prisma.qr_codes.count({ where: isAdmin ? {} : { user_id: userId } as any });
      console.log('[DETAILED SCANS API][DIAG] Direct table counts', { directQrCount });
    }

    // Get DYNAMIC filter options based on actual data - updated for both sources
    // Distinct categories from analytics
  const categoriesFromAnalytics = (qsaExists || qsaExistsCount) ? await safeQuery(Prisma.sql`
      SELECT DISTINCT cat.name as category_name
      FROM qr_scan_analytics qsa
      LEFT JOIN qr_codes qc ON qsa.qr_code_id = qc.id
      LEFT JOIN qr_migration qm ON qsa.migration_qr_id = qm.id
      LEFT JOIN qr_categories cat ON COALESCE(qc.category_id, qm.category_id) = cat.id
      WHERE cat.name IS NOT NULL
      ${isAdmin ? Prisma.sql`` : Prisma.sql`AND (qc.user_id = ${userId} OR qm.user_id = ${userId})`}
    `,'filter_categories_analytics') : null;
    // All categories from master table (owned + global user_id NULL)
    const categoriesFromMaster = await safeQuery(Prisma.sql`
      SELECT DISTINCT name as category_name FROM qr_categories
      ${isAdmin ? Prisma.sql`` : Prisma.sql`WHERE (user_id = ${userId} OR user_id IS NULL)`}
    `,'filter_categories_master');
    // Merge category names
    const mergedCategoryNames = Array.from(new Set([ 
      ...(categoriesFromMaster?.rows?.map(r=>r.category_name) || []),
      ...(categoriesFromAnalytics?.rows?.map(r=>r.category_name) || [])
    ].filter(Boolean).sort((a,b)=>a.localeCompare(b))));

  const devicesResult = (qsaExists || qsaExistsCount) ? await safeQuery(Prisma.sql`
      SELECT DISTINCT qsa.device_type
      FROM qr_scan_analytics qsa
      LEFT JOIN qr_codes qc ON qsa.qr_code_id = qc.id
      LEFT JOIN qr_migration qm ON qsa.migration_qr_id = qm.id
      WHERE qsa.device_type IS NOT NULL
      ${isAdmin ? Prisma.sql`` : Prisma.sql`AND (qc.user_id = ${userId} OR qm.user_id = ${userId})`}
      ORDER BY qsa.device_type
    `,'filter_devices') : null;

  const citiesFromAnalytics = (qsaExists || qsaExistsCount) ? await safeQuery(Prisma.sql`
      SELECT DISTINCT LOWER(qsa.city) as city
      FROM qr_scan_analytics qsa  
      LEFT JOIN qr_codes qc ON qsa.qr_code_id = qc.id
      LEFT JOIN qr_migration qm ON qsa.migration_qr_id = qm.id
      WHERE qsa.city IS NOT NULL AND qsa.city <> ''
      ${isAdmin ? Prisma.sql`` : Prisma.sql`AND (qc.user_id = ${userId} OR qm.user_id = ${userId})`}
    `,'filter_cities_analytics') : null;
    // Fallback: cities from scan_events if analytics empty
    const citiesFromScanEvents = (!citiesFromAnalytics || citiesFromAnalytics.rows.length === 0) ? await safeQuery(Prisma.sql`
      SELECT DISTINCT se_city.city as city FROM (
        SELECT se.qr_code_id, NULL::text as city FROM scan_events se LIMIT 0 -- structure placeholder
      ) se_city`,'filter_cities_fallback') : null;
    const rawCities = [
      ...(citiesFromAnalytics?.rows?.map(r=>r.city) || []),
      ...(citiesFromScanEvents?.rows?.map(r=>r.city) || [])
    ].filter(Boolean).map(c=> typeof c === 'string' ? c.trim() : c);
    const mergedCities = Array.from(new Set(rawCities)).sort((a,b)=>a.localeCompare(b));

    return NextResponse.json({
      detailedScans,
      allQRCodes: unionRows.map((qr: any) => ({
        id: qr.id,
        name: qr.name,
        type: qr.type,
        content: qr.content,
        isActive: qr.is_active,
        userId: qr.user_id
      })),
      filterOptions: {
        categories: mergedCategoryNames,
        devices: devicesResult?.rows?.map((row: any) => row.device_type) || [],
        countries: mergedCities,
        cities: mergedCities
      },
      summary: {
         totalScans: totalScansComputed,
        uniqueQRCodes: uniqueQrCodesComputed,
        totalQRCodes: createdTotal, // definitive
        totalCreated: createdTotal,
        scannedQRCodes: uniqueQrCodesComputed,
        neverScanned: createdTotal - uniqueQrCodesComputed,
        uniqueVisitors: Number(summary.unique_visitors) || 0,
      scanDays: Number(summary.scan_days) || 0,
      // Provide derived metrics for UI convenience (daily average) if they compute it client side you can ignore
      dailyAverage: (Number(summary.scan_days) || 0) > 0 ? Number((totalScansComputed / Number(summary.scan_days)).toFixed(2)) : (totalScansComputed > 0 ? totalScansComputed : 0)
      },
      metadata: {
        isAdmin,
        dataScope: isAdmin ? 'ALL_USERS' : 'CURRENT_USER_ONLY',
        requestedBy: userId,
        totalQRCodesInSystem: qrCount,
        qrCodesWithScans: Number(summary.unique_qr_codes) || 0,
        diagnostics: {
          unionRowCount: unionRows.length,
          qrCount,
          earlyQrCount,
          overrideReason,
          tableCounts: diagCounts,
          reg: { qr_codes: qrCodesExists, qr_scan_analytics: qsaExists },
          regCountProbe: { qr_codes: qrCodesExistsCount, qr_scan_analytics: qsaExistsCount, scan_events: scanEventsExistsCount },
          queryWhere: whereClause?.sql ?? 'NONE',
          env: {
            db: dbName?.rows?.[0]?.db,
            user: dbUser?.rows?.[0]?.usr,
            search_path: searchPath?.rows?.[0]?.sp,
            pid: backendPid?.rows?.[0]?.pid,
            qrTables: listQrTables?.rows?.map(r=>r.relname) || [],
            publicTablesSample: listAllPublic?.rows?.map(r=>r.relname) || []
          },
          orphan: orphanCounts,
          fallbackApplied: needFallback
        }
      }
    });

  } catch (error: any) {
    console.error('[DETAILED SCANS API] ❌ ERROR:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detailed scan data', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}