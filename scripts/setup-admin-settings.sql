-- Setup admin_settings with configuration from all three tabs
-- Clear existing data
TRUNCATE TABLE admin_settings;

-- System Settings (Security & Authentication)
INSERT INTO admin_settings (id, setting_key, setting_value, setting_type, description, is_public, is_encrypted, created_at, updated_at) VALUES
(gen_random_uuid(), 'system.security.require2FA', 'true', 'boolean', 'Require 2FA for Administrator accounts', false, false, NOW(), NOW()),
(gen_random_uuid(), 'system.security.sessionTimeout', '"1 hour"', 'string', 'Automatic logout after inactivity', false, false, NOW(), NOW()),
(gen_random_uuid(), 'system.security.enableRegistration', 'false', 'boolean', 'Allow new users to register accounts', false, false, NOW(), NOW()),

-- Data Management Settings
(gen_random_uuid(), 'system.data.autoDeleteExpired', 'false', 'boolean', 'Auto-delete expired QR codes', false, false, NOW(), NOW()),
(gen_random_uuid(), 'system.data.dataRetention', '"1 year"', 'string', 'How long to keep analytics and log data', false, false, NOW(), NOW()),
(gen_random_uuid(), 'system.data.maxUploadSize', '"10MB"', 'string', 'Maximum file size for image uploads', false, false, NOW(), NOW()),

-- API & Integration Settings
(gen_random_uuid(), 'system.api.enableApiAccess', 'true', 'boolean', 'Allow external applications to use the API', false, false, NOW(), NOW()),
(gen_random_uuid(), 'system.api.enableEmailNotifications', 'true', 'boolean', 'Send system notifications via email', false, false, NOW(), NOW()),

-- System Maintenance
(gen_random_uuid(), 'system.maintenance.maintenanceMode', 'false', 'boolean', 'Put system in maintenance mode', false, false, NOW(), NOW()),

-- Permissions & Roles Settings
-- Department permission configuration
(gen_random_uuid(), 'permissions.departments.enabled', 'true', 'boolean', 'Enable department-based permissions', false, false, NOW(), NOW()),
(gen_random_uuid(), 'permissions.roles.admin.level', '100', 'number', 'Administrator role access level', false, false, NOW(), NOW()),
(gen_random_uuid(), 'permissions.roles.editor.level', '75', 'number', 'Editor role access level', false, false, NOW(), NOW()),
(gen_random_uuid(), 'permissions.roles.viewer.level', '50', 'number', 'Viewer role access level', false, false, NOW(), NOW()),
(gen_random_uuid(), 'permissions.roles.user.level', '25', 'number', 'User role access level', false, false, NOW(), NOW()),

-- Permission matrix for departments (as JSONB for complex data)
(gen_random_uuid(), 'permissions.matrix.dgm', '{"dashboard":true,"users":true,"qr":true,"url":true,"system":true}', 'json', 'DGM department permission matrix', false, false, NOW(), NOW()),
(gen_random_uuid(), 'permissions.matrix.marcomm', '{"dashboard":true,"users":false,"qr":true,"url":true,"system":false}', 'json', 'Marketing Communication permission matrix', false, false, NOW(), NOW()),
(gen_random_uuid(), 'permissions.matrix.hrd', '{"dashboard":true,"users":true,"qr":false,"url":false,"system":false}', 'json', 'Human Resources permission matrix', false, false, NOW(), NOW()),
(gen_random_uuid(), 'permissions.matrix.amga', '{"dashboard":true,"users":false,"qr":false,"url":false,"system":true}', 'json', 'Admin & General Affairs permission matrix', false, false, NOW(), NOW()),

-- Menu Settings (Menu Permissions per Role)
-- Admin menu permissions
(gen_random_uuid(), 'menu.permissions.admin', '{"dashboard":true,"users":true,"qr-codes":true,"url-list":true,"qr-categories":true,"url-categories":true,"qr-analytics":true,"url-analytics":true,"reports":true,"groups":true,"admin-panel":true,"settings":true,"notifications":true}', 'json', 'Administrator menu permissions', false, false, NOW(), NOW()),

-- Editor menu permissions  
(gen_random_uuid(), 'menu.permissions.editor', '{"dashboard":true,"users":false,"qr-codes":true,"url-list":true,"qr-categories":true,"url-categories":true,"qr-analytics":true,"url-analytics":true,"reports":true,"groups":false,"admin-panel":false,"settings":false,"notifications":true}', 'json', 'Editor menu permissions', false, false, NOW(), NOW()),

-- Viewer menu permissions
(gen_random_uuid(), 'menu.permissions.viewer', '{"dashboard":true,"users":false,"qr-codes":false,"url-list":false,"qr-categories":false,"url-categories":false,"qr-analytics":true,"url-analytics":true,"reports":true,"groups":false,"admin-panel":false,"settings":false,"notifications":true}', 'json', 'Viewer menu permissions', false, false, NOW(), NOW()),

-- User menu permissions
(gen_random_uuid(), 'menu.permissions.user', '{"dashboard":true,"users":false,"qr-codes":true,"url-list":true,"qr-categories":false,"url-categories":false,"qr-analytics":false,"url-analytics":false,"reports":false,"groups":false,"admin-panel":false,"settings":false,"notifications":true}', 'json', 'User menu permissions', false, false, NOW(), NOW()),

-- Menu configuration settings
(gen_random_uuid(), 'menu.config.enableDynamicMenu', 'true', 'boolean', 'Enable dynamic menu based on permissions', false, false, NOW(), NOW()),
(gen_random_uuid(), 'menu.config.showHiddenMenus', 'false', 'boolean', 'Show hidden menu items for debugging', false, false, NOW(), NOW()),
(gen_random_uuid(), 'menu.config.cachePermissions', 'true', 'boolean', 'Cache menu permissions for performance', false, false, NOW(), NOW());
