import { getAllSettings } from '@/lib/services/systemSettingsService'

/**
 * Normalized shape consumed by runtime logic.
 * Keep everything typed & already parsed to primitive/usable forms.
 */
export interface SystemConfig {
  maintenanceMode: boolean
  enableRegistration: boolean
  require2FA: boolean
  enableApiAccess: boolean
  enableEmailNotifications: boolean
  // timeouts in seconds
  sessionTimeoutSeconds: number
  // retention in days
  dataRetentionDays: number
  // size in bytes
  maxUploadSizeBytes: number
}

let cache: { value: SystemConfig; loadedAt: number } | null = null
const CACHE_TTL_MS = 60_000 // 1 minute (adjust later if needed)

// Helpers ----------------------------------------------------
function parseBoolean(val: any, fallback = false): boolean {
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') return ['true', '1', 'yes', 'on'].includes(val.toLowerCase())
  if (typeof val === 'number') return val === 1
  return fallback
}

function parseDurationToSeconds(raw: any, fallbackSeconds: number): number {
  if (raw == null) return fallbackSeconds
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw
  if (typeof raw === 'string') {
    const lower = raw.trim().toLowerCase()
    // Common patterns: '1h', '1 hour', '60m', '30m', '3600', '45 min'
    if (/^\d+$/.test(lower)) return Number(lower)
    const num = Number(lower.replace(/[^0-9.]/g, ''))
    if (Number.isNaN(num) || num <= 0) return fallbackSeconds
    if (lower.includes('hour') || lower.endsWith('h')) return Math.round(num * 3600)
    if (lower.includes('min') || lower.endsWith('m')) return Math.round(num * 60)
    if (lower.includes('sec') || lower.endsWith('s')) return Math.round(num)
  }
  return fallbackSeconds
}

function parseSizeToBytes(raw: any, fallback: number): number {
  if (raw == null) return fallback
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw
  if (typeof raw === 'string') {
    const m = raw.trim().toUpperCase().match(/^(\d+(?:\.\d+)?)(B|KB|MB|GB)?$/)
    if (m) {
      const value = Number(m[1])
      const unit = m[2] || 'B'
      const mult = unit === 'GB' ? 1024 ** 3 : unit === 'MB' ? 1024 ** 2 : unit === 'KB' ? 1024 : 1
      return Math.round(value * mult)
    }
  }
  return fallback
}

function parseRetentionDays(raw: any, fallback: number): number {
  if (raw == null) return fallback
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw
  if (typeof raw === 'string') {
    const num = Number(raw.replace(/[^0-9.]/g, ''))
    if (!Number.isNaN(num) && num > 0) return Math.round(num)
  }
  return fallback
}

// Loader ------------------------------------------------------
export async function loadSystemConfig(force = false): Promise<SystemConfig> {
  if (!force && cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.value

  const all = await getAllSettings()
  // Access categories safely (defensive)
  const security = all.security || {}
  const data = all.data || {}
  const api = all.api || {}
  const notifications = all.notifications || {}
  const maintenance = all.maintenance || {}

  const cfg: SystemConfig = {
    maintenanceMode: parseBoolean(maintenance.maintenanceMode?.value, false),
    enableRegistration: parseBoolean(security.enableRegistration?.value, false),
    require2FA: parseBoolean(security.require2FA?.value, false),
    enableApiAccess: parseBoolean(api.enableApiAccess?.value, true),
    enableEmailNotifications: parseBoolean(notifications.enableEmailNotifications?.value, true),
    sessionTimeoutSeconds: parseDurationToSeconds(security.sessionTimeout?.value, 3600),
    dataRetentionDays: parseRetentionDays(data.dataRetention?.value, 365),
    maxUploadSizeBytes: parseSizeToBytes(data.maxUploadSize?.value, 10 * 1024 * 1024), // default 10MB
  }
  cache = { value: cfg, loadedAt: Date.now() }
  return cfg
}

export function invalidateSystemConfigCache() {
  cache = null
}

// For potential streaming debug / snapshot
export function getCachedSystemConfig(): SystemConfig | null {
  return cache?.value || null
}
