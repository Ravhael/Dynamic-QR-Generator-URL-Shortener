import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import getNextAuthToken from '@/lib/getNextAuthToken';
import { PrismaClient } from '@prisma/client';
import { isAdministrator } from '@/lib/auth';
import { invalidateMenuCache } from '@/lib/menuTree';

const prisma = new PrismaClient();

// Bulk save endpoint to persist an entire permissions matrix as currently represented on the client.
// Expected body: { permissions: Array<{ role: string; menu_item_id: number; enabled?: boolean; can_view?: boolean; can_create?: boolean; can_edit?: boolean; can_delete?: boolean; can_export?: boolean; }> }
// For each row we will upsert. If granular can_* are provided they are authoritative; otherwise `enabled` acts as toggle for all.
export async function POST(request: NextRequest) {
  try {
    const token = await getNextAuthToken(request as any);
    if (!token) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    if (!await isAdministrator(request)) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.permissions)) {
      return NextResponse.json({ success: false, message: 'Invalid payload: permissions array required' }, { status: 400 });
    }

    const permissions = body.permissions as any[];
    if (!permissions.length) {
      return NextResponse.json({ success: true, processed: 0, message: 'No permissions to process' });
    }

    // Fetch all roles once to map name -> { id, name }
    const distinctRoleNames = Array.from(new Set(permissions.map(p => p.role).filter(Boolean)));
    const roleRecords = await prisma.roles.findMany({ where: { name: { in: distinctRoleNames } } });
    const roleMap = new Map(roleRecords.map(r => [r.name, r]));

    const missingRoles = distinctRoleNames.filter(r => !roleMap.has(r));
    if (missingRoles.length) {
      return NextResponse.json({ success: false, message: `Roles not found: ${missingRoles.join(', ')}` }, { status: 400 });
    }

    // Build upserts. We will chunk to avoid parameter explosion.
    const upserts: Promise<any>[] = [];
    for (const p of permissions) {
      if (!p.role || typeof p.menu_item_id !== 'number') continue; // skip invalid
      const roleRec = roleMap.get(p.role);
      if (!roleRec) continue;

      const granularProvided = ['can_view','can_create','can_edit','can_delete','can_export'].some(k => typeof p[k] === 'boolean');
      const final = granularProvided ? {
        can_view: !!p.can_view,
        can_create: !!p.can_create,
        can_edit: !!p.can_edit,
        can_delete: !!p.can_delete,
        can_export: !!p.can_export,
      } : {
        can_view: !!p.enabled,
        can_create: !!p.enabled,
        can_edit: !!p.enabled,
        can_delete: !!p.enabled,
        can_export: !!p.enabled,
      };
      const isActive = Object.values(final).some(Boolean);

      upserts.push(prisma.menu_role_permissions.upsert({
        where: {
          role_name_menu_item_id: {
            role_name: roleRec.name,
            menu_item_id: p.menu_item_id
          }
        },
        update: { ...final, is_active: isActive },
        create: { role_id: roleRec.id, role_name: roleRec.name, menu_item_id: p.menu_item_id, ...final, is_active: isActive }
      }).then(async (res) => {
        // attempt to set new columns if present (non-fatal on error)
        try {
          const accessible = final.can_view || isActive;
          await prisma.$executeRawUnsafe(
            'UPDATE menu_role_permissions SET is_accessible = $1, has_permission = $2 WHERE role_name = $3 AND menu_item_id = $4',
            accessible, accessible, roleRec.name, p.menu_item_id
          );
        } catch { /* ignore */ }
        return res;
      }));
    }

    // Execute in reasonably sized batches to avoid overwhelming the DB.
    const BATCH = 50;
    for (let i = 0; i < upserts.length; i += BATCH) {
      await Promise.all(upserts.slice(i, i + BATCH));
    }

    // Invalidate cache per role
    distinctRoleNames.forEach(r => invalidateMenuCache(r));

    return NextResponse.json({ success: true, processed: upserts.length, roles: distinctRoleNames, message: 'Permissions saved successfully' });
  } catch (error) {
    console.error('Bulk save permissions error:', error);
    return NextResponse.json({ success: false, message: 'Failed to save permissions', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
