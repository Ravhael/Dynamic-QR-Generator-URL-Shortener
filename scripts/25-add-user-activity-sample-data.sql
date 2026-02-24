-- Script: 25-add-user-activity-sample-data.sql
-- Purpose: Add comprehensive sample data to user_activity table
-- Author: Generated for Scanly Analytics System
-- Date: 2025-08-28

-- Insert realistic user activity patterns across all activity categories
INSERT INTO user_activity (
    user_id, 
    action, 
    target_type, 
    target_id, 
    target_name,
    description, 
    metadata, 
    ip_address, 
    user_agent, 
    duration_ms, 
    created_at
) VALUES

-- Script: 25-add-user-activity-sample-data.sql
-- Purpose: Add comprehensive sample data to user_activity table
-- Author: Generated for Scanly Analytics System
-- Date: 2025-08-28

-- Authentication Activities
INSERT INTO user_activity (user_id, action, target_type, target_id, target_name, description, metadata, ip_address, user_agent, duration_ms, created_at) VALUES
('481f02ab-abda-49de-a6f7-e42f6cebd7b6', 'LOGIN', 'session', gen_random_uuid(), 'Desktop Login Session', 'Successful login via email', '{"method": "email", "remember_me": true, "device": "desktop", "location": "Jakarta"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', NULL, NOW() - INTERVAL '5 days'),
('58fc6b5a-3c29-4bc5-88ec-b71dde6ec94e', 'LOGOUT', 'session', gen_random_uuid(), 'Mobile Logout Session', 'User logout after 30 minutes', '{"duration_minutes": 30, "pages_visited": 12, "device": "mobile"}', '10.0.0.5', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)', NULL, NOW() - INTERVAL '4 days'),
('1cc6bd81-b061-476b-bd2c-41f034652486', 'PASSWORD_CHANGE', 'user', '1cc6bd81-b061-476b-bd2c-41f034652486', 'Password Security Update', 'User changed password for security', '{"reason": "security_update", "strength": "strong", "two_factor_enabled": true}', '203.0.113.45', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 45000, NOW() - INTERVAL '3 days');

