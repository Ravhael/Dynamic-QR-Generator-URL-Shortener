import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || '';
    const groupId = url.searchParams.get('groupId') || '';
    const action = url.searchParams.get('action') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    console.warn('[USER ACTIVITY API][Prisma] Filters:', { userId, groupId, action, status, page, limit });

    // Build dynamic WHERE clauses & parameters
    const filters: string[] = [];
    const params: any[] = [];

    if (userId) { params.push(userId); filters.push(`user_id = $${params.length}`); }
    if (action) { params.push(action); filters.push(`action = $${params.length}`); }
    if (status) { params.push(status); filters.push(`status = $${params.length}`); }
    if (groupId) { params.push(parseInt(groupId)); filters.push(`user_group_id = $${params.length}`); }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const baseSelect = `
      SELECT 
        id,
        user_id,
        user_name,
        user_email,
        user_role,
        user_group_id,
        user_group_name,
        activity_type_code,
        activity_type_name,
        activity_category,
        activity_icon,
        activity_color,
        is_sensitive,
        action,
        target_type,
        target_id,
        target_name,
        description,
        ip_address,
        user_agent,
        status,
        metadata,
        session_id,
        duration_ms,
        created_at,
        updated_at
      FROM user_activity_details
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const countSelect = `SELECT COUNT(*)::int as total FROM user_activity_details ${whereClause}`;

    const [countRows, activityRows]: any[] = await Promise.all([
      prisma.$queryRawUnsafe(countSelect, ...params),
      prisma.$queryRawUnsafe(baseSelect, ...params, limit, offset)
    ]);

    const total: number = countRows?.[0]?.total || 0;
    const pages = Math.ceil(total / limit);

    const activities = (activityRows || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      groupId: row.user_group_id,
      groupName: row.user_group_name || '',
      action: row.action,
      description: row.description || `${row.action} on ${row.target_type}`,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
      status: row.status,
      targetType: row.target_type,
      targetName: row.target_name,
      metadata: row.metadata,
      sessionId: row.session_id,
      durationMs: row.duration_ms
    }));

    return NextResponse.json({
      activities,
      pagination: { total, page, pages, limit }
    });
  } catch (e) {
    console.error('[USER ACTIVITY API][Prisma] Error:', e);
    return NextResponse.json({ error: 'Failed to fetch user activity logs' }, { status: 500 });
  }
}
