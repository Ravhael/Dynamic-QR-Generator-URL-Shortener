"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/contexts/AuthContext';
import { MenuItem } from '@/lib/menuService';
import { fetchMenuStructure, fetchOwnMenuPermissions } from '@/lib/menuApi';

interface RawPermissionRow {
  menu_item_id: number;
  can_view: boolean;
  is_accessible?: boolean;
  has_permission?: boolean;
}

interface MenuItemWithAccess extends MenuItem {
  isAccessible: boolean; // can_view true OR Administrator
  locked?: boolean;      // convenience flag (not accessible)
  children?: MenuItemWithAccess[];
  internalId?: number;   // numeric primary key from backend
}

interface MenuPermissionsHook {
  visibleMenus: MenuItem[];
  canAccessPath: (path: string) => boolean;
  checkMenuAccess: (menuName: string) => boolean;
  loading: boolean;
  error: string | null;
  userRole: string | null;
  isSyncing: boolean;
}

const ADMIN_ROLE_LABELS = ["admin", "administrator", "superadmin"];

const isAdminRole = (role?: string | null) =>
  !!role && ADMIN_ROLE_LABELS.includes(role.toLowerCase());

const findMenuNode = (items: MenuItemWithAccess[], targetId: string): MenuItemWithAccess | null => {
  for (const item of items) {
    if (item.id === targetId) return item;
    if (item.children) {
      const found = findMenuNode(item.children, targetId);
      if (found) return found;
    }
  }
  return null;
};

const detachMenuNode = (items: MenuItemWithAccess[], targetId: string): MenuItemWithAccess | null => {
  for (let index = 0; index < items.length; index += 1) {
    const node = items[index];
    if (node.id === targetId) {
      const [removed] = items.splice(index, 1);
      return removed;
    }
    if (node.children && node.children.length) {
      const removedChild = detachMenuNode(node.children, targetId);
      if (removedChild) {
        if (node.children.length === 0) {
          delete node.children;
        }
        return removedChild;
      }
    }
  }
  return null;
};

const moveMenuIntoGroup = (
  items: MenuItemWithAccess[],
  menuId: string,
  targetParentId: string
) => {
  const parent = findMenuNode(items, targetParentId);
  if (!parent) return;
  if (parent.children?.some(child => child.id === menuId)) return;
  const detached = detachMenuNode(items, menuId);
  if (!detached) return;
  parent.children = parent.children ? [...parent.children, detached] : [detached];
};

const normalizeMenuHierarchy = (menus: MenuItemWithAccess[], userRole?: string | null): MenuItemWithAccess[] => {
  moveMenuIntoGroup(menus, 'settings', 'administrator');
  if (!isAdminRole(userRole)) {
    return menus.filter(item => item.id !== 'administrator');
  }
  return menus;
};

// Convert MenuItem to MenuItemWithAccess; actual access decided later
const convertToMenuItem = (menuItem: any): MenuItemWithAccess => ({
  id: menuItem.id, // public menu_id string
  internalId: menuItem.internalId, // numeric ID if provided
  name: menuItem.name,
  path: menuItem.path || undefined,
  icon: menuItem.icon || undefined,
  // Preserve backend-evaluated accessibility if present; will be reconciled later
  isAccessible: typeof menuItem.isAccessible === 'boolean' ? menuItem.isAccessible : true,
  children: menuItem.children?.map(convertToMenuItem) || undefined
});

