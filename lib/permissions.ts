import { prisma } from '@/lib/prisma'

// Canonical resource names are singular snake_case
const RESOURCE_ALIASES: Record<string,string> = {
  qr_codes: 'qr_code',
  qr_code: 'qr_code',
  qr: 'qr_code',
  short_urls: 'short_url',
  short_url: 'short_url',
  urls: 'short_url',
  url: 'short_url',
  qr_analytics: 'qr_analytics',
  url_analytics: 'url_analytics',
  analytics: 'analytics',
  scan_events: 'scan_events',
  click_events: 'click_events',
  users: 'users',
  user_analytics: 'users',
  group_users: 'group_users',
};
function normalizeResourceName(name: string): string {
  return RESOURCE_ALIASES[name as string] || name;
}

export interface PermissionCheck {
  userId: string; // UUID
  userRole: string;
  userGroupId: number;
  // Allow any string resource type to avoid tight coupling with evolving resource_types table
  resourceType: string;
  permissionType: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export';
  resourceOwnerId?: string; // UUID of owner user
  resourceGroupId?: number;
}

// Map export -> read internally for scope resolution
function normalizePermissionType(pt: PermissionCheck['permissionType']): PermissionCheck['permissionType'] | 'read' {
  if (pt === 'export') return 'read';
  return pt;
}

export async function checkPermission(params: PermissionCheck): Promise<boolean> {
  try {
    const { userId, userRole, userGroupId, resourceType, permissionType, resourceOwnerId, resourceGroupId } = params;
    const normalizedType = normalizePermissionType(permissionType);
    const canonicalResource = normalizeResourceName(resourceType.toLowerCase());
    const triedResources: string[] = [];

    const roleVariants = Array.from(new Set([userRole, userRole.toLowerCase(), userRole.toUpperCase()]));
    let permission: { scope: string } | null = null;

    for (const roleVariant of roleVariants) {
      // canonical
      triedResources.push(`${roleVariant}:${canonicalResource}`);
      permission = await prisma.role_permissions.findFirst({
        where: { role: roleVariant, resource_type: canonicalResource, permission_type: normalizedType },
        select: { scope: true }
      });
      if (permission) break;
      // original form
      if (canonicalResource !== resourceType.toLowerCase()) {
        triedResources.push(`${roleVariant}:${resourceType.toLowerCase()}`);
        permission = await prisma.role_permissions.findFirst({
          where: { role: roleVariant, resource_type: resourceType.toLowerCase(), permission_type: normalizedType },
          select: { scope: true }
        });
        if (permission) {
          console.warn('[PERMISSIONS] Fallback resource matched', { roleVariant, resourceType, canonicalResource, normalizedType });
          break;
        }
      }
    }

    if (!permission) {
      // Soft-allow read for analytics-related resources to prevent blank dashboards when RBAC rows are missing.
      if (normalizedType === 'read' && ['analytics','qr_analytics','url_analytics','scan_events','click_events'].includes(canonicalResource)) {
        console.warn('[PERMISSIONS] Soft-allow read for analytics resource (no DB record)', { userRole, canonicalResource });
        return true;
      }
      if (['admin','administrator','superadmin'].includes(userRole.toLowerCase())) {
        console.warn('[PERMISSIONS] Admin implicit allow (no DB record)', { userRole, canonicalResource, normalizedType });
        return true;
      }
      console.warn('[PERMISSIONS] DENY (no DB record)', { userRole, canonicalResource, originalResource: resourceType, normalizedType, triedResources });
      return false;
    }

    const scope = permission.scope;

    // Create special-case: owner not known yet. Allow for scope all/group/own.
    if (normalizedType === 'create') {
      if (['all','group','own'].includes(scope)) return true;
      return false;
    }

    switch (scope) {
      case 'all':
        return true;
      case 'group': {
        if (resourceGroupId !== undefined) return userGroupId === resourceGroupId;
        if (canonicalResource === 'users' && resourceOwnerId) {
          const targetUser = await prisma.users.findUnique({ where: { id: resourceOwnerId }, select: { group_id: true } });
          if (targetUser) return userGroupId === (targetUser.group_id ?? 0);
        }
        return true; // fallback
      }
      case 'own': {
        if (resourceOwnerId) return userId === resourceOwnerId;
        return false;
      }
      case 'none':
        return false;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

export async function getMenuPermissions(role: string): Promise<Record<string, boolean>> {
  try {
    const rows = await prisma.menu_role_permissions.findMany({
      where: { role_name: role },
      select: { menu_items: { select: { menu_id: true } }, can_view: true }
    })
    const menuPermissions: Record<string, boolean> = {};
    rows.forEach(r => {
      if (r.menu_items?.menu_id) menuPermissions[r.menu_items.menu_id] = !!r.can_view;
    })
    
    return menuPermissions;
    
  } catch (error) {
    console.error('Error fetching menu permissions:', error);
    return {};
  }
}

export async function logUserAccess(params: {
  userId: number;
  groupId: number;
  resourceType: string;
  resourceId: number;
  action: string;
}): Promise<void> {
  return
}

// Helper function to check if user can access QR codes
export async function canAccessQRCode(
  userId: string,
  userRole: string,
  userGroupId: number,
  qrCodeId: string,
  action: 'read' | 'update' | 'delete' | 'export'
): Promise<boolean> {
  try {
    // Get QR code details
  const qr = await prisma.qr_codes.findUnique({ where: { id: qrCodeId }, select: { user_id: true, created_by: true } })
    if (!qr) {
      return false; // QR code doesn't exist
    }
    
  const ownerId = qr.user_id || qr.created_by || undefined;
  const owner = ownerId ? await prisma.users.findUnique({ where: { id: ownerId }, select: { group_id: true } }) : null
  const ownerGroupId = owner?.group_id;
    
    return await checkPermission({
      userId,
      userRole,
      userGroupId,
      resourceType: 'qr_code',
      permissionType: action,
      resourceOwnerId: ownerId,
      resourceGroupId: ownerGroupId
    });
    
  } catch (error) {
    console.error('Error checking QR code access:', error);
    return false;
  }
}

// Helper function to check if user can access URLs
export async function canAccessURL(
  userId: string,
  userRole: string,
  userGroupId: number,
  urlId: string,
  action: 'read' | 'update' | 'delete' | 'export'
): Promise<boolean> {
  try {
    // Get URL details
  const url = await prisma.short_urls.findUnique({ where: { id: urlId }, select: { user_id: true, created_by: true } })
    if (!url) {
      return false; // URL doesn't exist
    }
    
  const ownerId = url.user_id || url.created_by || undefined;
  const owner = ownerId ? await prisma.users.findUnique({ where: { id: ownerId }, select: { group_id: true } }) : null
  const ownerGroupId = owner?.group_id;
    
    return await checkPermission({
      userId,
      userRole,
      userGroupId,
      resourceType: 'short_url',
      permissionType: action,
      resourceOwnerId: ownerId,
      resourceGroupId: ownerGroupId
    });
    
  } catch (error) {
    console.error('Error checking URL access:', error);
    return false;
  }
}
