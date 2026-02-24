-- Fix RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create simple RLS policies using auth.uid() directly
CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for users based on user_id" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Insert sample data
-- 1. Insert user data (using the provided UID)
INSERT INTO users (id, email, full_name, role, created_at, updated_at) VALUES
('c2823bb2-0751-4954-860a-74a7201b90f7', 'admin@scanly.indovisual.co.id', 'Admin Scanly', 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- 2. Insert sample categories
INSERT INTO categories (id, name, description, user_id, created_at, updated_at) VALUES
(gen_random_uuid(), 'Marketing', 'Marketing campaigns and promotions', 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
(gen_random_uuid(), 'Events', 'Event tickets and information', 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
(gen_random_uuid(), 'Products', 'Product information and catalogs', 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
(gen_random_uuid(), 'Social Media', 'Social media links and profiles', 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW());

-- 3. Insert sample QR codes
WITH category_ids AS (
    SELECT id, name FROM categories WHERE user_id = 'c2823bb2-0751-4954-860a-74a7201b90f7'
)
INSERT INTO qr_codes (id, title, content, qr_type, user_id, category_id, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    title,
    content,
    qr_type,
    'c2823bb2-0751-4954-860a-74a7201b90f7',
    category_ids.id,
    true,
    NOW() - (random() * interval '30 days'),
    NOW()
FROM (VALUES
    ('Company Website', 'https://scanly.indovisual.co.id', 'url', 'Marketing'),
    ('Contact Info', 'BEGIN:VCARD\nVERSION:3.0\nFN:Admin Scanly\nORG:Scanly\nTEL:+62812345678\nEMAIL:admin@scanly.indovisual.co.id\nEND:VCARD', 'vcard', 'Marketing'),
    ('WiFi Access', 'WIFI:T:WPA;S:ScanlyOffice;P:scanly2024;H:false;;', 'wifi', 'Events'),
    ('Product Catalog', 'https://catalog.scanly.indovisual.co.id', 'url', 'Products'),
    ('Event Registration', 'https://events.scanly.indovisual.co.id/register', 'url', 'Events'),
    ('Instagram Profile', 'https://instagram.com/scanly.official', 'url', 'Social Media')
) AS sample_data(title, content, qr_type, category_name)
JOIN category_ids ON category_ids.name = sample_data.category_name;

-- 4. Insert sample short URLs
WITH category_ids AS (
    SELECT id, name FROM categories WHERE user_id = 'c2823bb2-0751-4954-860a-74a7201b90f7'
)
INSERT INTO short_urls (id, title, original_url, short_code, user_id, category_id, is_active, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    title,
    original_url,
    short_code,
    'c2823bb2-0751-4954-860a-74a7201b90f7',
    category_ids.id,
    true,
    NOW() - (random() * interval '30 days'),
    NOW()
FROM (VALUES
    ('Main Website', 'https://scanly.indovisual.co.id', 'main', 'Marketing'),
    ('Product Demo', 'https://demo.scanly.indovisual.co.id', 'demo', 'Products'),
    ('Support Center', 'https://support.scanly.indovisual.co.id', 'help', 'Marketing'),
    ('Blog', 'https://blog.scanly.indovisual.co.id', 'blog', 'Marketing'),
    ('Pricing', 'https://scanly.indovisual.co.id/pricing', 'price', 'Products'),
    ('Contact', 'https://scanly.indovisual.co.id/contact', 'contact', 'Marketing')
) AS sample_data(title, original_url, short_code, category_name)
JOIN category_ids ON category_ids.name = sample_data.category_name;

-- 5. Insert sample QR scan analytics
WITH qr_data AS (
    SELECT id FROM qr_codes WHERE user_id = 'c2823bb2-0751-4954-860a-74a7201b90f7'
)
INSERT INTO qr_scan_analytics (id, qr_code_id, scanned_at, ip_address, user_agent, country, city, device_type, browser)
SELECT 
    gen_random_uuid(),
    qr_id,
    scan_time,
    ip,
    user_agent,
    country,
    city,
    device,
    browser
FROM qr_data
CROSS JOIN (
    SELECT 
        qr_data.id as qr_id,
        NOW() - (random() * interval '30 days') as scan_time,
        (ARRAY['192.168.1.100', '203.78.121.45', '114.79.45.123', '180.241.67.89'])[floor(random() * 4 + 1)] as ip,
        (ARRAY[
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
            'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        ])[floor(random() * 4 + 1)] as user_agent,
        (ARRAY['Indonesia', 'Singapore', 'Malaysia', 'Thailand'])[floor(random() * 4 + 1)] as country,
        (ARRAY['Jakarta', 'Singapore', 'Kuala Lumpur', 'Bangkok'])[floor(random() * 4 + 1)] as city,
        (ARRAY['mobile', 'desktop', 'tablet'])[floor(random() * 3 + 1)] as device,
        (ARRAY['Chrome', 'Safari', 'Firefox', 'Edge'])[floor(random() * 4 + 1)] as browser
    FROM generate_series(1, 50) -- Generate 50 scans per QR code
) analytics_data;

-- 6. Insert sample URL click analytics
WITH url_data AS (
    SELECT id FROM short_urls WHERE user_id = 'c2823bb2-0751-4954-860a-74a7201b90f7'
)
INSERT INTO url_click_analytics (id, short_url_id, clicked_at, ip_address, user_agent, country, city, device_type, browser, referrer)
SELECT 
    gen_random_uuid(),
    url_id,
    click_time,
    ip,
    user_agent,
    country,
    city,
    device,
    browser,
    referrer
FROM url_data
CROSS JOIN (
    SELECT 
        url_data.id as url_id,
        NOW() - (random() * interval '30 days') as click_time,
        (ARRAY['192.168.1.100', '203.78.121.45', '114.79.45.123', '180.241.67.89'])[floor(random() * 4 + 1)] as ip,
        (ARRAY[
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
            'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        ])[floor(random() * 4 + 1)] as user_agent,
        (ARRAY['Indonesia', 'Singapore', 'Malaysia', 'Thailand'])[floor(random() * 4 + 1)] as country,
        (ARRAY['Jakarta', 'Singapore', 'Kuala Lumpur', 'Bangkok'])[floor(random() * 4 + 1)] as city,
        (ARRAY['mobile', 'desktop', 'tablet'])[floor(random() * 3 + 1)] as device,
        (ARRAY['Chrome', 'Safari', 'Firefox', 'Edge'])[floor(random() * 4 + 1)] as browser,
        (ARRAY['https://google.com', 'https://facebook.com', 'direct', 'https://twitter.com'])[floor(random() * 4 + 1)] as referrer
    FROM generate_series(1, 30) -- Generate 30 clicks per URL
) analytics_data;

-- Update statistics
ANALYZE users;
ANALYZE categories;
ANALYZE qr_codes;
ANALYZE short_urls;
ANALYZE qr_scan_analytics;
ANALYZE url_click_analytics;
