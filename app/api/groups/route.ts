import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

console.warn('[GROUPS API] Using Prisma client');

export async function GET() {
  try {
    console.warn('[GROUPS API] Fetching groups via Prisma (persistent member_count)');
    const groupsData = await prisma.groups.findMany({
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { users_users_group_idTogroups: true } } }
    });

    // Auto-heal: if persisted member_count differs from actual relation count, prefer actual and queue update
    const groups = [] as any[];
    const fixes: { id: number; value: number }[] = [];
    for (const g of groupsData) {
      const persisted = (g as any).member_count ?? 0;
      const live = g._count.users_users_group_idTogroups;
      const effective = live !== persisted ? live : persisted;
      if (live !== persisted) {
        fixes.push({ id: g.id, value: live });
      }
      groups.push({
        id: g.id,
        name: g.name,
        description: g.description ?? '',
        memberCount: effective,
        createdAt: g.created_at,
        updatedAt: g.updated_at
      });
    }

    // Fire-and-forget fix updates (no need to await each sequentially)
    if (fixes.length) {
      Promise.all(
        fixes.map(f => prisma.groups.update({ where: { id: f.id }, data: { member_count: f.value } as any }))
      ).catch(e => console.error('[GROUPS API] member_count heal error', e));
    }

    const totalMembers = groups.reduce((acc, g) => acc + (g.memberCount || 0), 0);

    return NextResponse.json({
      success: true,
      groups,
      total: groups.length,
      totalMembers,
      message: 'Groups retrieved successfully'
    });
  } catch (error) {
    console.error('[GROUPS API] Error:', error);
    return NextResponse.json({ error: 'Failed to get groups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawName = (body.name || '').toString().trim();
    const description = body.description?.toString().trim() || null;

    if (!rawName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Optional uniqueness check
    const existing = await prisma.groups.findFirst({ where: { name: rawName } });
    if (existing) {
      return NextResponse.json({ error: 'Group name already exists' }, { status: 409 });
    }

    const created = await prisma.groups.create({
      data: { name: rawName, description, member_count: 0 } as any,
    });

    return NextResponse.json({
      success: true,
      group: {
        id: created.id,
        name: created.name,
        description: created.description ?? '',
  memberCount: (created as any).member_count ?? 0,
        createdAt: created.created_at,
        updatedAt: created.updated_at
      },
      message: 'Group created successfully'
    });
  } catch (error: any) {
    console.error('[GROUPS API] Create error:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
