import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/api-permissions';
import { checkPermission } from '@/lib/permissions';

export interface EnsurePermissionOptions {
  resource: string; // canonical resource name e.g. 'qr_code'
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
  // Optional resolvers
  resolveOwner?:(ctx: { params: any; request: NextRequest }) => Promise<{ ownerId?: string; ownerGroupId?: number } | null>;
  forbidMessage?: string;
  adminBypass?: boolean; // default true
}

export function withPermission(options: EnsurePermissionOptions, handler: (request: NextRequest, ctx: any, user: { id: string; role: string; groupId: number }) => Promise<NextResponse> | NextResponse) {
  const { resource, action, resolveOwner, forbidMessage, adminBypass = true } = options;
  return async function wrapped(request: NextRequest, ctx: any) {
    const userInfo = await getUserFromRequest(request);
    if (!userInfo) {
      return NextResponse.json({ _error: 'AUTH_REQUIRED' }, { status: 401 });
    }
    if (adminBypass && ['admin','administrator','superadmin'].includes(userInfo.userRole.toLowerCase())) {
      return handler(request, ctx, { id: userInfo.userId, role: userInfo.userRole, groupId: userInfo.userGroupId });
    }
    // Controlled empty-read bypass: if user has no group yet (userGroupId 0) and this is a read
    // request for analytics-like resources, allow the handler to run BUT the handler should already
    // be written to return empty stats when groupId is missing. This prevents 403 spam for brand new users
    // while still enforcing DB permissions once group is assigned.
    const noGroup = !userInfo.userGroupId || userInfo.userGroupId === 0;
    const analyticsLike = ['analytics','qr_analytics','url_analytics','scan_events','click_events'];
    if (action === 'read' && noGroup && analyticsLike.includes(resource)) {
      return handler(request, ctx, { id: userInfo.userId, role: userInfo.userRole, groupId: userInfo.userGroupId });
    }
    let ownerId: string | undefined = undefined;
    let ownerGroupId: number | undefined = undefined;
    if (resolveOwner) {
      try {
        const res = await resolveOwner({ params: ctx?.params, request });
        if (res) { ownerId = res.ownerId; ownerGroupId = res.ownerGroupId; }
      } catch (e) {
        console.warn('[withPermission] resolveOwner failed', e);
      }
    }

    const allowed = await checkPermission({
      userId: userInfo.userId,
      userRole: userInfo.userRole,
      userGroupId: userInfo.userGroupId,
      resourceType: resource,
      permissionType: action,
      resourceOwnerId: ownerId,
      resourceGroupId: ownerGroupId
    });

    if (!allowed) {
      return NextResponse.json({
        _error: 'PERMISSION_DENIED',
        message: forbidMessage || `Not allowed to ${action} ${resource}`,
        resource,
        action,
        hint: 'Add role_permissions row or adjust scope'
      }, { status: 403 });
    }

    return handler(request, ctx, { id: userInfo.userId, role: userInfo.userRole, groupId: userInfo.userGroupId });
  }
}
