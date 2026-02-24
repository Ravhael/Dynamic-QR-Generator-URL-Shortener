-- Enable extensions required for UUID functions (idempotent)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateTable
CREATE TABLE "public"."activity_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) DEFAULT 'general',
    "icon" VARCHAR(100),
    "color" VARCHAR(7) DEFAULT '#3B82F6',
    "is_sensitive" BOOLEAN DEFAULT false,
    "requires_approval" BOOLEAN DEFAULT false,
    "retention_days" INTEGER DEFAULT 365,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "activity_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."click_events" (
    "id" SERIAL NOT NULL,
    "url_id" UUID,
    "user_id" UUID,
    "clicked_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "click_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."click_events_backup" (
    "id" INTEGER,
    "url_id" UUID,
    "user_id" UUID,
    "clicked_at" TIMESTAMPTZ(6),
    "ip_address" INET,
    "user_agent" TEXT,
    "device_type" VARCHAR(50),
    "browser" VARCHAR(100),
    "os" VARCHAR(100),
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "referrer" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "created_by" UUID,
    "updated_by" UUID
);

-- CreateTable
CREATE TABLE "public"."groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,
    "parent_id" INTEGER,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_items" (
    "id" SERIAL NOT NULL,
    "menu_id" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "path" VARCHAR(200),
    "icon" VARCHAR(50),
    "parent_id" VARCHAR(100),
    "sort_order" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "is_group" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_permissions" (
    "id" SERIAL NOT NULL,
    "menu_item_id" INTEGER NOT NULL,
    "permission_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "menu_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."menu_role_permissions" (
    "id" SERIAL NOT NULL,
    "role_name" VARCHAR(50) NOT NULL,
    "menu_item_id" INTEGER NOT NULL,
    "can_view" BOOLEAN DEFAULT false,
    "can_create" BOOLEAN DEFAULT false,
    "can_edit" BOOLEAN DEFAULT false,
    "can_delete" BOOLEAN DEFAULT false,
    "can_export" BOOLEAN DEFAULT false,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "role_id" UUID NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "menu_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_recipients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "notification_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_read" BOOLEAN DEFAULT false,
    "is_dismissed" BOOLEAN DEFAULT false,
    "is_clicked" BOOLEAN DEFAULT false,
    "read_at" TIMESTAMP(6),
    "dismissed_at" TIMESTAMP(6),
    "clicked_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notification_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "icon" VARCHAR(50),
    "color" VARCHAR(7),
    "is_active" BOOLEAN DEFAULT true,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) DEFAULT 'info',
    "priority" VARCHAR(20) DEFAULT 'normal',
    "category" VARCHAR(100) DEFAULT 'general',
    "icon" VARCHAR(100),
    "color" VARCHAR(7) DEFAULT '#3B82F6',
    "action_url" TEXT,
    "action_label" VARCHAR(100),
    "image_url" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "expires_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,
    "type_id" UUID,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."qr_categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "is_default" BOOLEAN DEFAULT false,
    "user_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "qr_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."qr_codes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "is_dynamic" BOOLEAN DEFAULT false,
    "tags" JSONB DEFAULT '[]',
    "scans" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "expires_at" TIMESTAMPTZ(6),
    "max_scans" INTEGER,
    "qr_code_data" TEXT NOT NULL,
    "customization" JSONB DEFAULT '{}',
    "user_id" UUID NOT NULL,
    "category_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."qr_migration" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "description" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "category_id" UUID,
    "user_id" UUID NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "redirect_url" TEXT NOT NULL,
    "url_update" TEXT,
    "qr_image" TEXT,
    "status" VARCHAR(50) DEFAULT 'active',
    "scans" INTEGER DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_migration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."qr_scan_analytics" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "qr_code_id" UUID NOT NULL,
    "scanned_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "ip_address" INET,
    "user_agent" TEXT,
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "region" VARCHAR(100),
    "timezone" VARCHAR(50),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "isp" VARCHAR(255),
    "device_type" VARCHAR(50),
    "device_brand" VARCHAR(100),
    "device_model" VARCHAR(100),
    "operating_system" VARCHAR(100),
    "browser" VARCHAR(100),
    "screen_resolution" VARCHAR(20),
    "language" VARCHAR(10),
    "session_id" VARCHAR(255),
    "scan_event_id" INTEGER,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID,
    "browser_version" VARCHAR(100),
    "viewport_size" VARCHAR(50),
    "color_depth" INTEGER,
    "languages" TEXT[],
    "time_zone" VARCHAR(100),
    "referrer_domain" VARCHAR(255),
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(100),
    "utm_term" VARCHAR(100),
    "utm_content" VARCHAR(100),
    "is_bot" BOOLEAN DEFAULT false,
    "is_mobile" BOOLEAN DEFAULT false,
    "is_first_visit" BOOLEAN DEFAULT true,
    "visit_duration" INTEGER,
    "connection_type" VARCHAR(50),
    "page_load_time" INTEGER,
    "scroll_depth" INTEGER,
    "click_x" INTEGER,
    "click_y" INTEGER,
    "os" VARCHAR(100),
    "referrer" TEXT,
    "migration_qr_id" UUID,

    CONSTRAINT "qr_scan_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."resource_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."role_permissions" (
    "id" SERIAL NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "resource_type" VARCHAR(100) NOT NULL,
    "permission_type" VARCHAR(50) NOT NULL,
    "scope" VARCHAR(100) DEFAULT 'all',
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "role_id" UUID,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "display_name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scan_events" (
    "id" SERIAL NOT NULL,
    "qr_code_id" UUID NOT NULL,
    "user_id" UUID,
    "scanned_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "migration_qr_id" UUID,

    CONSTRAINT "scan_events_new_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."scan_events_backup_1758020004997" (
    "id" INTEGER,
    "qr_code_id" UUID,
    "user_id" UUID,
    "scanned_at" TIMESTAMPTZ(6),
    "ip_address" INET,
    "user_agent" TEXT,
    "device_type" VARCHAR(50),
    "browser" VARCHAR(100),
    "os" VARCHAR(100),
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "referrer" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),
    "source_table" VARCHAR(20),
    "migration_qr_id" UUID,
    "created_by" UUID,
    "updated_by" UUID
);

