const bcrypt = require('bcryptjs');

// Data user admin
const adminUser = {
  email: 'admin@scanly.indovisual.co.id',
  password: 'password123',
  name: 'Administrator',
  role: 'admin'
};

// Generate password hash
const saltRounds = 12;
const passwordHash = bcrypt.hashSync(adminUser.password, saltRounds);

console.warn('=================================');
console.warn('ADMIN USER CREATION QUERIES');
console.warn('=================================');
console.warn('');

// Generate UUID untuk admin user
const adminId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

console.warn('1. SQL Query untuk insert admin user:');
console.warn('');
console.warn(`-- Insert admin user ke tabel users
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
  '${adminId}',
  '${adminUser.name}',
  '${adminUser.email}',
  '${passwordHash}',
  '${adminUser.role}',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  updated_at = NOW();`);

console.warn('');
console.warn('2. Query untuk verifikasi user sudah dibuat:');
console.warn('');
console.warn(`SELECT id, name, email, role, is_active, created_at FROM users WHERE email = '${adminUser.email}';`);

console.warn('');
console.warn('3. Query untuk test login (jangan jalankan di production):');
console.warn('');
console.warn(`SELECT 
  id, name, email, role, is_active,
  (password_hash = crypt('${adminUser.password}', password_hash)) as password_match
FROM users 
WHERE email = '${adminUser.email}';`);

console.warn('');
console.warn('=================================');
console.warn('LOGIN CREDENTIALS:');
console.warn('=================================');
console.warn(`Email: ${adminUser.email}`);
console.warn(`Password: ${adminUser.password}`);
console.warn(`Role: ${adminUser.role}`);
console.warn('=================================');
