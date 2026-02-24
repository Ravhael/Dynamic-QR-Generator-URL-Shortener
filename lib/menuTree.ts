import { prisma } from '@/lib/prisma';

interface BuildOptions {
  roleName: string;
  includeInactive?: boolean;
  flatten?: boolean;
  // Reserved for future multi-tenant scoping; currently optional and unused in cache key unless provided.
  tenantId?: string;
}

interface MenuNode {
  id: string;            // public menu_id
  internalId?: number;   // numeric primary key (added for permission updates)
  name: string;
  path?: string | null;
  icon?: string | null;
  children?: MenuNode[];
  isAccessible: boolean;
  hasPermission: boolean; // mirror for legacy checks
}

export interface PermissionMatrixEntry {
  menu_item_id: number; // internal numeric id
  menu_id: string;      // public menu code
  name: string;
  path?: string | null;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  is_accessible?: boolean; // new DB-driven flags
  has_permission?: boolean;
}

// Simple in-memory cache keyed by role (and optional tenant prefix if future multi-tenant adopted)
const MENU_CACHE_TTL = 60_000; // 1 minute
const menuCache: Record<string, { ts: number; tree: MenuNode[] }> = {};

function cacheKey(role: string, tenantId?: string) {
  return tenantId ? `${tenantId}:${role}` : role;
}

export function invalidateMenuCache(role?: string, tenantId?: string) {
  if (role) {
    const key = cacheKey(role, tenantId);
    delete menuCache[key];
  } else {
    Object.keys(menuCache).forEach(k => delete menuCache[k]);
  }
}

async function fetchRoleId(roleName: string): Promise<string | null> {
  const role = await prisma.roles.findUnique({ where: { name: roleName } });
  return role?.id || null;
}

export async function getMenuTreeForRole(options: BuildOptions): Promise<MenuNode[]> {
  let { roleName, includeInactive, tenantId } = options;
  // Case-insensitive role resolution (prefer exact, else case-insensitive match)
  const roleExact = await prisma.roles.findUnique({ where: { name: roleName } });
  if (!roleExact) {
    const roleCi = await prisma.roles.findFirst({ where: { name: { equals: roleName, mode: 'insensitive' } } });
    if (roleCi) roleName = roleCi.name; // use canonical casing for cache key
  }
  const key = cacheKey(roleName, tenantId);
  const cacheEntry = menuCache[key];
  const now = Date.now();
  if (cacheEntry && now - cacheEntry.ts < MENU_CACHE_TTL) {
    return cacheEntry.tree;
  }

  const roleId = await fetchRoleId(roleName);

  const menuItems = await prisma.menu_items.findMany({
    where: includeInactive ? {} : { is_active: true },
    orderBy: { sort_order: 'asc' }
  });

  let permissions = await prisma.menu_role_permissions.findMany({
    where: roleId ? { role_id: roleId } : { role_name: roleName }
  });
  if (permissions.length === 0 && roleId) {
    permissions = await prisma.menu_role_permissions.findMany({ where: { role_name: roleName } });
  }
  const noPermissionRows = permissions.length === 0; // now only used for cache key invalidation decision (not for full-access fallback)

  // Map permissions by menu_item_id for quick lookup including new visibility columns
  const permByMenuId = new Map<number, typeof permissions[number]>();
  for (const p of permissions) {
    permByMenuId.set(p.menu_item_id, p);
  }

  function build(parentMenuId: string | null = null): MenuNode[] {
    return menuItems
      .filter(m => m.parent_id === parentMenuId)
      .map(m => {
  const perm = permByMenuId.get(m.id);
  const p: any = perm; // temporary cast: new columns may not be in generated client type until migration applied
  // Determine accessibility: prefer explicit is_accessible; fallback to can_view; fallback to false
        const isAccessible = (p?.is_accessible !== undefined ? p.is_accessible : undefined) ?? perm?.can_view ?? false;
        const hasPermission = (p?.has_permission !== undefined ? p.has_permission : undefined) ?? isAccessible;
        const children = build(m.menu_id);
        return {
          id: m.menu_id,
          internalId: m.id,
            name: m.name,
          path: m.path,
          icon: m.icon,
          isAccessible,
          hasPermission,
          ...(children.length ? { children } : {})
        };
      });
  }

  const tree = build(null);
  menuCache[key] = { ts: now, tree };
  return tree;
}

