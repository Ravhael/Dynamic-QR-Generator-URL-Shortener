import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/*
  POST /api/groups/assign
  Body: { userId: string, groupId: number | null }
  - groupId null => unassign user
*/
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = body.userId?.toString();
    const groupIdRaw = body.groupId;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Validate user exists
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let groupId: number | null = null;
    if (groupIdRaw !== null && groupIdRaw !== undefined && groupIdRaw !== '') {
      const parsed = Number(groupIdRaw);
      if (Number.isNaN(parsed)) {
        return NextResponse.json({ error: 'groupId must be a number or null' }, { status: 400 });
      }
      // Validate group exists
      const group = await prisma.groups.findUnique({ where: { id: parsed } });
      if (!group) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }
      groupId = parsed;
    }

    // Update membership + member_count adjustments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Fetch old group id to adjust counts
      const existing = await tx.users.findUnique({ where: { id: userId }, select: { group_id: true } });
      const previousGroupId = existing?.group_id ?? null;

      const updatedUser = await tx.users.update({
        where: { id: userId },
        data: { group_id: groupId, updated_at: new Date() },
        select: { id: true, group_id: true }
      });

      if (previousGroupId && previousGroupId !== groupId) {
        await tx.groups.update({
          where: { id: previousGroupId },
          data: { member_count: { decrement: 1 } } as any
        });
      }
      if (groupId && previousGroupId !== groupId) {
        await tx.groups.update({
          where: { id: groupId },
          data: { member_count: { increment: 1 } } as any
        });
      }
      // Return the new counts if needed
      let newGroupCount: number | null = null;
      if (groupId) {
        const g = await tx.groups.findUnique({ where: { id: groupId } });
        newGroupCount = (g as any)?.member_count ?? null;
      }
      return { updatedUser, newGroupCount, previousGroupId };
    });

    return NextResponse.json({
      success: true,
      message: groupId ? 'User assigned to group' : 'User unassigned from group',
      user: { id: result.updatedUser.id, groupId: result.updatedUser.group_id },
      memberCount: result.newGroupCount
    });
  } catch (error: any) {
    console.error('[GROUP ASSIGN API] Error:', error);
    return NextResponse.json({ error: 'Failed to assign user to group' }, { status: 500 });
  }
}
