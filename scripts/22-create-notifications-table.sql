-- Add notifications table for user and group-based notifications
-- Created: 2025-08-27

-- Table for storing notifications that can be targeted to users, groups, or system-wide
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'success', 'warning', 'error', 'announcement'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    category VARCHAR(50), -- 'system', 'qr_code', 'url', 'security', 'maintenance', 'feature', etc.
    
    -- Target configuration - who should receive this notification
    target_type VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user', 'group', 'role', 'all_users', 'admin_only'
    target_id UUID, -- user_id for 'user', group_id for 'group', null for 'all_users'
    target_role VARCHAR(50), -- 'admin', 'editor', 'viewer' when target_type = 'role'
    
    -- Notification behavior
    is_persistent BOOLEAN DEFAULT FALSE, -- Whether notification stays until dismissed
    auto_dismiss_minutes INTEGER, -- Auto-dismiss after X minutes (null = no auto-dismiss)
    show_popup BOOLEAN DEFAULT TRUE, -- Show as popup notification
    send_email BOOLEAN DEFAULT FALSE, -- Send email notification
    send_push BOOLEAN DEFAULT FALSE, -- Send push notification
    
    -- Scheduling and timing
    scheduled_at TIMESTAMPTZ, -- When to send (null = send immediately)
    expires_at TIMESTAMPTZ, -- When notification expires
    
    -- Content and display
    action_url TEXT, -- URL to navigate when notification is clicked
    action_label VARCHAR(100), -- Label for action button (e.g., "View Details", "Update Now")
    icon VARCHAR(50) DEFAULT 'bell', -- Icon name for UI display
    color VARCHAR(20), -- Color theme for notification
    image_url TEXT, -- Optional image for rich notifications
    
    -- Metadata and tracking
    metadata JSONB DEFAULT '{}', -- Additional data (e.g., related resource info)
    is_read BOOLEAN DEFAULT FALSE, -- For individual user notifications
    is_dismissed BOOLEAN DEFAULT FALSE,
    click_count INTEGER DEFAULT 0,
    
    -- Audit fields
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who created this notification
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ, -- When notification was actually sent
    read_at TIMESTAMPTZ, -- When user read the notification
    dismissed_at TIMESTAMPTZ -- When user dismissed the notification
);

