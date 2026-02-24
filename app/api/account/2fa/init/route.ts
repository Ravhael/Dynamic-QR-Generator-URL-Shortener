import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import getNextAuthToken from '@/lib/getNextAuthToken';
import { generateSecret, buildOtpAuthURL } from '@/lib/totp';

// We return a secret but DO NOT persist yet until verified.
// Client must hold this temporarily then call /verify with the code.
export async function POST(req: NextRequest) {
  const token: any = await getNextAuthToken(req);
  if (!token) return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
  if (token.two_factor_enabled) {
    return NextResponse.json({ alreadyEnabled: true });
  }
  const secret = generateSecret();
  const otpauth = buildOtpAuthURL(secret, token.email || 'user');
  return NextResponse.json({ secret, otpauth });
}
