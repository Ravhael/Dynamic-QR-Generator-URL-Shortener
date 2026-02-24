-- Add sample data to scan_events table
-- This script adds realistic QR scan events data for testing analytics functionality

-- Insert sample scan events with various devices, locations, and patterns
INSERT INTO scan_events (
  id,
  qr_code_id,
  user_agent,
  ip_address,
  referer,
  country,
  city,
  device_type,
  browser,
  os,
  scanned_at,
  session_id,
  utm_source,
  utm_medium,
  utm_campaign,
  utm_term,
  utm_content,
  scan_method,
  scan_location,
  created_at
) VALUES 
  -- Mobile scans from various locations
  ('55555555-5555-5555-5555-555555555001',
   '550e8400-e29b-41d4-a716-446655440001', -- Google Website QR
   'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
   '103.28.124.45',
   'https://instagram.com/scanlyapp',
   'IDN',
   'Jakarta',
   'mobile',
   'Safari',
   'iOS',
   NOW() - INTERVAL '2 hours 15 minutes',
   'sess_mobile_001_' || EXTRACT(EPOCH FROM NOW())::text,
   'instagram',
   'social',
   'product_launch_2025',
   'qr_code',
   'story_post',
   'camera_app',
   POINT(-6.2088, 106.8456), -- Jakarta coordinates
   NOW() - INTERVAL '2 hours 15 minutes'),
   
  ('55555555-5555-5555-5555-555555555002',
   '550e8400-e29b-41d4-a716-446655440002', -- Company Website QR
   'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
   '114.79.52.180',
   'https://twitter.com/scanlyapp',
   'IDN',
   'Surabaya',
   'mobile',
   'Chrome',
   'Android',
   NOW() - INTERVAL '1 hour 45 minutes',
   'sess_android_002_' || extract(epoch from now()),
   'twitter',
   'social',
   'product_launch_2025',
   'mobile_scanning',
   'tweet_link',
   'qr_scanner_app',
   POINT(-7.2575, 112.7521), -- Surabaya coordinates
   NOW() - INTERVAL '1 hour 45 minutes'),
   
  -- Desktop scans
  ('55555555-5555-5555-5555-555555555003',
   '550e8400-e29b-41d4-a716-446655440003', -- YouTube Channel QR
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
   '182.1.96.210',
   'https://linkedin.com/company/scanly',
   'IDN',
   'Bandung',
   'desktop',
   'Chrome',
   'Windows',
   NOW() - INTERVAL '3 hours 30 minutes',
   'sess_desktop_003_' || extract(epoch from now()),
   'linkedin',
   'social',
   'b2b_campaign',
   'business_networking',
   'company_page',
   'webcam',
   POINT(-6.9175, 107.6191), -- Bandung coordinates
   NOW() - INTERVAL '3 hours 30 minutes'),
   
  ('55555555-5555-5555-5555-555555555004',
   '550e8400-e29b-41d4-a716-446655440004', -- Contact Info QR
   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
   '203.78.144.95',
   'https://facebook.com/scanlyapp',
   'IDN',
   'Medan',
   'desktop',
   'Chrome',
   'macOS',
   NOW() - INTERVAL '4 hours 10 minutes',
   'sess_mac_004_' || extract(epoch from now()),
   'facebook',
   'social',
   'brand_awareness',
   'contact_sharing',
   'page_post',
   'browser_camera',
   POINT(3.5952, 98.6722), -- Medan coordinates
   NOW() - INTERVAL '4 hours 10 minutes'),
   
  -- International scans
  ('55555555-5555-5555-5555-555555555005',
   '550e8400-e29b-41d4-a716-446655440001', -- Google Website QR
   'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
   '8.8.8.8',
   'https://google.com/search?q=qr+code+scanner',
   'USA',
   'Mountain View',
   'mobile',
   'Safari',
   'iOS',
   NOW() - INTERVAL '5 hours 20 minutes',
   'sess_usa_005_' || extract(epoch from now()),
   'google',
   'search',
   'organic_discovery',
   'qr code scanner',
   'search_results',
   'camera_app',
   POINT(37.4419, -122.1430), -- Mountain View coordinates
   NOW() - INTERVAL '5 hours 20 minutes'),
   
  ('55555555-5555-5555-5555-555555555006',
   '550e8400-e29b-41d4-a716-446655440005', -- Email Contact QR
   'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36',
   '1.1.1.1',
   'https://reddit.com/r/qrcodes',
   'AUS',
   'Sydney',
   'mobile',
   'Chrome',
   'Android',
   NOW() - INTERVAL '6 hours 45 minutes',
   'sess_aus_006_' || extract(epoch from now()),
   'reddit',
   'forum',
   'community_engagement',
   'qr discussion',
   'comment_link',
   'qr_scanner_app',
   POINT(-33.8688, 151.2093), -- Sydney coordinates
   NOW() - INTERVAL '6 hours 45 minutes'),
   
  -- Tablet scans
  ('55555555-5555-5555-5555-555555555007',
   '550e8400-e29b-41d4-a716-446655440002', -- Company Website QR
   'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
   '125.164.12.89',
   'https://youtube.com/@scanlyapp',
   'IDN',
   'Yogyakarta',
   'tablet',
   'Safari',
   'iPadOS',
   NOW() - INTERVAL '1 hour 5 minutes',
   'sess_ipad_007_' || extract(epoch from now()),
   'youtube',
   'video',
   'tutorial_series',
   'qr code tutorial',
   'video_description',
   'camera_app',
   POINT(-7.7956, 110.3695), -- Yogyakarta coordinates
   NOW() - INTERVAL '1 hour 5 minutes'),
   
  -- Recent high-frequency scans (business hours pattern)
  ('55555555-5555-5555-5555-555555555008',
   '550e8400-e29b-41d4-a716-446655440003', -- YouTube Channel QR
   'Mozilla/5.0 (Linux; Android 13; SM-A536B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36',
   '180.245.147.25',
   'https://tiktok.com/@scanlyapp',
   'IDN',
   'Denpasar',
   'mobile',
   'Chrome',
   'Android',
   NOW() - INTERVAL '30 minutes',
   'sess_tiktok_008_' || extract(epoch from now()),
   'tiktok',
   'video',
   'viral_campaign',
   'qr scanning',
   'video_overlay',
   'camera_app',
   POINT(-8.6705, 115.2126), -- Denpasar coordinates
   NOW() - INTERVAL '30 minutes'),
   
  ('55555555-5555-5555-5555-555555555009',
   '550e8400-e29b-41d4-a716-446655440004', -- Contact Info QR
   'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
   '202.80.216.30',
   'https://whatsapp.com/channel/scanlyupdates',
   'IDN',
   'Makassar',
   'mobile',
   'Safari',
   'iOS',
   NOW() - INTERVAL '45 minutes',
   'sess_whatsapp_009_' || extract(epoch from now()),
   'whatsapp',
   'messaging',
   'direct_share',
   'contact_card',
   'channel_message',
   'camera_app',
   POINT(-5.1477, 119.4327), -- Makassar coordinates
   NOW() - INTERVAL '45 minutes'),
   
  -- Multiple scans from same location (event/conference pattern)
  ('55555555-5555-5555-5555-555555555010',
   '550e8400-e29b-41d4-a716-446655440001', -- Google Website QR
   'Mozilla/5.0 (Linux; Android 12; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
   '36.67.248.129',
   'https://eventbrite.com/e/tech-conference-2025',
   'IDN',
   'Jakarta',
   'mobile',
   'Chrome',
   'Android',
   NOW() - INTERVAL '2 hours',
   'sess_event_010_' || extract(epoch from now()),
   'eventbrite',
   'event',
   'tech_conference_2025',
   'networking',
   'event_page',
   'qr_scanner_app',
   POINT(-6.2088, 106.8456), -- Jakarta coordinates (same as first scan)
   NOW() - INTERVAL '2 hours'),
   
  ('55555555-5555-5555-5555-555555555011',
   '550e8400-e29b-41d4-a716-446655440002', -- Company Website QR
   'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
   '36.67.248.130',
   'https://eventbrite.com/e/tech-conference-2025',
   'IDN',
   'Jakarta',
   'mobile',
   'Safari',
   'iOS',
   NOW() - INTERVAL '1 hour 50 minutes',
   'sess_event_011_' || extract(epoch from now()),
   'eventbrite',
   'event',
   'tech_conference_2025',
   'booth_visit',
   'sponsor_booth',
   'camera_app',
   POINT(-6.2088, 106.8456), -- Jakarta coordinates (conference location)
   NOW() - INTERVAL '1 hour 50 minutes'),
   
  -- Weekend leisure scanning pattern
  ('55555555-5555-5555-5555-555555555012',
   '550e8400-e29b-41d4-a716-446655440005', -- Email Contact QR
   'Mozilla/5.0 (Linux; Android 11; Redmi Note 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Mobile Safari/537.36',
   '158.140.167.45',
   'https://maps.google.com/restaurant-review',
   'IDN',
   'Semarang',
   'mobile',
   'Chrome',
   'Android',
   NOW() - INTERVAL '3 days 14 hours',
   'sess_weekend_012_' || extract(epoch from now()),
   'google_maps',
   'local',
   'restaurant_discovery',
   'menu qr code',
   'restaurant_listing',
   'camera_app',
   POINT(-6.9666, 110.4167), -- Semarang coordinates
   NOW() - INTERVAL '3 days 14 hours'),
   
  -- International business scanning
  ('55555555-5555-5555-5555-555555555013',
   '550e8400-e29b-41d4-a716-446655440003', -- YouTube Channel QR
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
   '203.0.113.10',
   'https://linkedin.com/in/business-development',
   'SGP',
   'Singapore',
   'desktop',
   'Chrome',
   'Windows',
   NOW() - INTERVAL '7 hours 30 minutes',
   'sess_business_013_' || extract(epoch from now()),
   'linkedin',
   'professional',
   'b2b_outreach',
   'business card',
   'profile_contact',
   'webcam',
   POINT(1.3521, 103.8198), -- Singapore coordinates
   NOW() - INTERVAL '7 hours 30 minutes'),
   
  -- Late night scanning (different timezone)
  ('55555555-5555-5555-5555-555555555014',
   '550e8400-e29b-41d4-a716-446655440004', -- Contact Info QR
   'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
   '74.125.224.72',
   'https://discord.gg/scanly-community',
   'USA',
   'San Francisco',
   'mobile',
   'Safari',
   'iOS',
   NOW() - INTERVAL '12 hours 15 minutes',
   'sess_discord_014_' || extract(epoch from now()),
   'discord',
   'community',
   'user_onboarding',
   'community invite',
   'server_welcome',
   'camera_app',
   POINT(37.7749, -122.4194), -- San Francisco coordinates
   NOW() - INTERVAL '12 hours 15 minutes'),
   
  -- Recent peak hour scan
  ('55555555-5555-5555-5555-555555555015',
   '550e8400-e29b-41d4-a716-446655440001', -- Google Website QR
   'Mozilla/5.0 (Linux; Android 13; ONEPLUS A6000) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36',
   '103.140.195.67',
   'https://telegram.me/scanlyofficial',
   'IDN',
   'Palembang',
   'mobile',
   'Chrome',
   'Android',
   NOW() - INTERVAL '15 minutes',
   'sess_telegram_015_' || extract(epoch from now()),
   'telegram',
   'messaging',
   'announcement_channel',
   'product update',
   'channel_post',
   'camera_app',
   POINT(-2.9761, 104.7754), -- Palembang coordinates
   NOW() - INTERVAL '15 minutes')
