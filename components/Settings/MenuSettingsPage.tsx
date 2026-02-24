"use client";

import React, { useState, useCallback } from 'react';

import {
  CogIcon,
  ShieldCheckIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  HomeIcon,
  ChartPieIcon,
  UserIcon,
  QrCodeIcon,
  LinkIcon,
  DocumentTextIcon,
  DocumentChartBarIcon,
  BellIcon,
  PlusIcon,
  ChartBarIcon,
  PresentationChartLineIcon,
  TagIcon,
  ArrowPathIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';
import getMenuIconClass from '@/lib/iconColors';

// Mock auth hook - replace with actual implementation
const useAuth = () => ({
  user: { id: 'admin-1', role: 'admin' },
  isAdmin: true
});

// Types for menu permissions
interface MenuPermissionData {
  id: number;
  menuId: string;
  menuName: string;
  menuDescription: string;
  menuPath: string;
  menuIcon: string;
  parentMenuId?: string;
  menuOrder: number;
  isActive: boolean;
  isDefault: boolean;
  rolePermissions: {
    admin: { hasAccess: boolean; canView: boolean; canEdit: boolean; canCreate: boolean; canDelete: boolean; isRestricted: boolean };
    editor: { hasAccess: boolean; canView: boolean; canEdit: boolean; canCreate: boolean; canDelete: boolean; isRestricted: boolean };
    viewer: { hasAccess: boolean; canView: boolean; canEdit: boolean; canCreate: boolean; canDelete: boolean; isRestricted: boolean };
    user: { hasAccess: boolean; canView: boolean; canEdit: boolean; canCreate: boolean; canDelete: boolean; isRestricted: boolean };
  };
}

// Custom hook for menu permissions
const useMenuPermissions = () => {
  const [menuPermissions, setMenuPermissions] = useState<MenuPermissionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  // Fetch menu permissions
  const fetchMenuPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/menu-permissions', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMenuPermissions(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch menu permissions');
      }
    } catch (_err) {
      console.error('Error fetching menu permissions:', _err);
      setError(_err instanceof Error ? _err.message : 'Failed to fetch menu permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  React.useEffect(() => {
    fetchMenuPermissions();
  }, [fetchMenuPermissions]);

  const bulkUpdatePermissions = useCallback(async (updates: unknown[]) => {
    try {
      const response = await fetch('/api/admin/menu-permissions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Refresh data after successful update
        await fetchMenuPermissions();
        return true;
      } else {
        throw new Error(data.error || 'Failed to update menu permissions');
      }
    } catch (_err) {
      console.error('Error updating menu permissions:', _err);
      throw _err;
    }
  }, [fetchMenuPermissions]);

  const seedMenuPermissions = useCallback(async () => {
    // This would typically seed default permissions
    console.warn('Seeding menu permissions...');
    return true;
  }, []);

  return {
    menuPermissions,
    loading,
    _error,
    bulkUpdatePermissions,
    seedMenuPermissions,
    refreshPermissions: fetchMenuPermissions
  };
};

