"use client";

import React, { useState, useEffect, Fragment } from 'react';
import usePermissions, { 
  MenuRolePermission, 
  Role, 
  MenuItem 
} from '@/hooks/usePermissions';
import { useMenuItems, MenuItemDB } from '@/hooks/useMenuItems';
import {
  ArrowPathIcon,
  Bars3Icon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  HomeIcon,
  QrCodeIcon,
  LinkIcon,
  FolderIcon,
  UserGroupIcon,
  UserIcon,
  ChartBarIcon,
  CogIcon,
  ShieldCheckIcon,
  PlusCircleIcon,
  TableCellsIcon,
  DocumentChartBarIcon,
  BellIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  UsersIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import getMenuIconClass from '@/lib/iconColors';

interface MenuSettingsTabProps {
  onClose?: () => void;
}

// Define menu groups structure matching sidebar - now powered by database
const getMenuGroupStructure = (dbMenuItems: MenuItemDB[]) => {
  // Icon mapping for menu items
  const getIconComponent = (iconName: string | null) => {
    if (!iconName) return HomeIcon;

    // Log untuk debugging
    console.log('🔍 Mencari icon:', iconName);

    // MAPPING YANG BENAR untuk setiap icon dari database
    const exactIconMap: { [key: string]: React.ComponentType<any> } = {
      // Yang ada di database -> Yang ada di Heroicons
      'activity': ChartBarIcon,        // ❌ Tidak ada ActivityIcon
      'bar-chart': ChartBarIcon,       // ✅ Pake ChartBarIcon
      'bell': BellIcon,                // ✅ Sudah benar
      'chart': ChartBarIcon,           // ✅ Pake ChartBarIcon
      'command': TableCellsIcon,       // ❌ Harusnya CommandLineIcon tapi kita pake TableCells
      'dashboard': Squares2X2Icon,      // ✅ Pake Squares2X2Icon
      'file-text': DocumentChartBarIcon, // ❌ Harusnya DocumentTextIcon
      'folder': FolderIcon,            // ✅ Sudah benar
      'link': LinkIcon,                // ✅ Sudah benar
      'list': TableCellsIcon,          // ❌ Harusnya ListBulletIcon tapi pake TableCells
      'menu': Bars3Icon,               // ✅ Pake Bars3Icon
      'migration': ArrowPathIcon,       // ✅ Pake ArrowPathIcon
      'plus-circle': PlusCircleIcon,    // ✅ Sudah benar
      'qr-code': QrCodeIcon,           // ✅ Sudah benar
      'settings': CogIcon,             // ✅ Pake CogIcon
      'shield': ShieldCheckIcon,        // ✅ Pake ShieldCheckIcon
      'user': UserIcon,                // ✅ Sudah benar
      'user-check': UsersIcon,         // ❌ Tidak ada UserCheckIcon, pake Users
      'user-group': UserGroupIcon,      // ✅ Sudah benar
      'users': UsersIcon               // ✅ Sudah benar
    };

    const baseIconMap: { [key: string]: React.ComponentType<any> } = {
      // Core Icons
      // Navigation & Core
      'dashboard': Squares2X2Icon,
      'home': HomeIcon,
      'command': TableCellsIcon,
      
      // User related
      'user': UserIcon,
      'users': UsersIcon,
      'profile': UserIcon,
      'user-check': UsersIcon,
      'user-group': UserGroupIcon,
      'group': UserGroupIcon,
      'groups': UserGroupIcon,
      
      // QR Code & URL related
      'qr': QrCodeIcon,
      'qr-code': QrCodeIcon,
      'qrcode': QrCodeIcon,
      'url': LinkIcon,
      'link': LinkIcon,
      
      // Action icons
      'plus-circle': PlusCircleIcon,
      'plus': PlusCircleIcon,
      'eye': EyeIcon,
      'view': EyeIcon,
      'generate': PlusCircleIcon,
      
      // Analytics & Charts
      'chart': ChartBarIcon,
      'bar-chart': ChartBarIcon,
      'analytics': ChartBarIcon,
      'stats': ChartBarIcon,
      'statistics': ChartBarIcon,
      'detailed': ChartBarIcon,
      'detailed-analytics': ChartBarIcon,
      
      // Content & Organization
      'list': TableCellsIcon,
      'folder': FolderIcon,
      'categories': FolderIcon,
      'file': DocumentChartBarIcon,
      'file-text': DocumentChartBarIcon,
      'files': DocumentChartBarIcon,
      'document': DocumentChartBarIcon,
      'documents': DocumentChartBarIcon,
      'reports': DocumentChartBarIcon,
      'panel': TableCellsIcon,
      
      // Status & Notifications
      'bell': BellIcon,
      'notification': BellIcon,
      'notifications': BellIcon,
      'alert': BellIcon,
      'alerts': BellIcon,
      
      // Settings & Admin
      'settings': CogIcon,
      'cog': CogIcon,
      'admin': CogIcon,
      'administrator': CogIcon,
      'shield': ShieldCheckIcon,
      'menu': Bars3Icon,
      'activity': DocumentChartBarIcon,
      'migration': ArrowPathIcon,
      'system': CogIcon,
      'permissions': ShieldCheckIcon,
      'roles': ShieldCheckIcon,
    };
    
    // Clean and normalize the icon name
    const normalizedName = iconName.toLowerCase()
      .trim()
      .replace(/\s+/g, '-')     // Replace spaces with dashes
      .replace(/^icon-/, '')     // Remove leading 'icon-'
      .replace(/-icon$/, '')     // Remove trailing '-icon'
      .replace(/icon$/, '');     // Remove trailing 'icon'

    console.log('Looking for icon:', { original: iconName, normalized: normalizedName });
    
    // Direct match
    if (baseIconMap[normalizedName]) {
      return baseIconMap[normalizedName];
    }
    
    // Try each word in the normalized name
    const words = normalizedName.split('-');
    for (const word of words) {
      if (baseIconMap[word]) {
        return baseIconMap[word];
      }
    }

    // Special cases
    if (normalizedName.includes('analytics')) return ChartBarIcon;
    if (normalizedName.includes('chart')) return ChartBarIcon;
    if (normalizedName.includes('admin')) return CogIcon;
    if (normalizedName.includes('settings')) return CogIcon;
    if (normalizedName.includes('activity')) return DocumentChartBarIcon;

    console.warn(`No icon found for "${iconName}", using default`);
    return Bars3Icon;
  };

  if (!dbMenuItems || dbMenuItems.length === 0) {
    return [];
  }

  const groups: Array<{
    name: string;
    id: string;
    type: 'group' | 'single';
    icon: React.ComponentType<any>;
    children?: Array<{
      name: string;
      id: string;
      icon: React.ComponentType<any>;
    }>;
  }> = [];

  // Process hierarchical menu structure from database
  dbMenuItems.forEach(menuItem => {
    if (menuItem.is_group) {
      // This is a group with children
      const children = menuItem.children?.map(child => ({
        name: child.name,
        id: child.menu_id,
        icon: getIconComponent(child.icon)
      })) || [];

      groups.push({
        name: menuItem.name,
        id: menuItem.menu_id,
        type: 'group',
        icon: getIconComponent(menuItem.icon),
        children: children,
      });
    } else {
      // This is a single menu item (not in a group)
      groups.push({
        name: menuItem.name,
        id: menuItem.menu_id,
        type: 'single',
        icon: getIconComponent(menuItem.icon)
      });
    }
  });

  return groups;
}

const MenuSettingsTab: React.FC<MenuSettingsTabProps> = ({ onClose }) => {
  const {
    loading: permissionsLoading,
    roles,
    menuItems: legacyMenuItems,
    menuRolePermissions,
    updateMenuPermission,
    fetchMenuPermissions,
  } = usePermissions();

  // Use new hook for database menu items
  const {
    loading: menuItemsLoading,
    error: menuItemsError,
    menuItems: dbMenuItems = [],
    flatMenuItems: dbFlatMenuItems = [],
    statistics = {
      total_items: 0,
      group_items: 0,
      regular_items: 0,
      total_permissions: 0
    }
  } = useMenuItems();

  const [localSettings, setLocalSettings] = useState<{[key: string]: MenuRolePermission}>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['qr-management', 'url-management', 'administrator']);

  // Initialize local settings when data loads
  useEffect(() => {
    if (menuRolePermissions.length > 0 && dbFlatMenuItems.length > 0) {
      console.log('🔄 Initializing localSettings from menuRolePermissions:', menuRolePermissions.slice(0, 3));
      console.log('🔄 Available dbFlatMenuItems for mapping:', dbFlatMenuItems.slice(0, 5));
      
      const settings: {[key: string]: MenuRolePermission} = {};
      
      menuRolePermissions.forEach(permission => {
        const role = permission.role || permission.role_name;
        
        // Find the menu_id from dbFlatMenuItems using menu_item_id
        const menuItemObj = dbFlatMenuItems.find(item => item.id === permission.menu_item_id);
        const menuId = menuItemObj?.menu_id;
        
        if (role && menuId) {
          const key = `${role}-${menuId}`;  // Use menu_id for UI consistency
          
          // Ensure we have the legacy compatibility fields
          const enhancedPermission = {
            ...permission,
            role: role,
            menu_item: menuId,
            enabled: permission.enabled !== undefined ? permission.enabled : permission.can_view
          };
          
          settings[key] = enhancedPermission;
          console.log(`📝 Added permission: ${key}`, { 
            enabled: enhancedPermission.enabled, 
            can_view: enhancedPermission.can_view,
            menu_item_id: permission.menu_item_id,
            menu_id: menuId
          });
        } else {
          console.warn('⚠️ Invalid permission data or no menu mapping found:', {
            permission,
            role,
            menu_item_id: permission.menu_item_id,
            foundMenuItem: menuItemObj
          });
        }
      });
      
      console.log('✅ LocalSettings initialized with keys:', Object.keys(settings));
      setLocalSettings(settings);
    }
  }, [menuRolePermissions, dbFlatMenuItems]);

  // Get menu groups structure from database
  const menuGroups = getMenuGroupStructure(dbMenuItems);

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const getMenuPermissionKey = (role: string, menuItem: string) => {
    return `${role}-${menuItem}`;
  };

  const getMenuPermission = (role: string, menuItem: string): MenuRolePermission | null => {
    const key = getMenuPermissionKey(role, menuItem);
    const permission = localSettings[key] || null;
    
    // Debug logging for checkbox state
    if (permission) {
      console.log(`🔍 Permission for ${key}:`, {
        enabled: permission.enabled,
        can_view: permission.can_view,
        role: permission.role,
        role_name: permission.role_name,
        menu_item: permission.menu_item,
        menu_item_id: permission.menu_item_id
      });
    } else {
      console.log(`❌ No permission found for ${key}`);
      
      // Try to find permission by different key format
      const altKey = Object.keys(localSettings).find(k => 
        k.includes(role) && k.includes(menuItem)
      );
      if (altKey) {
        console.log(`🔍 Found alternative key: ${altKey}`, localSettings[altKey]);
      }
    }
    
    return permission;
  };

  const updateMenuAccess = async (role: string, menuItem: string, enabled: boolean) => {
    try {
      console.log('🔄 UpdateMenuAccess called:', { role, menuItem, enabled });
      console.log('🔍 Available dbFlatMenuItems:', dbFlatMenuItems?.length || 0, 'items');
      console.log('🔍 First few dbFlatMenuItems:', dbFlatMenuItems?.slice(0, 3));
      
      // Find the menu item ID from flat menu items
      const flatMenuItems = dbFlatMenuItems || [];
      console.log('🔍 Looking for menuItem:', menuItem, 'in flatMenuItems:', flatMenuItems.map(item => item.menu_id));
      
      const menuItemObj = flatMenuItems.find(item => item.menu_id === menuItem);
      
      if (!menuItemObj) {
        console.error('❌ Menu item not found:', menuItem);
        console.error('❌ Available menu_ids:', flatMenuItems.map(item => item.menu_id));
        return;
      }

      console.log('📤 Updating permission in database...', {
        role,
        menu_id: menuItem,
        database_id: menuItemObj.id,
        enabled
      });
      
      // Update database directly using the correct field names
      const result = await updateMenuPermission({
        role: role,           // Will be mapped to role_name in API
        menu_item: menuItem,  // For reference
        menu_item_id: menuItemObj.id,  // Database primary key
        enabled: enabled      // Will be mapped to can_view, etc in API
      });

      console.log('✅ Database update result:', result);

      // Update local state immediately for instant UI feedback
      // Use the SAME key format as used in useEffect initialization
      const key = `${role}-${menuItem}`;  // Use menu_id for consistency
      console.log('🔧 Updating local state for key:', key);
      
      setLocalSettings(prev => {
        const updated = { ...prev };
        if (updated[key]) {
          // Update existing permission
          updated[key] = { 
            ...updated[key], 
            can_view: enabled,
            enabled: enabled  // Update legacy field too
          };
        } else {
          // Create new permission entry if it doesn't exist
          updated[key] = {
            id: 0,
            role_name: role,
            menu_item_id: menuItemObj.id,
            can_view: enabled,
            can_create: enabled,
            can_edit: enabled,
            can_delete: enabled && role === 'admin',
            can_export: enabled,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // Legacy compatibility fields
            role: role,
            menu_item: menuItem,
            enabled: enabled
          };
        }
        console.log('🔄 Local state updated:', updated[key]);
        return updated;
      });

      console.log('🔄 Refreshing permissions data...');
      // Refresh permissions data
      await fetchMenuPermissions();
      
    } catch (error) {
      console.error('Error updating menu access:', error);
    }
  };

  const getRoleBadgeColor = (roleLevel: number) => {
    switch (roleLevel) {
      case 3: return 'bg-red-100 text-red-800 border-red-300'; // Admin
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-300'; // Editor
      case 1: return 'bg-blue-100 text-blue-800 border-blue-300'; // Viewer
      case 0: return 'bg-gray-100 text-gray-800 border-gray-300'; // User
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const updates = Object.values(localSettings).filter(setting => {
        const original = menuRolePermissions.find(p => 
          p.role === setting.role && p.menu_item === setting.menu_item
        );
        return !original || original.enabled !== setting.enabled;
      });

      for (const update of updates) {
        await updateMenuPermission({
          role: update.role,
          menu_item: update.menu_item,
          enabled: update.enabled
        });
      }

      await fetchMenuPermissions();
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving changes:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    const settings: {[key: string]: MenuRolePermission} = {};
    menuRolePermissions.forEach(permission => {
      const key = `${permission.role}-${permission.menu_item}`;
      settings[key] = permission;
    });
    setLocalSettings(settings);
    setHasChanges(false);
  };

  const loading = permissionsLoading || menuItemsLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading menu settings...</span>
      </div>
    );
  }

  if (menuItemsError) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Menu Items</h3>
              <p className="mt-1 text-sm text-red-700">{menuItemsError}</p>
              <p className="mt-2 text-sm text-red-600">Falling back to legacy menu structure...</p>
            </div>
          </div>
        </div>
        
        {/* Fallback to legacy menu structure */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Using Legacy Menu Structure</h3>
              <p className="mt-1 text-sm text-yellow-700">Database connection failed. Using hardcoded menu fallback.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bars3Icon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Menu Settings</h2>
              <p className="text-sm text-slate-600">Configure menu permissions for different user roles</p>
            </div>
          </div>
          
          {/* Database Statistics */}
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <div className="bg-blue-50 px-3 py-1 rounded-lg">
              <span className="font-medium">{statistics?.total_items || 0}</span> total menus
            </div>
            <div className="bg-green-50 px-3 py-1 rounded-lg">
              <span className="font-medium">{statistics?.group_items || 0}</span> groups
            </div>
            <div className="bg-purple-50 px-3 py-1 rounded-lg">
              <span className="font-medium">{statistics?.regular_items || 0}</span> items
            </div>
          </div>
        </div>

        {hasChanges && (
          <div className="mt-4 flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center">
              <InformationCircleIcon className="h-5 w-5 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">You have unsaved changes</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={resetChanges}
                className="px-3 py-1.5 text-sm font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 transition-colors duration-200"
              >
                Reset
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-3 py-1.5 text-sm font-medium text-white bg-yellow-600 border border-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors duration-200"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {roles.map((role) => {
          // Calculate statistics based on ALL menu items, not just those with permissions
          const totalCount = dbFlatMenuItems.length; // Total should be all menu items (23)
          
          // Count enabled permissions for this role
          let enabledCount = 0;
          dbFlatMenuItems.forEach(menuItem => {
            const permission = getMenuPermission(role.name, menuItem.menu_id);
            if (permission?.enabled || permission?.can_view) {
              enabledCount++;
            }
          });
          
          const percentage = totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0;
          
          console.log(`📊 Stats for ${role.name}:`, { enabledCount, totalCount, percentage });
          
          return (
            <div key={role.name} className="bg-white rounded-lg border border-slate-200/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`px-2 py-1 rounded text-xs font-medium border ${getRoleBadgeColor(role.level)}`}>
                  {role.name}
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {enabledCount}/{totalCount}
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-slate-600 mt-1">{percentage}% access</div>
            </div>
          );
        })}
      </div>

      {/* Menu Permissions Matrix */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/50">
          <h3 className="text-lg font-medium text-slate-900">Menu Permissions Matrix</h3>
          <p className="text-sm text-slate-600 mt-1">Configure which roles can access each menu item</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Menu Item
                </th>
                {roles.map((role) => (
                  <th key={role.name} className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                    <div className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getRoleBadgeColor(role.level)}`}>
                      {role.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {menuGroups.map((group) => (
                <Fragment key={group.id}>
                  {/* Group Header */}
                  <tr className="bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleGroup(group.id)}
                          className="flex items-center space-x-2 text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors duration-200"
                        >
                          {expandedGroups.includes(group.id) ? (
                            <ChevronDownIcon className="h-4 w-4" />
                          ) : (
                            <ChevronRightIcon className="h-4 w-4" />
                          )}
                          <group.icon className={`h-5 w-5 ${getMenuIconClass(group.id)}`} />
                          <span>{group.name}</span>
                          {group.type === 'group' && group.children && (
                            <span className="text-xs text-slate-500">({group.children.length} items)</span>
                          )}
                        </button>
                      </div>
                    </td>
                    {roles.map((role) => {
                      const permission = getMenuPermission(role.name, group.id);
                      const isEnabled = permission?.enabled || false;
                      
                      // Debug checkbox state
                      console.log(`🔲 Checkbox render for ${role.name}-${group.id}:`, {
                        permission: permission,
                        isEnabled: isEnabled,
                        enabled: permission?.enabled
                      });
                      
                      return (
                        <td key={role.name} className="px-6 py-4 text-center">
                          <button
                            onClick={() => updateMenuAccess(role.name, group.id, !isEnabled)}
                            className={`inline-flex items-center p-1 rounded-full transition-colors duration-200 ${
                              isEnabled 
                                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            {isEnabled ? (
                              <CheckCircleIcon className="h-5 w-5" />
                            ) : (
                              <XCircleIcon className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Group Children */}
                  {group.type === 'group' && group.children && expandedGroups.includes(group.id) && (
                    group.children.map((child: { name: string; id: string; icon: React.ComponentType<any> }) => (
                      <tr key={child.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 pl-12">
                          <div className="flex items-center space-x-2">
                            <child.icon className={`h-4 w-4 ${getMenuIconClass(child.id)}`} />
                            <span className="text-sm text-slate-700">{child.name}</span>
                          </div>
                        </td>
                        {roles.map((role) => {
                          const permission = getMenuPermission(role.name, child.id);
                          const isEnabled = permission?.enabled || false;
                          
                          // Debug checkbox state for children
                          console.log(`🔲 Child checkbox render for ${role.name}-${child.id}:`, {
                            permission: permission,
                            isEnabled: isEnabled,
                            enabled: permission?.enabled
                          });
                          
                          return (
                            <td key={role.name} className="px-6 py-3 text-center">
                              <button
                                onClick={() => updateMenuAccess(role.name, child.id, !isEnabled)}
                                className={`inline-flex items-center p-1 rounded-full transition-colors duration-200 ${
                                  isEnabled 
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                }`}
                              >
                                {isEnabled ? (
                                  <CheckCircleIcon className="h-4 w-4" />
                                ) : (
                                  <XCircleIcon className="h-4 w-4" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Bulk Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <div key={role.name} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`px-2 py-1 rounded text-xs font-medium border ${getRoleBadgeColor(role.level)}`}>
                  {role.name}
                </div>
                <span className="text-sm text-slate-600">
                  {Object.values(localSettings).filter(p => p.role === role.name && p.enabled).length} enabled
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    Object.keys(localSettings).forEach(key => {
                      const setting = localSettings[key];
                      if (setting.role === role.name && setting.role && setting.menu_item) {
                        updateMenuAccess(setting.role, setting.menu_item, true);
                      } else if (setting.role_name === role.name && setting.role_name && setting.menu_item_id) {
                        updateMenuAccess(setting.role_name, setting.menu_item_id.toString(), true);
                      }
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded hover:bg-green-200 transition-colors duration-200"
                >
                  Enable All
                </button>
                <button
                  onClick={() => {
                    Object.keys(localSettings).forEach(key => {
                      const setting = localSettings[key];
                      if (setting.role === role.name && setting.role && setting.menu_item) {
                        updateMenuAccess(setting.role, setting.menu_item, false);
                      } else if (setting.role_name === role.name && setting.role_name && setting.menu_item_id) {
                        updateMenuAccess(setting.role_name, setting.menu_item_id.toString(), false);
                      }
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded hover:bg-red-200 transition-colors duration-200"
                >
                  Disable All
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MenuSettingsTab;