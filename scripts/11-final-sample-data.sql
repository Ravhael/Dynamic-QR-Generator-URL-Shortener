-- Insert sample data with correct QR code types
-- First, let's insert categories
INSERT INTO qr_categories (id, name, description, color, user_id, is_default, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Business', 'Business related QR codes', '#3B82F6', 'c2823bb2-0751-4954-860a-74a7201b90f7', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Marketing', 'Marketing campaigns', '#10B981', 'c2823bb2-0751-4954-860a-74a7201b90f7', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Events', 'Event related codes', '#F59E0B', 'c2823bb2-0751-4954-860a-74a7201b90f7', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Personal', 'Personal use', '#8B5CF6', 'c2823bb2-0751-4954-860a-74a7201b90f7', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Social Media', 'Social media links', '#EF4444', 'c2823bb2-0751-4954-860a-74a7201b90f7', false, NOW(), NOW());

-- Insert URL categories
INSERT INTO url_categories (id, name, description, color, user_id, is_default, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Business', 'Business URLs', '#3B82F6', 'c2823bb2-0751-4954-860a-74a7201b90f7', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'Marketing', 'Marketing URLs', '#10B981', 'c2823bb2-0751-4954-860a-74a7201b90f7', false, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', 'Social', 'Social media URLs', '#F59E0B', 'c2823bb2-0751-4954-860a-74a7201b90f7', false, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440004', 'Personal', 'Personal URLs', '#8B5CF6', 'c2823bb2-0751-4954-860a-74a7201b90f7', false, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440005', 'Documentation', 'Documentation links', '#6B7280', 'c2823bb2-0751-4954-860a-74a7201b90f7', false, NOW(), NOW());

-- Insert QR codes with common valid types
INSERT INTO qr_codes (id, name, type, content, qr_code_data, user_id, category_id, is_dynamic, is_active, scans, max_scans, tags, customization, created_at, updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Company Website', 'url', 'https://scanly.indovisual.co.id', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://scanly.indovisual.co.id', 'c2823bb2-0751-4954-860a-74a7201b90f7', '550e8400-e29b-41d4-a716-446655440001', true, true, 45, 1000, '["website", "business"]', '{"color": "#000000", "background": "#FFFFFF", "size": 200}', NOW() - INTERVAL '5 days', NOW()),
('770e8400-e29b-41d4-a716-446655440002', 'Contact Info', 'text', 'Contact: admin@scanly.indovisual.co.id | Phone: +62-123-456-7890', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Contact:%20admin@scanly.indovisual.co.id', 'c2823bb2-0751-4954-860a-74a7201b90f7', '550e8400-e29b-41d4-a716-446655440002', false, true, 32, 500, '["contact", "info"]', '{"color": "#1F2937", "background": "#F3F4F6", "size": 200}', NOW() - INTERVAL '3 days', NOW()),
('770e8400-e29b-41d4-a716-446655440003', 'WiFi Access', 'wifi', 'WIFI:T:WPA;S:ScanlyOffice;P:password123;H:false;;', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WIFI:T:WPA;S:ScanlyOffice;P:password123;H:false;;', 'c2823bb2-0751-4954-860a-74a7201b90f7', '550e8400-e29b-41d4-a716-446655440003', false, true, 28, NULL, '["wifi", "office"]', '{"color": "#059669", "background": "#ECFDF5", "size": 200}', NOW() - INTERVAL '2 days', NOW()),
('770e8400-e29b-41d4-a716-446655440004', 'Event Registration', 'url', 'https://events.scanly.co.id/register/2024-conference', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://events.scanly.co.id/register/2024-conference', 'c2823bb2-0751-4954-860a-74a7201b90f7', '550e8400-e29b-41d4-a716-446655440003', true, true, 67, 200, '["event", "registration"]', '{"color": "#DC2626", "background": "#FEF2F2", "size": 200}', NOW() - INTERVAL '1 day', NOW()),
('770e8400-e29b-41d4-a716-446655440005', 'Social Media', 'url', 'https://instagram.com/scanly.official', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://instagram.com/scanly.official', 'c2823bb2-0751-4954-860a-74a7201b90f7', '550e8400-e29b-41d4-a716-446655440005', false, true, 89, NULL, '["social", "instagram"]', '{"color": "#7C3AED", "background": "#F5F3FF", "size": 200}', NOW(), NOW());

-- Insert short URLs
INSERT INTO short_urls (id, title, description, original_url, short_code, short_url, user_id, category_id, is_active, clicks, max_clicks, tags, created_at, updated_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Main Website', 'Company main website shortlink', 'https://scanly.indovisual.co.id', 'scnly01', 'https://scn.ly/scnly01', 'c2823bb2-0751-4954-860a-74a7201b90f7', '660e8400-e29b-41d4-a716-446655440001', true, 156, 5000, '["website", "main"]', NOW() - INTERVAL '10 days', NOW()),
('880e8400-e29b-41d4-a716-446655440002', 'Product Demo', 'Product demonstration page', 'https://demo.scanly.indovisual.co.id/product-tour', 'demo01', 'https://scn.ly/demo01', 'c2823bb2-0751-4954-860a-74a7201b90f7', '660e8400-e29b-41d4-a716-446655440002', true, 89, 1000, '["demo", "product"]', NOW() - INTERVAL '7 days', NOW()),
('880e8400-e29b-41d4-a716-446655440003', 'LinkedIn Profile', 'Company LinkedIn profile', 'https://linkedin.com/company/scanly-indonesia', 'linkedin', 'https://scn.ly/linkedin', 'c2823bb2-0751-4954-860a-74a7201b90f7', '660e8400-e29b-41d4-a716-446655440003', true, 234, NULL, '["social", "linkedin"]', NOW() - INTERVAL '5 days', NOW()),
('880e8400-e29b-41d4-a716-446655440004', 'Support Center', 'Customer support portal', 'https://support.scanly.indovisual.co.id', 'support', 'https://scn.ly/support', 'c2823bb2-0751-4954-860a-74a7201b90f7', '660e8400-e29b-41d4-a716-446655440004', true, 67, 2000, '["support", "help"]', NOW() - INTERVAL '3 days', NOW()),
('880e8400-e29b-41d4-a716-446655440005', 'API Documentation', 'Developer API documentation', 'https://docs.scanly.indovisual.co.id/api/v1', 'apidocs', 'https://scn.ly/apidocs', 'c2823bb2-0751-4954-860a-74a7201b90f7', '660e8400-e29b-41d4-a716-446655440005', true, 45, 500, '["docs", "api"]', NOW() - INTERVAL '1 day', NOW());

-- Insert QR scan analytics (50 scans per QR code with varied data)
DO $$
DECLARE
    qr_id UUID;
    i INTEGER;
    scan_time TIMESTAMP;
    ip_addresses TEXT[] := ARRAY['103.28.148.0', '114.79.32.0', '180.252.74.0', '202.154.60.0', '125.164.12.0'];
    cities TEXT[] := ARRAY['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'];
    browsers TEXT[] := ARRAY['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
    devices TEXT[] := ARRAY['iPhone', 'Samsung Galaxy', 'Xiaomi', 'Oppo', 'Vivo'];
BEGIN
    FOR qr_id IN SELECT id FROM qr_codes LOOP
        FOR i IN 1..50 LOOP
            scan_time := NOW() - (RANDOM() * INTERVAL '30 days');
            INSERT INTO qr_scan_analytics (id, qr_code_id, scanned_at, ip_address, location, device) VALUES (
                gen_random_uuid(),
                qr_id,
                scan_time,
                (ip_addresses[1 + floor(random() * array_length(ip_addresses, 1))])::inet,
                jsonb_build_object(
                    'city', cities[1 + floor(random() * array_length(cities, 1))],
                    'country', 'Indonesia',
                    'latitude', -6.2 + (random() * 4),
                    'longitude', 106.8 + (random() * 8)
                ),
                jsonb_build_object(
                    'browser', browsers[1 + floor(random() * array_length(browsers, 1))],
                    'device', devices[1 + floor(random() * array_length(devices, 1))],
                    'os', CASE WHEN random() > 0.5 THEN 'Android' ELSE 'iOS' END
                )
            );
        END LOOP;
    END LOOP;
END $$;

-- Insert URL click analytics (30 clicks per URL with varied data)
DO $$
DECLARE
    url_id UUID;
    i INTEGER;
    click_time TIMESTAMP;
    ip_addresses TEXT[] := ARRAY['103.28.148.0', '114.79.32.0', '180.252.74.0', '202.154.60.0', '125.164.12.0'];
    cities TEXT[] := ARRAY['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'];
    browsers TEXT[] := ARRAY['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
    devices TEXT[] := ARRAY['iPhone', 'Samsung Galaxy', 'Xiaomi', 'Oppo', 'Vivo'];
BEGIN
    FOR url_id IN SELECT id FROM short_urls LOOP
        FOR i IN 1..30 LOOP
            click_time := NOW() - (RANDOM() * INTERVAL '30 days');
            INSERT INTO url_click_analytics (id, url_id, clicked_at, ip_address, location, device) VALUES (
                gen_random_uuid(),
                url_id,
                click_time,
                (ip_addresses[1 + floor(random() * array_length(ip_addresses, 1))])::inet,
                jsonb_build_object(
                    'city', cities[1 + floor(random() * array_length(cities, 1))],
                    'country', 'Indonesia',
                    'latitude', -6.2 + (random() * 4),
                    'longitude', 106.8 + (random() * 8)
                ),
                jsonb_build_object(
                    'browser', browsers[1 + floor(random() * array_length(browsers, 1))],
                    'device', devices[1 + floor(random() * array_length(devices, 1))],
                    'os', CASE WHEN random() > 0.5 THEN 'Android' ELSE 'iOS' END
                )
            );
        END LOOP;
    END LOOP;
END $$;
