import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getEffectiveUserSettings, invalidateUserSettings } from '@/lib/userSettingsCache';
import { settingsPayloadSchema } from '@/lib/schemas/settingsSchema';

// Default settings matching the UI shape
const defaultSettings = {
  general: {
    siteName: 'Scanly',
    siteDescription: '',
    contactEmail: '',
    timezone: 'Asia/Jakarta',
    language: 'en',
    defaultQRSize: 300,
    maxQRSize: 1000,
    defaultFormat: 'PNG',
    enableBranding: false,
  },
  security: {
    twoFactorAuth: false,
    passwordStrength: 'medium',
    sessionTimeout: 60,
    apiRateLimit: 1000,
  },
  analytics: {
    realTimeTracking: true,
    geoLocation: true,
    dataRetention: 365,
    cookieConsent: false,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  },
  integration: {
    googleAnalytics: {
      enabled: false,
      trackingId: '',
    }
  }
};

async function getUserIdOrFallback(req: NextRequest): Promise<string | null> {
  const uid = await getAuthenticatedUserId(req);
  if (uid) return uid;
  try {
    const first = await prisma.users.findFirst({
      select: { id: true },
      orderBy: { created_at: 'asc' }
    });
    return first?.id || null;
  } catch {
    return null;
  }
}

function mapRowToSettings(row: any) {
  if (!row) return defaultSettings;
  return {
    general: {
      siteName: row.site_name ?? defaultSettings.general.siteName,
      siteDescription: row.site_description ?? defaultSettings.general.siteDescription,
      contactEmail: row.contact_email ?? defaultSettings.general.contactEmail,
      timezone: row.timezone ?? defaultSettings.general.timezone,
      language: row.language ?? defaultSettings.general.language,
      defaultQRSize: row.default_qr_size ?? defaultSettings.general.defaultQRSize,
      maxQRSize: row.max_qr_size ?? defaultSettings.general.maxQRSize,
      defaultFormat: row.default_format ?? defaultSettings.general.defaultFormat,
      enableBranding: row.enable_branding ?? defaultSettings.general.enableBranding,
    },
    security: {
      twoFactorAuth: row.enable_two_factor ?? defaultSettings.security.twoFactorAuth,
      passwordStrength: row.password_strength ?? defaultSettings.security.passwordStrength,
      sessionTimeout: row.session_timeout ?? defaultSettings.security.sessionTimeout,
      apiRateLimit: row.api_rate_limit ?? defaultSettings.security.apiRateLimit,
    },
    analytics: {
      realTimeTracking: row.enable_analytics ?? defaultSettings.analytics.realTimeTracking,
      geoLocation: row.geo_location ?? defaultSettings.analytics.geoLocation,
      dataRetention: row.data_retention_days ?? defaultSettings.analytics.dataRetention,
      cookieConsent: row.anonymize_ip_addresses ?? defaultSettings.analytics.cookieConsent,
    },
    notifications: {
      emailNotifications: row.email_notifications ?? defaultSettings.notifications.emailNotifications,
      smsNotifications: row.sms_notifications ?? defaultSettings.notifications.smsNotifications,
      pushNotifications: row.scan_alerts ?? defaultSettings.notifications.pushNotifications,
    },
    integration: {
      googleAnalytics: {
        enabled: row.google_analytics_enabled ?? defaultSettings.integration.googleAnalytics.enabled,
        trackingId: row.google_analytics_id ?? defaultSettings.integration.googleAnalytics.trackingId,
      }
    }
  };
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdOrFallback(req);
    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    // Use cached effective settings for consistency & performance
    const effective = await getEffectiveUserSettings(userId);
    // Map from flat row style to UI shape (reusing mapRowToSettings by faking row structure)
    const settings = mapRowToSettings(effective);
    return NextResponse.json(settings, { status: 200 });
  } catch (error: any) {
    console.error('Settings GET error (Prisma):', error);
    return NextResponse.json(defaultSettings, { status: 200 });
  }
}

async function persistSettings(userId: string, incoming: any) {
  // Validate with Zod; throws if invalid
  const parsed = settingsPayloadSchema.parse(incoming);
  // Convert to flat row fields (sessionTimeout is already minutes and stored as minutes)
  const data: any = {
    site_name: parsed.general.siteName,
    site_description: parsed.general.siteDescription,
    contact_email: parsed.general.contactEmail,
    timezone: parsed.general.timezone,
    language: parsed.general.language,
    default_qr_size: parsed.general.defaultQRSize,
    max_qr_size: parsed.general.maxQRSize,
    default_format: parsed.general.defaultFormat,
    enable_branding: parsed.general.enableBranding,
    enable_two_factor: parsed.security.twoFactorAuth,
    password_strength: parsed.security.passwordStrength,
  session_timeout: parsed.security.sessionTimeout, // Stored as minutes; middleware multiplies by 60*1000
    api_rate_limit: parsed.security.apiRateLimit,
    enable_analytics: parsed.analytics.realTimeTracking,
    geo_location: parsed.analytics.geoLocation,
    data_retention_days: parsed.analytics.dataRetention,
    anonymize_ip_addresses: parsed.analytics.cookieConsent,
    email_notifications: parsed.notifications.emailNotifications,
    sms_notifications: parsed.notifications.smsNotifications,
    scan_alerts: parsed.notifications.pushNotifications,
    google_analytics_enabled: parsed.integration.googleAnalytics.enabled,
    google_analytics_id: parsed.integration.googleAnalytics.trackingId,
    custom_settings: parsed,
    updated_at: new Date()
  };
  const existing = await prisma.user_settings.findFirst({ where: { user_id: userId } });
  if (existing) {
    await prisma.user_settings.update({ where: { id: existing.id }, data });
  } else {
    await prisma.user_settings.create({ data: { user_id: userId, ...data } });
  }
  invalidateUserSettings(userId);
  return parsed;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdOrFallback(req);
    if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 401 });
    const incoming = await req.json();
    const saved = await persistSettings(userId, incoming);
    return NextResponse.json({ message: 'Settings saved', settings: saved, cacheInvalidated: true });
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', issues: error.errors }, { status: 422 });
    }
    console.error('Settings POST error (Prisma/Zod):', error);
    return NextResponse.json({ error: 'Failed to save settings', details: error?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req); // same logic (idempotent overwrite style)
}
