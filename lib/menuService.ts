import { prisma } from "./prisma";

export interface MenuItem {
  id: string;
  name: string;
  path?: string;
  icon?: string;
  children?: MenuItem[];
  isAccessible?: boolean;
  hasPermission?: boolean;
  href?: string;
  parent_id?: string | null;
  order?: number;
}

export async function getMenuPermissions(roleId: string) {
  // Ambil semua permission untuk role tertentu
  const permissions = await prisma.menu_role_permissions.findMany({
    where: {
      role_id: roleId
    },
    include: {
      menu_items: true
    }
  });

  return permissions.reduce((acc, perm) => {
    acc[perm.menu_items.menu_id] = {
      canView: perm.can_view,
      canCreate: perm.can_create,
      canEdit: perm.can_edit,
      canDelete: perm.can_delete
    };
    return acc;
  }, {} as { [key: string]: { canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean } });
}

export async function hasMenuAccess(menuId: string, roleId: string): Promise<boolean> {
  const permission = await prisma.menu_role_permissions.findFirst({
    where: {
      role_id: roleId,
      menu_items: {
        menu_id: menuId
      }
    }
  });

  return permission?.can_view ?? false;
}