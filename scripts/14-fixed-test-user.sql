-- Create a test user for login testing
-- This will be handled by Supabase Auth, but we need to insert into our users table after signup

-- First, let's check if we have any users
SELECT COUNT(*) as user_count FROM auth.users;

-- Insert a test user into our custom users table
-- Note: This assumes a user with this email will be created via Supabase Auth
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  'admin@scanly.indovisual.co.id',
  'Admin Scanly',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Create default categories for the test user
INSERT INTO public.qr_categories (
  id,
  user_id,
  name,
  description,
  color,
  is_default,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  'General',
  'Default QR category',
  '#3B82F6',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.url_categories (
  id,
  user_id,
  name,
  description,
  color,
  is_default,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  'General',
  'Default URL category',
  '#3B82F6',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;
