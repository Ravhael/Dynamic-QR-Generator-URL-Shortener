import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export async function getNextAuthToken(request: NextRequest) {
  try {
    // Explicitly pass the configured NEXTAUTH_SECRET so token decryption is always consistent across calls
    if (!process.env.NEXTAUTH_SECRET) {
      console.warn('[NEXTAUTH_SECRET_MISSING] NEXTAUTH_SECRET not set in environment - tokens may be invalid or insecure.');
    }
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET })
    return token || null
  } catch (err: any) {
    // Many NextAuth/JWT decryption issues are due to mismatched NEXTAUTH_SECRET between deployments
    // or an environment where NEXTAUTH_SECRET wasn't set. Log helpful hints when this occurs.
    const msg = err?.message || String(err);
    console.error('[getNextAuthToken] Failed to parse token or decrypt session: ', msg)
    if (msg && msg.toLowerCase().includes('decryption')) {
      console.warn('[NEXTAUTH_DECRYPTION_ERROR] Token decryption failed. Verify NEXTAUTH_SECRET environment variable is configured correctly and identical across all deployed instances. If you recently rotated the secret, existing sessions will be invalid and users must reauthenticate.')
    }
    return null
  }
}

export default getNextAuthToken
