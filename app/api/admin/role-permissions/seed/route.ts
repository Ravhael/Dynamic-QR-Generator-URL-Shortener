import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const RESOURCE_TYPES = [
  'qr_code','qr_category','short_url','url_category',
  'qr_analytics','qr_event_scans','url_analytics','url_event_clicks',
  'profile','user_setting','users','group_users'
];
const ACTIONS = ['create','read','update','delete','export'] as const;

// Default templates
const templates: Record<string, Record<string, Record<string,string>>> = {
  admin: (() => {
    const t: Record<string, Record<string,string>> = {};
    for (const r of RESOURCE_TYPES) { t[r] = {}; for (const a of ACTIONS) t[r][a] = 'all'; }
    return t;
  })(),
  user: {
    qr_code:      { create:'own', read:'group', update:'own', delete:'own', export:'group' },
    qr_category:  { create:'own', read:'group', update:'own', delete:'own', export:'group' },
    short_url:    { create:'own', read:'group', update:'own', delete:'own', export:'group' },
    url_category: { create:'own', read:'group', update:'own', delete:'own', export:'group' },
    // analytics aggregates (read/export only)
    qr_analytics:      { create:'none', read:'group', update:'none', delete:'none', export:'group' },
    url_analytics:     { create:'none', read:'group', update:'none', delete:'none', export:'group' },
    // raw events (read/export maybe group; no mutation)
    qr_event_scans:    { create:'none', read:'group', update:'none', delete:'none', export:'group' },
    url_event_clicks:  { create:'none', read:'group', update:'none', delete:'none', export:'group' },
    profile:      { create:'none', read:'own',  update:'own', delete:'none', export:'none' },
    user_setting: { create:'none', read:'own',  update:'own', delete:'none', export:'none' },
    users:        { create:'none', read:'group',update:'none', delete:'none', export:'none' },
    group_users:  { create:'none', read:'group',update:'none', delete:'none', export:'none' },
  }
};

export async function POST() {
  try {
    // Ensure resource types exist
    for (const rt of RESOURCE_TYPES) {
      const exists = await prisma.resource_types.findFirst({ where: { name: rt } });
      if (!exists) {
        await prisma.resource_types.create({ data: { name: rt, description: rt } });
      }
    }

    const roles = Object.keys(templates);
    for (const role of roles) {
      const matrix = templates[role];
      for (const rt of Object.keys(matrix)) {
        const row = matrix[rt];
        for (const act of ACTIONS) {
          const scope = row[act] || 'none';
          if (scope === 'none') {
            // ensure removed
            continue;
          }
          const existing = await prisma.role_permissions.findFirst({ where: { role, resource_type: rt, permission_type: act } });
          if (existing) {
            await prisma.role_permissions.update({ where: { id: existing.id }, data: { scope } });
          } else {
            await prisma.role_permissions.create({ data: { role, resource_type: rt, permission_type: act, scope } });
          }
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Default permissions seeded' });
  } catch (e) {
    console.error('Seed error', e);
    return NextResponse.json({ success: false, message: 'Seed failed' }, { status: 500 });
  }
}
