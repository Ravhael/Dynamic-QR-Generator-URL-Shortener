import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/ensurePermission';
import { enrichUrlClickGeo } from '@/lib/geo/enrichUrlClicks';

export const dynamic = 'force-dynamic';

export const POST = withPermission({ resource: 'url_analytics', action: 'update' }, async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => ({}));
    const limit = typeof body.limit === 'number' ? Math.min(Math.max(body.limit, 1), 1000) : 100;
    const dryRun = body.dryRun === true;
    const result = await enrichUrlClickGeo({ limit, dryRun, log: true });
    return NextResponse.json({ success: true, dryRun, ...result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
});
