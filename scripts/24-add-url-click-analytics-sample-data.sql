-- Add sample data to url_click_analytics table
-- This script adds realistic URL click analytics data using JSON format for location and device info

-- Insert sample URL click analytics with JSON-based device and location data
INSERT INTO url_click_analytics (
  id,
  url_id,
  clicked_at,
  ip_address,
  location,
  device,
  user_agent,
  referrer
) VALUES 
  -- Mobile clicks with detailed JSON data
  ('77777777-7777-7777-7777-777777777001',
   '22222222-2222-2222-2222-222222222001', -- Google short URL (abc123)
   NOW() - INTERVAL '1 hour 30 minutes',
   '103.28.124.45',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Jakarta", "region": "DKI Jakarta", "latitude": -6.2088, "longitude": 106.8456, "timezone": "Asia/Jakarta", "isp": "Telkom Indonesia", "organization": "PT Telkom"}',
   '{"type": "mobile", "brand": "Apple", "model": "iPhone 15 Pro", "os": "iOS", "os_version": "17.1", "browser": "Safari", "browser_version": "17.1", "screen_width": 393, "screen_height": 852, "is_mobile": true, "is_tablet": false, "is_desktop": false, "touch_support": true}',
   'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
   'https://twitter.com/scanlyapp'),
   
  ('77777777-7777-7777-7777-777777777002',
   '22222222-2222-2222-2222-222222222002', -- GitHub short URL (xyz789)
   NOW() - INTERVAL '2 hours 15 minutes',
   '114.79.52.180',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Surabaya", "region": "East Java", "latitude": -7.2575, "longitude": 112.7521, "timezone": "Asia/Jakarta", "isp": "Indosat Ooredoo", "organization": "PT Indosat Tbk"}',
   '{"type": "mobile", "brand": "Samsung", "model": "Galaxy S24 Ultra", "os": "Android", "os_version": "14", "browser": "Chrome", "browser_version": "119.0", "screen_width": 412, "screen_height": 915, "is_mobile": true, "is_tablet": false, "is_desktop": false, "touch_support": true}',
   'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
   'https://linkedin.com/company/tech-company'),
   
  -- Desktop clicks
  ('77777777-7777-7777-7777-777777777003',
   '22222222-2222-2222-2222-222222222003', -- YouTube short URL (def456)
   NOW() - INTERVAL '3 hours 45 minutes',
   '182.1.96.210',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Bandung", "region": "West Java", "latitude": -6.9175, "longitude": 107.6191, "timezone": "Asia/Jakarta", "isp": "Biznet Networks", "organization": "PT Biznet Gio Nusantara"}',
   '{"type": "desktop", "brand": "Dell", "model": "OptiPlex 7090", "os": "Windows", "os_version": "11", "browser": "Chrome", "browser_version": "118.0", "screen_width": 1920, "screen_height": 1080, "is_mobile": false, "is_tablet": false, "is_desktop": true, "touch_support": false}',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
   'https://reddit.com/r/programming'),
   
  ('77777777-7777-7777-7777-777777777004',
   '22222222-2222-2222-2222-222222222004', -- Facebook short URL (ghi789)
   NOW() - INTERVAL '4 hours 20 minutes',
   '203.78.144.95',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Medan", "region": "North Sumatra", "latitude": 3.5952, "longitude": 98.6722, "timezone": "Asia/Jakarta", "isp": "XL Axiata", "organization": "PT XL Axiata Tbk"}',
   '{"type": "desktop", "brand": "Apple", "model": "iMac 24-inch", "os": "macOS", "os_version": "14.1", "browser": "Safari", "browser_version": "17.1", "screen_width": 4480, "screen_height": 2520, "is_mobile": false, "is_tablet": false, "is_desktop": true, "touch_support": false}',
   'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
   'https://facebook.com/developer-group'),
   
  -- International clicks
  ('77777777-7777-7777-7777-777777777005',
   '22222222-2222-2222-2222-222222222001', -- Google short URL (abc123)
   NOW() - INTERVAL '5 hours 30 minutes',
   '8.8.8.8',
   '{"country": "USA", "country_name": "United States", "city": "Mountain View", "region": "California", "latitude": 37.4419, "longitude": -122.1430, "timezone": "America/Los_Angeles", "isp": "Google LLC", "organization": "Google"}',
   '{"type": "mobile", "brand": "Google", "model": "Pixel 8 Pro", "os": "Android", "os_version": "14", "browser": "Chrome", "browser_version": "119.0", "screen_width": 412, "screen_height": 915, "is_mobile": true, "is_tablet": false, "is_desktop": false, "touch_support": true}',
   'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
   'https://news.ycombinator.com'),
   
  ('77777777-7777-7777-7777-777777777006',
   '22222222-2222-2222-2222-222222222002', -- GitHub short URL (xyz789)
   NOW() - INTERVAL '6 hours 15 minutes',
   '1.1.1.1',
   '{"country": "AUS", "country_name": "Australia", "city": "Sydney", "region": "New South Wales", "latitude": -33.8688, "longitude": 151.2093, "timezone": "Australia/Sydney", "isp": "Cloudflare", "organization": "Cloudflare Inc"}',
   '{"type": "desktop", "brand": "HP", "model": "EliteBook 840", "os": "Windows", "os_version": "11", "browser": "Edge", "browser_version": "118.0", "screen_width": 1920, "screen_height": 1080, "is_mobile": false, "is_tablet": false, "is_desktop": true, "touch_support": false}',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.2088.76',
   'https://github.com/trending'),
   
  -- Tablet clicks
  ('77777777-7777-7777-7777-777777777007',
   '22222222-2222-2222-2222-222222222003', -- YouTube short URL (def456)
   NOW() - INTERVAL '1 hour 10 minutes',
   '125.164.12.89',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Yogyakarta", "region": "Special Region of Yogyakarta", "latitude": -7.7956, "longitude": 110.3695, "timezone": "Asia/Jakarta", "isp": "First Media", "organization": "PT Link Net Tbk"}',
   '{"type": "tablet", "brand": "Apple", "model": "iPad Air", "os": "iPadOS", "os_version": "17.1", "browser": "Safari", "browser_version": "17.1", "screen_width": 820, "screen_height": 1180, "is_mobile": false, "is_tablet": true, "is_desktop": false, "touch_support": true}',
   'Mozilla/5.0 (iPad; CPU OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
   'https://youtube.com/feed/trending'),
   
  -- Recent high-frequency clicks
  ('77777777-7777-7777-7777-777777777008',
   '22222222-2222-2222-2222-222222222005', -- Instagram short URL (jkl012)
   NOW() - INTERVAL '25 minutes',
   '180.245.147.25',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Denpasar", "region": "Bali", "latitude": -8.6705, "longitude": 115.2126, "timezone": "Asia/Makassar", "isp": "Telkom Indonesia", "organization": "PT Telkom Indonesia", "connection_type": "mobile"}',
   '{"type": "mobile", "brand": "Xiaomi", "model": "Redmi Note 13 Pro", "os": "Android", "os_version": "14", "browser": "Chrome", "browser_version": "118.0", "screen_width": 393, "screen_height": 851, "is_mobile": true, "is_tablet": false, "is_desktop": false, "touch_support": true}',
   'Mozilla/5.0 (Linux; Android 14; 23078PND5G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
   'https://instagram.com/explore'),
   
  ('77777777-7777-7777-7777-777777777009',
   '22222222-2222-2222-2222-222222222001', -- Google short URL (abc123)
   NOW() - INTERVAL '40 minutes',
   '202.80.216.30',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Makassar", "region": "South Sulawesi", "latitude": -5.1477, "longitude": 119.4327, "timezone": "Asia/Makassar", "isp": "Indosat Ooredoo", "organization": "PT Indosat Tbk", "connection_type": "mobile"}',
   '{"type": "mobile", "brand": "Oppo", "model": "Find X6 Pro", "os": "Android", "os_version": "13", "browser": "Chrome", "browser_version": "117.0", "screen_width": 412, "screen_height": 915, "is_mobile": true, "is_tablet": false, "is_desktop": false, "touch_support": true}',
   'Mozilla/5.0 (Linux; Android 13; CPH2305) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Mobile Safari/537.36',
   'https://whatsapp.com/channel/business'),
   
  -- Business hours pattern clicks
  ('77777777-7777-7777-7777-777777777010',
   '22222222-2222-2222-2222-222222222004', -- Facebook short URL (ghi789)
   NOW() - INTERVAL '2 hours 5 minutes',
   '36.67.248.129',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Jakarta", "region": "DKI Jakarta", "latitude": -6.2088, "longitude": 106.8456, "timezone": "Asia/Jakarta", "isp": "Biznet Networks", "organization": "PT Biznet Gio Nusantara", "venue": "Office Building", "context": "business_hours"}',
   '{"type": "desktop", "brand": "Lenovo", "model": "ThinkPad X1 Carbon", "os": "Windows", "os_version": "11", "browser": "Chrome", "browser_version": "118.0", "screen_width": 1920, "screen_height": 1080, "is_mobile": false, "is_tablet": false, "is_desktop": true, "touch_support": false}',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
   'https://slack.com/workspace'),
   
  -- Evening leisure clicks
  ('77777777-7777-7777-7777-777777777011',
   '22222222-2222-2222-2222-222222222003', -- YouTube short URL (def456)
   NOW() - INTERVAL '8 hours 30 minutes',
   '158.140.167.45',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Semarang", "region": "Central Java", "latitude": -6.9666, "longitude": 110.4167, "timezone": "Asia/Jakarta", "isp": "MyRepublic", "organization": "MyRepublic Indonesia", "context": "evening_leisure"}',
   '{"type": "mobile", "brand": "Vivo", "model": "V29e", "os": "Android", "os_version": "13", "browser": "Chrome", "browser_version": "116.0", "screen_width": 360, "screen_height": 800, "is_mobile": true, "is_tablet": false, "is_desktop": false, "touch_support": true}',
   'Mozilla/5.0 (Linux; Android 13; V2250) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
   'https://tiktok.com/foryou'),
   
  -- International business clicks
  ('77777777-7777-7777-7777-777777777012',
   '22222222-2222-2222-2222-222222222002', -- GitHub short URL (xyz789)
   NOW() - INTERVAL '7 hours 15 minutes',
   '203.0.113.10',
   '{"country": "SGP", "country_name": "Singapore", "city": "Singapore", "region": "Central Region", "latitude": 1.3521, "longitude": 103.8198, "timezone": "Asia/Singapore", "isp": "StarHub", "organization": "StarHub Ltd", "venue": "Marina Bay Sands", "context": "business_conference"}',
   '{"type": "desktop", "brand": "Microsoft", "model": "Surface Laptop Studio", "os": "Windows", "os_version": "11", "browser": "Edge", "browser_version": "118.0", "screen_width": 2400, "screen_height": 1600, "is_mobile": false, "is_tablet": false, "is_desktop": true, "touch_support": true}',
   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.2088.76',
   'https://teams.microsoft.com/meeting'),
   
  -- Late night clicks (different timezone)
  ('77777777-7777-7777-7777-777777777013',
   '22222222-2222-2222-2222-222222222005', -- Instagram short URL (jkl012)
   NOW() - INTERVAL '11 hours 45 minutes',
   '74.125.224.72',
   '{"country": "USA", "country_name": "United States", "city": "San Francisco", "region": "California", "latitude": 37.7749, "longitude": -122.4194, "timezone": "America/Los_Angeles", "isp": "Google LLC", "organization": "Google", "context": "late_night_browsing"}',
   '{"type": "mobile", "brand": "Apple", "model": "iPhone 14 Pro Max", "os": "iOS", "os_version": "16.6", "browser": "Safari", "browser_version": "16.6", "screen_width": 430, "screen_height": 932, "is_mobile": true, "is_tablet": false, "is_desktop": false, "touch_support": true}',
   'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
   'https://discord.gg/developers'),
   
  -- Peak hour clicks
  ('77777777-7777-7777-7777-777777777014',
   '22222222-2222-2222-2222-222222222001', -- Google short URL (abc123)
   NOW() - INTERVAL '15 minutes',
   '103.140.195.67',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Palembang", "region": "South Sumatra", "latitude": -2.9761, "longitude": 104.7754, "timezone": "Asia/Jakarta", "isp": "Telkom Indonesia", "organization": "PT Telkom Indonesia", "context": "peak_hours"}',
   '{"type": "mobile", "brand": "OnePlus", "model": "11 5G", "os": "Android", "os_version": "13", "browser": "Chrome", "browser_version": "119.0", "screen_width": 412, "screen_height": 915, "is_mobile": true, "is_tablet": false, "is_desktop": false, "touch_support": true}',
   'Mozilla/5.0 (Linux; Android 13; CPH2449) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
   'https://telegram.me/tech_channel'),
   
  -- Additional university pattern click
  ('77777777-7777-7777-7777-777777777015',
   '22222222-2222-2222-2222-222222222004', -- Facebook short URL (ghi789)
   NOW() - INTERVAL '50 minutes',
   '180.214.232.45',
   '{"country": "IDN", "country_name": "Indonesia", "city": "Malang", "region": "East Java", "latitude": -7.9666, "longitude": 112.6326, "timezone": "Asia/Jakarta", "isp": "Indihome", "organization": "PT Telkom Indonesia", "venue": "University Campus", "context": "student_research"}',
   '{"type": "mobile", "brand": "Realme", "model": "GT Neo 5", "os": "Android", "os_version": "13", "browser": "Chrome", "browser_version": "118.0", "screen_width": 360, "screen_height": 800, "is_mobile": true, "is_tablet": false, "is_desktop": false, "touch_support": true}',
   'Mozilla/5.0 (Linux; Android 13; RMX3708) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
   'https://scholar.google.com/search')
