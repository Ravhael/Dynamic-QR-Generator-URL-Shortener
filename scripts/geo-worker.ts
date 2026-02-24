/**
 * Standalone Geo Worker Runner
 * Usage (PowerShell):
 *   node -r ts-node/register scripts/geo-worker.ts
 * Environment:
 *   GEO_WORKER_INTERVAL_MS=60000 GEO_WORKER_BATCH_LIMIT=100 AUTO_START_GEO_WORKER=1 GEO_WORKER_VERBOSE=1
 */

import { startGeoWorker, getGeoWorkerStats } from '@/lib/geo/geoWorker';

console.log('[GEO-WORKER] Booting standalone...');
startGeoWorker();

process.on('SIGINT', () => {
  console.log('\n[GEO-WORKER] Stats:', getGeoWorkerStats());
  process.exit(0);
});
