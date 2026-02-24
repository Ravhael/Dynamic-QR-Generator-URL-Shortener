import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { invalidateMenuCache } from '@/lib/menuTree';

// Types
interface MenuPermission {
  id: number;
  menuId: string;
  menuName: string;
  menuDescription: string;
  menuPath: string;
  menuIcon: string;
  parentMenuId?: string | null;
  menuOrder: number;
  isActive: boolean;
  isDefault: boolean;
  rolePermissions: {
    admin: { hasAccess: boolean; canView: boolean; canEdit: boolean; canCreate: boolean; canDelete: boolean; isRestricted: boolean };
    editor: { hasAccess: boolean; canView: boolean; canEdit: boolean; canCreate: boolean; canDelete: boolean; isRestricted: boolean };
    viewer: { hasAccess: boolean; canView: boolean; canEdit: boolean; canCreate: boolean; canDelete: boolean; isRestricted: boolean };
    user: { hasAccess: boolean; canView: boolean; canEdit: boolean; canCreate: boolean; canDelete: boolean; isRestricted: boolean };
  };
}

// NOTE: Removed giant static menu seed; dynamic data now sourced from menu_items & menu_role_permissions.
// Assumptions due to schema differences:
// - Original SQL referenced menu_permissions(mp.*) + menu_role_permissions(mrp.*) with columns (menu_name, menu_description, ...).
// - Current Prisma schema exposes menu_items (name, path, icon, parent_id, sort_order, is_active, is_group) and menu_role_permissions (role_name, booleans, derived flags).
// - "description" & "is_default" not present; we'll supply defaults (empty string / false).
// - hasAccess maps to (is_accessible ?? has_permission ?? false); isRestricted = !hasAccess.
// - Provided roles of interest: admin, editor, viewer, user. Missing entries default to restricted false perms.
// If additional fidelity is required, extend Prisma schema or adjust mapping layer here.

export async function GET() {
  const started = Date.now();
  try {
    console.log('[MENU-PERMISSIONS] Fetching from Prisma menu_items + menu_role_permissions');
    const items = await prisma.menu_items.findMany({
      where: { is_active: true },
      orderBy: [
        { parent_id: 'asc' },
        { sort_order: 'asc' },
        { menu_id: 'asc' }
      ],
      include: { menu_role_permissions: true }
    });

    const rolesOfInterest = ['admin', 'editor', 'viewer', 'user'];

    const data = items.map(item => {
      const basePerm = { hasAccess: false, canView: false, canEdit: false, canCreate: false, canDelete: false, isRestricted: true };
      const rolePermissions: MenuPermission['rolePermissions'] = {
        admin: { ...basePerm },
        editor: { ...basePerm },
        viewer: { ...basePerm },
        user: { ...basePerm }
      };
      for (const rp of item.menu_role_permissions) {
        const roleKey = rp.role_name as keyof typeof rolePermissions;
        if (rolesOfInterest.includes(rp.role_name) && rolePermissions[roleKey]) {
          const hasAccess = (rp.is_accessible ?? rp.has_permission ?? false) as boolean;
          rolePermissions[roleKey] = {
            hasAccess,
            canView: rp.can_view ?? false,
            canEdit: rp.can_edit ?? false,
            canCreate: rp.can_create ?? false,
            canDelete: rp.can_delete ?? false,
            isRestricted: !hasAccess
          };
        }
      }
      return {
        id: item.id,
        menuId: item.menu_id,
        menuName: item.name,
        menuDescription: '', // not present in schema
        menuPath: item.path,
        menuIcon: item.icon || 'HomeIcon',
        parentMenuId: item.parent_id,
        menuOrder: item.sort_order ?? 0,
        isActive: item.is_active ?? true,
        isDefault: false, // not present; default
        rolePermissions
      };
    });
    console.log(`[MENU-PERMISSIONS] Built ${data.length} menu entries in ${Date.now() - started}ms`);
    return NextResponse.json({ success: true, data, total: data.length, message: 'Menu permissions retrieved successfully' });
  } catch (error) {
    console.error('[MENU-PERMISSIONS] Error fetching menu permissions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch menu permissions', data: [], total: 0 }, { status: 500 });
  }
}
      
interface UpdateItem {
  role: string;
  menuId: string;
  permissions: {
    hasAccess?: boolean;
    canView?: boolean;
    canEdit?: boolean;
    canCreate?: boolean;
    canDelete?: boolean;
    isRestricted?: boolean; // ignored (derived)
  };
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  try {
    const updates = await request.json();
    const updatesArray: UpdateItem[] = Array.isArray(updates) ? updates : [updates];
    if (updatesArray.length === 0) {
      return NextResponse.json({ success: false, error: 'No updates provided' }, { status: 400 });
    }

    let applied = 0;
    for (const update of updatesArray) {
      if (!update.role || !update.menuId || !update.permissions) {
        console.warn('[MENU-PERMISSIONS] Skipping invalid update payload', update);
        continue;
      }
      const menuItem = await prisma.menu_items.findUnique({ where: { menu_id: update.menuId } });
      if (!menuItem) {
        console.warn(`[MENU-PERMISSIONS] menu_id ${update.menuId} not found; skipping`);
        continue;
      }
      const hasAccess = update.permissions.hasAccess ?? false;
      // find role by name to obtain role_id
      const roleRecord = await prisma.roles.findUnique({ where: { name: update.role } });
      if (!roleRecord) {
        console.warn(`[MENU-PERMISSIONS] role ${update.role} not found; skipping`);
        continue;
      }
      await prisma.menu_role_permissions.upsert({
        where: {
          role_name_menu_item_id: {
            role_name: update.role,
            menu_item_id: menuItem.id
          }
        },
        create: {
          role_name: update.role,
          menu_items: { connect: { id: menuItem.id } },
          roles: { connect: { id: roleRecord.id } },
          can_view: update.permissions.canView ?? false,
          can_edit: update.permissions.canEdit ?? false,
          can_create: update.permissions.canCreate ?? false,
          can_delete: update.permissions.canDelete ?? false,
          can_export: false,
          is_active: true,
          is_accessible: hasAccess,
          has_permission: hasAccess,
          created_at: new Date(),
          updated_at: new Date()
        },
        update: {
          can_view: update.permissions.canView ?? false,
          can_edit: update.permissions.canEdit ?? false,
          can_create: update.permissions.canCreate ?? false,
          can_delete: update.permissions.canDelete ?? false,
          is_accessible: hasAccess,
          has_permission: hasAccess,
          updated_at: new Date()
        }
      });
      applied++;
    }

  // Broad invalidation: we don't know which roles were touched cheaply; nuke all.
  invalidateMenuCache();
  return NextResponse.json({ success: true, message: 'Menu permissions updated (cache invalidated)', updatedCount: applied, elapsedMs: Date.now() - started });
  } catch (error: any) {
    console.error('[MENU-PERMISSIONS] Error updating menu permissions:', error);
    return NextResponse.json({ success: false, error: 'Failed to update menu permissions', details: error?.message }, { status: 500 });
  }
}
