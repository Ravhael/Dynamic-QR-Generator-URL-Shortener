-- Completely disable RLS on users table to eliminate infinite recursion
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create simple policies that don't reference the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own profile
CREATE POLICY "Allow authenticated users to insert own profile" ON users
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Allow users to view own profile" ON users
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON users
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Ensure the admin user exists in the users table
INSERT INTO users (id, name, email, role, created_at, updated_at)
VALUES (
  'c2823bb2-0751-4954-860a-74a7201b90f7',
  'Admin User',
  'admin@scanly.indovisual.co.id',
  'admin',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = NOW();
