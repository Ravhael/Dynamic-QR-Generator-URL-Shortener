import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const resourceId = Number(params.id);
    if (Number.isNaN(resourceId)) {
      return NextResponse.json({ success: false, message: 'Invalid resource type ID' }, { status: 400 });
    }
    const existing = await prisma.resource_types.findUnique({ where: { id: resourceId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Resource type not found' }, { status: 404 });
    }
    const usage = await prisma.role_permissions.count({ where: { resource_type: existing.name } });
    if (usage > 0) {
      return NextResponse.json({ success: false, message: 'Cannot delete resource type: it is being used by existing permissions' }, { status: 400 });
    }
    await prisma.resource_types.delete({ where: { id: resourceId } });
    return NextResponse.json({ success: true, message: 'Resource type deleted successfully' });
  } catch (err) {
    console.error('Error deleting resource type (prisma):', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const resourceId = Number(params.id);
    if (Number.isNaN(resourceId)) {
      return NextResponse.json({ success: false, message: 'Invalid resource type ID' }, { status: 400 });
    }
    const { name, description } = await request.json();
    const updated = await prisma.resource_types.update({
      where: { id: resourceId },
      data: { name, description }
    });
    return NextResponse.json({ success: true, data: updated, message: 'Resource type updated successfully' });
  } catch (err: any) {
    if (err.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Resource type not found' }, { status: 404 });
    }
    if (err.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Resource type with this name already exists' }, { status: 400 });
    }
    console.error('Error updating resource type (prisma):', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}