'use client';

import React from 'react';
import Link from 'next/link';
import { 
  UserIcon, 
  ShieldCheckIcon, 
  PencilIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  Cog8ToothIcon
} from '@heroicons/react/24/outline';

// Types
interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: {
      admin: number;
      editor: number;
      viewer: number;
    };
  };
  groups: {
    total: number;
  };
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
}

interface Group {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  createdAt: string;
}

interface OverviewTabProps {
  stats: AdminStats;
  users: User[];
  groups: Group[];
  loading: boolean;
  setIsCreateUserModalOpen: (open: boolean) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  stats, 
  loading, 
  setIsCreateUserModalOpen 
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-900 dark:text-gray-100 font-medium">Loading overview...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard Overview
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Quick overview of your system statistics and recent activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.users.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 text-sm">
            <span className="text-green-600 dark:text-green-400 font-semibold">{stats.users.active} active</span>
            <span className="text-gray-500 mx-2">•</span>
            <span className="text-red-600 dark:text-red-400 font-semibold">{stats.users.inactive} inactive</span>
          </div>
        </div>

        {/* Admin Users */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Administrators</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.users.byRole.admin}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            High-privilege accounts
          </div>
        </div>

        {/* Editor Users */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Editors</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.users.byRole.editor}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <PencilIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Content managers
          </div>
        </div>

        {/* Department Groups */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Department Groups</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.groups.total}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Organizational units
          </div>
        </div>
      </div>

      {/* Role Distribution Chart */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Role Distribution
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Overview of user roles across the system</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {[
              { role: 'Admin', count: stats.users.byRole.admin, color: 'bg-red-500', icon: '👑' },
              { role: 'Editor', count: stats.users.byRole.editor, color: 'bg-blue-500', icon: '✏️' },
              { role: 'Viewer', count: stats.users.byRole.viewer, color: 'bg-green-500', icon: '👁️' },
              { role: 'User', count: stats.users.total - stats.users.byRole.admin - stats.users.byRole.editor - stats.users.byRole.viewer, color: 'bg-purple-500', icon: '👤' }
            ].filter(item => item.count > 0).map((item) => {
              const percentage = stats.users.total > 0 ? (item.count / stats.users.total) * 100 : 0;
              return (
                <div key={item.role} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.role}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {item.count} users ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 ${item.color} rounded-full`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{item.count}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Quick Actions</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Manage your system with these quick access tools</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <button 
              onClick={() => setIsCreateUserModalOpen(true)}
              className="flex flex-col items-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <UserIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-center">
                <div className="text-gray-900 dark:text-white font-medium text-sm">User Management</div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">Manage user accounts</div>
              </div>
            </button>

            <Link 
              href="/permissions-roles"
              className="flex flex-col items-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <div className="text-gray-900 dark:text-white font-medium text-sm">Permissions & Roles</div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">Manage user permissions</div>
              </div>
            </Link>

            <Link 
              href="/system-settings"
              className="flex flex-col items-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                <Cog8ToothIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-center">
                <div className="text-gray-900 dark:text-white font-medium text-sm">System Settings</div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">Configure system preferences</div>
              </div>
            </Link>

            <Link 
              href="/menu-settings"
              className="flex flex-col items-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <PencilIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center">
                <div className="text-gray-900 dark:text-white font-medium text-sm">Menu Settings</div>
                <div className="text-gray-600 dark:text-gray-400 text-xs">Configure menu permissions</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;