'use client';

import React, { useState } from 'react';
import { 
  ShieldCheckIcon,
  Cog8ToothIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/use-toast';

const SystemSettingsTab: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    require2FA: true,
    sessionTimeout: '1 hour',
    autoDeleteExpired: false,
    dataRetention: '1 year',
    enableRegistration: false,
    enableApiAccess: true,
    maxUploadSize: '10MB',
    enableEmailNotifications: true,
    maintenanceMode: false
  });

  const handleSettingChange = (key: string, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Configure system-wide settings, security, and operational preferences.
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Save All Settings
            </button>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <ShieldCheckIcon className="h-6 w-6 text-red-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">Security & Authentication</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Require 2FA for Administrators</label>
                <p className="text-sm text-gray-500">Force two-factor authentication for admin accounts</p>
              </div>
              <button 
                onClick={() => handleSettingChange('require2FA', !settings.require2FA)}
                className={`${settings.require2FA ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span className={`${settings.require2FA ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Session Timeout</label>
                <p className="text-sm text-gray-500">Automatically log out users after inactivity</p>
              </div>
              <select 
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option>30 minutes</option>
                <option>1 hour</option>
                <option>4 hours</option>
                <option>8 hours</option>
                <option>24 hours</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable Public Registration</label>
                <p className="text-sm text-gray-500">Allow new users to register accounts</p>
              </div>
              <button 
                onClick={() => handleSettingChange('enableRegistration', !settings.enableRegistration)}
                className={`${settings.enableRegistration ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span className={`${settings.enableRegistration ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <Cog8ToothIcon className="h-6 w-6 text-blue-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">Data Management</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Auto-delete expired QR codes</label>
                <p className="text-sm text-gray-500">Automatically remove QR codes after expiration</p>
              </div>
              <button 
                onClick={() => handleSettingChange('autoDeleteExpired', !settings.autoDeleteExpired)}
                className={`${settings.autoDeleteExpired ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span className={`${settings.autoDeleteExpired ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Data Retention Period</label>
                <p className="text-sm text-gray-500">How long to keep analytics and log data</p>
              </div>
              <select 
                value={settings.dataRetention}
                onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option>3 months</option>
                <option>6 months</option>
                <option>1 year</option>
                <option>2 years</option>
                <option>Forever</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Maximum Upload Size</label>
                <p className="text-sm text-gray-500">Maximum file size for image uploads</p>
              </div>
              <select 
                value={settings.maxUploadSize}
                onChange={(e) => handleSettingChange('maxUploadSize', e.target.value)}
                className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option>5MB</option>
                <option>10MB</option>
                <option>25MB</option>
                <option>50MB</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* API & Integration Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <KeyIcon className="h-6 w-6 text-green-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">API & Integration</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable API Access</label>
                <p className="text-sm text-gray-500">Allow external applications to use the API</p>
              </div>
              <button 
                onClick={() => handleSettingChange('enableApiAccess', !settings.enableApiAccess)}
                className={`${settings.enableApiAccess ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span className={`${settings.enableApiAccess ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                <p className="text-sm text-gray-500">Send system notifications via email</p>
              </div>
              <button 
                onClick={() => handleSettingChange('enableEmailNotifications', !settings.enableEmailNotifications)}
                className={`${settings.enableEmailNotifications ? 'bg-indigo-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span className={`${settings.enableEmailNotifications ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Maintenance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">System Maintenance</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                <p className="text-sm text-gray-500">
                  {settings.maintenanceMode ? 
                    'System is currently in maintenance mode' : 
                    'System is running normally'
                  }
                </p>
              </div>
              <button 
                onClick={() => handleSettingChange('maintenanceMode', !settings.maintenanceMode)}
                className={`${settings.maintenanceMode ? 'bg-yellow-600' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2`}
              >
                <span className={`${settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
              </button>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Run System Check
                </button>
                <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Clear Cache
                </button>
                <button className="inline-flex items-center justify-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Export System Logs
                </button>
                <button className="inline-flex items-center justify-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                  Backup Database
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Save Settings Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => {
            toast({
              title: "Success",
              description: "System settings saved successfully!",
            });
          }}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <span className="mr-2">💾</span>
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SystemSettingsTab;