import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ACTIONS = ['create','read','update','delete','export'] as const;
const RESOURCE_TYPES = [ 'qr_code','qr_category','short_url','url_category','profile','user_setting','users','group_users' ];

const roleTemplates: Record<string, Record<string, Record<string,string>>> = {
  admin: (() => { const t: any = {}; for (const r of RESOURCE_TYPES){ t[r]={}; for (const a of ACTIONS) t[r][a]='all'; } return t; })(),
  user: {
    qr_code:      { create:'own', read:'group', update:'own', delete:'own', export:'group' },
    qr_category:  { create:'own', read:'group', update:'own', delete:'own', export:'group' },
    short_url:    { create:'own', read:'group', update:'own', delete:'own', export:'group' },
    url_category: { create:'own', read:'group', update:'own', delete:'own', export:'group' },
    profile:      { create:'none', read:'own',  update:'own', delete:'none', export:'none' },
    user_setting: { create:'none', read:'own',  update:'own', delete:'none', export:'none' },
    users:        { create:'none', read:'group',update:'none', delete:'none', export:'none' },
    group_users:  { create:'none', read:'group',update:'none', delete:'none', export:'none' },
  }
};

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();
    if (!role) return NextResponse.json({ success: false, message: 'role required' }, { status: 400 });
    const template = roleTemplates[role];
    if (!template) return NextResponse.json({ success: false, message: 'No template for role' }, { status: 400 });

    // Remove existing for that role
    await prisma.role_permissions.deleteMany({ where: { role } });

    for (const rt of Object.keys(template)) {
      for (const act of ACTIONS) {
        const scope = template[rt][act];
        if (scope === 'none') continue;
        await prisma.role_permissions.create({ data: { role, resource_type: rt, permission_type: act, scope } });
      }
    }

    return NextResponse.json({ success: true, message: 'Role reset to defaults' });
  } catch (e) {
    console.error('Reset error', e);
    return NextResponse.json({ success: false, message: 'Reset failed' }, { status: 500 });
  }
}
