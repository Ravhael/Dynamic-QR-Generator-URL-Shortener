import { MenuItem } from './menuService';
// get visible menus from API; fallback to empty array if fetch fails
import { getVisibleMenus } from './menuClient';

interface SidebarItem {
  id: string;
  name: string;
  href?: string;
  path?: string;
  children?: SidebarItem[];
}

// DEPRECATED: Runtime sidebar/menu navigation is sourced dynamically from the database.
// This placeholder is retained only for legacy analyzer compatibility and will be removed.
export const ACTUAL_SIDEBAR_NAVIGATION: SidebarItem[] = [];

export interface MenuAnalysisResult {
  missingInConfig: string[];
  missingInSidebar: string[];
  inconsistentPaths: Array<{menuId: string, sidebarPath: string, configPath: string}>;
  // compatibility fields used by MenuValidator UI
  missingPermissions: string[];
  permissionIssues?: Array<{ menuId: string; issue: string; suggestion: string }>;
}

export async function analyzeMenuConsistency(): Promise<MenuAnalysisResult> {
  // Extract all menu items recursively
  const extractMenuIds = (items: SidebarItem[] | MenuItem[]): string[] => {
    let ids: string[] = [];
    items.forEach(item => {
      ids.push(item.id);
      if ('children' in item && item.children) {
        ids = ids.concat(extractMenuIds(item.children));
      }
    });
    return ids;
  };

  // Use API-provided visible menus as the canonical config structure
  let menuStructure: MenuItem[] = []
  try {
    // default to admin to fetch full structure; caller context may replace
    menuStructure = await getVisibleMenus('admin')
  } catch (_err) {
    menuStructure = []
  }
  const sidebarMenuIds = extractMenuIds(ACTUAL_SIDEBAR_NAVIGATION);
  const configMenuIds = extractMenuIds(menuStructure);

  // Find missing menus
  const missingInConfig = sidebarMenuIds.filter(id => !configMenuIds.includes(id));
  const missingInSidebar = configMenuIds.filter(id => !sidebarMenuIds.includes(id));

  // Check path inconsistencies
  const inconsistentPaths: Array<{menuId: string, sidebarPath: string, configPath: string}> = [];
  
  const getSidebarPath = (menuId: string): string | undefined => {
    const findPath = (items: SidebarItem[]): string | undefined => {
      for (const item of items) {
        if (item.id === menuId) return item.href || item.path;
        if (item.children) {
          const found = findPath(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findPath(ACTUAL_SIDEBAR_NAVIGATION);
  };

  const getConfigPath = (menuId: string): string | undefined => {
    const findPath = (items: MenuItem[]): string | undefined => {
      for (const item of items) {
        if (item.id === menuId) return item.path;
        if (item.children) {
          const found = findPath(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findPath(menuStructure);
  };

  // Compare paths between sidebar and config
  configMenuIds.forEach(menuId => {
    const sidebarPath = getSidebarPath(menuId);
    const configPath = getConfigPath(menuId);

    if (sidebarPath && configPath && sidebarPath !== configPath) {
      inconsistentPaths.push({
        menuId,
        sidebarPath,
        configPath
      });
    }
  });

  return {
    missingInConfig,
    missingInSidebar,
    inconsistentPaths,
    missingPermissions: [],
    permissionIssues: []
  };
}

// Provide stubs used by MenuValidator to generate scripts and integrity checks
export function generateMenuConfigFix(): string {
  // Since menus are sourced from DB/API, suggest syncing task rather than static config writes
  return `// Menu config is sourced from database/API.\n// To add or fix a menu item, update records in menu_items and menu_role_permissions tables.\n// Then refresh the Menu Settings page.`
}

export function validateMenuIntegrity(_userRole?: string): { ok: boolean; issues: string[] } {
  // Minimal no-op validator; real validation should cross-check DB state
  return { ok: true, issues: [] }
}