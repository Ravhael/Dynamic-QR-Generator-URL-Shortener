import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import getNextAuthToken from '@/lib/getNextAuthToken';
import { PrismaClient } from '@prisma/client';
import { isAdministrator } from '@/lib/auth';
import { invalidateMenuCache } from '@/lib/menuTree';

const prisma = new PrismaClient();

// Bulk enable/disable for a group and all its descendant menu items for a given role
// Body: { role: string, group_menu_id: string, enable: boolean, apply?: { view?: boolean, create?: boolean, edit?: boolean, delete?: boolean, export?: boolean } }
export async function POST(request: NextRequest) {
  try {
    const token = await getNextAuthToken(request as any);
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!await isAdministrator(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const { role, group_menu_id, enable, apply } = body;
    if (!role || !group_menu_id || typeof enable !== 'boolean') {
      return NextResponse.json({ success: false, message: 'role, group_menu_id, enable required' }, { status: 400 });
    }

    const roleRecord = await prisma.roles.findFirst({ where: { name: role } });
    if (!roleRecord) {
      return NextResponse.json({ success: false, message: 'Role not found' }, { status: 404 });
    }

    // Fetch all menu items (id + menu_id + parent_id)
    const allItems = await prisma.menu_items.findMany({ select: { id: true, menu_id: true, parent_id: true, is_active: true } });

    // Build map parent->children by menu_id
    const childrenMap: Record<string, { id: number; menu_id: string; parent_id: string | null }[]> = {};
    for (const item of allItems) {
      const parent = item.parent_id || '__root__';
      childrenMap[parent] = childrenMap[parent] || [];
      childrenMap[parent].push(item as any);
    }

    // DFS to collect descendants of group_menu_id
    const targetRoot = allItems.find(i => i.menu_id === group_menu_id);
    if (!targetRoot) {
      return NextResponse.json({ success: false, message: 'Group menu_id not found' }, { status: 404 });
    }

    const toProcess: number[] = [];
    const stack = [group_menu_id];
    while (stack.length) {
      const current = stack.pop()!;
      const children = childrenMap[current] || [];
      for (const ch of children) {
        toProcess.push(ch.id);
        stack.push(ch.menu_id);
      }
    }
    // Include the group root itself
    toProcess.push(targetRoot.id);

    // Determine apply flags (default: all if not provided)
    const applyFlags = {
      view: apply?.view ?? true,
      create: apply?.create ?? true,
      edit: apply?.edit ?? true,
      delete: apply?.delete ?? true,
      export: apply?.export ?? true,
    };

    // Fetch existing permission rows for this role & these menu items
    const existing = await prisma.menu_role_permissions.findMany({
      where: { role_name: roleRecord.name, menu_item_id: { in: toProcess } },
      select: { menu_item_id: true, id: true }
    });
    const existingMap = new Map(existing.map(e => [e.menu_item_id, e.id]));

    const updates: any[] = [];
    const creates: any[] = [];

    for (const menuItemId of toProcess) {
      const base = {
        can_view: applyFlags.view ? enable : false,
        can_create: applyFlags.create ? enable : false,
        can_edit: applyFlags.edit ? enable : false,
        can_delete: applyFlags.delete ? enable : false,
        can_export: applyFlags.export ? enable : false,
        is_active: enable && Object.values(applyFlags).some(f => f)
      };
      if (existingMap.has(menuItemId)) {
        updates.push(prisma.menu_role_permissions.update({
          where: { id: existingMap.get(menuItemId)! },
          data: base
        }));
      } else {
        creates.push({
          role_id: roleRecord.id,
          role_name: roleRecord.name,
          menu_item_id: menuItemId,
          ...base
        });
      }
    }

    if (creates.length) {
      await prisma.menu_role_permissions.createMany({ data: creates });
    }
    if (updates.length) {
      await prisma.$transaction(updates);
    }

    invalidateMenuCache(roleRecord.name);

    return NextResponse.json({ success: true, affected: toProcess.length, message: 'Bulk permission update applied' });
  } catch (error) {
    console.error('Bulk permission update error', error);
    return NextResponse.json({ success: false, message: 'Bulk update failed', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
