-- Disable RLS temporarily to insert data
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE short_urls DISABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE url_click_analytics DISABLE ROW LEVEL SECURITY;

-- Insert user data first
INSERT INTO users (id, email, full_name, role, created_at, updated_at) VALUES
('c2823bb2-0751-4954-860a-74a7201b90f7', 'admin@scanly.indovisual.co.id', 'Admin Scanly', 'admin', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert categories
INSERT INTO categories (name, description, created_by, created_at, updated_at) VALUES
('Marketing', 'QR codes for marketing campaigns', 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
('Events', 'QR codes for event management', 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
('Products', 'QR codes for product information', 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
('Social Media', 'Short URLs for social media', 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
('Business', 'Professional short URLs', 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert QR codes
INSERT INTO qr_codes (title, qr_data, qr_image_url, category_id, created_by, created_at, updated_at) VALUES
('Website QR', 'https://scanly.indovisual.co.id', '/placeholder.svg?height=200&width=200', 1, 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
('Contact QR', 'BEGIN:VCARD\nVERSION:3.0\nFN:Admin Scanly\nEMAIL:admin@scanly.indovisual.co.id\nEND:VCARD', '/placeholder.svg?height=200&width=200', 2, 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
('Product Demo', 'https://demo.scanly.indovisual.co.id/product', '/placeholder.svg?height=200&width=200', 3, 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
('Event Registration', 'https://events.scanly.indovisual.co.id/register', '/placeholder.svg?height=200&width=200', 2, 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
('WiFi Access', 'WIFI:T:WPA;S:ScanlyOffice;P:password123;H:false;;', '/placeholder.svg?height=200&width=200', 2, 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW());

-- Insert short URLs
INSERT INTO short_urls (title, original_url, short_code, category_id, created_by, created_at, updated_at) VALUES
('Homepage', 'https://scanly.indovisual.co.id', 'home', 4, 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
('About Us', 'https://scanly.indovisual.co.id/about', 'about', 4, 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
('Contact', 'https://scanly.indovisual.co.id/contact', 'contact', 5, 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
('Pricing', 'https://scanly.indovisual.co.id/pricing', 'price', 5, 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW()),
('Demo', 'https://demo.scanly.indovisual.co.id', 'demo', 3, 'c2823bb2-0751-4954-860a-74a7201b90f7', NOW(), NOW());

-- Insert QR scan analytics (50 scans per QR code)
INSERT INTO qr_scan_analytics (qr_code_id, scanned_at, ip_address, user_agent, location)
SELECT 
    qr.id,
    NOW() - (random() * interval '30 days'),
    '192.168.' || floor(random() * 255) || '.' || floor(random() * 255),
    CASE floor(random() * 4)
        WHEN 0 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
        WHEN 1 THEN 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0'
        WHEN 2 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ELSE 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    END,
    CASE floor(random() * 5)
        WHEN 0 THEN 'Jakarta, Indonesia'
        WHEN 1 THEN 'Surabaya, Indonesia'
        WHEN 2 THEN 'Bandung, Indonesia'
        WHEN 3 THEN 'Medan, Indonesia'
        ELSE 'Yogyakarta, Indonesia'
    END
FROM qr_codes qr
CROSS JOIN generate_series(1, 50) s;

-- Insert URL click analytics (30 clicks per URL)
INSERT INTO url_click_analytics (short_url_id, clicked_at, ip_address, user_agent, location, referrer)
SELECT 
    su.id,
    NOW() - (random() * interval '30 days'),
    '203.142.' || floor(random() * 255) || '.' || floor(random() * 255),
    CASE floor(random() * 4)
        WHEN 0 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
        WHEN 1 THEN 'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/88.0'
        WHEN 2 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ELSE 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    END,
    CASE floor(random() * 5)
        WHEN 0 THEN 'Jakarta, Indonesia'
        WHEN 1 THEN 'Surabaya, Indonesia'
        WHEN 2 THEN 'Bandung, Indonesia'
        WHEN 3 THEN 'Medan, Indonesia'
        ELSE 'Yogyakarta, Indonesia'
    END,
    CASE floor(random() * 4)
        WHEN 0 THEN 'https://google.com'
        WHEN 1 THEN 'https://facebook.com'
        WHEN 2 THEN 'https://twitter.com'
        ELSE 'direct'
    END
FROM short_urls su
CROSS JOIN generate_series(1, 30) s;

-- Re-enable RLS with simple policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_click_analytics ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies that don't cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Enable all for authenticated users" ON users FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON qr_codes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON short_urls FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON qr_scan_analytics FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON url_click_analytics FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Enable all for authenticated users" ON categories FOR ALL USING (auth.uid() IS NOT NULL);