// Return full menu tree (without permission filtering) for management UI
export async function getFullMenuTree(includeInactive = false): Promise<MenuNode[]> {
  const items = await prisma.menu_items.findMany({
    where: includeInactive ? {} : { is_active: true },
    orderBy: { sort_order: 'asc' }
  });

  // Runtime permission gap check (ADMIN & USER coverage) executed opportunistically here once per build.
  // We only log warnings; no thrown errors so it remains non-disruptive.
  try {
    const criticalRoles = ['Administrator', 'ADMIN', 'User', 'USER'];
    const activeItemIds = items.filter(i => i.is_active).map(i => i.id);
    if (activeItemIds.length) {
      const permRows = await prisma.menu_role_permissions.findMany({
        where: { menu_item_id: { in: activeItemIds }, role_name: { in: criticalRoles } },
        select: { role_name: true, menu_item_id: true }
      });
      const byRole = new Map<string, Set<number>>();
      for (const r of permRows) {
        if (!byRole.has(r.role_name)) byRole.set(r.role_name, new Set());
        byRole.get(r.role_name)!.add(r.menu_item_id);
      }
      const uniqueCritical = Array.from(new Set(criticalRoles));
      for (const role of uniqueCritical) {
        // Normalize to existing case if alternative provided
        const matchedKey = Array.from(byRole.keys()).find(k => k.toLowerCase() === role.toLowerCase()) || role;
        const covered = byRole.get(matchedKey) || new Set();
        const missing = activeItemIds.filter(id => !covered.has(id));
        if (missing.length) {
          console.warn(`[MENU-GAP] Role ${matchedKey} missing ${missing.length} permission rows for active menu items. Consider seeding.`, { role: matchedKey, missingCount: missing.length });
        }
      }
    }
  } catch (gapErr) {
    console.warn('[MENU-GAP] Permission gap check failed (non-fatal):', gapErr);
  }

  function build(parent: string | null): MenuNode[] {
    return items
      .filter(i => i.parent_id === parent)
      .map(i => {
        const children = build(i.menu_id);
        return {
          id: i.menu_id,
          internalId: i.id,
          name: i.name,
          path: i.path,
          icon: i.icon,
          // Full tree: mark accessible based on item active status; permissions UI can overlay role choices
          isAccessible: !!i.is_active,
          hasPermission: !!i.is_active,
          ...(children.length ? { children } : {})
        };
      });
  }
  return build(null);
}

// Build permission matrix for a specific role
export async function getPermissionMatrix(roleName: string): Promise<PermissionMatrixEntry[]> {
  const role = await prisma.roles.findUnique({ where: { name: roleName } });
  const roleId = role?.id || null;
  let perms = await prisma.menu_role_permissions.findMany({
    where: roleId ? { role_id: roleId } : { role_name: roleName },
    include: { menu_items: true }
  });
  if (perms.length === 0 && roleId) {
    perms = await prisma.menu_role_permissions.findMany({
      where: { role_name: roleName },
      include: { menu_items: true }
    });
  }
  return perms.map(p => ({
    menu_item_id: p.menu_item_id,
    menu_id: p.menu_items.menu_id,
    name: p.menu_items.name,
    path: p.menu_items.path,
    can_view: p.can_view,
    can_create: p.can_create,
    can_edit: p.can_edit,
    can_delete: p.can_delete,
    can_export: p.can_export,
    is_accessible: (p as any).is_accessible,
    has_permission: (p as any).has_permission,
  }));
}
