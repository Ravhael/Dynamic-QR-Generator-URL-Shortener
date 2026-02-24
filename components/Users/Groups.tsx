"use client";

import React, { useEffect, useState } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  UsersIcon, 
  InformationCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { 
  UsersIcon as UsersSolidIcon,
  ShieldCheckIcon,
  SparklesIcon 
} from '@heroicons/react/24/solid';

// Menggunakan fetch langsung daripada import apiClient
const apiClient = {
  get: async (url: string) => {
    const res = await fetch(url);
    return await res.json();
  },
  post: async (url: string, data: unknown) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },
  put: async (url: string, data: unknown) => {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },
  delete: async (url: string) => {
    const res = await fetch(url, { method: 'DELETE' });
    return await res.json();
  }
};

interface Group {
  id: number;
  name: string;
  description?: string;
  memberCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
  const res = await apiClient.get('/api/groups');
  setGroups(res.groups || []);
  setFilteredGroups(res.groups || []);
      setLoading(false);
    } catch (_err: any) {
      setError('Failed to load groups');
      setLoading(false);
    }
  };

  // Search functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredGroups(filtered);
    }
  }, [searchTerm, groups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGroup) {
        await apiClient.put(`/api/groups/${editingGroup.id}`, formData);
      } else {
        await apiClient.post('/api/groups', formData);
      }
      setShowForm(false);
      setEditingGroup(null);
      setFormData({ name: '', description: '' });
      fetchGroups();
    } catch {
      alert('Failed to save group');
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({ name: group.name, description: group.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000); // Auto-cancel after 3 seconds
      return;
    }
    
    try {
      await apiClient.delete(`/api/groups/${id}`);
      setDeleteConfirm(null);
      fetchGroups();
    } catch {
      alert('Failed to delete group');
      setDeleteConfirm(null);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-900">
      <div className="space-y-6 p-4 sm:p-6">
        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden bg-white/90 dark:bg-gray-800/90 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-md">
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <UsersSolidIcon className="h-6 w-6 text-gray-800 dark:text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Group Management
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Organize users into groups with specific permissions and access levels
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingGroup(null);
                  setFormData({ name: '', description: '' });
                }}
                className="group px-4 py-2 sm:px-5 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-md sm:rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Create New Group</span>
                </div>
              </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-6">
              <div className="bg-white/90 dark:bg-gray-700/90  rounded-xl p-4 border border-white/20 dark:border-gray-600/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <UsersIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Groups</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{groups.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90  rounded-xl p-4 border border-white/20 dark:border-gray-600/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Groups</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{groups.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90  rounded-xl p-4 border border-white/20 dark:border-gray-600/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <ShieldCheckIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">With Permissions</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{groups.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90  rounded-xl p-4 border border-white/20 dark:border-gray-600/30">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <UsersIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Members</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{groups.reduce((acc, g) => acc + (g.memberCount || 0), 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-md">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                  <MagnifyingGlassIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Search & Filter Groups</h3>
              </div>
              <div className="relative max-w-md w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search groups by name or description..."
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-150"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredGroups.length} of {groups.length} groups
              </span>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-md">
            <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700 animate-spin"></div>
                </div>
              <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-300">Loading groups...</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch your group data</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white/90 dark:bg-gray-800/90  rounded-2xl border border-red-200 dark:border-red-800 shadow-xl">
            <div className="p-8">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                  <XMarkIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Error Loading Groups</h3>
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                  <button
                    onClick={fetchGroups}
                    className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-md overflow-hidden">
            {filteredGroups.length === 0 ? (
              <div className="p-16 text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-6 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full">
                    <UsersIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {searchTerm ? 'No Groups Found' : 'No Groups Created Yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {searchTerm 
                    ? `No groups match your search "${searchTerm}". Try different keywords or clear the search.`
                    : 'Get started by creating your first group to organize users and manage permissions.'
                  }
                </p>
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setEditingGroup(null);
                      setFormData({ name: '', description: '' });
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    <PlusIcon className="inline h-5 w-5 mr-2" />
                    Create Your First Group
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <UsersIcon className="h-4 w-4" />
                          <span>Group Details</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <InformationCircleIcon className="h-4 w-4" />
                          <span>Description</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Created</span>
                        </div>
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredGroups.map((group, index) => (
                      <tr 
                        key={group.id} 
                        className={`transition-all duration-200 hover:bg-white/80 dark:hover:bg-gray-700/80 ${
                          index % 2 === 0 
                            ? 'bg-white/40 dark:bg-gray-800/40' 
                            : 'bg-gray-50/40 dark:bg-gray-700/40'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center shadow-lg">
                                <UsersSolidIcon className="h-6 w-6 text-white" />
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {group.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-3">
                                <span>ID: {group.id}</span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <SparklesIcon className="h-3 w-3 mr-1" />
                                  {group.memberCount || 0} member{(group.memberCount || 0) === 1 ? '' : 's'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                          {group.description ? (
                            <div className="text-sm text-gray-900 dark:text-gray-300">
                              <p className="truncate">{group.description}</p>
                              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                                <CheckCircleIcon className="w-3 h-3 mr-1 text-green-500" />
                                Has description
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                              No description provided
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {new Date(group.createdAt).toLocaleDateString('id-ID', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(group.createdAt).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(group)}
                              className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                              <PencilIcon className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(group.id)}
                              className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                                deleteConfirm === group.id
                                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                                  : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                              }`}
                            >
                              <TrashIcon className="w-4 h-4 mr-1" />
                              {deleteConfirm === group.id ? 'Confirm' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Form Modal (Create / Edit Group) */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg p-6 shadow-lg max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{editingGroup ? 'Edit Group' : 'Create New Group'}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Provide a name and optional description for the group.</p>
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Group Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Admins, Support, Marketing"
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Description (optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="Describe this group and its purpose"
                  />
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setEditingGroup(null); setFormData({ name: '', description: '' }); }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium"
                  >
                    {editingGroup ? 'Save Changes' : 'Create Group'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
