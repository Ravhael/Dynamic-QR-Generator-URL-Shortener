'use client';

import React from 'react';
import { ShieldCheckIcon, PlusIcon } from '@heroicons/react/24/outline';

// Types
interface Group {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  createdAt: string;
}

interface GroupsTabProps {
  groups: Group[];
  setActiveTab: (tab: 'overview' | 'groups' | 'permissions' | 'menu-settings' | 'settings') => void;
}

const GroupsTab: React.FC<GroupsTabProps> = ({ groups, setActiveTab }) => {
  const getDepartmentIcon = (groupName: string) => {
    switch (groupName.toLowerCase()) {
      case 'administration': return '👑';
      case 'it department': return '�';
      case 'marketing': return '�';
      case 'hr': case 'hrd': return '👥';
      case 'finance': return '💰';
      case 'operations': return '⚙️';
      default: return '🏢';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Department Groups
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Manage organizational departments and their permissions.
        </p>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div key={group.id} className="bg-white dark:bg-gray-800 shadow rounded-lg hover:shadow-md transition-shadow duration-200">
            <div className="p-6">
              {/* Header Section */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                    <span className="text-xl">{getDepartmentIcon(group.name)}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {group.name}
                    </h3>
                    <div className="text-gray-500 dark:text-gray-400 text-sm">
                      ID: #{group.id}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {group.description}
                </p>
              </div>

              {/* Stats */}
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Members:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{group.memberCount}</span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-gray-600 dark:text-gray-300">Created:</span>
                  <span className="text-gray-900 dark:text-white">{new Date(group.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => setActiveTab('permissions')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <ShieldCheckIcon className="h-4 w-4" />
                <span>Manage Permissions</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Group Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors duration-200">
        <button 
          onClick={() => window.location.href = '/groups'}
          className="w-full p-8 text-center group"
        >
          <div className="space-y-4">
            <div className="h-12 w-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors duration-200">
              <PlusIcon className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Add New Department</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Create a new organizational department group</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default GroupsTab;