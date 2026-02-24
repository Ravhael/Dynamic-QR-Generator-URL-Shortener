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
  gen_random_uuid(),
  'test@example.com',
  'Test User',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

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
  (SELECT id FROM public.users WHERE email = 'test@example.com' LIMIT 1),
  'General',
  'Default QR category',
  '#3B82F6',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

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
  (SELECT id FROM public.users WHERE email = 'test@example.com' LIMIT 1),
  'General',
  'Default URL category',
  '#3B82F6',
  true,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;
