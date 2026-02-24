-- Add sample data to short_urls and click_events tables
-- This script adds realistic sample data for testing dashboard analytics

-- First, add some short URLs if they don't exist
INSERT INTO short_urls (id, short_code, short_url, original_url, user_id, title, description, clicks, is_active, created_at, updated_at, expires_at)
VALUES 
  ('22222222-2222-2222-2222-222222222001', 'abc123', 'https://scanly.app/abc123', 'https://www.google.com', 'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', 'Google Search', 'Main Google search page', 0, true, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NULL),
  ('22222222-2222-2222-2222-222222222002', 'xyz789', 'https://scanly.app/xyz789', 'https://www.github.com', 'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', 'GitHub', 'GitHub main page', 0, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NULL),
  ('22222222-2222-2222-2222-222222222003', 'def456', 'https://scanly.app/def456', 'https://www.youtube.com', 'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', 'YouTube', 'YouTube main page', 0, true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NULL),
  ('22222222-2222-2222-2222-222222222004', 'ghi789', 'https://scanly.app/ghi789', 'https://www.linkedin.com', 'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', 'LinkedIn', 'Professional network', 0, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL),
  ('22222222-2222-2222-2222-222222222005', 'jkl012', 'https://scanly.app/jkl012', 'https://www.stackoverflow.com', 'af6b7277-5dd7-4a4d-9501-b5e6f15202e8', 'Stack Overflow', 'Programming Q&A', 0, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL)
ON CONFLICT (id) DO NOTHING;

