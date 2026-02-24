const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/scanlyv11'
});

async function checkUsersTable() {
  try {
    const { rows } = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('\nUsers table structure:');
    console.table(rows);

  } catch (error) {
    console.error('Error checking users table:', error);
  } finally {
    await pool.end();
  }
}

checkUsersTable();