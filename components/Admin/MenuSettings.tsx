"use client";

import React, { useState, useEffect, Fragment } from 'react';
import usePermissions, { 
  MenuRolePermission, 
  Role, 
  MenuItem 
} from '@/hooks/usePermissions';
import {
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
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import getMenuIconClass from '@/lib/iconColors';

interface MenuSettingsProps {
  onClose?: () => void;
}

// Define menu groups structure matching sidebar
const getMenuGroupStructure = (menuItems: MenuItem[]) => {
  // menuItems come from the database and include `menu_id` (canonical id) and `name` (display name)
  // Use menu.menu_id when checking for presence so we match canonical IDs like `generate-qr`.
  const hasMenu = (menuId: string) => menuItems.some(menu => menu.menu_id === menuId)
  
  const groups = []
  
  // Individual menus (not grouped)
  if (hasMenu('dashboard')) {
    groups.push({ name: "Dashboard", id: "dashboard", type: 'single', icon: HomeIcon })
  }
  
  if (hasMenu('profile')) {
    groups.push({ name: "Profile", id: "profile", type: 'single', icon: UserIcon })
  }
  
  // QR Management Group
  const qrChildren = []
  if (hasMenu('qr-codes')) qrChildren.push({ name: "QR Codes", id: "qr-codes", icon: QrCodeIcon })
  // DB canonical menu id is `generate-qr` (docs/menu tree uses generate-qr)
  if (hasMenu('generate-qr')) qrChildren.push({ name: "Generate QR Codes", id: "generate-qr", icon: PlusCircleIcon })
  if (hasMenu('qr-analytics')) qrChildren.push({ name: "QR Analytics", id: "qr-analytics", icon: ChartBarIcon })
  if (hasMenu('qr-detailed-analytics')) qrChildren.push({ name: "QR Detailed Analytics", id: "qr-detailed-analytics", icon: TableCellsIcon })
  if (hasMenu('qr-categories')) qrChildren.push({ name: "QR Categories", id: "qr-categories", icon: FolderIcon })
  if (hasMenu('qr-migration')) qrChildren.push({ name: "QR Migration", id: "qr-migration", icon: FolderIcon })
  
  if (qrChildren.length > 0) {
    groups.push({
      name: "QR Management",
      id: "qr-management",
      type: 'group',
      icon: QrCodeIcon,
      children: qrChildren,
    })
  }
  
  // URL Management Group
  const urlChildren = []
  if (hasMenu('url-list')) urlChildren.push({ name: "URL List", id: "url-list", icon: LinkIcon })
  if (hasMenu('generate-url')) urlChildren.push({ name: "Generate Short URL", id: "generate-url", icon: PlusCircleIcon })
  if (hasMenu('url-analytics')) urlChildren.push({ name: "URL Analytics", id: "url-analytics", icon: ChartBarIcon })
  if (hasMenu('url-detailed-analytics')) urlChildren.push({ name: "URL Detailed Analytics", id: "url-detailed-analytics", icon: TableCellsIcon })
  if (hasMenu('url-categories')) urlChildren.push({ name: "URL Categories", id: "url-categories", icon: FolderIcon })
  
  if (urlChildren.length > 0) {
    groups.push({
      name: "URL Management",
      id: "url-management", 
      type: 'group',
      icon: LinkIcon,
      children: urlChildren,
    })
  }
  
  // Reports
  if (hasMenu('reports')) {
    groups.push({ name: "Reports", id: "reports", type: 'single', icon: DocumentChartBarIcon })
  }
  
  // Notifications
  if (hasMenu('notifications')) {
    groups.push({ name: "Notifications", id: "notifications", type: 'single', icon: BellIcon })
  }
  
  // Administrator Group
  const adminChildren = []
  if (hasMenu('admin-panel')) adminChildren.push({ name: "Admin Panel", id: "admin-panel", icon: ShieldCheckIcon })
  if (hasMenu('users')) adminChildren.push({ name: "Users", id: "users", icon: UserIcon })
  if (hasMenu('groups')) adminChildren.push({ name: "Groups", id: "groups", icon: UserGroupIcon })
  if (hasMenu('user-activity')) adminChildren.push({ name: "User Activity", id: "user-activity", icon: DocumentChartBarIcon })
  if (hasMenu('settings')) adminChildren.push({ name: "Settings", id: "settings", icon: CogIcon })
  
  if (adminChildren.length > 0) {
    groups.push({
      name: "Administrator",
      id: "administrator",
      type: 'group',
      icon: ShieldCheckIcon,
      children: adminChildren,
    })
  }
  
  return groups
}

const MenuSettings: React.FC<MenuSettingsProps> = ({ onClose }) => {
  const {
    loading,
    roles,
    menuItems,
    menuRolePermissions,
    updateMenuPermission,
    fetchMenuPermissions,
  } = usePermissions();

  const [localSettings, setLocalSettings] = useState<{[key: string]: MenuRolePermission}>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['qr-management', 'url-management', 'administrator']);

  // Initialize local settings when data loads
  useEffect(() => {
    if (menuRolePermissions.length > 0) {
      const settings: {[key: string]: MenuRolePermission} = {};
      menuRolePermissions.forEach(permission => {
        const key = `${permission.role}-${permission.menu_item}`;
        settings[key] = permission;
      });
      setLocalSettings(settings);
    }
  }, [menuRolePermissions]);

  // Get menu groups structure
  const menuGroups = getMenuGroupStructure(menuItems);

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
    return localSettings[key] || null;
  };

  const updateMenuAccess = (role: string, menuItem: string, enabled: boolean) => {
    const key = getMenuPermissionKey(role, menuItem);
    const existing = localSettings[key];
    
    if (existing) {
      const updated = { ...existing, enabled };
      setLocalSettings(prev => ({ ...prev, [key]: updated }));
      setHasChanges(true);
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
      const updatePromises = Object.values(localSettings).map(permission => {
        return updateMenuPermission({
          id: permission.id,
          role: permission.role,
          menu_item: permission.menu_item,
          enabled: permission.enabled,
        });
      });

      await Promise.all(updatePromises);
      setHasChanges(false);
    } catch (_error) {
      console.error('Error saving changes:', _error);
    } finally {
      setSaving(false);
    }
  };

  const resetChanges = () => {
    fetchMenuPermissions();
    setHasChanges(false);
  };

  const toggleAll = (role: string, enabled: boolean) => {
    menuItems.forEach(menuItem => {
      updateMenuAccess(role, menuItem.name, enabled);
    });
  };

  // Calculate statistics per role
  const getRoleStatistics = (roleName: string) => {
    const rolePermissions = menuRolePermissions.filter(p => p.role === roleName);
    const activeCount = rolePermissions.filter(p => p.enabled).length;
    const inactiveCount = rolePermissions.filter(p => !p.enabled).length;
    return { activeCount, inactiveCount, totalCount: rolePermissions.length };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading menu settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bars3Icon className="w-6 h-6 text-gray-500" />
          <h2 className="text-lg font-medium text-gray-900">Menu Settings</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <>
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-amber-600">Unsaved changes</span>
            </>
          )}
        </div>
      </div>

      {/* Role Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => {
          const stats = getRoleStatistics(role.name);
          const percentage = stats.totalCount > 0 ? Math.round((stats.activeCount / stats.totalCount) * 100) : 0;
          
          return (
            <div key={role.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">{role.display_name}</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(role.level)}`}>
                  Level {role.level}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600 flex items-center">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Active
                  </span>
                  <span className="text-sm font-semibold text-green-600">{stats.activeCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600 flex items-center">
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    Inactive
                  </span>
                  <span className="text-sm font-semibold text-red-600">{stats.inactiveCount}</span>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="text-sm font-semibold text-gray-900">{stats.totalCount}</span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">Completion</span>
                    <span className="text-xs font-medium text-gray-700">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Quick actions */}
                <div className="flex space-x-1 mt-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => toggleAll(role.name, true)}
                    className="flex-1 px-2 py-1 text-xs text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors"
                    title={`Enable all permissions for ${role.display_name}`}
                  >
                    Enable All
                  </button>
                  <button
                    onClick={() => toggleAll(role.name, false)}
                    className="flex-1 px-2 py-1 text-xs text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors"
                    title={`Disable all permissions for ${role.display_name}`}
                  >
                    Disable All
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p>Manage menu access permissions for different user roles. Changes are applied in real-time.</p>
            <p className="mt-1">
              <span className="font-medium">Roles:</span> Admin (Level 3), Editor (Level 2), Viewer (Level 1), User (Level 0)
            </p>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Bulk Actions:</span>
          <div className="flex space-x-2">
            {roles.map((role) => (
              <div key={role.id} className="flex space-x-1">
                <button
                  onClick={() => toggleAll(role.name, true)}
                  className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded hover:bg-green-200"
                >
                  Enable All {role.display_name}
                </button>
                <button
                  onClick={() => toggleAll(role.name, false)}
                  className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded hover:bg-red-200"
                >
                  Disable All {role.display_name}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {hasChanges && (
            <>
              <button
                onClick={resetChanges}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Reset
              </button>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Menu Access Matrix */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Menu Item
                </th>
                {roles.map((role) => (
                  <th
                    key={role.id}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span>{role.display_name}</span>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(role.level)}`}>
                        Level {role.level}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
              
              {/* Toggle All Row */}
              <tr className="bg-gray-25">
                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                  <span className="text-sm text-gray-600">Toggle All</span>
                </td>
                {roles.map((role) => (
                  <td key={role.id} className="px-6 py-3 text-center">
                    <div className="flex justify-center space-x-1">
                      <button
                        onClick={() => toggleAll(role.name, true)}
                        className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded hover:bg-green-200"
                      >
                        All
                      </button>
                      <button
                        onClick={() => toggleAll(role.name, false)}
                        className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded hover:bg-red-200"
                      >
                        None
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {menuGroups.map((group) => {
                if (group.type === 'single') {
                  // Single menu item
                  // Menu items in DB are keyed by `menu_id` (canonical id). Match on menu_id, not display name.
                  const menuItem = menuItems.find(item => item.menu_id === group.id);
                  if (!menuItem) return null;
                  
                  return (
                    <tr key={group.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center space-x-3">
                          <group.icon className={`w-5 h-5 ${getMenuIconClass(group.id)}`} />
                          <div>
                            <div className="font-medium">{group.name}</div>
                            <div className="text-xs text-gray-500">{menuItem.path}</div>
                            {menuItem.description && (
                              <div className="text-xs text-gray-400 mt-1">{menuItem.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      {roles.map((role) => {
                        const permission = getMenuPermission(role.name, group.id);
                        const isEnabled = permission?.enabled ?? false;
                        
                        return (
                          <td key={role.id} className="px-6 py-4 text-center">
                            <button
                              onClick={() => updateMenuAccess(role.name, group.id, !isEnabled)}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                isEnabled 
                                  ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                              }`}
                            >
                              {isEnabled ? (
                                <>
                                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                                  Enabled
                                </>
                              ) : (
                                <>
                                  <XCircleIcon className="w-4 h-4 mr-1" />
                                  Disabled
                                </>
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                } else if (group.type === 'group') {
                  // Group header
                  const isExpanded = expandedGroups.includes(group.id);
                  return (
                    <Fragment key={group.id}>
                      {/* Group Header */}
                      <tr className="bg-blue-50 hover:bg-blue-100 cursor-pointer" onClick={() => toggleGroup(group.id)}>
                        <td className="px-6 py-3 text-sm font-semibold text-blue-900">
                          <div className="flex items-center space-x-3">
                            {isExpanded ? (
                              <ChevronDownIcon className="w-4 h-4 text-blue-600" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4 text-blue-600" />
                            )}
                            <group.icon className={`w-5 h-5 ${getMenuIconClass(group.id)}`} />
                            <span>{group.name}</span>
                            <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                              {group.children?.length || 0} items
                            </span>
                          </div>
                        </td>
                        {roles.map((role) => (
                          <td key={role.id} className="px-6 py-3 text-center">
                            <div className="flex justify-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  group.children?.forEach(child => {
                                    updateMenuAccess(role.name, child.id, true);
                                  });
                                }}
                                className="px-2 py-1 text-xs text-green-700 bg-green-100 rounded hover:bg-green-200"
                                title="Enable all items in this group"
                              >
                                All
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  group.children?.forEach(child => {
                                    updateMenuAccess(role.name, child.id, false);
                                  });
                                }}
                                className="px-2 py-1 text-xs text-red-700 bg-red-100 rounded hover:bg-red-200"
                                title="Disable all items in this group"
                              >
                                None
                              </button>
                            </div>
                          </td>
                        ))}
                      </tr>
                      
                      {/* Group Items */}
                      {isExpanded && group.children?.map((child) => {
                        // Child identifiers are canonical (menu_id). Match on menu_id here too.
                        const menuItem = menuItems.find(item => item.menu_id === child.id);
                        if (!menuItem) return null;
                        
                        return (
                          <tr key={child.id} className="hover:bg-gray-50 bg-gray-25">
                            <td className="px-6 py-4 text-sm text-gray-900">
                              <div className="flex items-center space-x-3 pl-8">
                                <child.icon className={`w-4 h-4 ${getMenuIconClass(child.id)}`} />
                                <div>
                                  <div className="font-medium">{child.name}</div>
                                  <div className="text-xs text-gray-500">{menuItem.path}</div>
                                  {menuItem.description && (
                                    <div className="text-xs text-gray-400 mt-1">{menuItem.description}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            {roles.map((role) => {
                              const permission = getMenuPermission(role.name, child.id);
                              const isEnabled = permission?.enabled ?? false;
                              
                              return (
                                <td key={role.id} className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => updateMenuAccess(role.name, child.id, !isEnabled)}
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                      isEnabled 
                                        ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200' 
                                        : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                                    }`}
                                  >
                                    {isEnabled ? (
                                      <>
                                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                                        Enabled
                                      </>
                                    ) : (
                                      <>
                                        <XCircleIcon className="w-4 h-4 mr-1" />
                                        Disabled
                                      </>
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                }
                return null;
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Statistics */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{menuItems.length}</div>
            <div className="text-sm text-gray-500">Total Menu Items</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{roles.length}</div>
            <div className="text-sm text-gray-500">User Roles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{menuRolePermissions.length}</div>
            <div className="text-sm text-gray-500">Permission Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {menuRolePermissions.filter(p => p.enabled).length}
            </div>
            <div className="text-sm text-gray-500">Active Permissions</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuSettings;
