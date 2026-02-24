"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  UserCircleIcon, 
  CameraIcon, 
  EyeIcon, 
  EyeSlashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ChartBarIcon,
  QrCodeIcon,
  LinkIcon,
  CalendarIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { userService, UserProfile, UserStats } from '../../lib/services/userService';

// Interface tambahan untuk komponen ini
interface Group {
  id: number;
  name: string;
}

export const ProfileModern: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats>({ 
    qrCodesCreated: 0, 
    shortUrlsCreated: 0, 
    totalScans: 0, 
    totalClicks: 0,
    lastActivity: new Date().toISOString(),
    joinedDate: new Date().toISOString(),
    recentActivity: []
  });
  const [groups, setGroups] = useState<Group[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileData, setProfileData] = useState({ name: '', email: '', avatar: '', groupId: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const res = await userService.getCurrentUser();
        if (res) {
          console.log('🔍 User profile data received:', res);
          setCurrentUser(res);
          setProfileData({
            name: res.full_name || '',
            email: res.email,
            avatar: res.avatar || '',
            groupId: res.group_id?.toString() || '',
          });
          console.log('📝 Profile data set:', {
            groupId: res.group_id?.toString() || '',
            groupName: res.group_name,
            currentUserGroupName: res.group_name
          });
        }
        setProfileError(null);
      } catch (err: any) {
        setCurrentUser(null);
        setProfileData({ name: '', email: '', avatar: '', groupId: '' });
        setProfileError('Failed to load profile data.');
        console.error('Profile load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        console.log('🔍 Fetching user stats from database...');
        const userStats = await userService.getUserStats();
        console.log('📊 Stats from database:', userStats);
        setStats(userStats);
        console.log('✅ Stats updated successfully');
      } catch (error) {
        console.error('❌ Failed to fetch stats:', error);
        setStats({ 
          qrCodesCreated: 0, 
          shortUrlsCreated: 0, 
          totalScans: 0, 
          totalClicks: 0,
          lastActivity: new Date().toISOString(),
          joinedDate: new Date().toISOString(),
          recentActivity: []
        });
      }
    };

    const fetchGroups = async () => {
      try {
        console.log('🔍 Fetching groups from database...');
        const response = await fetch('/api/groups');
        const data = await response.json();
        
        if (data.success && data.groups) {
          const groupsData = data.groups.map((group: any) => ({
            id: group.id,
            name: group.name
          }));
          setGroups(groupsData);
          console.log('✅ Groups loaded from database:', groupsData);
        } else {
          console.warn('⚠️ No groups found in database, using empty array');
          setGroups([]);
        }
      } catch (error) {
        console.error('❌ Failed to fetch groups:', error);
        setGroups([]);
      }
    };

    fetchProfile();
    fetchStats();
    fetchGroups();
  }, []);

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showMessage('File size must be less than 5MB', 'error');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showMessage('Please upload a valid image file (JPEG, PNG, GIF, or WebP)', 'error');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Use userService to upload avatar
      const avatarUrl = await userService.uploadAvatar(file);

      if (avatarUrl) {
        setProfileData({ ...profileData, avatar: avatarUrl });
        setCurrentUser({ ...currentUser!, avatar: avatarUrl });
        showMessage('Profile photo updated successfully!', 'success');
      }
    } catch (error: any) {
      console.error('Photo upload error:', error);
      showMessage(error.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleProfileSave = async () => {
    if (!profileData.name.trim() || !profileData.email.trim()) {
      showMessage('Name and email are required', 'error');
      return;
    }

    try {
      const response = await userService.updateUserProfile({
        full_name: profileData.name,
        email: profileData.email,
        group_id: profileData.groupId ? profileData.groupId : null
      });

      if (response) {
        // Update currentUser dengan semua data dari response termasuk group info
        setCurrentUser(response);
        setIsEditing(false);
        showMessage('Profile updated successfully!', 'success');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      showMessage(error.message || 'Failed to update profile', 'error');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error');
      return;
    }

    try {
      // TODO: Add password change functionality to userService
      // For now, show a success message
      console.log('Password change requested:', { currentPassword: passwordData.currentPassword });
      showMessage('Password change feature will be implemented soon', 'error');
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Password change error:', error);
      showMessage(error.message || 'Failed to change password', 'error');
    }
  };

  const showMessage = (message: string, type: 'success' | 'error') => {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const successDiv = document.createElement('div');
    successDiv.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50`;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => document.body.removeChild(successDiv), 3000);
  };

  if (profileError) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="text-red-500 text-lg font-medium">{profileError}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading profile...</div>
        </div>
      </div>
    );
  }

  const roleLower = String(currentUser.role || '').toLowerCase();
  const isAdmin = ['admin', 'administrator', 'superadmin'].includes(roleLower);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      <div className="relative max-w-6xl mx-auto px-3 sm:px-5 lg:px-8 py-6 sm:py-8">
        {/* Mobile Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
              Profile Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base max-w-xl">
              Manage your account information & security preferences.
            </p>
          </div>
            <div className="flex flex-wrap justify-center sm:justify-end gap-2">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-500/60 ${isEditing ? 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                  >
                    <PencilIcon className="w-4 h-4" /> {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-500/60 ${showPasswordForm ? 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                  >
                    <ShieldCheckIcon className="w-4 h-4" /> {showPasswordForm ? 'Close Security' : 'Security'}
                  </button>
                </>
              ) : (
                <div className="text-sm text-slate-500 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">Editing restricted to administrators</div>
              )}
            </div>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8">
          {/* Profile Card - Left Column */}
          <div className="lg:col-span-4 order-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 lg:sticky lg:top-8">
              {/* Profile Photo */}
              <div className="text-center mb-8">
                <div className="relative mx-auto w-32 h-32 mb-6">
                  <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow">
                    {profileData.avatar ? (
                      <img 
                        src={profileData.avatar} 
                        alt={profileData.name}
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <UserCircleIcon className="w-20 h-20 text-white" />
                      </div>
                    )}
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handlePhotoUpload}
                    disabled={isUploadingPhoto || !isAdmin}
                    title={!isAdmin ? 'Only administrators can change avatars' : undefined}
                    className={`absolute bottom-2 right-2 ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''} bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    <CameraIcon className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {profileData.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {profileData.email}
                </p>

                {/* Role Badge */}
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-sm font-medium mb-4">
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  {currentUser.role}
                </div>

                {/* Member Since */}
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Member since {currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString() : '-'}</span>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <QrCodeIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">QR Codes</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.qrCodesCreated}</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                    <LinkIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Short URLs</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.shortUrlsCreated}</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center mr-4">
                    <ChartBarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Scans</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalScans}</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                    <ChartBarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Clicks</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalClicks}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Forms - Right Column */}
            <div className="lg:col-span-8 space-y-6 sm:space-y-8 order-2">
            {/* Profile Information */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
              <div className="flex items-start sm:items-center flex-col sm:flex-row sm:justify-between gap-4 mb-6 sm:mb-8">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <PencilIcon className="w-5 h-5 text-blue-600" />
                    Profile Information
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Update your personal details</p>
                </div>
                {/* Hidden on small since moved to top quick actions */}
 
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                      {profileData.name}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input 
                      type="email" 
                      value={profileData.email} 
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                      {profileData.email}
                    </div>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Account Role
                  </label>
                  <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center">
                      <ShieldCheckIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="text-blue-800 dark:text-blue-200 font-medium capitalize">{currentUser.role}</span>
                    </div>
                  </div>
                </div>

                {/* Group Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Group Assignment
                  </label>
                  {isEditing ? (
                    <select
                      value={profileData.groupId}
                      onChange={(e) => setProfileData({ ...profileData, groupId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">-- Select Group --</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="flex items-center">
                        <UserGroupIcon className="w-5 h-5 text-gray-500 mr-2" />
                        <span className="text-gray-900 dark:text-white">
                          {currentUser?.group_name || "No group assigned"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && isAdmin && (
                <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 mt-6 sm:mt-8">
                  <button
                    onClick={handleProfileSave}
                    className="px-5 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center shadow-sm"
                  >
                    <CheckIcon className="w-5 h-5 mr-2" />
                    Save Changes
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)} 
                    className="px-5 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center shadow-sm"
                  >
                    <XMarkIcon className="w-5 h-5 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Security Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
              <div className="flex items-start sm:items-center flex-col sm:flex-row sm:justify-between gap-4 mb-6 sm:mb-8">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-red-600" />
                    Security Settings
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">Update your account password</p>
                </div>
                <div className="hidden sm:block">
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${showPasswordForm ? 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                  >
                    {showPasswordForm ? 'Cancel' : 'Change Password'}
                  </button>
                </div>
              </div>

              {showPasswordForm && (
                <div className="space-y-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showCurrentPassword ? 'text' : 'password'} 
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter current password" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showNewPassword ? 'text' : 'password'} 
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Enter new password" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'} 
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        placeholder="Confirm new password" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 pt-4">
                    <button 
                      onClick={handlePasswordChange} 
                      disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      className="px-5 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center shadow-sm disabled:cursor-not-allowed"
                    >
                      <CheckIcon className="w-5 h-5 mr-2" />
                      Update Password
                    </button>
                    <button 
                      onClick={() => { 
                        setShowPasswordForm(false); 
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); 
                      }}
                      className="px-5 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center shadow-sm"
                    >
                      <XMarkIcon className="w-5 h-5 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
