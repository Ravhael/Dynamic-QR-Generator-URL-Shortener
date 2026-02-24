import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { _error: 'Invalid or empty ids array' },
        { status: 400 }
      );
    }

    console.warn(`[USER ACTIVITY BULK DELETE] Deleting ${ids.length} activities (Prisma)`);

    // Ambil id yang benar-benar ada untuk memberikan feedback akurat
    const existing = await prisma.user_activity.findMany({
      where: { id: { in: ids } },
      select: { id: true }
    });
    const existingIds = existing.map(r => r.id);

    if (existingIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No matching activity logs found to delete',
        deletedCount: 0,
        deletedIds: []
      });
    }

    const deleted = await prisma.user_activity.deleteMany({ where: { id: { in: existingIds } } });
    const deletedCount = deleted.count;

    console.warn(`[USER ACTIVITY BULK DELETE] Successfully deleted ${deletedCount} activities`);

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deletedCount} activity logs`,
      deletedCount,
      deletedIds: existingIds
    });

  } catch (_error) {
    console.error('[USER ACTIVITY BULK DELETE] Error:', _error);
    return NextResponse.json(
      { _error: 'Failed to delete activity logs' },
      { status: 500 }
    );
  }
}
