import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma as shared } from '@/lib/prisma';

// Lightweight dedicated registration endpoint. The existing NextAuth credentials provider
// does NOT currently handle a registration branch (authorize only logs in), so /register
// page calling signIn with isRegistering was yielding 401. This route creates the user.
// Body: { name, email, password }
// Assigns role 'Regular' if exists (case-insensitive) else first role or null.
// Prefer shared singleton but fall back gracefully (defensive in case of edge runtime constraints)
const prisma = shared || new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 409 });
    }

    // Resolve role: prefer non-admin defaults. Explicitly exclude anything that looks like admin.
    const roleCandidates = ['Regular','regular','User','USER','user','viewer','Viewer'];
    let roleRecord = await prisma.roles.findFirst({ where: { name: { in: roleCandidates } } });
    if (!roleRecord) {
      // Fallback: pick the lowest privilege role (first non-admin) if available
      roleRecord = await prisma.roles.findFirst({ where: { NOT: { name: { in: ['Administrator','administrator','Admin','admin'] } } } }) || undefined;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password_hash,
        role_id: roleRecord?.id,
        is_active: true
      },
      include: { roles: true }
    });

    // Log user activity (simple insertion into user_activity with an assumed activity type code 'user_registered')
    try {
      // Resolve activity type id (create lazily if not exists)
      let actType = await prisma.activity_types.findUnique({ where: { code: 'user_registered' } });
      if (!actType) {
        actType = await prisma.activity_types.create({ data: { code: 'user_registered', name: 'User Registered', category: 'auth' } });
      }
      await prisma.user_activity.create({
        data: {
          user_id: user.id,
          activity_type_id: actType.id,
          action: 'register',
          target_type: 'user',
          target_id: user.id,
          target_name: user.name,
          description: 'User account created',
          status: 'completed'
        }
      });
    } catch (e) {
      console.warn('[REGISTER API] Activity log failed', e);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roles?.name || null
      }
    });
  } catch (e:any) {
    console.error('[REGISTER API] Error:', e);
    return NextResponse.json({ success: false, message: 'Registration failed', error: e.message }, { status: 500 });
  }
}
