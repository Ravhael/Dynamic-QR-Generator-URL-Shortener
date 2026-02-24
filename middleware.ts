import { NextResponse } from "next/server";
// Removed direct systemConfig & userSettings (Prisma) usage to keep middleware edge-compatible.
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
// NOTE: Avoid direct Prisma in middleware (edge). We rely on API route to supply permission-decorated tree.
// import { checkPathPermission } from "@/lib/routePermission";
// import { getMenuTreeForRole } from "@/lib/menuTree";

// In-memory naive rate limit store (per middleware instance)
interface RLRecord { windowStart: number; count: number }
const rateLimitStore: Map<string, RLRecord> = (globalThis as any).__RL_STORE || new Map();
// persist across hot reload dev
;(globalThis as any).__RL_STORE = rateLimitStore;

const menuTreeCache: Map<string, { expires: number; value: any[] }> = (globalThis as any).__MENU_TREE_CACHE || new Map();
;(globalThis as any).__MENU_TREE_CACHE = menuTreeCache;
const MENU_CACHE_TTL_MS = 30_000;

async function readSessionToken(request: NextRequest): Promise<any | null> {
	try {
		const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
		return token as any;
	} catch (err) {
		console.error('[MW_SESSION_PARSE_ERROR]', err);
		return null;
	}
}

function enforceRateLimit(key: string, limit: number, windowMs = 60_000) {
  if (limit <= 0) return { allowed: true, remaining: -1, reset: Date.now() + windowMs };
  const now = Date.now();
  let rec = rateLimitStore.get(key);
  if (!rec || (now - rec.windowStart) >= windowMs) {
    rec = { windowStart: now, count: 0 };
    rateLimitStore.set(key, rec);
  }
  rec.count++;
  const remaining = Math.max(0, limit - rec.count);
  const allowed = rec.count <= limit;
  return { allowed, remaining, reset: rec.windowStart + windowMs };
}