-- Now insert sample click events for these short URLs
INSERT INTO click_events (id, short_url_id, ip_address, user_agent, referer, country, city, device_type, browser, os, clicked_at, session_id, created_at)
VALUES 
  -- Click events for Google short URL (abc123)
  ('11111111-1111-1111-1111-111111111001', 
   '22222222-2222-2222-2222-222222222001', 
   '203.142.45.12', 
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
   'https://facebook.com',
   'ID',
   'Jakarta',
   'desktop',
   'Chrome',
   'Windows',
   NOW() - INTERVAL '1 hour',
   'sess_001',
   NOW() - INTERVAL '1 hour'),
   
  ('11111111-1111-1111-1111-111111111002', 
   '22222222-2222-2222-2222-222222222001', 
   '180.254.123.45', 
   'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
   'https://twitter.com',
   'ID',
   'Bandung',
   'mobile',
   'Safari',
   'iOS',
   NOW() - INTERVAL '2 hours',
   'sess_002',
   NOW() - INTERVAL '2 hours'),
   
  ('11111111-1111-1111-1111-111111111003', 
   '22222222-2222-2222-2222-222222222001', 
   '125.166.78.90', 
   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
   'https://instagram.com',
   'ID',
   'Surabaya',
   'desktop',
   'Chrome',
   'macOS',
   NOW() - INTERVAL '3 hours',
   'sess_003',
   NOW() - INTERVAL '3 hours'),
   
  -- Click events for GitHub short URL (xyz789)
  ('11111111-1111-1111-1111-111111111004', 
   '22222222-2222-2222-2222-222222222002', 
   '202.158.34.67', 
   'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/120.0 Firefox/120.0',
   'https://reddit.com',
   'ID',
   'Medan',
   'mobile',
   'Firefox',
   'Android',
   NOW() - INTERVAL '4 hours',
   'sess_004',
   NOW() - INTERVAL '4 hours'),
   
  ('11111111-1111-1111-1111-111111111005', 
   '22222222-2222-2222-2222-222222222002', 
   '114.124.167.89', 
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/120.0',
   'https://linkedin.com',
   'ID',
   'Yogyakarta',
   'desktop',
   'Firefox',
   'Windows',
   NOW() - INTERVAL '5 hours',
   'sess_005',
   NOW() - INTERVAL '5 hours'),
   
  -- Click events for YouTube short URL (def456)
  ('11111111-1111-1111-1111-111111111006', 
   '22222222-2222-2222-2222-222222222003', 
   '103.147.8.45', 
   'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
   'https://youtube.com',
   'ID',
   'Semarang',
   'tablet',
   'Safari',
   'iPadOS',
   NOW() - INTERVAL '6 hours',
   'sess_006',
   NOW() - INTERVAL '6 hours'),
   
  ('11111111-1111-1111-1111-111111111007', 
   '22222222-2222-2222-2222-222222222003', 
   '182.1.78.123', 
   'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
   'https://whatsapp.com',
   'ID',
   'Malang',
   'desktop',
   'Chrome',
   'Linux',
   NOW() - INTERVAL '7 hours',
   'sess_007',
   NOW() - INTERVAL '7 hours'),
   
  -- Recent click events (last 24 hours) for better analytics
  ('11111111-1111-1111-1111-111111111008', 
   '22222222-2222-2222-2222-222222222001', 
   '210.57.123.45', 
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
   'https://google.com',
   'ID',
   'Jakarta',
   'desktop',
   'Chrome',
   'Windows',
   NOW() - INTERVAL '30 minutes',
   'sess_008',
   NOW() - INTERVAL '30 minutes'),
   
  ('11111111-1111-1111-1111-111111111009', 
   '22222222-2222-2222-2222-222222222002', 
   '103.28.148.67', 
   'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
   'https://telegram.org',
   'ID',
   'Bogor',
   'mobile',
   'Safari',
   'iOS',
   NOW() - INTERVAL '45 minutes',
   'sess_009',
   NOW() - INTERVAL '45 minutes'),
   
  ('11111111-1111-1111-1111-111111111010', 
   '22222222-2222-2222-2222-222222222003', 
   '36.80.45.123', 
   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
   'https://reddit.com',
   'ID',
   'Tangerang',
   'desktop',
   'Safari',
   'macOS',
   NOW() - INTERVAL '1 hour 15 minutes',
   'sess_010',
   NOW() - INTERVAL '1 hour 15 minutes'),
   
  -- More recent clicks for trend analysis
  ('11111111-1111-1111-1111-111111111011', 
   '22222222-2222-2222-2222-222222222004', 
   '139.195.67.89', 
   'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/120.0 Firefox/120.0',
   'https://tiktok.com',
   'ID',
   'Bekasi',
   'mobile',
   'Firefox',
   'Android',
   NOW() - INTERVAL '2 hours 30 minutes',
   'sess_011',
   NOW() - INTERVAL '2 hours 30 minutes'),
   
  ('11111111-1111-1111-1111-111111111012', 
   '22222222-2222-2222-2222-222222222005', 
   '202.43.178.90', 
   'Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
   'https://github.com',
   'ID',
   'Depok',
   'desktop',
   'Chrome',
   'Windows',
   NOW() - INTERVAL '3 hours 45 minutes',
   'sess_012',
   NOW() - INTERVAL '3 hours 45 minutes'),
   
  -- International clicks
  ('11111111-1111-1111-1111-111111111013', 
   '22222222-2222-2222-2222-222222222001', 
   '8.8.8.8', 
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
   'https://google.com',
   'US',
   'Mountain View',
   'desktop',
   'Chrome',
   'Windows',
   NOW() - INTERVAL '5 hours',
   'sess_013',
   NOW() - INTERVAL '5 hours'),
   
  ('11111111-1111-1111-1111-111111111014', 
   '22222222-2222-2222-2222-222222222002', 
   '1.1.1.1', 
   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
   'https://cloudflare.com',
   'AU',
   'Sydney',
   'desktop',
   'Chrome',
   'macOS',
   NOW() - INTERVAL '6 hours',
   'sess_014',
   NOW() - INTERVAL '6 hours'),
   
  ('11111111-1111-1111-1111-111111111015', 
   '22222222-2222-2222-2222-222222222003', 
   '185.199.108.153', 
   'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
   'https://github.com',
   'SG',
   'Singapore',
   'desktop',
   'Chrome',
   'Linux',
   NOW() - INTERVAL '8 hours',
   'sess_015',
   NOW() - INTERVAL '8 hours')
ON CONFLICT (id) DO NOTHING;

-- Update the click counts in short_urls table to match the click events
UPDATE short_urls 
SET clicks = (
    SELECT COUNT(*) 
    FROM click_events 
    WHERE click_events.short_url_id = short_urls.id
),
updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT short_url_id 
    FROM click_events 
    WHERE short_url_id IS NOT NULL
);

-- Show the results
SELECT 
    su.short_code,
    su.original_url,
    su.clicks,
    COUNT(ce.id) as actual_click_events
FROM short_urls su
LEFT JOIN click_events ce ON su.id = ce.short_url_id
GROUP BY su.id, su.short_code, su.original_url, su.clicks
ORDER BY su.clicks DESC;
