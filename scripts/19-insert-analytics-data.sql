-- Insert sample analytics data for QR codes and URLs
-- First, let's check what QR codes and URLs exist and insert analytics for them

-- Insert QR scan analytics data
INSERT INTO qr_scan_analytics (id, qr_code_id, scanned_at, ip_address, device, location)
SELECT 
    gen_random_uuid() as id,
    qr.id as qr_code_id,
    NOW() - (random() * interval '30 days') as scanned_at,
    ('192.168.' || floor(random() * 255) || '.' || floor(random() * 255))::inet as ip_address,
    jsonb_build_object(
        'type', (ARRAY['mobile', 'desktop', 'tablet'])[floor(random() * 3 + 1)],
        'os', (ARRAY['Android', 'iOS', 'Windows', 'macOS', 'Linux'])[floor(random() * 5 + 1)],
        'browser', (ARRAY['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera'])[floor(random() * 5 + 1)],
        'user_agent', 'Mozilla/5.0 (compatible; ScanlyBot/1.0)'
    ) as device,
    jsonb_build_object(
        'country', 'Indonesia',
        'city', (ARRAY['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi'])[floor(random() * 10 + 1)],
        'latitude', -6.2 + (random() * 4),
        'longitude', 106.8 + (random() * 8)
    ) as location
FROM qr_codes qr
CROSS JOIN generate_series(1, 15); -- Generate 15 scans per QR code

-- Insert URL click analytics data  
INSERT INTO url_click_analytics (id, url_id, clicked_at, ip_address, device, location)
SELECT 
    gen_random_uuid() as id,
    su.id as url_id,
    NOW() - (random() * interval '30 days') as clicked_at,
    ('203.142.' || floor(random() * 255) || '.' || floor(random() * 255))::inet as ip_address,
    jsonb_build_object(
        'type', (ARRAY['mobile', 'desktop', 'tablet'])[floor(random() * 3 + 1)],
        'os', (ARRAY['Android', 'iOS', 'Windows', 'macOS', 'Linux'])[floor(random() * 5 + 1)],
        'browser', (ARRAY['Chrome', 'Safari', 'Firefox', 'Edge', 'Opera'])[floor(random() * 5 + 1)],
        'user_agent', 'Mozilla/5.0 (compatible; ScanlyBot/1.0)'
    ) as device,
    jsonb_build_object(
        'country', 'Indonesia',
        'city', (ARRAY['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi'])[floor(random() * 10 + 1)],
        'latitude', -6.2 + (random() * 4),
        'longitude', 106.8 + (random() * 8)
    ) as location
FROM short_urls su
CROSS JOIN generate_series(1, 12); -- Generate 12 clicks per URL

-- Update scan counts in qr_codes table
UPDATE qr_codes 
SET scans = (
    SELECT COUNT(*) 
    FROM qr_scan_analytics 
    WHERE qr_scan_analytics.qr_code_id = qr_codes.id
);

-- Update click counts in short_urls table
UPDATE short_urls 
SET clicks = (
    SELECT COUNT(*) 
    FROM url_click_analytics 
    WHERE url_click_analytics.url_id = short_urls.id
);

-- Verify the data was inserted
SELECT 'QR Scan Analytics Count:' as info, COUNT(*) as count FROM qr_scan_analytics
UNION ALL
SELECT 'URL Click Analytics Count:' as info, COUNT(*) as count FROM url_click_analytics;
