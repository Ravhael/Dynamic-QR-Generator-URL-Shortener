-- Fix RLS policies and insert correct sample data
-- First, disable RLS temporarily to insert data
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE qr_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE url_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE short_urls DISABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE url_click_analytics DISABLE ROW LEVEL SECURITY;

-- Insert user data (using correct column names from schema)
INSERT INTO users (id, email, name, role, is_active, created_at, updated_at)
VALUES (
  'c2823bb2-0751-4954-860a-74a7201b90f7',
  'admin@scanly.indovisual.co.id',
  'Admin User',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Insert QR Categories
INSERT INTO qr_categories (id, user_id, name, description, color, is_default, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'c2823bb2-0751-4954-860a-74a7201b90f7', 'Business', 'Business related QR codes', '#3B82F6', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'c2823bb2-0751-4954-860a-74a7201b90f7', 'Marketing', 'Marketing campaigns', '#EF4444', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'c2823bb2-0751-4954-860a-74a7201b90f7', 'Events', 'Event QR codes', '#10B981', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'c2823bb2-0751-4954-860a-74a7201b90f7', 'Personal', 'Personal use', '#8B5CF6', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'c2823bb2-0751-4954-860a-74a7201b90f7', 'Social Media', 'Social media links', '#F59E0B', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert URL Categories
INSERT INTO url_categories (id, user_id, name, description, color, is_default, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'c2823bb2-0751-4954-860a-74a7201b90f7', 'Business', 'Business URLs', '#3B82F6', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'c2823bb2-0751-4954-860a-74a7201b90f7', 'Marketing', 'Marketing campaigns', '#EF4444', false, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', 'c2823bb2-0751-4954-860a-74a7201b90f7', 'Social', 'Social media links', '#10B981', false, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440004', 'c2823bb2-0751-4954-860a-74a7201b90f7', 'Documentation', 'Documentation links', '#8B5CF6', false, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440005', 'c2823bb2-0751-4954-860a-74a7201b90f7', 'Resources', 'Resource links', '#F59E0B', false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert QR Codes
INSERT INTO qr_codes (id, user_id, category_id, name, type, content, qr_code_data, scans, is_active, is_dynamic, created_at, updated_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'c2823bb2-0751-4954-860a-74a7201b90f7', '550e8400-e29b-41d4-a716-446655440001', 'Company Website', 'url', 'https://scanly.indovisual.co.id', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://scanly.indovisual.co.id', 125, true, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440002', 'c2823bb2-0751-4954-860a-74a7201b90f7', '550e8400-e29b-41d4-a716-446655440002', 'Marketing Campaign', 'url', 'https://campaign.example.com', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://campaign.example.com', 89, true, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440003', 'c2823bb2-0751-4954-860a-74a7201b90f7', '550e8400-e29b-41d4-a716-446655440003', 'Event Registration', 'url', 'https://event.example.com/register', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://event.example.com/register', 67, true, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440004', 'c2823bb2-0751-4954-860a-74a7201b90f7', '550e8400-e29b-41d4-a716-446655440004', 'Contact Info', 'vcard', 'BEGIN:VCARD\nVERSION:3.0\nFN:Admin User\nEMAIL:admin@scanly.indovisual.co.id\nEND:VCARD', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BEGIN:VCARD...', 43, true, false, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440005', 'c2823bb2-0751-4954-860a-74a7201b90f7', '550e8400-e29b-41d4-a716-446655440005', 'WiFi Access', 'wifi', 'WIFI:T:WPA;S:ScanlyOffice;P:password123;;', 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WIFI:T:WPA;S:ScanlyOffice;P:password123;;', 156, true, false, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Short URLs
INSERT INTO short_urls (id, user_id, category_id, original_url, short_code, short_url, title, description, clicks, is_active, created_at, updated_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'c2823bb2-0751-4954-860a-74a7201b90f7', '660e8400-e29b-41d4-a716-446655440001', 'https://scanly.indovisual.co.id/about', 'about', 'https://scn.ly/about', 'About Scanly', 'Learn more about our QR code platform', 234, true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440002', 'c2823bb2-0751-4954-860a-74a7201b90f7', '660e8400-e29b-41d4-a716-446655440002', 'https://scanly.indovisual.co.id/pricing', 'pricing', 'https://scn.ly/pricing', 'Pricing Plans', 'Check our affordable pricing plans', 189, true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440003', 'c2823bb2-0751-4954-860a-74a7201b90f7', '660e8400-e29b-41d4-a716-446655440003', 'https://twitter.com/scanly', 'twitter', 'https://scn.ly/twitter', 'Follow us on Twitter', 'Stay updated with our latest news', 156, true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440004', 'c2823bb2-0751-4954-860a-74a7201b90f7', '660e8400-e29b-41d4-a716-446655440004', 'https://docs.scanly.indovisual.co.id', 'docs', 'https://scn.ly/docs', 'Documentation', 'Complete API documentation', 98, true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440005', 'c2823bb2-0751-4954-860a-74a7201b90f7', '660e8400-e29b-41d4-a716-446655440005', 'https://support.scanly.indovisual.co.id', 'support', 'https://scn.ly/support', 'Get Support', 'Contact our support team', 67, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert QR Scan Analytics (50 scans per QR code with varied data)
DO $$
DECLARE
    qr_id uuid;
    i integer;
    scan_date timestamp;
    ip_addresses inet[] := ARRAY['192.168.1.100'::inet, '10.0.0.50'::inet, '172.16.0.25'::inet, '203.0.113.10'::inet, '198.51.100.5'::inet];
    cities text[] := ARRAY['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'];
    countries text[] := ARRAY['Indonesia', 'Indonesia', 'Indonesia', 'Indonesia', 'Indonesia'];
    devices text[] := ARRAY['iPhone', 'Samsung Galaxy', 'Google Pixel', 'iPad', 'Android Tablet'];
    browsers text[] := ARRAY['Safari', 'Chrome', 'Firefox', 'Edge', 'Opera'];
BEGIN
    FOR qr_id IN SELECT id FROM qr_codes LOOP
        FOR i IN 1..50 LOOP
            scan_date := NOW() - (random() * interval '30 days');
            INSERT INTO qr_scan_analytics (id, qr_code_id, scanned_at, ip_address, location, device)
            VALUES (
                gen_random_uuid(),
                qr_id,
                scan_date,
                ip_addresses[1 + floor(random() * array_length(ip_addresses, 1))],
                jsonb_build_object(
                    'city', cities[1 + floor(random() * array_length(cities, 1))],
                    'country', countries[1 + floor(random() * array_length(countries, 1))],
                    'latitude', -6.2 + (random() * 2),
                    'longitude', 106.8 + (random() * 2)
                ),
                jsonb_build_object(
                    'type', devices[1 + floor(random() * array_length(devices, 1))],
                    'browser', browsers[1 + floor(random() * array_length(browsers, 1))],
                    'os', CASE WHEN random() > 0.5 THEN 'iOS' ELSE 'Android' END
                )
            );
        END LOOP;
    END LOOP;
END $$;

-- Insert URL Click Analytics (30 clicks per URL with varied data)
DO $$
DECLARE
    url_id uuid;
    i integer;
    click_date timestamp;
    ip_addresses inet[] := ARRAY['192.168.1.100'::inet, '10.0.0.50'::inet, '172.16.0.25'::inet, '203.0.113.10'::inet, '198.51.100.5'::inet];
    cities text[] := ARRAY['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang'];
    countries text[] := ARRAY['Indonesia', 'Indonesia', 'Indonesia', 'Indonesia', 'Indonesia'];
    devices text[] := ARRAY['iPhone', 'Samsung Galaxy', 'Google Pixel', 'iPad', 'Android Tablet'];
    browsers text[] := ARRAY['Safari', 'Chrome', 'Firefox', 'Edge', 'Opera'];
BEGIN
    FOR url_id IN SELECT id FROM short_urls LOOP
        FOR i IN 1..30 LOOP
            click_date := NOW() - (random() * interval '30 days');
            INSERT INTO url_click_analytics (id, url_id, clicked_at, ip_address, location, device)
            VALUES (
                gen_random_uuid(),
                url_id,
                click_date,
                ip_addresses[1 + floor(random() * array_length(ip_addresses, 1))],
                jsonb_build_object(
                    'city', cities[1 + floor(random() * array_length(cities, 1))],
                    'country', countries[1 + floor(random() * array_length(countries, 1))],
                    'latitude', -6.2 + (random() * 2),
                    'longitude', 106.8 + (random() * 2)
                ),
                jsonb_build_object(
                    'type', devices[1 + floor(random() * array_length(devices, 1))],
                    'browser', browsers[1 + floor(random() * array_length(browsers, 1))],
                    'os', CASE WHEN random() > 0.5 THEN 'iOS' ELSE 'Android' END
                )
            );
        END LOOP;
    END LOOP;
END $$;

-- Re-enable RLS with correct policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_click_analytics ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies that work
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Users can manage own data" ON users
    FOR ALL USING (auth.uid() = id);

-- QR Categories policies
DROP POLICY IF EXISTS "Users can manage own qr_categories" ON qr_categories;
CREATE POLICY "Users can manage own qr_categories" ON qr_categories
    FOR ALL USING (auth.uid() = user_id);

-- URL Categories policies
DROP POLICY IF EXISTS "Users can manage own url_categories" ON url_categories;
CREATE POLICY "Users can manage own url_categories" ON url_categories
    FOR ALL USING (auth.uid() = user_id);

-- QR Codes policies
DROP POLICY IF EXISTS "Users can manage own qr_codes" ON qr_codes;
CREATE POLICY "Users can manage own qr_codes" ON qr_codes
    FOR ALL USING (auth.uid() = user_id);

-- Short URLs policies
DROP POLICY IF EXISTS "Users can manage own short_urls" ON short_urls;
CREATE POLICY "Users can manage own short_urls" ON short_urls
    FOR ALL USING (auth.uid() = user_id);

-- Analytics policies (read-only for users)
DROP POLICY IF EXISTS "Users can view own qr_analytics" ON qr_scan_analytics;
CREATE POLICY "Users can view own qr_analytics" ON qr_scan_analytics
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM qr_codes WHERE id = qr_code_id));

DROP POLICY IF EXISTS "Users can view own url_analytics" ON url_click_analytics;
CREATE POLICY "Users can view own url_analytics" ON url_click_analytics
    FOR SELECT USING (auth.uid() IN (SELECT user_id FROM short_urls WHERE id = url_id));

-- Allow public insert for analytics (for tracking)
CREATE POLICY "Allow public insert qr_analytics" ON qr_scan_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert url_analytics" ON url_click_analytics
    FOR INSERT WITH CHECK (true);
