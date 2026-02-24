'use client';

import { MenuItem } from './menuService';

export async function fetchMenuStructure(): Promise<MenuItem[]> {
  try {
    console.info('🔄 Fetching menu structure from API...');
    const response = await fetch('/api/menus/structure');
    
    console.info('📥 API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API error response:', errorText);
      throw new Error(`Failed to fetch menu structure: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.info('✅ Received menu data:', data);
    
    if (!data.menus) {
      console.warn('⚠️ No menus property in API response');
      return [];
    }
    
    return data.menus;
  } catch (error) {
    console.error('❌ Error fetching menu structure:', error);
    throw error; // Let the caller handle the error
  }
}

export async function fetchMenuPermissions(userRole: string): Promise<MenuItem[]> {
  try {
    const response = await fetch(`/api/menus/permissions?role=${userRole}`);
    if (!response.ok) {
      throw new Error('Failed to fetch menu permissions');
    }
    const data = await response.json();
    return data.menus;
  } catch (error) {
    console.error('Error fetching menu permissions:', error);
    return [];
  }
}

// Fetch permissions for current authenticated user's role (can_view map)
export async function fetchOwnMenuPermissions(): Promise<{ menu_item_id: number; can_view: boolean; is_accessible?: boolean; has_permission?: boolean }[]> {
  try {
    const res = await fetch('/api/menus/permissions');
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.success) return [];
    return data.permissions || [];
  } catch (e) {
    console.error('Error fetchOwnMenuPermissions:', e);
    return [];
  }
}