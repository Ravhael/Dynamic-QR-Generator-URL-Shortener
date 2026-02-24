-- Script SQL untuk membuat admin user
-- Jalankan script ini di PostgreSQL database

-- 1. Insert admin user ke tabel users
INSERT INTO users (
  id,
  name,
  email,
  password_hash,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Administrator',
  'admin@scanly.indovisual.co.id',
  '$2b$12$GWTBA2xpsg.1J.EnzC6nUeMhL78qrjxjLv/bFePis.UtEkHU3F/lS',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  updated_at = NOW();

-- 2. Verifikasi user sudah dibuat
SELECT id, name, email, role, is_active, created_at 
FROM users 
WHERE email = 'admin@scanly.indovisual.co.id';
