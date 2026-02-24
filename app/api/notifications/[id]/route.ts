import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get authenticated user ID
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.warn(`[NOTIFICATIONS API][DISMISS] Dismissing notification ${id} for user ${userId}`);

    const updateResult = await prisma.notification_recipients.updateMany({
      where: {
        notification_id: id,
        user_id: userId,
        is_dismissed: false
      },
      data: {
        is_dismissed: true,
        dismissed_at: new Date()
      }
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ _error: 'Notification not found' }, { status: 404 });
    }

    console.warn(`[NOTIFICATIONS API][DISMISS] Successfully dismissed notification ${id} (updated ${updateResult.count})`);

    return NextResponse.json({ message: 'Notification deleted successfully', id });
  } catch (_error) {
    console.error('Delete notification _error:', _error);
    return NextResponse.json(
      { _error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
