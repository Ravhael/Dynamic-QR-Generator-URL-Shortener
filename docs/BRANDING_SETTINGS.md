# Branding Settings

The application header branding (logo + site name) is fully database driven using the `system_settings` key-value table.

## Keys

Category: `branding`
- `site_name` (string): The human readable application name displayed in the top header.
- `logo` (string): Stored path (e.g. `/uploads/branding/logo.png?v=TIMESTAMP`) written automatically by the upload API. Leave empty for no logo.

Legacy (camelCase) keys `siteName` and `siteLogo` are still read for backward compatibility but are no longer written.

## How It Works
1. The header component calls `useSystemSettings()` which fetches all active settings via `/api/admin/system-settings`.
2. It resolves the logo with preference order: `branding.logo` -> `branding.siteLogo` (legacy).
3. It resolves the site name with preference order: `branding.site_name` -> `branding.siteName` (legacy) -> fallback `Scanly`.
4. The System Settings page exposes inputs to update `site_name` and `logo` and persists through the bulk save endpoint.

## Seeding Defaults
Run the seed script (after ensuring your database connection is configured) to set default name and empty logo:

```bash
npx ts-node scripts/seed-branding.ts
```

Or add to `package.json` scripts:
```json
"seed:branding": "ts-node scripts/seed-branding.ts"
```
Then run:
```bash
npm run seed:branding
```

## Image Recommendations & Limits
- SVG preferred for crisp scaling (upload with .svg).
- Keep height visually ~28–32px in header; actual file can be larger.
- Transparent background for PNG/WebP is ideal.
- Max file size: 1MB.
- Uploaded raster images taller than 128px are automatically resized to height=128 (maintaining aspect ratio).
- Extremely large (>2048px height) images are rejected.

## Upload Flow & Favicon Generation
1. In System Settings > Branding, click "Upload Logo".
2. Select an allowed image (PNG, JPG, SVG, WEBP).
3. File is POSTed to `/api/admin/branding/logo` via FormData.
4. API validates (<=1MB; allowed mime). If raster >128px height it is resized. SVG is rasterized for derivative assets.
5. Stored at `public/uploads/branding/logo.(ext)` (overwrite).
6. Favicons generated automatically: `icon-16.png`, `icon-32.png`, `icon-48.png` and `favicon.ico` in `/public`.
7. A cache-busting query param `?v=timestamp` is appended and saved under `branding.logo`.
8. Header updates after settings refetch / navigation.

Removing logo: Click "Remove" to clear value; header falls back to text only (favicon files remain until next overwrite).

## Caching
If you add caching to system settings later, remember to invalidate after updates (already calling `invalidateSystemConfigCache()`).

## Future Enhancements
- Theming variants (dark-mode specific) via `logo_dark` and `logo_light`.
- Drag & drop upload & client-side optimization (resize/compress).
- Automatic favicon theme-color & manifest.json update.
