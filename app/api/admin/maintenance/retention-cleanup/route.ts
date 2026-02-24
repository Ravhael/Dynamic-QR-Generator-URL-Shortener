import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loadSystemConfig } from '@/lib/systemConfig';
import { getToken } from 'next-auth/jwt';
import { isTwoFactorEnabled, validateTOTP } from '@/lib/twoFactor';

/**
 * Retention Cleanup Strategy (enhanced for per-user overrides)
 * ------------------------------------------------------------
 * Global system setting (systemConfig.dataRetentionDays) defines the default retention horizon.
 * Users can optionally specify a custom per-user override in user_settings.data_retention_days.
 *
 * Deletion logic rules:
 * 1. If user override (U) exists AND 0 < U < SystemDays (S): we delete data older than U for that user.
 * 2. If user override U >= S: we DO NOT extend retention (safer; we simply fall back to S when doing a pure global pass).
 * 3. Tables targeted: scan_events (scanned_at), click_events (clicked_at), user_activity (created_at)
 * 4. We perform two phases:
 *    Phase A (User-specific short overrides): For each distinct user with a valid shorter override, delete rows older than that user's cutoff.
 *    Phase B (Global baseline): Delete rows older than the system-wide cutoff for ALL remaining data.
 *    This ensures users with shorter limits have their data trimmed earlier without performing complex per-row logic in a single query.
 *
 * Optional dryRun mode:
 *  - Supply query parameter ?dryRun=1 (or truthy) to compute candidate counts WITHOUT deleting. (We use COUNT(*) queries per phase.)
 *  - NOTE: dryRun counts are approximate if data changes concurrently; we do not lock rows.
 *
 * Performance considerations / Future improvements:
 *  - If user count large, per-user loop could be expensive. We could batch by grouping identical override days or using a single DELETE with OR clauses.
 *  - For very large datasets, consider chunked deletes using LIMIT and repeated invocations (or background job / queue / partitioning strategy).
 *  - Add index recommendations: ensure indexes on (user_id, scanned_at), (user_id, clicked_at), (user_id, created_at) for performance.
 */