export const useMenuPermissions = (): MenuPermissionsHook => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const userRole = user?.role;

  // Get visible menus based on user role using menuConfig
  const [visibleMenus, setVisibleMenus] = useState<MenuItemWithAccess[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  // global debounce ref (persist across re-renders)
  const debounceRef = (typeof window !== 'undefined') ? ((window as any).__menuPermDebounceRef ||= { current: null }) : { current: null };
  const cacheStore = (typeof window !== 'undefined') ? ((window as any).__menuPermCache ||= new Map<string, { expires: number; menus: MenuItemWithAccess[] }>()) : null;
  const cacheKey = userRole || 'guest';
  const MENU_CACHE_TTL_MS = 60_000;

  useEffect(() => {
    const loadMenus = async () => {
      if (!userRole) {
        console.warn('🚫 No user role found, skipping menu load');
        return;
      }
      
      console.info('🔄 Loading menus for role:', userRole);
      
      try {
        const cachedEntry = cacheStore?.get(cacheKey);
        if (cachedEntry && cachedEntry.expires > Date.now()) {
          console.info('♻️ Using cached menu structure for role:', cacheKey);
          setVisibleMenus(cachedEntry.menus);
          setLoading(false);
          setIsSyncing(false);
          return;
        }

  const menus = await fetchMenuStructure();
        console.info('📋 Fetched menu structure:', menus);
        
        if (!menus || menus.length === 0) {
          console.warn('⚠️ No menus returned from API');
          setError('No menus available');
          setVisibleMenus([]);
          return;
        }
        
        const processedMenus = normalizeMenuHierarchy(menus.map(convertToMenuItem), userRole);

        // Fetch own permission map (menu_item_id + can_view) for any role (admin now also respects can_view)
  setIsSyncing(true);
  const permissionMap: RawPermissionRow[] = await fetchOwnMenuPermissions();
  const accessSet = new Set(permissionMap.filter(p => (p.is_accessible ?? p.can_view)).map(p => p.menu_item_id));

        const markAccess = (items: MenuItemWithAccess[]): MenuItemWithAccess[] => {
          return items.map(i => {
            const withChildren = i.children ? markAccess(i.children) : undefined;
            // Prefer server-provided flag; else compute by numeric internalId set membership
            const computed = i.path
              ? (typeof i.isAccessible === 'boolean'
                  ? i.isAccessible
                  : (i.internalId != null ? accessSet.has(i.internalId) : false))
              : true; // groups always visible (lock state represented by children)
            return { ...i, children: withChildren, isAccessible: computed, locked: !computed };
          });
        };

        const finalMenus = markAccess(processedMenus);
        setVisibleMenus(finalMenus);
        setLoading(false);
        setIsSyncing(false);
        cacheStore?.set(cacheKey, { menus: finalMenus, expires: Date.now() + MENU_CACHE_TTL_MS });
      } catch (err) {
        console.error('❌ Error getting visible menus:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setVisibleMenus([]);
        setIsSyncing(false);
      }
    };
    
    loadMenus();
    // Listen for global permission updates to refetch
    const handler = () => {
      // debounce 250ms to avoid burst refetch
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        cacheStore?.delete(cacheKey);
        loadMenus();
      }, 250);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('permissions-updated', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('permissions-updated', handler);
      }
    };
  }, [userRole]);

  useEffect(() => {
    // Simulate loading delay for consistency
    const timer = setTimeout(() => {
      setLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const canAccessPath = (path: string): boolean => {
    const findMenuByPath = (menus: MenuItem[], targetPath: string): MenuItem | null => {
      for (const menu of menus) {
        if (menu.path === targetPath) {
          return menu;
        }
        if (menu.children) {
          const found = findMenuByPath(menu.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    const menu = findMenuByPath(visibleMenus, path);
    return menu !== null;
  };

  const checkMenuAccess = (menuName: string): boolean => {
    // Look for item by name with isAccessible true
    const search = (items: MenuItemWithAccess[]): boolean => {
      for (const it of items) {
        if (it.name === menuName) return !!it.isAccessible;
        if (it.children && search(it.children)) return true;
      }
      return false;
    };
    return search(visibleMenus);
  };

  return {
    visibleMenus,
    canAccessPath,
    checkMenuAccess,
    loading,
    error,
    userRole,
    isSyncing
  };
};

export default useMenuPermissions;