"use client";

import React, { useState, useEffect } from 'react';
import { 
  CogIcon, 
  ShieldCheckIcon, 
  BellIcon, 
  GlobeAltIcon,
  KeyIcon, 
  EyeIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloudIcon,
  LockClosedIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { 
  CogIcon as CogSolidIcon,
  ShieldCheckIcon as ShieldSolidIcon,
  BellIcon as BellSolidIcon,
  KeyIcon as KeySolidIcon,
  EyeIcon as EyeSolidIcon,
  GlobeAltIcon as GlobeSolidIcon
} from '@heroicons/react/24/solid';
import { clearScanEvents } from '../../utils/scanTracker';
import { clearClickEvents } from '../../utils/urlClickTracker';

import { settingsService } from '@/lib/api/settingsService';

// Enhanced Toast Notification Component
const Toast: React.FC<{ message: string; type?: 'success' | 'error'; onClose?: () => void }> = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (onClose) onClose();
    }, 3000);
    return () => clearTimeout(timeout);
  }, [onClose]);
  
  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative">
        <div className={`relative bg-white/95 dark:bg-gray-800/95 border border-white/10 dark:border-gray-700/20 rounded-lg p-3 shadow-md min-w-64`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${type === 'success' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
              {type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div className="flex-1">
              <p className={`font-medium ${type === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [validationIssues, setValidationIssues] = useState<Array<{ path: string; message: string }>>([]);

  // Fetch user settings saat mount
  useEffect(() => {
    settingsService.getSettings()
      .then((data: any) => {
        console.warn('settings:', data);
        // API mengembalikan data langsung (bukan nested dalam 'settings')
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        setToast({ message: 'Failed to load settings', type: 'error' });
        setLoading(false);
      });
  }, []);

  // Handler perubahan untuk nested settings
  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  // Simpan ke backend
  const handleSave = async () => {
    try {
      setValidationIssues([]);
      // Normalize payload to match server Zod schema expectations
      const normalized: any = {
        general: {
          siteName: String(settings?.general?.siteName || '').trim(),
          siteDescription: String(settings?.general?.siteDescription || '').trim(),
          contactEmail: settings?.general?.contactEmail == null ? '' : String(settings?.general?.contactEmail).trim(),
          timezone: String(settings?.general?.timezone || 'Asia/Jakarta'),
          language: String(settings?.general?.language || 'en'),
          defaultQRSize: Number(settings?.general?.defaultQRSize) || 300,
          maxQRSize: Number(settings?.general?.maxQRSize) || 1000,
          defaultFormat: String(settings?.general?.defaultFormat || 'PNG'),
          enableBranding: !!settings?.general?.enableBranding
        },
        security: {
          twoFactorAuth: !!settings?.security?.twoFactorAuth,
          passwordStrength: String(settings?.security?.passwordStrength || 'medium'),
          sessionTimeout: Number(settings?.security?.sessionTimeout) || 60,
          apiRateLimit: Number(settings?.security?.apiRateLimit) || 1000
        },
        analytics: {
          realTimeTracking: !!settings?.analytics?.realTimeTracking,
          geoLocation: !!settings?.analytics?.geoLocation,
          dataRetention: Number(settings?.analytics?.dataRetention) || 365,
          cookieConsent: !!settings?.analytics?.cookieConsent
        },
        notifications: {
          emailNotifications: !!settings?.notifications?.emailNotifications,
          smsNotifications: !!settings?.notifications?.smsNotifications,
          pushNotifications: !!settings?.notifications?.pushNotifications
        },
        integration: {
          googleAnalytics: {
            enabled: !!settings?.integration?.googleAnalytics?.enabled,
            trackingId: String(settings?.integration?.googleAnalytics?.trackingId || '').trim().toUpperCase()
          }
        }
      };

      // Quick client-side validation to catch common mistakes
      const clientIssues: Array<{ path: string; message: string }> = [];
      if (!normalized.general.siteName) clientIssues.push({ path: 'general.siteName', message: 'Site Name is required' });
      if (normalized.general.maxQRSize < normalized.general.defaultQRSize) clientIssues.push({ path: 'general.maxQRSize', message: 'maxQRSize must be >= defaultQRSize' });
      if (normalized.security.sessionTimeout < 1 || normalized.security.sessionTimeout > 24 * 60) clientIssues.push({ path: 'security.sessionTimeout', message: 'sessionTimeout must be between 1 and 1440 minutes' });
      if (normalized.security.apiRateLimit < 10 || normalized.security.apiRateLimit > 100000) clientIssues.push({ path: 'security.apiRateLimit', message: 'apiRateLimit must be between 10 and 100000' });
      if (normalized.analytics.dataRetention < 1 || normalized.analytics.dataRetention > 3650) clientIssues.push({ path: 'analytics.dataRetention', message: 'dataRetention must be between 1 and 3650 days' });

      if (clientIssues.length > 0) {
        setValidationIssues(clientIssues);
        setToast({ message: 'Validation failed', type: 'error' });
        return;
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized)
      });
      if (res.status === 422) {
        const data = await res.json().catch(() => ({}));
        const issues = Array.isArray(data?.issues) ? data.issues.map((i: any) => ({ path: (i.path || []).join?.('.') || i.path || '(root)', message: i.message })) : [];
        setValidationIssues(issues);
        setToast({ message: 'Validation failed', type: 'error' });
        return;
      }
      if (!res.ok) {
        setToast({ message: 'Failed to save settings!', type: 'error' });
        return;
      }
      const payload = await res.json();
      setSettings(payload?.settings || settings);
      setToast({ message: 'Settings saved successfully!', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to save settings!', type: 'error' });
    }
  };

  // Clear analytics & toast
  const handleClearAnalytics = () => {
    if (window.confirm('Are you sure you want to clear all analytics data? This action cannot be undone.')) {
      clearScanEvents();
      clearClickEvents();
      setToast({ message: 'Analytics data has been cleared successfully.', type: 'success' });
    }
  };

  if (loading || !settings)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading settings...</p>
        </div>
      </div>
    );

  return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      {validationIssues.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 p-4 shadow-sm">
          <h3 className="text-red-700 dark:text-red-300 font-semibold mb-2">Validation Errors</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-red-700 dark:text-red-300">
            {validationIssues.map((v, idx) => (
              <li key={idx}><span className="font-mono text-xs bg-red-100 dark:bg-red-800/60 px-1 py-0.5 rounded mr-1">{v.path}</span>{v.message}</li>
            ))}
          </ul>
        </div>
      )}
  <div className="max-w-7xl mx-auto space-y-6">
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Modern Header with Glassmorphism */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="p-3 bg-gray-700 dark:bg-gray-600 rounded-xl">
                    <CogSolidIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                    System Settings
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-lg mt-2">
                    Configure and customize your QR code management system
                  </p>
                  <div className="flex items-center space-x-6 mt-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <ShieldCheckIcon className="h-4 w-4" />
                      <span>Security</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <ChartBarIcon className="h-4 w-4" />
                      <span>Analytics</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <BellIcon className="h-4 w-4" />
                      <span>Notifications</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <SparklesIcon className="h-6 w-6 text-indigo-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Advanced Configuration
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Settings Grid */}
  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* General Settings */}
          <div className="group">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-4 mb-8">
                <div className="relative">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <CogSolidIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">General Settings</h3>
                  <p className="text-gray-600 dark:text-gray-400">Basic system configuration</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Site Name</label>
                  <input
                    type="text"
                    value={settings?.general?.siteName || ''}
                    onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                    placeholder="Enter your site name..."
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50  border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Site Description</label>
                  <input
                    type="text"
                    value={settings?.general?.siteDescription || ''}
                    onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
                    placeholder="Describe your site..."
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50  border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Contact Email</label>
                  <input
                    type="email"
                    value={settings?.general?.contactEmail || ''}
                    onChange={(e) => handleSettingChange('general', 'contactEmail', e.target.value)}
                    placeholder="admin@yoursite.com"
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50  border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Timezone</label>
                  <select
                    value={settings?.general?.timezone || 'Asia/Jakarta'}
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50  border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
                  >
                    <option value="Asia/Jakarta">Asia/Jakarta</option>
                    <option value="Asia/Makassar">Asia/Makassar</option>
                    <option value="Asia/Jayapura">Asia/Jayapura</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Language</label>
                  <select
                    value={settings?.general?.language || 'en'}
                    onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50  border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="id">Indonesia</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="group">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center space-x-4 mb-8">
                <div className="relative">
                  <div className="p-2 bg-red-500 rounded-lg">
                    <ShieldSolidIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Security Settings</h3>
                  <p className="text-gray-600 dark:text-gray-400">Protect your system and data</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 rounded-2xl border border-red-200/50 dark:border-red-800/50">
                  <input
                    type="checkbox"
                    id="twoFactorAuth"
                    checked={!!settings?.security?.twoFactorAuth}
                    onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                    className="h-5 w-5 text-red-600 focus:ring-red-500 border-gray-300 rounded-lg"
                  />
                  <div className="flex-1">
                    <label htmlFor="twoFactorAuth" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Two-Factor Authentication
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enhanced login security</p>
                  </div>
                  <ShieldCheckIcon className="h-5 w-5 text-red-500" />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Password Strength</label>
                    <select
                      value={settings?.security?.passwordStrength || 'medium'}
                      onChange={(e) => handleSettingChange('security', 'passwordStrength', e.target.value)}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50 border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
                    >
                      <option value="weak">Weak</option>
                      <option value="medium">Medium</option>
                      <option value="strong">Strong</option>
                    </select>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    min={1}
                    value={settings?.security?.sessionTimeout || 60}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50  border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">API Rate Limit (requests/hour)</label>
                  <input
                    type="number"
                    min={1}
                    value={settings?.security?.apiRateLimit || 1000}
                    onChange={(e) => handleSettingChange('security', 'apiRateLimit', Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50  border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Settings */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-teal-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-white/70 dark:bg-gray-800/70  border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-4 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl blur-lg opacity-30"></div>
                  <div className="relative bg-gradient-to-r from-green-500 to-teal-600 p-3 rounded-2xl">
                    <EyeSolidIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Settings</h3>
                  <p className="text-gray-600 dark:text-gray-400">Data tracking and insights</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/30 dark:to-teal-900/30 rounded-2xl border border-green-200/50 dark:border-green-800/50">
                  <input
                    type="checkbox"
                    id="realTimeTracking"
                    checked={!!settings?.analytics?.realTimeTracking}
                    onChange={(e) => handleSettingChange('analytics', 'realTimeTracking', e.target.checked)}
                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded-lg"
                  />
                  <div className="flex-1">
                    <label htmlFor="realTimeTracking" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Real-time Tracking
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Track user interactions in real time</p>
                  </div>
                  <ChartBarIcon className="h-5 w-5 text-green-500" />
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/30 dark:to-teal-900/30 rounded-2xl border border-green-200/50 dark:border-green-800/50">
                  <input
                    type="checkbox"
                    id="geoLocation"
                    checked={!!settings?.analytics?.geoLocation}
                    onChange={(e) => handleSettingChange('analytics', 'geoLocation', e.target.checked)}
                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded-lg"
                  />
                  <div className="flex-1">
                    <label htmlFor="geoLocation" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Geo Location Tracking
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Track user location data</p>
                  </div>
                  <GlobeAltIcon className="h-5 w-5 text-green-500" />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Data Retention (days)</label>
                  <input
                    type="number"
                    min={1}
                    value={settings?.analytics?.dataRetention || 365}
                    onChange={(e) => handleSettingChange('analytics', 'dataRetention', Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50  border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/30 dark:to-teal-900/30 rounded-2xl border border-green-200/50 dark:border-green-800/50">
                  <input
                    type="checkbox"
                    id="cookieConsent"
                    checked={!!settings?.analytics?.cookieConsent}
                    onChange={(e) => handleSettingChange('analytics', 'cookieConsent', e.target.checked)}
                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded-lg"
                  />
                  <div className="flex-1">
                    <label htmlFor="cookieConsent" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Cookie Consent
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Privacy protection</p>
                  </div>
                  <EyeIcon className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-white/70 dark:bg-gray-800/70  border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-4 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur-lg opacity-30"></div>
                  <div className="relative bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-2xl">
                    <BellSolidIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notification Settings</h3>
                  <p className="text-gray-600 dark:text-gray-400">Alerts and communications</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl border border-purple-200/50 dark:border-purple-800/50">
                  <input
                    type="checkbox"
                    id="emailNotifications"
                    checked={!!settings?.notifications?.emailNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded-lg"
                  />
                  <div className="flex-1">
                    <label htmlFor="emailNotifications" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Email Notifications
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">System updates via email</p>
                  </div>
                  <BellIcon className="h-5 w-5 text-purple-500" />
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl border border-purple-200/50 dark:border-purple-800/50">
                  <input
                    type="checkbox"
                    id="scanAlerts"
                    checked={!!settings?.notifications?.smsNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded-lg"
                  />
                  <div className="flex-1">
                    <label htmlFor="scanAlerts" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Real-time Scan Alerts
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Instant QR scan notifications</p>
                  </div>
                  <ComputerDesktopIcon className="h-5 w-5 text-purple-500" />
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl border border-purple-200/50 dark:border-purple-800/50">
                  <input
                    type="checkbox"
                    id="weeklyReports"
                    checked={!!settings?.notifications?.pushNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded-lg"
                  />
                  <div className="flex-1">
                    <label htmlFor="weeklyReports" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Weekly Analytics Reports
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Automated weekly summaries</p>
                  </div>
                  <DocumentTextIcon className="h-5 w-5 text-purple-500" />
                </div>
              </div>
            </div>
          </div>

          {/* API Settings */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-white/70 dark:bg-gray-800/70  border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-4 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl blur-lg opacity-30"></div>
                  <div className="relative bg-gradient-to-r from-yellow-500 to-orange-600 p-3 rounded-2xl">
                    <KeySolidIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">API Settings</h3>
                  <p className="text-gray-600 dark:text-gray-400">External access configuration</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-2xl border border-yellow-200/50 dark:border-yellow-800/50">
                  <input
                    type="checkbox"
                    id="enableApi"
                    checked={settings?.integration?.googleAnalytics?.enabled}
                    onChange={(e) => handleSettingChange('integration', 'googleAnalytics', {...settings?.integration?.googleAnalytics, enabled: e.target.checked})}
                    className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded-lg"
                  />
                  <div className="flex-1">
                    <label htmlFor="enableApi" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Enable API Access
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Allow external integrations</p>
                  </div>
                  <KeyIcon className="h-5 w-5 text-yellow-500" />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">API Rate Limit (requests/hour)</label>
                  <input
                    type="number"
                    min={1}
                    value={settings?.security?.apiRateLimit}
                    onChange={(e) => handleSettingChange('security', 'apiRateLimit', Math.max(1, Number(e.target.value)))}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50  border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Settings */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative bg-white/70 dark:bg-gray-800/70  border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center space-x-4 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-600 rounded-2xl blur-lg opacity-30"></div>
                  <div className="relative bg-gradient-to-r from-indigo-500 to-cyan-600 p-3 rounded-2xl">
                    <GlobeSolidIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">QR Code Settings</h3>
                  <p className="text-gray-600 dark:text-gray-400">QR generation preferences</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Default QR Size (pixels)</label>
                    <input
                      type="number"
                      min={1}
                      value={settings?.general?.defaultQRSize}
                      onChange={(e) => handleSettingChange('general', 'defaultQRSize', Math.max(1, Number(e.target.value)))}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50  border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Max QR Size (pixels)</label>
                    <input
                      type="number"
                      min={settings?.general?.defaultQRSize}
                      value={settings?.general?.maxQRSize}
                      onChange={(e) => handleSettingChange('general', 'maxQRSize', Math.max(settings?.general?.defaultQRSize, Number(e.target.value)))}
                      className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50  border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Default Format</label>
                  <select
                    value={settings?.general?.defaultFormat}
                    onChange={(e) => handleSettingChange('general', 'defaultFormat', e.target.value)}
                    className="w-full px-4 py-3 bg-white/50 dark:bg-gray-700/50  border border-gray-200/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
                  >
                    <option value="PNG">PNG</option>
                    <option value="JPG">JPG</option>
                    <option value="SVG">SVG</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-indigo-50 to-cyan-50 dark:from-indigo-900/30 dark:to-cyan-900/30 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/50">
                  <input
                    type="checkbox"
                    id="enableBranding"
                    checked={settings?.general?.enableBranding}
                    onChange={(e) => handleSettingChange('general', 'enableBranding', e.target.checked)}
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded-lg"
                  />
                  <div className="flex-1">
                    <label htmlFor="enableBranding" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Enable White-label Branding
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Custom branding options</p>
                  </div>
                  <SparklesIcon className="h-5 w-5 text-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Analytics Management */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-500/20 to-slate-500/20 rounded-3xl blur-xl"></div>
          <div className="relative bg-white/70 dark:bg-gray-800/70  border border-white/20 dark:border-gray-700/30 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center space-x-4 mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-slate-600 rounded-2xl blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-r from-gray-500 to-slate-600 p-3 rounded-2xl">
                  <EyeSolidIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Management</h3>
                <p className="text-gray-600 dark:text-gray-400">Manage your tracking data and analytics history</p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/30 dark:to-orange-900/30 rounded-2xl p-6 border border-red-200/50 dark:border-red-800/50">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-xl">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Clear Analytics Data</h4>
                  <p className="text-red-700 dark:text-red-300 mb-4 leading-relaxed">
                    This action will permanently delete all scan tracking data, analytics history, and user interaction records. 
                    This operation cannot be undone and will reset all your analytics dashboards.
                  </p>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleClearAnalytics}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span>Clear All Analytics Data</span>
                    </button>
                    <div className="text-xs text-red-600 dark:text-red-400">
                      ⚠️ This action is irreversible
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Save Button */}
        <div className="flex justify-end">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <button
              onClick={handleSave}
              className="relative flex items-center space-x-3 px-10 py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <CheckIcon className="h-5 w-5" />
              <span>Save All Settings</span>
              <SparklesIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
