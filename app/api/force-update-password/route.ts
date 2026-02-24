import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  // Deprecated emergency endpoint. Use /api/admin/password/reset instead.
  const email = 'admin@scanly.indovisual.co.id'
  try {
    const user = await prisma.users.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Admin user not found', deprecated: true }, { status: 404 })
    return NextResponse.json({
      deprecated: true,
      message: 'Use /api/admin/password/reset with POST { newPassword }'
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed', details: error.message, deprecated: true }, { status: 500 })
  }
}