-- Table for tracking notification delivery to individual recipients
CREATE TABLE IF NOT EXISTS notification_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Individual recipient status
    is_delivered BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    is_clicked BOOLEAN DEFAULT FALSE,
    
    -- Delivery channels
    delivered_popup BOOLEAN DEFAULT FALSE,
    delivered_email BOOLEAN DEFAULT FALSE,
    delivered_push BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    
    -- Delivery attempts
    email_attempts INTEGER DEFAULT 0,
    push_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(notification_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_target_type ON notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_notifications_target_id ON notifications(target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_is_dismissed ON notifications(is_dismissed);

CREATE INDEX IF NOT EXISTS idx_notification_recipients_notification_id ON notification_recipients(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_user_id ON notification_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_is_read ON notification_recipients(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_is_delivered ON notification_recipients(is_delivered);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_delivered_at ON notification_recipients(delivered_at);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create notification recipients based on target
CREATE OR REPLACE FUNCTION create_notification_recipients()
RETURNS TRIGGER AS $$
BEGIN
    -- For user-specific notifications
    IF NEW.target_type = 'user' AND NEW.target_id IS NOT NULL THEN
        INSERT INTO notification_recipients (notification_id, user_id)
        VALUES (NEW.id, NEW.target_id);
    
    -- For group-based notifications
    ELSIF NEW.target_type = 'group' AND NEW.target_id IS NOT NULL THEN
        INSERT INTO notification_recipients (notification_id, user_id)
        SELECT NEW.id, ug.user_id
        FROM user_groups ug
        WHERE ug.group_id = NEW.target_id;
    
    -- For role-based notifications
    ELSIF NEW.target_type = 'role' AND NEW.target_role IS NOT NULL THEN
        INSERT INTO notification_recipients (notification_id, user_id)
        SELECT NEW.id, u.id
        FROM users u
        WHERE u.role = NEW.target_role;
    
    -- For all users
    ELSIF NEW.target_type = 'all_users' THEN
        INSERT INTO notification_recipients (notification_id, user_id)
        SELECT NEW.id, u.id
        FROM users u;
    
    -- For admin only
    ELSIF NEW.target_type = 'admin_only' THEN
        INSERT INTO notification_recipients (notification_id, user_id)
        SELECT NEW.id, u.id
        FROM users u
        WHERE u.role = 'admin';
    
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create recipients
CREATE TRIGGER trigger_create_notification_recipients
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_recipients();

-- Insert sample notifications for different scenarios
INSERT INTO notifications (title, message, type, priority, category, target_type, target_id, is_persistent, show_popup, send_email, icon, color, action_url, action_label, created_by) VALUES
-- System-wide announcement
('Welcome to Scanly v11!', 'We have launched a new version with enhanced features and better performance.', 'announcement', 'normal', 'system', 'all_users', NULL, true, true, true, 'megaphone', 'blue', '/dashboard', 'Explore Features', (SELECT id FROM users WHERE email = 'admin@scanly.indovisual.co.id' LIMIT 1)),

-- Admin-only notification
('Database Backup Completed', 'Daily database backup has been completed successfully at ' || NOW()::text, 'success', 'normal', 'maintenance', 'admin_only', NULL, false, true, false, 'database', 'green', '/admin-panel', 'View Details', (SELECT id FROM users WHERE email = 'admin@scanly.indovisual.co.id' LIMIT 1)),

-- Security alert for all users
('Security Update Required', 'Please update your password to meet new security requirements.', 'warning', 'high', 'security', 'all_users', NULL, true, true, true, 'shield-alert', 'orange', '/profile', 'Update Password', (SELECT id FROM users WHERE email = 'admin@scanly.indovisual.co.id' LIMIT 1)),

-- Feature notification for specific role
('New Analytics Dashboard', 'Enhanced analytics dashboard is now available for editors and admins.', 'info', 'normal', 'feature', 'role', NULL, false, true, false, 'bar-chart', 'purple', '/analytics', 'View Analytics', (SELECT id FROM users WHERE email = 'admin@scanly.indovisual.co.id' LIMIT 1)),

-- Maintenance notification
('Scheduled Maintenance', 'System maintenance is scheduled for tonight at 2:00 AM. Expected downtime: 30 minutes.', 'warning', 'high', 'maintenance', 'all_users', NULL, true, true, true, 'tool', 'yellow', NULL, NULL, (SELECT id FROM users WHERE email = 'admin@scanly.indovisual.co.id' LIMIT 1));

-- Update the role-based notification target_role
UPDATE notifications SET target_role = 'editor' WHERE title = 'New Analytics Dashboard';

COMMENT ON TABLE notifications IS 'System notifications that can be targeted to users, groups, or roles';
COMMENT ON TABLE notification_recipients IS 'Tracks notification delivery and read status for individual users';
COMMENT ON COLUMN notifications.target_type IS 'Defines who should receive: user, group, role, all_users, admin_only';
COMMENT ON COLUMN notifications.target_id IS 'Specific user_id or group_id when target_type requires it';
COMMENT ON COLUMN notifications.is_persistent IS 'Whether notification stays until manually dismissed';
COMMENT ON COLUMN notification_recipients.is_delivered IS 'Whether notification was successfully delivered to user';

-- Create view for easy querying of user notifications with status
CREATE OR REPLACE VIEW user_notifications AS
SELECT 
    n.id,
    n.title,
    n.message,
    n.type,
    n.priority,
    n.category,
    n.target_type,
    n.is_persistent,
    n.show_popup,
    n.icon,
    n.color,
    n.action_url,
    n.action_label,
    n.image_url,
    n.metadata,
    n.created_at,
    n.expires_at,
    nr.user_id,
    nr.is_delivered,
    nr.is_read,
    nr.is_dismissed,
    nr.is_clicked,
    nr.delivered_at,
    nr.read_at,
    nr.dismissed_at,
    nr.clicked_at
FROM notifications n
JOIN notification_recipients nr ON n.id = nr.notification_id
WHERE (n.expires_at IS NULL OR n.expires_at > NOW());

-- Show creation status
SELECT 
    'Notifications system created successfully!' as status,
    (SELECT COUNT(*) FROM notifications) as total_notifications,
    (SELECT COUNT(*) FROM notification_recipients) as total_recipients;
