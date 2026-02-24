import { NextResponse } from 'next/server'

export async function POST() {
  console.warn('[LOGOUT API] Clearing authentication cookie')
  
  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully' },
    { status: 200 }
  )

  // Clear the scanly_auth cookie (primary auth cookie)
  response.cookies.set('scanly_auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0) // Expire immediately
  })

  // Also clear token cookie for backward compatibility
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0) // Expire immediately
  })

  console.warn('[LOGOUT API] scanly_auth and token cookies cleared')
  return response
}

export async function GET() {
  return POST() // Allow GET requests for simplicity
}
