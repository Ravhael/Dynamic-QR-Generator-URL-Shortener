"use client";

import React, { useState, useEffect } from 'react';
import usePermissions, { 
  RolePermission, 
  Role, 
  ResourceType 
} from '@/hooks/usePermissions';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  Cog8ToothIcon
} from '@heroicons/react/24/outline';

interface PermissionMatrixProps {
  onClose?: () => void;
}

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ onClose }) => {
  const {
    loading,
    roles,
    resourceTypes,
    rolePermissions,
    updateRolePermission,
    fetchRolePermissions,
  } = usePermissions();

  const [localMatrix, setLocalMatrix] = useState<{[key: string]: RolePermission}>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize local matrix when data loads
  useEffect(() => {
    if (rolePermissions.length > 0) {
      const matrix: {[key: string]: RolePermission} = {};
      rolePermissions.forEach(permission => {
        const key = `${permission.role}-${permission.resource_type}-${permission.permission_type}`;
        matrix[key] = permission;
      });
      setLocalMatrix(matrix);
    }
  }, [rolePermissions]);

  const getPermissionKey = (role: string, resourceType: string, permissionType: string) => {
    return `${role}-${resourceType}-${permissionType}`;
  };

  const getPermission = (role: string, resourceType: string, permissionType: string): RolePermission | null => {
    const key = getPermissionKey(role, resourceType, permissionType);
    return localMatrix[key] || null;
  };

  const updatePermission = (role: string, resourceType: string, permissionType: string, scope: string) => {
    const key = getPermissionKey(role, resourceType, permissionType);
    const existing = localMatrix[key];
    
    if (existing) {
      setLocalMatrix(prev => ({
        ...prev,
        [key]: { ...existing, scope: scope as any }
      }));
    } else {
      // Create new permission entry
      const newPermission: RolePermission = {
        id: 0, // Will be set by backend
        role,
        resource_type: resourceType,
        permission_type: permissionType as any,
        scope: scope as any,
        description: `${role} ${permissionType} access for ${resourceType}`,
        role_id: roles.find(r => r.name === role)?.id || 0,
        resource_type_id: resourceTypes.find(rt => rt.name === resourceType)?.id || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setLocalMatrix(prev => ({
        ...prev,
        [key]: newPermission
      }));
    }
    
    setHasChanges(true);
  };

  const getScopeColor = (scope: string) => {
    switch (scope) {
      case 'all': return 'bg-green-100 text-green-800 border-green-300';
      case 'group': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'own': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'none': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'all': return <CheckCircleIcon className="w-4 h-4" />;
      case 'group': return <EyeIcon className="w-4 h-4" />;
      case 'own': return <PencilIcon className="w-4 h-4" />;
      case 'none': return <XCircleIcon className="w-4 h-4" />;
      default: return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const getPermissionTypeIcon = (permissionType: string) => {
    switch (permissionType) {
      case 'create': return <PlusIcon className="w-4 h-4" />;
      case 'read': return <EyeIcon className="w-4 h-4" />;
      case 'update': return <PencilIcon className="w-4 h-4" />;
      case 'delete': return <TrashIcon className="w-4 h-4" />;
      case 'manage': return <Cog8ToothIcon className="w-4 h-4" />;
      default: return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const updatePromises = Object.values(localMatrix).map(permission => {
        return updateRolePermission({
          id: permission.id,
          role: permission.role,
          resource_type: permission.resource_type,
          permission_type: permission.permission_type,
          scope: permission.scope,
          description: permission.description,
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
    fetchRolePermissions();
    setHasChanges(false);
  };

  const permissionTypes = ['create', 'read', 'update', 'delete', 'manage'];
  const scopes = [
    { value: 'none', label: 'None', description: 'No access' },
    { value: 'own', label: 'Own', description: 'Own content only' },
    { value: 'group', label: 'Group', description: 'Same group only' },
    { value: 'all', label: 'All', description: 'Full access' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Loading permission matrix...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheckIcon className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">Permission Matrix</h2>
        </div>
        <div className="flex space-x-2">
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

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => {
          // Use role permissions from database, not local matrix
          const rolePermissionsList = rolePermissions.filter(p => p.role === role.name);
          const totalPermissions = rolePermissionsList.length;
          
          // Calculate completion rate based on scope levels (all=3, group=2, own=1, none=0)
          const scopeWeights = { 'all': 3, 'group': 2, 'own': 1, 'none': 0 };
          const maxPossibleScore = totalPermissions * 3; // if all permissions were 'all' scope
          const actualScore = rolePermissionsList.reduce((score, p) => score + (scopeWeights[p.scope] || 0), 0);
          const completionRate = maxPossibleScore > 0 ? Math.round((actualScore / maxPossibleScore) * 100) : 0;
          
          // Count permissions by scope
          const scopeCounts = {
            all: rolePermissionsList.filter(p => p.scope === 'all').length,
            group: rolePermissionsList.filter(p => p.scope === 'group').length,
            own: rolePermissionsList.filter(p => p.scope === 'own').length,
            none: rolePermissionsList.filter(p => p.scope === 'none').length,
          };
          
          // Get role color based on level
          const getRoleCardColor = () => {
            switch (role.level) {
              case 3: return 'border-red-300 bg-red-50'; // Administrator
              case 2: return 'border-yellow-300 bg-yellow-50'; // Editor
              case 1: return 'border-blue-300 bg-blue-50'; // Viewer
              case 0: return 'border-gray-300 bg-gray-50'; // Regular User
              default: return 'border-gray-300 bg-gray-50';
            }
          };

          const getRoleIcon = () => {
            switch (role.level) {
              case 3: return <Cog8ToothIcon className="h-6 w-6 text-red-600" />;
              case 2: return <PencilIcon className="h-6 w-6 text-yellow-600" />;
              case 1: return <EyeIcon className="h-6 w-6 text-blue-600" />;
              case 0: return <CheckCircleIcon className="h-6 w-6 text-gray-600" />;
              default: return <CheckCircleIcon className="h-6 w-6 text-gray-600" />;
            }
          };

          return (
            <div key={role.id} className={`border rounded-lg p-4 transition-all hover:shadow-md ${getRoleCardColor()}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getRoleIcon()}
                  <div>
                    <h3 className="font-semibold text-gray-900">{role.display_name}</h3>
                    <p className="text-sm text-gray-600">Level {role.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-gray-900">{completionRate}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">All: {scopeCounts.all}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Group: {scopeCounts.group}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600">Own: {scopeCounts.own}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">None: {scopeCounts.none}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Permissions</span>
                    <span className="font-medium text-gray-900">{totalPermissions}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Access Levels:</h3>
        <div className="flex flex-wrap gap-2">
          {scopes.map((scope) => (
            <div
              key={scope.value}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getScopeColor(scope.value)}`}
            >
              {getScopeIcon(scope.value)}
              <span className="ml-1">{scope.label}</span>
              <span className="ml-1 text-xs opacity-75">- {scope.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role / Resource
                </th>
                {resourceTypes.map((resourceType) => (
                  <th
                    key={resourceType.id}
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {resourceType.display_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role) => (
                <React.Fragment key={role.id}>
                  {/* Role Header */}
                  <tr className="bg-gray-25">
                    <td
                      colSpan={resourceTypes.length + 1}
                      className="px-6 py-4 text-sm font-medium text-gray-900 bg-gray-100"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{role.display_name}</span>
                        <span className="text-xs text-gray-500">({role.description})</span>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          role.level === 3 ? 'bg-red-100 text-red-800' :
                          role.level === 2 ? 'bg-yellow-100 text-yellow-800' :
                          role.level === 1 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          Level {role.level}
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Permission Rows for each permission type */}
                  {permissionTypes.map((permissionType) => (
                    <tr key={`${role.id}-${permissionType}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          {getPermissionTypeIcon(permissionType)}
                          <span className="capitalize font-medium">{permissionType}</span>
                        </div>
                      </td>
                      {resourceTypes.map((resourceType) => {
                        const permission = getPermission(role.name, resourceType.name, permissionType);
                        const currentScope = permission?.scope || 'none';
                        
                        return (
                          <td key={resourceType.id} className="px-6 py-4 text-center">
                            <select
                              value={currentScope}
                              onChange={(e) => updatePermission(role.name, resourceType.name, permissionType, e.target.value)}
                              className={`text-xs px-2 py-1 rounded-full border font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 ${getScopeColor(currentScope)}`}
                            >
                              {scopes.map((scope) => (
                                <option key={scope.value} value={scope.value}>
                                  {scope.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Permission System Guide:</p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li><strong>All:</strong> Full access to all resources regardless of ownership or group</li>
              <li><strong>Group:</strong> Access to resources within the same group only</li>
              <li><strong>Own:</strong> Access to own resources only</li>
              <li><strong>None:</strong> No access to this resource type</li>
            </ul>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-yellow-800 font-medium">
              You have unsaved changes. Click "Save Changes" to apply them.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionMatrix;
