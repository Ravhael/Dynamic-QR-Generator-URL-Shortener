-- Update users table constraint to include 'user' role
-- This allows regular users to be created with role 'user'

-- Drop existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint that includes all 4 roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'editor', 'viewer', 'user'));

-- Update default role to 'user' instead of 'viewer'
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';

-- Display confirmation
SELECT 'Updated users table role constraint to include all 4 roles: admin, editor, viewer, user' as status;
SELECT 'Default role changed from viewer to user' as default_status;
