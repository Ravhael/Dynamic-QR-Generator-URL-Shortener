import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Invalid or empty ids array' }, { status: 400 });
    }

    console.warn(`[USERS BULK DELETE][Prisma] Deleting ${ids.length} users`);

    const result = await prisma.$transaction(async (tx) => {
      // Fetch users to delete (for response/logging)
      const usersToDelete = await tx.users.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, email: true }
      });

      if (usersToDelete.length === 0) {
        return { deletedCount: 0, deletedUsers: [] as any[] };
      }

      // Delete dependent data similar to single delete endpoint (categories, activity)
      await tx.user_activity.deleteMany({ where: { user_id: { in: ids } } });
      await tx.qr_categories.deleteMany({ where: { user_id: { in: ids } } });
      await tx.url_categories.deleteMany({ where: { user_id: { in: ids } } });

      // Delete users themselves
      await tx.users.deleteMany({ where: { id: { in: ids } } });

      return { deletedCount: usersToDelete.length, deletedUsers: usersToDelete };
    });

    console.warn(`[USERS BULK DELETE][Prisma] Deleted ${result.deletedCount} users`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} users`,
      deletedCount: result.deletedCount,
      deletedUsers: result.deletedUsers
    });
  } catch (e: any) {
    console.error('[USERS BULK DELETE][Prisma] Error:', e);
    return NextResponse.json({ error: 'Failed to delete users' }, { status: 500 });
  }
}