ON CONFLICT (id) DO NOTHING;

-- Show scan events statistics
SELECT 
    'Total Scans' as metric,
    COUNT(*)::text as value
FROM scan_events
UNION ALL
SELECT 
    'Unique QR Codes Scanned' as metric,
    COUNT(DISTINCT qr_code_id)::text as value
FROM scan_events
UNION ALL
SELECT 
    'Mobile Scans' as metric,
    CONCAT(COUNT(CASE WHEN device_type = 'mobile' THEN 1 END), ' (', 
           ROUND(COUNT(CASE WHEN device_type = 'mobile' THEN 1 END) * 100.0 / COUNT(*), 1), '%)')
FROM scan_events
UNION ALL
SELECT 
    'International Scans' as metric,
    CONCAT(COUNT(CASE WHEN country != 'IDN' THEN 1 END), ' (', 
           ROUND(COUNT(CASE WHEN country != 'IDN' THEN 1 END) * 100.0 / COUNT(*), 1), '%)')
FROM scan_events;

-- Show device type distribution
SELECT 
    device_type,
    COUNT(*) as scan_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM scan_events 
GROUP BY device_type
ORDER BY scan_count DESC;

-- Show top scanning countries
SELECT 
    country,
    city,
    COUNT(*) as scan_count
FROM scan_events 
GROUP BY country, city
ORDER BY scan_count DESC
LIMIT 5;

-- Show recent scanning activity
SELECT 
    qc.name as qr_name,
    se.device_type,
    se.city,
    se.country,
    se.utm_source,
    se.scanned_at
FROM scan_events se
JOIN qr_codes qc ON se.qr_code_id = qc.id
ORDER BY se.scanned_at DESC
LIMIT 5;
