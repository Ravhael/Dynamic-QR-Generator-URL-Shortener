-- Add sample analytics data for QR codes and URLs
-- This script adds realistic scan and click data for testing the analytics dashboard

-- First, let's get the existing QR codes and URLs to reference
DO $$
DECLARE
    user_uuid uuid := 'fb29d018-a8e4-4fd8-90e6-4c144dcc81b8';
    qr_code_1 uuid;
    qr_code_2 uuid;
    qr_code_3 uuid;
    url_1 uuid;
    url_2 uuid;
    url_3 uuid;
BEGIN
    -- Get existing QR code IDs
    SELECT id INTO qr_code_1 FROM qr_codes WHERE name = 'Company Website QR' AND user_id = user_uuid LIMIT 1;
    SELECT id INTO qr_code_2 FROM qr_codes WHERE name = 'Contact Info QR' AND user_id = user_uuid LIMIT 1;
    SELECT id INTO qr_code_3 FROM qr_codes WHERE name = 'WiFi Access QR' AND user_id = user_uuid LIMIT 1;
    
    -- Get existing URL IDs
    SELECT id INTO url_1 FROM short_urls WHERE title = 'Company Homepage' AND user_id = user_uuid LIMIT 1;
    SELECT id INTO url_2 FROM short_urls WHERE title = 'Product Demo' AND user_id = user_uuid LIMIT 1;
    SELECT id INTO url_3 FROM short_urls WHERE title = 'Contact Us' AND user_id = user_uuid LIMIT 1;

    -- Insert QR scan analytics data (last 30 days)
    IF qr_code_1 IS NOT NULL THEN
        INSERT INTO qr_scan_analytics (id, qr_code_id, scanned_at, ip_address, device, location) VALUES
        (gen_random_uuid(), qr_code_1, NOW() - INTERVAL '1 day', '192.168.1.100', '{"type": "mobile", "os": "Android", "browser": "Chrome", "model": "Samsung Galaxy S21"}', '{"country": "Indonesia", "city": "Jakarta", "latitude": -6.2088, "longitude": 106.8456}'),
        (gen_random_uuid(), qr_code_1, NOW() - INTERVAL '2 days', '10.0.0.50', '{"type": "mobile", "os": "iOS", "browser": "Safari", "model": "iPhone 13"}', '{"country": "Indonesia", "city": "Surabaya", "latitude": -7.2575, "longitude": 112.7521}'),
        (gen_random_uuid(), qr_code_1, NOW() - INTERVAL '3 days', '172.16.0.25', '{"type": "desktop", "os": "Windows", "browser": "Chrome", "model": "Desktop PC"}', '{"country": "Indonesia", "city": "Bandung", "latitude": -6.9175, "longitude": 107.6191}'),
        (gen_random_uuid(), qr_code_1, NOW() - INTERVAL '5 days', '203.78.121.45', '{"type": "tablet", "os": "iPadOS", "browser": "Safari", "model": "iPad Pro"}', '{"country": "Indonesia", "city": "Medan", "latitude": 3.5952, "longitude": 98.6722}'),
        (gen_random_uuid(), qr_code_1, NOW() - INTERVAL '7 days', '114.79.33.162', '{"type": "mobile", "os": "Android", "browser": "Chrome", "model": "Xiaomi Redmi Note 10"}', '{"country": "Indonesia", "city": "Yogyakarta", "latitude": -7.7956, "longitude": 110.3695}');
    END IF;

    IF qr_code_2 IS NOT NULL THEN
        INSERT INTO qr_scan_analytics (id, qr_code_id, scanned_at, ip_address, device, location) VALUES
        (gen_random_uuid(), qr_code_2, NOW() - INTERVAL '1 hour', '192.168.1.101', '{"type": "mobile", "os": "Android", "browser": "Chrome", "model": "Oppo A74"}', '{"country": "Indonesia", "city": "Jakarta", "latitude": -6.2088, "longitude": 106.8456}'),
        (gen_random_uuid(), qr_code_2, NOW() - INTERVAL '4 hours', '10.0.0.75', '{"type": "mobile", "os": "iOS", "browser": "Safari", "model": "iPhone 12"}', '{"country": "Indonesia", "city": "Tangerang", "latitude": -6.1783, "longitude": 106.6319}'),
        (gen_random_uuid(), qr_code_2, NOW() - INTERVAL '1 day', '172.16.0.30', '{"type": "desktop", "os": "macOS", "browser": "Safari", "model": "MacBook Pro"}', '{"country": "Indonesia", "city": "Bekasi", "latitude": -6.2383, "longitude": 106.9756}'),
        (gen_random_uuid(), qr_code_2, NOW() - INTERVAL '2 days', '203.78.121.67', '{"type": "mobile", "os": "Android", "browser": "Firefox", "model": "Samsung Galaxy A52"}', '{"country": "Indonesia", "city": "Depok", "latitude": -6.4025, "longitude": 106.7942}');
    END IF;

    IF qr_code_3 IS NOT NULL THEN
        INSERT INTO qr_scan_analytics (id, qr_code_id, scanned_at, ip_address, device, location) VALUES
        (gen_random_uuid(), qr_code_3, NOW() - INTERVAL '30 minutes', '192.168.1.102', '{"type": "mobile", "os": "Android", "browser": "Chrome", "model": "Vivo V21"}', '{"country": "Indonesia", "city": "Jakarta", "latitude": -6.2088, "longitude": 106.8456}'),
        (gen_random_uuid(), qr_code_3, NOW() - INTERVAL '2 hours', '10.0.0.80', '{"type": "mobile", "os": "iOS", "browser": "Safari", "model": "iPhone 14"}', '{"country": "Indonesia", "city": "Bogor", "latitude": -6.5971, "longitude": 106.8060}'),
        (gen_random_uuid(), qr_code_3, NOW() - INTERVAL '6 hours', '172.16.0.35', '{"type": "tablet", "os": "Android", "browser": "Chrome", "model": "Samsung Galaxy Tab S7"}', '{"country": "Indonesia", "city": "Semarang", "latitude": -6.9667, "longitude": 110.4167}');
    END IF;

    -- Insert URL click analytics data (last 30 days)
    IF url_1 IS NOT NULL THEN
        INSERT INTO url_click_analytics (id, url_id, clicked_at, ip_address, device, location) VALUES
        (gen_random_uuid(), url_1, NOW() - INTERVAL '2 hours', '192.168.1.103', '{"type": "desktop", "os": "Windows", "browser": "Chrome", "model": "Desktop PC"}', '{"country": "Indonesia", "city": "Jakarta", "latitude": -6.2088, "longitude": 106.8456}'),
        (gen_random_uuid(), url_1, NOW() - INTERVAL '1 day', '10.0.0.85', '{"type": "mobile", "os": "Android", "browser": "Chrome", "model": "Realme 8 Pro"}', '{"country": "Indonesia", "city": "Surabaya", "latitude": -7.2575, "longitude": 112.7521}'),
        (gen_random_uuid(), url_1, NOW() - INTERVAL '2 days', '172.16.0.40', '{"type": "mobile", "os": "iOS", "browser": "Safari", "model": "iPhone 13 Pro"}', '{"country": "Indonesia", "city": "Bandung", "latitude": -6.9175, "longitude": 107.6191}'),
        (gen_random_uuid(), url_1, NOW() - INTERVAL '3 days', '203.78.121.89', '{"type": "tablet", "os": "iPadOS", "browser": "Safari", "model": "iPad Air"}', '{"country": "Indonesia", "city": "Malang", "latitude": -7.9666, "longitude": 112.6326}'),
        (gen_random_uuid(), url_1, NOW() - INTERVAL '5 days', '114.79.33.201', '{"type": "desktop", "os": "macOS", "browser": "Chrome", "model": "iMac"}', '{"country": "Indonesia", "city": "Denpasar", "latitude": -8.6500, "longitude": 115.2167}'),
        (gen_random_uuid(), url_1, NOW() - INTERVAL '7 days', '180.241.89.156', '{"type": "mobile", "os": "Android", "browser": "Edge", "model": "Huawei P40"}', '{"country": "Indonesia", "city": "Makassar", "latitude": -5.1477, "longitude": 119.4327}');
    END IF;

    IF url_2 IS NOT NULL THEN
        INSERT INTO url_click_analytics (id, url_id, clicked_at, ip_address, device, location) VALUES
        (gen_random_uuid(), url_2, NOW() - INTERVAL '1 hour', '192.168.1.104', '{"type": "mobile", "os": "Android", "browser": "Chrome", "model": "OnePlus 9"}', '{"country": "Indonesia", "city": "Jakarta", "latitude": -6.2088, "longitude": 106.8456}'),
        (gen_random_uuid(), url_2, NOW() - INTERVAL '3 hours', '10.0.0.90', '{"type": "desktop", "os": "Windows", "browser": "Firefox", "model": "Desktop PC"}', '{"country": "Indonesia", "city": "Tangerang", "latitude": -6.1783, "longitude": 106.6319}'),
        (gen_random_uuid(), url_2, NOW() - INTERVAL '1 day', '172.16.0.45', '{"type": "mobile", "os": "iOS", "browser": "Safari", "model": "iPhone 12 Pro"}', '{"country": "Indonesia", "city": "Bekasi", "latitude": -6.2383, "longitude": 106.9756}'),
        (gen_random_uuid(), url_2, NOW() - INTERVAL '4 days', '203.78.121.112', '{"type": "tablet", "os": "Android", "browser": "Chrome", "model": "Lenovo Tab P11"}', '{"country": "Indonesia", "city": "Solo", "latitude": -7.5667, "longitude": 110.8167}');
    END IF;

    IF url_3 IS NOT NULL THEN
        INSERT INTO url_click_analytics (id, url_id, clicked_at, ip_address, device, location) VALUES
        (gen_random_uuid(), url_3, NOW() - INTERVAL '45 minutes', '192.168.1.105', '{"type": "mobile", "os": "Android", "browser": "Chrome", "model": "Poco X3 Pro"}', '{"country": "Indonesia", "city": "Jakarta", "latitude": -6.2088, "longitude": 106.8456}'),
        (gen_random_uuid(), url_3, NOW() - INTERVAL '4 hours', '10.0.0.95', '{"type": "desktop", "os": "Linux", "browser": "Firefox", "model": "Desktop PC"}', '{"country": "Indonesia", "city": "Cirebon", "latitude": -6.7063, "longitude": 108.5571}'),
        (gen_random_uuid(), url_3, NOW() - INTERVAL '2 days', '172.16.0.50', '{"type": "mobile", "os": "iOS", "browser": "Safari", "model": "iPhone 11"}', '{"country": "Indonesia", "city": "Palembang", "latitude": -2.9761, "longitude": 104.7754}');
    END IF;

    -- Update scan and click counts in the main tables
    UPDATE qr_codes SET scans = (
        SELECT COUNT(*) FROM qr_scan_analytics WHERE qr_code_id = qr_codes.id
    ) WHERE user_id = user_uuid;

    UPDATE short_urls SET clicks = (
        SELECT COUNT(*) FROM url_click_analytics WHERE url_id = short_urls.id
    ) WHERE user_id = user_uuid;

    RAISE NOTICE 'Analytics sample data added successfully!';
    RAISE NOTICE 'QR scan analytics: % records', (SELECT COUNT(*) FROM qr_scan_analytics);
    RAISE NOTICE 'URL click analytics: % records', (SELECT COUNT(*) FROM url_click_analytics);