ON CONFLICT (id) DO NOTHING;

-- Show URL click analytics statistics
SELECT 
    'Total Click Analytics Records' as metric,
    COUNT(*)::text as value
FROM url_click_analytics
UNION ALL
SELECT 
    'Unique URLs Clicked' as metric,
    COUNT(DISTINCT url_id)::text as value
FROM url_click_analytics
UNION ALL
SELECT 
    'Mobile Click Rate' as metric,
    CONCAT(COUNT(CASE WHEN device->>'is_mobile' = 'true' THEN 1 END), ' (', 
           ROUND(COUNT(CASE WHEN device->>'is_mobile' = 'true' THEN 1 END) * 100.0 / COUNT(*), 1), '%)')
FROM url_click_analytics
UNION ALL
SELECT 
    'International Clicks' as metric,
    CONCAT(COUNT(CASE WHEN location->>'country' != 'IDN' THEN 1 END), ' (', 
           ROUND(COUNT(CASE WHEN location->>'country' != 'IDN' THEN 1 END) * 100.0 / COUNT(*), 1), '%)')
FROM url_click_analytics;

-- Show device brand distribution for URL clicks
SELECT 
    device->>'brand' as device_brand,
    COUNT(*) as click_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
FROM url_click_analytics 
GROUP BY device->>'brand'
ORDER BY click_count DESC;

-- Show URL click distribution by short URLs
SELECT 
    su.short_code,
    su.original_url,
    COUNT(uca.*) as click_count,
    ROUND(COUNT(uca.*) * 100.0 / SUM(COUNT(uca.*)) OVER(), 1) as click_share
FROM short_urls su
LEFT JOIN url_click_analytics uca ON su.id = uca.url_id
GROUP BY su.id, su.short_code, su.original_url
ORDER BY click_count DESC;

-- Show top clicking locations by country
SELECT 
    location->>'country' as country,
    location->>'country_name' as country_name,
    COUNT(*) as click_count,
    STRING_AGG(DISTINCT location->>'city', ', ') as cities
FROM url_click_analytics 
GROUP BY location->>'country', location->>'country_name'
ORDER BY click_count DESC;

-- Show recent URL clicking activity with device info
SELECT 
    su.short_code,
    uca.location->>'city' as city,
    uca.location->>'country' as country,
    uca.device->>'brand' as device_brand,
    uca.device->>'model' as device_model,
    uca.clicked_at
FROM url_click_analytics uca
JOIN short_urls su ON uca.url_id = su.id
ORDER BY uca.clicked_at DESC
LIMIT 5;
