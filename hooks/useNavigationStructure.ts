'use client';

import { useEffect, useState, useMemo } from 'react';
import * as Icons from '@heroicons/react/24/outline';

interface BaseMenuItem {
  id: string;
  name: string;
  path?: string;
}

interface MenuItem extends BaseMenuItem {
  icon?: string;
  children?: MenuItem[];
}

interface ProcessedMenuItem extends BaseMenuItem {
  icon?: React.ComponentType<{ className?: string }>;
  children?: ProcessedMenuItem[];
  href?: string;
}

export function useNavigationStructure() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchMenus = async () => {
      try {
        const response = await fetch('/api/menus');
        if (!response.ok) {
          throw new Error('Failed to fetch menus');
        }
        const data = await response.json();
        if (mounted) {
          setMenus(data.menus || []);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          setIsLoading(false);
        }
      }
    };

    fetchMenus();
    return () => {
      mounted = false;
    };
  }, []);

  const navigation = useMemo(() => {
    // Convert icon strings to components
    const processMenuItems = (items: MenuItem[]): ProcessedMenuItem[] => {
      return items.map(item => {
        // Process icon name to match HeroIcons naming convention
        const iconName = item.icon ? 
          item.icon.replace(/-/g, '')
            .replace(/^(.)/, c => c.toUpperCase())
            .replace(/Icon$/, '') + 'Icon'
          : 'QuestionMarkCircleIcon';
        
        const IconComponent = (Icons as any)[iconName] || Icons.QuestionMarkCircleIcon;
        
        return {
          id: item.id,
          name: item.name,
          path: item.path,
          href: item.path,  // Add href property
          icon: IconComponent,
          children: item.children ? processMenuItems(item.children) : undefined
        };
      });
    };

    return processMenuItems(menus);
  }, [menus]);

  return { navigation, loading: isLoading, error };
}