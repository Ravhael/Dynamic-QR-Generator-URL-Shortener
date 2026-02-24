import { prisma } from '@/lib/prisma'

export interface SystemSettingRecord {
  category: string
  setting_key: string
  setting_value: string | null
  data_type: string | null
  description: string | null
  is_active: boolean | null
  created_at: Date | null
  updated_at: Date | null
}

export interface NormalizedSettingValue {
  value: any
  dataType: string | null
  description: string | null
}

export type NormalizedSettings = Record<string, Record<string, NormalizedSettingValue>>
// For incoming payload (bulk), allow a looser shape (value required logically but we coerce later)
export type IncomingSettings = Record<string, Record<string, Partial<NormalizedSettingValue> & { value?: any }>>

function convertOut(row: SystemSettingRecord): NormalizedSettingValue {
  const dataType = row.data_type || 'string'
  const raw = row.setting_value
  let value: any = raw
  try {
    switch (dataType) {
      case 'boolean':
        value = raw === 'true'
        break
      case 'number':
        value = raw != null ? Number(raw) : null
        break
      case 'json':
        value = raw ? JSON.parse(raw) : null
        break
      default:
        value = raw
    }
  } catch {
    value = raw
  }
  return { value, dataType, description: row.description }
}

export async function getAllSettings(): Promise<NormalizedSettings> {
  const rows = await prisma.system_settings.findMany({
    where: { is_active: true },
    orderBy: [{ category: 'asc' }, { setting_key: 'asc' }]
  })
  const grouped: NormalizedSettings = {}
  for (const r of rows) {
    if (!grouped[r.category]) grouped[r.category] = {}
    grouped[r.category][r.setting_key] = convertOut(r as any)
  }
  return grouped
}

export interface UpsertSettingsInput {
  settings: IncomingSettings | NormalizedSettings
  userId?: string | null
}

function prepareValue(value: any): { value: string; dataType: string } {
  if (typeof value === 'boolean') return { value: value.toString(), dataType: 'boolean' }
  if (typeof value === 'number') return { value: value.toString(), dataType: 'number' }
  if (value && typeof value === 'object') return { value: JSON.stringify(value), dataType: 'json' }
  return { value: value == null ? '' : String(value), dataType: 'string' }
}

export async function upsertSettings({ settings, userId }: UpsertSettingsInput) {
  const ops: any[] = []
  const ts = new Date()
  for (const [category, entries] of Object.entries(settings)) {
    for (const [settingKey, cfg] of Object.entries(entries)) {
      const rawVal = (cfg as any).value
      const { value, dataType } = prepareValue(rawVal)
      ops.push(
        prisma.system_settings.upsert({
          where: { category_setting_key: { category, setting_key: settingKey } },
            create: {
              category,
              setting_key: settingKey,
              setting_value: value,
              data_type: dataType,
              description: cfg.description || null,
              created_by: userId || undefined,
              updated_by: userId || undefined,
              created_at: ts,
              updated_at: ts,
            },
            update: {
              setting_value: value,
              data_type: dataType,
              description: cfg.description || undefined,
              updated_by: userId || undefined,
              updated_at: ts,
            }
        })
      )
    }
  }
  if (!ops.length) return { updated: 0 }
  const results = await prisma.$transaction(ops)
  return { updated: results.length }
}

export async function upsertSingleSetting(params: { category: string; settingKey: string; value: any; description?: string | null; userId?: string | null }) {
  const { category, settingKey, value, description, userId } = params
  const ts = new Date()
  const prep = prepareValue(value)
  const record = await prisma.system_settings.upsert({
    where: { category_setting_key: { category, setting_key: settingKey } },
    create: {
      category,
      setting_key: settingKey,
      setting_value: prep.value,
      data_type: prep.dataType,
      description: description || null,
      created_by: userId || undefined,
      updated_by: userId || undefined,
      created_at: ts,
      updated_at: ts,
    },
    update: {
      setting_value: prep.value,
      data_type: prep.dataType,
      description: description || undefined,
      updated_by: userId || undefined,
      updated_at: ts,
    }
  })
  return record
}
