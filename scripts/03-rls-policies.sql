-- Row Level Security (RLS) Policies for Supabase

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_scan_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_click_analytics ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Groups policies
CREATE POLICY "Users can view groups" ON groups
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage groups" ON groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- QR Categories policies
CREATE POLICY "Users can view categories" ON qr_categories
    FOR SELECT USING (
        is_default = true OR user_id = auth.uid()
    );

CREATE POLICY "Users can manage their own categories" ON qr_categories
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can create categories" ON qr_categories
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- URL Categories policies
CREATE POLICY "Users can view URL categories" ON url_categories
    FOR SELECT USING (
        is_default = true OR user_id = auth.uid()
    );

CREATE POLICY "Users can manage their own URL categories" ON url_categories
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can create URL categories" ON url_categories
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- QR Codes policies
CREATE POLICY "Users can view their own QR codes" ON qr_codes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own QR codes" ON qr_codes
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can create QR codes" ON qr_codes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can scan QR codes" ON qr_codes
    FOR SELECT USING (is_active = true);

-- Short URLs policies
CREATE POLICY "Users can view their own URLs" ON short_urls
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own URLs" ON short_urls
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can create URLs" ON short_urls
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Public can access active short URLs" ON short_urls
    FOR SELECT USING (is_active = true);

-- Analytics policies
CREATE POLICY "Users can view their QR analytics" ON qr_scan_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM qr_codes 
            WHERE id = qr_code_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert QR analytics" ON qr_scan_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their URL analytics" ON url_click_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM short_urls 
            WHERE id = url_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert URL analytics" ON url_click_analytics
    FOR INSERT WITH CHECK (true);
