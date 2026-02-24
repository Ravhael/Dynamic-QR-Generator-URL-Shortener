-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- EnableRLS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin', 'super_admin');

-- CreateTable
CREATE TABLE "users" (
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
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- Insert test user
INSERT INTO "users" (
    "name", 
    "email", 
    "password_hash", 
    "is_active", 
    "role_id"
) VALUES (
    'Test User',
    'test@example.com',
    '$2a$10$k4Yx1MQLYqm6SMQHgTU2yOa5Jh9lZSlr4W3FXJ5PWGzt.ZIGcfZ8q', -- password is 'password123'
    true,
    uuid_generate_v4()
);