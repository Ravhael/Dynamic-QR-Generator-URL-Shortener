import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const items = await prisma.resource_types.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ success: true, data: items, message: 'Resource types fetched successfully' });
  } catch (err) {
    console.error('Error (prisma) GET /api/admin/resource-types:', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json();
    if (!name || !description) {
      return NextResponse.json({ success: false, message: 'Name and description are required' }, { status: 400 });
    }
    const created = await prisma.resource_types.create({ data: { name, description } });
    return NextResponse.json({ success: true, data: created, message: 'Resource type created successfully' });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Resource type with this name already exists' }, { status: 400 });
    }
    console.error('Error creating resource type (prisma):', err);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
