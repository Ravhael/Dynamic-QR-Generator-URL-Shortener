-- Update user_settings table structure to match settings page
-- Created: August 28, 2025
-- This script updates the user_settings table to accommodate all settings from the Settings page

-- Drop existing user_settings table if exists and recreate with new structure
DROP TABLE IF EXISTS user_settings CASCADE;

-- Create updated user_settings table with all settings from the Settings page
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- General Settings
    site_name VARCHAR(255) DEFAULT 'Scanly',
    site_url VARCHAR(500) DEFAULT 'http://localhost:3000',
    default_category VARCHAR(100) DEFAULT 'Marketing',
    allow_public_registration BOOLEAN DEFAULT true,
    
    -- Security Settings
    require_ssl BOOLEAN DEFAULT true,
    enable_two_factor BOOLEAN DEFAULT false,
    session_timeout INTEGER DEFAULT 60, -- minutes
    max_login_attempts INTEGER DEFAULT 5,
    
    -- Analytics Settings
    enable_analytics BOOLEAN DEFAULT true,
    data_retention_days INTEGER DEFAULT 365,
    anonymize_ip_addresses BOOLEAN DEFAULT false,
    
    -- Notification Settings
    email_notifications BOOLEAN DEFAULT true,
    scan_alerts BOOLEAN DEFAULT true,
    weekly_reports BOOLEAN DEFAULT true,
    
    -- API Settings
    enable_api BOOLEAN DEFAULT true,
    api_rate_limit INTEGER DEFAULT 1000, -- requests per hour
    
    -- QR Code Settings
    default_qr_size INTEGER DEFAULT 300, -- pixels
    max_qr_size INTEGER DEFAULT 1000, -- pixels
    default_format VARCHAR(10) DEFAULT 'PNG', -- PNG, JPG, SVG
    enable_branding BOOLEAN DEFAULT false,
    
    -- UI/UX Settings (existing ones to keep)
    theme VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'auto'
    language VARCHAR(10) DEFAULT 'en', -- 'en', 'id', 'es', etc.
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(10) DEFAULT '24h', -- '12h', '24h'
    
    -- Extended preferences as JSONB for flexibility
    dashboard_layout JSONB DEFAULT '{}', -- Dashboard customization
    export_preferences JSONB DEFAULT '{}', -- Export format preferences
    custom_settings JSONB DEFAULT '{}', -- Any custom settings
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_updated_at ON user_settings(updated_at);

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings for existing users
INSERT INTO user_settings (user_id)
SELECT id FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM user_settings WHERE user_settings.user_id = auth.users.id
);

-- Insert comprehensive sample data for the test user
INSERT INTO user_settings (
    user_id,
    site_name,
    site_url,
    default_category,
    allow_public_registration,
    require_ssl,
    enable_two_factor,
    session_timeout,
    max_login_attempts,
    enable_analytics,
    data_retention_days,
    anonymize_ip_addresses,
    email_notifications,
    scan_alerts,
    weekly_reports,
    enable_api,
    api_rate_limit,
    default_qr_size,
    max_qr_size,
    default_format,
    enable_branding,
    theme,
    language,
    timezone,
    date_format,
    time_format,
    dashboard_layout,
    export_preferences,
    custom_settings
) VALUES (
    'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', -- Test user ID
    'Scanly Analytics Pro',
    'https://scanly.indovisual.co.id',
    'Marketing',
    true,
    true,
    false,
    120, -- 2 hours session timeout
    3, -- Max 3 login attempts
    true,
    180, -- Keep data for 6 months
    true, -- Anonymize IPs for privacy
    true,
    true,
    true,
    true,
    500, -- API rate limit
    400, -- Default QR size
    2000, -- Max QR size
    'PNG',
    false,
    'light',
    'en',
    'Asia/Jakarta',
    'DD/MM/YYYY',
    '24h',
    '{"layout": "grid", "widgets": ["analytics", "recent_qrs", "top_urls"]}',
    '{"default_format": "PDF", "include_charts": true, "date_range": "last_30_days"}',
    '{"auto_save": true, "notifications_sound": false, "compact_mode": false}'
) ON CONFLICT (user_id) DO UPDATE SET
    site_name = EXCLUDED.site_name,
    site_url = EXCLUDED.site_url,
    default_category = EXCLUDED.default_category,
    allow_public_registration = EXCLUDED.allow_public_registration,
    require_ssl = EXCLUDED.require_ssl,
    enable_two_factor = EXCLUDED.enable_two_factor,
    session_timeout = EXCLUDED.session_timeout,
    max_login_attempts = EXCLUDED.max_login_attempts,
    enable_analytics = EXCLUDED.enable_analytics,
    data_retention_days = EXCLUDED.data_retention_days,
    anonymize_ip_addresses = EXCLUDED.anonymize_ip_addresses,
    email_notifications = EXCLUDED.email_notifications,
    scan_alerts = EXCLUDED.scan_alerts,
    weekly_reports = EXCLUDED.weekly_reports,
    enable_api = EXCLUDED.enable_api,
    api_rate_limit = EXCLUDED.api_rate_limit,
    default_qr_size = EXCLUDED.default_qr_size,
    max_qr_size = EXCLUDED.max_qr_size,
    default_format = EXCLUDED.default_format,
    enable_branding = EXCLUDED.enable_branding,
    updated_at = NOW();

-- Show results
SELECT 
    'User settings table updated successfully!' as status,
    (SELECT COUNT(*) FROM user_settings) as total_user_settings,
    (SELECT COUNT(*) FROM user_settings WHERE user_id = 'af6b7277-5dd7-4a4d-9501-b5e6f15202e8') as test_user_settings;

-- Show sample settings for verification
SELECT 
    user_id,
    site_name,
    site_url,
    default_category,
    enable_analytics,
    email_notifications,
    default_qr_size,
    theme,
    created_at
FROM user_settings 
WHERE user_id = 'af6b7277-5dd7-4a4d-9501-b5e6f15202e8';

COMMENT ON TABLE user_settings IS 'User-specific settings and preferences for the Scanly application';
COMMENT ON COLUMN user_settings.site_name IS 'User customizable site name';
COMMENT ON COLUMN user_settings.site_url IS 'Base URL for the user site';
COMMENT ON COLUMN user_settings.session_timeout IS 'Session timeout in minutes';
COMMENT ON COLUMN user_settings.api_rate_limit IS 'API requests per hour limit for this user';
COMMENT ON COLUMN user_settings.data_retention_days IS 'How long to keep analytics data in days';
