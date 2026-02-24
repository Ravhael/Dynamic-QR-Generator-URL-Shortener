-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create Users Table first (karena banyak tabel lain yang bergantung pada users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    avatar TEXT,
    is_active BOOLEAN DEFAULT true,
    group_id INTEGER,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert test user
INSERT INTO users (
    name,
    email,
    password_hash,
    role,
    is_active
) VALUES (
    'Test User',
    'test@example.com',
    crypt('password123', gen_salt('bf')),
    'admin',
    true
);