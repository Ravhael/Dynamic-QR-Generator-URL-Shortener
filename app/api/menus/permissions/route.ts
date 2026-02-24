import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import getNextAuthToken from '@/lib/getNextAuthToken'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Returns permission map for the currently authenticated user's role
export async function GET(request: NextRequest) {
  try {
    const token = await getNextAuthToken(request as any);
    if (!token) return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });

    let roleName = (token as any).role || (token as any).userRole || 'Regular';
    // Resolve role case-insensitively to canonical DB name
    let roleRecord = await prisma.roles.findUnique({ where: { name: roleName } });
    if (!roleRecord) {
      roleRecord = await prisma.roles.findFirst({ where: { name: { equals: roleName, mode: 'insensitive' } } });
    }
    if (roleRecord) roleName = roleRecord.name; else roleName = 'Regular';

    // Fetch can_view permissions for the role
    const rowsRaw = await prisma.menu_role_permissions.findMany({ where: { role_name: roleName } });
    const rows = rowsRaw.map(r => ({
      menu_item_id: (r as any).menu_item_id,
      can_view: (r as any).can_view,
      is_accessible: (r as any).is_accessible ?? (r as any).can_view,
      has_permission: (r as any).has_permission ?? (r as any).can_view
    }));

    return NextResponse.json({
      success: true,
      role: roleName,
      permissions: rows,
      fields: ['menu_item_id','can_view','is_accessible','has_permission']
    });
  } catch (error) {
    console.error('Error fetching role menu permissions', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch permissions' }, { status: 500 });
  }
}
