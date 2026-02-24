-- Setup test data without requiring auth.users entries
-- This script creates test data that works with the current schema

-- First, let's temporarily disable the foreign key constraint if it exists
-- and create test data that doesn't depend on auth.users

-- Check if we need to disable RLS temporarily for data insertion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_urls DISABLE ROW LEVEL SECURITY;

-- Create a test user directly (this will work if there's no FK constraint to auth.users)
-- If there is a FK constraint, we'll need to handle it differently
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

-- Create default QR categories
INSERT INTO public.qr_categories (
  id,
  user_id,
  name,
  description,
  color,
  is_default,
  created_at,
  updated_at
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  'Business',
  'Business related QR codes',
  '#3B82F6',
  true,
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  'Personal',
  'Personal QR codes',
  '#10B981',
  false,
  NOW(),
  NOW()
),
(
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  'Marketing',
  'Marketing campaigns',
  '#F59E0B',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create default URL categories
INSERT INTO public.url_categories (
  id,
  user_id,
  name,
  description,
  color,
  is_default,
  created_at,
  updated_at
) VALUES 
(
  '660e8400-e29b-41d4-a716-446655440001'::uuid,
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  'Business',
  'Business related URLs',
  '#3B82F6',
  true,
  NOW(),
  NOW()
),
(
  '660e8400-e29b-41d4-a716-446655440002'::uuid,
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  'Social Media',
  'Social media links',
  '#8B5CF6',
  false,
  NOW(),
  NOW()
),
(
  '660e8400-e29b-41d4-a716-446655440003'::uuid,
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  'Resources',
  'Resource links',
  '#EF4444',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create sample QR codes
INSERT INTO public.qr_codes (
  id,
  user_id,
  category_id,
  name,
  type,
  content,
  qr_code_data,
  is_dynamic,
  is_active,
  scans,
  created_at,
  updated_at
) VALUES 
(
  '770e8400-e29b-41d4-a716-446655440001'::uuid,
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'Company Website',
  'url',
  'https://indovisual.co.id',
  'https://indovisual.co.id',
  false,
  true,
  25,
  NOW(),
  NOW()
),
(
  '770e8400-e29b-41d4-a716-446655440002'::uuid,
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'Contact Info',
  'text',
  'Contact us at: +62 123 456 789',
  'Contact us at: +62 123 456 789',
  false,
  true,
  12,
  NOW(),
  NOW()
),
(
  '770e8400-e29b-41d4-a716-446655440003'::uuid,
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'WiFi Access',
  'wifi',
  '{"ssid":"ScanlyOffice","password":"scanly2024","security":"WPA"}',
  'WIFI:T:WPA;S:ScanlyOffice;P:scanly2024;;',
  false,
  true,
  8,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create sample short URLs
INSERT INTO public.short_urls (
  id,
  user_id,
  category_id,
  original_url,
  short_code,
  short_url,
  title,
  description,
  is_active,
  clicks,
  created_at,
  updated_at
) VALUES 
(
  '880e8400-e29b-41d4-a716-446655440001'::uuid,
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  '660e8400-e29b-41d4-a716-446655440001'::uuid,
  'https://indovisual.co.id/services',
  'services',
  'https://scanly.indovisual.co.id/s/services',
  'Our Services',
  'Comprehensive digital services',
  true,
  45,
  NOW(),
  NOW()
),
(
  '880e8400-e29b-41d4-a716-446655440002'::uuid,
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  '660e8400-e29b-41d4-a716-446655440002'::uuid,
  'https://instagram.com/indovisual',
  'instagram',
  'https://scanly.indovisual.co.id/s/instagram',
  'Follow Us on Instagram',
  'Latest updates and portfolio',
  true,
  78,
  NOW(),
  NOW()
),
(
  '880e8400-e29b-41d4-a716-446655440003'::uuid,
  'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
  '660e8400-e29b-41d4-a716-446655440003'::uuid,
  'https://indovisual.co.id/portfolio',
  'portfolio',
  'https://scanly.indovisual.co.id/s/portfolio',
  'Our Portfolio',
  'Showcase of our best work',
  true,
  32,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_urls ENABLE ROW LEVEL SECURITY;

-- Verify the data was inserted
SELECT 'Users created:' as info, COUNT(*) as count FROM public.users;
SELECT 'QR Categories created:' as info, COUNT(*) as count FROM public.qr_categories;
SELECT 'URL Categories created:' as info, COUNT(*) as count FROM public.url_categories;
SELECT 'QR Codes created:' as info, COUNT(*) as count FROM public.qr_codes;
SELECT 'Short URLs created:' as info, COUNT(*) as count FROM public.short_urls;
