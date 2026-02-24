'use client';

import { useState, useEffect, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout/PermissionControlledLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';
import {
  CogIcon,
  Bars3Icon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

export default function MenuSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuTree, setMenuTree] = useState<any[]>([]);
  const [menuRolePermissions, setMenuRolePermissions] = useState<any[]>([]);
  const [updating, setUpdating] = useState<Record<string, boolean>>({}); // key: role-menuItem
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [statistics, setStatistics] = useState({
    total_items: 0,
    group_items: 0,
    regular_items: 0,
    total_permissions: 0
  });

  // Redirect only if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch menu items and permissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Single fetch: menu tree + permissions
        const permissionsResponse = await fetch('/api/admin/menu-settings');
        if (permissionsResponse.status === 401) {
          router.push('/login');
          return;
        }
        if (permissionsResponse.status === 403) {
          toast({ title: 'Unauthorized', description: 'You do not have access to Menu Settings.' });
          router.push('/dashboard');
          return;
        }
        if (!permissionsResponse.ok) throw new Error('Failed to fetch permissions');
        const permissionsData = await permissionsResponse.json();
        
        if (!permissionsData.success) {
          throw new Error(permissionsData.message || 'Failed to fetch permissions');
        }
        setMenuTree(permissionsData.menu_tree || []);
        // Normalize permissions: ensure each row has an 'enabled' flag derived from can_view (or any can_*)
        const rawPerms = permissionsData.permissions || permissionsData.data || [];
        const normalized = rawPerms.map((p: any) => {
          const derivedEnabled = (
            p.is_accessible !== undefined ? p.is_accessible :
            p.enabled !== undefined ? p.enabled :
            (p.can_view || p.can_create || p.can_edit || p.can_delete || p.can_export || p.is_active)
          );
          return {
            ...p,
            enabled: derivedEnabled,
            // Mirror to keep UI consistent
            is_accessible: p.is_accessible !== undefined ? p.is_accessible : derivedEnabled,
            has_permission: p.has_permission !== undefined ? p.has_permission : derivedEnabled
          };
        });
        setMenuRolePermissions(normalized);

        // Build flat items & statistics from tree
        function flatten(nodes: any[]): any[] {
          return nodes.flatMap(n => [n, ...(n.children ? flatten(n.children) : [])]);
        }
        const flatFromTree = flatten(permissionsData.menu_tree || []);
        setStatistics({
          total_items: flatFromTree.length,
            group_items: flatFromTree.filter((n: any) => n.children && n.children.length).length,
            regular_items: flatFromTree.filter((n: any) => !n.children || !n.children.length).length,
            total_permissions: (permissionsData.permissions || []).length
        });

        // Get unique roles from permissions
        let uniqueRoles = [...new Set((permissionsData.permissions || permissionsData.data || []).map((p: any) => p.role))]
          .filter(Boolean)
          .map((roleName: string) => ({
            name: roleName,
            level: roleName.toLowerCase() === 'administrator' || roleName.toLowerCase() === 'admin' ? 3 : 1
          }));

        // Fallback if no roles detected (e.g. fresh system with no permission rows yet)
        if (!uniqueRoles.length) {
          uniqueRoles = [
            { name: 'Administrator', level: 3 },
            { name: 'Regular', level: 1 }
          ];
        }

        setRoles(uniqueRoles);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : 'An error occurred',
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router, toast]);

  // Auto-expand all groups on first load so full structure is visible
  useEffect(() => {
    if (menuTree.length) {
      // detect groups by presence of children
      const allGroupIds: string[] = [];
      const walk = (nodes: any[]) => {
        nodes.forEach(n => {
          if (n.children && n.children.length) {
            allGroupIds.push(n.id);
            walk(n.children);
          }
        });
      };
      walk(menuTree);
      setExpandedGroups(allGroupIds);
    }
  }, [menuTree]);

  // Handle permission toggle
  const handlePermissionToggle = async (role: string, menuItemId: number, enabled: boolean) => {
    try {
      const key = `${role}-${menuItemId}-all`;
      setUpdating(prev => ({ ...prev, [key]: true }));
      const response = await fetch('/api/admin/menu-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          menu_item_id: menuItemId,
          enabled,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update permission');
      }

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setMenuRolePermissions(prev => prev.map(p => {
          if (p.role === role && p.menu_item_id === menuItemId) {
            return {
              ...p,
              enabled,
              can_view: enabled,
              can_create: enabled,
              can_edit: enabled,
              can_delete: enabled,
              can_export: enabled,
              is_accessible: enabled,
              has_permission: enabled
            };
          }
          return p;
        }));

        // Broadcast global permission update event for sidebars / other listeners
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('permissions-updated'));
        }

        toast({
          title: "Success",
          description: "Permission updated successfully",
        });
      } else {
        throw new Error(data.message || 'Failed to update permission');
      }
    } catch (err) {
      console.error('Error updating permission:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update permission',
        variant: "destructive"
      });
    } finally {
      const key = `${role}-${menuItemId}-all`;
      setUpdating(prev => { const c = { ...prev }; delete c[key]; return c; });
    }
  };

  const bulkGroup = async (role: string, groupMenuId: string, enable: boolean) => {
    try {
      const key = `bulk-${role}-${groupMenuId}`;
      setUpdating(prev => ({ ...prev, [key]: true }));
      const res = await fetch('/api/admin/menu-settings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, group_menu_id: groupMenuId, enable })
      });
      if (!res.ok) throw new Error('Bulk update failed');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Bulk update failed');
      // Refetch minimal: just call main endpoint again to sync state
      const refreshed = await fetch('/api/admin/menu-settings');
      if (refreshed.ok) {
        const j = await refreshed.json();
        if (j.success) setMenuRolePermissions(j.permissions || []);
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('permissions-updated'));
      }
      toast({ title: 'Bulk updated', description: `${data.affected} items ${enable ? 'enabled' : 'disabled'}` });
    } catch (e:any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      const key = `bulk-${role}-${groupMenuId}`;
      setUpdating(prev => { const c = { ...prev }; delete c[key]; return c; });
    }
  };

  // Save all current permissions (bulk persist)
  const [isSaving, setIsSaving] = useState(false);
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      const res = await fetch('/api/admin/menu-settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: menuRolePermissions })
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `Failed to save settings (${res.status})`);
      }
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast({ title: 'Saved', description: 'Menu settings saved successfully.' });
      } else {
        throw new Error(data.message || 'Failed to save settings');
      }
    } catch (e: any) {
      console.error('Save settings error:', e);
      toast({ title: 'Error', description: e?.message || 'Failed to save settings', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  if (loading) {
    return (
      <Layout usePermissionAwareSidebar={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading menu settings...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout usePermissionAwareSidebar={true}>
        <ErrorBoundary>
          <div className="p-6">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error Loading Menu Settings
                  </h3>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          </div>
        </ErrorBoundary>
      </Layout>
    );
  }

  // Group menu items into a hierarchical structure
  // Transform menuTree into rows (top-level groups & singles)
  const menuGroups = (menuTree || []).map((node: any) => ({
    ...node,
    type: node.children && node.children.length ? 'group' : 'single'
  }));

  return (
    <Layout usePermissionAwareSidebar={true}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
            <CogIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Menu Settings
          </h1>
        </div>

        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {roles.map((role) => {
              const enabledCount = menuRolePermissions.filter(
                p => p.role === role.name && (p.enabled || p.can_view || p.is_active)
              ).length;
              
              const total = statistics.total_items;
              const percentage = total > 0 ? Math.round((enabledCount / total) * 100) : 0;
              
              const getBadgeColor = (level: number) => {
                switch (level) {
                  case 3: return 'bg-red-100 text-red-800 border-red-300';
                  case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
                  case 1: return 'bg-blue-100 text-blue-800 border-blue-300';
                  default: return 'bg-gray-100 text-gray-800 border-gray-300';
                }
              };

              return (
                <div key={role.name} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium border ${getBadgeColor(role.level)}`}>
                      {role.name}
                    </div>
                    <div className="text-lg font-semibold">
                      {enabledCount}/{total}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {percentage}% enabled
                  </div>
                </div>
              );
            })}
          </div>

          {/* Menu Permission Matrix */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-medium">Menu Permissions</h2>
              <div className="flex gap-2">
                <button
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                  onClick={() => {
                    // expand all groups
                    const allIds: string[] = [];
                    const walk = (nodes: any[]) => nodes.forEach(n => { if (n.children?.length) { allIds.push(n.id); walk(n.children); } });
                    walk(menuTree);
                    setExpandedGroups(allIds);
                  }}
                  className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >Expand All</button>
                <button
                  onClick={() => setExpandedGroups([])}
                  className="text-xs px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >Collapse All</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menu Item</th>
                    {roles.map(role => (
                      <th key={role.name} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{role.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {menuGroups.map((node: any) => {
                    if (node.type === 'single') {
                      return (
                        <tr key={node.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{node.name}</span>
                          </td>
                          {roles.map(role => {
                            const permission = menuRolePermissions.find(p => p.role === role.name && p.menu_item_id === node.internalId) || {} as any;
                            const enabled = permission.enabled || permission.can_view;
                            const key = `${role.name}-${node.internalId}`;
                            return (
                              <td key={role.name} className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handlePermissionToggle(role.name, node.internalId, !enabled)}
                                  disabled={updating[key]}
                                  className={`p-1 rounded-full transition-colors ${enabled ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'} disabled:opacity-50`}
                                >
                                  {updating[key] ? (
                                    <span className="inline-block h-5 w-5 animate-spin border-2 border-gray-400 border-t-transparent rounded-full" />
                                  ) : enabled ? (
                                    <CheckCircleIcon className="h-5 w-5" />
                                  ) : (
                                    <XCircleIcon className="h-5 w-5" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    }

                    // group row
                    return (
                      <Fragment key={node.id}>
                        <tr className="bg-gray-50 dark:bg-gray-900">
                          <td className="px-6 py-4">
                            <button onClick={() => toggleGroup(node.menu_id)} className="flex items-center space-x-2">
                              {expandedGroups.includes(node.menu_id) ? <ChevronDownIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
                              <span className="font-medium">{node.name}</span>
                            </button>
                          </td>
                          {roles.map(role => {
                            const permission = menuRolePermissions.find(p => p.role === role.name && p.menu_item_id === node.internalId) || {} as any;
                            const enabled = permission.enabled || permission.can_view;
                            const key = `${role.name}-${node.internalId}`;
                            return (
                              <td key={role.name} className="px-6 py-4 text-center">
                                <button
                                  onClick={() => handlePermissionToggle(role.name, node.internalId, !enabled)}
                                  disabled={updating[key]}
                                  className={`p-1 rounded-full transition-colors ${enabled ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'} disabled:opacity-50`}
                                >
                                  {updating[key] ? (
                                    <span className="inline-block h-5 w-5 animate-spin border-2 border-gray-400 border-t-transparent rounded-full" />
                                  ) : enabled ? (
                                    <CheckCircleIcon className="h-5 w-5" />
                                  ) : (
                                    <XCircleIcon className="h-5 w-5" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                        {/* Bulk controls retained */}
                        <tr className="bg-gray-100/60 dark:bg-gray-800/40">
                          <td className="px-6 py-2 pl-12 text-xs text-gray-500">Bulk actions:</td>
                          {roles.map(role => (
                            <td key={role.name} className="px-2 py-2 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => bulkGroup(role.name, node.id, true)}
                                  disabled={updating[`bulk-${role.name}-${node.id}`]}
                                  className="text-[10px] px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                >{updating[`bulk-${role.name}-${node.id}`] ? '...' : 'Enable'}</button>
                                <button
                                  onClick={() => bulkGroup(role.name, node.id, false)}
                                  disabled={updating[`bulk-${role.name}-${node.id}`]}
                                  className="text-[10px] px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                >{updating[`bulk-${role.name}-${node.id}`] ? '...' : 'Disable'}</button>
                              </div>
                            </td>
                          ))}
                        </tr>
                        {expandedGroups.includes(node.menu_id) && node.children?.map((child: any) => (
                          <tr key={child.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-6 py-4 pl-12">
                              <span className="text-sm text-gray-600">{child.name}</span>
                            </td>
                            {roles.map(role => {
                              const permission = menuRolePermissions.find(p => p.role === role.name && p.menu_item_id === child.internalId) || {} as any;
                              const enabled = permission.enabled || permission.can_view;
                              const key = `${role.name}-${child.internalId}`;
                              return (
                                <td key={role.name} className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => handlePermissionToggle(role.name, child.internalId, !enabled)}
                                    disabled={updating[key]}
                                    className={`p-1 rounded-full transition-colors ${enabled ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'} disabled:opacity-50`}
                                  >
                                    {updating[key] ? (
                                      <span className="inline-block h-5 w-5 animate-spin border-2 border-gray-400 border-t-transparent rounded-full" />
                                    ) : enabled ? (
                                      <CheckCircleIcon className="h-4 w-4" />
                                    ) : (
                                      <XCircleIcon className="h-4 w-4" />
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}