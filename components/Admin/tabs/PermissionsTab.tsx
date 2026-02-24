'use client';

import React, { useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';

// Types
interface RolePermission {
  id: number;
  role: string;
  resource_type: string;
  permission_type: string;
  scope: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

interface ResourceType {
  id: number;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

interface RoleDefinition {
  name: string;
  display_name: string;
  description: string;
  permissions: string[];
}

interface PermissionsTabProps {
  roles: Record<string, RoleDefinition>;
  rolePermissions: RolePermission[];
  resourceTypes: ResourceType[];
  fetchRolePermissions: () => Promise<void>;
  fetchResourceTypes: () => Promise<void>;
}

const PermissionsTab: React.FC<PermissionsTabProps> = ({
  roles = {},
  rolePermissions = [], 
  resourceTypes = [],
  fetchRolePermissions,
  fetchResourceTypes
}) => {
  const { toast } = useToast();
  
  // Modal states
  const [selectedPermission, setSelectedPermission] = useState<RolePermission | null>(null);
  const [selectedResource, setSelectedResource] = useState<ResourceType | null>(null);
  const [isCreatePermissionModalOpen, setIsCreatePermissionModalOpen] = useState(false);
  const [isEditPermissionModalOpen, setIsEditPermissionModalOpen] = useState(false);
  const [isCreateResourceModalOpen, setIsCreateResourceModalOpen] = useState(false);
  const [isEditResourceModalOpen, setIsEditResourceModalOpen] = useState(false);

  // Permission Management Functions
  const handleDeletePermission = async (permissionId: number) => {
    if (!confirm('Are you sure you want to delete this permission?')) return;
    
    try {
      const response = await fetch(`/api/admin/role-permissions/${permissionId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Permission deleted successfully",
          variant: "default",
        });
        await fetchRolePermissions(); // Refresh data
      } else {
        throw new Error('Failed to delete permission');
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete permission",
        variant: "destructive",
      });
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm('Are you sure you want to delete this resource type?')) return;
    
    try {
      const response = await fetch(`/api/admin/resource-types/${resourceId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Resource type deleted successfully",
          variant: "default",
        });
        await fetchResourceTypes(); // Refresh data
      } else {
        throw new Error('Failed to delete resource type');
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete resource type",
        variant: "destructive",
      });
    }
  };

  const handleEditPermission = (permission: RolePermission) => {
    setSelectedPermission(permission);
    setIsEditPermissionModalOpen(true);
  };

  const handleEditResource = (resource: ResourceType) => {
    setSelectedResource(resource);
    setIsEditResourceModalOpen(true);
  };

  const handleSavePermission = async (data: Omit<RolePermission, 'id'>) => {
    try {
      const url = selectedPermission 
        ? `/api/admin/role-permissions/${selectedPermission.id}` 
        : '/api/admin/role-permissions';
      const method = selectedPermission ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setIsCreatePermissionModalOpen(false);
        setIsEditPermissionModalOpen(false);
        setSelectedPermission(null);
        await fetchRolePermissions();
        toast({
          title: "Success",
          description: `Permission ${selectedPermission ? 'updated' : 'created'} successfully`,
          variant: "default",
        });
      } else {
        throw new Error('Failed to save permission');
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to save permission",
        variant: "destructive",
      });
    }
  };

  const handleSaveResource = async (data: Omit<ResourceType, 'id'>) => {
    try {
      const url = selectedResource 
        ? `/api/admin/resource-types/${selectedResource.id}` 
        : '/api/admin/resource-types';
      const method = selectedResource ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        setIsCreateResourceModalOpen(false);
        setIsEditResourceModalOpen(false);
        setSelectedResource(null);
        await fetchResourceTypes();
        toast({
          title: "Success",
          description: `Resource type ${selectedResource ? 'updated' : 'created'} successfully`,
          variant: "default",
        });
      } else {
        throw new Error('Failed to save resource type');
      }
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to save resource type",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Permissions & Roles Management
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Manage user permissions and role assignments
              </p>
            </div>
            <button
              onClick={() => setIsCreatePermissionModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Permission
            </button>
          </div>

          {/* Role Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h4 className="text-gray-900 dark:text-white font-medium text-sm mb-2">Total Roles</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{roles ? Object.keys(roles).length : 0}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h4 className="text-gray-900 dark:text-white font-medium text-sm mb-2">Active Permissions</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{Array.isArray(rolePermissions) ? rolePermissions.length : 0}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h4 className="text-gray-900 dark:text-white font-medium text-sm mb-2">Resource Types</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{Array.isArray(resourceTypes) ? resourceTypes.length : 0}</p>
            </div>
          </div>

          {/* Permissions Table */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Role Permissions</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left p-4 text-gray-600 dark:text-gray-300 font-medium">Role</th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-300 font-medium">Resource</th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-300 font-medium">Permission</th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-300 font-medium">Scope</th>
                    <th className="text-left p-4 text-gray-600 dark:text-gray-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(rolePermissions) && rolePermissions.length > 0 ? (
                    rolePermissions.map((permission: RolePermission) => (
                      <tr key={permission.id} className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            permission.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            permission.role === 'manager' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}>
                            {permission.role}
                          </span>
                        </td>
                        <td className="p-4 text-gray-900 dark:text-gray-100">{permission.resource_type}</td>
                        <td className="p-4 text-gray-900 dark:text-gray-100">{permission.permission_type}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          permission.scope === 'all' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          permission.scope === 'group' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {permission.scope}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPermission(permission)}
                            className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="Edit Permission"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePermission(permission.id)}
                            className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                            title="Delete Permission"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                        {Array.isArray(rolePermissions) 
                          ? "No permissions found" 
                          : "Loading permissions..."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resource Types Management */}
          <div className="bg-white/5 rounded-lg border border-white/10">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h4 className="text-lg font-semibold text-white">Resource Types</h4>
              <button
                onClick={() => setIsCreateResourceModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
              >
                <PlusIcon className="h-3 w-3" />
                Add Resource
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.isArray(resourceTypes) && resourceTypes.length > 0 ? (
                  resourceTypes.map((resource: ResourceType) => (
                    <div key={resource.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="text-white font-medium">{resource.name}</h5>
                          <p className="text-white/60 text-sm mt-1">{resource.description}</p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => handleEditResource(resource)}
                            className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                            title="Edit Resource"
                          >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource.id)}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          title="Delete Resource"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                    {Array.isArray(resourceTypes) 
                      ? "No resource types found" 
                      : "Loading resource types..."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Modal */}
      {(isCreatePermissionModalOpen || isEditPermissionModalOpen) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => {
          setIsCreatePermissionModalOpen(false);
          setIsEditPermissionModalOpen(false);
          setSelectedPermission(null);
        }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedPermission ? 'Edit Permission' : 'Create Permission'}
              </h3>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                role: formData.get('role') as string,
                resource_type: formData.get('resource_type') as string,
                permission_type: formData.get('permission_type') as string,
                scope: formData.get('scope') as string,
                description: formData.get('description') as string,
              };
              handleSavePermission(data);
            }}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <select name="role" defaultValue={selectedPermission?.role || 'user'} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Resource Type</label>
                  <select name="resource_type" defaultValue={selectedPermission?.resource_type || ''} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                    <option value="">Select Resource</option>
                    {Array.isArray(resourceTypes) && resourceTypes.map((resource) => (
                      <option key={resource.id} value={resource.name}>{resource.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Permission Type</label>
                  <select name="permission_type" defaultValue={selectedPermission?.permission_type || 'read'} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                    <option value="create">Create</option>
                    <option value="read">Read</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Scope</label>
                  <select name="scope" defaultValue={selectedPermission?.scope || 'own'} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required>
                    <option value="all">All</option>
                    <option value="group">Group</option>
                    <option value="own">Own</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea name="description" defaultValue={selectedPermission?.description || ''} rows={3} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Describe this permission..."/>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button type="button" onClick={() => {
                  setIsCreatePermissionModalOpen(false);
                  setIsEditPermissionModalOpen(false);
                  setSelectedPermission(null);
                }} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                  {selectedPermission ? 'Update' : 'Create'} Permission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Type Modal */}
      {(isCreateResourceModalOpen || isEditResourceModalOpen) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => {
          setIsCreateResourceModalOpen(false);
          setIsEditResourceModalOpen(false);
          setSelectedResource(null);
        }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {selectedResource ? 'Edit Resource Type' : 'Create Resource Type'}
              </h3>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
              };
              handleSaveResource(data);
            }}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input type="text" name="name" defaultValue={selectedResource?.name || ''} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g., users, qr_codes, etc." required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea name="description" defaultValue={selectedResource?.description || ''} rows={3} className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Describe what this resource type manages..." required />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button type="button" onClick={() => {
                  setIsCreateResourceModalOpen(false);
                  setIsEditResourceModalOpen(false);
                  setSelectedResource(null);
                }} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-500">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                  {selectedResource ? 'Update' : 'Create'} Resource Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PermissionsTab;