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
  const res = await apiClient.get('/settings');
  return res.settings;
};

// Update settings user (PUT /api/settings)
const updateSettings = async (settings: Partial<UserSettings>): Promise<UserSettings> => {
  const res = await apiClient.put('/settings', settings);
  return res.settings;
};

export const settingsService = {
  getSettings,
  updateSettings,
};
