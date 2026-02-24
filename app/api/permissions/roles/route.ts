import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const permissions = await prisma.role_permissions.findMany({
      orderBy: [
        { role: 'asc' },
        { resource_type: 'asc' },
        { permission_type: 'asc' }
      ]
    });
    return NextResponse.json({ success: true, permissions });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch role permissions', permissions: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, resource_type, permission_type, scope, description } = body;
    if (!role || !resource_type || !permission_type || !scope) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    const permission = await prisma.role_permissions.create({
      data: { role, resource_type, permission_type, scope, description }
    });
    return NextResponse.json({ success: true, permission });
  } catch (error: any) {
    console.error('Error creating role permission:', error);
    const isUnique = error?.code === 'P2002';
    return NextResponse.json({ success: false, error: isUnique ? 'Duplicate permission entry' : 'Failed to create role permission' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, role, resource_type, permission_type, scope, description } = body;
    if (!id || !role || !resource_type || !permission_type || !scope) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }
    const permission = await prisma.role_permissions.update({
      where: { id: Number(id) },
      data: { role, resource_type, permission_type, scope, description, updated_at: new Date() }
    });
    return NextResponse.json({ success: true, permission });
  } catch (error: any) {
    console.error('Error updating role permission:', error);
    return NextResponse.json({ success: false, error: 'Failed to update role permission' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Permission ID is required' }, { status: 400 });
    await prisma.role_permissions.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true, message: 'Permission deleted successfully' });
  } catch (error) {
    console.error('Error deleting role permission:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete role permission' }, { status: 500 });
  }
}