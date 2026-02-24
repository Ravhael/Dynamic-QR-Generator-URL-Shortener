import { MenuItem } from './menuService';

/**
 * NOTE: This file exposes thin client helpers for menu visibility checks that
 * ultimately rely on the dynamic DB‑driven menu structure at `/api/menus/structure`.
 *
 * DEPRECATION PLAN (menu system refactor):
 * 1. ROLE_SETTINGS, MENU_STRUCTURE and MENU_PERMISSIONS below are legacy placeholders
 *    kept only so that older imports or analyzer utilities do not break. They are
 *    NOT consulted by the runtime menu / permission resolution (which uses Prisma).
 * 2. They will be removed after the documentation generator & analyzer are updated
 *    to pull everything directly from the database.
 * 3. Prefer using: `getFullMenuTree`, `getPermissionMatrix` (from menuTree.ts) or
 *    the API endpoints instead of any static constant.
 */

// Get visible menus for a user role
export async function getVisibleMenus(userRole: string): Promise<MenuItem[]> {
  try {
    const response = await fetch('/api/menus/structure', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch menus');
    }

    const data = await response.json();
    return data.menus;
  } catch (error) {
    console.error('Error fetching menus:', error);
    return [];
  }
}

// Check if a user has access to a menu
export async function hasMenuAccess(menuId: string, roleId: string): Promise<boolean> {
  const menuStructure = await getVisibleMenus(roleId);

  const findInMenu = (items: MenuItem[]): boolean => {
    for (const item of items) {
      if (item.id === menuId) {
        return true;
      }
      if (item.children) {
        const found = findInMenu(item.children);
        if (found) return true;
      }
    }
    return false;
  };

  return findInMenu(menuStructure);
}

// Define role level permission settings
export interface RoleSetting {
  permissions: string[];
  allowedMenus?: string[];
  restrictions?: string[];
}

// Role settings will be managed through the database later
/**
 * @deprecated Legacy static role permission placeholder. Runtime role/menu permissions
 * are sourced from the database (menu_role_permissions + roles). This object is retained
 * temporarily to avoid breaking older utility code and will be removed.
 */
export const ROLE_SETTINGS: { [key: string]: RoleSetting } = Object.freeze({
  ADMIN: { permissions: ["*"] },
  USER: { permissions: [
    "view_dashboard",
    "view_qr_codes",
    "create_qr_codes",
    "edit_qr_codes",
    "view_url_codes",
    "create_url_codes",
    "edit_url_codes"
  ] }
});

// Minimal stubs for Menu Validator compatibility
/**
 * @deprecated Static MENU_STRUCTURE placeholder (never populated in current flow).
 * Use dynamic tree from DB via menuTree.ts or /api/menus/structure.
 */
export const MENU_STRUCTURE: ReadonlyArray<{ id: string; label: string; path?: string; children?: ReadonlyArray<{ id: string; label: string; path?: string }> }> = Object.freeze([]);

/**
 * @deprecated Static MENU_PERMISSIONS placeholder. Use DB-backed menu_role_permissions
 * plus helper accessors (getPermissionMatrix) instead.
 */
export const MENU_PERMISSIONS: Readonly<Record<string, { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean; export?: boolean }>> = Object.freeze({});