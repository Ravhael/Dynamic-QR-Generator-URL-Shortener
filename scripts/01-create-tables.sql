-- QR Code & URL Management Platform Database Schema
-- Created for Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Groups Table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users Table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'editor', 'viewer')) DEFAULT 'viewer',
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. QR Categories Table
CREATE TABLE qr_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color code
    is_default BOOLEAN DEFAULT false,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- null for system categories
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. URL Categories Table
CREATE TABLE url_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color code
    is_default BOOLEAN DEFAULT false,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- null for system categories
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. QR Codes Table
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('url', 'text', 'email', 'phone', 'wifi', 'location')) NOT NULL,
    content TEXT NOT NULL,
    is_dynamic BOOLEAN DEFAULT false,
    tags JSONB DEFAULT '[]'::jsonb,
    scans INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_scans INTEGER,
    qr_code_data TEXT NOT NULL, -- base64 encoded QR image
    customization JSONB DEFAULT '{}'::jsonb, -- styling options
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES qr_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Short URLs Table
CREATE TABLE short_urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_url TEXT NOT NULL,
    short_code VARCHAR(50) UNIQUE NOT NULL,
    short_url VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    clicks INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_clicks INTEGER,
    custom_domain VARCHAR(255),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES url_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. QR Scan Analytics Table
CREATE TABLE qr_scan_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    location JSONB DEFAULT '{}'::jsonb, -- country, city, region, timezone, lat/lng, ISP
    device JSONB DEFAULT '{}'::jsonb -- type, OS, browser
);

-- 8. URL Click Analytics Table
CREATE TABLE url_click_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url_id UUID NOT NULL REFERENCES short_urls(id) ON DELETE CASCADE,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    location JSONB DEFAULT '{}'::jsonb, -- country, city, region, timezone, lat/lng, ISP
    device JSONB DEFAULT '{}'::jsonb -- type, OS, browser
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_group_id ON users(group_id);
CREATE INDEX idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX idx_qr_codes_category_id ON qr_codes(category_id);
CREATE INDEX idx_qr_codes_type ON qr_codes(type);
CREATE INDEX idx_qr_codes_is_active ON qr_codes(is_active);
CREATE INDEX idx_short_urls_user_id ON short_urls(user_id);
CREATE INDEX idx_short_urls_category_id ON short_urls(category_id);
CREATE INDEX idx_short_urls_short_code ON short_urls(short_code);
CREATE INDEX idx_short_urls_is_active ON short_urls(is_active);
CREATE INDEX idx_qr_scan_analytics_qr_code_id ON qr_scan_analytics(qr_code_id);
CREATE INDEX idx_qr_scan_analytics_scanned_at ON qr_scan_analytics(scanned_at);
CREATE INDEX idx_url_click_analytics_url_id ON url_click_analytics(url_id);
CREATE INDEX idx_url_click_analytics_clicked_at ON url_click_analytics(clicked_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qr_categories_updated_at BEFORE UPDATE ON qr_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_url_categories_updated_at BEFORE UPDATE ON url_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_short_urls_updated_at BEFORE UPDATE ON short_urls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
