import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const rawName = body.name?.toString().trim();
    const description = body.description?.toString().trim() || null;

    if (!rawName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const updated = await prisma.groups.update({
      where: { id: Number(id) },
      data: { name: rawName, description, updated_at: new Date() },
    });

    return NextResponse.json({
      success: true,
      group: {
        id: updated.id,
        name: updated.name,
        description: updated.description ?? '',
  memberCount: (updated as any).member_count ?? 0,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at
      },
      message: 'Group updated successfully'
    });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    console.error('[GROUPS API] Update error:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.groups.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true, message: 'Group deleted successfully', id });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    console.error('[GROUPS API] Delete error:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
