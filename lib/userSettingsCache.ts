import { prisma } from '@/lib/prisma';

interface CacheEntry<T> { value: T; expires: number }
const TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry<any>>();

export interface UserSettingsRow {
  user_id: string;
  site_name?: string | null;
  site_description?: string | null;
  contact_email?: string | null;
  timezone?: string | null;
  language?: string | null;
  default_qr_size?: number | null;
  max_qr_size?: number | null;
  default_format?: string | null;
  enable_branding?: boolean | null;
  enable_two_factor?: boolean | null;
  password_strength?: string | null;
  session_timeout?: number | null; // minutes or seconds depending (spec uses minutes?)
  api_rate_limit?: number | null;
  enable_analytics?: boolean | null;
  geo_location?: boolean | null;
  data_retention_days?: number | null;
  anonymize_ip_addresses?: boolean | null;
  email_notifications?: boolean | null;
  sms_notifications?: boolean | null;
  scan_alerts?: boolean | null;
  google_analytics_enabled?: boolean | null;
  google_analytics_id?: string | null;
  custom_settings?: any;
}

const DEFAULTS: Partial<UserSettingsRow> = {
  enable_two_factor: false,
  password_strength: 'medium',
  session_timeout: 60,
  api_rate_limit: 1000,
  enable_analytics: true,
  geo_location: true,
  data_retention_days: 365,
  anonymize_ip_addresses: false,
  email_notifications: true,
  sms_notifications: false,
  scan_alerts: true,
  enable_branding: false,
};

export async function getUserSettings(userId: string): Promise<UserSettingsRow | null> {
  const now = Date.now();
  const key = userId;
  const existing = cache.get(key);
  if (existing && existing.expires > now) return existing.value;

  const row = await prisma.user_settings.findFirst({ where: { user_id: userId } }) as any;
  if (!row) return null;
  cache.set(key, { value: row, expires: now + TTL_MS });
  return row;
}

export async function getEffectiveUserSettings(userId: string): Promise<UserSettingsRow> {
  const raw = await getUserSettings(userId);
  return { ...DEFAULTS, ...(raw || {}), user_id: userId } as UserSettingsRow;
}

export function invalidateUserSettings(userId: string) {
  cache.delete(userId);
}

export function clearUserSettingsCache() { cache.clear(); }

export function getCachedUserSettings(userId: string): UserSettingsRow | null {
  const entry = cache.get(userId); if (!entry) return null; if (entry.expires < Date.now()) { cache.delete(userId); return null; } return entry.value;
}
