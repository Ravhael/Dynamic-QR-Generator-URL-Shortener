import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.warn('[USER PROFILE API] GET request received')
    
    // GET DYNAMIC USER ID FROM AUTHENTICATION - NO MORE HARDCODE!
    const userId = await getAuthenticatedUserId(request);
    
    if (!userId) {
      console.warn('[USER PROFILE API] ❌ No authenticated user found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.log('[USER PROFILE API] ✅ User authenticated:', userId);
    
    // Fetch with Prisma (include role & group)
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        groups_users_group_idTogroups: true
      }
    })

    if (!user) {
      console.warn('[USER PROFILE API] User not found')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.warn('[USER PROFILE API] User profile found:', user.email)
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.name,
      avatar: user.avatar,
      role: user.roles?.name || 'user',
      group_id: user.group_id,
      group_name: user.groups_users_group_idTogroups?.name,
      created_at: user.created_at,
      updated_at: user.updated_at
    })

  } catch (error) {
    console.error('[USER PROFILE API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.warn('[USER PROFILE API] PUT request received')
    
    // GET DYNAMIC USER ID FROM AUTHENTICATION - NO MORE HARDCODE!
    const userId = await getAuthenticatedUserId(request);
    
    if (!userId) {
      console.warn('[USER PROFILE API] ❌ No authenticated user found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    console.log('[USER PROFILE API] ✅ User authenticated:', userId);
    
    const body = await request.json()
    console.warn('[USER PROFILE API] Raw update request body:', body)

    // Basic shape validation
    if (body.full_name !== undefined && typeof body.full_name !== 'string') {
      return NextResponse.json({ error: 'full_name must be a string' }, { status: 400 })
    }
    if (body.group_id !== undefined && body.group_id !== null && isNaN(Number(body.group_id))) {
      return NextResponse.json({ error: 'group_id must be numeric or null' }, { status: 400 })
    }

    // Prevent non-admin users from editing profile (policy: only administrators can update profiles)
    const requestingUser = await prisma.users.findUnique({ where: { id: userId }, include: { roles: true } });
    const roleName = String(requestingUser?.roles?.name || '').toLowerCase();
    const isAdminRole = ['admin', 'administrator', 'superadmin'].includes(roleName);
    if (!isAdminRole) {
      console.warn('[USER PROFILE API] Denying PUT - requester not admin:', userId, roleName);
      return NextResponse.json({ error: 'Forbidden: only administrators may update profiles' }, { status: 403 });
    }

    // Build update payload only with provided fields
    const data: any = { updated_at: new Date() }
    if (body.full_name !== undefined) data.name = body.full_name

    if (body.group_id === '' || body.group_id === null) {
      data.group_id = null
    } else if (body.group_id !== undefined) {
      const parsed = Number(body.group_id)
      data.group_id = Number.isNaN(parsed) ? null : parsed
    }

    console.warn('[USER PROFILE API] Normalized update payload:', data)

    try {
      await prisma.users.update({ where: { id: userId }, data })
    } catch (e: any) {
      // Prisma specific error logging
      console.error('[USER PROFILE API] Prisma update error:', e?.code, e?.message, e?.meta)
      return NextResponse.json({ error: 'Failed to update user profile (db error)' }, { status: 500 })
    }

    // Re-fetch with relations
    const updatedUser = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        groups_users_group_idTogroups: true
      }
    })

    if (!updatedUser) {
      console.warn('[USER PROFILE API] User not found after update (race condition)')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.warn('[USER PROFILE API] Updated user profile:', updatedUser.email)
    
    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      full_name: updatedUser.name,
      avatar: updatedUser.avatar,
      role: updatedUser.roles?.name || 'user',
      group_id: updatedUser.group_id,
      group_name: updatedUser.groups_users_group_idTogroups?.name,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at
    })

  } catch (error) {
    console.error('[USER PROFILE API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    )
  }
}