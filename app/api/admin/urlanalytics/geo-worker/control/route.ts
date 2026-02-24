import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/lib/ensurePermission';
import { startGeoWorker, stopGeoWorker, getGeoWorkerStats } from '@/lib/geo/geoWorker';

export const dynamic = 'force-dynamic';

export const POST = withPermission({ resource: 'url_analytics', action: 'update' }, async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const action = body.action;
  if (action === 'start') startGeoWorker();
  else if (action === 'stop') stopGeoWorker();
  else return NextResponse.json({ success: false, error: 'Invalid action (use start|stop)' }, { status: 400 });
  return NextResponse.json({ success: true, stats: getGeoWorkerStats() });
});
