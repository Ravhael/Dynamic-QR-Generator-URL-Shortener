import { useState, useEffect } from 'react';

export interface MenuItemDB {
  id: number;
  menu_id: string;
  name: string;
  path: string | null;
  icon: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  is_group: boolean;
  created_at: string;
  updated_at: string;
  permissions: {
    name: string;
    description: string;
    is_active: boolean;
  }[];
  children?: MenuItemDB[];
}

export interface MenuItemsResponse {
  success: boolean;
  data: {
    menus: MenuItemDB[];
    flat_menus: MenuItemDB[];
    statistics: {
      total_items: number;
      group_items: number;
      regular_items: number;
      total_permissions: number;
    };
  };
}

export const useMenuItems = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemDB[]>([]);
  const [flatMenuItems, setFlatMenuItems] = useState<MenuItemDB[]>([]);
  const [statistics, setStatistics] = useState({
    total_items: 0,
    group_items: 0,
    regular_items: 0,
    total_permissions: 0,
  });

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/menu-items', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: MenuItemsResponse = await response.json();

      if (result.success) {
        setMenuItems(result.data.menus);
        setFlatMenuItems(result.data.flat_menus);
        setStatistics(result.data.statistics);
      } else {
        throw new Error('Failed to fetch menu items');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  return {
    loading,
    error,
    menuItems,
    flatMenuItems,
    statistics,
    refetch: fetchMenuItems,
  };
};