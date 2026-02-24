import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthenticatedUserId } from '@/lib/auth'
import { upsertSingleSetting } from '@/lib/services/systemSettingsService'
import { invalidateSystemConfigCache } from '@/lib/systemConfig'

const bodySchema = z.object({
  value: z.any(),
  description: z.string().max(500).optional().nullable()
})

export async function PATCH(req: NextRequest, { params }: { params: { category: string; key: string } }) {
  try {
    const userId = await getAuthenticatedUserId(req).catch(() => null)
    const json = await req.json().catch(() => null)
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }
    const category = decodeURIComponent(params.category)
    const settingKey = decodeURIComponent(params.key)
  const rec = await upsertSingleSetting({ category, settingKey, value: parsed.data.value, description: parsed.data.description ?? null, userId })
  invalidateSystemConfigCache()
  return NextResponse.json({ success: true, data: { category: rec.category, setting_key: rec.setting_key }, cacheInvalidated: true })
  } catch (err) {
    console.error('[SYSTEM_SETTINGS][PATCH] error', err)
    return NextResponse.json({ success: false, error: 'Failed to update system setting' }, { status: 500 })
  }
}
