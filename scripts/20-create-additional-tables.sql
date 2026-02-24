-- Additional tables for Scanly application
-- Created: 2025-08-27

-- Table for tracking URL click events
CREATE TABLE IF NOT EXISTS click_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_url_id UUID REFERENCES short_urls(id) ON DELETE CASCADE,
    user_agent TEXT,
    ip_address INET,
    referer TEXT,
    country VARCHAR(3),
    city VARCHAR(100),
    device_type VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    clicked_at TIMESTAMPTZ DEFAULT NOW(),
    session_id VARCHAR(255),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for tracking QR code scan events
CREATE TABLE IF NOT EXISTS scan_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code_id UUID REFERENCES qr_codes(id) ON DELETE CASCADE,
    user_agent TEXT,
    ip_address INET,
    referer TEXT,
    country VARCHAR(3),
    city VARCHAR(100),
    device_type VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    session_id VARCHAR(255),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    scan_method VARCHAR(50), -- 'camera', 'file_upload', 'direct_link'
    scan_location POINT, -- GPS coordinates if available
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for QR code migration tracking
CREATE TABLE IF NOT EXISTS qr_migration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    original_qr_url TEXT NOT NULL,
    migrated_qr_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
    migration_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'
    migration_type VARCHAR(50) DEFAULT 'url_conversion', -- 'url_conversion', 'file_upload', 'bulk_import'
    original_file_name VARCHAR(255),
    original_file_size INTEGER,
    original_file_type VARCHAR(100),
    error_message TEXT,
    migration_notes TEXT,
    metadata JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for comprehensive user activity logging
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL, -- 'LOGIN', 'LOGOUT', 'CREATE_QR', 'UPDATE_QR', 'DELETE_QR', 'CREATE_URL', etc.
    target_type VARCHAR(50), -- 'qr_code', 'short_url', 'user', 'group', 'settings', 'auth', etc.
    target_id UUID, -- ID of the affected resource
    target_name TEXT, -- Human-readable name of the target
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'pending'
    metadata JSONB DEFAULT '{}', -- Additional contextual data
    session_id VARCHAR(255),
    duration_ms INTEGER, -- Time taken for the action in milliseconds
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for individual user settings
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'auto'
    language VARCHAR(10) DEFAULT 'en', -- 'en', 'id', 'es', etc.
    timezone VARCHAR(50) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(10) DEFAULT '24h', -- '12h', '24h'
    notifications JSONB DEFAULT '{}', -- Email, SMS, push notification preferences
    privacy JSONB DEFAULT '{}', -- Privacy settings
    dashboard_layout JSONB DEFAULT '{}', -- Dashboard customization
    default_qr_settings JSONB DEFAULT '{}', -- Default QR code generation settings
    default_url_settings JSONB DEFAULT '{}', -- Default short URL settings
    analytics_preferences JSONB DEFAULT '{}', -- Analytics display preferences
    export_preferences JSONB DEFAULT '{}', -- Export format preferences
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for system-wide admin settings
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) NOT NULL, -- 'system', 'security', 'notifications', 'analytics', 'integration', 'backup'
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Whether this setting can be read by non-admin users
    is_encrypted BOOLEAN DEFAULT FALSE, -- Whether the value is encrypted
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_click_events_short_url_id ON click_events(short_url_id);
CREATE INDEX IF NOT EXISTS idx_click_events_clicked_at ON click_events(clicked_at);
CREATE INDEX IF NOT EXISTS idx_click_events_ip_address ON click_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_click_events_country ON click_events(country);

CREATE INDEX IF NOT EXISTS idx_scan_events_qr_code_id ON scan_events(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_scanned_at ON scan_events(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scan_events_ip_address ON scan_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_scan_events_country ON scan_events(country);

CREATE INDEX IF NOT EXISTS idx_qr_migration_user_id ON qr_migration(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_migration_status ON qr_migration(migration_status);
CREATE INDEX IF NOT EXISTS idx_qr_migration_created_at ON qr_migration(created_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_target_type ON user_activity(target_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_status ON user_activity(status);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_admin_settings_type ON admin_settings(setting_type);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_qr_migration_updated_at 
    BEFORE UPDATE ON qr_migration 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at 
    BEFORE UPDATE ON admin_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', '"Scanly"', 'system', 'Name of the application', true),
('site_description', '"Advanced QR Code & URL Analytics Platform"', 'system', 'Description of the application', true),
('contact_email', '"admin@scanly.indovisual.co.id"', 'system', 'Contact email for the application', true),
('timezone', '"Asia/Jakarta"', 'system', 'Default timezone for the application', true),
('max_qr_codes_per_user', '100', 'system', 'Maximum QR codes per user', false),
('max_short_urls_per_user', '500', 'system', 'Maximum short URLs per user', false),
('data_retention_days', '365', 'analytics', 'Data retention period in days', false),
('session_timeout_minutes', '60', 'security', 'Session timeout in minutes', false),
('password_min_length', '8', 'security', 'Minimum password length', false),
('enable_registration', 'true', 'security', 'Enable user registration', true),
('enable_email_notifications', 'true', 'notifications', 'Enable email notifications', false),
('backup_frequency_hours', '24', 'backup', 'Backup frequency in hours', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default user settings for existing users
INSERT INTO user_settings (user_id, theme, language, timezone)
SELECT id, 'light', 'en', 'Asia/Jakarta'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE click_events IS 'Tracks all clicks on short URLs with detailed analytics';
COMMENT ON TABLE scan_events IS 'Tracks all QR code scans with detailed analytics';
COMMENT ON TABLE qr_migration IS 'Tracks QR code migration processes and status';
COMMENT ON TABLE user_activity IS 'Comprehensive logging of all user activities';
COMMENT ON TABLE user_settings IS 'Individual user preferences and settings';
COMMENT ON TABLE admin_settings IS 'System-wide administrative settings';

-- Show table creation status
SELECT 'Tables created successfully!' as status;
