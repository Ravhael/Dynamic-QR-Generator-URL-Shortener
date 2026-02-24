import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const resources = await prisma.resource_types.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ success: true, resources });
  } catch (error) {
    console.error('Error fetching resource types:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch resource types', resources: [] }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;
    if (!name) return NextResponse.json({ success: false, error: 'Resource name is required' }, { status: 400 });
    const resource = await prisma.resource_types.create({ data: { name, description } });
    return NextResponse.json({ success: true, resource });
  } catch (error: any) {
    console.error('Error creating resource type:', error);
    const isUnique = error?.code === 'P2002';
    return NextResponse.json({ success: false, error: isUnique ? 'Resource name already exists' : 'Failed to create resource type' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description } = body;
    if (!id || !name) return NextResponse.json({ success: false, error: 'ID and name are required' }, { status: 400 });
    const resource = await prisma.resource_types.update({
      where: { id: Number(id) },
      data: { name, description, updated_at: new Date() }
    });
    return NextResponse.json({ success: true, resource });
  } catch (error) {
    console.error('Error updating resource type:', error);
    return NextResponse.json({ success: false, error: 'Failed to update resource type' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Resource ID is required' }, { status: 400 });
    await prisma.resource_types.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true, message: 'Resource type deleted successfully' });
  } catch (error) {
    console.error('Error deleting resource type:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete resource type' }, { status: 500 });
  }
}