import { Pool } from 'pg';

let pool: Pool | null = null;

export function createPool(): Pool {
  if (!pool) {
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'scanlyv11',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: false,
    });
    
    console.log('[DB] Pool created with config:', {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'scanlyv11',
      port: parseInt(process.env.DB_PORT || '5432')
    });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]) {
  const pool = createPool();
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.warn('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (_error) {
    console.error('Database query _error:', _error);
    throw _error;
  }
}

export async function getClient() {
  const pool = createPool();
  return pool.connect();
}

export default pool;
