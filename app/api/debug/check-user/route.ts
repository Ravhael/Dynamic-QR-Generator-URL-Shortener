import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const email = 'admin@scanly.indovisual.co.id'
    const user = await prisma.users.findUnique({ where: { email }, include: { roles: true } })
    if (!user) return NextResponse.json({ error: 'Admin user not found' })

    // Optional password test only if env allows
    let testResult: boolean | undefined
    if (process.env.ALLOW_PASSWORD_DEBUG === 'true') {
      // Compare against default candidate (admin123) for diagnostic
      testResult = await bcrypt.compare('admin123', user.password_hash)
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.roles?.name || 'user',
        hasPassword: !!user.password_hash
      },
      testAdmin123: testResult,
      passwordCheckEnabled: process.env.ALLOW_PASSWORD_DEBUG === 'true'
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to check user', details: error.message }, { status: 500 })
  }
}