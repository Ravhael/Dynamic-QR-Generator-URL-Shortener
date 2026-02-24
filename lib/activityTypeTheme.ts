// Central mapping for activity type icons & colors
// UI components should import from here instead of hardcoding

export interface ActivityTypeTheme {
  icon: string
  color: string
  priority?: number
}

// Base defaults if code not explicitly mapped
export const DEFAULT_ACTIVITY_THEME: ActivityTypeTheme = {
  icon: 'Activity',
  color: '#3B82F6',
  priority: 100
};

// Mapping by activity_types.code (UPPER CASE)
export const ACTIVITY_TYPE_THEMES: Record<string, ActivityTypeTheme> = {
  LOGIN: { icon: 'LogIn', color: '#3B82F6', priority: 10 },
  LOGOUT: { icon: 'LogOut', color: '#6B7280', priority: 90 },
  FAILED_LOGIN: { icon: 'ShieldAlert', color: '#EF4444', priority: 15 },
  PASSWORD_CHANGE: { icon: 'KeyRound', color: '#6366F1', priority: 20 },
  USER_CREATE: { icon: 'UserPlus', color: '#10B981', priority: 30 },
  USER_UPDATE: { icon: 'UserCog', color: '#F59E0B', priority: 40 },
  USER_DEACTIVATE: { icon: 'UserX', color: '#DC2626', priority: 45 },
  GROUP_CREATE: { icon: 'FolderPlus', color: '#10B981', priority: 50 },
  GROUP_UPDATE: { icon: 'FolderCog', color: '#F59E0B', priority: 55 },
  GROUP_ASSIGN: { icon: 'UserCheck', color: '#3B82F6', priority: 56 },
  QR_CREATE: { icon: 'QrCode', color: '#10B981', priority: 60 },
  QR_UPDATE: { icon: 'QrCodeEdit', color: '#F59E0B', priority: 65 },
  QR_SCAN: { icon: 'Scan', color: '#6366F1', priority: 66 },
  URL_CREATE: { icon: 'LinkPlus', color: '#10B981', priority: 70 },
  URL_CLICK: { icon: 'MousePointerClick', color: '#6366F1', priority: 71 },
  SETTINGS_UPDATE: { icon: 'Settings', color: '#F59E0B', priority: 80 },
  PERMISSION_UPDATE: { icon: 'ShieldCheck', color: '#6366F1', priority: 85 }
};

export function getActivityTheme(code?: string): ActivityTypeTheme {
  if (!code) return DEFAULT_ACTIVITY_THEME;
  return ACTIVITY_TYPE_THEMES[code.toUpperCase()] || DEFAULT_ACTIVITY_THEME;
}
