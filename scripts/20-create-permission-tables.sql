-- Create Enhanced Permission System Tables for Scanly
-- Schema supports ownership-based permissions and group-based access control

-- Drop existing tables if they exist (in correct order due to foreign key constraints)
DROP TABLE IF EXISTS user_group_access_log;
DROP TABLE IF EXISTS menu_role_permissions;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS system_settings;

-- 1. System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    data_type VARCHAR(20) DEFAULT 'string' CHECK (data_type IN ('string', 'boolean', 'number', 'json')),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, setting_key)
);

-- 2. Role Permissions Table (for data access control)
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer', 'user')),
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('qr_codes', 'urls', 'users', 'groups', 'analytics', 'system')),
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('create', 'read', 'update', 'delete', 'manage')),
    scope VARCHAR(20) NOT NULL DEFAULT 'own' CHECK (scope IN ('all', 'group', 'own', 'none')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, resource_type, permission_type)
);

-- 3. Menu Role Permissions Table (for sidebar menu control)
CREATE TABLE IF NOT EXISTS menu_role_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'editor', 'viewer', 'user')),
    menu_item VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role, menu_item)
);

-- 4. User Group Access Log (for auditing group access)
CREATE TABLE IF NOT EXISTS user_group_access_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO system_settings (category, setting_key, setting_value, data_type, description) VALUES
-- General Settings
('general', 'system_name', 'Scanly QR Management', 'string', 'Application name'),
('general', 'system_version', '1.1.0', 'string', 'Current system version'),
('general', 'maintenance_mode', 'false', 'boolean', 'Enable/disable maintenance mode'),
('general', 'max_users_per_group', '50', 'number', 'Maximum users per group'),
('general', 'session_timeout', '3600', 'number', 'Session timeout in seconds'),

-- Security Settings
('security', 'password_min_length', '8', 'number', 'Minimum password length'),
('security', 'password_require_uppercase', 'true', 'boolean', 'Require uppercase letters'),
('security', 'password_require_lowercase', 'true', 'boolean', 'Require lowercase letters'), 
('security', 'password_require_numbers', 'true', 'boolean', 'Require numbers'),
('security', 'password_require_symbols', 'false', 'boolean', 'Require special symbols'),
('security', 'max_login_attempts', '5', 'number', 'Maximum failed login attempts'),
('security', 'lockout_duration', '1800', 'number', 'Account lockout duration in seconds'),
('security', 'enable_group_isolation', 'true', 'boolean', 'Enable group-based data isolation'),

-- QR Code Settings
('qr_codes', 'default_size', '300', 'number', 'Default QR code size in pixels'),
('qr_codes', 'max_size', '1000', 'number', 'Maximum QR code size in pixels'),
('qr_codes', 'default_format', 'PNG', 'string', 'Default image format'),
('qr_codes', 'max_per_user', '100', 'number', 'Maximum QR codes per user'),
('qr_codes', 'enable_group_sharing', 'true', 'boolean', 'Allow users to view group QR codes'),
('qr_codes', 'allow_edit_others', 'false', 'boolean', 'Allow editing others QR codes in same group'),

-- URL Settings
('urls', 'default_domain', 'https://scn.ly', 'string', 'Default short URL domain'),
('urls', 'max_per_user', '200', 'number', 'Maximum URLs per user'),
('urls', 'enable_group_sharing', 'true', 'boolean', 'Allow users to view group URLs'),
('urls', 'allow_edit_others', 'false', 'boolean', 'Allow editing others URLs in same group'),
('urls', 'default_expiry_days', '365', 'number', 'Default expiry in days'),

-- Email Settings  
('email', 'smtp_host', '', 'string', 'SMTP server host'),
('email', 'smtp_port', '587', 'number', 'SMTP server port'),
('email', 'smtp_username', '', 'string', 'SMTP username'),
('email', 'from_email', 'noreply@scanly.indovisual.co.id', 'string', 'Default sender email'),
('email', 'from_name', 'Scanly System', 'string', 'Default sender name')

