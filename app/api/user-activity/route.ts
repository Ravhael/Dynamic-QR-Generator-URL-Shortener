import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Prisma migration of user-activity endpoint (previous raw SQL version backed up in route.raw-backup.ts)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '50'))); // safety bounds
    const offset = (page - 1) * limit;

    const filterParams = {
      userId: url.searchParams.get('user_id') || undefined,
      action: url.searchParams.get('action') || undefined,
      groupId: url.searchParams.get('group_id') || undefined,
    };

    console.warn('[USER ACTIVITY API][Prisma] Fetching with filters', { ...filterParams, page, limit });

    // Build Prisma where clause
    const where: any = {};
    if (filterParams.userId) where.user_id = filterParams.userId;
    if (filterParams.action) where.action = filterParams.action;
    if (filterParams.groupId) {
      const gid = parseInt(filterParams.groupId, 10);
      if (!isNaN(gid)) {
        // Filter via related user.group_id
        where.users_user_activity_user_idTousers = { group_id: gid };
      }
    }

    // Execute count & data queries in parallel
    const [total, rows] = await Promise.all([
      prisma.user_activity.count({ where }),
      prisma.user_activity.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
        include: {
          users_user_activity_user_idTousers: {
            select: {
              name: true,
              email: true,
              group_id: true,
              groups_users_group_idTogroups: { select: { id: true, name: true } },
              roles: { select: { name: true, display_name: true } }
            }
          }
        }
      })
    ]);

    const pages = Math.ceil(total / limit);

    // Transform to camelCase expected by the client component while also preserving
    // original snake_case keys for any legacy consumers (defensive approach).
    const activities = rows.map(row => {
      const userRel: any = (row as any).users_user_activity_user_idTousers;
      const groupRel: any = userRel?.groups_users_group_idTogroups;
      const roleRel: any = userRel?.roles;
      const camel = {
        // CamelCase structure used by components/Users/UserActivity.tsx
        id: row.id, // UUID string
        userId: row.user_id,
        userName: userRel?.name || userRel?.email || 'Unknown User',
        userEmail: userRel?.email || 'unknown@example.com',
        groupId: userRel?.group_id ? String(userRel.group_id) : undefined,
        groupName: groupRel?.name || 'No Group',
        accountType: roleRel?.display_name || roleRel?.name || 'User',
        action: row.action,
        description: row.description || null,
        ipAddress: row.ip_address || null,
        userAgent: row.user_agent || null,
        createdAt: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
      };

      return {
        // Keep new camelCase fields
        ...camel,
        // Also expose original naming for backwards compatibility
        user_id: row.user_id,
        user_name: camel.userName,
        user_email: camel.userEmail,
  role_name: camel.accountType,
        activity_type_id: row.activity_type_id,
        target: row.target_name || (row.target_type ? `${row.target_type}: ${row.target_id}` : null),
        target_type: row.target_type,
        target_id: row.target_id,
        target_name: row.target_name,
        status: row.status,
        metadata: (row.metadata as any) || {},
        session_id: row.session_id,
        duration_ms: row.duration_ms,
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    });

    console.warn('[USER ACTIVITY API][Prisma] Stats', { total, returned: activities.length, page, limit, offset });

    return NextResponse.json({
      success: true,
      activities,
      pagination: {
        total,
        page,
        pages,
        limit,
        offset,
        returned: activities.length,
      },
      filters: {
        ...filterParams,
        applied: Object.values(filterParams).filter(Boolean).length,
      },
      message: 'User activities retrieved successfully',
    });
  } catch (error: any) {
    console.error('[USER ACTIVITY API][Prisma] Error:', error?.message, error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch user activity logs' },
      { status: 500 }
    );
  }
}
