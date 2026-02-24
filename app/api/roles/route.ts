import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface Role {
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
}

export async function GET() {
  try {
    const roles = await prisma.roles.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, display_name: true, description: true }
    });

    return NextResponse.json({
      roles: roles.map(r => ({
        id: r.id,
        value: r.name, // canonical name
        label: r.display_name,
        description: r.description
      }))
    });
  } catch (error) {
    console.error('[ROLES API] Error fetching roles:', error);
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
  }
}