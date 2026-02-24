const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/scanlyv11'
});

async function checkUserActivityTable() {
  try {
    console.log('\nChecking user_activity table structure...');
    
    const { rows } = await pool.query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        column_default,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'user_activity'
      ORDER BY ordinal_position;
    `);

    console.log('\nuser_activity table columns:');
    console.table(rows);

    // Check if table has any data
    const countResult = await pool.query('SELECT COUNT(*) FROM user_activity');
    console.log(`\nTotal records in user_activity: ${countResult.rows[0].count}`);

  } catch (error) {
    console.error('Error checking user_activity table:', error);
  } finally {
    await pool.end();
  }
}

checkUserActivityTable();