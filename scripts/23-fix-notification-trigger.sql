-- Improved trigger function for notification recipients
-- Created: 2025-08-27

-- Function to automatically create notification recipients based on target (improved)
CREATE OR REPLACE FUNCTION create_notification_recipients()
RETURNS TRIGGER AS $$
BEGIN
    -- For user-specific notifications
    IF NEW.target_type = 'user' AND NEW.target_id IS NOT NULL THEN
        INSERT INTO notification_recipients (notification_id, user_id)
        SELECT NEW.id, NEW.target_id
        WHERE EXISTS (SELECT 1 FROM users WHERE id = NEW.target_id);
    
    -- For group-based notifications (only if user_groups table exists and has data)
    ELSIF NEW.target_type = 'group' AND NEW.target_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_groups') THEN
            INSERT INTO notification_recipients (notification_id, user_id)
            SELECT NEW.id, ug.user_id
            FROM user_groups ug
            WHERE ug.group_id = NEW.target_id
            AND EXISTS (SELECT 1 FROM users WHERE id = ug.user_id);
        END IF;
    
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

-- Recreate the trigger
CREATE TRIGGER trigger_create_notification_recipients
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_recipients();
