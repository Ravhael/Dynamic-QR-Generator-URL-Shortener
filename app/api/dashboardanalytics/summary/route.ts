import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermission } from '@/lib/ensurePermission'
import { getUserFromRequest } from '@/lib/api-permissions'

// NOTE: We intentionally keep a couple of lightweight raw queries for date truncation
// because Prisma does not (yet) support grouping by a DATE(scanned_at) expression.
// All simple aggregates are migrated to native Prisma calls.
export const GET = withPermission({ resource: 'analytics', action: 'read' }, async (request: NextRequest) => {
  try {
    // Parse query params
  const url = new URL(request.url)
    const daysParam = url.searchParams.get('days')
  const debug = url.searchParams.get('debug') === '1'
    let days = Number(daysParam || 30)
    if (!Number.isFinite(days) || days <= 0) days = 30
    // clamp to a sane window
    if (days > 90) days = 90
    if (days < 7) days = 7
  const daysInterval = `${days} days`
  const daysMinus1 = Math.max(0, days - 1)
  const daysIntervalMinus1 = `${daysMinus1} days`

    // Determine user & scope
    const auth = await getUserFromRequest(request);
    const userRole = auth?.userRole?.toLowerCase();
    const userId = auth?.userId || null;
    const userGroupId = auth?.userGroupId && auth.userGroupId !== 0 ? auth.userGroupId : null;
    const isAdmin = !!userRole && ['admin','administrator','superadmin'].includes(userRole);

    // Note: Do NOT early-return empty for users without a group.
    // Fallback to per-user scope so new users still see their own data.

    // Where clause helpers (group scope): join via owners' group if not admin
    const qrWhere: any = isAdmin
      ? {}
      : (userGroupId
          ? { users_qr_codes_user_idTousers: { group_id: userGroupId } }
          : { user_id: userId || '__NO_USER__' });
    const urlWhere: any = isAdmin
      ? {}
      : (userGroupId
          ? { users_short_urls_user_idTousers: { group_id: userGroupId } }
          : { user_id: userId || '__NO_USER__' });
    const scanWhere: any = isAdmin
      ? {}
      : (userGroupId
          ? { qr_codes: { users_qr_codes_user_idTousers: { group_id: userGroupId } } }
          : { qr_codes: { user_id: userId || '__NO_USER__' } });
    const clickWhere: any = isAdmin
      ? {}
      : (userGroupId
          ? { short_urls: { users_short_urls_user_idTousers: { group_id: userGroupId } } }
          : { short_urls: { user_id: userId || '__NO_USER__' } });

    // Run independent aggregates in parallel for performance
    // Raw daily queries separated for clarity
    // Helper: check table existence quickly via to_regclass
    const tableExists = async (table: string) => {
      try {
        const r: any = await prisma.$queryRaw`SELECT to_regclass(${table}) as reg`;
        return Array.isArray(r) && r[0]?.reg;
      } catch { return false; }
    };

  // Table existence checks (best-effort). We'll still attempt queries in try/catch even if these return null
  const hasQrScanAnalytics = await tableExists('public.qr_scan_analytics');
  const hasUrlClickAnalytics = await tableExists('public.url_click_analytics');
  const hasScanEvents = await tableExists('public.scan_events');
  const hasClickEvents = await tableExists('public.click_events');
    if (debug) {
      console.warn('[DASHBOARD API][debug] tables:', {
        hasQrScanAnalytics,
        hasUrlClickAnalytics,
        hasScanEvents,
        hasClickEvents,
        days,
        daysMinus1,
        isAdmin,
        userId,
        userGroupId
      })
    }

    // Helpers to fetch daily series with dynamic fallback: if analytics returns empty, use events
    const fetchScansDaily = async (windowDays: number): Promise<{ date: string; count: number }[]> => {
      const wdMinus1 = Math.max(0, windowDays - 1)
      const unscopedEventsQuery = async () => (
        prisma.$queryRaw<{ date: string; count: number }[]>`
          SELECT to_char((se.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
          FROM scan_events se
          WHERE (se.scanned_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
          GROUP BY to_char((se.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
          ORDER BY date ASC
        `
      )
      const analyticsQuery = async () => (
        isAdmin
          ? prisma.$queryRaw<{ date: string; count: number }[]>`
              SELECT to_char((qsa.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
              FROM qr_scan_analytics qsa
              WHERE (qsa.scanned_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
              GROUP BY to_char((qsa.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
              ORDER BY date ASC
            `
          : (userGroupId
              ? prisma.$queryRaw<{ date: string; count: number }[]>`
                  SELECT to_char((qsa.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
                  FROM qr_scan_analytics qsa
                  JOIN qr_codes q ON qsa.qr_code_id = q.id
                  JOIN users u ON q.user_id = u.id
                  WHERE (qsa.scanned_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
                    AND u.group_id = ${userGroupId}
                  GROUP BY to_char((qsa.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
                  ORDER BY date ASC
                `
              : prisma.$queryRaw<{ date: string; count: number }[]>`
                  SELECT to_char((qsa.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
                  FROM qr_scan_analytics qsa
                  JOIN qr_codes q ON qsa.qr_code_id = q.id
                  WHERE (qsa.scanned_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
                    AND q.user_id = ${userId}::uuid
                  GROUP BY to_char((qsa.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
                  ORDER BY date ASC
                `
            )
      )
      const eventsQuery = async () => (
        isAdmin
          ? prisma.$queryRaw<{ date: string; count: number }[]>`
              SELECT to_char((se.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
              FROM scan_events se
              WHERE (se.scanned_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
              GROUP BY to_char((se.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
              ORDER BY date ASC
            `
          : (userGroupId
              ? prisma.$queryRaw<{ date: string; count: number }[]>`
                  SELECT to_char((se.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
                  FROM scan_events se
                  JOIN qr_codes q ON se.qr_code_id = q.id
                  JOIN users u ON q.user_id = u.id
                  WHERE (se.scanned_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
                    AND u.group_id = ${userGroupId}
                  GROUP BY to_char((se.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
                  ORDER BY date ASC
                `
              : prisma.$queryRaw<{ date: string; count: number }[]>`
                  SELECT to_char((se.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
                  FROM scan_events se
                  JOIN qr_codes q ON se.qr_code_id = q.id
                  WHERE (se.scanned_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
                    AND q.user_id = ${userId}::uuid
                  GROUP BY to_char((se.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
                  ORDER BY date ASC
                `
            )
      )

      try {
        if (hasQrScanAnalytics !== false) {
          const rows = await analyticsQuery()
          if (rows && rows.length > 0) return rows
        }
      } catch {}
      try {
        const scoped = await eventsQuery()
        if (scoped && scoped.length > 0) return scoped
      } catch {}
      try {
        const unscoped = await unscopedEventsQuery()
        if (unscoped && unscoped.length > 0) return unscoped
      } catch {}
      return []
    }

    const fetchClicksDaily = async (windowDays: number): Promise<{ date: string; count: number }[]> => {
      const wdMinus1 = Math.max(0, windowDays - 1)
      const unscopedEventsQuery = async () => (
        prisma.$queryRaw<{ date: string; count: number }[]>`
          SELECT to_char((ce.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
          FROM click_events ce
          WHERE (ce.clicked_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
          GROUP BY to_char((ce.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
          ORDER BY date ASC
        `
      )
      const analyticsQuery = async () => (
        isAdmin
          ? prisma.$queryRaw<{ date: string; count: number }[]>`
              SELECT to_char((uca.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
              FROM url_click_analytics uca
              WHERE (uca.clicked_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
              GROUP BY to_char((uca.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
              ORDER BY date ASC
            `
          : (userGroupId
              ? prisma.$queryRaw<{ date: string; count: number }[]>`
                  SELECT to_char((uca.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
                  FROM url_click_analytics uca
                  JOIN short_urls su ON uca.short_url_id = su.id
                  JOIN users u ON su.user_id = u.id
                  WHERE (uca.clicked_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
                    AND u.group_id = ${userGroupId}
                  GROUP BY to_char((uca.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
                  ORDER BY date ASC
                `
              : prisma.$queryRaw<{ date: string; count: number }[]>`
                  SELECT to_char((uca.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
                  FROM url_click_analytics uca
                  JOIN short_urls su ON uca.short_url_id = su.id
                  WHERE (uca.clicked_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
                    AND su.user_id = ${userId}::uuid
                  GROUP BY to_char((uca.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
                  ORDER BY date ASC
                `
            )
      )
      const eventsQuery = async () => (
        isAdmin
          ? prisma.$queryRaw<{ date: string; count: number }[]>`
              SELECT to_char((ce.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
              FROM click_events ce
              WHERE (ce.clicked_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
              GROUP BY to_char((ce.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
              ORDER BY date ASC
            `
          : (userGroupId
              ? prisma.$queryRaw<{ date: string; count: number }[]>`
                  SELECT to_char((ce.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
                  FROM click_events ce
                  JOIN short_urls su ON ce.short_url_id = su.id
                  JOIN users u ON su.user_id = u.id
                  WHERE (ce.clicked_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
                    AND u.group_id = ${userGroupId}
                  GROUP BY to_char((ce.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
                  ORDER BY date ASC
                `
              : prisma.$queryRaw<{ date: string; count: number }[]>`
                  SELECT to_char((ce.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
                  FROM click_events ce
                  JOIN short_urls su ON ce.short_url_id = su.id
                  WHERE (ce.clicked_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
                    AND su.user_id = ${userId}::uuid
                  GROUP BY to_char((ce.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
                  ORDER BY date ASC
                `
            )
      )

      try {
        if (hasUrlClickAnalytics !== false) {
          const rows = await analyticsQuery()
          if (rows && rows.length > 0) return rows
        }
      } catch {}
      try {
        const scoped = await eventsQuery()
        if (scoped && scoped.length > 0) return scoped
      } catch {}
      try {
        const unscoped = await unscopedEventsQuery()
        if (unscoped && unscoped.length > 0) return unscoped
      } catch {}
      return []
    }

    const [
      qrCodeCount,
      activeQRCodes,
      totalScansEvents,
      shortUrlCount,
      activeShortURLs,
      totalClicksEvents
    ] = await Promise.all([
      prisma.qr_codes.count({ where: qrWhere }),
      prisma.qr_codes.count({ where: { ...qrWhere, is_active: true } }),
  (async () => { try { return await prisma.scan_events.count({ where: scanWhere }) } catch { return 0 } })(),
      prisma.short_urls.count({ where: urlWhere }),
      prisma.short_urls.count({ where: { ...urlWhere, is_active: true } }),
      (async () => {
        try {
          const rows = isAdmin
            ? await prisma.$queryRaw<{ c: bigint }[]>`SELECT COUNT(*)::bigint as c FROM click_events`
            : (userGroupId
                ? await prisma.$queryRaw<{ c: bigint }[]>`
                    SELECT COUNT(*)::bigint as c
                    FROM click_events ce
                    JOIN short_urls su ON ce.short_url_id = su.id
                    JOIN users u ON su.user_id = u.id
                    WHERE u.group_id = ${userGroupId}
                  `
                : await prisma.$queryRaw<{ c: bigint }[]>`
                    SELECT COUNT(*)::bigint as c
                    FROM click_events ce
                    JOIN short_urls su ON ce.short_url_id = su.id
                    WHERE su.user_id = ${userId}::uuid
                  `)
          return Number(rows?.[0]?.c || 0)
        } catch { return 0 }
      })()
    ])

    // Fetch daily series with dynamic fallback logic
    let effectiveDays = days
    let [scansByDayRaw, clicksByDayRaw] = await Promise.all([
      fetchScansDaily(days),
      fetchClicksDaily(days)
    ])
    if (debug) {
      console.warn('[DASHBOARD API][debug] raw daily rows:', {
        scansByDayRaw,
        clicksByDayRaw
      })
    }

    // Compute stored scans sum from qr_codes (and optionally qr_migration) to assess totals reliably
    const storedScansFromQr = await prisma.qr_codes.aggregate({ _sum: { scans: true }, where: qrWhere })
    const storedSumQr = Number(storedScansFromQr._sum.scans || 0)
    // Optional: include migration table if in schema
    let storedSumMig = 0
    try {
      const migReg: any = await prisma.$queryRaw`SELECT to_regclass('public.qr_migration') as reg`
      if (Array.isArray(migReg) && migReg[0]?.reg) {
        if (isAdmin) {
          const agg: any = await prisma.$queryRaw`SELECT COALESCE(SUM(scans),0)::bigint as s FROM qr_migration`
          storedSumMig = Number(agg?.[0]?.s || 0)
        } else if (userGroupId) {
          const agg: any = await prisma.$queryRaw`
            SELECT COALESCE(SUM(m.scans),0)::bigint as s
            FROM qr_migration m
            JOIN users u ON m.user_id = u.id
            WHERE u.group_id = ${userGroupId}`
          storedSumMig = Number(agg?.[0]?.s || 0)
        } else if (userId) {
          const agg: any = await prisma.$queryRaw`
            SELECT COALESCE(SUM(scans),0)::bigint as s
            FROM qr_migration
            WHERE user_id = ${userId}`
          storedSumMig = Number(agg?.[0]?.s || 0)
        }
      }
    } catch {}

  const storedTotal = storedSumQr + storedSumMig
  const totalScans = Math.max(Number(totalScansEvents || 0), storedTotal)

  // Compute totalClicks as max(event clicks vs stored clicks on short_urls)
  const storedClicksAgg = await prisma.short_urls.aggregate({ _sum: { clicks: true }, where: urlWhere })
  const storedClicks = Number(storedClicksAgg._sum.clicks || 0)
  const totalClicks = Math.max(Number(totalClicksEvents || 0), storedClicks)

    // If both series appear empty but totals indicate data exists, try widening the window to 90, then 365 days.
    const sumSeries = (rows: { count: number }[]) => rows.reduce((a, b) => a + (Number(b.count) || 0), 0)
    const scansSum = sumSeries(scansByDayRaw)
    const clicksSum = sumSeries(clicksByDayRaw)
    // Final safety: if series is empty but totals exist, first try to refill using unscoped events within the SAME window
    if (scansSum === 0 && totalScans > 0) {
      const wdMinus1 = Math.max(0, days - 1)
      try {
        const unscopedScans: { date: string; count: number }[] = await prisma.$queryRaw`
          SELECT to_char((se.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
          FROM scan_events se
          WHERE (se.scanned_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
          GROUP BY to_char((se.scanned_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
          ORDER BY date ASC`
        if (sumSeries(unscopedScans) > 0) {
          scansByDayRaw = unscopedScans
        }
      } catch {}
    }
    if (clicksSum === 0 && totalClicks > 0) {
      const wdMinus1 = Math.max(0, days - 1)
      try {
        const unscopedClicks: { date: string; count: number }[] = await prisma.$queryRaw`
          SELECT to_char((ce.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD') as date, COUNT(*)::int as count
          FROM click_events ce
          WHERE (ce.clicked_at AT TIME ZONE 'UTC')::date >= ((CURRENT_DATE - ${wdMinus1}::int * INTERVAL '1 day')::date)
          GROUP BY to_char((ce.clicked_at AT TIME ZONE 'UTC')::date, 'YYYY-MM-DD')
          ORDER BY date ASC`
        if (sumSeries(unscopedClicks) > 0) {
          clicksByDayRaw = unscopedClicks
        }
      } catch {}
    }
    const needWiden = (sumSeries(scansByDayRaw) === 0 && totalScans > 0) || (sumSeries(clicksByDayRaw) === 0 && totalClicks > 0)
    if (needWiden) {
      for (const candidate of [90, 365]) {
        const [altScans, altClicks] = await Promise.all([
          fetchScansDaily(candidate),
          fetchClicksDaily(candidate)
        ])
        const altScansSum = sumSeries(altScans)
        const altClicksSum = sumSeries(altClicks)
        if (altScansSum > 0 || altClicksSum > 0) {
          scansByDayRaw = altScans
          clicksByDayRaw = altClicks
          effectiveDays = candidate
          break
        }
      }
    }

    // Fetch top lists conditionally to avoid errors when event relations are missing
    let topQRCodesRaw: Array<{ id: string; name: string | null; type: string | null; _count?: { scan_events: number } }> = []
    let topShortUrlsRaw: Array<{ id: string; title: string | null; original_url: string | null; _count?: { click_events: number } }> = []
    if (hasScanEvents) {
      const withEvents = await prisma.qr_codes.findMany({
        where: qrWhere,
        select: { id: true, name: true, type: true, scans: true, _count: { select: { scan_events: true } } },
        orderBy: { scan_events: { _count: 'desc' } },
        take: 5
      })
      const anyEventQR = withEvents.some(r => (r._count?.scan_events || 0) > 0)
      if (anyEventQR) {
        topQRCodesRaw = withEvents
      } else {
        const byStored = await prisma.qr_codes.findMany({
          where: qrWhere,
          select: { id: true, name: true, type: true, scans: true },
          orderBy: { scans: 'desc' },
          take: 5
        })
        topQRCodesRaw = byStored.map(r => ({ id: r.id, name: r.name, type: r.type, _count: { scan_events: Number(r.scans || 0) } }))
      }
    } else {
      // Rank by stored scans when events table missing
      const list = await prisma.qr_codes.findMany({ where: qrWhere, select: { id: true, name: true, type: true, scans: true }, orderBy: { scans: 'desc' }, take: 5 })
      topQRCodesRaw = list.map(r => ({ id: r.id, name: r.name, type: r.type, _count: { scan_events: Number(r.scans || 0) } }))
    }

    if (hasClickEvents) {
      // Prefer ranking by event counts; if those are zero, fallback to stored clicks
      const withEvents = await prisma.short_urls.findMany({
        where: urlWhere,
        select: { id: true, title: true, original_url: true, _count: { select: { click_events: true } } },
        orderBy: { click_events: { _count: 'desc' } },
        take: 5
      })
      const anyEvent = withEvents.some(r => (r._count?.click_events || 0) > 0)
      if (anyEvent) {
        topShortUrlsRaw = withEvents
      } else {
        const byStored = await prisma.short_urls.findMany({ where: urlWhere, select: { id: true, title: true, original_url: true, clicks: true }, orderBy: { clicks: 'desc' }, take: 5 })
        topShortUrlsRaw = byStored.map(r => ({ id: r.id, title: r.title, original_url: r.original_url, _count: { click_events: Number(r.clicks || 0) } }))
      }
    } else {
      const list = await prisma.short_urls.findMany({ where: urlWhere, select: { id: true, title: true, original_url: true, clicks: true }, orderBy: { clicks: 'desc' }, take: 5 })
      topShortUrlsRaw = list.map(r => ({ id: r.id, title: r.title, original_url: r.original_url, _count: { click_events: Number(r.clicks || 0) } }))
    }

    // Zero-fill daily series for the requested window to avoid empty charts
    const zeroFill = (rows: Array<{ date: string | Date; count: number }>, windowDays: number) => {
      // Normalize DB rows to 'YYYY-MM-DD' (DATE in PG is tz-agnostic and driver often returns string)
      const map = new Map<string, number>()
      rows.forEach(r => {
        let key: string
        if (typeof (r as any).date === 'string') {
          key = String((r as any).date).slice(0, 10)
        } else if (r.date instanceof Date) {
          const dt = r.date
          const y = dt.getUTCFullYear()
          const m = String(dt.getUTCMonth() + 1).padStart(2, '0')
          const d = String(dt.getUTCDate()).padStart(2, '0')
          key = `${y}-${m}-${d}`
        } else {
          key = String((r as any).date).slice(0, 10)
        }
        map.set(key, Number((r as any).count) || 0)
      })

      // Build the last N days in UTC to align with PG CURRENT_DATE/DATE(...) semantics
      const out: { date: string; count: number }[] = []
      const today = new Date(); today.setUTCHours(0,0,0,0)
      for (let i = windowDays - 1; i >= 0; i--) {
        const d = new Date(today); d.setUTCDate(today.getUTCDate() - i)
        const y = d.getUTCFullYear()
        const m = String(d.getUTCMonth() + 1).padStart(2, '0')
        const dd = String(d.getUTCDate()).padStart(2, '0')
        const key = `${y}-${m}-${dd}`
        out.push({ date: key, count: map.get(key) ?? 0 })
      }
      return out
    }

    const summaryData = {
      qrCodeCount: qrCodeCount || 0,
      totalScans: totalScans || 0,
      activeQRCodes: activeQRCodes || 0,
      shortUrlCount: shortUrlCount || 0,
  totalClicks: totalClicks || 0,
      activeShortURLs: activeShortURLs || 0,
  effectiveDays,
  scansByDay: zeroFill(scansByDayRaw, effectiveDays),
  clicksByDay: zeroFill(clicksByDayRaw, effectiveDays),
      topQRCodes: topQRCodesRaw.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        scans: r._count.scan_events
      })),
      topShortUrls: topShortUrlsRaw.map(r => ({
        id: r.id,
        title: r.title,
        originalUrl: r.original_url,
        clicks: r._count.click_events
      }))
    }
    if (debug) {
      console.warn('[DASHBOARD API][debug] zero-filled series:', {
        scansByDay: summaryData.scansByDay,
        clicksByDay: summaryData.clicksByDay
      })
      console.warn('[DASHBOARD API] Returning Prisma summary data:', summaryData)
    }
  return NextResponse.json(summaryData)
  } catch (error) {
    console.error('[DASHBOARD API] Error (Prisma):', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
})
