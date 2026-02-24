-- Test trigger sinkronisasi
INSERT INTO auth.users (
  id, 
  email, 
  encrypted_password, 
  email_confirmed_at,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'testuser@example.com',
  crypt('testpassword123', gen_salt('bf')),
  NOW(),
  '{"name": "Test User"}',
  false,
  NOW(),
  NOW()
);
