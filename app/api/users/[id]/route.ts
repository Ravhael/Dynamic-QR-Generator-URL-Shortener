import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();

    console.warn(`[USERS API][Prisma] Updating user ${id}:`, body);

    const { name, email, role, isActive, groupId } = body as {
      name?: string;
      email?: string;
      role?: string | null;
      isActive?: boolean;
      groupId?: number | string | null;
    };

    // Resolve role_id if role name provided
    let roleId: string | null | undefined = undefined; // undefined means don't touch, null clears
    if (role !== undefined) {
      if (role === null || role === '') {
        roleId = null;
      } else {
        const roleRecord = await prisma.roles.findFirst({ where: { name: role } });
        roleId = roleRecord?.id ?? null; // if not found, explicitly clear
        if (!roleRecord) {
          console.warn(`[USERS API][Prisma] Role name '${role}' not found. Setting role_id -> null`);
        }
      }
    }

    // Build partial update object (only include provided fields)
    const data: Prisma.usersUpdateInput = { updated_at: new Date() };
    if (name !== undefined) (data as any).name = name; // casting due to broad model
    if (email !== undefined) (data as any).email = email;
    if (isActive !== undefined) (data as any).is_active = isActive;
    if (groupId !== undefined) {
      const normalizedGroupId = (groupId === '' || groupId === null) ? null : (typeof groupId === 'string' ? parseInt(groupId, 10) : groupId);
      (data as any).group_id = Number.isNaN(normalizedGroupId as any) ? null : normalizedGroupId;
    }
    if (roleId !== undefined) (data as any).role_id = roleId; // can be null to clear

    try {
      const updated = await prisma.users.update({
        where: { id },
        data,
        include: { roles: true }
      });

      return NextResponse.json({
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
            // prefer joined role name; fallback to input
          role: updated.roles?.name || role || null,
          isActive: updated.is_active,
          groupId: updated.group_id,
          updated_at: updated.updated_at
        },
        message: 'User updated successfully'
      });
    } catch (e: any) {
      if (e?.code === 'P2025') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      console.error('[USERS API][Prisma] Update error:', e);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user';
    console.error('[USERS API][Prisma] Update handler error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    console.warn(`[USERS API][Prisma] Starting deletion process for user ${id}`);

    const result = await prisma.$transaction(async (tx) => {
      // Fetch user & activity count
      const user = await tx.users.findUnique({
        where: { id },
        select: { id: true, name: true }
      });
      if (!user) {
        throw new Prisma.PrismaClientKnownRequestError('User not found', {
          code: 'P2025',
          clientVersion: 'unknown'
        } as any);
      }

      const activityCount = await tx.user_activity.count({ where: { user_id: id } });
      if (activityCount > 0) {
        await tx.user_activity.deleteMany({ where: { user_id: id } });
        console.warn(`[USERS API][Prisma] Deleted ${activityCount} activity records for user ${id}`);
      }

      // Delete dependent data (categories) similar to original logic
      await tx.qr_categories.deleteMany({ where: { user_id: id } });
      await tx.url_categories.deleteMany({ where: { user_id: id } });

      // Delete user
      await tx.users.delete({ where: { id } });
      return { name: user.name };
    });

    return NextResponse.json({
      success: true,
      message: `User ${result.name} deleted successfully`,
      id
    });
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('[USERS API][Prisma] Delete error:', e);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
