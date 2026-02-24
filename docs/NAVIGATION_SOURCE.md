# Navigation & Sidebar Source of Truth

## Overview
The application sidebar & navigation structure is **database-driven** and dynamically resolved at runtime. Any legacy static menu or experimental variants have been deprecated.

## Authoritative Source
Runtime navigation comes from:
- Database tables: `menu_items`, `menu_role_permissions` (and related permission resolution logic)
- Builder / service layer: functions in `lib/menuService.ts`, `lib/menuApi.ts`, and cache management in `lib/menuTree.ts`
- Client consumption: hooks/components that fetch the resolved tree (e.g. `useMenuPermissions` used by `components/Layout/Sidebar.tsx`)

## Deprecated / Legacy Artifacts
The following files were retained temporarily with deprecation comments (safe to remove after confirming no imports):
- `components/Layout/Header-new.tsx` (legacy experimental header variant)
- `components/Layout/Sidebar-Premium.tsx` (premium mock variant)
- `components/Layout/Header-Minimalist.tsx` (empty / placeholder)

## Notifications Refactor
Inline mock notifications inside `components/Layout/Header.tsx` were extracted to `hooks/useNotifications.ts`. This hook is currently **mock-backed** and designed for future backend integration (polling, SSE, or WebSocket). Update this hook rather than scattering notification logic across UI components.

## Extending the Menu
To add a new navigation item:
1. Insert a record into `menu_items` (parent_id for hierarchy, ordering handled via existing position/sequence field if present).
2. (Optional) Add role/permission bindings in `menu_role_permissions` if restricted.
3. Invalidate the cached tree using existing API mutation handlers or by calling the exported `invalidateMenuCache` helper.
4. Run the menu documentation generator (script: `npm run generate:menu-doc`) to refresh `docs/MENU_STRUCTURE.md`.

## Caching Behavior
The menu tree is cached in-memory keyed by role (and future tenant dimension). After any mutation affecting menu structure or permissions, the corresponding invalidation helper is called to ensure consistency.

## Future Improvements (Backlog)
- Multi-tenant cache key finalization
- Permission diff surface in admin panel (show newly orphaned items)
- Real-time invalidation via channel/pub-sub instead of in-process only
- Notifications hook migration to real service (table + read state)

## Notifications Architecture (Implemented Enhancements)
Data Flow:
1. Creation: POST `/api/notifications` (admin broadcast or self-targeted) writes to `notifications` + bulk inserts rows in `notification_recipients`.
2. Listing: GET `/api/notifications` supports `cursor`, `limit`, `offset` (legacy), and `unreadOnly=true`.
3. Read State: POST `/api/notifications/read` with `{id}` or `{all:true}` marks recipient rows `is_read`.
4. Dismiss / Delete (scaffold): Service includes placeholder soft-delete hooks pending migration deploy; dismissal hides entries via `is_dismissed`.
5. Unread Streaming: SSE endpoint `/api/notifications/stream` emits `event: unread` lines with `{ "unread": <count> }` every 15s.
6. Hook: `useNotifications` now supports: polling, unread-only toggle, SSE subscription fallback, and returns external unread count if available.

Query Parameters (GET /api/notifications):
| Param | Type | Description |
|-------|------|-------------|
| limit | number | Max items (<=100) |
| offset | number | Legacy pagination offset (avoid when using cursor) |
| cursor | string | Notification id for cursor-based pagination (preferred) |
| unreadOnly | boolean | Filter unread only |

Meta Response (cursor mode): `{ items, meta: { limit, cursor, nextCursor, unreadOnly, total, unreadCountWindow } }`

SSE Usage Example:
```js
const es = new EventSource('/api/notifications/stream');
es.addEventListener('unread', ev => { const { unread } = JSON.parse(ev.data); console.log('unread:', unread); });
```

Extensions Planned:
- Global soft-delete enforcement after migration of `is_deleted` columns.
- Real-time push (LISTEN/NOTIFY or Redis) replacing interval in SSE.
- Batched mark operations & deletion API endpoints.

## Migration Guidance
When removing deprecated files:
- Ensure no imports remain (use project-wide search for filename)
- If keeping for reference, relocate to a `legacy/` folder outside active import paths

## Source of Truth Summary
| Concern | Source |
|--------|-------|
| Sidebar structure | DB (`menu_items`) + builder (`menuTree` / service) |
| Permissions gating | DB (`menu_role_permissions`) + runtime filtering |
| Documentation | Generated via `scripts/generate-menu-doc.ts` |
| Notifications (temp) | `hooks/useNotifications.ts` (mock) |

---
Last updated: (auto-written) – update this doc whenever navigation architecture changes.
