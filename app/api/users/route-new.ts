import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:your_super_secret_and_long_postgres_password@localhost:5532/postgres',
  ssl: false
});

console.warn("[USERS API] Pool created successfully");

export async function GET() {
  try {
    console.warn('[USERS API] Fetching users from database');
    
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.is_active,
        u.group_id,
        g.name as group_name,
        u.created_at,
        u.last_login,
        u.updated_at
      FROM users u
      LEFT JOIN groups g ON u.group_id = g.id
      ORDER BY u.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    console.warn(`[USERS API] Found ${result.rows.length} users`);
    
    // Transform data to match frontend interface
    const users = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      isActive: row.is_active,
      groupId: row.group_id?.toString(),
      groupName: row.group_name,
      created_at: row.created_at,
      last_login: row.last_login
    }));
    
    return NextResponse.json({
      users: users,
      total: users.length,
      message: 'Users retrieved successfully'
    });
  } catch (err) {
    console.error('[USERS API] Error:', err);
    return NextResponse.json(
      { _error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
