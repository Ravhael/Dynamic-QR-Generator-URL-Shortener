import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/lib/ensurePermission';

export const dynamic = 'force-dynamic';

// Handler receives the already-resolved user from `withPermission` which uses getUserFromRequest
export const GET = withPermission({ resource: 'url_analytics', action: 'read' }, async (request: NextRequest, ctx: any, user: { id: string; role: string; groupId: number }) => {
  if (!user) {
    return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 });
  }
  const isAdmin = ['admin','administrator'].includes((user.role || '').toLowerCase());

  // Build base where for scoping (only active short urls)
  const baseWhere: any = { short_urls: { is_active: true } };
  if (!isAdmin) {
    baseWhere.short_urls.user_id = user.id;
  }

  try {
    // Run queries in parallel (distinct). Use raw to leverage indexes directly & avoid large client memory.
    const [countries, cities, devices, browsers, oses, categories] = await Promise.all([
      prisma.$queryRawUnsafe<{ country: string | null }[]>(`SELECT DISTINCT country FROM url_click_analytics WHERE country IS NOT NULL ORDER BY country ASC LIMIT 300`),
      prisma.$queryRawUnsafe<{ city: string | null }[]>(`SELECT DISTINCT city FROM url_click_analytics WHERE city IS NOT NULL ORDER BY city ASC LIMIT 300`),
      prisma.$queryRawUnsafe<{ device_type: string | null }[]>(`SELECT DISTINCT device_type FROM url_click_analytics WHERE device_type IS NOT NULL ORDER BY device_type ASC`),
      prisma.$queryRawUnsafe<{ browser: string | null }[]>(`SELECT DISTINCT browser FROM url_click_analytics WHERE browser IS NOT NULL ORDER BY browser ASC`),
      prisma.$queryRawUnsafe<{ operating_system: string | null }[]>(`SELECT DISTINCT operating_system FROM url_click_analytics WHERE operating_system IS NOT NULL ORDER BY operating_system ASC`),
      prisma.url_categories.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } })
    ]);

    return NextResponse.json({
      success: true,
      filterOptions: {
        countries: countries.map(c => c.country).filter(Boolean),
        cities: cities.map(c => c.city).filter(Boolean),
        devices: devices.map(d => d.device_type).filter(Boolean),
        browsers: browsers.map(b => b.browser).filter(Boolean),
        operatingSystems: oses.map(o => o.operating_system).filter(Boolean),
        categories: categories.map(c => ({ id: c.id, name: c.name }))
  }
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: 'Failed to load filters', details: e.message }, { status: 500 });
  }
});
