import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/permissions';
import { getUserFromRequest } from '@/lib/api-permissions';

export async function POST(request: NextRequest) {
  try {
    // Get user authentication
    const userInfo = await getUserFromRequest(request);
    if (!userInfo) {
      return NextResponse.json({ _error: 'Authentication required' }, { status: 401 });
    }

    // Get permission check request
    const body = await request.json();
  let { resourceType, permissionType, resourceOwnerId, resourceGroupId } = body;

    // Validate request
    if (!resourceType || !permissionType) {
      return NextResponse.json(
        { _error: 'resourceType and permissionType are required' }, 
        { status: 400 }
      );
    }

    // Check permission
    // Coerce empty strings to undefined
    if (resourceOwnerId === '') resourceOwnerId = undefined;
    if (resourceGroupId === '') resourceGroupId = undefined;

    const hasPermission = await checkPermission({
      userId: userInfo.userId,
      userRole: userInfo.userRole,
      userGroupId: userInfo.userGroupId,
      resourceType,
      permissionType,
      resourceOwnerId,
      resourceGroupId,
    });

    return NextResponse.json({ hasPermission });

  } catch (_error) {
    console.error('[PERMISSION CHECK API] Error:', _error);
    return NextResponse.json(
      { _error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
