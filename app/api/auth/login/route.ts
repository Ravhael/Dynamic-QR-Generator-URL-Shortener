// API Route untuk login
import { NextRequest, NextResponse } from 'next/server'
import { authService } from '@/app/api/authService'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.warn('[LOGIN API] Login attempt for:', email)
    
    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Attempt login
    const result = await authService.login({ email, password })

    console.warn('[LOGIN API] ✅ Login successful for:', email)

    // Create response with token in cookie
    const response = NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
      token: result.token  // Add token to response body
    })

    // Set HTTP-only scanly_auth cookie (the one used by middleware)
    response.cookies.set('scanly_auth', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    // Also set token cookie for backward compatibility
    response.cookies.set('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    // Also set auth_token cookie (matches frontend localStorage naming)
    response.cookies.set('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    console.warn('[LOGIN API] ✅ All auth cookies set (scanly_auth, token, auth_token)')
    return response

  } catch (error: any) {
    console.error('[LOGIN API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 401 }
    )
  }
}