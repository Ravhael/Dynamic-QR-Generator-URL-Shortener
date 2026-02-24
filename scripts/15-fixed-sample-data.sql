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

-- Fixed column name from full_name to name and table references
-- Insert sample data using correct column names and table references
INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES
('c2823bb2-0751-4954-860a-74a7201b90f7'::uuid, 'admin@scanly.indovisual.co.id', 'Admin Scanly', 'admin', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Insert sample QR categories (not generic categories table)
INSERT INTO qr_categories (id, name, description, user_id, created_at, updated_at, color, is_default) VALUES
(gen_random_uuid(), 'Marketing', 'Marketing campaigns and promotions', 'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid, NOW(), NOW(), '#3B82F6', false),
(gen_random_uuid(), 'Events', 'Event tickets and information', 'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid, NOW(), NOW(), '#10B981', false),
(gen_random_uuid(), 'Products', 'Product information and catalogs', 'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid, NOW(), NOW(), '#F59E0B', false),
(gen_random_uuid(), 'Social Media', 'Social media links and profiles', 'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid, NOW(), NOW(), '#EF4444', false);

-- Insert sample URL categories
INSERT INTO url_categories (id, name, description, user_id, created_at, updated_at, color, is_default) VALUES
(gen_random_uuid(), 'Marketing', 'Marketing campaigns and promotions', 'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid, NOW(), NOW(), '#3B82F6', false),
(gen_random_uuid(), 'Events', 'Event tickets and information', 'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid, NOW(), NOW(), '#10B981', false),
(gen_random_uuid(), 'Products', 'Product information and catalogs', 'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid, NOW(), NOW(), '#F59E0B', false),
(gen_random_uuid(), 'Social Media', 'Social media links and profiles', 'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid, NOW(), NOW(), '#EF4444', false);

-- Insert sample QR codes using correct table structure
WITH qr_category_ids AS (
    SELECT id, name FROM qr_categories WHERE user_id = 'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid
)
INSERT INTO qr_codes (id, name, content, type, user_id, category_id, is_active, created_at, updated_at, scans, is_dynamic)
SELECT 
    gen_random_uuid(),
    title,
    content,
    qr_type,
    'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
    qr_category_ids.id,
    true,
    NOW() - (random() * interval '30 days'),
    NOW(),
    0,
    false
FROM (VALUES
    ('Company Website', 'https://scanly.indovisual.co.id', 'url', 'Marketing'),
    ('Contact Info', 'BEGIN:VCARD\nVERSION:3.0\nFN:Admin Scanly\nORG:Scanly\nTEL:+62812345678\nEMAIL:admin@scanly.indovisual.co.id\nEND:VCARD', 'text', 'Marketing'),
    ('WiFi Access', 'WIFI:T:WPA;S:ScanlyOffice;P:scanly2024;H:false;;', 'wifi', 'Events'),
    ('Product Catalog', 'https://catalog.scanly.indovisual.co.id', 'url', 'Products'),
    ('Event Registration', 'https://events.scanly.indovisual.co.id/register', 'url', 'Events'),
    ('Instagram Profile', 'https://instagram.com/scanly.official', 'url', 'Social Media')
) AS sample_data(title, content, qr_type, category_name)
JOIN qr_category_ids ON qr_category_ids.name = sample_data.category_name;

-- Insert sample short URLs using correct table structure
WITH url_category_ids AS (
    SELECT id, name FROM url_categories WHERE user_id = 'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid
)
INSERT INTO short_urls (id, title, original_url, short_code, user_id, category_id, is_active, created_at, updated_at, clicks)
SELECT 
    gen_random_uuid(),
    title,
    original_url,
    short_code,
    'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid,
    url_category_ids.id,
    true,
    NOW() - (random() * interval '30 days'),
    NOW(),
    0
FROM (VALUES
    ('Main Website', 'https://scanly.indovisual.co.id', 'main', 'Marketing'),
    ('Product Demo', 'https://demo.scanly.indovisual.co.id', 'demo', 'Products'),
    ('Support Center', 'https://support.scanly.indovisual.co.id', 'help', 'Marketing'),
    ('Blog', 'https://blog.scanly.indovisual.co.id', 'blog', 'Marketing'),
    ('Pricing', 'https://scanly.indovisual.co.id/pricing', 'price', 'Products'),
    ('Contact', 'https://scanly.indovisual.co.id/contact', 'contact', 'Marketing')
) AS sample_data(title, original_url, short_code, category_name)
JOIN url_category_ids ON url_category_ids.name = sample_data.category_name;

-- Insert sample QR scan analytics using correct table structure
WITH qr_data AS (
    SELECT id FROM qr_codes WHERE user_id = 'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid
)
INSERT INTO qr_scan_analytics (id, qr_code_id, scanned_at, ip_address, device, location)
SELECT 
    gen_random_uuid(),
    qr_id,
    scan_time,
    ip::inet,
    jsonb_build_object(
        'type', device,
        'browser', browser,
        'user_agent', user_agent
    ),
    jsonb_build_object(
        'country', country,
        'city', city
    )
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
    FROM generate_series(1, 10) -- Generate 10 scans per QR code
) analytics_data;

-- Insert sample URL click analytics using correct table structure
WITH url_data AS (
    SELECT id FROM short_urls WHERE user_id = 'c2823bb2-0751-4954-860a-74a7201b90f7'::uuid
)
INSERT INTO url_click_analytics (id, url_id, clicked_at, ip_address, device, location)
SELECT 
    gen_random_uuid(),
    url_id,
    click_time,
    ip::inet,
    jsonb_build_object(
        'type', device,
        'browser', browser,
        'user_agent', user_agent,
        'referrer', referrer
    ),
    jsonb_build_object(
        'country', country,
        'city', city
    )
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
    FROM generate_series(1, 5) -- Generate 5 clicks per URL
) analytics_data;

-- Update statistics
ANALYZE users;
ANALYZE qr_categories;
ANALYZE url_categories;
ANALYZE qr_codes;
ANALYZE short_urls;
ANALYZE qr_scan_analytics;
ANALYZE url_click_analytics;
