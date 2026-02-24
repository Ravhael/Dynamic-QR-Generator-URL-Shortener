-- Add sample data to qr_scan_analytics table
-- This script adds realistic QR scan analytics data using JSON format for location and device info

-- Insert sample QR scan analytics with JSON-based device and location data
INSERT INTO qr_scan_analytics (
  id,
  qr_code_id,
  scanned_at,
  ip_address,
  location,
  device,
  user_agent,
  referrer
) VALUES 
  -- Mobile scans with detailed JSON data
  ('66666666-6666-6666-6666-666666666001',
   '550e8400-e29b-41d4-a716-446655440001', -- Google Website QR
   NOW() - INTERVAL '2 hours 30 minutes',
   '103.28.124.45',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Jakarta", "region": "DKI Jakarta", "latitude": -6.2088, "longitude": 106.8456, "timezone": "Asia/Jakarta", "isp": "Telkom Indonesia"}',
   '{"type": "mobile", "brand": "Apple", "model": "iPhone 15 Pro", "os": "iOS", "os_version": "17.1", "browser": "Safari", "browser_version": "17.1", "screen_width": 393, "screen_height": 852, "is_mobile": true, "is_tablet": false, "is_desktop": false}',
   'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
   'https://instagram.com/scanlyapp'),
   
  ('66666666-6666-6666-6666-666666666002',
   '550e8400-e29b-41d4-a716-446655440002', -- Company Website QR
   NOW() - INTERVAL '1 hour 45 minutes',
   '114.79.52.180',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Surabaya", "region": "East Java", "latitude": -7.2575, "longitude": 112.7521, "timezone": "Asia/Jakarta", "isp": "Indosat Ooredoo"}',
   '{"type": "mobile", "brand": "Samsung", "model": "Galaxy S24", "os": "Android", "os_version": "14", "browser": "Chrome", "browser_version": "119.0", "screen_width": 360, "screen_height": 780, "is_mobile": true, "is_tablet": false, "is_desktop": false}',
   'Mozilla/5.0 (Linux; Android 14; SM-S926B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
   'https://twitter.com/scanlyapp'),
   
  -- Desktop scans
  ('66666666-6666-6666-6666-666666666003',
   '550e8400-e29b-41d4-a716-446655440003', -- YouTube Channel QR
   NOW() - INTERVAL '3 hours 15 minutes',
   '182.1.96.210',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Bandung", "region": "West Java", "latitude": -6.9175, "longitude": 107.6191, "timezone": "Asia/Jakarta", "isp": "Biznet Networks"}',
   '{"type": "desktop", "brand": "Dell", "model": "OptiPlex 7090", "os": "Windows", "os_version": "11", "browser": "Chrome", "browser_version": "118.0", "screen_width": 1920, "screen_height": 1080, "is_mobile": false, "is_tablet": false, "is_desktop": true}',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
   'https://linkedin.com/company/scanly'),
   
  ('66666666-6666-6666-6666-666666666004',
   '550e8400-e29b-41d4-a716-446655440004', -- Contact Info QR
   NOW() - INTERVAL '4 hours 20 minutes',
   '203.78.144.95',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Medan", "region": "North Sumatra", "latitude": 3.5952, "longitude": 98.6722, "timezone": "Asia/Jakarta", "isp": "XL Axiata"}',
   '{"type": "desktop", "brand": "Apple", "model": "MacBook Pro", "os": "macOS", "os_version": "14.1", "browser": "Chrome", "browser_version": "118.0", "screen_width": 2560, "screen_height": 1600, "is_mobile": false, "is_tablet": false, "is_desktop": true}',
   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
   'https://facebook.com/scanlyapp'),
   
  -- International scans
  ('66666666-6666-6666-6666-666666666005',
   '550e8400-e29b-41d4-a716-446655440001', -- Google Website QR
   NOW() - INTERVAL '5 hours 30 minutes',
   '8.8.8.8',
   '{"country": "USA", "country_name": "United States", "city": "Mountain View", "region": "California", "latitude": 37.4419, "longitude": -122.1430, "timezone": "America/Los_Angeles", "isp": "Google LLC"}',
   '{"type": "mobile", "brand": "Apple", "model": "iPhone 15", "os": "iOS", "os_version": "17.0", "browser": "Safari", "browser_version": "17.0", "screen_width": 393, "screen_height": 852, "is_mobile": true, "is_tablet": false, "is_desktop": false}',
   'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
   'https://google.com/search?q=qr+code+scanner'),
   
  ('66666666-6666-6666-6666-666666666006',
   '550e8400-e29b-41d4-a716-446655440005', -- Email Contact QR
   NOW() - INTERVAL '6 hours 45 minutes',
   '1.1.1.1',
   '{"country": "AUS", "country_name": "Australia", "city": "Sydney", "region": "New South Wales", "latitude": -33.8688, "longitude": 151.2093, "timezone": "Australia/Sydney", "isp": "Cloudflare"}',
   '{"type": "mobile", "brand": "Google", "model": "Pixel 8", "os": "Android", "os_version": "14", "browser": "Chrome", "browser_version": "119.0", "screen_width": 412, "screen_height": 915, "is_mobile": true, "is_tablet": false, "is_desktop": false}',
   'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
   'https://reddit.com/r/qrcodes'),
   
  -- Tablet scans
  ('66666666-6666-6666-6666-666666666007',
   '550e8400-e29b-41d4-a716-446655440002', -- Company Website QR
   NOW() - INTERVAL '1 hour 10 minutes',
   '125.164.12.89',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Yogyakarta", "region": "Special Region of Yogyakarta", "latitude": -7.7956, "longitude": 110.3695, "timezone": "Asia/Jakarta", "isp": "First Media"}',
   '{"type": "tablet", "brand": "Apple", "model": "iPad Pro", "os": "iPadOS", "os_version": "17.1", "browser": "Safari", "browser_version": "17.1", "screen_width": 1024, "screen_height": 1366, "is_mobile": false, "is_tablet": true, "is_desktop": false}',
   'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
   'https://youtube.com/@scanlyapp'),
   
  -- Recent high-frequency scans
  ('66666666-6666-6666-6666-666666666008',
   '550e8400-e29b-41d4-a716-446655440003', -- YouTube Channel QR
   NOW() - INTERVAL '35 minutes',
   '180.245.147.25',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Denpasar", "region": "Bali", "latitude": -8.6705, "longitude": 115.2126, "timezone": "Asia/Makassar", "isp": "Telkom Indonesia"}',
   '{"type": "mobile", "brand": "Xiaomi", "model": "Redmi Note 13", "os": "Android", "os_version": "14", "browser": "Chrome", "browser_version": "118.0", "screen_width": 393, "screen_height": 851, "is_mobile": true, "is_tablet": false, "is_desktop": false}',
   'Mozilla/5.0 (Linux; Android 14; 23078PND5G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
   'https://tiktok.com/@scanlyapp'),
   
  ('66666666-6666-6666-6666-666666666009',
   '550e8400-e29b-41d4-a716-446655440004', -- Contact Info QR
   NOW() - INTERVAL '50 minutes',
   '202.80.216.30',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Makassar", "region": "South Sulawesi", "latitude": -5.1477, "longitude": 119.4327, "timezone": "Asia/Makassar", "isp": "Indosat Ooredoo"}',
   '{"type": "mobile", "brand": "Apple", "model": "iPhone 14", "os": "iOS", "os_version": "16.6", "browser": "Safari", "browser_version": "16.6", "screen_width": 390, "screen_height": 844, "is_mobile": true, "is_tablet": false, "is_desktop": false}',
   'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
   'https://whatsapp.com/channel/scanlyupdates'),
   
  -- Event scanning pattern
  ('66666666-6666-6666-6666-666666666010',
   '550e8400-e29b-41d4-a716-446655440001', -- Google Website QR
   NOW() - INTERVAL '2 hours 5 minutes',
   '36.67.248.129',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Jakarta", "region": "DKI Jakarta", "latitude": -6.2088, "longitude": 106.8456, "timezone": "Asia/Jakarta", "isp": "Biznet Networks", "venue": "JCC Convention Center", "event": "Tech Conference 2025"}',
   '{"type": "mobile", "brand": "Samsung", "model": "Galaxy A54", "os": "Android", "os_version": "13", "browser": "Chrome", "browser_version": "117.0", "screen_width": 360, "screen_height": 780, "is_mobile": true, "is_tablet": false, "is_desktop": false}',
   'Mozilla/5.0 (Linux; Android 13; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36',
   'https://eventbrite.com/e/tech-conference-2025'),
   
  -- Weekend leisure scanning
  ('66666666-6666-6666-6666-666666666011',
   '550e8400-e29b-41d4-a716-446655440005', -- Email Contact QR
   NOW() - INTERVAL '3 days 16 hours',
   '158.140.167.45',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Semarang", "region": "Central Java", "latitude": -6.9666, "longitude": 110.4167, "timezone": "Asia/Jakarta", "isp": "MyRepublic", "venue": "Restaurant Menu", "context": "dining"}',
   '{"type": "mobile", "brand": "Oppo", "model": "Reno 10", "os": "Android", "os_version": "13", "browser": "Chrome", "browser_version": "116.0", "screen_width": 360, "screen_height": 800, "is_mobile": true, "is_tablet": false, "is_desktop": false}',
   'Mozilla/5.0 (Linux; Android 13; CPH2531) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
   'https://maps.google.com/restaurant-review'),
   
  -- International business scanning
  ('66666666-6666-6666-6666-666666666012',
   '550e8400-e29b-41d4-a716-446655440003', -- YouTube Channel QR
   NOW() - INTERVAL '7 hours 45 minutes',
   '203.0.113.10',
   '{"country": "SGP", "country_name": "Singapore", "city": "Singapore", "region": "Central Region", "latitude": 1.3521, "longitude": 103.8198, "timezone": "Asia/Singapore", "isp": "StarHub", "venue": "Marina Bay Sands", "context": "business_meeting"}',
   '{"type": "desktop", "brand": "HP", "model": "EliteBook 840", "os": "Windows", "os_version": "11", "browser": "Chrome", "browser_version": "118.0", "screen_width": 1920, "screen_height": 1080, "is_mobile": false, "is_tablet": false, "is_desktop": true}',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
   'https://linkedin.com/in/business-development'),
   
  -- Late night scanning (different timezone)
  ('66666666-6666-6666-6666-666666666013',
   '550e8400-e29b-41d4-a716-446655440004', -- Contact Info QR
   NOW() - INTERVAL '12 hours 30 minutes',
   '74.125.224.72',
   '{"country": "USA", "country_name": "United States", "city": "San Francisco", "region": "California", "latitude": 37.7749, "longitude": -122.4194, "timezone": "America/Los_Angeles", "isp": "Google LLC", "context": "late_night_browsing"}',
   '{"type": "mobile", "brand": "Apple", "model": "iPhone 15 Pro Max", "os": "iOS", "os_version": "17.1", "browser": "Safari", "browser_version": "17.1", "screen_width": 430, "screen_height": 932, "is_mobile": true, "is_tablet": false, "is_desktop": false}',
   'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
   'https://discord.gg/scanly-community'),
   
  -- Recent peak hour scan
  ('66666666-6666-6666-6666-666666666014',
   '550e8400-e29b-41d4-a716-446655440001', -- Google Website QR
   NOW() - INTERVAL '20 minutes',
   '103.140.195.67',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Palembang", "region": "South Sumatra", "latitude": -2.9761, "longitude": 104.7754, "timezone": "Asia/Jakarta", "isp": "Telkom Indonesia", "context": "social_media_discovery"}',
   '{"type": "mobile", "brand": "OnePlus", "model": "Nord 3", "os": "Android", "os_version": "13", "browser": "Chrome", "browser_version": "119.0", "screen_width": 412, "screen_height": 915, "is_mobile": true, "is_tablet": false, "is_desktop": false}',
   'Mozilla/5.0 (Linux; Android 13; CPH2493) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
   'https://telegram.me/scanlyofficial'),
   
  -- Additional mobile scan with detailed location
  ('66666666-6666-6666-6666-666666666015',
   '550e8400-e29b-41d4-a716-446655440002', -- Company Website QR
   NOW() - INTERVAL '25 minutes',
   '180.214.232.45',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Malang", "region": "East Java", "latitude": -7.9666, "longitude": 112.6326, "timezone": "Asia/Jakarta", "isp": "Indihome", "venue": "University Campus", "context": "student_activity"}',
   '{"type": "mobile", "brand": "Vivo", "model": "V29e", "os": "Android", "os_version": "13", "browser": "Chrome", "browser_version": "118.0", "screen_width": 360, "screen_height": 800, "is_mobile": true, "is_tablet": false, "is_desktop": false}',
   'Mozilla/5.0 (Linux; Android 13; V2250) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
   'https://instagram.com/university_official')
