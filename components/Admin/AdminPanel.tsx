"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { 
  UserIcon, 
  ShieldCheckIcon, 
  PencilIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  Cog8ToothIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';

// Inline API client for admin operations
const adminAPI = {
  async getGroups() {
    const response = await fetch('/api/groups');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async createGroup(group: any) {
    const response = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async updateGroup(id: string, group: any) {
    const response = await fetch(`/api/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  },

  async deleteGroup(id: string) {
    const response = await fetch(`/api/groups/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }
};

type UserRole = 'admin' | 'editor' | 'viewer' | 'user';
type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

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

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface PermissionCategory {
  category: string;
  permissions: Permission[];
}

interface AdminStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: {
      admin: number;
      editor: number;
      moderator: number;
      user: number;
      viewer: number;
    };
  };
  groups: {
    total: number;
  };
  permissions: {
    total: number;
  };
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add permissions data state
  const [permissionsStats, setPermissionsStats] = useState({
    totalRoles: 0,
    totalPermissions: 0,
    totalResourceTypes: 0
  });

  // Add users detailed stats
  const [usersDetailedStats, setUsersDetailedStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    adminUsers: 0,
    editorUsers: 0,
    moderatorUsers: 0,
    userUsers: 0,
    viewerUsers: 0,
    usersInGroups: 0,
    recentLogins: 0
  });

  // Add groups detailed stats
  const [groupsDetailedStats, setGroupsDetailedStats] = useState({
    totalGroups: 0,
    activeGroups: 0,
    emptyGroups: 0,
    largestGroupSize: 0,
    averageGroupSize: 0,
    recentlyCreated: 0
  });

  // Add menu detailed stats
  const [menuDetailedStats, setMenuDetailedStats] = useState({
    totalMenus: 0,
    groupMenus: 0,
    regularMenus: 0,
    activeMenus: 0,
    totalPermissions: 0,
    menuCoverage: 0,
    averagePermissionsPerMenu: 0
  });
  
  const [adminStats, setAdminStats] = useState<AdminStats>({
    users: { total: 0, active: 0, inactive: 0, byRole: { admin: 0, editor: 0, moderator: 0, user: 0, viewer: 0 } },
    groups: { total: 0 },
    permissions: { total: 0 }
  });

  const { toast } = useToast();

  // Fetch permissions data
  const fetchPermissionsData = async () => {
    try {
      const [rolesRes, permissionsRes, resourceTypesRes] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch('/api/admin/role-permissions'),
        fetch('/api/admin/resource-types')
      ]);

      let totalRoles = 0;
      let totalPermissions = 0;
      let totalResourceTypes = 0;

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json();
        const roles = rolesData.data || {};
        totalRoles = Object.keys(roles).length;
      }

      if (permissionsRes.ok) {
        const permissionsData = await permissionsRes.json();
        const permissions = permissionsData.data || [];
        totalPermissions = Array.isArray(permissions) ? permissions.length : 0;
      }

      if (resourceTypesRes.ok) {
        const resourceTypesData = await resourceTypesRes.json();
        const resourceTypes = resourceTypesData.data || [];
        totalResourceTypes = Array.isArray(resourceTypes) ? resourceTypes.length : 0;
      }

      setPermissionsStats({
        totalRoles,
        totalPermissions,
        totalResourceTypes
      });

    } catch (error) {
      console.error('Error fetching permissions data:', error);
    }
  };

  // Fetch detailed users data
  const fetchUsersDetailedData = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const usersData = await response.json();
        const users = usersData.users || [];

        // Calculate detailed statistics
        const totalUsers = users.length;
        const activeUsers = users.filter((u: any) => u.isActive || u.status === 'active').length;
        const inactiveUsers = totalUsers - activeUsers;
        const adminUsers = users.filter((u: any) => u.role === 'admin').length;
        const editorUsers = users.filter((u: any) => u.role === 'editor').length;
        const moderatorUsers = users.filter((u: any) => u.role === 'moderator').length;
        const userUsers = users.filter((u: any) => u.role === 'user').length;
        const viewerUsers = users.filter((u: any) => u.role === 'viewer').length;
        const usersInGroups = users.filter((u: any) => u.groupId || u.group_id).length;
        
        // Calculate recent logins (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentLogins = users.filter((u: any) => {
          if (!u.last_login) return false;
          const lastLogin = new Date(u.last_login);
          return lastLogin > sevenDaysAgo;
        }).length;

        setUsersDetailedStats({
          totalUsers,
          activeUsers,
          inactiveUsers,
          adminUsers,
          editorUsers,
          moderatorUsers,
          userUsers,
          viewerUsers,
          usersInGroups,
          recentLogins
        });
      }
    } catch (error) {
      console.error('Error fetching detailed users data:', error);
    }
  };

  // Fetch detailed groups data
  const fetchGroupsDetailedData = async () => {
    try {
      const [groupsRes, usersRes] = await Promise.all([
        fetch('/api/groups'),
        fetch('/api/users')
      ]);

      let totalGroups = 0;
      let activeGroups = 0;
      let recentlyCreated = 0;
      let groupMemberCounts: number[] = [];

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json();
        const groups = groupsData.groups || [];
        totalGroups = groups.length;
        activeGroups = groups.length; // All groups are considered active for now

        // Calculate recently created groups (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        recentlyCreated = groups.filter((g: any) => {
          if (!g.createdAt && !g.created_at) return false;
          const createdDate = new Date(g.createdAt || g.created_at);
          return createdDate > thirtyDaysAgo;
        }).length;
      }

      // Calculate group member statistics
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const users = usersData.users || [];
        
        // Count members per group
        const groupCounts: { [key: string]: number } = {};
        users.forEach((user: any) => {
          const groupId = user.groupId || user.group_id;
          if (groupId) {
            groupCounts[groupId] = (groupCounts[groupId] || 0) + 1;
          }
        });

        groupMemberCounts = Object.values(groupCounts);
      }

      const emptyGroups = totalGroups - groupMemberCounts.length;
      const largestGroupSize = groupMemberCounts.length > 0 ? Math.max(...groupMemberCounts) : 0;
      const averageGroupSize = groupMemberCounts.length > 0 
        ? Math.round(groupMemberCounts.reduce((a, b) => a + b, 0) / groupMemberCounts.length) 
        : 0;

      setGroupsDetailedStats({
        totalGroups,
        activeGroups,
        emptyGroups,
        largestGroupSize,
        averageGroupSize,
        recentlyCreated
      });

    } catch (error) {
      console.error('Error fetching detailed groups data:', error);
    }
  };

  const fetchMenuDetailedData = async () => {
    try {
      const [menuItemsRes, rolePermissionsRes] = await Promise.all([
        fetch('/api/admin/menu-items'),
        fetch('/api/admin/role-permissions')
      ]);

      let totalMenus = 0;
      let groupMenus = 0;
      let regularMenus = 0;
      let activeMenus = 0;
      let totalPermissions = 0;

      if (menuItemsRes.ok) {
        const menuData = await menuItemsRes.json();
        if (menuData.success && menuData.data) {
          const { statistics, flat_menus } = menuData.data;
          totalMenus = statistics.total_items || 0;
          groupMenus = statistics.group_items || 0;
          regularMenus = statistics.regular_items || 0;
          
          // Count active menus
          if (flat_menus && Array.isArray(flat_menus)) {
            activeMenus = flat_menus.filter((menu: any) => menu.is_active).length;
          }
        }
      }

      if (rolePermissionsRes.ok) {
        const permissionsData = await rolePermissionsRes.json();
        if (permissionsData.success && permissionsData.data) {
          totalPermissions = Array.isArray(permissionsData.data) ? permissionsData.data.length : 0;
        }
      }

      const menuCoverage = totalMenus > 0 ? Math.round((activeMenus / totalMenus) * 100) : 0;
      const averagePermissionsPerMenu = totalMenus > 0 ? Math.round(totalPermissions / totalMenus) : 0;

      setMenuDetailedStats({
        totalMenus,
        groupMenus,
        regularMenus,
        activeMenus,
        totalPermissions,
        menuCoverage,
        averagePermissionsPerMenu
      });

    } catch (error) {
      console.error('Error fetching detailed menu data:', error);
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch real data from APIs
        const [usersRes, groupsRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/groups')
        ]);

        let userData: User[] = [];
        let groupData: Group[] = [];

        // Handle users response
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          userData = usersData.users || usersData || [];
        } else {
          console.warn('Failed to fetch users, using empty array');
        }

        // Handle groups response  
        if (groupsRes.ok) {
          const groupsData = await groupsRes.json();
          groupData = groupsData.groups || groupsData || [];
        } else {
          console.warn('Failed to fetch groups, using empty array');
        }

        setUsers(userData);
        setGroups(groupData);

        // Calculate stats from real data
        const stats: AdminStats = {
          users: {
            total: userData.length,
            active: userData.filter(u => u.status === 'active').length,
            inactive: userData.filter(u => u.status === 'inactive').length,
            byRole: {
              admin: userData.filter(u => u.role === 'admin').length,
              editor: userData.filter(u => u.role === 'editor').length,
              moderator: userData.filter(u => u.role === 'moderator').length,
              user: userData.filter(u => u.role === 'user').length,
              viewer: userData.filter(u => u.role === 'viewer').length,
            }
          },
          groups: { total: groupData.length },
          permissions: { total: 0 } // Will be updated by permissions fetch
        };

        setAdminStats(stats);
        
        // Fetch permissions data
        await fetchPermissionsData();
        
        // Fetch detailed users data
        await fetchUsersDetailedData();
        
        // Fetch detailed groups data
        await fetchGroupsDetailedData();
        
        // Fetch detailed menu data
        await fetchMenuDetailedData();
        
      } catch (error) {
        console.error('Failed to fetch admin data:', error);
        toast({
          title: "Error",
          description: "Failed to load admin data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="text-gray-900 dark:text-gray-100 font-medium">Loading admin dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-800 text-white">
        <div className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              Quick overview of your system statistics and recent activity.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="space-y-6">
          {/* Users Overview */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Users Management Overview
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Detailed user statistics and activity insights</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">Total</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">All Users</h4>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{usersDetailedStats.totalUsers}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Registered accounts</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-6 border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-green-600 dark:text-green-400 font-medium text-sm">Active</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Active Users</h4>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{usersDetailedStats.activeUsers}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Currently enabled</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-lg p-6 border border-orange-200 dark:border-orange-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-orange-500 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-orange-600 dark:text-orange-400 font-medium text-sm">Grouped</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">In Groups</h4>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">{usersDetailedStats.usersInGroups}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Assigned to groups</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 rounded-lg p-6 border border-indigo-200 dark:border-indigo-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">Recent</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Recent Logins</h4>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{usersDetailedStats.recentLogins}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Last 7 days</p>
                </div>
              </div>

              {/* Role Distribution in Users Overview */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <ShieldCheckIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium text-sm">Administrators</span>
                    </div>
                    <span className="text-red-600 dark:text-red-400 text-xs font-medium">HIGH ACCESS</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{usersDetailedStats.adminUsers}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    {usersDetailedStats.totalUsers > 0 ? ((usersDetailedStats.adminUsers / usersDetailedStats.totalUsers) * 100).toFixed(1) : 0}% of total users
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <PencilIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium text-sm">Editors</span>
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">MEDIUM ACCESS</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{usersDetailedStats.editorUsers}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    {usersDetailedStats.totalUsers > 0 ? ((usersDetailedStats.editorUsers / usersDetailedStats.totalUsers) * 100).toFixed(1) : 0}% of total users
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <UserGroupIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium text-sm">Moderators</span>
                    </div>
                    <span className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">MEDIUM ACCESS</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{usersDetailedStats.moderatorUsers}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    {usersDetailedStats.totalUsers > 0 ? ((usersDetailedStats.moderatorUsers / usersDetailedStats.totalUsers) * 100).toFixed(1) : 0}% of total users
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium text-sm">Users</span>
                    </div>
                    <span className="text-purple-600 dark:text-purple-400 text-xs font-medium">BASIC ACCESS</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{usersDetailedStats.userUsers}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    {usersDetailedStats.totalUsers > 0 ? ((usersDetailedStats.userUsers / usersDetailedStats.totalUsers) * 100).toFixed(1) : 0}% of total users
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium text-sm">Viewers</span>
                    </div>
                    <span className="text-green-600 dark:text-green-400 text-xs font-medium">BASIC ACCESS</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{usersDetailedStats.viewerUsers}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    {usersDetailedStats.totalUsers > 0 ? ((usersDetailedStats.viewerUsers / usersDetailedStats.totalUsers) * 100).toFixed(1) : 0}% of total users
                  </p>
                </div>
              </div>

              {/* Quick Link to Users Page */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-gray-900 dark:text-white font-medium">Need to manage users?</h5>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Add, edit, or manage user accounts and permissions</p>
                  </div>
                  <Link 
                    href="/users"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Manage Users
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Groups Overview */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Groups Management Overview
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Department groups and organizational structure insights</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-6 border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-green-600 dark:text-green-400 font-medium text-sm">Total</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">All Groups</h4>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{groupsDetailedStats.totalGroups}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Department groups</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900 dark:to-emerald-800 rounded-lg p-6 border border-emerald-200 dark:border-emerald-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">Active</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Active Groups</h4>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">{groupsDetailedStats.activeGroups}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Currently enabled</p>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900 dark:to-teal-800 rounded-lg p-6 border border-teal-200 dark:border-teal-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-teal-500 rounded-lg flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-teal-600 dark:text-teal-400 font-medium text-sm">Average</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Avg Group Size</h4>
                  <p className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">{groupsDetailedStats.averageGroupSize}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Members per group</p>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900 dark:to-cyan-800 rounded-lg p-6 border border-cyan-200 dark:border-cyan-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-cyan-600 dark:text-cyan-400 font-medium text-sm">Recent</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">New Groups</h4>
                  <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">{groupsDetailedStats.recentlyCreated}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Last 30 days</p>
                </div>
              </div>

              {/* Group Statistics Details */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <UserGroupIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium text-sm">Largest Group</span>
                    </div>
                    <span className="text-green-600 dark:text-green-400 text-xs font-medium">MAX SIZE</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{groupsDetailedStats.largestGroupSize}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Maximum members in any group
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium text-sm">Empty Groups</span>
                    </div>
                    <span className="text-orange-600 dark:text-orange-400 text-xs font-medium">NO MEMBERS</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{groupsDetailedStats.emptyGroups}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Groups without members
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <UserGroupIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium text-sm">Group Coverage</span>
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 text-xs font-medium">UTILIZATION</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {groupsDetailedStats.totalGroups > 0 ? (((groupsDetailedStats.totalGroups - groupsDetailedStats.emptyGroups) / groupsDetailedStats.totalGroups) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Groups with members
                  </p>
                </div>
              </div>

              {/* Quick Link to Groups Page */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-gray-900 dark:text-white font-medium">Need to manage groups?</h5>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Create, edit, or organize department groups and members</p>
                  </div>
                  <Link 
                    href="/groups"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Manage Groups
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions & Roles Overview */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <ShieldCheckIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Permissions & Roles Overview
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">System-wide permissions and role management</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-purple-600 dark:text-purple-400 font-medium text-sm">Active</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Total Roles</h4>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{permissionsStats.totalRoles}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Role definitions configured</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 rounded-lg p-6 border border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium text-sm">Assigned</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Active Permissions</h4>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">{permissionsStats.totalPermissions}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Permission assignments</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Cog8ToothIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">Available</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Resource Types</h4>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{permissionsStats.totalResourceTypes}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Resource categories</p>
                </div>
              </div>

              {/* Quick Link to Permissions Page */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-gray-900 dark:text-white font-medium">Need to manage permissions?</h5>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Configure roles, permissions, and resource access</p>
                  </div>
                  <Link 
                    href="/permissions-roles"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Manage Permissions
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Management Overview */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Bars3Icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Menu Management Overview
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Navigation structure and menu permissions insights</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Bars3Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-purple-600 dark:text-purple-400 font-medium text-sm">Total</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">All Menus</h4>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{menuDetailedStats.totalMenus}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Navigation items</p>
                </div>

                <div className="bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900 dark:to-violet-800 rounded-lg p-6 border border-violet-200 dark:border-violet-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-violet-500 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-violet-600 dark:text-violet-400 font-medium text-sm">Groups</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Menu Groups</h4>
                  <p className="text-3xl font-bold text-violet-600 dark:text-violet-400 mb-2">{menuDetailedStats.groupMenus}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Parent categories</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 rounded-lg p-6 border border-indigo-200 dark:border-indigo-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                      <Bars3Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">Items</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Regular Menus</h4>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{menuDetailedStats.regularMenus}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Navigation links</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <ShieldCheckIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">Active</span>
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-semibold text-lg mb-2">Active Menus</h4>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{menuDetailedStats.activeMenus}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Currently visible</p>
                </div>
              </div>

              {/* Menu Statistics Details */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <ShieldCheckIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium text-sm">Total Permissions</span>
                    </div>
                    <span className="text-purple-600 dark:text-purple-400 text-xs font-medium">ACCESS RULES</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{menuDetailedStats.totalPermissions}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Menu access permissions
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <Bars3Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium text-sm">Menu Coverage</span>
                    </div>
                    <span className="text-indigo-600 dark:text-indigo-400 text-xs font-medium">ACTIVE %</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{menuDetailedStats.menuCoverage}%</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Menus currently active
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 bg-violet-500 rounded-lg flex items-center justify-center">
                        <ShieldCheckIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-900 dark:text-white font-medium text-sm">Avg Permissions</span>
                    </div>
                    <span className="text-violet-600 dark:text-violet-400 text-xs font-medium">PER MENU</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{menuDetailedStats.averagePermissionsPerMenu}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">
                    Permissions per menu item
                  </p>
                </div>
              </div>

              {/* Quick Link to Menu Settings Page */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-gray-900 dark:text-white font-medium">Need to configure menu access?</h5>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">Set up menu permissions and navigation structure</p>
                  </div>
                  <Link 
                    href="/menu-settings"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Manage Menus
                  </Link>
                </div>
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
                <Link 
                  href="/users"
                  className="flex flex-col items-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                    <UserIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-gray-900 dark:text-white font-medium text-sm">User Management</div>
                    <div className="text-gray-600 dark:text-gray-400 text-xs">Manage user accounts</div>
                  </div>
                </Link>

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
      </div>
    </div>
  );
};

export default AdminPanel;