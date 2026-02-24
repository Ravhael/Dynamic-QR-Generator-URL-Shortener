import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const permissionId = Number(params.id);
    if (Number.isNaN(permissionId)) {
      return NextResponse.json({ success: false, message: 'Invalid permission ID' }, { status: 400 });
    }
    await prisma.role_permissions.delete({ where: { id: permissionId } });
    return NextResponse.json({ success: true, message: 'Permission deleted successfully' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Permission not found' }, { status: 404 });
    }
    console.error('Error deleting permission (prisma):', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const permissionId = Number(params.id);
    if (Number.isNaN(permissionId)) {
      return NextResponse.json({ success: false, message: 'Invalid permission ID' }, { status: 400 });
    }
    const { role, resource_type, permission_type, scope, description } = await request.json();
    const updated = await prisma.role_permissions.update({
      where: { id: permissionId },
      data: { role, resource_type, permission_type, scope: scope || 'own', description: description || '' }
    });
    return NextResponse.json({ success: true, data: updated, message: 'Permission updated successfully' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Permission not found' }, { status: 404 });
    }
    console.error('Error updating permission (prisma):', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}