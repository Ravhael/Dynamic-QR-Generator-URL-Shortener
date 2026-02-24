import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import getNextAuthToken from '@/lib/getNextAuthToken';
import { prisma } from '@/lib/prisma';
import { invalidateUserSettings } from '@/lib/userSettingsCache';
import { verifyTOTP } from '@/lib/totp';

interface Body { code?: string }

export async function POST(req: NextRequest) {
  const token: any = await getNextAuthToken(req);
  if (!token) return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
  const body: Body = await req.json().catch(() => ({}));
  if (!body.code) return NextResponse.json({ _error: 'code required' }, { status: 400 });

  // Fetch stored secret
  const secretRow = await prisma.system_settings.findFirst({
    where: { category: 'security', setting_key: `user:${token.id}:twoFactorSecret` }
  });
  if (!secretRow?.setting_value) return NextResponse.json({ _error: '2FA not configured' }, { status: 400 });

  const ok = verifyTOTP(secretRow.setting_value, body.code.trim());
  if (!ok) return NextResponse.json({ _error: 'Invalid code' }, { status: 400 });

  // Disable flag
  await prisma.user_settings.upsert({
    where: { user_id: token.id },
    update: { enable_two_factor: false, updated_at: new Date() },
    create: { user_id: token.id, enable_two_factor: false, created_at: new Date(), updated_at: new Date() }
  });
  // Delete secret row for hygiene
  await prisma.system_settings.deleteMany({
    where: { category: 'security', setting_key: `user:${token.id}:twoFactorSecret` }
  });

  // Invalidate cache so updated flag is reflected immediately
  invalidateUserSettings(token.id);

  return NextResponse.json({ disabled: true, cacheInvalidated: true });
}
