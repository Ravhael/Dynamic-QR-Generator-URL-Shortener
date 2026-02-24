import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import getNextAuthToken from '@/lib/getNextAuthToken';
import { isAdministrator } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function buildHierarchy(items: any[]) {
  const byId = new Map(items.map(i => [i.menu_id, { ...i, children: [] as any[] }]));
  const roots: any[] = [];
  for (const item of items) {
    const cur = byId.get(item.menu_id)!;
    if (item.parent_id) {
      const parent = byId.get(item.parent_id);
      if (parent) {
        parent.children.push(cur);
        parent.children.sort((a: any, b: any) => a.sort_order - b.sort_order);
      } else {
        roots.push(cur);
      }
    } else {
      roots.push(cur);
    }
  }
  roots.sort((a, b) => a.sort_order - b.sort_order);
  return roots;
}

export async function GET(request: NextRequest) {
  try {
  const token = await getNextAuthToken(request as any);
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const isAdmin = await isAdministrator(request);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const allMenuItems = await prisma.menu_items.findMany({
      where: { is_active: true },
      include: {
        menu_permissions: true
      },
      orderBy: [{ sort_order: 'asc' }, { id: 'asc' }]
    });

    const flat = allMenuItems.map((mi: any) => ({
      id: mi.id,
      menu_id: mi.menu_id,
      name: mi.name,
      path: mi.path,
      icon: mi.icon,
      parent_id: mi.parent_id,
      sort_order: mi.sort_order,
      is_active: mi.is_active,
      is_group: mi.is_group,
      created_at: mi.created_at,
      updated_at: mi.updated_at,
      permissions: (mi.menu_permissions || []).map((p: any) => ({
        id: p.id,
        name: p.permission_name,
        description: p.description,
        is_active: p.is_active
      }))
    }));

    const menus = buildHierarchy(flat);

    const stats = {
      total_items: flat.length,
      group_items: flat.filter(i => i.is_group).length,
      regular_items: flat.filter(i => !i.is_group).length,
      total_permissions: flat.reduce((sum, i) => sum + (i.permissions?.length || 0), 0)
    };

    return NextResponse.json({ success: true, data: { menus, flat_menus: flat, statistics: stats } });
  } catch (error: any) {
    console.error('Error in GET /api/admin/menu-items:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 });
  }
}
