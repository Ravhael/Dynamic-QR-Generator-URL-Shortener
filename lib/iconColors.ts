// Centralized palette for sidebar/menu icons so every menu family has a consistent accent color.

const CORE_COLOR_MAP: Record<string, string> = {
  dashboard: "text-sky-600",
  home: "text-sky-600",
  profile: "text-sky-600",
  reports: "text-rose-600",
  notifications: "text-amber-500",
  administrator: "text-indigo-600",
  'admin-panel': "text-indigo-600",
  users: "text-cyan-600",
  groups: "text-cyan-600",
  'menu-settings': "text-indigo-600",
  'system-settings': "text-indigo-600",
  settings: "text-indigo-600",
  'permissions-roles': "text-red-500",
  'scan-click-activity': "text-blue-500",
  'user-activity': "text-blue-500",
};

const QR_IDS = new Set([
  'qrcode',
  'qr-code',
  'qr-management',
  'qr-codes',
  'qr-analytics',
  'qr-detailed-analytics',
  'qr-categories',
  'qr-migration',
]);

const URL_IDS = new Set([
  'url',
  'url-list',
  'generate-url',
  'url-analytics',
  'url-detailed-analytics',
  'url-categories',
  'url-management',
]);

const DEFAULT_ICON_COLOR = "text-slate-600";

const COLOR_RULES: Array<{ match: (id: string) => boolean; color: string }> = [
  { match: id => QR_IDS.has(id) || id.startsWith('qr-'), color: "text-violet-600" },
  { match: id => id.includes('generate') && id.includes('qr'), color: "text-sky-600" },
  { match: id => URL_IDS.has(id) || id.includes('url'), color: "text-emerald-600" },
  { match: id => id.includes('notification'), color: "text-amber-500" },
  { match: id => id.includes('report') || id.includes('analytics'), color: "text-rose-600" },
  { match: id => id.includes('setting') || id.includes('system') || id.includes('menu'), color: "text-indigo-600" },
  { match: id => id.includes('admin') || id.includes('permission') || id.includes('role'), color: "text-indigo-600" },
  { match: id => id.includes('group') || id.includes('user'), color: "text-cyan-600" },
];

export function getMenuIconClass(menuId?: string | null) {
  if (!menuId) return DEFAULT_ICON_COLOR;
  const key = String(menuId).trim().toLowerCase();
  if (!key) return DEFAULT_ICON_COLOR;

  if (CORE_COLOR_MAP[key]) {
    return CORE_COLOR_MAP[key];
  }

  const ruleMatch = COLOR_RULES.find(rule => rule.match(key));
  if (ruleMatch) {
    return ruleMatch.color;
  }

  return DEFAULT_ICON_COLOR;
}

export default getMenuIconClass;
