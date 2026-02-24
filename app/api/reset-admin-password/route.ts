import { NextRequest, NextResponse } from 'next/server'
// DEPRECATED: Use /api/admin/password/reset instead. This legacy endpoint retained temporarily.
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  // Provide backward-compatible behavior using Prisma and point to new route.
  try {
    const { newPassword } = await request.json()
    const email = 'admin@scanly.indovisual.co.id'
    const user = await prisma.users.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Admin user not found', deprecated: true }, { status: 404 })
    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.users.update({ where: { email }, data: { password_hash: hashed, updated_at: new Date() } })
    return NextResponse.json({ success: true, message: 'Password updated (deprecated endpoint). Use /api/admin/password/reset', deprecated: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed', details: error.message, deprecated: true }, { status: 500 })
  }
}

export async function GET() {
  try {
    const email = 'admin@scanly.indovisual.co.id'
    const user = await prisma.users.findUnique({ where: { email }, include: { roles: true } })
    if (!user) return NextResponse.json({ error: 'Admin user not found', deprecated: true })
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.roles?.name || 'user' },
      message: 'Deprecated endpoint. Use /api/admin/password/reset',
      deprecated: true
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed', details: error.message, deprecated: true }, { status: 500 })
  }
}