ON CONFLICT (id) DO NOTHING;

-- Show QR scan analytics statistics
SELECT 
    'Total Analytics Records' as metric,
    COUNT(*)::text as value
FROM qr_scan_analytics
UNION ALL
SELECT 
    'Unique QR Codes Analyzed' as metric,
    COUNT(DISTINCT qr_code_id)::text as value
FROM qr_scan_analytics
UNION ALL
SELECT 
    'Mobile Device Usage' as metric,
    CONCAT(COUNT(CASE WHEN device->>'is_mobile' = 'true' THEN 1 END), ' (', 
           ROUND(COUNT(CASE WHEN device->>'is_mobile' = 'true' THEN 1 END) * 100.0 / COUNT(*), 1), '%)')
FROM qr_scan_analytics
UNION ALL
SELECT 
    'International Scans' as metric,
    CONCAT(COUNT(CASE WHEN location->>'country' != 'IDN' THEN 1 END), ' (', 
           ROUND(COUNT(CASE WHEN location->>'country' != 'IDN' THEN 1 END) * 100.0 / COUNT(*), 1), '%)')
FROM qr_scan_analytics;

-- Show device brand distribution
SELECT 
    device->>'brand' as device_brand,
    COUNT(*) as scan_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM qr_scan_analytics 
GROUP BY device->>'brand'
ORDER BY scan_count DESC;

-- Show top scanning locations by country
SELECT 
    location->>'country' as country,
    location->>'country_name' as country_name,
    COUNT(*) as scan_count
FROM qr_scan_analytics 
GROUP BY location->>'country', location->>'country_name'
ORDER BY scan_count DESC;

-- Show recent scanning activity with JSON data
SELECT 
    qc.name as qr_name,
    qa.location->>'city' as city,
    qa.location->>'country' as country,
    qa.device->>'brand' as device_brand,
    qa.device->>'model' as device_model,
    qa.scanned_at
FROM qr_scan_analytics qa
JOIN qr_codes qc ON qa.qr_code_id = qc.id
ORDER BY qa.scanned_at DESC
LIMIT 5;