ON CONFLICT (category, setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = CURRENT_TIMESTAMP;

-- Insert default role permissions based on your requirements
INSERT INTO role_permissions (role, resource_type, permission_type, scope, description) VALUES
-- ADMIN: Full access to everything
('admin', 'qr_codes', 'create', 'all', 'Admin can create QR codes for anyone'),
('admin', 'qr_codes', 'read', 'all', 'Admin can view all QR codes'),
('admin', 'qr_codes', 'update', 'all', 'Admin can edit any QR code'),
('admin', 'qr_codes', 'delete', 'all', 'Admin can delete any QR code'),
('admin', 'urls', 'create', 'all', 'Admin can create URLs for anyone'),
('admin', 'urls', 'read', 'all', 'Admin can view all URLs'),
('admin', 'urls', 'update', 'all', 'Admin can edit any URL'),
('admin', 'urls', 'delete', 'all', 'Admin can delete any URL'),
('admin', 'users', 'create', 'all', 'Admin can create users'),
('admin', 'users', 'read', 'all', 'Admin can view all users'),
('admin', 'users', 'update', 'all', 'Admin can edit any user'),
('admin', 'users', 'delete', 'all', 'Admin can delete users'),
('admin', 'groups', 'manage', 'all', 'Admin can manage all groups'),
('admin', 'analytics', 'read', 'all', 'Admin can view all analytics'),
('admin', 'system', 'manage', 'all', 'Admin can manage system settings'),

-- EDITOR: Group + own access, can create/edit but limited delete
('editor', 'qr_codes', 'create', 'group', 'Editor can create QR codes in their group'),
('editor', 'qr_codes', 'read', 'group', 'Editor can view group QR codes'),
('editor', 'qr_codes', 'update', 'own', 'Editor can only edit their own QR codes'),
('editor', 'qr_codes', 'delete', 'own', 'Editor can only delete their own QR codes'),
('editor', 'urls', 'create', 'group', 'Editor can create URLs in their group'),
('editor', 'urls', 'read', 'group', 'Editor can view group URLs'),
('editor', 'urls', 'update', 'own', 'Editor can only edit their own URLs'),
('editor', 'urls', 'delete', 'own', 'Editor can only delete their own URLs'),
('editor', 'users', 'read', 'group', 'Editor can view group users'),
('editor', 'analytics', 'read', 'group', 'Editor can view group analytics'),

-- VIEWER: Group read access only
('viewer', 'qr_codes', 'read', 'group', 'Viewer can view group QR codes'),
('viewer', 'urls', 'read', 'group', 'Viewer can view group URLs'),
('viewer', 'users', 'read', 'group', 'Viewer can view group users'),
('viewer', 'analytics', 'read', 'group', 'Viewer can view group analytics'),

-- USER: Own data only + limited group read
('user', 'qr_codes', 'create', 'own', 'User can create their own QR codes'),
('user', 'qr_codes', 'read', 'group', 'User can view group QR codes'),
('user', 'qr_codes', 'update', 'own', 'User can only edit their own QR codes'),
('user', 'qr_codes', 'delete', 'own', 'User can only delete their own QR codes'),
('user', 'urls', 'create', 'own', 'User can create their own URLs'),
('user', 'urls', 'read', 'group', 'User can view group URLs'),
('user', 'urls', 'update', 'own', 'User can only edit their own URLs'),
('user', 'urls', 'delete', 'own', 'User can only delete their own URLs'),
('user', 'users', 'read', 'group', 'User can view group users'),
('user', 'analytics', 'read', 'own', 'User can view their own analytics')

ON CONFLICT (role, resource_type, permission_type) DO UPDATE SET 
    scope = EXCLUDED.scope,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- Insert default menu permissions (sidebar control)
INSERT INTO menu_role_permissions (role, menu_item, enabled) VALUES
-- ADMIN: Access to all menus
('admin', 'dashboard', true),
('admin', 'users', true),
('admin', 'groups', true),
('admin', 'qr-codes', true),
('admin', 'url-list', true),
('admin', 'analytics', true),
('admin', 'reports', true),
('admin', 'settings', true),
('admin', 'admin-panel', true),

-- EDITOR: Limited admin features
('editor', 'dashboard', true),
('editor', 'users', false),
('editor', 'groups', false),
('editor', 'qr-codes', true),
('editor', 'url-list', true),
('editor', 'analytics', true),
('editor', 'reports', true),
('editor', 'settings', false),
('editor', 'admin-panel', false),

-- VIEWER: Read-only access
('viewer', 'dashboard', true),
('viewer', 'users', false),
('viewer', 'groups', false),
('viewer', 'qr-codes', true),
('viewer', 'url-list', true),
('viewer', 'analytics', true),
('viewer', 'reports', false),
('viewer', 'settings', false),
('viewer', 'admin-panel', false),

-- USER: Basic features only
('user', 'dashboard', true),
('user', 'users', false),
('user', 'groups', false),
('user', 'qr-codes', true),
('user', 'url-list', true),
('user', 'analytics', false),
('user', 'reports', false),
('user', 'settings', false),
('user', 'admin-panel', false)

ON CONFLICT (role, menu_item) DO UPDATE SET 
    enabled = EXCLUDED.enabled,
    updated_at = CURRENT_TIMESTAMP;
