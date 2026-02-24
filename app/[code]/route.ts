import { NextRequest, NextResponse } from 'next/server';
import { GET as redirectHandler } from '../u/[code]/route';

// Root-level short code fallback: allows accessing /{code} in addition to /u/{code}.
// Avoid duplicate logic by delegating to existing /u/[code] GET.
// NOTE: If you later add other top-level routes, ensure they don't conflict with common short codes
// (e.g. reserved words like 'login', 'admin', 'api'). You can add a deny-list here if needed.

// Next.js 15 RouteContext: params is a Promise
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  // Simple deny list to prevent clobbering real pages (extend as needed)
  const reserved = new Set(['api','favicon.ico','_next','static','login','register','dashboard','admin']);
  const { code } = await ctx.params
  if (reserved.has(code)) {
    return NextResponse.next();
  }
  // delegate with the same context shape
  const response = await redirectHandler(req, { params: Promise.resolve({ code }) } as any);
  if (response.status === 404) {
    const redirectUrl = new URL('/404', req.url);
    redirectUrl.searchParams.set('code', code);
    return NextResponse.redirect(redirectUrl);
  }
  return response;
}