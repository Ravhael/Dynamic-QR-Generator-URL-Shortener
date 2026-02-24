"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Layout } from "@/components/Layout/PermissionControlledLayout"
import { 
  Cog6ToothIcon,
  ShieldCheckIcon,
  Cog8ToothIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { useToast } from '@/hooks/use-toast'
import { useSystemSettings } from '@/hooks/useSystemSettings'

interface LogoUploaderProps {
  value: string
  onChange: (val: string) => void
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ value, onChange }) => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = async (file: File) => {
    setError(null)
    if (!file) return
    if (file.size > 1024 * 1024) { // 1MB
      setError('File too large (max 1MB)')
      return
    }
    const form = new FormData()
    form.append('file', file)
    setUploading(true)
    try {
      const res = await fetch('/api/admin/branding/logo', { method: 'POST', body: form })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Upload failed')
      }
      const data = await res.json()
      onChange(data.path)
    } catch (e: any) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="w-56 space-y-2">
      <div className="flex items-center space-x-2">
        <button
          type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center px-3 py-2 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            disabled={uploading}
        >
          {uploading ? 'Uploading...' : value ? 'Change Logo' : 'Upload Logo'}
        </button>
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Logo" className="h-8 w-auto rounded border border-gray-200 dark:border-gray-700 bg-white p-1" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/svg+xml,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      <div className="flex items-center space-x-2">
        {value && !uploading && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-red-600 hover:underline"
          >Remove</button>
        )}
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    </div>
  )
}