export async function middleware(request: NextRequest) {
		const { pathname } = request.nextUrl;
		const disabled = process.env.DISABLE_PERMISSION_ENFORCEMENT === 'true';
	if (pathname.startsWith('/api/internal/middleware-session')) {
		return NextResponse.next();
	}
	// Bypass static / auth / public (except generic /api to allow rate limiting logic below)
	if (
		pathname.startsWith("/_next") ||
		pathname === "/login" ||
		pathname === "/register" ||
		pathname === "/forgot-password" ||
		pathname === "/403" ||
		pathname === "/404" ||
		pathname.startsWith("/.well-known")
	) {
		return NextResponse.next();
	}

	const token: any = await readSessionToken(request);

	// Helper: cached runtime config fetch (60s TTL) from internal API (avoids Prisma in edge)
	async function fetchRuntimeConfigEdge(): Promise<any> {
		// Prevent recursion: if current request IS the runtime-config endpoint, return defaults immediately
		if (pathname.startsWith('/api/internal/runtime-config')) {
			return { maintenanceMode: false, enableRegistration: true, require2FA: false, enableApiAccess: true, sessionTimeoutSeconds: 3600, _source: 'bypass' };
		}
		const g: any = globalThis;
		if (g.__RUNTIME_CFG && g.__RUNTIME_CFG.expires > Date.now()) return { ...g.__RUNTIME_CFG.value, _source: 'cache' };
		try {
			const res = await fetch(new URL('/api/internal/runtime-config', request.url), { cache: 'no-store' });
			if (res.ok) {
				const data = await res.json();
				g.__RUNTIME_CFG = { value: data, expires: Date.now() + 60_000 };
				return { ...data, _source: 'network' };
			}
		} catch {}
		return { maintenanceMode: false, enableRegistration: true, require2FA: false, enableApiAccess: true, sessionTimeoutSeconds: 3600, _source: 'fallback' };
	}

	// Maintenance mode (after basic bypasses, before deep permission logic)
	try {
		const cfg = await fetchRuntimeConfigEdge();
		if (cfg.maintenanceMode) {
			// Allow admins & explicit maintenance page & auth endpoints
			const isAdmin = token?.role && ['ADMIN','admin','Administrator','administrator'].includes(token.role);
			const allowedDuringMaintenance = [
				'/maintenance', '/login', '/api/auth', '/api/health'
			];
			const pathOk = allowedDuringMaintenance.some(p => pathname === p || pathname.startsWith(p + '/'));
			if (!isAdmin && !pathOk) {
				const url = new URL('/maintenance', request.url);
				url.searchParams.set('from', pathname);
				return NextResponse.redirect(url);
			}
		}

		// Registration disabled guard
		if (!cfg.enableRegistration && pathname === '/register') {
			// If user already logged in redirect dashboard, else redirect login with flag
			if (token) {
				const dash = new URL('/dashboard', request.url);
				dash.searchParams.set('registration', 'disabled');
				return NextResponse.redirect(dash);
			} else {
				const login = new URL('/login', request.url);
				login.searchParams.set('registration', 'disabled');
				return NextResponse.redirect(login);
			}
		}

		// Removed global require2FA enforcement: handled per-user at route level now.
	} catch (e) {
		// Fail-open: do not block if config load fails
		console.error('[MAINTENANCE_CHECK_ERROR]', e);
	}
	if (!token) {
		// Allow unauthenticated for:
		// - auth endpoints
		// - runtime-config (to avoid recursion / redirect loop)
		// - maintenance page itself
		if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/internal/runtime-config') || pathname === '/maintenance') {
			return NextResponse.next();
		}
		const url = new URL('/login', request.url);
		url.searchParams.set('callbackUrl', request.url);
		return NextResponse.redirect(url);
	}

	// Global require2FA logic removed (Option C). Per-user enforcement occurs within protected routes.

	// Hardening: ensure essential claims exist & user is active
	if (!token.id || !token.role || token.is_active === false) {
		console.warn('[AUTH_HARDEN_DENY]', { hasId: !!token.id, role: token.role, is_active: token.is_active });
		// Prepare redirect and clear next-auth cookies defensively
		const url = new URL('/login', request.url);
		url.searchParams.set('callbackUrl', request.url);
		const res = NextResponse.redirect(url);
		['next-auth.session-token','__Secure-next-auth.session-token','scanly_auth','token','auth_token'].forEach(name => {
			res.cookies.set({ name, value: '', path: '/', expires: new Date(0) });
		});
		return res;
	}

	// Session timeout enforcement (after basic auth validation) using runtime config only (no per-user override in edge)
	try {
		const cfg = await fetchRuntimeConfigEdge();
		const timeoutMs = (cfg.sessionTimeoutSeconds || 0) * 1000;
		(request as any)._apiRateLimit = 1000; // placeholder; moved per-user override out of middleware to avoid Prisma
		if (timeoutMs > 0) {
			const lastActivity = token.lastActivity as number | undefined;
			if (lastActivity && (Date.now() - lastActivity) > timeoutMs) {
				console.warn('[SESSION_TIMEOUT]', { userId: token.id, lastActivity, timeoutMs });
				const loginUrl = new URL('/login', request.url);
				loginUrl.searchParams.set('timeout', '1');
				loginUrl.searchParams.set('callbackUrl', request.url);
				const res = NextResponse.redirect(loginUrl);
				['next-auth.session-token','__Secure-next-auth.session-token','scanly_auth','token','auth_token'].forEach(name => {
					res.cookies.set({ name, value: '', path: '/', expires: new Date(0) });
				});
				return res;
			}
		}
		// API access toggle (runtime config) - add debug header path
		if (!cfg.enableApiAccess && pathname.startsWith('/api/') && !pathname.startsWith('/api/internal/runtime-config')) {
			const isAuth = pathname.startsWith('/api/auth');
			const isSystemSettings = pathname.startsWith('/api/admin/system-settings');
			const isAdmin = token?.role && ['ADMIN','admin','Administrator','administrator'].includes(token.role);
			if (!isAuth && !isSystemSettings && !isAdmin) {
				const res = new NextResponse(JSON.stringify({ _error: 'API access disabled by administrator' }), { status: 503, headers: { 'content-type': 'application/json' } });
				res.headers.set('x-api-access-flag', 'disabled');
				return res;
			}
		}
	} catch (e) {
		console.error('[SESSION_TIMEOUT_CHECK_ERROR]', e);
	}

	// Attach debug header for runtime config source (if loaded earlier)
	try {
		const g: any = globalThis;
		const cfg = g.__RUNTIME_CFG?.value;
		if (cfg) {
			const res = NextResponse.next();
			res.headers.set('x-runtime-config-source', g.__RUNTIME_CFG?.value?._source || 'unknown');
			res.headers.set('x-enable-api-access', String(cfg.enableApiAccess));
			return res;
		}
	} catch {}

	// API rate limiting (non-auth endpoints)
	if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
		const limit = (request as any)._apiRateLimit ?? 1000;
		const key = `u:${token.id}`; // per-user key
		const { allowed, remaining, reset } = enforceRateLimit(key, limit);
		if (!allowed) {
			const retrySec = Math.max(1, Math.floor((reset - Date.now()) / 1000));
			return new NextResponse(JSON.stringify({ _error: 'Rate limit exceeded', retry_after: retrySec }), {
				status: 429,
				headers: {
					'content-type': 'application/json',
					'Retry-After': retrySec.toString(),
					'X-RateLimit-Limit': limit.toString(),
					'X-RateLimit-Remaining': remaining.toString(),
				}
			});
		}
		// Provide rate limit headers on successful response path: we can't know body yet so set on pass-through
		const res = NextResponse.next();
		res.headers.set('X-RateLimit-Limit', limit.toString());
		res.headers.set('X-RateLimit-Remaining', remaining.toString());
		res.headers.set('X-RateLimit-Reset', Math.floor(reset/1000).toString());
		return res;
	}

		const roleName: string | undefined = token?.role || token?.user?.role || token?.roles?.[0];
			if (!disabled && roleName) {
				// Normalisasi path
				const normalizedPath = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
				try {
					// Ambil menu tree via API (menggunakan token cookie untuk auth)
					const cacheKey = token?.id ? `menus:${token.id}:${roleName}` : null;
					let rawTree: any[] | null = null;
					if (cacheKey) {
						const cached = menuTreeCache.get(cacheKey);
						if (cached && cached.expires > Date.now()) {
							rawTree = cached.value;
						}
					}
					if (!rawTree) {
						const apiUrl = new URL('/api/menus/structure', request.url);
						const resp = await fetch(apiUrl.toString(), { headers: { cookie: request.headers.get('cookie') || '' } });
						if (!resp.ok) {
							console.error('[PERM_API_ERROR]', resp.status, await resp.text());
							return NextResponse.next();
						}
						const data = await resp.json();
						const parsed = Array.isArray(data?.menus)
							? data.menus
							: Array.isArray(data?.tree)
								? data.tree
								: (Array.isArray(data) ? data : []);
						if (!Array.isArray(parsed)) {
							console.warn('[PERM_TREE_FORMAT_INVALID]', typeof parsed);
							return NextResponse.next();
						}
						rawTree = parsed;
						if (cacheKey) {
							menuTreeCache.set(cacheKey, { value: parsed, expires: Date.now() + MENU_CACHE_TTL_MS });
						}
					}
					if (!rawTree) {
						return NextResponse.next();
					}
					// Flatten
					const stack: any[] = [...rawTree];
					const flat: any[] = [];
					while (stack.length) {
						const n: any = stack.pop();
						if (!n) continue;
						if (Array.isArray(n.children) && n.children.length) stack.push(...n.children);
						flat.push(n);
					}
					const variants = new Set<string>([normalizedPath, normalizedPath + '/']);
					if (normalizedPath.endsWith('/')) variants.add(normalizedPath.slice(0, -1));
					const node = flat.find(n => {
						if (!n.path) return false;
						const np = n.path !== '/' && n.path.endsWith('/') ? n.path.slice(0, -1) : n.path;
						return variants.has(n.path) || variants.has(np);
					});
					const isExplicitlyLocked = (n: any) =>
						n && (n.isAccessible === false || n.is_accessible === false || n.hasPermission === false || n.has_permission === false);
					if (node) {
						if (isExplicitlyLocked(node)) {
							console.warn('[PERM_DENY_API_TREE]', { path: normalizedPath, roleName, nodePath: node.path });
							const redirectUrl = new URL('/403', request.url);
							redirectUrl.searchParams.set('from', normalizedPath);
							redirectUrl.searchParams.set('reason', 'locked');
							return NextResponse.redirect(redirectUrl);
						}
					} else {
						// Cek segmen parent pertama apakah locked
						const firstSeg = '/' + normalizedPath.split('/').filter(Boolean)[0];
						const parentLocked = flat.find(n => n.path === firstSeg && isExplicitlyLocked(n));
						if (parentLocked) {
							console.warn('[PERM_DENY_PARENT_LOCKED]', { path: normalizedPath, roleName, parent: parentLocked.path });
							const redirectUrl = new URL('/403', request.url);
							redirectUrl.searchParams.set('from', normalizedPath);
							redirectUrl.searchParams.set('reason', 'parent-locked');
							return NextResponse.redirect(redirectUrl);
						}
						console.debug('[PERM_NODE_NOT_FOUND_ALLOW]', { path: normalizedPath });
					}
					const res = NextResponse.next();
					res.headers.set('x-permission-debug', JSON.stringify({ role: roleName, path: normalizedPath, node: node ? { path: node.path, isAccessible: node.isAccessible } : null }));
					return res;
				} catch (err) {
					console.error('[PERM_FETCH_TREE_ERROR]', err);
					return NextResponse.next();
				}
			} else if (disabled) {
			const res = NextResponse.next();
			res.headers.set('x-permission-enforcement', 'disabled');
			return res;
		}

	return NextResponse.next();
}
