// API Route untuk signup/register user baru
import { NextRequest, NextResponse } from 'next/server'
import { query as dbQuery } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()
    
    console.warn('[SIGNUP API] Creating user:', email)
    
    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await dbQuery(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user in database
    const result = await dbQuery(`
      INSERT INTO users (
        id, name, email, password_hash, role, is_active, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, 'viewer', true, NOW(), NOW()
      ) RETURNING id, name, email, role, created_at
    `, [name, email, hashedPassword])

    const newUser = result.rows[0]

    console.warn('[SIGNUP API] ✅ User created successfully:', newUser.id)

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.created_at
      }
    })

  } catch (error: any) {
    console.error('[SIGNUP API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