export const MenuSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    menuPermissions, 
    loading, 
    _error,
    bulkUpdatePermissions,
    seedMenuPermissions
  } = useMenuPermissions();
  
  const [selectedRole, setSelectedRole] = useState<string>('user');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editedPermissions, setEditedPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize edited permissions with current data
  React.useEffect(() => {
    if (menuPermissions && menuPermissions.length > 0 && Object.keys(editedPermissions).length === 0) {
      const rolePermissions: Record<string, Record<string, boolean>> = {};
      
      // Initialize all roles
      ['admin', 'editor', 'viewer', 'user'].forEach(role => {
        rolePermissions[role] = {};
        
        menuPermissions.forEach(menu => {
          const permission = menu.rolePermissions[role as keyof typeof menu.rolePermissions];
          rolePermissions[role][menu.menuId] = permission?.hasAccess || false;
        });
      });
      
      setEditedPermissions(rolePermissions);
    }
  }, [menuPermissions, editedPermissions]);

  // Handle seeding if no data exists
  const handleSeedPermissions = async () => {
    setIsSaving(true);
    try {
      await seedMenuPermissions();
      console.warn('✅ Menu permissions seeded successfully');
    } catch (_error) {
      console.error('❌ Error seeding permissions:', _error);
    } finally {
      setIsSaving(false);
    }
  };

  const enterEditMode = () => {
    setIsEditMode(true);
    setHasChanges(false);
  };

  const hasMenuPermission = (role: string, menuId: string): boolean => {
    return editedPermissions[role]?.[menuId] || false;
  };

  const toggleMenuPermission = useCallback((role: string, menuId: string) => {
    const newPermissions = { ...editedPermissions };
    if (!newPermissions[role]) {
      newPermissions[role] = {};
    }
    
    newPermissions[role][menuId] = !newPermissions[role][menuId];
    
    setEditedPermissions(newPermissions);
    setHasChanges(true);
  }, [editedPermissions]);

  const handleSaveChanges = () => {
    setShowConfirmDialog(true);
  };

  const confirmSaveChanges = async () => {
    setIsSaving(true);
    setShowConfirmDialog(false);
    
    try {
      // Prepare updates for bulk update
      const updates: Array<{role: string, menuId: string, permissions: any}> = [];
      
      Object.keys(editedPermissions).forEach(role => {
        Object.keys(editedPermissions[role]).forEach(menuId => {
          const hasAccess = editedPermissions[role][menuId];
          updates.push({
            role,
            menuId,
            permissions: {
              hasAccess,
              canView: hasAccess,
              canEdit: hasAccess && role !== 'viewer' && role !== 'user',
              canCreate: hasAccess && role !== 'viewer' && role !== 'user',
              canDelete: hasAccess && role === 'admin',
              isRestricted: !hasAccess
            }
          });
        });
      });

      await bulkUpdatePermissions(updates);
      
      setIsEditMode(false);
      setHasChanges(false);
      console.warn('✅ Menu permissions saved successfully');
      
    } catch (_error) {
  console.error('❌ Error saving permissions:', _error);
      alert('Failed to save permissions. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = useCallback(() => {
    // Reset to original permissions
    const rolePermissions: Record<string, Record<string, boolean>> = {};
    
    ['admin', 'editor', 'viewer', 'user'].forEach(role => {
      rolePermissions[role] = {};
      
      menuPermissions.forEach(menu => {
        const permission = menu.rolePermissions[role as keyof typeof menu.rolePermissions];
        rolePermissions[role][menu.menuId] = permission?.hasAccess || false;
      });
    });
    
    setEditedPermissions(rolePermissions);
    setIsEditMode(false);
    setHasChanges(false);
  }, [menuPermissions]);

  // map icon-name string to an actual heroicon component
  const iconComponentMap: Record<string, any> = {
    HomeIcon,
    ChartPieIcon,
    UserIcon,
    QrCodeIcon,
    LinkIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    DocumentChartBarIcon,
    BellIcon,
    CogIcon,
    PlusIcon,
    ChartBarIcon,
    PresentationChartLineIcon,
    TagIcon,
    ArrowPathIcon,
    ListBulletIcon
  };

  const getMenuIcon = (menuId: string, menuIcon: string) => {
    const Icon = iconComponentMap[menuIcon];
    if (!Icon) return <span className="text-xl">📄</span>;
    return <Icon className={`h-5 w-5 ${getMenuIconClass(menuId)}`} />;
  };

  // Group menus by parent
  const groupedMenus = React.useMemo(() => {
    const groups: Record<string, any[]> = { root: [] };
    
    menuPermissions.forEach(menu => {
      if (menu.parentMenuId) {
        if (!groups[menu.parentMenuId]) {
          groups[menu.parentMenuId] = [];
        }
        groups[menu.parentMenuId].push(menu);
      } else {
        groups.root.push(menu);
      }
    });
    
    // Sort by menuOrder
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => a.menuOrder - b.menuOrder);
    });
    
    return groups;
  }, [menuPermissions]);

  const roles = [
    { value: 'admin', label: 'Administrator', icon: ShieldCheckIcon, color: 'text-red-600', bgColor: 'bg-red-50' },
    { value: 'editor', label: 'Editor', icon: PencilIcon, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { value: 'viewer', label: 'Viewer', icon: EyeIcon, color: 'text-green-600', bgColor: 'bg-green-50' },
    { value: 'user', label: 'User', icon: CogIcon, color: 'text-purple-600', bgColor: 'bg-purple-50' }
  ];

  // Conditional rendering - after all hooks
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <XCircleIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Menu Permissions</h3>
          <p className="text-gray-600">Please wait while we load the menu configuration...</p>
        </div>
      </div>
    );
  }

  // Show error state with seeding option
  if (_error || !menuPermissions || menuPermissions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Menu Permissions Not Found</h3>
          <p className="text-gray-600 mb-6">
            {_error ? `Error: ${_error}` : 'No menu permissions found in database.'}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Would you like to initialize the menu permissions with default settings?
          </p>
          <button
            onClick={handleSeedPermissions}
            disabled={isSaving}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Initializing...' : 'Initialize Menu Permissions'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-medium text-gray-900">Menu Settings & Permissions</h2>
                <p className="text-sm text-gray-500">Configure menu access for different user roles</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {!isEditMode ? (
                <button
                  onClick={enterEditMode}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit Permissions
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={cancelEdit}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || isSaving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Mode Warning */}
        {isEditMode && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Edit Mode Active:</strong> You can now modify menu permissions for all roles. 
                  {hasChanges && ' You have unsaved changes.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Role Selector */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {roles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.value;
              return (
                <button
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    isSelected
                      ? `border-blue-500 ${role.bgColor} ring-2 ring-blue-200`
                      : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <Icon className={`h-6 w-6 ${isSelected ? role.color : 'text-gray-400'}`} />
                  </div>
                  <div className="text-center">
                    <p className={`font-medium ${isSelected ? role.color : 'text-gray-700'}`}>
                      {role.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Object.keys(editedPermissions[role.value] || {}).filter(menuId => 
                        editedPermissions[role.value][menuId]
                      ).length} menus
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Menu Permissions Grid */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Menu Access for {roles.find(r => r.value === selectedRole)?.label}
          </h3>
          <p className="text-sm text-gray-500">
            {isEditMode ? 'Click the toggles to modify access permissions' : 'View current menu access permissions'}
          </p>
        </div>
        
        <div className="p-6">
          <div className="space-y-6">
            {groupedMenus.root.map((menu) => (
              <div key={menu.menuId} className="space-y-3">
                {/* Main Menu Item */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{getMenuIcon(menu.menuId, menu.menuIcon)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{menu.menuName}</h4>
                      <p className="text-sm text-gray-500">{menu.menuDescription}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">{menu.menuPath}</span>
                    
                    {isEditMode ? (
                      <button
                        onClick={() => toggleMenuPermission(selectedRole, menu.menuId)}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          hasMenuPermission(selectedRole, menu.menuId)
                            ? 'bg-blue-600'
                            : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            hasMenuPermission(selectedRole, menu.menuId) ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        hasMenuPermission(selectedRole, menu.menuId)
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {hasMenuPermission(selectedRole, menu.menuId) ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Allowed
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Denied
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub Menu Items */}
                {groupedMenus[menu.menuId] && groupedMenus[menu.menuId].length > 0 && (
                  <div className="ml-8 space-y-2">
                    {groupedMenus[menu.menuId].map((subMenu) => (
                      <div key={subMenu.menuId} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{getMenuIcon(subMenu.menuId, subMenu.menuIcon)}</span>
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">{subMenu.menuName}</h5>
                            <p className="text-xs text-gray-500">{subMenu.menuDescription}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <span className="text-xs text-gray-500">{subMenu.menuPath}</span>
                          
                          {isEditMode ? (
                            <button
                              onClick={() => toggleMenuPermission(selectedRole, subMenu.menuId)}
                              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                hasMenuPermission(selectedRole, subMenu.menuId)
                                  ? 'bg-blue-600'
                                  : 'bg-gray-200'
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  hasMenuPermission(selectedRole, subMenu.menuId) ? 'translate-x-4' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              hasMenuPermission(selectedRole, subMenu.menuId)
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {hasMenuPermission(selectedRole, subMenu.menuId) ? (
                                <>
                                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                                  ✓
                                </>
                              ) : (
                                <>
                                  <XCircleIcon className="h-3 w-3 mr-1" />
                                  ✗
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Confirm Changes</h3>
              <div className="mt-4 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to save these menu permission changes? This will affect user access across the application.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex justify-center space-x-3">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSaveChanges}
                    className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
