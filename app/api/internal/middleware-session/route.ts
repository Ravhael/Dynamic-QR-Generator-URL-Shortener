import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import getNextAuthToken from '@/lib/getNextAuthToken'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const token = await getNextAuthToken(request)
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({ authenticated: true, token }, { status: 200 })
  } catch (error: unknown) {
    console.error('[MW_SESSION_PROXY_ERROR]', error)
    return NextResponse.json({ authenticated: false, error: 'Failed to read session token' }, { status: 500 })
  }
}
