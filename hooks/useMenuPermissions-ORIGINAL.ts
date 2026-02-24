"use client";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/contexts/AuthContext';
// import { getVisibleMenus, hasMenuAccess, MenuItem as MenuConfigItem } from '@/menuConfig';

// Temporary mock implementation until menuConfig is available
interface MenuConfigItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  children?: MenuConfigItem[];
}

const getVisibleMenus = (userRole: string): MenuConfigItem[] => {
  // Mock menu structure - replace with actual implementation
  return [
    {
      id: 'dashboard',
      name: 'Dashboard',
      path: '/dashboard',
      icon: 'dashboard'
    }
  ];
};

const hasMenuAccess = (menuName: string, userRole: string): boolean => {
  // Mock access check - replace with actual implementation
  return true;
};

interface MenuItem {
  id: string;
  name: string;
  path: string;
  icon: string;
  isAccessible?: boolean;
  hasPermission?: boolean;
  children?: MenuItem[];
}

interface MenuPermissionsHook {
  visibleMenus: MenuItem[];
  canAccessPath: (path: string) => boolean;
  checkMenuAccess: (menuName: string) => boolean;
  loading: boolean;
  error: string | null;
  userRole: string | null;
}

// Convert MenuConfigItem to MenuItem
const convertToMenuItem = (menuItem: MenuConfigItem): MenuItem => ({
  id: menuItem.id,
  name: menuItem.name,
  path: menuItem.path,
  icon: menuItem.icon,
  isAccessible: true,
  hasPermission: true,
  children: menuItem.children?.map(convertToMenuItem)
});

export const useMenuPermissions = (): MenuPermissionsHook => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const userRole = user?.role || 'user';

  // Get visible menus based on user role using menuConfig
  const visibleMenus = useMemo(() => {
    try {
      const menuStructure = getVisibleMenus(userRole);
      return menuStructure.map(convertToMenuItem);
    } catch (err) {
      console.error('Error getting visible menus:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    }
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
    return hasMenuAccess(menuName, userRole);
  };

  return {
    visibleMenus,
    canAccessPath,
    checkMenuAccess,
    loading,
    error,
    userRole
  };
};

export default useMenuPermissions;