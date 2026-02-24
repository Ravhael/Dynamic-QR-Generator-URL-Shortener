import apiClient from './apiClient';

export interface UserSettings {
  siteName: string;
  siteUrl: string;
  defaultCategory: string;
  allowPublicRegistration: boolean;

  requireSSL: boolean;
  enableTwoFactor: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;

  enableAnalytics: boolean;
  dataRetentionDays: number;
  anonymizeIpAddresses: boolean;

  emailNotifications: boolean;
  scanAlerts: boolean;
  weeklyReports: boolean;

  enableApi: boolean;
  apiRateLimit: number;

  defaultQRSize: number;
  maxQRSize: number;
  defaultFormat: string;
  enableBranding: boolean;
}

// Ambil settings user (GET /api/settings)
const getSettings = async (): Promise<UserSettings> => {
  const res = await apiClient.get('/api/settings');
  return res.data;
};

// Update settings user (PUT /api/settings)
const updateSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  try {
    const res = await apiClient.put('/api/settings', settings);
    return (res.data?.settings || res.data) as UserSettings;
  } catch (e) {
    // Fallback to POST for backward compatibility
    const res = await apiClient.post('/api/settings', settings);
    return (res.data?.settings || res.data) as UserSettings;
  }
};

export const settingsService = {
  getSettings,
  updateSettings,
};
