"use client";

import React, { useState, useEffect } from 'react';
import { 
  UserCircleIcon, 
  PencilIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  LockClosedIcon,
  EnvelopeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { 
  UsersIcon as UsersSolidIcon,
  ShieldCheckIcon as ShieldCheckSolidIcon,
  SparklesIcon 
} from '@heroicons/react/24/solid';
import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/lib/auth-fetch';

// Inline User interface
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  groupId?: number | null;
  groupName?: string;
  created_at: string;
  last_login?: string;
}

// Separate creation payload type (includes password & roleId)
interface UserCreatePayload {
  name: string;
  email: string;
  password: string;
  role: string;
  roleId?: string;
  groupId?: number | null;
}

// Inline API client for users
const usersAPI = {
  async getUsers() {
    const response = await authenticatedGet('/api/users');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async createUser(user: UserCreatePayload) {
    const response = await authenticatedPost('/api/users', user);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async updateUser(id: string, user: Partial<User>) {
    console.warn('[Users API] Updating user:', { id, user });
    const response = await authenticatedPut(`/api/users/${id}`, user);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error || 
        `Failed to update user (${response.status} ${response.statusText})`
      );
    }
    
    return response.json();
  },

  async deleteUser(id: string) {
    console.warn('[Users API] Deleting user:', id);
    const response = await authenticatedDelete(`/api/users/${id}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(
        errorData?.error || 
        `Failed to delete user (${response.status} ${response.statusText})`
      );
    }
    
    return response.json();
  }
};

import { formatDistance } from 'date-fns';
import { clsx } from 'clsx';

// --- Enhanced Toast Component ---
const Toast: React.FC<{ message: string, type?: 'success' | 'error', onClose?: () => void }> = ({ message, type = 'success', onClose }) => {
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (onClose) onClose();
    }, 4000);
    return () => clearTimeout(timeout);
  }, [onClose]);
  
  return (
    <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl  border text-white text-sm font-semibold transform transition-all duration-300 animate-in slide-in-from-right ${
      type === 'success' 
        ? 'bg-green-500/90 border-green-400/30' 
        : 'bg-red-500/90 border-red-400/30'
    }`}>
      <div className="flex items-center space-x-2">
        {type === 'success' ? (
          <CheckCircleIcon className="h-5 w-5" />
        ) : (
          <XCircleIcon className="h-5 w-5" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  interface Role {
    id?: string; // added from roles API
    value: string; // canonical role name
    label: string; // display name
    description: string;
  }
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  // Bulk delete and pagination states
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'regular', // synthetic regular user marker
    roleId: '' as string | null,
    groupId: null as number | null
  });
  // --- State untuk Toast Notification ---
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers();
      setUsers(response.users || []);
      setFilteredUsers(response.users || []);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // --- Derived counts (role classification) ---
  const ADMIN_ROLE_ALIASES = ['admin', 'administrator'];
  const adminCount = users.filter(u => ADMIN_ROLE_ALIASES.includes((u.role || '').toLowerCase())).length;
  const regularCount = users.length - adminCount;

  // Sync roleId for create form when roles arrive or role changes (only when not editing)
  useEffect(() => {
    if (!editingUser && roles.length > 0) {
      let targetValue = formData.role;
      if (formData.role === 'regular') {
        const nonAdmin = roles.find(r => !ADMIN_ROLE_ALIASES.includes(r.value.toLowerCase()));
        if (nonAdmin) targetValue = nonAdmin.value;
      }
      const match = roles.find(r => r.value === targetValue);
      if (match && (formData.roleId !== match.id || formData.role !== targetValue)) {
        console.warn('[Users] Auto-sync roleId for create form:', { role: formData.role, mappedValue: targetValue, roleId: match.id });
        setFormData(prev => ({ ...prev, role: targetValue, roleId: match.id || '' }));
      }
    }
  }, [roles, formData.role, editingUser]);

  // Search and filter functionality
  useEffect(() => {
    let filtered = users;

    // Search by name or email
    if (searchTerm.trim()) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (selectedRole) {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Filter by group
    if (selectedGroup) {
      if (selectedGroup === 'no-group') {
        filtered = filtered.filter(user => !user.groupId);
      } else {
        filtered = filtered.filter(user => user.groupId?.toString() === selectedGroup);
      }
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter(user => 
        selectedStatus === 'active' ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [users, searchTerm, selectedRole, selectedGroup, selectedStatus]);

  // Pagination functionality
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
    
    // Reset selections when page changes
    setSelectedUsers(new Set());
    setSelectAll(false);
  }, [filteredUsers, currentPage, pageSize]);

  // Fetch groups from API
  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.warn('Groups response:', data);
      
      // Handle different response formats
      let groupsData = [];
      if (Array.isArray(data)) {
        groupsData = data;
      } else if (data && typeof data === 'object') {
        if (data.groups && Array.isArray(data.groups)) {
          groupsData = data.groups;
        } else if (data.data && Array.isArray(data.data)) {
          groupsData = data.data;
        }
      }
      
      console.warn('Parsed groups _data:', groupsData);
      setGroups(groupsData);
    } catch (err: any) {
      console.error('Failed to fetch groups:', err);
      setGroups([]); // Set empty array on error
    }
  };

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      const response = await authenticatedGet('/api/roles');
      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.statusText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      if (data.roles) {
        setRoles(data.roles);
        // If administrator selected later, we can map by value -> id
      } else {
        throw new Error('Invalid roles data format returned from server');
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setToast({ 
        message: error instanceof Error ? error.message : 'Failed to load roles',
        type: 'error'
      });
      setRoles([]); // Set empty array as fallback
    }
  };

  useEffect(() => {
    console.warn('Users component mounted, fetching data...');
    fetchUsers();
    fetchGroups();
    fetchRoles();
  }, []);

  // Debug: log groups state when it changes
  useEffect(() => {
    console.warn('🎯 Groups state updated:', groups);
    console.warn('🎯 Groups array length:', groups.length);
    console.warn('🎯 Groups is array?', Array.isArray(groups));
    if (groups.length > 0) {
      console.warn('🎯 First group:', groups[0]);
      console.warn('🎯 All group names:', groups.map(g => g.name));
    }
  }, [groups]);  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Update existing user
        const { password, ...updateData } = formData; // Exclude password if not changed
        console.warn('[Users] Updating user with data:', {
          id: editingUser.id,
          ...updateData
        });
        
        // Make sure role is using value from the roles dropdown
        if (updateData.role && !roles.some(r => r.value === updateData.role)) {
          throw new Error(`Invalid role: ${updateData.role}`);
        }

  const result = await usersAPI.updateUser(editingUser.id, updateData);
        console.warn('[Users] Update result:', result);
        
        setToast({ message: 'User updated successfully!', type: 'success' });
        setEditingUser(null);
      } else {
        // Create new user
        if (!formData.password) {
          throw new Error('Password is required for new users');
        }
        console.warn('[Users] createUser submit payload preview:', {
          name: formData.name,
          email: formData.email,
          password: '***',
          role: formData.role,
          roleId: formData.roleId,
          groupId: formData.groupId
        });
        await usersAPI.createUser({
          name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            roleId: formData.roleId || undefined,
            groupId: formData.groupId ?? undefined
          });
        setToast({ message: 'User created successfully!', type: 'success' });
      }
      fetchUsers();
  setFormData({ name: '', email: '', password: '', role: 'regular', roleId: '', groupId: null });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save user';
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      roleId: roles.find(r => r.value === user.role)?.id || '',
      groupId: user.groupId || null
    });
    setShowAddForm(true);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await usersAPI.updateUser(id, { isActive: !currentStatus });
      fetchUsers();
      setToast({ message: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`, type: 'success' });
    } catch (_err) {
      console.error('Error toggling user status:', _err);
      setError('Failed to update user status. Please try again.');
      setToast({ message: 'Failed to update user status.', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000); // Auto-cancel after 3 seconds
      return;
    }

    try {
      console.warn('[Users] Deleting user:', id);
      const response = await authenticatedDelete(`/api/users/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `Failed to delete user (${response.status})`);
      }

      const result = await response.json();
      console.warn('[Users] Delete result:', result);
      
      setDeleteConfirm(null);
      fetchUsers();
      setToast({ message: result.message || 'User deleted successfully!', type: 'success' });
    } catch (error) {
      console.error('[Users] Error deleting user:', error);
      setDeleteConfirm(null);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to delete user. Please try again.';
      
      setToast({ message: errorMessage, type: 'error' });
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingUser(null);
  setFormData({ name: '', email: '', password: '', role: 'regular', roleId: '', groupId: null });
  };

  // Bulk delete functions
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(user => user.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectUser = (userId: string) => {
    const newSelectedUsers = new Set(selectedUsers);
    if (newSelectedUsers.has(userId)) {
      newSelectedUsers.delete(userId);
    } else {
      newSelectedUsers.add(userId);
    }
    setSelectedUsers(newSelectedUsers);
    setSelectAll(newSelectedUsers.size === paginatedUsers.length);
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    
    setBulkDeleteLoading(true);
    try {
      const response = await authenticatedPost('/api/users/bulk-delete', {
        ids: Array.from(selectedUsers)
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete users');
      }
      
      const result = await response.json();
      setToast({ 
        message: `Successfully deleted ${result.deletedCount} users`, 
        type: 'success' 
      });
      
      // Refresh users list
      fetchUsers();
      setSelectedUsers(new Set());
      setSelectAll(false);
      setShowBulkDeleteConfirm(false);
    } catch (error) {
      console.error('Bulk delete error:', error);
      setToast({ 
        message: 'Failed to delete users. Please try again.', 
        type: 'error' 
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Pagination functions
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'editor':
        return 'bg-yellow-100 text-yellow-800';
      case 'viewer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-2 sm:p-6">
      <div className="space-y-5">
        {/* Toast Notification */}
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        
        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden bg-white/90 dark:bg-gray-800/90 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-md">
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <UsersSolidIcon className="h-6 w-6 text-gray-700 dark:text-gray-200" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    User Management
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage user accounts, roles, and permissions across the system
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFormData({ name: '', email: '', password: '', role: 'regular', roleId: '', groupId: null });
                  setEditingUser(null);
                  setShowAddForm(true);
                }}
                className="group px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg sm:rounded-xl font-semibold shadow-sm hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center space-x-2">
                  <UserPlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Add New User</span>
                </div>
              </button>
            </div>
            
            {/* Stats Cards (Single Row) */}
            <div className="flex flex-nowrap gap-3 mt-6 overflow-x-auto pb-2 no-scrollbar">
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-xl p-4 border border-white/20 dark:border-gray-600/30 shadow-lg min-w-[200px]">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-600/50 rounded-lg">
                    <UsersIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-xl p-4 border border-white/20 dark:border-gray-600/30 shadow-lg min-w-[200px]">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-600/50 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {users.filter(u => u.isActive).length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-xl p-4 border border-white/20 dark:border-gray-600/30 shadow-lg min-w-[200px]">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-600/50 rounded-lg">
                    <ShieldCheckSolidIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Administrators</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {adminCount}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-xl p-4 border border-white/20 dark:border-gray-600/30 shadow-lg min-w-[200px]">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-600/50 rounded-lg">
                    <UserCircleIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Regular Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {regularCount}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-700/90 rounded-xl p-4 border border-white/20 dark:border-gray-600/30 shadow-lg min-w-[200px]">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-600/50 rounded-lg">
                    <SparklesIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">In Groups</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {users.filter(u => u.groupId).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-md">
          <div className="p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg">
                <FunnelIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Search & Filter Users</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search Input */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-150"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200"
                >
                  <option value="">All Roles</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label} {role.description ? `- ${role.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Group Filter */}
              <div>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200"
                >
                  <option value="">All Groups</option>
                  <option value="no-group">No Group</option>
                  {Array.isArray(groups) && groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent text-gray-900 dark:text-white transition-all duration-200"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredUsers.length} of {users.length} users
              </span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRole('');
                  setSelectedGroup('');
                  setSelectedStatus('');
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Clear all filters
              </button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-white/90 dark:bg-gray-800/90  rounded-2xl border border-red-200 dark:border-red-800 shadow-xl">
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                  <XCircleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Error Loading Users</h3>
                  <p className="text-red-600 dark:text-red-400">{error}</p>
                  <button
                    onClick={fetchUsers}
                    className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white/95 dark:bg-gray-800/95 rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-lg max-w-2xl w-full mx-3 sm:mx-6 max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <div className="relative p-6 sm:p-8">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="p-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl shadow-lg">
                      {editingUser ? (
                        <PencilIcon className="h-6 w-6 text-white" />
                      ) : (
                        <UserPlusIcon className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {editingUser ? 'Edit User Account' : 'Create New User'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {editingUser ? 'Update user information and permissions' : 'Add a new user to the system'}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                          <UserCircleIcon className="inline h-4 w-4 mr-2" />
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          required
                          className="w-full px-3 py-2.5 sm:py-3 bg-white/90 dark:bg-gray-700/90 border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-150 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Enter user's full name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                          <EnvelopeIcon className="inline h-4 w-4 mr-2" />
                          Email Address *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90  border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          placeholder="Enter email address"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                          <LockClosedIcon className="inline h-4 w-4 mr-2" />
                          Password {editingUser ? '(leave blank to keep current)' : '*'}
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          required={!editingUser}
                          placeholder={editingUser ? 'Enter new password to change' : 'Create a strong password'}
                          className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90  border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                          <ShieldCheckIcon className="inline h-4 w-4 mr-2" />
                          User Role *
                        </label>
                        <select
                          value={(() => {
                            // If current role is non-admin and not one of the ADMIN_ROLE_ALIASES, map to 'regular' synthetic option
                            if (formData.role && !ADMIN_ROLE_ALIASES.includes(formData.role.toLowerCase())) {
                              return 'regular';
                            }
                            return formData.role;
                          })()}
                          onChange={(e) => {
                            const selected = e.target.value;
                            if (selected === 'regular') {
                              const nonAdmin = roles.find(r => !ADMIN_ROLE_ALIASES.includes(r.value.toLowerCase()));
                              if (nonAdmin) {
                                console.warn('[Users] Role dropdown change -> regular mapped', { mapped: nonAdmin.value, id: nonAdmin.id });
                                setFormData(prev => ({ ...prev, role: nonAdmin.value, roleId: nonAdmin.id || '' }));
                              }
                              return;
                            }
                            const match = roles.find(r => r.value === selected);
                            console.warn('[Users] Role dropdown change -> admin', { selected, id: match?.id });
                            setFormData(prev => ({ ...prev, role: selected, roleId: match?.id || '' }));
                          }}
                          className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90  border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                        >
                          {/* Administrator options (could be one or more admin synonyms present) */}
                          {roles.filter(r => ADMIN_ROLE_ALIASES.includes(r.value.toLowerCase())).map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                          {/* Synthetic Regular User option */}
                          {roles.some(r => !ADMIN_ROLE_ALIASES.includes(r.value.toLowerCase())) && (
                            <option value="regular">Regular User</option>
                          )}
                        </select>
                      </div>
                      
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                          <UsersIcon className="inline h-4 w-4 mr-2" />
                          Assign to Group
                        </label>
                        <select
                          value={formData.groupId || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, groupId: e.target.value ? parseInt(e.target.value) : null }))}
                          className="w-full px-4 py-3 bg-white/90 dark:bg-gray-700/90  border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                        >
                          <option value="">No Group (Individual Access)</option>
                          {Array.isArray(groups) && groups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Optional: Assign user to a group for collective permissions management
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="submit"
                        disabled={!editingUser && (!formData.name || !formData.email || !formData.password)}
                        className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {editingUser ? (
                          <>
                            <CheckCircleIcon className="w-5 h-5 mr-2" />
                            Update User
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="w-5 h-5 mr-2" />
                            Create User
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <XCircleIcon className="w-5 h-5 mr-2" />
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white/90 dark:bg-gray-800/90  rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 absolute inset-0"></div>
              </div>
              <p className="mt-6 text-lg font-medium text-gray-700 dark:text-gray-300">Loading users...</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch user data</p>
            </div>
          ) : !filteredUsers || filteredUsers.length === 0 ? (
            <div className="p-16 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full">
                  <UsersIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {users.length === 0 ? 'No Users Created Yet' : 'No Users Found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {users.length === 0 
                  ? 'Get started by creating your first user account to begin managing system access.'
                  : 'No users match your current search and filter criteria. Try adjusting your filters or search terms.'
                }
              </p>
              {users.length === 0 ? (
                <button
                  onClick={() => {
                    setFormData({ name: '', email: '', password: '', role: 'regular', roleId: '', groupId: null });
                    setEditingUser(null);
                    setShowAddForm(true);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  <UserPlusIcon className="inline h-5 w-5 mr-2" />
                  Create Your First User
                </button>
              ) : (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRole('');
                    setSelectedGroup('');
                    setSelectedStatus('');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Bulk Actions Bar */}
              {selectedUsers.size > 0 && (
                <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={() => {
                          setSelectedUsers(new Set());
                          setSelectAll(false);
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        Clear selection
                      </button>
                    </div>
                    <button
                      onClick={() => setShowBulkDeleteConfirm(true)}
                      className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete Selected
                    </button>
                  </div>
                </div>
              )}

              {/* Pagination Info */}
              <div className="mb-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div>
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex items-center space-x-2">
                  <span>Show:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>per page</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <UserCircleIcon className="h-4 w-4" />
                          <span>User Details</span>
                        </div>
                      </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <UsersIcon className="h-4 w-4" />
                        <span>Group</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <ShieldCheckIcon className="h-4 w-4" />
                        <span>Role</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>Status</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4" />
                        <span>Last Login</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedUsers.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className={`transition-all duration-200 hover:bg-white/80 dark:hover:bg-gray-700/80 ${
                        index % 2 === 0 
                          ? 'bg-white/40 dark:bg-gray-800/40' 
                          : 'bg-gray-50/40 dark:bg-gray-700/40'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center shadow-lg">
                              <UserCircleIcon className="h-7 w-7 text-white" />
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <EnvelopeIcon className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.groupName || user.groupId ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 dark:from-gray-700/50 dark:to-gray-600/50 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                            <UsersIcon className="h-3 w-3 mr-1" />
                            {user.groupName || `Group ${user.groupId}`}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            No Group
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={clsx(
                          'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize border',
                          getRoleColor(user.role),
                          user.role === 'admin' && 'border-red-200 dark:border-red-700',
                          user.role === 'editor' && 'border-yellow-200 dark:border-yellow-700',
                          user.role === 'viewer' && 'border-green-200 dark:border-green-700'
                        )}>
                          <ShieldCheckIcon className="h-3 w-3 mr-1" />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          className={clsx(
                            'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border',
                            user.isActive 
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/70' 
                              : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/70'
                          )}
                        >
                          {user.isActive ? (
                            <>
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="h-3 w-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {user.last_login ? formatDistance(new Date(user.last_login), new Date(), { addSuffix: true }) : 'Never'}
                          </span>
                          {user.last_login && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(user.last_login).toLocaleDateString('id-ID')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            <PencilIcon className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className={`inline-flex items-center px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                              deleteConfirm === user.id
                                ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                                : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'
                            }`}
                          >
                            <TrashIcon className="w-4 h-4 mr-1" />
                            {deleteConfirm === user.id ? 'Confirm' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredUsers.length > 0 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + Math.max(1, currentPage - 2);
                      if (page > totalPages) return null;
                      
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            </div>
          )}
        </div>

        {/* Bulk Delete Confirmation Dialog */}
        {showBulkDeleteConfirm && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                    <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Confirm Bulk Delete
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  Are you sure you want to delete <span className="font-semibold">{selectedUsers.size}</span> selected user{selectedUsers.size > 1 ? 's' : ''}?
                </p>
                
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setShowBulkDeleteConfirm(false)}
                    disabled={bulkDeleteLoading}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteLoading}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center"
                  >
                    {bulkDeleteLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      'Delete Users'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
