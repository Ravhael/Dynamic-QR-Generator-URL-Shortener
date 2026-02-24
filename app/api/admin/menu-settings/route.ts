import { NextRequest, NextResponse } from 'next/server';
import { getToken } from "next-auth/jwt";
import getNextAuthToken from '@/lib/getNextAuthToken';
import { PrismaClient } from '@prisma/client';
import { invalidateMenuCache, getFullMenuTree, getPermissionMatrix } from '@/lib/menuTree';
import { isAdministrator } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = await getNextAuthToken(request as any);
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    if (!await isAdministrator(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const url = new URL(request.url);
  let roleParam = url.searchParams.get('role'); // optional focus on a single role
  if (roleParam) {
    const roleExact = await prisma.roles.findUnique({ where: { name: roleParam } });
    if (!roleExact) {
      const roleCi = await prisma.roles.findFirst({ where: { name: { equals: roleParam, mode: 'insensitive' } } });
      if (roleCi) roleParam = roleCi.name;
    }
  }
  const seedParam = url.searchParams.get('seed'); // if provided, force seeding matrix

    const menuTree = await getFullMenuTree(false);

    let permissions; 
    if (roleParam) {
      const matrix = await getPermissionMatrix(roleParam);
      permissions = matrix.map(p => ({ ...p, role: roleParam }));
    } else {
      // aggregate all permissions grouped by role
      const raw = await prisma.menu_role_permissions.findMany({ include: { roles: true, menu_items: true } });
      permissions = raw.map(p => ({
        role: p.roles.name,
        menu_item_id: p.menu_item_id,
        menu_id: p.menu_items.menu_id,
        name: p.menu_items.name,
        path: p.menu_items.path,
        can_view: p.can_view,
        can_create: p.can_create,
        can_edit: p.can_edit,
        can_delete: p.can_delete,
        can_export: p.can_export,
        is_active: p.is_active,
        is_accessible: (p as any).is_accessible ?? p.can_view,
        has_permission: (p as any).has_permission ?? p.can_view
      }));
    }

    // Auto-seed missing permission rows (matrix) for existing roles & menu_items
    // Only when no permissions exist or seed=1 provided
    if ((!permissions.length || seedParam === '1') && !roleParam) {
      const roles = await prisma.roles.findMany();
      const items = await prisma.menu_items.findMany({ where: { is_active: true }, select: { id: true } });
      const existing = await prisma.menu_role_permissions.findMany({ select: { role_name: true, menu_item_id: true } });
      const existingSet = new Set(existing.map(e => `${e.role_name}-${e.menu_item_id}`));
      const createData: any[] = [];
      for (const r of roles) {
        for (const it of items) {
          const key = `${r.name}-${it.id}`;
          if (!existingSet.has(key)) {
            createData.push({
              role_id: r.id,
              role_name: r.name,
              menu_item_id: it.id,
              can_view: false,
              can_create: false,
              can_edit: false,
              can_delete: false,
              can_export: false,
              is_active: false,
              is_accessible: false,
              has_permission: false
            });
          }
        }
      }
      if (createData.length) {
        await prisma.menu_role_permissions.createMany({ data: createData });
        invalidateMenuCache();
        // Recompute permissions after seeding
        const raw = await prisma.menu_role_permissions.findMany({ include: { roles: true, menu_items: true } });
        permissions = raw.map(p => ({
          role: p.roles.name,
          menu_item_id: p.menu_item_id,
          menu_id: p.menu_items.menu_id,
          name: p.menu_items.name,
          path: p.menu_items.path,
          can_view: p.can_view,
          can_create: p.can_create,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
          can_export: p.can_export,
          is_active: p.is_active,
          is_accessible: (p as any).is_accessible ?? p.can_view,
          has_permission: (p as any).has_permission ?? p.can_view
        }));
      }
    }

    // If Administrator role exists but has zero active/view permissions, auto-enable all (business rule: admin sees everything by default)
    if (!roleParam) {
      const adminRows = permissions.filter((p: any) => p.role?.toLowerCase() === 'administrator');
      if (adminRows.length) {
        const anyEnabled = adminRows.some((p: any) => p.can_view || p.is_active || p.can_create || p.can_edit || p.can_delete || p.can_export);
        if (!anyEnabled) {
          // Enable all admin permissions in one transaction
          await prisma.$transaction([
            prisma.menu_role_permissions.updateMany({
              where: { role_name: 'Administrator' },
              data: {
                can_view: true,
                can_create: true,
                can_edit: true,
                can_delete: true,
                can_export: true,
                is_active: true
              }
            })
          ]);
          invalidateMenuCache('Administrator');
          // Refresh permissions after enabling
            const refreshed = await prisma.menu_role_permissions.findMany({ include: { roles: true, menu_items: true } });
            permissions = refreshed.map(p => ({
              role: p.roles.name,
              menu_item_id: p.menu_item_id,
              menu_id: p.menu_items.menu_id,
              name: p.menu_items.name,
              path: p.menu_items.path,
              can_view: p.can_view,
              can_create: p.can_create,
              can_edit: p.can_edit,
              can_delete: p.can_delete,
              can_export: p.can_export,
              is_active: p.is_active,
              is_accessible: (p as any).is_accessible ?? p.can_view,
              has_permission: (p as any).has_permission ?? p.can_view
            }));
        }
      }
    }

    return NextResponse.json({
      success: true,
      role: roleParam || null,
      menu_tree: menuTree,
      permissions,
      counts: {
        menu_items: menuTree.length,
        permission_records: permissions.length
      },
      message: 'Menu structure & permissions retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching menu permissions:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch menu permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Auth check
    const token = await getNextAuthToken(request as any);
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const isAdmin = await isAdministrator(request)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { role, menu_item_id, enabled, can_view, can_create, can_edit, can_delete, can_export } = body;

    // Determine granular updates: if any explicit can_* provided, use granular mode.
    const granularProvided = [can_view, can_create, can_edit, can_delete, can_export].some(v => typeof v === 'boolean');
    const final = granularProvided ? {
      can_view: typeof can_view === 'boolean' ? can_view : false,
      can_create: typeof can_create === 'boolean' ? can_create : false,
      can_edit: typeof can_edit === 'boolean' ? can_edit : false,
      can_delete: typeof can_delete === 'boolean' ? can_delete : false,
      can_export: typeof can_export === 'boolean' ? can_export : false,
    } : {
      can_view: enabled,
      can_create: enabled,
      can_edit: enabled,
      can_delete: enabled,
      can_export: enabled,
    };
    // is_active follow can_view OR any permission enabled
    const isActive = Object.values(final).some(Boolean);

    console.log('Updating permission:', { role, menu_item_id, mode: granularProvided ? 'granular' : 'legacy', final });

    // Find role ID from role name
    const roleRecord = await prisma.roles.findFirst({
      where: { name: role }
    });

    if (!roleRecord) {
      return NextResponse.json({
        success: false,
        message: `Role "${role}" not found`
      }, { status: 404 });
    }

    // Update or create permission
    const permission = await prisma.menu_role_permissions.upsert({
      where: {
        role_name_menu_item_id: {
          role_name: roleRecord.name,
          menu_item_id: menu_item_id
        }
      },
      update: {
        ...final,
        is_active: isActive
      },
      create: {
        role_id: roleRecord.id,
        role_name: roleRecord.name,
        menu_item_id: menu_item_id,
        ...final,
        is_active: isActive
      }
    });

    // Post-update: attempt to set new columns via raw SQL if they exist
    try {
      const accessible = final.can_view || isActive;
      await prisma.$executeRawUnsafe(
        'UPDATE menu_role_permissions SET is_accessible = $1, has_permission = $2 WHERE role_name = $3 AND menu_item_id = $4',
        accessible, accessible, roleRecord.name, menu_item_id
      );
    } catch (e) {
      console.warn('Skipping setting new columns is_accessible/has_permission (may not exist yet):', e);
    }

    // Invalidate menu tree cache for this role so next fetch is fresh
    invalidateMenuCache(roleRecord.name);

    return NextResponse.json({
      success: true,
      data: permission,
      message: 'Permission updated successfully (cache invalidated)'
    });

  } catch (error) {
    console.error('Error updating menu permission:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update menu permission',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}