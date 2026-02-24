import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
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
    
    console.warn(`[NOTIFICATIONS API][READ] Marking notification ${id} as read for user ${userId}`);

    const updateResult = await prisma.notification_recipients.updateMany({
      where: {
        notification_id: id,
        user_id: userId,
        is_read: false,
        is_dismissed: false
      },
      data: {
        is_read: true,
        read_at: new Date()
      }
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ _error: 'Notification not found or already read' }, { status: 404 });
    }

    console.warn(`[NOTIFICATIONS API][READ] Successfully marked notification ${id} as read (updated ${updateResult.count})`);

    return NextResponse.json({ message: 'Notification marked as read', id });
  } catch (_error) {
    console.error('Mark as read _error:', _error);
    return NextResponse.json(
      { _error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
