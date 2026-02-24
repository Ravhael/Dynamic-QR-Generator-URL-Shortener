import { prisma } from '@/lib/prisma'

/** Cache simple path->menu_item_id mapping & role/menu permissions for speed in middleware */
const PATH_CACHE_TTL = 60_000; // 1 minute
let pathCache: { ts: number; map: Record<string, { menu_item_id: number; menu_id: string }> } | null = null;

async function loadPathMap() {
  const now = Date.now();
  if (pathCache && now - pathCache.ts < PATH_CACHE_TTL) return pathCache.map;
  const items = await prisma.menu_items.findMany({ select: { id: true, menu_id: true, path: true } });
  const map: Record<string, { menu_item_id: number; menu_id: string }> = {};
  for (const i of items) {
    if (i.path) {
      map[i.path] = { menu_item_id: i.id, menu_id: i.menu_id };
    }
  }
  pathCache = { ts: now, map };
  return map;
}

export interface PathPermissionResult {
  requiresPermission: boolean;
  allowed: boolean;
  reason?: string;
  menu_id?: string;
}

export async function checkPathPermission(pathname: string, roleName: string): Promise<PathPermissionResult> {
  // Normalisasi konsisten (strip trailing slash kecuali root)
  if (pathname !== '/' && pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  const map = await loadPathMap();
  const entry = map[pathname];
  if (!entry) {
    return { requiresPermission: false, allowed: true };
  }

  let resolvedRole = await prisma.roles.findUnique({ where: { name: roleName } });
  if (!resolvedRole) {
    resolvedRole = await prisma.roles.findFirst({ where: { name: { equals: roleName, mode: 'insensitive' } } });
  }
  const canonicalRoleName = resolvedRole?.name || roleName;
  const roleId = resolvedRole?.id;

  let perm = roleId
    ? await prisma.menu_role_permissions.findFirst({ where: { role_id: roleId, menu_item_id: entry.menu_item_id } })
    : null;
  if (!perm) {
    perm = await prisma.menu_role_permissions.findFirst({ where: { role_name: canonicalRoleName, menu_item_id: entry.menu_item_id } });
  }
  if (!perm) {
    const permissive = process.env.PERMISSION_MISSING_ROW_MODE === 'allow';
    const result = permissive
      ? { requiresPermission: false, allowed: true, reason: 'No permission row (allow mode)' }
      : { requiresPermission: true, allowed: false, reason: 'No permission row (deny by default)', menu_id: entry.menu_id };
    if (!permissive) {
      console.warn('[PERMISSION_NO_ROW_DENY]', { pathname, role: roleName });
    }
    return result;
  }
  const anyPerm: any = perm;
  const explicitFlag = anyPerm.is_accessible; // may be boolean | undefined
  const base = perm.can_view;
  const strictMode = process.env.PERMISSION_ENFORCEMENT_MODE === 'strict';
  // Lock icon semantics: explicit false means DENY regardless of base in strict or non-strict.
  let allowed: boolean;
  if (explicitFlag === false) {
    allowed = false;
  } else if (strictMode) {
    allowed = (explicitFlag !== undefined ? explicitFlag : base) ? true : false;
  } else {
    // non-strict: allow if either explicit true or base true
    allowed = (explicitFlag === true) || base === true;
  }
  return { requiresPermission: true, allowed, menu_id: entry.menu_id };
}
