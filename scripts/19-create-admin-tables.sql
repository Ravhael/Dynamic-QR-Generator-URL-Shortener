-- Create tables for Admin Panel settings
-- 19-create-admin-tables.sql

-- 1. Table for Permissions & Roles
CREATE TABLE IF NOT EXISTS permissions_roles (
    id SERIAL PRIMARY KEY,
    department_id VARCHAR(50) NOT NULL,
    permission_key VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (department_id, permission_key)
);

-- Insert default permissions for development team (admin-like permissions)
INSERT INTO permissions_roles (department_id, permission_key, granted) VALUES
-- Development Team (Group ID 1) - Full access
('1', 'view_dashboard', TRUE),
('1', 'view_analytics', TRUE),
('1', 'export_reports', TRUE),
('1', 'view_department_stats', TRUE),
('1', 'view_users', TRUE),
('1', 'create_users', TRUE),
('1', 'edit_users', TRUE),
('1', 'delete_users', TRUE),
('1', 'manage_department_users', TRUE),
('1', 'view_qr', TRUE),
('1', 'create_qr', TRUE),
('1', 'edit_qr', TRUE),
('1', 'delete_qr', TRUE),
('1', 'manage_qr_categories', TRUE),
('1', 'view_urls', TRUE),
('1', 'create_urls', TRUE),
('1', 'edit_urls', TRUE),
('1', 'delete_urls', TRUE),
('1', 'manage_url_domains', TRUE),
('1', 'manage_departments', TRUE),
('1', 'system_settings', TRUE),
('1', 'view_audit_logs', TRUE),
('1', 'backup_restore', TRUE),

-- Marketing Team (Group ID 2) - Editor-like permissions
('2', 'view_dashboard', TRUE),
('2', 'view_analytics', TRUE),
('2', 'export_reports', TRUE),
('2', 'view_department_stats', TRUE),
('2', 'view_users', TRUE),
('2', 'manage_department_users', TRUE),
('2', 'view_qr', TRUE),
('2', 'create_qr', TRUE),
('2', 'edit_qr', TRUE),
('2', 'manage_qr_categories', TRUE),
('2', 'view_urls', TRUE),
('2', 'create_urls', TRUE),
('2', 'edit_urls', TRUE),
('2', 'manage_url_domains', TRUE),

-- Sales Team (Group ID 3) - Viewer-like permissions  
('3', 'view_dashboard', TRUE),
('3', 'view_analytics', TRUE),
('3', 'view_department_stats', TRUE),
('3', 'view_users', TRUE),
('3', 'view_qr', TRUE),
('3', 'view_urls', TRUE)
ON CONFLICT (department_id, permission_key) DO UPDATE SET granted = EXCLUDED.granted;

-- 2. Table for Menu Settings
CREATE TABLE IF NOT EXISTS menu_settings (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    menu_item VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (role, menu_item)
);

-- Insert default menu settings
INSERT INTO menu_settings (role, menu_item, enabled) VALUES
-- Admin role
('admin', 'dashboard', TRUE),
('admin', 'users', TRUE), 
('admin', 'qr-codes', TRUE),
('admin', 'url-list', TRUE),
('admin', 'analytics', TRUE),
('admin', 'reports', TRUE),
('admin', 'settings', TRUE),
('admin', 'admin-panel', TRUE),

-- Editor role
('editor', 'dashboard', TRUE),
('editor', 'qr-codes', TRUE),
('editor', 'url-list', TRUE),
('editor', 'analytics', TRUE),
('editor', 'reports', TRUE),
('editor', 'settings', FALSE),
('editor', 'admin-panel', FALSE),

-- Viewer role
('viewer', 'dashboard', TRUE),
('viewer', 'qr-codes', FALSE),
('viewer', 'url-list', FALSE),
('viewer', 'analytics', TRUE),
('viewer', 'reports', TRUE),
('viewer', 'settings', FALSE),
('viewer', 'admin-panel', FALSE),

-- User role
('user', 'dashboard', TRUE),
('user', 'qr-codes', TRUE),
('user', 'url-list', TRUE),
('user', 'analytics', FALSE),
('user', 'reports', FALSE),
('user', 'settings', FALSE),
('user', 'admin-panel', FALSE)
ON CONFLICT (role, menu_item) DO UPDATE SET enabled = EXCLUDED.enabled;

-- 3. Table for System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'boolean', 'number', 'json')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (category, setting_key)
);

-- Insert default system settings
INSERT INTO system_settings (category, setting_key, setting_value, data_type) VALUES
-- General Settings
('general', 'site_name', 'Scanly QR Management', 'string'),
('general', 'site_description', 'Professional QR Code Management System', 'string'),
('general', 'max_qr_codes_per_user', '100', 'number'),
('general', 'allow_public_registration', 'false', 'boolean'),
('general', 'default_user_role', 'user', 'string'),
('general', 'maintenance_mode', 'false', 'boolean'),

-- Security Settings
('security', 'session_timeout', '30', 'number'),
('security', 'max_login_attempts', '5', 'number'),
('security', 'require_email_verification', 'true', 'boolean'),
('security', 'password_min_length', '8', 'number'),
('security', 'enable_2fa', 'false', 'boolean'),
('security', 'auto_logout', 'true', 'boolean'),

-- Email Settings
('email', 'smtp_host', '', 'string'),
('email', 'smtp_port', '587', 'number'),
('email', 'smtp_username', '', 'string'),
('email', 'smtp_password', '', 'string'),
('email', 'from_email', 'noreply@scanly.com', 'string'),
('email', 'from_name', 'Scanly System', 'string'),
('email', 'enable_notifications', 'true', 'boolean'),

-- QR Code Settings
('qr_codes', 'default_size', '256', 'number'),
('qr_codes', 'default_format', 'PNG', 'string'),
('qr_codes', 'max_file_size', '5', 'number'),
('qr_codes', 'allowed_domains', '[]', 'json'),
('qr_codes', 'enable_analytics', 'true', 'boolean'),
('qr_codes', 'default_expiry', '365', 'number'),

-- URL Settings
('urls', 'default_domain', 'scanly.co', 'string'),
('urls', 'enable_custom_domains', 'true', 'boolean'),
('urls', 'url_expiry_days', '365', 'number'),
('urls', 'enable_click_tracking', 'true', 'boolean'),

-- System Settings
('system', 'backup_frequency', 'daily', 'string'),
('system', 'log_retention_days', '30', 'number'),
('system', 'enable_audit_log', 'true', 'boolean'),
('system', 'max_users_per_group', '50', 'number')
ON CONFLICT (category, setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value, 
    data_type = EXCLUDED.data_type;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_permissions_roles_dept ON permissions_roles(department_id);
CREATE INDEX IF NOT EXISTS idx_menu_settings_role ON menu_settings(role);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
