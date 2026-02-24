import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-permissions';
import { Prisma } from '@prisma/client';

// Utility safe number conversion
const toNum = (v: any): number => (typeof v === 'bigint' ? Number(v) : typeof v === 'number' ? v : parseInt(String(v) || '0')) || 0;

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request as any);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const isAdmin = user.userRole === 'admin';

    // Pre-build where filter for short_urls owned by user (if not admin)
    const shortUrlWhere = isAdmin ? { is_active: true } : { is_active: true, user_id: user.userId };

    // 1. total & active URLs (active == is_active true for now)
    const [totalUrls, activeUrls] = await Promise.all([
      prisma.short_urls.count({ where: shortUrlWhere }),
      prisma.short_urls.count({ where: shortUrlWhere }),
    ]);

    // Check if analytics table has rows at all (fast path) – if empty return zeros without failing
    const analyticsExists = await prisma.url_click_analytics.findFirst({ select: { id: true } }).then(r => !!r).catch(() => false);

    // Build conditional where for analytics joins / group-bys
    const analyticsWhere = isAdmin ? {} : { short_urls: { user_id: user.userId } };

    // Collect non-fatal warnings
    const warnings: string[] = [];

    // 2. Total clicks (flat schema uses direct columns device_type, country, etc.)
    let totalClicks = 0;
    if (analyticsExists) {
      try {
        totalClicks = await prisma.url_click_analytics.count({ where: analyticsWhere });
      } catch (e: any) {
        warnings.push('totalClicks failed: ' + e.message);
      }
    }

    // 3. Clicks by day (last 30 days)
    let clicksByDay: { date: string; count: number }[] = [];
    if (analyticsExists) {
      try {
        let rows: any[] = [];
        if (isAdmin) {
          rows = await prisma.$queryRaw<any[]>`
            SELECT DATE(uca.clicked_at) AS date, COUNT(*)::bigint AS count
            FROM url_click_analytics uca
            INNER JOIN short_urls su ON uca.short_url_id = su.id
            WHERE uca.clicked_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(uca.clicked_at)
            ORDER BY DATE(uca.clicked_at) DESC`;
        } else {
          rows = await prisma.$queryRaw<any[]>`
            SELECT DATE(uca.clicked_at) AS date, COUNT(*)::bigint AS count
            FROM url_click_analytics uca
            INNER JOIN short_urls su ON uca.short_url_id = su.id
            WHERE uca.clicked_at >= NOW() - INTERVAL '30 days' AND su.user_id = ${user.userId}
            GROUP BY DATE(uca.clicked_at)
            ORDER BY DATE(uca.clicked_at) DESC`;
        }
        clicksByDay = rows.map(r => ({ date: r.date, count: toNum(r.count) }));
      } catch (e: any) {
        warnings.push('clicksByDay failed: ' + e.message);
      }
    }

    // 4. Device breakdown (device_type)
    let clicksByDevice: { device: string; count: number }[] = [];
    if (analyticsExists) {
      try {
        const rows = await prisma.url_click_analytics.groupBy({ by: ['device_type'], where: analyticsWhere, _count: { _all: true } });
        clicksByDevice = rows.map(r => ({ device: r.device_type || 'Unknown', count: r._count._all })).sort((a, b) => b.count - a.count);
      } catch (e: any) {
        warnings.push('device groupBy failed: ' + e.message);
      }
    }

    // 5. Location (country) top 10
    let clicksByLocation: { location: string; count: number }[] = [];
    if (analyticsExists) {
      try {
        const rows = await prisma.url_click_analytics.groupBy({ by: ['country'], where: analyticsWhere, _count: { _all: true } });
        clicksByLocation = rows.map(r => ({ location: r.country || 'Unknown', count: r._count._all })).sort((a, b) => b.count - a.count).slice(0, 10);
      } catch (e: any) {
        warnings.push('country groupBy failed: ' + e.message);
      }
    }

    // 6. OS breakdown
    let clicksByOS: { os: string; count: number }[] = [];
    if (analyticsExists) {
      try {
        const rows = await prisma.url_click_analytics.groupBy({ by: ['operating_system'], where: analyticsWhere, _count: { _all: true } });
        clicksByOS = rows.map(r => ({ os: r.operating_system || 'Unknown', count: r._count._all })).sort((a, b) => b.count - a.count).slice(0, 10);
      } catch (e: any) {
        warnings.push('os groupBy failed: ' + e.message);
      }
    }

    // 7. IP breakdown top 15 (with normalization)
    let clicksByIp: { ip: string; count: number; ipLabel?: string; scope?: string }[] = [];
    if (analyticsExists) {
      try {
        const rows = await prisma.url_click_analytics.groupBy({ by: ['ip_address'], where: analyticsWhere, _count: { _all: true } });
        const normalizeIp = (ip?: string | null) => {
          if (!ip) return { ip: 'Unknown', ipLabel: 'Unknown', scope: 'unknown' };
          const raw = ip;
          // Loopback IPv4/IPv6
          if (raw === '127.0.0.1' || raw === '::1') return { ip: raw, ipLabel: 'Localhost', scope: 'loopback' };
          // Remove IPv6 prefix if coming like ::ffff:192.168.0.5
          const cleaned = raw.startsWith('::ffff:') ? raw.replace('::ffff:', '') : raw;
          // Private ranges
          if (/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(cleaned)) return { ip: cleaned, ipLabel: 'Private Network', scope: 'private' };
          if (/^fd|^fc/i.test(cleaned)) return { ip: cleaned, ipLabel: 'Private Network', scope: 'private' }; // simple IPv6 unique local check
            return { ip: cleaned, ipLabel: cleaned, scope: 'public' };
        };
        clicksByIp = rows
          .map(r => {
            const meta = normalizeIp(r.ip_address as string | undefined);
            return { ip: meta.ip, ipLabel: meta.ipLabel, scope: meta.scope, count: r._count._all };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 15);
      } catch (e: any) {
        warnings.push('ip groupBy failed: ' + e.message);
      }
    }

    // 8. Top URLs (with click counts if analytics exists)
    let topUrls: { id: string; title: string | null; short_code: string; original_url: string; count: number }[] = [];
    if (analyticsExists) {
      try {
        let topRows: any[] = [];
        if (isAdmin) {
          topRows = await prisma.$queryRaw<any[]>`
            SELECT su.id, su.title, su.short_code, su.original_url, COUNT(uca.id)::bigint AS count
            FROM short_urls su
            LEFT JOIN url_click_analytics uca ON su.id = uca.short_url_id
            WHERE su.is_active = true
            GROUP BY su.id, su.title, su.short_code, su.original_url
            ORDER BY count DESC
            LIMIT 10`;
        } else {
          topRows = await prisma.$queryRaw<any[]>`
            SELECT su.id, su.title, su.short_code, su.original_url, COUNT(uca.id)::bigint AS count
            FROM short_urls su
            LEFT JOIN url_click_analytics uca ON su.id = uca.short_url_id
            WHERE su.is_active = true AND su.user_id = ${user.userId}
            GROUP BY su.id, su.title, su.short_code, su.original_url
            ORDER BY count DESC
            LIMIT 10`;
        }
        topUrls = topRows.map(r => ({ id: r.id, title: r.title, short_code: r.short_code, original_url: r.original_url, count: toNum(r.count) }));
      } catch (e: any) {
        warnings.push('topUrls failed: ' + e.message);
      }
    } else {
      // Fallback: just list recent active short urls (count=0)
      const fallback = await prisma.short_urls.findMany({
        where: shortUrlWhere,
        orderBy: { created_at: 'desc' },
        take: 10,
        select: { id: true, title: true, short_code: true, original_url: true }
      });
      topUrls = fallback.map(f => ({ id: f.id, title: f.title, short_code: f.short_code, original_url: f.original_url, count: 0 }));
    }

    // Derived metrics
    const avgClicksPerUrl = totalUrls > 0 ? Math.round(totalClicks / totalUrls) : 0;
    const dailyAverage = clicksByDay.length > 0 ? Math.round(totalClicks / clicksByDay.length) : 0;

    const payload: any = {
      totalUrls,
      totalClicks,
      activeUrls,
      clicksOverTime: clicksByDay, // preserve existing naming
      clicksByDay,
      clicksByDevice,
      clicksByLocation,
      clicksByOS,
  clicksByIp,
      topUrls,
      avgClicksPerUrl,
      dailyAverage,
    };

    if (warnings.length) payload.warnings = warnings;

    return NextResponse.json(payload, { status: 200 });
  } catch (error: any) {
    console.error('[URL ANALYTICS PRISMA] Error', error);
    return NextResponse.json({ success: false, error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
