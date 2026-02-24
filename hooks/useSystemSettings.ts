import { useCallback, useEffect, useState } from 'react'

export interface SystemSettingsState {
  [category: string]: {
    [key: string]: {
      value: any
      dataType?: string | null
      description?: string | null
    }
  }
}

interface UseSystemSettingsResult {
  settings: SystemSettingsState
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  updateSetting: (category: string, key: string, value: any, description?: string | null) => Promise<boolean>
  bulkSave: (payload: SystemSettingsState) => Promise<boolean>
}

export function useSystemSettings(): UseSystemSettingsResult {
  const [settings, setSettings] = useState<SystemSettingsState>({})
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/system-settings', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to load settings')
      setSettings(data.data || {})
    } catch (e: any) {
      setError(e.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const updateSetting = useCallback(async (category: string, key: string, value: any, description?: string | null) => {
    try {
      const res = await fetch(`/api/admin/system-settings/${encodeURIComponent(category)}/${encodeURIComponent(key)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value, description })
      })
      if (!res.ok) return false
      const data = await res.json()
      if (!data.success) return false
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...(prev[category] || {}),
          [key]: { value, description: description ?? prev[category]?.[key]?.description, dataType: prev[category]?.[key]?.dataType }
        }
      }))
      return true
    } catch {
      return false
    }
  }, [])

  const bulkSave = useCallback(async (payload: SystemSettingsState) => {
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload })
      })
      if (!res.ok) return false
      const data = await res.json()
      if (!data.success) return false
      setSettings(payload)
      return true
    } catch {
      return false
    }
  }, [])

  return { settings, loading, error, refresh: fetchAll, updateSetting, bulkSave }
}

export default useSystemSettings
