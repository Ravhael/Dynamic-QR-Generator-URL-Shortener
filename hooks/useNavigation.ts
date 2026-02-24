import { useState, useEffect } from 'react';
import { MenuItemDB } from './useMenuItems';

export interface NavigationItem {
  name: string;
  id: string;
  icon?: any;
  href?: string;
  children?: NavigationItem[];
  isAccessible?: boolean;
}

export const useNavigation = () => {
  const [loading, setLoading] = useState(true);
  const [navigation, setNavigation] = useState<NavigationItem[]>([]);

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const response = await fetch('/api/admin/menu-items', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch menu items');
        }

        const result = await response.json();
        
        if (result.success) {
          const menus = result.data.menus;
          const navigation = menus.map((menu: MenuItemDB) => {
            const item: NavigationItem = {
              name: menu.name,
              id: menu.menu_id,
              href: menu.path || undefined,
              isAccessible: true // Will be handled by permissions check
            };

            // Add children if this is a group
            if (menu.is_group && menu.children) {
              item.children = menu.children.map(child => ({
                name: child.name,
                id: child.menu_id,
                href: child.path || undefined,
                isAccessible: true // Will be handled by permissions check
              }));
            }

            return item;
          });

          setNavigation(navigation);
        }
      } catch (error) {
        console.error('Error fetching navigation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNavigation();
  }, []);

  return { navigation, loading };
};