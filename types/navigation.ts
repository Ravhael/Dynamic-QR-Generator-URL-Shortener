import { ComponentType } from 'react';
export interface MenuItem {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
  isAccessible: boolean;
  parent_id?: string | null;
  order?: number;
  children?: MenuItem[];
}

export interface NavigationGroup {
  id: string;
  name: string;
  icon: ComponentType<{ className?: string }>;
  children?: MenuItem[];
  isAccessible?: boolean;
  href?: string;
}

export interface MenuFromDB {
  id: string;
  name: string;
  icon_name: string;
  href?: string;
  parent_id: string | null;
  order: number;
  isAccessible: boolean;
}