-- CreateTable
CREATE TABLE "public"."short_urls" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "original_url" TEXT NOT NULL,
    "short_code" VARCHAR(50) NOT NULL,
    "short_url" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "tags" JSONB DEFAULT '[]',
    "clicks" INTEGER DEFAULT 0,
    "is_active" BOOLEAN DEFAULT true,
    "expires_at" TIMESTAMPTZ(6),
    "max_clicks" INTEGER,
    "custom_domain" VARCHAR(255),
    "user_id" UUID NOT NULL,
    "category_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "short_urls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."system_settings" (
    "id" SERIAL NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "setting_key" VARCHAR(100) NOT NULL,
    "setting_value" TEXT,
    "data_type" VARCHAR(20) DEFAULT 'string',
    "description" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."url_categories" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "is_default" BOOLEAN DEFAULT false,
    "user_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "url_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."url_click_analytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "click_event_id" INTEGER,
    "short_url_id" UUID,
    "clicked_at" TIMESTAMPTZ(6),
    "ip_address" INET,
    "user_agent" TEXT,
    "country" VARCHAR(100),
    "city" VARCHAR(100),
    "region" VARCHAR(100),
    "timezone" VARCHAR(50),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "isp" VARCHAR(255),
    "device_type" VARCHAR(50),
    "device_brand" VARCHAR(100),
    "device_model" VARCHAR(100),
    "operating_system" VARCHAR(100),
    "browser" VARCHAR(100),
    "browser_version" VARCHAR(50),
    "screen_resolution" VARCHAR(50),
    "viewport_size" VARCHAR(50),
    "color_depth" INTEGER,
    "language" VARCHAR(10),
    "languages" TEXT[],
    "time_zone" VARCHAR(50),
    "session_id" VARCHAR(255),
    "referrer" TEXT,
    "utm_source" VARCHAR(100),
    "utm_medium" VARCHAR(100),
    "utm_campaign" VARCHAR(100),
    "utm_term" VARCHAR(100),
    "utm_content" VARCHAR(100),
    "is_bot" BOOLEAN DEFAULT false,
    "is_mobile" BOOLEAN DEFAULT false,
    "is_first_visit" BOOLEAN DEFAULT false,
    "visit_duration" INTEGER,
    "connection_type" VARCHAR(50),
    "page_load_time" INTEGER,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "url_click_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_activity" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "activity_type_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(100),
    "target_id" UUID,
    "target_name" VARCHAR(255),
    "description" TEXT,
    "ip_address" INET,
    "user_agent" TEXT,
    "status" VARCHAR(50) DEFAULT 'completed',
    "metadata" JSONB DEFAULT '{}',
    "session_id" VARCHAR(255),
    "duration_ms" INTEGER,
    "request_id" VARCHAR(255),
    "referer" TEXT,
    "location" JSONB,
    "device_info" JSONB,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_settings" (
    "id" SERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "setting_key" VARCHAR(200) NOT NULL,
    "setting_value" JSONB,
    "data_type" VARCHAR(50) DEFAULT 'user',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "category" VARCHAR(50) NOT NULL,
    "is_encrypted" BOOLEAN DEFAULT false,
    "created_by" UUID,
    "updated_by" UUID,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "avatar" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "group_id" INTEGER,
    "last_login" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "role_id" UUID,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_types_code_key" ON "public"."activity_types"("code");

-- CreateIndex
CREATE INDEX "idx_activity_types_category" ON "public"."activity_types"("category");

-- CreateIndex
CREATE INDEX "idx_activity_types_code" ON "public"."activity_types"("code");

-- CreateIndex
CREATE INDEX "idx_click_events_clicked_at" ON "public"."click_events"("clicked_at");

-- CreateIndex
CREATE INDEX "idx_click_events_url_id" ON "public"."click_events"("url_id");

-- CreateIndex
CREATE INDEX "idx_click_events_user_id" ON "public"."click_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_items_menu_id_key" ON "public"."menu_items"("menu_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_permissions_menu_item_id_permission_name_key" ON "public"."menu_permissions"("menu_item_id", "permission_name");

-- CreateIndex
CREATE UNIQUE INDEX "menu_role_permissions_role_name_menu_item_id_key" ON "public"."menu_role_permissions"("role_name", "menu_item_id");

-- CreateIndex
CREATE INDEX "idx_notification_recipients_notification_id" ON "public"."notification_recipients"("notification_id");

-- CreateIndex
CREATE INDEX "idx_notification_recipients_user_id" ON "public"."notification_recipients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_recipients_notification_id_user_id_key" ON "public"."notification_recipients"("notification_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_types_name_key" ON "public"."notification_types"("name");

-- CreateIndex
CREATE INDEX "idx_notifications_created_at" ON "public"."notifications"("created_at");

-- CreateIndex
CREATE INDEX "idx_notifications_expires_at" ON "public"."notifications"("expires_at");

-- CreateIndex
CREATE INDEX "idx_notifications_priority" ON "public"."notifications"("priority");

-- CreateIndex
CREATE INDEX "idx_qr_categories_user_id" ON "public"."qr_categories"("user_id");

-- CreateIndex
CREATE INDEX "idx_qr_codes_category_id" ON "public"."qr_codes"("category_id");

-- CreateIndex
CREATE INDEX "idx_qr_codes_created_by" ON "public"."qr_codes"("created_by");

-- CreateIndex
CREATE INDEX "idx_qr_codes_is_active" ON "public"."qr_codes"("is_active");

-- CreateIndex
CREATE INDEX "idx_qr_codes_type" ON "public"."qr_codes"("type");

-- CreateIndex
CREATE INDEX "idx_qr_codes_user_id" ON "public"."qr_codes"("user_id");

-- CreateIndex
CREATE INDEX "idx_qr_migration_category_id" ON "public"."qr_migration"("category_id");

-- CreateIndex
CREATE INDEX "idx_qr_migration_key" ON "public"."qr_migration"("key");

-- CreateIndex
CREATE INDEX "idx_qr_migration_status" ON "public"."qr_migration"("status");

-- CreateIndex
CREATE INDEX "idx_qr_migration_user_id" ON "public"."qr_migration"("user_id");

-- CreateIndex
CREATE INDEX "idx_qr_scan_analytics_country" ON "public"."qr_scan_analytics"("country");

-- CreateIndex
CREATE INDEX "idx_qr_scan_analytics_country_device" ON "public"."qr_scan_analytics"("country", "device_type");

-- CreateIndex
CREATE INDEX "idx_qr_scan_analytics_device_type" ON "public"."qr_scan_analytics"("device_type");

-- CreateIndex
CREATE INDEX "idx_qr_scan_analytics_migration_qr_id" ON "public"."qr_scan_analytics"("migration_qr_id");

-- CreateIndex
CREATE INDEX "idx_qr_scan_analytics_qr_code_id" ON "public"."qr_scan_analytics"("qr_code_id");

-- CreateIndex
CREATE INDEX "idx_qr_scan_analytics_qr_code_id_scanned_at" ON "public"."qr_scan_analytics"("qr_code_id", "scanned_at" DESC);

-- CreateIndex
CREATE INDEX "idx_qr_scan_analytics_scan_event_id" ON "public"."qr_scan_analytics"("scan_event_id");

-- CreateIndex
CREATE INDEX "idx_qr_scan_analytics_scanned_at" ON "public"."qr_scan_analytics"("scanned_at");

-- CreateIndex
CREATE INDEX "idx_qr_scan_analytics_utm_source" ON "public"."qr_scan_analytics"("utm_source");

-- CreateIndex
CREATE UNIQUE INDEX "resource_types_name_key" ON "public"."resource_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_resource_type_permission_type_key" ON "public"."role_permissions"("role", "resource_type", "permission_type");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "public"."roles"("name");

-- CreateIndex
CREATE INDEX "idx_scan_events_migration_qr_id" ON "public"."scan_events"("migration_qr_id");

-- CreateIndex
CREATE INDEX "idx_scan_events_qr_code_id" ON "public"."scan_events"("qr_code_id");

-- CreateIndex
CREATE INDEX "idx_scan_events_scanned_at" ON "public"."scan_events"("scanned_at");

-- CreateIndex
CREATE INDEX "idx_scan_events_user_id" ON "public"."scan_events"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "short_urls_short_code_key" ON "public"."short_urls"("short_code");

-- CreateIndex
CREATE INDEX "idx_short_urls_category_id" ON "public"."short_urls"("category_id");

-- CreateIndex
CREATE INDEX "idx_short_urls_is_active" ON "public"."short_urls"("is_active");

-- CreateIndex
CREATE INDEX "idx_short_urls_short_code" ON "public"."short_urls"("short_code");

-- CreateIndex
CREATE INDEX "idx_short_urls_user_id" ON "public"."short_urls"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_category_setting_key_key" ON "public"."system_settings"("category", "setting_key");

-- CreateIndex
CREATE INDEX "idx_url_click_analytics_click_event_id" ON "public"."url_click_analytics"("click_event_id");

-- CreateIndex
CREATE INDEX "idx_url_click_analytics_clicked_at" ON "public"."url_click_analytics"("clicked_at");

-- CreateIndex
CREATE INDEX "idx_url_click_analytics_country" ON "public"."url_click_analytics"("country");

-- CreateIndex
CREATE INDEX "idx_url_click_analytics_device_type" ON "public"."url_click_analytics"("device_type");

-- CreateIndex
CREATE INDEX "idx_url_click_analytics_short_url_id" ON "public"."url_click_analytics"("short_url_id");

-- CreateIndex
CREATE INDEX "idx_user_activity_action" ON "public"."user_activity"("action");

-- CreateIndex
CREATE INDEX "idx_user_activity_action_created" ON "public"."user_activity"("action", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_user_activity_activity_type_id" ON "public"."user_activity"("activity_type_id");

-- CreateIndex
CREATE INDEX "idx_user_activity_created_at" ON "public"."user_activity"("created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_user_activity_ip_address" ON "public"."user_activity"("ip_address");

-- CreateIndex
CREATE INDEX "idx_user_activity_session_id" ON "public"."user_activity"("session_id");

-- CreateIndex
CREATE INDEX "idx_user_activity_status" ON "public"."user_activity"("status");

-- CreateIndex
CREATE INDEX "idx_user_activity_target_type" ON "public"."user_activity"("target_type");

-- CreateIndex
CREATE INDEX "idx_user_activity_user_action" ON "public"."user_activity"("user_id", "action");

-- CreateIndex
CREATE INDEX "idx_user_activity_user_created" ON "public"."user_activity"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_user_activity_user_id" ON "public"."user_activity"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_settings_category" ON "public"."user_settings"("category");

-- CreateIndex
CREATE INDEX "idx_user_settings_key_category" ON "public"."user_settings"("user_id", "category", "setting_key");

-- CreateIndex
CREATE INDEX "idx_user_settings_user_id" ON "public"."user_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_category_key_unique" ON "public"."user_settings"("user_id", "category", "setting_key");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "idx_users_is_active" ON "public"."users"("is_active");

-- AddForeignKey
ALTER TABLE "public"."activity_types" ADD CONSTRAINT "activity_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."activity_types" ADD CONSTRAINT "activity_types_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."click_events" ADD CONSTRAINT "click_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."click_events" ADD CONSTRAINT "click_events_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."click_events" ADD CONSTRAINT "click_events_url_id_fkey" FOREIGN KEY ("url_id") REFERENCES "public"."short_urls"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."click_events" ADD CONSTRAINT "click_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."groups" ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."groups" ADD CONSTRAINT "groups_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."groups" ADD CONSTRAINT "groups_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."menu_items" ADD CONSTRAINT "menu_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."menu_items" ADD CONSTRAINT "menu_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."menu_permissions" ADD CONSTRAINT "menu_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."menu_permissions" ADD CONSTRAINT "menu_permissions_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."menu_permissions" ADD CONSTRAINT "menu_permissions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."menu_role_permissions" ADD CONSTRAINT "fk_menu_role_permissions_role_id" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."menu_role_permissions" ADD CONSTRAINT "menu_role_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."menu_role_permissions" ADD CONSTRAINT "menu_role_permissions_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."menu_role_permissions" ADD CONSTRAINT "menu_role_permissions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notification_recipients" ADD CONSTRAINT "notification_recipients_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notification_recipients" ADD CONSTRAINT "notification_recipients_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notification_recipients" ADD CONSTRAINT "notification_recipients_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notification_recipients" ADD CONSTRAINT "notification_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notification_types" ADD CONSTRAINT "notification_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notification_types" ADD CONSTRAINT "notification_types_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "public"."notification_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_categories" ADD CONSTRAINT "qr_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_categories" ADD CONSTRAINT "qr_categories_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_categories" ADD CONSTRAINT "qr_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_codes" ADD CONSTRAINT "qr_codes_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."qr_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_codes" ADD CONSTRAINT "qr_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_codes" ADD CONSTRAINT "qr_codes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_codes" ADD CONSTRAINT "qr_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_migration" ADD CONSTRAINT "qr_migration_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."qr_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_migration" ADD CONSTRAINT "qr_migration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_scan_analytics" ADD CONSTRAINT "fk_qr_scan_analytics_migration_qr_id" FOREIGN KEY ("migration_qr_id") REFERENCES "public"."qr_migration"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_scan_analytics" ADD CONSTRAINT "qr_scan_analytics_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_scan_analytics" ADD CONSTRAINT "qr_scan_analytics_qr_code_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "public"."qr_codes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_scan_analytics" ADD CONSTRAINT "qr_scan_analytics_scan_event_id_fkey" FOREIGN KEY ("scan_event_id") REFERENCES "public"."scan_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_scan_analytics" ADD CONSTRAINT "qr_scan_analytics_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."qr_scan_analytics" ADD CONSTRAINT "qr_scan_analytics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."role_permissions" ADD CONSTRAINT "role_permissions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."scan_events" ADD CONSTRAINT "fk_scan_events_migration_qr_id" FOREIGN KEY ("migration_qr_id") REFERENCES "public"."qr_migration"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."scan_events" ADD CONSTRAINT "scan_events_new_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."scan_events" ADD CONSTRAINT "scan_events_new_qr_code_id_fkey" FOREIGN KEY ("qr_code_id") REFERENCES "public"."qr_codes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."scan_events" ADD CONSTRAINT "scan_events_new_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."scan_events" ADD CONSTRAINT "scan_events_new_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."short_urls" ADD CONSTRAINT "short_urls_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."url_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."short_urls" ADD CONSTRAINT "short_urls_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."short_urls" ADD CONSTRAINT "short_urls_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."short_urls" ADD CONSTRAINT "short_urls_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."system_settings" ADD CONSTRAINT "system_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."url_categories" ADD CONSTRAINT "url_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."url_categories" ADD CONSTRAINT "url_categories_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."url_categories" ADD CONSTRAINT "url_categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."url_click_analytics" ADD CONSTRAINT "url_click_analytics_click_event_id_fkey" FOREIGN KEY ("click_event_id") REFERENCES "public"."click_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."url_click_analytics" ADD CONSTRAINT "url_click_analytics_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."url_click_analytics" ADD CONSTRAINT "url_click_analytics_short_url_id_fkey" FOREIGN KEY ("short_url_id") REFERENCES "public"."short_urls"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."url_click_analytics" ADD CONSTRAINT "url_click_analytics_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_activity" ADD CONSTRAINT "fk_user_activity_activity_type_id" FOREIGN KEY ("activity_type_id") REFERENCES "public"."activity_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_activity" ADD CONSTRAINT "fk_user_activity_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_activity" ADD CONSTRAINT "user_activity_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_activity" ADD CONSTRAINT "user_activity_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
