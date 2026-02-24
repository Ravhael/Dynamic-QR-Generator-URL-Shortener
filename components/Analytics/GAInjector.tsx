    import React from 'react';
import { getEffectiveUserSettings } from '@/lib/userSettingsCache';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

// This is a Server Component helper wrapper exported as an async component-like function.
// We'll call it inside layout by passing no props (it will fetch userSettings using a safe fallback user if needed).

async function resolveUserIdViaToken(): Promise<string | null> {
  // In layout we don't have the request easily; fallback not implemented here.
  // For now return null so GA requires explicit user id injection in future if per-user GA differing.
  return null;
}

export async function GAInjector() {
  // We attempt to load effective settings for a user if available; if not, skip (global GA can also come later from system settings if needed).
  const userId = await resolveUserIdViaToken();
  if (!userId) return null;
  const settings = await getEffectiveUserSettings(userId);
  if (!settings.google_analytics_enabled || !settings.google_analytics_id) return null;
  const trackingId = settings.google_analytics_id;
  // Support GA4 (G-*) or legacy UA-* pattern
  const script = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config','${trackingId}');`;
  return (
    <>
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${trackingId}`}></script>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  );
}
