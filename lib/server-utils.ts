'use server'

import { prisma } from './prisma'

// Get menu items the role can view, based on menu_role_permissions
export async function getMenuPermissions(roleName: string) {
  const menuPermissions = await prisma.menu_role_permissions.findMany({
    where: {
      role_name: roleName,
      is_active: true,
      can_view: true,
    },
    include: {
      menu_items: true,
    },
  })

  return menuPermissions.map((perm) => perm.menu_items)
}

export async function checkPermission(params: {
  userId: number;
  userRole: string;
  userGroupId: number;
  resourceType: 'qr_codes' | 'urls' | 'users' | 'groups' | 'analytics' | 'system';
  permissionType: 'create' | 'read' | 'update' | 'delete' | 'manage';
  resourceOwnerId?: number;
  resourceGroupId?: number;
}) {
  const { userRole, resourceType, permissionType } = params;

  // userRole can be a role name or a UUID role_id; check both
  const permission = await prisma.role_permissions.findFirst({
    where: {
      resource_type: resourceType,
      permission_type: permissionType,
      OR: [
        { role: userRole },
        { role_id: userRole },
      ],
    },
  });

  return !!permission;
}