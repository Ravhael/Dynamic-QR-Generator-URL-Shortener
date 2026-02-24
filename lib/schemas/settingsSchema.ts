import { z } from 'zod';

// Granular sub-schemas
const generalSchema = z.object({
  siteName: z.string().min(1).max(200),
  siteDescription: z.string().max(500).optional().default(''),
  contactEmail: z.string().email().optional().or(z.literal('')),
  timezone: z.string().min(1),
  language: z.string().min(1),
  defaultQRSize: z.number().int().min(50).max(5000),
  maxQRSize: z.number().int().min(50).max(10000),
  defaultFormat: z.enum(['PNG','SVG','JPG','WEBP']).default('PNG'),
  enableBranding: z.boolean().default(false)
});

const securitySchema = z.object({
  twoFactorAuth: z.boolean().default(false),
  passwordStrength: z.enum(['weak','medium','strong']).default('medium'),
  sessionTimeout: z.number().int().min(1).max(24 * 60).default(60), // minutes
  apiRateLimit: z.number().int().min(10).max(100000).default(1000)
});

const analyticsSchema = z.object({
  realTimeTracking: z.boolean().default(true),
  geoLocation: z.boolean().default(true),
  dataRetention: z.number().int().min(1).max(3650).default(365),
  cookieConsent: z.boolean().default(false)
});

const notificationsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  pushNotifications: z.boolean().default(true)
});

const integrationSchema = z.object({
  googleAnalytics: z.object({
    enabled: z.boolean().default(false),
    trackingId: z.string().regex(/^$|^UA-[A-Z0-9\-]+$|^G-[A-Z0-9]{8,}$/, 'Invalid GA tracking ID').optional().default('')
  }).default({ enabled: false, trackingId: '' })
});

export const settingsPayloadSchema = z.object({
  general: generalSchema,
  security: securitySchema,
  analytics: analyticsSchema,
  notifications: notificationsSchema,
  integration: integrationSchema
}).superRefine((val, ctx) => {
  if (val.general.maxQRSize < val.general.defaultQRSize) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['general','maxQRSize'],
      message: 'maxQRSize must be >= defaultQRSize'
    });
  }
});

export type SettingsPayload = z.infer<typeof settingsPayloadSchema>;
