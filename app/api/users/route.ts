import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { validatePassword } from '@/lib/passwordPolicy';
import { getEffectiveUserSettings } from '@/lib/userSettingsCache';

console.warn("[USERS API] Using shared database connection");

export async function GET() {
  try {
    console.warn('[USERS API] Fetching users via Prisma');
    const usersData = await prisma.users.findMany({
      include: {
        roles: true,
        groups_users_group_idTogroups: true
      },
      orderBy: { created_at: 'desc' }
    });

    const users = usersData.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.roles?.name,
      isActive: u.is_active,
      groupId: u.group_id?.toString(),
      groupName: u.groups_users_group_idTogroups?.name,
      created_at: u.created_at,
      last_login: u.last_login
    }));

    return NextResponse.json({ users, total: users.length, message: 'Users retrieved successfully' });
  } catch (error) {
    console.error('[USERS API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.warn('[USERS API] Creating new user via Prisma');
    const body = await request.json();
  const { name, email, password, role, groupId, roleId } = body;
    console.warn('[USERS API] Incoming payload:', { name, email, role, roleId, groupId });

    // --- Role normalization & synonym mapping ---
    const ROLE_SYNONYMS: Record<string, string> = {
      viewer: 'user',
      regular: 'user',
      regularuser: 'user',
      administrator: 'admin'
    };

    const rawRole = (role ?? 'user').toString().trim();
    const inputLower = rawRole.toLowerCase();
    const normalized = ROLE_SYNONYMS[inputLower] ?? inputLower; // expected canonical name

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    // Determine password_strength policy for the creating admin (if auth context later) or fallback to default 'medium'
    // Since this route currently lacks auth user context, we fallback to system default medium.
    // Future: derive from requesting user id.
    const policyLevel = 'medium';
    const pwCheck = validatePassword(password, policyLevel as any);
    if (!pwCheck.valid) {
      return NextResponse.json({ error: 'Password does not meet policy', policy: policyLevel, details: pwCheck.errors }, { status: 400 });
    }

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    // If roleId explicitly provided, prefer it (safer & unambiguous)
  // IDs are UUID strings in schema
  let roleRecord = null as null | { id: string; name: string };
    if (roleId) {
  roleRecord = await prisma.roles.findUnique({ where: { id: roleId as string }, select: { id: true, name: true } });
      if (!roleRecord) {
        console.warn(`[USERS API] Provided roleId ${roleId} not found, falling back to name normalization`);
      } else {
        console.warn('[USERS API] Using role resolved by roleId:', roleRecord);
      }
    }

    // Case-insensitive direct lookup of normalized role if roleId path not used or failed
    if (!roleRecord) {
  roleRecord = await prisma.roles.findFirst({ where: { name: { equals: normalized, mode: 'insensitive' } }, select: { id: true, name: true } });
    }

    if (!roleRecord) {
      // Fallback: fetch all roles and attempt synonym resolution against available names
    const allRoles = await prisma.roles.findMany({ select: { id: true, name: true } });
      const availableLower = allRoles.map(r => r.name.toLowerCase());
      const fallbackOrder = [normalized, inputLower, 'admin', 'administrator', 'user'];
      for (const candidate of fallbackOrder) {
        const idx = availableLower.indexOf(candidate);
        if (idx !== -1) {
          roleRecord = allRoles[idx];
          break;
        }
      }
      if (!roleRecord) {
        return NextResponse.json({ error: `Role '${rawRole}' not found`, availableRoles: availableLower }, { status: 400 });
      }
    }

  const hashedPassword = await bcrypt.hash(password, 10);

    const created = await prisma.users.create({
      data: {
        name,
        email,
        password_hash: hashedPassword,
  role_id: roleRecord.id,
        is_active: true,
        group_id: groupId || null,
        created_at: new Date(),
        updated_at: new Date()
      },
  include: { roles: true }
    });

    return NextResponse.json({
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.roles?.name,
        isActive: created.is_active,
        groupId: created.group_id,
        created_at: created.created_at
      },
      message: 'User created successfully'
    });
  } catch (error: any) {
    console.error('[USERS API] Create error:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
