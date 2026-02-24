import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST() {
  // Deprecated: use unified /api/admin/password/reset endpoint.
  const email = 'admin@scanly.indovisual.co.id'
  try {
    const user = await prisma.users.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Admin user not found', deprecated: true }, { status: 404 })
    const newHash = await bcrypt.hash('admin123', 10)
    await prisma.users.update({ where: { email }, data: { password_hash: newHash, updated_at: new Date() } })
    return NextResponse.json({ success: true, deprecated: true, message: 'Password updated to admin123 (deprecated endpoint).' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed', details: error.message, deprecated: true }, { status: 500 })
  }
}