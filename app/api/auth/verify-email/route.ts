import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Verifies email given token & email. If valid & not expired, sets users.email_verified = now and deletes token.
export async function POST(req: NextRequest) {
  try {
    const { token, email } = await req.json();
    if (!token || !email) {
      return NextResponse.json({ success: false, message: 'token & email required' }, { status: 400 });
    }

    const rec = await prisma.verificationToken.findFirst({ where: { identifier: email, token } });
    if (!rec) {
      return NextResponse.json({ success: false, message: 'Invalid token' }, { status: 400 });
    }
    if (rec.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { identifier_token: { identifier: rec.identifier, token: rec.token } } }).catch(()=>{});
      return NextResponse.json({ success: false, message: 'Token expired' }, { status: 400 });
    }

    await prisma.users.update({ where: { email }, data: { email_verified: new Date() } });
    await prisma.verificationToken.delete({ where: { identifier_token: { identifier: rec.identifier, token: rec.token } } }).catch(()=>{});

    // Log activity
    try {
      let actType = await prisma.activity_types.findUnique({ where: { code: 'email_verified' } });
      if (!actType) {
        actType = await prisma.activity_types.create({ data: { code: 'email_verified', name: 'Email Verified', category: 'auth' } });
      }
      const user = await prisma.users.findUnique({ where: { email }, select: { id: true, name: true } });
      if (user) {
        await prisma.user_activity.create({
          data: {
            user_id: user.id,
            activity_type_id: actType.id,
            action: 'verify_email',
            target_type: 'user',
            target_id: user.id,
            target_name: user.name,
            description: 'User verified email address',
            status: 'completed'
          }
        });
      }
    } catch (e) {
      console.warn('[VERIFY EMAIL] activity log failed', e);
    }

    return NextResponse.json({ success: true, message: 'Email verified' });
  } catch (e:any) {
    console.error('[VERIFY EMAIL] Error', e);
    return NextResponse.json({ success: false, message: 'Verification failed', error: e.message }, { status: 500 });
  }
}
