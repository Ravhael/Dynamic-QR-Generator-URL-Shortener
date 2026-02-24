import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get permissions based on new schema
export async function GET() {
  try {
    const roleMap = await prisma.roles.findMany({ select: { id: true, name: true } });
    const roleIdByName = new Map(roleMap.map(r => [r.name, r.id] as const));
    const resourceTypes = await prisma.resource_types.findMany({ select: { id: true, name: true } });
    const resourceIdByName = new Map(resourceTypes.map(r => [r.name, r.id] as const));

    const perms = await prisma.role_permissions.findMany({
      orderBy: [
        { role: 'asc' },
        { resource_type: 'asc' },
        { permission_type: 'asc' }
      ]
    });

    const permissions = perms.map(p => ({
      id: p.id,
      role: p.role,
      resource_type: p.resource_type,
      permission_type: p.permission_type,
      scope: p.scope ?? 'own',
      description: p.description ?? '',
      role_id: roleIdByName.get(p.role) || 0,
      resource_type_id: resourceIdByName.get(p.resource_type) || 0,
      created_at: p.created_at,
      updated_at: p.updated_at
    }));

    return NextResponse.json({ success: true, data: permissions, message: 'Role permissions retrieved successfully' });
  } catch (err) {
    console.error('Error fetching role permissions (prisma):', err);
    return NextResponse.json({ success: false, _error: 'Failed to fetch role permissions' }, { status: 500 });
  }
}

// Create single permission
export async function POST(request: NextRequest) {
  try {
    const { role, resource_type, permission_type, scope, description } = await request.json();
    if (!role || !resource_type || !permission_type) {
      return NextResponse.json({ success: false, message: 'Role, resource_type, and permission_type are required' }, { status: 400 });
    }
    const created = await prisma.role_permissions.create({
      data: {
        role,
        resource_type,
        permission_type,
        scope: scope || 'own',
        description: description || ''
      }
    });
    return NextResponse.json({ success: true, data: created, message: 'Permission created successfully' });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Permission with this combination already exists' }, { status: 400 });
    }
    console.error('Error creating permission (prisma):', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// Update individual permission
export async function PUT(request: NextRequest) {
  try {
    const { role, resource_type, permission_type, scope, description } = await request.json();
    if (!role || !resource_type || !permission_type) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    const existing = await prisma.role_permissions.findFirst({ where: { role, resource_type, permission_type } });
    let record;
    if (existing) {
      record = await prisma.role_permissions.update({
        where: { id: existing.id },
        data: { scope: scope || 'own', description: description || '' }
      });
    } else {
      record = await prisma.role_permissions.create({
        data: { role, resource_type, permission_type, scope: scope || 'own', description: description || '' }
      });
    }
    return NextResponse.json({ success: true, data: record, message: 'Role permission updated successfully' });
  } catch (err) {
    console.error('Error updating role permission (prisma):', err);
    return NextResponse.json({ success: false, _error: 'Failed to update role permission' }, { status: 500 });
  }
}
