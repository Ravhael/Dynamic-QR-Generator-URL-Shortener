-- Seed / upsert standard activity types
-- Safe idempotent script: uses INSERT ... ON CONFLICT (code) DO UPDATE to avoid duplicates
-- Adjust colors/icons as needed. Run this manually against the database.

BEGIN;

INSERT INTO activity_types (code, name, description, category, icon, color, priority, weight, is_sensitive, requires_approval)
VALUES
  ('LOGIN', 'User Login', 'User successfully logged in', 'auth', 'LogIn', '#3B82F6', 10, 0, false, false),
  ('LOGOUT', 'User Logout', 'User logged out', 'auth', 'LogOut', '#6B7280', 90, 0, false, false),
  ('FAILED_LOGIN', 'Failed Login Attempt', 'Invalid login attempt detected', 'auth', 'ShieldAlert', '#EF4444', 15, 5, true, false),
  ('PASSWORD_CHANGE', 'Password Change', 'User changed password', 'security', 'KeyRound', '#6366F1', 20, 0, true, false),
  ('USER_CREATE', 'Create User', 'A new user account was created', 'user', 'UserPlus', '#10B981', 30, 0, false, false),
  ('USER_UPDATE', 'Update User', 'User account details updated', 'user', 'UserCog', '#F59E0B', 40, 0, false, false),
  ('USER_DEACTIVATE', 'Deactivate User', 'User account deactivated', 'user', 'UserX', '#DC2626', 45, 0, true, false),
  ('GROUP_CREATE', 'Create Group', 'A new group was created', 'group', 'FolderPlus', '#10B981', 50, 0, false, false),
  ('GROUP_UPDATE', 'Update Group', 'Group details updated', 'group', 'FolderCog', '#F59E0B', 55, 0, false, false),
  ('GROUP_ASSIGN', 'Assign User To Group', 'User assigned to a group', 'group', 'UserCheck', '#3B82F6', 56, 0, false, false),
  ('QR_CREATE', 'Create QR Code', 'A new QR code was created', 'qr', 'QrCode', '#10B981', 60, 0, false, false),
  ('QR_UPDATE', 'Update QR Code', 'QR code updated', 'qr', 'QrCodeEdit', '#F59E0B', 65, 0, false, false),
  ('QR_SCAN', 'Scan QR Code', 'QR code scan recorded', 'qr', 'Scan', '#6366F1', 66, 0, false, false),
  ('URL_CREATE', 'Create Short URL', 'A new short URL was created', 'url', 'LinkPlus', '#10B981', 70, 0, false, false),
  ('URL_CLICK', 'URL Click', 'Short URL click recorded', 'url', 'MousePointerClick', '#6366F1', 71, 0, false, false),
  ('SETTINGS_UPDATE', 'Update Settings', 'System or user settings updated', 'system', 'Settings', '#F59E0B', 80, 0, true, false),
  ('PERMISSION_UPDATE', 'Update Permissions', 'Role or permission updated', 'security', 'ShieldCheck', '#6366F1', 85, 0, true, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  priority = EXCLUDED.priority,
  weight = EXCLUDED.weight,
  is_sensitive = EXCLUDED.is_sensitive,
  requires_approval = EXCLUDED.requires_approval,
  updated_at = NOW();

COMMIT;

-- Verification query suggestion:
-- SELECT code, name, category FROM activity_types ORDER BY code;