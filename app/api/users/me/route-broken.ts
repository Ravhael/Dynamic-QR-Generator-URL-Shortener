import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { getAuthenticatedUserId } from '@/lib/auth'

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

export async function GET(request: NextRequest) {
  try {
    console.warn('[USER PROFILE API] GET request received')
    
    // GET DYNAMIC USER ID FROM AUTHENTICATION - NO MORE HARDCODE!
    const userId = await getAuthenticatedUserId(request);
    
    if (!userId) {
      console.warn('[USER PROFILE API] ❌ No authenticated user found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.log('[USER PROFILE API] ✅ User authenticated:', userId);
    
    const client = await pool.connect()
    
    try {
      // Get user profile from database with group information
      const userResult = await client.query(`
        SELECT 
          u.id,
          u.email,
          u.name as full_name,
          u.avatar,
          u.role,
          u.created_at,
          u.updated_at,
          u.group_id,
          g.name as group_name,
          r.display_name as role_display_name
        FROM users u
        LEFT JOIN groups g ON u.group_id = g.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
      `, [userId])

      if (userResult.rows.length === 0) {
        console.warn('[USER PROFILE API] User not found')
        return NextResponse.json(
          { _error: 'User not found' },
          { status: 404 }
        )
      }

      const user = userResult.rows[0]
      
      console.warn('[USER PROFILE API] Returning user profile:', user.email)
      
      return NextResponse.json({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        avatar: user.avatar,
        role: user.role,
        role_display_name: user.role_display_name,
        group_id: user.group_id,
        group_name: user.group_name,
        created_at: user.created_at,
        updated_at: user.updated_at
      })
      
    } finally {
      client.release()
    }
    
  } catch (_error) {
    console.error('[USER PROFILE API] Error:', _error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.warn('[USER PROFILE API] PUT request received')
    
    // GET DYNAMIC USER ID FROM AUTHENTICATION - NO MORE HARDCODE!
    const userId = await getAuthenticatedUserId(request);
    
    if (!userId) {
      console.warn('[USER PROFILE API] ❌ No authenticated user found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.log('[USER PROFILE API] ✅ User authenticated:', userId);
    
    const client = await pool.connect()
    const body = await request.json()
    
    console.warn('[USER PROFILE API] Update request body:', body)
    
    try {
      // Update user profile in users table
      const updateResult = await client.query(`
        UPDATE users 
        SET 
          name = $1,
          avatar = $2,
          group_id = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING id, email, name as full_name, avatar, role, created_at, updated_at
      `, [body.full_name, body.avatar, body.group_id, userId])

      if (updateResult.rows.length === 0) {
        console.warn('[USER PROFILE API] User not found for update')
        return NextResponse.json(
          { _error: 'User not found' },
          { status: 404 }
        )
      }

      // Get updated user with group information
      const finalUserResult = await client.query(`
        SELECT 
          u.id,
          u.email,
          u.name as full_name,
          u.avatar,
          u.role,
          u.created_at,
          u.updated_at,
          u.group_id,
          g.name as group_name,
          r.display_name as role_display_name
        FROM users u
        LEFT JOIN groups g ON u.group_id = g.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
      `, [userId])

      const updatedUser = finalUserResult.rows[0]
      
      console.warn('[USER PROFILE API] Updated user profile:', updatedUser.email)
      
      return NextResponse.json({
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        role_display_name: updatedUser.role_display_name,
        group_id: updatedUser.group_id,
        group_name: updatedUser.group_name,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      })
      
    } finally {
      client.release()
    }
    
  } catch (_error) {
    console.error('[USER PROFILE API] Update error:', _error)
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    )
  }
}
