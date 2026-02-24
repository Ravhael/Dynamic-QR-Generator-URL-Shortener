-- Manual migration script for refactoring user_settings table to row-based design
-- Run this SQL manually BEFORE deploying the updated Prisma client if you previously used key-value layout.
-- Adjust schema/table/column names if they differ in your environment.

BEGIN;

-- 1. Backup existing table
CREATE TABLE IF NOT EXISTS user_settings_backup_kv AS
  SELECT * FROM user_settings;

-- 2. If the old structure had KV columns (setting_key / setting_value) we pivot.
-- Detect KV pattern: presence of setting_key column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_settings' AND column_name = 'setting_key'
  ) THEN
    -- Create new row-based table (temporary name)
    CREATE TABLE user_settings_new (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL,
      site_name VARCHAR(255),
      site_description VARCHAR(512),
      contact_email VARCHAR(255),
      timezone VARCHAR(100),
      language VARCHAR(10),
      default_qr_size INT DEFAULT 300,
      max_qr_size INT DEFAULT 1000,
      default_format VARCHAR(20),
      enable_branding BOOLEAN DEFAULT false,
      enable_two_factor BOOLEAN DEFAULT false,
      password_strength VARCHAR(20),
      session_timeout INT DEFAULT 60,
      api_rate_limit INT DEFAULT 1000,
      enable_analytics BOOLEAN DEFAULT true,
      geo_location BOOLEAN DEFAULT true,
      data_retention_days INT DEFAULT 365,
      anonymize_ip_addresses BOOLEAN DEFAULT false,
      email_notifications BOOLEAN DEFAULT true,
      sms_notifications BOOLEAN DEFAULT false,
      scan_alerts BOOLEAN DEFAULT true,
      google_analytics_enabled BOOLEAN DEFAULT false,
      google_analytics_id VARCHAR(100),
      custom_settings JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      created_by UUID,
      updated_by UUID,
      CONSTRAINT uq_user_settings_user UNIQUE(user_id)
    );

    -- Pivot existing KV pairs into JSON aggregated per user
    WITH kv AS (
      SELECT user_id, setting_key, setting_value
      FROM user_settings
    ), grouped AS (
      SELECT user_id,
             jsonb_object_agg(setting_key, setting_value) AS all_settings
      FROM kv
      GROUP BY user_id
    )
    INSERT INTO user_settings_new (user_id, custom_settings)
    SELECT user_id, all_settings FROM grouped;

    -- Replace old table
    ALTER TABLE user_settings RENAME TO user_settings_old_kv;
    ALTER TABLE user_settings_new RENAME TO user_settings;
  END IF;
END $$;

-- 3. (Optional) Map selected keys from custom_settings JSON into dedicated columns.
-- This updates rows that have custom_settings with known keys.
UPDATE user_settings
SET
  site_name = COALESCE(site_name, custom_settings->>'general.siteName'),
  site_description = COALESCE(site_description, custom_settings->>'general.siteDescription'),
  contact_email = COALESCE(contact_email, custom_settings->>'general.contactEmail'),
  timezone = COALESCE(timezone, custom_settings->>'general.timezone'),
  language = COALESCE(language, custom_settings->>'general.language'),
  default_qr_size = COALESCE(default_qr_size, (custom_settings#>>'{general,defaultQRSize}')::INT),
  max_qr_size = COALESCE(max_qr_size, (custom_settings#>>'{general,maxQRSize}')::INT),
  default_format = COALESCE(default_format, custom_settings->>'general.defaultFormat'),
  enable_branding = COALESCE(enable_branding, (custom_settings#>>'{general,enableBranding}')::BOOLEAN),
  enable_two_factor = COALESCE(enable_two_factor, (custom_settings#>>'{security,twoFactorAuth}')::BOOLEAN),
  password_strength = COALESCE(password_strength, custom_settings->>'security.passwordStrength'),
  session_timeout = COALESCE(session_timeout, (custom_settings#>>'{security,sessionTimeout}')::INT),
  api_rate_limit = COALESCE(api_rate_limit, (custom_settings#>>'{security,apiRateLimit}')::INT),
  enable_analytics = COALESCE(enable_analytics, (custom_settings#>>'{analytics,realTimeTracking}')::BOOLEAN),
  geo_location = COALESCE(geo_location, (custom_settings#>>'{analytics,geoLocation}')::BOOLEAN),
  data_retention_days = COALESCE(data_retention_days, (custom_settings#>>'{analytics,dataRetention}')::INT),
  anonymize_ip_addresses = COALESCE(anonymize_ip_addresses, (custom_settings#>>'{analytics,cookieConsent}')::BOOLEAN),
  email_notifications = COALESCE(email_notifications, (custom_settings#>>'{notifications,emailNotifications}')::BOOLEAN),
  sms_notifications = COALESCE(sms_notifications, (custom_settings#>>'{notifications,smsNotifications}')::BOOLEAN),
  scan_alerts = COALESCE(scan_alerts, (custom_settings#>>'{notifications,pushNotifications}')::BOOLEAN),
  google_analytics_enabled = COALESCE(google_analytics_enabled, (custom_settings#>>'{integration,googleAnalytics,enabled}')::BOOLEAN),
  google_analytics_id = COALESCE(google_analytics_id, custom_settings#>>'{integration,googleAnalytics,trackingId}');

COMMIT;

-- After verifying data, you can drop the old table:
-- DROP TABLE IF EXISTS user_settings_old_kv;
