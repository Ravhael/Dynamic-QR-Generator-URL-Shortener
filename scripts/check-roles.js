import { query } from '@/lib/db';

async function checkRoles() {
  try {
    // Query distinct roles from users table
    const result = await query('SELECT DISTINCT role FROM users ORDER BY role');
    console.log('Available roles in database:', result.rows);
  } catch (error) {
    console.error('Error checking roles:', error);
  }
}

checkRoles();