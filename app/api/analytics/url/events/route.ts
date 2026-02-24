import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-permissions';

// Query params: urlId?, dateRange? (1d|7d|30d|90d|all), device?, country?, city?, cursor?, limit?
// Returns real click events from url_click_analytics joined with short_urls (scoped by user unless admin)
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req as any);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    const isAdmin = user.userRole === 'admin';

    const { searchParams } = new URL(req.url);
    const urlId = searchParams.get('urlId') || undefined;
    const dateRange = searchParams.get('dateRange') || '7d';
    const device = searchParams.get('device') || undefined; // expecting device_type values (mobile/tablet/desktop)
    const country = searchParams.get('country') || undefined;
    const city = searchParams.get('city') || undefined;
    const cursor = searchParams.get('cursor') || undefined; // cursor = clicked_at ISO + id tie breaker? We'll use event id
    const limitParam = parseInt(searchParams.get('limit') || '50');
    const limit = Math.min(Math.max(limitParam, 1), 200); // clamp 1..200

    // Build where clause
    const where: any = {};

    // Scope URL ownership for non-admins
    if (!isAdmin) {
      where.short_urls = { user_id: user.userId };
    }
    if (urlId && urlId !== 'all') {
      where.short_url_id = urlId;
    }

    // Date range cut-off
    if (dateRange !== 'all') {
      const days = parseInt(dateRange.replace('d', ''));
      if (!isNaN(days)) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        where.clicked_at = { gte: cutoff };
      }
    }

    if (device && device !== 'all') {
      // Map frontend device to stored columns: we store device_type OR operating_system
      where.OR = [
        { device_type: device },
        { operating_system: { contains: device, mode: 'insensitive' } },
      ];
    }
    if (country && country !== 'all') {
      where.country = { equals: country };
    }
    if (city && city !== 'all') {
      where.city = { equals: city };
    }

    // Cursor pagination based on created_at (clicked_at) + id fallback
    // We'll fetch (limit + 1) to know if there is a next page.

    const events = await prisma.url_click_analytics.findMany({
      where,
      orderBy: [
        { clicked_at: 'desc' },
        { id: 'desc' },
      ],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor } } : {}),
      ...(cursor ? { skip: 1 } : {}), // skip cursor itself
      select: {
        id: true,
        short_url_id: true,
        clicked_at: true,
        ip_address: true,
        country: true,
        city: true,
        region: true,
        timezone: true,
        isp: true,
        device_type: true,
        operating_system: true,
        browser: true,
        short_urls: {
          select: {
            title: true,
            original_url: true,
            short_code: true,
            category_id: true,
            url_categories: { select: { name: true } },
          }
        }
      }
    });

    let hasMore = false;
    let sliced = events;
    if (events.length > limit) {
      hasMore = true;
      sliced = events.slice(0, limit);
    }

    const mapped = sliced.map(ev => ({
      id: ev.id,
      urlId: ev.short_url_id,
      urlTitle: ev.short_urls?.title || ev.short_urls?.short_code || 'Untitled',
      urlCategory: ev.short_urls?.url_categories?.name || null,
      originalUrl: ev.short_urls?.original_url || '',
      shortUrl: ev.short_urls?.short_code || '',
      clickedAt: ev.clicked_at?.toISOString() || null,
      ipAddress: ev.ip_address || null,
      location: {
        country: ev.country || 'Unknown',
        city: ev.city || 'Unknown',
        region: ev.region || null,
        timezone: ev.timezone || null,
        isp: ev.isp || null,
      },
      device: {
        type: (ev.device_type || (ev.operating_system?.toLowerCase().includes('android') ? 'mobile' : 'desktop')) as 'mobile' | 'tablet' | 'desktop',
        os: ev.operating_system || 'Unknown',
        browser: ev.browser || 'Unknown'
      }
    }));

    return NextResponse.json({
      success: true,
      total: mapped.length,
      hasMore,
      nextCursor: hasMore ? mapped[mapped.length - 1].id : null,
      events: mapped,
    });
  } catch (error: any) {
    console.error('[URL EVENTS API] Error', error);
    return NextResponse.json({ success: false, error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
