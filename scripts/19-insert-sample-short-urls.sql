-- Insert sample short URLs data
INSERT INTO short_urls (
  id,
  user_id,
  original_url,
  short_code,
  title,
  description,
  category_id,
  tags,
  is_active,
  click_count,
  max_clicks,
  expires_at,
  custom_domain,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'af6b7277-5dd7-4a4d-9501-b5e6f15202e8',
  'https://www.google.com',
  'google1',
  'Google Homepage',
  'Link to Google search engine',
  (SELECT id FROM url_categories LIMIT 1),
  ARRAY['search', 'engine', 'web'],
  true,
  125,
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '1 day'
),
(
  gen_random_uuid(),
  'af6b7277-5dd7-4a4d-9501-b5e6f15202e8',
  'https://github.com/vercel/next.js',
  'nextjs',
  'Next.js GitHub Repository',
  'Official Next.js repository on GitHub',
  (SELECT id FROM url_categories LIMIT 1),
  ARRAY['react', 'framework', 'development'],
  true,
  89,
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '2 hours'
),
(
  gen_random_uuid(),
  'af6b7277-5dd7-4a4d-9501-b5e6f15202e8',
  'https://tailwindcss.com/docs',
  'tailwind',
  'Tailwind CSS Documentation',
  'Official Tailwind CSS documentation',
  (SELECT id FROM url_categories LIMIT 1),
  ARRAY['css', 'framework', 'design'],
  true,
  234,
  500,
  NULL,
  NULL,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '30 minutes'
),
(
  gen_random_uuid(),
  'af6b7277-5dd7-4a4d-9501-b5e6f15202e8',
  'https://supabase.com',
  'supabase',
  'Supabase - Backend as a Service',
  'The open source Firebase alternative',
  (SELECT id FROM url_categories LIMIT 1),
  ARRAY['database', 'backend', 'postgresql'],
  true,
  156,
  NULL,
  NOW() + INTERVAL '30 days',
  NULL,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '1 hour'
),
(
  gen_random_uuid(),
  'af6b7277-5dd7-4a4d-9501-b5e6f15202e8',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'never',
  'Never Gonna Give You Up',
  'Rick Astley classic music video',
  (SELECT id FROM url_categories LIMIT 1),
  ARRAY['music', 'video', 'classic'],
  false,
  1337,
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '3 days'
),
(
  gen_random_uuid(),
  'af6b7277-5dd7-4a4d-9501-b5e6f15202e8',
  'https://docs.docker.com',
  'docker',
  'Docker Documentation',
  'Official Docker documentation and guides',
  (SELECT id FROM url_categories LIMIT 1),
  ARRAY['container', 'devops', 'deployment'],
  true,
  78,
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '15 minutes'
);

-- Update click counts with some recent activity
INSERT INTO click_events (
  id,
  short_url_id,
  ip_address,
  user_agent,
  referrer,
  country,
  city,
  device_type,
  browser,
  os,
  clicked_at
)
SELECT 
  gen_random_uuid(),
  su.id,
  '192.168.1.' || (random() * 255)::int,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  CASE 
    WHEN random() > 0.5 THEN 'https://google.com'
    ELSE 'https://twitter.com'
  END,
  CASE 
    WHEN random() > 0.7 THEN 'Indonesia'
    WHEN random() > 0.4 THEN 'United States'
    ELSE 'Singapore'
  END,
  CASE 
    WHEN random() > 0.6 THEN 'Jakarta'
    WHEN random() > 0.3 THEN 'New York'
    ELSE 'Singapore'
  END,
  CASE 
    WHEN random() > 0.6 THEN 'Desktop'
    WHEN random() > 0.3 THEN 'Mobile'
    ELSE 'Tablet'
  END,
  'Chrome',
  'Windows',
  NOW() - (random() * INTERVAL '7 days')
FROM short_urls su
CROSS JOIN generate_series(1, (random() * 50 + 10)::int) as clicks;

-- Create some URL categories if they don't exist
INSERT INTO url_categories (id, name, description, color, user_id, created_at, updated_at)
VALUES 
(
  gen_random_uuid(),
  'Technology',
  'Technology and software related links',
  '#3B82F6',
  'af6b7277-5dd7-4a4d-9501-b5e6f15202e8',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Social Media',
  'Social media platforms and profiles',
  '#EF4444',
  'af6b7277-5dd7-4a4d-9501-b5e6f15202e8',
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Documentation',
  'Official documentation and guides',
  '#10B981',
  'af6b7277-5dd7-4a4d-9501-b5e6f15202e8',
  NOW(),
  NOW()
)
ON CONFLICT (name) DO NOTHING;
