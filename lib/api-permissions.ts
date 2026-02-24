import { NextRequest } from 'next/server';
import { checkPermission, canAccessQRCode, canAccessURL } from './permissions';
import { prisma } from './prisma';
import { getToken } from 'next-auth/jwt';

// Normalisasi nama role agar konsisten dengan entri di tabel role_permissions
// Tabel permission menggunakan slug lowercase: 'admin', 'editor', 'viewer'
// Sedangkan tabel roles atau seed mungkin menyimpan 'Administrator', 'ADMIN', dll.
function normalizeRoleName(raw?: string | null): string {
  if (!raw) return 'user';
  const lower = raw.toLowerCase();
  if (['administrator', 'admin', 'superadmin', 'super-admin'].includes(lower)) return 'admin';
  if (['editor'].includes(lower)) return 'editor';
  if (['viewer', 'read-only', 'readonly'].includes(lower)) return 'viewer';
  return lower; // fallback: gunakan lowercase apa adanya
}

// NOTE: Removed pg Pool usage. All DB access now via Prisma.

export interface UserInfo {
  userId: string; // UUID
  userRole: string; // role name slug (e.g., 'admin')
  userGroupId: number; // group / tenant id (int)
  email?: string;
}

// Extract user info from request (session, token, etc.)
export async function getUserFromRequest(request: NextRequest): Promise<UserInfo | null> {
  try {
    // 1. Try NextAuth JWT (if next-auth configured). Requires NEXTAUTH_SECRET in env.
    let token: any = null;
    try {
      token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    } catch (e) {
      // Silent: next-auth not configured or token invalid
    }

    if (token?.sub) {
      const user = await prisma.users.findUnique({ where: { id: token.sub } });
      if (user) {
        // Role name via joined roles table if available
        let roleName = 'user';
        if (user.role_id) {
          const role = await prisma.roles.findUnique({ where: { id: user.role_id } });
          if (role?.name) roleName = normalizeRoleName(role.name);
          else roleName = normalizeRoleName(roleName);
        } else {
          roleName = normalizeRoleName(roleName);
        }
        return {
          userId: user.id,
          userRole: roleName,
          // Use 0 to represent 'no group assigned yet' instead of defaulting to 1
          userGroupId: user.group_id ?? 0,
          email: user.email || undefined
        };
      }
    }

    // 2. Bearer token (custom). Expect token = user:<id>
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const raw = authHeader.substring(7).trim();
      // Accept raw as UUID directly or pattern user:<uuid>
      let candidateId = raw;
      if (raw.startsWith('user:')) candidateId = raw.split(':')[1];
      if (candidateId && candidateId.length >= 8) {
        const user = await prisma.users.findUnique({ where: { id: candidateId } });
        if (user) {
          let roleName = 'user';
          if (user.role_id) {
            const role = await prisma.roles.findUnique({ where: { id: user.role_id } });
            if (role?.name) roleName = normalizeRoleName(role.name);
            else roleName = normalizeRoleName(roleName);
          } else {
            roleName = normalizeRoleName(roleName);
          }
          return {
            userId: user.id,
            userRole: roleName,
            userGroupId: user.group_id ?? 0,
            email: user.email || undefined
          };
        }
      }
    }

    // 3. Legacy cookie fallback (scanly_auth=<userId>)
    const legacyCookie = request.cookies.get('scanly_auth')?.value;
    if (legacyCookie) {
      // Treat cookie value as UUID already
      const user = await prisma.users.findUnique({ where: { id: legacyCookie } });
      if (user) {
        let roleName = 'user';
        if (user.role_id) {
          const role = await prisma.roles.findUnique({ where: { id: user.role_id } });
          if (role?.name) roleName = normalizeRoleName(role.name);
          else roleName = normalizeRoleName(roleName);
        } else {
          roleName = normalizeRoleName(roleName);
        }
        return {
          userId: user.id,
          userRole: roleName,
          userGroupId: user.group_id ?? 0,
          email: user.email || undefined
        };
      }
    }

    return null; // No auth resolved
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

// Permission check wrapper for API routes
export async function checkAPIPermission(
  userInfo: UserInfo,
  resourceType: 'qr_codes' | 'urls' | 'users' | 'groups' | 'analytics' | 'system',
  permissionType: 'create' | 'read' | 'update' | 'delete' | 'manage',
  resourceOwnerId?: string,
  resourceGroupId?: number
): Promise<boolean> {
  return await checkPermission({
    userId: userInfo.userId,
    userRole: userInfo.userRole,
    userGroupId: userInfo.userGroupId,
    resourceType,
    permissionType,
    resourceOwnerId,
    resourceGroupId
  });
}

// QR Code specific permission check
export async function checkQRCodePermission(
  userInfo: UserInfo,
  qrCodeId: string,
  action: 'read' | 'update' | 'delete'
): Promise<boolean> {
  return await canAccessQRCode(
    userInfo.userId,
    userInfo.userRole,
    userInfo.userGroupId,
    qrCodeId,
    action
  );
}

// URL specific permission check
export async function checkURLPermission(
  userInfo: UserInfo,
  urlId: string,
  action: 'read' | 'update' | 'delete'
): Promise<boolean> {
  return await canAccessURL(
    userInfo.userId,
    userInfo.userRole,
    userInfo.userGroupId,
    urlId,
    action
  );
}

// Get resource owner info
export async function getResourceOwner(
  resourceType: 'qr_codes' | 'short_urls',
  resourceId: string
): Promise<{ ownerId: string; ownerGroupId: number } | null> {
  try {
    if (!resourceId) return null;

    if (resourceType === 'qr_codes') {
      const qr = await prisma.qr_codes.findUnique({ where: { id: resourceId }, select: { user_id: true, created_by: true } });
      if (!qr) return null;
      const ownerId = (qr.user_id || qr.created_by);
      if (!ownerId) return null;
      const owner = await prisma.users.findUnique({ where: { id: ownerId }, select: { group_id: true } });
  return { ownerId, ownerGroupId: owner?.group_id ?? 0 };
    }

    const url = await prisma.short_urls.findUnique({ where: { id: resourceId }, select: { user_id: true, created_by: true } });
    if (!url) return null;
    const ownerId = (url.user_id || url.created_by);
    if (!ownerId) return null;
    const owner = await prisma.users.findUnique({ where: { id: ownerId }, select: { group_id: true } });
  return { ownerId, ownerGroupId: owner?.group_id ?? 0 };
  } catch (error) {
    console.error('Error getting resource owner:', error);
    return null;
  }
}

// Permission error response
export function createPermissionError(action: string, resource: string) {
  return {
    _error: 'Insufficient Permissions',
    message: `You don't have permission to ${action} this ${resource}`,
    code: 'PERMISSION_DENIED'
  };
}
