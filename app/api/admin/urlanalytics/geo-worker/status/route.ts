import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/ensurePermission';
import { getGeoWorkerStats } from '@/lib/geo/geoWorker';

export const dynamic = 'force-dynamic';

export const GET = withPermission({ resource: 'url_analytics', action: 'read' }, async (_req: NextRequest) => {
  return NextResponse.json({ success: true, stats: getGeoWorkerStats() });
});
