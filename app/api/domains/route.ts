import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/api-permissions';

// GET /api/domains -> returns list of available custom/base domains
// Strategy:
// 1. Collect distinct custom_domain values from short_urls (non-null, active)
// 2. Collect configured domains from system_settings with category = 'domain' (if any)
// 3. Always include the current request host as fallback/base domain
// 4. De-duplicate, sort, and return JSON { domains: string[] }
// 5. Optional auth: require authenticated user (adjust if should be public)

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req as any);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const hostHeader = req.headers.get('host') || '';
    const baseDomain = hostHeader.split(':')[0];

    // Distinct custom domains from short_urls
    const customDomainsRaw = await prisma.short_urls.findMany({
      where: {
        custom_domain: { not: null },
      },
      select: { custom_domain: true },
      distinct: ['custom_domain'],
      take: 100, // safety cap
    });

    const customDomains = customDomainsRaw
      .map(d => d.custom_domain)
      .filter((d): d is string => !!d);

    // System settings domains (optional)
    const systemDomainSettings = await prisma.system_settings.findMany({
      where: {
        category: 'domain',
        is_active: true,
      },
      select: { setting_key: true, setting_value: true },
      take: 100,
    }).catch(() => []);

    const settingsDomains = systemDomainSettings
      .map(s => (s.setting_value || s.setting_key || '').trim())
      .filter(v => !!v);

    const envDomains = process.env.ALLOWED_DOMAINS
      ? process.env.ALLOWED_DOMAINS.split(',').map(d => d.trim()).filter(Boolean)
      : [];

  const all = [baseDomain, ...customDomains, ...settingsDomains, ...envDomains];
    const unique = Array.from(new Set(all.filter(Boolean)));
    unique.sort();

    return NextResponse.json({ domains: unique });
  } catch (error: any) {
    console.error('[GET /api/domains] error', error);
    return NextResponse.json({ error: 'Failed to load domains' }, { status: 500 });
  }
}
