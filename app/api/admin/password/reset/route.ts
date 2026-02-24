import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

/*
  Unified Admin Password Reset Endpoint
  POST: { email?: string, newPassword: string }
  GET : ?email=... -> fetch admin user (sanitized)
  - Uses prisma.users.update / findUnique
  - Standardizes on password_hash column
  - Deprecated legacy routes: /reset-admin-password, /force-update-password, /fix-admin-password
*/

const DEFAULT_ADMIN_EMAIL = 'admin@scanly.indovisual.co.id'

function sanitizeUser(u: any) {
  if (!u) return null
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.roles?.name || 'user',
    lastLogin: u.last_login || null,
    createdAt: u.created_at,
    updatedAt: u.updated_at
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email') || DEFAULT_ADMIN_EMAIL

    const user = await prisma.users.findUnique({
      where: { email },
      include: { roles: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found', email }, { status: 404 })
    }

    return NextResponse.json({
      user: sanitizeUser(user),
      message: 'User fetched. POST with { newPassword } to reset.'
    })
  } catch (error) {
    console.error('[ADMIN PASSWORD][GET] error', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { newPassword, email = DEFAULT_ADMIN_EMAIL } = body || {}

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json({ error: 'newPassword must be at least 6 chars' }, { status: 400 })
    }

    const user = await prisma.users.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'User not found', email }, { status: 404 })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    const updated = await prisma.users.update({
      where: { email },
      data: { password_hash: hashed, updated_at: new Date() },
      include: { roles: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin password updated',
      user: sanitizeUser(updated)
    })
  } catch (error: any) {
    console.error('[ADMIN PASSWORD][POST] error', error)
    return NextResponse.json({ error: 'Failed to update password', details: error.message }, { status: 500 })
  }
}
