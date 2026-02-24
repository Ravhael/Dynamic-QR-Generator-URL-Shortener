import { Pool, PoolClient } from 'pg';

// Database configuration dari environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'scanlyv11',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20, // Maximum pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

console.log('[DB] Connecting to PostgreSQL:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user
});

// Create connection pool
const pool = new Pool(dbConfig);

// Pool error handling
pool.on('error', (err: Error) => {
  console.error('[DB] Unexpected error on idle client:', err);
  process.exit(-1);
});

// Database client with query helpers
export const db = {
  // Raw pool for advanced usage
  pool,

  // Simple query function
  async query(text: string, params?: any[]) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('[DB] Query executed:', { text, duration, rows: res.rowCount });
    return res;
  },

  // Transaction helper
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  // Get a client from pool for multiple queries
  async getClient() {
    return await pool.connect();
  },

  // Close all connections
  async end() {
    await pool.end();
  }
};

// Test database connection
export async function testConnection() {
  try {
    const result = await db.query('SELECT NOW() as current_time, version()');
    console.log('[DB] ✅ Connection successful:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('[DB] ❌ Connection failed:', error);
    return false;
  }
}

// Database helper functions
export const dbHelpers = {
  // Check if table exists
  async tableExists(tableName: string): Promise<boolean> {
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    return result.rows[0].exists;
  },

  // Get all tables
  async getTables(): Promise<string[]> {
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    return result.rows.map(row => row.table_name);
  },

  // Count rows in table
  async countRows(tableName: string): Promise<number> {
    const result = await db.query(`SELECT COUNT(*) FROM ${tableName}`);
    return parseInt(result.rows[0].count);
  }
};

export default db;