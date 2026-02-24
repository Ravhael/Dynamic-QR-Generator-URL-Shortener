import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    console.warn('[LOGIN API] Real database login for:', email)
    
    // Find user by email (case-insensitive)
  const user = await prisma.users.findUnique({ where: { email }, include: { roles: true } })
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check password with bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT token
  const roleName = (user as any).roles?.name
    const token = jwt.sign({ userId: user.id, email: user.email, role: roleName }, JWT_SECRET, { expiresIn: '7d' })

    // Update last login
    await prisma.users.update({ where: { id: user.id }, data: { last_login: new Date(), updated_at: new Date() } })

    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleName
      },
      token
    })
    
    // Set cookie
    response.cookies.set('scanly_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })
    
    return response

  } catch (error) {
    console.error('[LOGIN API] Error:', error)
    return NextResponse.json(
      { error: 'Login failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
