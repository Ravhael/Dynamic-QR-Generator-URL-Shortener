# User Settings Implementation Roadmap

Status date: 2025-09-27

This document captures the current state of the `user_settings` table and how each setting is (or is not yet) used in application logic. Purpose: provide a clear backlog for wiring settings into functional behavior after Prisma migrations are completed.

## 1. Data Model (Row-Based)
Columns (simplified):
- General: site_name, site_description, contact_email, timezone, language, default_qr_size, max_qr_size, default_format, enable_branding
- Security: enable_two_factor, password_strength, session_timeout, api_rate_limit
- Analytics: enable_analytics, geo_location, data_retention_days, anonymize_ip_addresses
- Notifications: email_notifications, sms_notifications, scan_alerts
- Integration: google_analytics_enabled, google_analytics_id
- Flexible: custom_settings (JSONB)

## 2. Current Usage Summary
| Setting | UI Form | Stored in DB | Functional Logic Implemented | Notes |
|---------|---------|--------------|------------------------------|-------|
| site_name | Yes | Yes | No | Should feed <title> & meta tags |
| site_description | Yes | Yes | No | SEO/OG description |
| contact_email | Yes | Yes | No | Support / footer fallback |
| timezone | Yes | Yes | No | Use for date formatting on server & client |
| language | Yes | Yes | No | Future i18n integration |
| default_qr_size | Yes | Yes | No | Pre-fill QR create form |
| max_qr_size | Yes | Yes | No | Validation upper bound for QR generation |
| default_format | Yes | Yes | No | Initial QR format selection |
| enable_branding | Yes | Yes | No | Show/hide branding/footer/watermark |
| enable_two_factor | Yes | Yes | No | Needs OTP/TOTP flow & login challenge |
| password_strength | Yes | Yes | No | Enforce rule on register/reset (zxcvbn) |
| session_timeout | Yes | Yes | No | Map to session maxAge / token expiry |
| api_rate_limit | Yes | Yes | No | Add per-user rate limiter middleware |
| enable_analytics (realTimeTracking) | Yes | Yes | No | Gate analytics event recording |
| geo_location | Yes | Yes | No | Skip geolocation calls if disabled |
| data_retention_days | Yes | Yes | No | Purge old analytics rows via scheduled job |
| anonymize_ip_addresses (UI: cookieConsent) | Yes | Yes | No | Mask IPs when storing analytics |
| email_notifications | Yes | Yes | No | Filter outbound email queue |
| sms_notifications | Yes | Yes | No | Filter SMS dispatch |
| scan_alerts (UI pushNotifications) | Yes | Yes | No | Real-time / email scan alerts gating |
| google_analytics_enabled | Yes | Yes | No | Conditionally inject GA script |
| google_analytics_id | Yes | Yes | No | GA script config |
| custom_settings | Hidden | Yes | No | Feature flags / experimental keys |

Legend: "Functional Logic Implemented = No" means currently only persisted, not applied.

## 3. Implementation Phases

### Phase 1: Core Access Layer
- Create `lib/userSettingsCache.ts` with in-memory (NodeCache/LRU) 5m TTL cache.
- Expose `getUserSettings(userId)` & `invalidateUserSettings(userId)`.
- Call invalidate after settings POST success.

### Phase 2: Security
- enable_two_factor: Introduce TOTP secret table/column + setup route + verify step during login.
- password_strength: Add password validation util used in registration & password reset.
- session_timeout: Apply to auth session token TTL (NextAuth adapter or custom JWT maxAge override).
- api_rate_limit: Build Redis/memory store keyed by user_id + global middleware enforcement.

### Phase 3: Analytics & Privacy
- Wrap analytics event emitters with `if (settings.enable_analytics)`.
- If `!geo_location`, skip browser geolocation & IP geolocation calls.
- Apply IP anonymization (mask last octet for IPv4, /64 for IPv6) when `anonymize_ip_addresses` true.
- Create scheduled job / manual script: purge analytics older than `data_retention_days`.

### Phase 4: Branding & UX
- Inject `site_name`, `site_description` into `app/layout.tsx` meta & OpenGraph tags.
- Conditionally show branding/watermark if `enable_branding` true.
- Use `default_qr_size`, `max_qr_size`, `default_format` when initializing QR creation forms.
- Apply `timezone` for server-side formatting (e.g., dayjs.tz) and client default.

### Phase 5: Notifications
- Pre-send filter: before enqueue email/SMS/push, check corresponding flags.
- For scan alerts: only dispatch on scan event if `scan_alerts` true.

### Phase 6: External Integrations
- GA: Conditionally inject GA tag if `google_analytics_enabled && google_analytics_id`.
- Optionally expand integration section for future providers (Mixpanel, Sentry toggles, etc.).

### Phase 7: Telemetry & Observability
- Log when a setting changes (audit trail in `user_activity`).
- Add metric: cache hit/miss for settings retrieval.

## 4. Data Retention Job Example (Pseudo-SQL)
```sql
DELETE FROM qr_scan_analytics WHERE scanned_at < now() - interval '${days} days';
DELETE FROM url_click_analytics WHERE clicked_at < now() - interval '${days} days';
```
Wrap in a Node script or cron runner referencing `data_retention_days` per user (or global fallback).

## 5. Helper Snippets (Outline)
```ts
// lib/userSettingsCache.ts
export async function getEffectiveSettings(userId: string) {
  const row = await getUserSettings(userId); // raw DB row
  // Map to nested shape if needed; else use directly
  return row;
}
```
```ts
// lib/ipAnonymize.ts
export function anonymizeIp(ip: string) { /* mask logic */ }
```
```ts
// middleware/rateLimit.ts
// Check api_rate_limit before continuing
```

## 6. Open Questions
- Do we need per-organization vs per-user settings later? (If yes, abstract resolution order.)
- Should `anonymize_ip_addresses` be decoupled from cookie consent concept? (Naming mismatch.)
- Fallback strategy if no row exists: keep current defaultSettings approach.
- Should some settings move to system-wide table (e.g., GA ID) instead of per-user? (Likely yes.)

## 7. Priority Backlog (Ordered)
1. Cache + invalidation layer
2. Rate limiting & password policy
3. Two-factor authentication
4. Analytics gating + IP anonymization
5. GA injection + branding + meta tags
6. Notification filtering
7. Data retention cleanup job
8. i18n & timezone handling

## 8. Risk & Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
| Uncached settings cause extra DB load | Performance | Add cache layer (Phase 1) |
| Inconsistent naming (cookieConsent vs anonymize_ip_addresses) | Confusion | Rename UI label or add alias mapping |
| Rate limit misconfiguration | DOS/lockout | Provide sensible min/max clamps |
| 2FA partial implementation | Broken login | Feature flag until complete |
| GA injection without consent management | Compliance | Pair with consent banner later |

## 9. Done Definition Per Setting
- Has retrieval via cache
- Enforced or applied in at least one runtime path
- Tested (unit/integration) for enable/disable toggle
- Logged in audit trail on change (optional enhancement)

## 10. Next Immediate Actions
- (A) Implement `userSettingsCache` module
- (B) Add invalidate call after POST `/api/settings`
- (C) Decide naming alignment for anonymize/cookieConsent

---
Prepared for future implementation while continuing Prisma migration tasks.
