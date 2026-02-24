-- Fix RLS policies to prevent infinite recursion
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new policies that don't cause recursion
-- Allow users to insert their own profile using auth.uid() directly
CREATE POLICY "Allow user to insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Allow users to view their own profile using auth.uid() directly  
CREATE POLICY "Allow user to view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

-- Allow users to update their own profile using auth.uid() directly
CREATE POLICY "Allow user to update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- Allow service role to manage all users (for admin functions)
CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (auth.role() = 'service_role');