// Admin-only POST endpoint to purge old analytic/activity data based on dataRetentionDays.
// Non-scheduled manual trigger; could later be invoked by external cron.
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const dryRunParam = url.searchParams.get('dryRun') || url.searchParams.get('dryrun');
    const dryRun = !!dryRunParam && ['1','true','yes','on'].includes(dryRunParam.toLowerCase());

    const token: any = await getToken({ req });
    if (!token || !token.role || !['ADMIN','admin','Administrator','administrator'].includes(token.role)) {
      return NextResponse.json({ _error: 'Forbidden' }, { status: 403 });
    }

    // If user individually enabled 2FA, require valid TOTP code via header for this destructive operation
    try {
      const twoFAEnabled = await isTwoFactorEnabled(token.id);
      if (twoFAEnabled) {
        const code = req.headers.get('x-totp-code');
        const ok = await validateTOTP(token.id, code);
        if (!ok) {
          return NextResponse.json({ _error: 'Invalid or missing TOTP code', twoFactorRequired: true }, { status: 401 });
        }
      }
    } catch (e) {
      console.error('[RETENTION_CLEANUP][2FA_CHECK_ERROR]', e);
      return NextResponse.json({ _error: '2FA validation failed' }, { status: 500 });
    }

    const cfg = await loadSystemConfig();
    const systemDays = cfg.dataRetentionDays;
    if (!systemDays || systemDays <= 0) {
      return NextResponse.json({ skipped: true, reason: 'dataRetentionDays not configured > 0' });
    }

    const systemCutoff = new Date(Date.now() - systemDays * 24 * 60 * 60 * 1000);

    // Fetch all user overrides; we will split into shorter vs longer/equal.
    const allOverrides: Array<{ user_id: string; data_retention_days: number }> = await prisma.$queryRawUnsafe(
      `SELECT user_id, data_retention_days
       FROM user_settings
       WHERE data_retention_days IS NOT NULL
         AND data_retention_days > 0`,
      [] as any // no params
    );
    const userOverrides = allOverrides.filter(o => o.data_retention_days < systemDays);
    const skippedLonger = allOverrides.filter(o => o.data_retention_days >= systemDays).map(o => ({ user_id: o.user_id, days: o.data_retention_days }));

    const perUserResults: any[] = [];
    let totals = { scan_events: 0, click_events: 0, user_activity: 0 };
  // TODO: Consider recording a retention_cleanup_log table for auditing each run (timestamp, actor, dryRun, counts).
  // TODO: If data volumes become large, implement chunked deletes with LIMIT N RETURNING id loop until 0 rows.
  // TODO: Add metric emission (e.g., to Prometheus / analytics) after completion.

    // Phase A: Apply stricter per-user retention deletes first.
    for (const u of userOverrides) {
      const { user_id, data_retention_days } = u;
      const cutoff = new Date(Date.now() - data_retention_days * 24 * 60 * 60 * 1000);

      let scanCount = 0, clickCount = 0, activityCount = 0;
      if (dryRun) {
        const [scanRows, clickRows, activityRows]: any = await Promise.all([
          prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM scan_events WHERE user_id = $1 AND scanned_at < $2`, user_id, cutoff as any),
          prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM click_events WHERE user_id = $1 AND clicked_at < $2`, user_id, cutoff as any),
          prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM user_activity WHERE user_id = $1 AND created_at < $2`, user_id, cutoff as any),
        ]);
        scanCount = scanRows?.[0]?.c || 0;
        clickCount = clickRows?.[0]?.c || 0;
        activityCount = activityRows?.[0]?.c || 0;
      } else {
        const scanDel = await prisma.$executeRawUnsafe(`DELETE FROM scan_events WHERE user_id = $1 AND scanned_at < $2`, user_id, cutoff as any);
        const clickDel = await prisma.$executeRawUnsafe(`DELETE FROM click_events WHERE user_id = $1 AND clicked_at < $2`, user_id, cutoff as any);
        const activityDel = await prisma.$executeRawUnsafe(`DELETE FROM user_activity WHERE user_id = $1 AND created_at < $2`, user_id, cutoff as any);
        scanCount = typeof scanDel === 'number' ? scanDel : 0;
        clickCount = typeof clickDel === 'number' ? clickDel : 0;
        activityCount = typeof activityDel === 'number' ? activityDel : 0;
      }
      totals.scan_events += scanCount;
      totals.click_events += clickCount;
      totals.user_activity += activityCount;
      perUserResults.push({ user_id, days: data_retention_days, cutoff: cutoff.toISOString(), deleted: { scan_events: scanCount, click_events: clickCount, user_activity: activityCount } });
    }

    // Phase B: Global baseline delete for rows older than systemCutoff (excluding already handled per-user cases implicitly).
    // NOTE: Rows already deleted in Phase A are naturally gone; we do not need additional filtering.
    let globalScan = 0, globalClick = 0, globalActivity = 0;
    if (dryRun) {
      const [scanRows, clickRows, activityRows]: any = await Promise.all([
        prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM scan_events WHERE scanned_at < $1`, systemCutoff as any),
        prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM click_events WHERE clicked_at < $1`, systemCutoff as any),
        prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM user_activity WHERE created_at < $1`, systemCutoff as any),
      ]);
      globalScan = scanRows?.[0]?.c || 0;
      globalClick = clickRows?.[0]?.c || 0;
      globalActivity = activityRows?.[0]?.c || 0;
    } else {
      const scanDel = await prisma.$executeRawUnsafe(`DELETE FROM scan_events WHERE scanned_at < $1`, systemCutoff as any);
      const clickDel = await prisma.$executeRawUnsafe(`DELETE FROM click_events WHERE clicked_at < $1`, systemCutoff as any);
      const activityDel = await prisma.$executeRawUnsafe(`DELETE FROM user_activity WHERE created_at < $1`, systemCutoff as any);
      globalScan = typeof scanDel === 'number' ? scanDel : 0;
      globalClick = typeof clickDel === 'number' ? clickDel : 0;
      globalActivity = typeof activityDel === 'number' ? activityDel : 0;
    }

    totals.scan_events += globalScan;
    totals.click_events += globalClick;
    totals.user_activity += globalActivity;

    return NextResponse.json({
      ok: true,
      dryRun,
      system: { days: systemDays, cutoff: systemCutoff.toISOString(), globalDeleted: { scan_events: globalScan, click_events: globalClick, user_activity: globalActivity } },
      perUser: perUserResults,
      skippedLonger, // users whose override >= system baseline (not extending retention)
      totals,
      note: 'Per-user shorter overrides applied before global baseline.'
    });
  } catch (e: any) {
    console.error('[RETENTION_CLEANUP_ERROR]', e);
    return NextResponse.json({ _error: 'Internal error', detail: e?.message }, { status: 500 });
  }
}
