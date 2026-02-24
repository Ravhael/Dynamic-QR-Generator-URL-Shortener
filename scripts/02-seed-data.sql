-- Seed data for QR Code & URL Management Platform

-- Insert default groups
INSERT INTO groups (name, description) VALUES
('Default Group', 'Default group for new users'),
('Admin Group', 'Administrative group with full access'),
('Marketing Team', 'Marketing department group');

-- Insert default QR categories
INSERT INTO qr_categories (name, description, color, is_default, user_id) VALUES
('General', 'General purpose QR codes', '#6366f1', true, null),
('Marketing', 'Marketing campaigns and promotions', '#ef4444', true, null),
('Events', 'Event tickets and information', '#10b981', true, null),
('Business', 'Business cards and contact info', '#f59e0b', true, null),
('Social Media', 'Social media links and profiles', '#8b5cf6', true, null);

-- Insert default URL categories
INSERT INTO url_categories (name, description, color, is_default, user_id) VALUES
('General', 'General purpose short URLs', '#6366f1', true, null),
('Marketing', 'Marketing campaigns and promotions', '#ef4444', true, null),
('Social Media', 'Social media links', '#8b5cf6', true, null),
('Documentation', 'Documentation and resources', '#10b981', true, null),
('Products', 'Product pages and catalogs', '#f59e0b', true, null);