-- Admin Activities  
INSERT INTO user_activity (user_id, action, target_type, target_id, target_name, description, metadata, ip_address, user_agent, duration_ms, created_at) VALUES
('af6b7277-5dd7-4a4d-9501-b5e6f15202e8', 'ADMIN_LOGIN', 'admin_session', gen_random_uuid(), 'Admin Dashboard Access', 'Admin login to management panel', '{"admin_level": "super", "ip_whitelisted": true}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NULL, NOW() - INTERVAL '2 days'),
('af6b7277-5dd7-4a4d-9501-b5e6f15202e8', 'ADMIN_SETTINGS_UPDATE', 'system', gen_random_uuid(), 'System Configuration', 'Updated notification preferences', '{"settings": {"email_enabled": true, "push_enabled": false}, "categories": ["security", "analytics"]}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 120000, NOW() - INTERVAL '1 day'),
('db209cbf-1d57-49e2-b61c-bca3f1446b71', 'BACKUP_CREATED', 'database', gen_random_uuid(), 'Daily Backup Process', 'Automatic daily backup completed', '{"size_mb": 245.7, "compression": "gzip", "tables": 15, "records": 125847}', '127.0.0.1', 'System Cron Job', 2345000, NOW() - INTERVAL '12 hours');

-- QR Code Management Activities
INSERT INTO user_activity (user_id, action, target_type, target_id, target_name, description, metadata, ip_address, user_agent, duration_ms, created_at) VALUES
('58fc6b5a-3c29-4bc5-88ec-b71dde6ec94e', 'CREATE_QR', 'qr_code', gen_random_uuid(), 'Marketing Campaign QR', 'Created QR code for product page', '{"type": "url", "size": 256, "foreground_color": "#000000", "url": "https://company.com/product/spring-sale", "campaign": "spring2025"}', '10.0.0.5', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)', 78000, NOW() - INTERVAL '4 hours'),
('1cc6bd81-b061-476b-bd2c-41f034652486', 'UPDATE_QR', 'qr_code', gen_random_uuid(), 'WiFi QR Code Update', 'Updated QR code design and logo', '{"changes": {"background_color": "#FFFFFF", "logo_added": true, "error_correction": "M"}, "version": 2}', '203.0.113.45', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 156000, NOW() - INTERVAL '3 hours'),
('481f02ab-abda-49de-a6f7-e42f6cebd7b6', 'DELETE_QR', 'qr_code', gen_random_uuid(), 'Expired Campaign QR', 'Deleted QR code after campaign ended', '{"reason": "campaign_ended", "total_scans": 2847, "backup_created": true}', '198.51.100.10', 'Mozilla/5.0 (X11; Linux x86_64)', 23000, NOW() - INTERVAL '2 hours'),
('db209cbf-1d57-49e2-b61c-bca3f1446b71', 'DOWNLOAD_QR', 'qr_code', gen_random_uuid(), 'Batch QR Download', 'Downloaded QR codes in bulk', '{"format": "PNG", "count": 5, "sizes": [256, 512], "transparent": false, "with_logos": true}', '172.16.0.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 12000, NOW() - INTERVAL '1 hour'),
('58fc6b5a-3c29-4bc5-88ec-b71dde6ec94e', 'SCAN_QR', 'qr_code', gen_random_uuid(), 'Restaurant Menu QR', 'QR code scanned by customer', '{"location": {"lat": -6.2088, "lng": 106.8456, "city": "Jakarta"}, "device": "mobile", "referrer": "direct"}', '114.124.130.15', 'Mozilla/5.0 (Android 13; Mobile)', 2500, NOW() - INTERVAL '30 minutes');

-- URL Management Activities
INSERT INTO user_activity (user_id, action, target_type, target_id, target_name, description, metadata, ip_address, user_agent, duration_ms, created_at) VALUES
('58fc6b5a-3c29-4bc5-88ec-b71dde6ec94e', 'CREATE_URL', 'url', gen_random_uuid(), 'Campaign Short URL', 'Created short URL for marketing', '{"original_url": "https://company.com/long-campaign-url-with-utm-parameters", "custom_alias": "spring2025", "expiry": "2025-12-31", "utm_tracking": true}', '10.0.0.5', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)', 45000, NOW() - INTERVAL '6 hours'),
('1cc6bd81-b061-476b-bd2c-41f034652486', 'UPDATE_URL', 'url', gen_random_uuid(), 'URL Security Settings', 'Updated URL security and tracking', '{"password_protection": false, "click_limit": 1000, "geo_targeting": {"countries": ["ID", "MY", "SG"]}}', '203.0.113.45', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 89000, NOW() - INTERVAL '5 hours'),
('481f02ab-abda-49de-a6f7-e42f6cebd7b6', 'DELETE_URL', 'url', gen_random_uuid(), 'Completed Campaign URL', 'Deleted URL after campaign completion', '{"reason": "campaign_completed", "total_clicks": 2847, "conversion_rate": "12.4%"}', '198.51.100.10', 'Mozilla/5.0 (X11; Linux x86_64)', 15000, NOW() - INTERVAL '4 hours'),
('1cc6bd81-b061-476b-bd2c-41f034652486', 'CLICK_URL', 'url', gen_random_uuid(), 'Social Media Link', 'Short URL clicked from Instagram', '{"referrer": "instagram.com", "utm_source": "instagram", "utm_campaign": "summer_sale", "user_agent_mobile": true}', '203.0.113.45', 'Instagram (Android)', 1200, NOW() - INTERVAL '15 minutes');

-- User Management Activities
INSERT INTO user_activity (user_id, action, target_type, target_id, target_name, description, metadata, ip_address, user_agent, duration_ms, created_at) VALUES
('af6b7277-5dd7-4a4d-9501-b5e6f15202e8', 'UPDATE_USER', 'user', '58fc6b5a-3c29-4bc5-88ec-b71dde6ec94e', 'Premium Upgrade', 'Upgraded user to premium plan', '{"old_plan": "basic", "new_plan": "premium", "admin_approved": true, "billing_cycle": "monthly"}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 78000, NOW() - INTERVAL '12 hours'),
('af6b7277-5dd7-4a4d-9501-b5e6f15202e8', 'ACTIVATE_USER', 'user', 'db209cbf-1d57-49e2-b61c-bca3f1446b71', 'Account Activation', 'Manually activated suspended user account', '{"reason": "payment_resolved", "previous_status": "suspended", "notification_sent": true}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 34000, NOW() - INTERVAL '8 hours');

-- Category and Group Management
INSERT INTO user_activity (user_id, action, target_type, target_id, target_name, description, metadata, ip_address, user_agent, duration_ms, created_at) VALUES
('58fc6b5a-3c29-4bc5-88ec-b71dde6ec94e', 'CREATE_CATEGORY', 'category', gen_random_uuid(), 'Marketing Campaigns Category', 'Created new QR category for marketing team', '{"name": "Marketing Campaigns", "color": "#3B82F6", "department": "marketing", "default": false}', '10.0.0.5', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)', 45000, NOW() - INTERVAL '1 day'),
('1cc6bd81-b061-476b-bd2c-41f034652486', 'UPDATE_CATEGORY', 'category', gen_random_uuid(), 'Events Category Update', 'Updated category description and permissions', '{"description_added": true, "permissions": "team_only", "icon": "calendar"}', '203.0.113.45', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 67000, NOW() - INTERVAL '18 hours'),
('af6b7277-5dd7-4a4d-9501-b5e6f15202e8', 'CREATE_GROUP', 'group', gen_random_uuid(), 'Marketing Team Group', 'Created user group for marketing department', '{"members": 5, "permissions": ["qr_create", "analytics_view"], "department": "marketing", "budget_limit": 1000}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 156000, NOW() - INTERVAL '2 days'),
('db209cbf-1d57-49e2-b61c-bca3f1446b71', 'JOIN_GROUP', 'group', gen_random_uuid(), 'Development Team Join', 'User joined development team group', '{"group_name": "Development Team", "role": "member", "invited_by": "af6b7277-5dd7-4a4d-9501-b5e6f15202e8"}', '172.16.0.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 8000, NOW() - INTERVAL '1 day');

-- Migration and Data Management Activities
INSERT INTO user_activity (user_id, action, target_type, target_id, target_name, description, metadata, ip_address, user_agent, duration_ms, created_at) VALUES
('af6b7277-5dd7-4a4d-9501-b5e6f15202e8', 'START_MIGRATION', 'migration', gen_random_uuid(), 'Bulk QR Import Process', 'Started bulk QR code import from CSV', '{"source": "CSV", "total_records": 50, "estimated_duration": "5 minutes", "batch_size": 10}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NULL, NOW() - INTERVAL '3 days'),
('af6b7277-5dd7-4a4d-9501-b5e6f15202e8', 'COMPLETE_MIGRATION', 'migration', gen_random_uuid(), 'Import Completion', 'Bulk QR code import completed successfully', '{"successful": 48, "failed": 2, "errors": ["invalid_url", "duplicate_name"], "duration_minutes": 4.2}', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 252000, NOW() - INTERVAL '3 days' + INTERVAL '5 minutes'),
('1cc6bd81-b061-476b-bd2c-41f034652486', 'EXPORT_DATA', 'export', gen_random_uuid(), 'Monthly Analytics Export', 'Exported analytics data for August 2025', '{"format": "CSV", "date_range": "2025-08-01_to_2025-08-28", "records": 15420, "file_size_mb": 2.3}', '203.0.113.45', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 67000, NOW() - INTERVAL '6 hours'),
('481f02ab-abda-49de-a6f7-e42f6cebd7b6', 'IMPORT_DATA', 'import', gen_random_uuid(), 'Contact List Import', 'Imported customer contact list', '{"format": "Excel", "records": 1250, "duplicates_removed": 45, "validation_errors": 3}', '198.51.100.10', 'Mozilla/5.0 (X11; Linux x86_64)', 89000, NOW() - INTERVAL '2 hours');

-- Settings and Profile Activities
INSERT INTO user_activity (user_id, action, target_type, target_id, target_name, description, metadata, ip_address, user_agent, duration_ms, created_at) VALUES
('481f02ab-abda-49de-a6f7-e42f6cebd7b6', 'UPDATE_PROFILE', 'profile', '481f02ab-abda-49de-a6f7-e42f6cebd7b6', 'Profile Enhancement', 'Updated profile with avatar and bio', '{"fields_changed": ["display_name", "avatar", "bio"], "two_factor_enabled": true, "notification_preferences": "email_only"}', '198.51.100.10', 'Mozilla/5.0 (X11; Linux x86_64)', 198000, NOW() - INTERVAL '10 hours'),
('db209cbf-1d57-49e2-b61c-bca3f1446b71', 'UPDATE_SETTINGS', 'settings', gen_random_uuid(), 'Privacy Settings Update', 'Updated privacy and security settings', '{"privacy_level": "strict", "data_retention": "1_year", "third_party_sharing": false}', '172.16.0.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 145000, NOW() - INTERVAL '5 hours');

-- Recent Activities (last hour)
INSERT INTO user_activity (user_id, action, target_type, target_id, target_name, description, metadata, ip_address, user_agent, duration_ms, created_at) VALUES
('db209cbf-1d57-49e2-b61c-bca3f1446b71', 'CREATE_QR', 'qr_code', gen_random_uuid(), 'WiFi Access QR', 'Created WiFi QR code for office guest network', '{"type": "wifi", "ssid": "Company-Guest", "security": "WPA2", "hidden": false, "password_included": true}', '172.16.0.20', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 98000, NOW() - INTERVAL '45 minutes'),
('58fc6b5a-3c29-4bc5-88ec-b71dde6ec94e', 'LOGIN', 'session', gen_random_uuid(), 'Mobile App Login', 'Login from mobile application', '{"method": "email", "device": "mobile", "app_version": "2.1.4", "location": "Surabaya, ID"}', '114.124.130.15', 'Scanly Mobile App v2.1.4', NULL, NOW() - INTERVAL '20 minutes'),
('1cc6bd81-b061-476b-bd2c-41f034652486', 'SCAN_QR', 'qr_code', gen_random_uuid(), 'Product QR Scan', 'Scanned product QR for details', '{"product_id": "PROD_12345", "category": "electronics", "location": "store_jakarta_01", "device": "mobile"}', '203.0.113.45', 'Mozilla/5.0 (Android 13; SM-G991B)', 3200, NOW() - INTERVAL '10 minutes'),
('481f02ab-abda-49de-a6f7-e42f6cebd7b6', 'DOWNLOAD_QR', 'qr_code', gen_random_uuid(), 'Event QR Download', 'Downloaded event ticket QR codes', '{"format": "PDF", "count": 1, "size": 512, "with_logo": true, "event": "Tech Conference 2025"}', '198.51.100.10', 'Mozilla/5.0 (X11; Linux x86_64)', 15000, NOW() - INTERVAL '5 minutes');

-- Show summary of inserted data
SELECT 
    'User Activity Summary' as info,
    COUNT(*) as total_activities,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT action) as activity_types_used,
    MIN(created_at) as earliest_activity,
    MAX(created_at) as latest_activity
FROM user_activity;

-- Show activity breakdown by category
SELECT 
    at.category,
    COUNT(*) as activity_count,
    ROUND(AVG(ua.duration_ms::numeric / 1000), 2) as avg_duration_seconds
FROM user_activity ua
JOIN activity_types at ON ua.action = at.code
WHERE ua.duration_ms IS NOT NULL
GROUP BY at.category
ORDER BY activity_count DESC;

-- Show recent activities (last 24 hours)
SELECT 
    u.email,
    at.name as activity_name,
    ua.target_type,
    ua.target_name,
    ua.created_at,
    ua.duration_ms
FROM user_activity ua
JOIN activity_types at ON ua.action = at.code
JOIN auth.users u ON ua.user_id = u.id
WHERE ua.created_at > NOW() - INTERVAL '24 hours'
ORDER BY ua.created_at DESC
LIMIT 10;
