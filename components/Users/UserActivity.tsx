"use client";

import React, { useEffect, useState } from 'react';
import { EyeIcon, DocumentIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, ArrowPathIcon, UserIcon, UserGroupIcon, Bars3Icon, FunnelIcon, ClockIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
// // import { ClockIcon, UserIcon, UserGroupIcon, EyeIcon, FunnelIcon, ArrowPathIcon, Bars3Icon } - unused import - unused import from '@heroicons/react/24/outline';
// import { CheckCircleIcon, ExclamationTriangleIcon, DocumentIcon, TrashIcon, PencilIcon } - unused import from '@heroicons/react/24/solid';

// Menggunakan fetch langsung daripada import apiClient
const apiClient = {
  get: async (url: string) => {
    const res = await fetch(url);
    return await res.json();
  },
  post: async (url: string, _data: unknown) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(_data)
    });
    return await res.json();
  }
};

interface ActivityLog {
  id: string; // UUID string from API
  userId: string;
  userName: string;
  userEmail?: string; // optional now
  groupId?: number | string;
  groupName: string;
  accountType?: string; // newly added
  action: string;
  description?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string; // ISO string
  created_at?: string; // legacy fallback (snake_case)
}

interface ActivityResponse {
  activities: ActivityLog[];
  pagination: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

interface Filters {
  userId: string;
  groupId: string;
  action: string;
}

// Helper functions for action styling and icons
const getActionStyle = (action: string): string => {
  switch (action) {
    case 'login':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
    case 'create_qr':
      return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700';
    case 'create_url':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
    case 'update_user':
      return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700';
    case 'delete_qr':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700';
  }
};

const getActionIcon = (action: string) => {
  switch (action) {
    case 'login':
      return <CheckCircleIcon className="h-3 w-3" />;
    case 'create_qr':
    case 'create_url':
      return <DocumentIcon className="h-3 w-3" />;
    case 'update_user':
      return <PencilIcon className="h-3 w-3" />;
    case 'delete_qr':
      return <TrashIcon className="h-3 w-3" />;
    default:
      return <ExclamationTriangleIcon className="h-3 w-3" />;
  }
};

export const UserActivity: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [allLogs, setAllLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ userId: '', groupId: '', action: '' });
  const [uniqueUsers, setUniqueUsers] = useState<{id: string, name: string}[]>([]);
  const [uniqueGroups, setUniqueGroups] = useState<{id: string, name: string}[]>([]);
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Bulk delete state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await apiClient.get('/api/groups');
      const groups = res.groups.map((group: Record<string, unknown>) => ({
        id: String(group.id),
        name: String(group.name || '')
      }));
      setUniqueGroups(groups);
    } catch (_error) {
      console.error('Failed to fetch groups:', _error);
      setUniqueGroups([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/api/users');
      const users = res.users.map((user: Record<string, unknown>) => ({
        id: String(user.id),
        name: String(user.name || user.email)
      }));
      setUniqueUsers(users);
    } catch (_error) {
      console.error('Failed to fetch users:', _error);
      setUniqueUsers([]);
    }
  };

  const fetchActivityTypes = async () => {
    try {
      // Fetch from activity_types table
      const res = await apiClient.get('/api/activity-types');
      if (res.activity_types) {
        const actions: string[] = res.activity_types.map((type: Record<string, unknown>) => String(type.code));
        setUniqueActions(actions);
      } else {
        // Fallback: extract unique actions from current activities
        const res2 = await apiClient.get('/api/user-activity?limit=1000');
        const activities = res2.activities || [];
        const actions: string[] = [...new Set<string>(activities.map((activity: Record<string, unknown>) => String(activity.action)))];
        setUniqueActions(actions);
      }
    } catch (_error) {
      console.error('Failed to fetch activity types:', _error);
      setUniqueActions([]);
    }
  };

  const fetchLogs = async (page = currentPage) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString()
      });
      
      // Add filters if they exist
      if (filters.userId) params.append('user_id', filters.userId);
      if (filters.groupId) params.append('group_id', filters.groupId);
      if (filters.action) params.append('action', filters.action);
      
      console.warn('🔍 [UserActivity] Fetching with params:', params.toString());
      const res = await apiClient.get(`/api/user-activity?${params.toString()}`);
      
      console.warn('📊 [UserActivity] API Response:', res);
  let activities = res.activities || [];

      // Deduplicate by id (server sometimes returns duplicates) before setting state
      if (activities.length) {
        const seen = new Set<number | string>();
        const dedup: typeof activities = [];
        for (const a of activities) {
          const key = (a && a.id) ?? Math.random();
          if (!seen.has(key)) {
            seen.add(key);
            dedup.push(a);
          }
        }
        if (dedup.length !== activities.length) {
          console.warn('[UserActivity] Deduplicated', activities.length - dedup.length, 'duplicate rows from API');
        }
        activities = dedup;
      }
      const pagination = res.pagination || {};
      
      console.warn('📋 [UserActivity] Activities found:', activities.length);
      console.warn('📄 [UserActivity] Pagination:', pagination);
      
  setAllLogs(activities);
      setTotalPages(pagination.pages || 1);
      setTotalItems(pagination.total || 0);
      setCurrentPage(page);
      
      // Set the activities directly since server-side filtering is applied
  setLogs(activities);
      setLoading(false);
    } catch (_error) {
      console.error('Failed to fetch logs:', _error);
      setLoading(false);
      alert('Failed to load activity logs');
    }
  };

  const applyFilters = () => {
    console.warn('🔄 [UserActivity] Applying filters:', filters);
    // Reset to page 1 when filters change and fetch from server
    setCurrentPage(1);
    fetchLogs(1);
  };

  // Bulk delete functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const visibleIds = logs.map((log: ActivityLog) => log.id.toString());
      setSelectedItems(visibleIds);
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id]);
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedItems.length} activity log(s)? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;

    try {
      setBulkDeleteLoading(true);
      
      // Call bulk delete API
      await apiClient.post('/api/users/activity/bulk-delete', {
        ids: selectedItems
      });
      
      // Refresh data
      await fetchLogs();
      setSelectedItems([]);
      
    } catch (_error) {
      console.error('Bulk delete failed:', _error);
      alert('Failed to delete selected items. Please try again.');
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Pagination functions
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchLogs(page);
    }
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setItemsPerPage(newLimit);
    setCurrentPage(1);
    fetchLogs(1);
  };

  useEffect(() => {
    fetchLogs();
    fetchGroups();
    fetchUsers();
    fetchActivityTypes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters]);

  useEffect(() => {
    if (currentPage > 1 || itemsPerPage !== 10) {
      fetchLogs(currentPage);
    }
  }, [filters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="space-y-8 p-6">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-white/90 dark:bg-gray-800/90  rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200/10 to-gray-300/10 dark:from-gray-600/10 dark:to-gray-700/10"></div>
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl shadow-lg">
                  <ClockIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                    User Activity Monitor
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Track and analyze user interactions across the system
                  </p>
                </div>
              </div>
              <button
                onClick={() => fetchLogs()}
                disabled={loading}
                className="group px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                <div className="flex items-center space-x-2">
                  <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
                  <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
                </div>
              </button>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/90 dark:bg-gray-700/90  rounded-xl p-4 border border-white/20 dark:border-gray-600/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                    <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueUsers.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90  rounded-xl p-4 border border-white/20 dark:border-gray-600/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <UserGroupIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Groups</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueGroups.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90  rounded-xl p-4 border border-white/20 dark:border-gray-600/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <Bars3Icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Activities</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalItems}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white/90 dark:bg-gray-800/90  rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl">
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                <FunnelIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Activity Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* User Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <UserIcon className="inline h-4 w-4 mr-2" />
                  Filter by User
                </label>
                <select
                  value={filters.userId}
                  onChange={(e) => setFilters((f: Filters) => ({ ...f, userId: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90  border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200 hover:bg-white/90 dark:hover:bg-gray-700/90"
                >
                  <option value="">All Users ({uniqueUsers.length} total)</option>
                  {uniqueUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Group Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <UserGroupIcon className="inline h-4 w-4 mr-2" />
                  Filter by Group
                </label>
                <select
                  value={filters.groupId}
                  onChange={(e) => setFilters((f: Filters) => ({ ...f, groupId: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90  border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200 hover:bg-white/90 dark:hover:bg-gray-700/90"
                >
                  <option value="">All Groups ({uniqueGroups.length} total)</option>
                  {uniqueGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <EyeIcon className="inline h-4 w-4 mr-2" />
                  Filter by Action
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters((f: Filters) => ({ ...f, action: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90  border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200 hover:bg-white/90 dark:hover:bg-gray-700/90"
                >
                  <option value="">All Actions ({uniqueActions.length} types)</option>
                  {uniqueActions.map((action) => (
                    <option key={action} value={action}>
                      {action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setFilters({ userId: '', groupId: '', action: '' })}
                className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Clear All Filters
              </button>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-600/30 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Displaying <span className="font-bold text-blue-600 dark:text-blue-400">{logs.length}</span> of{' '}
                  <span className="font-bold text-gray-900 dark:text-white">{totalItems}</span> activities
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log Content */}
        {loading ? (
          <div className="bg-white/90 dark:bg-gray-800/90  rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 absolute inset-0"></div>
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-300">Loading activity logs...</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch the latest data</p>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 dark:bg-gray-800/90  rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl overflow-hidden">
            
            {/* Bulk Actions Toolbar */}
            {selectedItems.length > 0 && (
              <div className="bg-blue-50/80 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={() => setSelectedItems([])}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                    >
                      Clear selection
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkDeleteLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <TrashIcon className="h-4 w-4" />
                      <span>{bulkDeleteLoading ? 'Deleting...' : 'Delete Selected'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Results Summary */}
            <div className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600 px-6 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Displaying {logs.length} of {totalItems} activities
                  {currentPage > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </p>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                    className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedItems.length > 0 && selectedItems.length === logs.length}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-gray-500 border-gray-300 rounded"
                        />
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4" />
                        <span>User Details</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <UserGroupIcon className="h-4 w-4" />
                        <span>Group</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <EyeIcon className="h-4 w-4" />
                        <span>Action Type</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <DocumentIcon className="h-4 w-4" />
                        <span>Description</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4" />
                        <span>Timestamp</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs && logs.length > 0 ? logs.map((log, index) => (
                    <tr 
                      key={`row-${log.id}-${log.createdAt}-${index}`} 
                      className={`transition-all duration-200 hover:bg-white/80 dark:hover:bg-gray-700/80 ${
                        index % 2 === 0 
                          ? 'bg-white/40 dark:bg-gray-800/40' 
                          : 'bg-gray-50/40 dark:bg-gray-700/40'
                      } ${selectedItems.includes(log.id.toString()) ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(log.id.toString())}
                          onChange={(e) => handleSelectItem(log.id.toString(), e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-gray-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {log.userName || 'Unknown User'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                              <div>ID: {log.userId}</div>
                              {log.accountType && (
                                <div className="inline-block px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-[10px] font-semibold tracking-wide uppercase text-gray-700 dark:text-gray-200">
                                  {log.accountType}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-700/50 dark:to-gray-600/50 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                          {log.groupName || 'No Group'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getActionStyle(log.action)}`}>
                          {getActionIcon(log.action)}
                          <span className="ml-1">
                            {log.action.charAt(0).toUpperCase() + log.action.slice(1).replace('_', ' ')}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-gray-900 dark:text-gray-300 truncate">
                          {log.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        {(() => {
                          const raw = log.createdAt || log.created_at || '';
                          const d = new Date(raw);
                          const valid = !isNaN(d.getTime());
                          if (!valid) return <span className="text-red-500">Invalid Date</span>;
                          const datePart = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
                          const timePart = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                          return (
                            <span className="font-medium">
                              {datePart} {timePart}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-4">
                          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
                            <DocumentIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No Activity Logs Found</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                              {allLogs.length > 0 
                                ? 'No activities match your current filter criteria. Try adjusting your filters or clearing them to view all activities.'
                                : 'No activity logs have been recorded yet. User activities will appear here once they start interacting with the system.'
                              }
                            </p>
                          </div>
                          {allLogs.length > 0 && (
                            <button
                              onClick={() => setFilters({ userId: '', groupId: '', action: '' })}
                              className="mt-4 px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                            >
                              Clear All Filters
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50/50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages} ({totalItems} total items)
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      First
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={`page-${pageNum}`}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm border rounded-md transition-colors ${
                            currentPage === pageNum
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