END $$;

-- Verify the data
SELECT 'QR Codes with scan counts:' as info;
SELECT name, scans, (SELECT COUNT(*) FROM qr_scan_analytics WHERE qr_code_id = qr_codes.id) as analytics_count 
FROM qr_codes 
WHERE user_id = 'fb29d018-a8e4-4fd8-90e6-4c144dcc81b8';

SELECT 'Short URLs with click counts:' as info;
SELECT title, clicks, (SELECT COUNT(*) FROM url_click_analytics WHERE url_id = short_urls.id) as analytics_count 
FROM short_urls 
WHERE user_id = 'fb29d018-a8e4-4fd8-90e6-4c144dcc81b8';

SELECT 'Recent QR scans:' as info;
SELECT qc.name, qsa.scanned_at, qsa.device->>'type' as device_type, qsa.location->>'city' as city
FROM qr_scan_analytics qsa
JOIN qr_codes qc ON qsa.qr_code_id = qc.id
WHERE qc.user_id = 'fb29d018-a8e4-4fd8-90e6-4c144dcc81b8'
ORDER BY qsa.scanned_at DESC
LIMIT 10;

SELECT 'Recent URL clicks:' as info;
SELECT su.title, uca.clicked_at, uca.device->>'type' as device_type, uca.location->>'city' as city
FROM url_click_analytics uca
JOIN short_urls su ON uca.url_id = su.id
WHERE su.user_id = 'fb29d018-a8e4-4fd8-90e6-4c144dcc81b8'
ORDER BY uca.clicked_at DESC
LIMIT 10;
