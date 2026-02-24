"use client";

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Types for the new permission system
export interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface ResourceType {
  id: number;
  name: string;
  display_name: string;
  description: string;
  table_name: string;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  // canonical DB id for the menu item (eg. 'generate-qr')
  menu_id?: string;
  name: string;
  display_name: string;
  description: string;
  parent_id: number | null;
  icon: string;
  path: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: number;
  role: string;
  resource_type: string;
  permission_type: 'create' | 'read' | 'update' | 'delete' | 'manage';
  scope: 'all' | 'group' | 'own' | 'none';
  description: string;
  role_id: number;
  resource_type_id: number;
  created_at: string;
  updated_at: string;
}

export interface MenuRolePermission {
  id: number;
  role_name: string;
  menu_item_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Legacy computed properties for backward compatibility
  role: string;
  menu_item: string;
  enabled: boolean;
}

export interface SystemSetting {
  id: number;
  category: string;
  setting_key: string;
  setting_value: string;
  data_type: 'string' | 'boolean' | 'number' | 'json';
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePermissions = () => {
  const [loading, setLoading] = useState(false);
  
  // State for permission data
  const [roles, setRoles] = useState<Role[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [menuRolePermissions, setMenuRolePermissions] = useState<MenuRolePermission[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);

  // API functions for role permissions
  const fetchRolePermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/role-permissions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setRolePermissions(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch role permissions');
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch role permissions");
    } finally {
      setLoading(false);
    }
  };

  const updateRolePermission = async (permissionData: Partial<RolePermission>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/role-permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        await fetchRolePermissions(); // Refresh data
        toast.success("Role permission updated successfully");
        return data;
      } else {
        throw new Error(data.message || 'Failed to update role permission');
      }
    } catch (error) {
      console.error('Error updating role permission:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update role permission");
    } finally {
      setLoading(false);
    }
  };

  // API functions for menu permissions
  const fetchMenuPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/menu-settings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        // Transform database data to match component expectations
        const transformedData = data.data.map((permission: any) => ({
          ...permission,
          // Add legacy compatibility fields
          role: permission.role_name,
          menu_item: permission.menu_item_id?.toString() || '',
          enabled: permission.can_view  // Use can_view as the primary "enabled" indicator
        }));
        
        console.log('🔄 Transformed permissions data:', transformedData.slice(0, 3));
        setMenuRolePermissions(transformedData);
      } else {
        throw new Error(data.message || 'Failed to fetch menu permissions');
      }
    } catch (error) {
      console.error('Error fetching menu permissions:', error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch menu permissions");
    } finally {
      setLoading(false);
    }
  };

  const updateMenuPermission = async (permissionData: Partial<MenuRolePermission>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/menu-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(permissionData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        await fetchMenuPermissions(); // Refresh data
        toast.success("Menu permission updated successfully");
        return data;
      } else {
        throw new Error(data.message || 'Failed to update menu permission');
      }
    } catch (_error) {
      console.error('Error updating menu permission:', _error);
      toast.error(_error instanceof Error ? _error.message : "Failed to update menu permission");
    } finally {
      setLoading(false);
    }
  };

  // API functions for system settings
  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system-settings');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setSystemSettings(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch system settings');
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch system settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSystemSetting = async (settingData: Partial<SystemSetting>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/system-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        await fetchSystemSettings(); // Refresh data
        toast.success("System setting updated successfully");
        return data;
      } else {
        throw new Error(data.message || 'Failed to update system setting');
      }
    } catch (error) {
      console.error('Error updating system setting:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update system setting");
    } finally {
      setLoading(false);
    }
  };
  // Fetch reference data
  const fetchReferenceData = async () => {
    try {
      setLoading(true);
      
      // Fetch roles from database
      const rolesResponse = await fetch('/api/admin/roles');
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        if (rolesData.success) {
          setRoles(rolesData.data);
        }
      }
      
      // Fetch resource types from database  
      const resourceTypesResponse = await fetch('/api/admin/resource-types');
      if (resourceTypesResponse.ok) {
        const resourceTypesData = await resourceTypesResponse.json();
        if (resourceTypesData.success) {
          setResourceTypes(resourceTypesData.data);
        }
      }
      
      // Fetch menu items from database
      const menuItemsResponse = await fetch('/api/admin/menu-items');
      if (menuItemsResponse.ok) {
        const menuItemsData = await menuItemsResponse.json();
        if (menuItemsData.success) {
          setMenuItems(menuItemsData.data);
        }
      }
      
    } catch (error) {
      console.error('Error fetching reference _data:', error);
      toast.error("Failed to fetch reference data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferenceData(); // Fetch roles, resource types, menu items first
    fetchRolePermissions();
    fetchMenuPermissions();
    fetchSystemSettings();
  }, []);

  // Utility functions
  const getRoleByName = (roleName: string) => {
    return roles.find(role => role.name === roleName);
  };

  const getResourceTypeByName = (resourceTypeName: string) => {
    return resourceTypes.find(rt => rt.name === resourceTypeName);
  };

  const getMenuItemByName = (menuItemName: string) => {
    return menuItems.find(mi => mi.name === menuItemName);
  };

  const getPermissionsByRole = (roleName: string) => {
    return rolePermissions.filter(rp => rp.role === roleName);
  };

  const getMenuPermissionsByRole = (roleName: string) => {
    return menuRolePermissions.filter(mrp => mrp.role === roleName);
  };

  return {
    // State
    loading,
    roles,
    resourceTypes,
    menuItems,
    rolePermissions,
    menuRolePermissions,
    systemSettings,
    
    // Role permission functions
    fetchRolePermissions,
    updateRolePermission,
    
    // Menu permission functions
    fetchMenuPermissions,
    updateMenuPermission,
    
    // System settings functions
    fetchSystemSettings,
    updateSystemSetting,
    
    // Reference data functions
    fetchReferenceData,
    
    // Utility functions
    getRoleByName,
    getResourceTypeByName,
    getMenuItemByName,
    getPermissionsByRole,
    getMenuPermissionsByRole,
  };
};

export default usePermissions;
