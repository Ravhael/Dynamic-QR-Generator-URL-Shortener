import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import getNextAuthToken from '@/lib/getNextAuthToken';
import { prisma } from '@/lib/prisma';
import { invalidateUserSettings } from '@/lib/userSettingsCache';
import { verifyTOTP } from '@/lib/totp';

interface Body { secret?: string; code?: string }

export async function POST(req: NextRequest) {
  const token: any = await getNextAuthToken(req);
  if (!token) return NextResponse.json({ _error: 'Unauthorized' }, { status: 401 });
  const body: Body = await req.json().catch(() => ({}));
  if (!body.secret || !body.code) {
    return NextResponse.json({ _error: 'secret and code required' }, { status: 400 });
  }
  const ok = verifyTOTP(body.secret, body.code.trim());
  if (!ok) return NextResponse.json({ verified: false, _error: 'Invalid code' }, { status: 400 });

  // Persist enable flag in user_settings (enable_two_factor) and store secret as a setting row (category security)
  // upsert user_settings record for user
  await prisma.user_settings.upsert({
    where: { user_id: token.id },
    update: { enable_two_factor: true, updated_at: new Date() },
    create: { user_id: token.id, enable_two_factor: true, created_at: new Date(), updated_at: new Date() }
  });
  // Store secret in system_settings keyed per-user. We keep plaintext for now (needed to verify TOTP) AND store a sha256 hash variant to allow
  // future migration to encrypted-only storage. (Improvement: replace with envelope encryption using a KMS.)
  const cryptoHash = await sha256(body.secret);
  const existing = await prisma.system_settings.findFirst({
    where: { category: 'security', setting_key: `user:${token.id}:twoFactorSecret` }
  });
  if (existing) {
    await prisma.system_settings.update({
      where: { id: existing.id },
      data: { setting_value: body.secret, updated_at: new Date() }
    });
  } else {
    await prisma.system_settings.create({
      data: {
        category: 'security',
        setting_key: `user:${token.id}:twoFactorSecret`,
        setting_value: body.secret,
        data_type: 'string',
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  }
  // Upsert hash variant
  const hashKey = `user:${token.id}:twoFactorSecretHash`;
  const existingHash = await prisma.system_settings.findFirst({ where: { category: 'security', setting_key: hashKey } });
  if (existingHash) {
    await prisma.system_settings.update({ where: { id: existingHash.id }, data: { setting_value: cryptoHash, updated_at: new Date() } });
  } else {
    await prisma.system_settings.create({ data: { category: 'security', setting_key: hashKey, setting_value: cryptoHash, data_type: 'string', created_at: new Date(), updated_at: new Date() } });
  }

  // Invalidate cached user settings so middleware/auth picks up enable_two_factor immediately
  invalidateUserSettings(token.id);

  return NextResponse.json({ verified: true, cacheInvalidated: true, hashed: true });
}

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuf));
  return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
}
