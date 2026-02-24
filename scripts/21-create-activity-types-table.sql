-- Add activity_types table for better activity logging normalization
-- Created: 2025-08-27

-- Table for activity types to normalize user_activity logging
CREATE TABLE IF NOT EXISTS activity_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- 'LOGIN', 'LOGOUT', 'CREATE_QR', etc.
    name VARCHAR(100) NOT NULL, -- Human-readable name
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'auth', 'qr_management', 'url_management', 'admin', 'settings', etc.
    severity_level VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    is_active BOOLEAN DEFAULT TRUE,
    requires_target BOOLEAN DEFAULT FALSE, -- Whether this activity type requires a target_id
    icon VARCHAR(50), -- Icon name for UI display
    color VARCHAR(20), -- Color code for UI display
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_activity_types_code ON activity_types(code);
CREATE INDEX IF NOT EXISTS idx_activity_types_category ON activity_types(category);
CREATE INDEX IF NOT EXISTS idx_activity_types_is_active ON activity_types(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_activity_types_updated_at 
    BEFORE UPDATE ON activity_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert predefined activity types
INSERT INTO activity_types (code, name, description, category, severity_level, requires_target, icon, color) VALUES
-- Authentication activities
('LOGIN', 'User Login', 'User successfully logged into the system', 'auth', 'info', false, 'login', 'green'),
('LOGOUT', 'User Logout', 'User logged out of the system', 'auth', 'info', false, 'logout', 'blue'),
('LOGIN_FAILED', 'Login Failed', 'Failed login attempt', 'auth', 'warning', false, 'alert-triangle', 'orange'),
('PASSWORD_CHANGE', 'Password Changed', 'User changed their password', 'auth', 'info', false, 'key', 'blue'),
('PASSWORD_RESET', 'Password Reset', 'Password reset was requested', 'auth', 'info', false, 'refresh-cw', 'yellow'),

-- QR Code Management
('CREATE_QR', 'QR Code Created', 'New QR code was generated', 'qr_management', 'info', true, 'qr-code', 'green'),
('UPDATE_QR', 'QR Code Updated', 'QR code was modified', 'qr_management', 'info', true, 'edit', 'blue'),
('DELETE_QR', 'QR Code Deleted', 'QR code was removed', 'qr_management', 'warning', true, 'trash', 'red'),
('DOWNLOAD_QR', 'QR Code Downloaded', 'QR code image was downloaded', 'qr_management', 'info', true, 'download', 'green'),
('SCAN_QR', 'QR Code Scanned', 'QR code was scanned by someone', 'qr_management', 'info', true, 'scan', 'purple'),

-- URL Management
('CREATE_URL', 'Short URL Created', 'New short URL was generated', 'url_management', 'info', true, 'link', 'green'),
('UPDATE_URL', 'Short URL Updated', 'Short URL was modified', 'url_management', 'info', true, 'edit', 'blue'),
('DELETE_URL', 'Short URL Deleted', 'Short URL was removed', 'url_management', 'warning', true, 'trash', 'red'),
('CLICK_URL', 'Short URL Clicked', 'Short URL was accessed', 'url_management', 'info', true, 'mouse-pointer', 'purple'),

-- Category Management
('CREATE_CATEGORY', 'Category Created', 'New category was created', 'category_management', 'info', true, 'folder-plus', 'green'),
('UPDATE_CATEGORY', 'Category Updated', 'Category was modified', 'category_management', 'info', true, 'folder-edit', 'blue'),
('DELETE_CATEGORY', 'Category Deleted', 'Category was removed', 'category_management', 'warning', true, 'folder-minus', 'red'),

-- Group Management
('CREATE_GROUP', 'Group Created', 'New user group was created', 'group_management', 'info', true, 'users', 'green'),
('UPDATE_GROUP', 'Group Updated', 'User group was modified', 'group_management', 'info', true, 'user-edit', 'blue'),
('DELETE_GROUP', 'Group Deleted', 'User group was removed', 'group_management', 'warning', true, 'user-x', 'red'),
('JOIN_GROUP', 'User Joined Group', 'User was added to a group', 'group_management', 'info', true, 'user-plus', 'green'),
('LEAVE_GROUP', 'User Left Group', 'User was removed from a group', 'group_management', 'info', true, 'user-minus', 'orange'),

-- User Management
('CREATE_USER', 'User Created', 'New user account was created', 'user_management', 'info', true, 'user-plus', 'green'),
('UPDATE_USER', 'User Updated', 'User profile was modified', 'user_management', 'info', true, 'user-edit', 'blue'),
('DELETE_USER', 'User Deleted', 'User account was removed', 'user_management', 'warning', true, 'user-x', 'red'),
('ACTIVATE_USER', 'User Activated', 'User account was activated', 'user_management', 'info', true, 'user-check', 'green'),
('DEACTIVATE_USER', 'User Deactivated', 'User account was deactivated', 'user_management', 'warning', true, 'user-x', 'orange'),

-- Settings Management
('UPDATE_SETTINGS', 'Settings Updated', 'User settings were changed', 'settings', 'info', false, 'settings', 'blue'),
('UPDATE_PROFILE', 'Profile Updated', 'User profile information was changed', 'settings', 'info', false, 'user', 'blue'),

-- Migration Activities
('START_MIGRATION', 'Migration Started', 'QR code migration process began', 'migration', 'info', true, 'upload', 'blue'),
('COMPLETE_MIGRATION', 'Migration Completed', 'QR code migration finished successfully', 'migration', 'info', true, 'check', 'green'),
('FAIL_MIGRATION', 'Migration Failed', 'QR code migration encountered an error', 'migration', 'error', true, 'x', 'red'),

-- Export/Import Activities
('EXPORT_DATA', 'Data Exported', 'User exported data', 'data_management', 'info', false, 'download', 'green'),
('IMPORT_DATA', 'Data Imported', 'User imported data', 'data_management', 'info', false, 'upload', 'blue'),

-- Admin Activities
('ADMIN_LOGIN', 'Admin Login', 'Administrator logged into admin panel', 'admin', 'info', false, 'shield', 'purple'),
('ADMIN_SETTINGS_UPDATE', 'Admin Settings Updated', 'System settings were changed', 'admin', 'warning', false, 'settings', 'orange'),
('BACKUP_CREATED', 'Backup Created', 'System backup was created', 'admin', 'info', false, 'hard-drive', 'blue'),
('SYSTEM_MAINTENANCE', 'System Maintenance', 'System maintenance activity performed', 'admin', 'warning', false, 'tool', 'orange')

ON CONFLICT (code) DO NOTHING;

-- Add foreign key constraint to user_activity table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_activity_action_fkey'
    ) THEN
        ALTER TABLE user_activity 
        ADD CONSTRAINT user_activity_action_fkey 
        FOREIGN KEY (action) REFERENCES activity_types(code);
    END IF;
END $$;

COMMENT ON TABLE activity_types IS 'Normalized activity types for user activity logging';
COMMENT ON COLUMN activity_types.code IS 'Unique code used in user_activity.action';
COMMENT ON COLUMN activity_types.category IS 'Logical grouping of activity types';
COMMENT ON COLUMN activity_types.severity_level IS 'Importance level of the activity';
COMMENT ON COLUMN activity_types.requires_target IS 'Whether activity requires a target_id';

-- Show creation status
SELECT 'Activity types table created successfully with ' || COUNT(*) || ' predefined types!' as status
FROM activity_types;
