-- Test update trigger
UPDATE auth.users 
SET raw_user_meta_data = '{"name": "Test User Updated"}'
WHERE email = 'testuser@example.com';
