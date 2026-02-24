import { loadSystemConfig } from '@/lib/systemConfig';
import { getEffectiveUserSettings } from '@/lib/userSettingsCache';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  category?: string; // e.g. 'notification','alert'
  simulate?: boolean; // for tests / dry run
  userId?: string; // optional recipient user id for per-user notification gating
}

export interface SendEmailResult {
  skipped: boolean;
  reason?: string;
  delivered?: boolean;
  providerId?: string;
}

// Placeholder transport (no real SMTP integration yet). In future integrate nodemailer or provider API.
async function deliverViaPlaceholder(opts: SendEmailOptions): Promise<SendEmailResult> {
  console.log('[EMAIL_PLACEHOLDER_SEND]', { to: opts.to, subject: opts.subject });
  return { skipped: false, delivered: true, providerId: 'placeholder' };
}

/**
 * Central email send function with config gating. Returns skipped result if disabled.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const cfg = await loadSystemConfig();
  if (!cfg.enableEmailNotifications) {
    return { skipped: true, reason: 'Email notifications disabled by configuration' };
  }
  if (options.userId) {
    try {
      const eff = await getEffectiveUserSettings(options.userId);
      if (eff.email_notifications === false) {
        return { skipped: true, reason: 'Per-user email notifications disabled' };
      }
    } catch (e) {
      // Fail-open if user settings cannot be loaded
      console.warn('[EMAIL_USER_SETTINGS_LOAD_FAIL]', e);
    }
  }
  if (options.simulate) {
    return { skipped: false, delivered: true, providerId: 'simulate' };
  }
  return deliverViaPlaceholder(options);
}
