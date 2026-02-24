const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'scanlyv11',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: false,
});

async function checkRoles() {
  try {
    // Query distinct roles from users table
    const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/scanlyv11'
});

async function checkRoles() {
  try {
    console.log('Checking available roles in database...');
    
    const result = await pool.query(`
      SELECT id, name, display_name, description, is_active
      FROM roles
      ORDER BY name;
    `);
    
    console.log('\nFound roles:');
    console.table(result.rows);
    
  } catch (error) {
    console.error('Error checking roles:', error);
  } finally {
    await pool.end();
  }
}

checkRoles();
    console.log('Available roles in database:', result.rows);
  } catch (error) {
    console.error('Error checking roles:', error);
  } finally {
    pool.end();
  }
}

checkRoles();