import { prisma } from '@/lib/prisma';
import { getEffectiveUserSettings, getUserSettings } from '@/lib/userSettingsCache';

/**
 * Returns true if the user has 2FA enabled (flag in user_settings.enable_two_factor)
 */
export async function isTwoFactorEnabled(userId: string): Promise<boolean> {
  if (!userId) return false;
  const row = await getUserSettings(userId);
  return !!row?.enable_two_factor;
}

/**
 * Fetch the stored TOTP secret for a user (if any). Note: currently stored in system_settings
 * as category security, key `user:{id}:twoFactorSecret` (plaintext). Future: encrypt/hash.
 */
export async function getTwoFactorSecret(userId: string): Promise<string | null> {
  if (!userId) return null;
  const secretRow = await prisma.system_settings.findFirst({
    where: { category: 'security', setting_key: `user:${userId}:twoFactorSecret` },
    select: { setting_value: true }
  });
  return secretRow?.setting_value || null;
}

/**
 * Asserts that the user has 2FA enabled; if not, throws an Error used by callers to return 403.
 */
export async function assertTwoFactorEnabled(userId: string) {
  const enabled = await isTwoFactorEnabled(userId);
  if (!enabled) {
    const err: any = new Error('Two-factor authentication required for this action but not enabled');
    err.code = 'TWO_FACTOR_NOT_ENABLED';
    throw err;
  }
}

/**
 * Validate a provided TOTP code (if supplied) against stored secret. Returns boolean.
 * Caller decides whether to require code for a particular action.
 */
import { verifyTOTP } from '@/lib/totp';
export async function validateTOTP(userId: string, code?: string | null): Promise<boolean> {
  if (!code) return false;
  const secret = await getTwoFactorSecret(userId);
  if (!secret) return false;
  return verifyTOTP(secret, code.trim());
}
