import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUserAgent } from '../../../lib/userAgent';

// Lightweight cache (in-memory) for short_code -> original_url to reduce DB hits for hot links.
// Simple LRU-ish via Map iteration trimming.
const CACHE = new Map<string, { url: string; active: boolean; expiresAt?: number; id: string }>();
const MAX_CACHE = 500; // tune as needed
const TTL_MS = 5 * 60 * 1000; // 5 minutes

function setCache(code: string, entry: { url: string; active: boolean; expiresAt?: Date | null; id: string }) {
  if (CACHE.size > MAX_CACHE) {
    // trim oldest 50
    let count = 0;
    for (const key of CACHE.keys()) {
      CACHE.delete(key);
      if (++count >= 50) break;
    }
  }
  CACHE.set(code, { url: entry.url, active: entry.active, expiresAt: entry.expiresAt ? entry.expiresAt.getTime() : undefined, id: entry.id });
}

function getCache(code: string) {
  const v = CACHE.get(code);
  if (!v) return null;
  if (v.expiresAt && Date.now() > v.expiresAt) {
    CACHE.delete(code);
    return null;
  }
  return v;
}

// Next.js 15 RouteContext: params is a Promise
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params
  if (!code || code.length > 64) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }

  /**
   * Two-Layer Click Analytics Model
   * --------------------------------
   * Layer 1 (Base): click_events => ONLY existence + timestamp
   * Layer 2 (Enriched): url_click_analytics => geo/device/utm/etc.
   * Rationale: keep redirect path fast & append enrichment asynchronously / best-effort.
   * This file: creates base event (blocking), schedules enriched row (fire & forget).
   * Geo backfill route: /api/admin/urlanalytics/enrich-geo
   */

  // Try cache
  let record = getCache(code);
  if (!record) {
    const dbRec = await prisma.short_urls.findFirst({
      where: { short_code: code, is_active: true },
      select: { id: true, original_url: true, is_active: true, expires_at: true, max_clicks: true, clicks: true }
    });
    if (!dbRec) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check expiration
    if (dbRec.expires_at && dbRec.expires_at.getTime() < Date.now()) {
      return NextResponse.json({ error: 'Expired' }, { status: 410 });
    }
    // Check max clicks
    if (dbRec.max_clicks && dbRec.clicks && dbRec.clicks >= dbRec.max_clicks) {
      return NextResponse.json({ error: 'Limit reached' }, { status: 410 });
    }

    record = { url: dbRec.original_url, active: !!dbRec.is_active, expiresAt: dbRec.expires_at?.getTime(), id: dbRec.id };
    setCache(code, { url: dbRec.original_url, active: !!dbRec.is_active, expiresAt: dbRec.expires_at, id: dbRec.id });
  }

  if (!record.active) {
    return NextResponse.json({ error: 'Inactive' }, { status: 410 });
  }

  // Feature gating (per-user analytics) could be added by joining user settings if needed.
  // For now we always record a click event.
  try {
    const now = new Date();
    const ua = req.headers.get('user-agent') || '';
    const ref = req.headers.get('referer') || null;
    const forwarded = req.headers.get('x-forwarded-for') || '';
    const ip = forwarded.split(',')[0].trim() || (req as any).ip || '0.0.0.0';
    const uaParsed = parseUserAgent(ua);
    // UTM placeholders (only used if columns exist in analytics layer)
    const urlObj = new URL(req.url, req.nextUrl?.origin || 'http://localhost');
    const utm_source = urlObj.searchParams.get('utm_source') || null;
    const utm_medium = urlObj.searchParams.get('utm_medium') || null;
    const utm_campaign = urlObj.searchParams.get('utm_campaign') || null;

    // 1. Minimal base event (only what schema supports: url_id + clicked_at)
    const baseEvent = await prisma.click_events.create({
      data: {
        url_id: record.id,
        clicked_at: now,
      },
      select: { id: true }
    });

    // 2. Enriched analytics layer (best effort). If fails, we log but do not block redirect.
    //    Uses url_click_analytics table which is designed to store detailed fields.
    prisma.url_click_analytics.create({
      data: {
        click_event_id: baseEvent.id,
        short_url_id: record.id,
        clicked_at: now,
        ip_address: ip,
        user_agent: ua || null,
        referrer: ref,
        device_type: uaParsed.deviceType || null,
        browser: uaParsed.browser || null,
        operating_system: uaParsed.os || null,
        utm_source,
        utm_medium,
        utm_campaign,
        // country / city left null (geo enrichment service can backfill later)
      }
    }).catch(err => {
      if (process.env.LOG_URL_CLICKS) {
        console.warn('[SHORT URL REDIRECT] analytics insert failed (non-blocking):', err?.message);
      }
    });

    // 3. Increment denormalized counter (non-critical)
    prisma.short_urls.update({ where: { id: record.id }, data: { clicks: { increment: 1 }, updated_at: now } }).catch(() => {});
  } catch (e) {
    if (process.env.LOG_URL_CLICKS) {
      console.warn('[SHORT URL REDIRECT] logging pipeline error:', (e as any)?.message);
    }
  }

  return NextResponse.redirect(record.url, { status: 302 });
}
