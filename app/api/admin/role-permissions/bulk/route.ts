import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/*
  Bulk upsert/delete role permissions.
  Input: {
    items: Array<{
      role: string;
      resource_type: string;
      permission_type: string; // create | read | update | delete | export
      scope: string; // all | group | own | none
      description?: string;
    }>
  }
  Behavior:
    - If scope === 'none': if record exists -> delete, else skip.
    - Else: upsert (findFirst then update or create) with provided scope & description.
  Returns updated list for the provided role(s) filtered to affected resource_types.
*/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) {
      return NextResponse.json({ success: false, message: 'No items provided' }, { status: 400 });
    }

    // Normalize & validate basic fields
    const normalized = items.map((i: any) => ({
      role: String(i.role).trim(),
      resource_type: String(i.resource_type).trim(),
      permission_type: String(i.permission_type).trim(),
      scope: String(i.scope || '').trim(),
      description: i.description ? String(i.description) : ''
    })).filter(i => i.role && i.resource_type && i.permission_type);

    const results: any[] = [];

    for (const entry of normalized) {
      let { role, resource_type, permission_type, scope, description } = entry;

      const isAdmin = ['admin','administrator','superadmin'].includes(role.toLowerCase());
      if (!isAdmin) {
        if (['update','delete'].includes(permission_type) && ['group','all'].includes(scope)) {
          scope = 'own';
        }
      }

      // Delete path for scope=none
      if (scope === 'none') {
        const existing = await prisma.role_permissions.findFirst({ where: { role, resource_type, permission_type } });
        if (existing) {
          await prisma.role_permissions.delete({ where: { id: existing.id } });
        }
        continue; // Skip collecting result
      }

      // Upsert manually
      const existing = await prisma.role_permissions.findFirst({ where: { role, resource_type, permission_type } });
      let record;
      if (existing) {
        record = await prisma.role_permissions.update({
          where: { id: existing.id },
          data: { scope, description }
        });
      } else {
        record = await prisma.role_permissions.create({
          data: { role, resource_type, permission_type, scope, description }
        });
      }
      results.push(record);
    }

    return NextResponse.json({ success: true, data: results, message: 'Bulk permissions processed' });
  } catch (err) {
    console.error('Bulk role-permissions error:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