export default function SystemSettingsPage() {
  const { toast } = useToast();
  const { settings: serverSettings, bulkSave, loading } = useSystemSettings();
  const [settings, setSettings] = useState({
    require2FA: true,
    sessionTimeout: '1 hour',
    autoDeleteExpired: false,
    dataRetention: '1 year',
    enableRegistration: false,
    enableApiAccess: true,
    maxUploadSize: '10MB',
    enableEmailNotifications: true,
    maintenanceMode: false,
    site_name: 'Scanly',
    logo: ''
  });

  // Sync from server (one-way bootstrap)
  useEffect(() => {
    if (!serverSettings || Object.keys(serverSettings).length === 0) return;
    setSettings(prev => ({
      ...prev,
      require2FA: serverSettings.security?.require2FA?.value ?? prev.require2FA,
      sessionTimeout: serverSettings.security?.sessionTimeout?.value ?? prev.sessionTimeout,
      autoDeleteExpired: serverSettings.data?.autoDeleteExpired?.value ?? prev.autoDeleteExpired,
      dataRetention: serverSettings.data?.dataRetention?.value ?? prev.dataRetention,
      enableRegistration: serverSettings.security?.enableRegistration?.value ?? prev.enableRegistration,
      enableApiAccess: serverSettings.api?.enableApiAccess?.value ?? prev.enableApiAccess,
      maxUploadSize: serverSettings.data?.maxUploadSize?.value ?? prev.maxUploadSize,
      enableEmailNotifications: serverSettings.notifications?.enableEmailNotifications?.value ?? prev.enableEmailNotifications,
      maintenanceMode: serverSettings.maintenance?.maintenanceMode?.value ?? prev.maintenanceMode,
      // Backward compatibility: accept camelCase if existing, but prefer snake_case
      site_name: serverSettings.branding?.site_name?.value ?? serverSettings.branding?.siteName?.value ?? prev.site_name,
      logo: serverSettings.branding?.logo?.value ?? serverSettings.branding?.siteLogo?.value ?? prev.logo,
    }))
  }, [serverSettings])

  const handleSettingChange = (key: string, value: string | boolean | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const buildPayload = () => ({
    security: {
      require2FA: { value: settings.require2FA },
      sessionTimeout: { value: settings.sessionTimeout },
      enableRegistration: { value: settings.enableRegistration },
    },
    data: {
      autoDeleteExpired: { value: settings.autoDeleteExpired },
      dataRetention: { value: settings.dataRetention },
      maxUploadSize: { value: settings.maxUploadSize },
    },
    api: { enableApiAccess: { value: settings.enableApiAccess } },
    notifications: { enableEmailNotifications: { value: settings.enableEmailNotifications } },
    maintenance: { maintenanceMode: { value: settings.maintenanceMode } }
    ,branding: { site_name: { value: settings.site_name }, logo: { value: settings.logo } }
  })

  const saveAll = async () => {
    if (loading) return
    const ok = await bulkSave(buildPayload() as any)
    toast({
      title: ok ? 'Success' : 'Failed',
      description: ok ? 'System settings saved successfully!' : 'Failed to save settings',
      ...(ok ? {} : { variant: 'destructive' as any })
    })
  }

  return (
    <Layout usePermissionAwareSidebar={true}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Cog6ToothIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Settings
          </h1>
        </div>

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
                  disabled={loading}
                  onClick={saveAll}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save All Settings'}
                </button>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <ShieldCheckIcon className="h-6 w-6 text-red-500 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Security & Authentication</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Require 2FA for Administrators</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Force two-factor authentication for admin accounts</p>
                  </div>
                  <button 
                    onClick={() => handleSettingChange('require2FA', !settings.require2FA)}
                    className={`${settings.require2FA ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  >
                    <span className={`${settings.require2FA ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Session Timeout</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Automatically log out users after inactivity</p>
                  </div>
                  <select 
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                    className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Public Registration</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Allow new users to register accounts</p>
                  </div>
                  <button 
                    onClick={() => handleSettingChange('enableRegistration', !settings.enableRegistration)}
                    className={`${settings.enableRegistration ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  >
                    <span className={`${settings.enableRegistration ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Branding & Appearance (moved below System Settings card) */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <Cog6ToothIcon className="h-6 w-6 text-indigo-500 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Branding & Appearance</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Site Name</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name displayed in header and meta.</p>
                  </div>
                  <input
                    type="text"
                    value={settings.site_name}
                    onChange={(e) => handleSettingChange('site_name', e.target.value)}
                    className="mt-1 block w-56 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                    placeholder="Enter site name"
                  />
                </div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Logo</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Upload a logo (PNG, JPG, SVG, WEBP, max 1MB). Auto‑generates favicon.</p>
                  </div>
                  <LogoUploader value={settings.logo} onChange={(val) => handleSettingChange('logo', val)} />
                </div>
              </div>
            </div>
          </div>

          {/* Data Management Settings */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <Cog8ToothIcon className="h-6 w-6 text-blue-500 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Data Management</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-delete expired QR codes</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Automatically remove QR codes after expiration</p>
                  </div>
                  <button 
                    onClick={() => handleSettingChange('autoDeleteExpired', !settings.autoDeleteExpired)}
                    className={`${settings.autoDeleteExpired ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  >
                    <span className={`${settings.autoDeleteExpired ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Retention Period</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">How long to keep analytics and log data</p>
                  </div>
                  <select 
                    value={settings.dataRetention}
                    onChange={(e) => handleSettingChange('dataRetention', e.target.value)}
                    className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Maximum Upload Size</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Maximum file size for image uploads</p>
                  </div>
                  <select 
                    value={settings.maxUploadSize}
                    onChange={(e) => handleSettingChange('maxUploadSize', e.target.value)}
                    className="mt-1 block w-32 pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
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
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <KeyIcon className="h-6 w-6 text-green-500 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">API & Integration</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable API Access</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Allow external applications to use the API</p>
                  </div>
                  <button 
                    onClick={() => handleSettingChange('enableApiAccess', !settings.enableApiAccess)}
                    className={`${settings.enableApiAccess ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  >
                    <span className={`${settings.enableApiAccess ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Notifications</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Send system notifications via email</p>
                  </div>
                  <button 
                    onClick={() => handleSettingChange('enableEmailNotifications', !settings.enableEmailNotifications)}
                    className={`${settings.enableEmailNotifications ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
                  >
                    <span className={`${settings.enableEmailNotifications ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* System Maintenance */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mr-2" />
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">System Maintenance</h3>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Maintenance Mode</label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {settings.maintenanceMode ? 
                        'System is currently in maintenance mode' : 
                        'System is running normally'
                      }
                    </p>
                  </div>
                  <button 
                    onClick={() => handleSettingChange('maintenanceMode', !settings.maintenanceMode)}
                    className={`${settings.maintenanceMode ? 'bg-yellow-600' : 'bg-gray-200 dark:bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2`}
                  >
                    <span className={`${settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}></span>
                  </button>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                      Run System Check
                    </button>
                    <button className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Clear Cache
                    </button>
                    <button className="inline-flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-600 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                      Export System Logs
                    </button>
                    <button className="inline-flex items-center justify-center px-4 py-2 border border-red-300 dark:border-red-600 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-300 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
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
              type="button"
              disabled={loading}
              onClick={saveAll}
              className={"inline-flex items-center px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform " + (loading ? 'opacity-60 cursor-not-allowed bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 hover:scale-105')}
            >
              <span className="mr-2">💾</span>
              {loading ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}