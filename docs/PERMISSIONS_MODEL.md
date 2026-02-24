# Permissions Model

This system provides granular, scope-based permissions over resource types with CRUD + EXPORT actions.

## Resource Type Groups
```
QR Management:
  - qr_code
  - qr_category

URL Management:
  - short_url
  - url_category

Analytics & Detailed Analytics:
  - qr_analytics            (aggregate metrics per QR)
  - qr_event_scans          (raw scan events)
  - url_analytics           (aggregate metrics per URL)
  - url_event_clicks        (raw click events)

User Management:
  - profile
  - user_setting
  - users
  - group_users
```
(Names are stored lowercase underscore; display labels are mapped in UI.)

## Core Tables
- `resource_types` — Logical resource buckets.
- `role_permissions` — Rows defining (role, resource_type, permission_type, scope, description).

Unique: `(role, resource_type, permission_type)`

`permission_type` ∈ create | read | update | delete | export

`scope` ∈ all | group | own | none

`export` internally normalizes to `read` for evaluation logic.

## Default / Recommended Scopes
Admin: all actions => all scopes on every resource.
User (baseline suggestion):
```
qr_code, qr_category, short_url, url_category:
  create: own
  read:   group
  update: own
  delete: own
  export: group
analytics aggregates (qr_analytics, url_analytics):
  create/update/delete: none (system generated)
  read/export: group (can be tightened to own if per-user slicing only)
raw events (qr_event_scans, url_event_clicks):
  create/update/delete: none (append-only system)
  read/export: group (or none if privacy restricted)
profile, user_setting:
  read/update: own (others none)
users, group_users:
  read: group (list peers) / create/update/delete: none (unless manager role introduced later)
```
These templates can evolve (e.g. introduce a manager role with broader read on users / analytics).

## Scope Semantics
| Scope  | Meaning |
|--------|---------|
| all    | Full cross-user & cross-group access |
| group  | Users in same group (or owner if resolvable) |
| own    | Only records created/owned by the user |
| none   | No permission (row may be deleted) |

## Business Rules
1. Admin roles fallback to allow-all if rows missing (bootstrap scenario).
2. Group scope compares requesting user group with target resource owner group.
3. Update/Delete restricted to owner or admin (enforced by scope selection + helper logic).
4. Export uses same scope decision as read.
5. Analytics raw event resources normally disallow mutation by end users.

## Bulk API Endpoint
`POST /api/admin/role-permissions/bulk`

Body:
```
{ "items": [ { "role": "user", "resource_type": "qr_code", "permission_type": "read", "scope": "group" } ] }
```

If `scope === 'none'` → delete existing row else upsert.

## Seeding & Reset Endpoints
- Seed all (admin + user defaults): `POST /api/admin/role-permissions/seed`
- Reset specific role to template: `POST /api/admin/role-permissions/reset` body: `{ "role": "user" }`

Auto behaviors:
- If admin role exists but has zero permissions, UI will auto-call seed endpoint once.

## Constraints
- Non-admin roles cannot elevate UPDATE or DELETE above `own` (UI + backend enforced).
- Selecting `none` removes (or omits) the permission row.

## Future Enhancements
- UI display names mapping (Title Case).
- Derived composite permissions (e.g. manage).
- Auditing permission changes.
- Caching layer for high-volume checks.
- Manager / Analyst role templates.
