import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, upsertSettings } from '@/lib/services/systemSettingsService';
import { invalidateSystemConfigCache } from '@/lib/systemConfig';
import { getAuthenticatedUserId } from '@/lib/auth';
import { z } from 'zod';
import { isTwoFactorEnabled, validateTOTP } from '@/lib/twoFactor';

// Get system settings
export async function GET() {
  try {
    const data = await getAllSettings();
    return NextResponse.json({ success: true, data, message: 'System settings retrieved successfully' });
  } catch (err) {
    console.error('[SYSTEM_SETTINGS][GET] error', err);
    return NextResponse.json({ success: false, error: 'Failed to fetch system settings' }, { status: 500 });
  }
}

// Save system settings
// Zod schema for bulk settings: { settings: { [category]: { [key]: { value: any, description?: string } } } }
const singleSettingSchema = z.object({
  value: z.any(),
  dataType: z.enum(['string','boolean','number','json']).optional(),
  description: z.string().max(500).optional().nullable()
})
const bulkSettingsSchema = z.object({
  settings: z.record(
    z.record(singleSettingSchema)
  )
})

export async function POST(request: NextRequest) {
  try {
    const json = await request.json().catch(() => null)
    const parsed = bulkSettingsSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }
    const userId = await getAuthenticatedUserId(request).catch(() => null)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Per-user 2FA enforcement (Option C): if user has enabled 2FA, require a valid TOTP code header for this high-impact action.
    try {
      const twoFAEnabled = await isTwoFactorEnabled(userId);
      if (twoFAEnabled) {
        const code = request.headers.get('x-totp-code');
        const ok = await validateTOTP(userId, code);
        if (!ok) {
          return NextResponse.json({ success: false, error: 'Invalid or missing TOTP code', twoFactorRequired: true }, { status: 401 });
        }
      }
    } catch (e) {
      console.error('[SYSTEM_SETTINGS][2FA_CHECK_ERROR]', e);
      return NextResponse.json({ success: false, error: '2FA validation failed' }, { status: 500 });
    }
  const result = await upsertSettings({ settings: parsed.data.settings, userId });
  invalidateSystemConfigCache();
  return NextResponse.json({ success: true, message: 'System settings saved successfully', updated: result.updated, cacheInvalidated: true });
  } catch (err) {
    console.error('[SYSTEM_SETTINGS][POST] error', err);
    return NextResponse.json({ success: false, error: 'Failed to save system settings' }, { status: 500 });
  }
}
