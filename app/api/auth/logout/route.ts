import { NextResponse } from 'next/server';

// Consolidated logout route: clears NextAuth cookies + legacy custom auth cookies.
// Provides both POST (preferred) and GET (manual test) methods.
export async function POST() {
  try {
    const res = NextResponse.json({ success: true, message: 'Logged out successfully' });

    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.callback-url',
      'next-auth.csrf-token',
      'next-auth.state',
      // legacy / custom tokens observed in codebase
      'scanly_auth',
      'token'
    ];

    for (const name of cookieNames) {
      res.cookies.set({
        name,
        value: '',
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        expires: new Date(0)
      });
    }

    return res;
  } catch (err) {
    console.error('[LOGOUT API] Error clearing cookies', err);
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 });
  }
}

export async function GET() { return POST(); }