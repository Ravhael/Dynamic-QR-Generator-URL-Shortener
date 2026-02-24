const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/scanlyv11'
});

async function createUserActivityTable() {
  try {
    console.log('Creating user_activity table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_activity (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        activity_type VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(255),
        description TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        status VARCHAR(20) DEFAULT 'success',
        metadata JSONB,
        session_id VARCHAR(100),
        duration_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indices after table is created
      CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(activity_type);
      CREATE INDEX IF NOT EXISTS idx_user_activity_action ON user_activity(action);
      CREATE INDEX IF NOT EXISTS idx_user_activity_status ON user_activity(status);
    `);

    // Create activity types if needed
    console.log('Creating activity types...');
    await pool.query(`
      INSERT INTO user_activity (
        user_id, 
        activity_type, 
        action, 
        target_type, 
        description, 
        status
      ) VALUES
      (
        '00000000-0000-0000-0000-000000000000',
        'system',
        'initialize',
        'database',
        'System initialization',
        'success'
      )
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('✅ user_activity table created successfully!');
    
  } catch (error) {
    console.error('Error creating user_activity table:', error);
  } finally {
    await pool.end();
  }
}

createUserActivityTable();