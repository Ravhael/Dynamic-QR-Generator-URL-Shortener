import { enrichUrlClickGeo } from './enrichUrlClicks';

interface WorkerStats {
  running: boolean;
  lastRun?: string;
  totalUpdated: number;
  totalScanned: number;
  runs: number;
  lastBatch?: { updated: number; scanned: number };
  intervalMs: number;
}

const state: WorkerStats = {
  running: false,
  totalUpdated: 0,
  totalScanned: 0,
  runs: 0,
  intervalMs: parseInt(process.env.GEO_WORKER_INTERVAL_MS || '60000', 10)
};

let timer: NodeJS.Timeout | null = null;

async function tick() {
  try {
    const limit = parseInt(process.env.GEO_WORKER_BATCH_LIMIT || '100', 10);
    const batch = await enrichUrlClickGeo({ limit, log: !!process.env.GEO_WORKER_VERBOSE });
    state.lastRun = new Date().toISOString();
    state.lastBatch = batch;
    state.totalUpdated += batch.updated;
    state.totalScanned += batch.scanned;
    state.runs += 1;
    if (process.env.GEO_WORKER_VERBOSE) {
      console.log(`[GEO-WORKER] run #${state.runs} updated=${batch.updated} scanned=${batch.scanned}`);
    }
  } catch (e: any) {
    console.warn('[GEO-WORKER] error:', e.message);
  }
  schedule();
}

function schedule() {
  if (!state.running) return;
  timer = setTimeout(tick, state.intervalMs);
}

export function startGeoWorker() {
  if (state.running) return state;
  state.running = true;
  schedule();
  if (process.env.GEO_WORKER_VERBOSE) console.log('[GEO-WORKER] started');
  return state;
}

export function stopGeoWorker() {
  state.running = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (process.env.GEO_WORKER_VERBOSE) console.log('[GEO-WORKER] stopped');
  return state;
}

export function getGeoWorkerStats(): WorkerStats {
  return { ...state };
}

// Auto-start if env flag set (ONLY in server runtime, not build):
if (process.env.AUTO_START_GEO_WORKER === '1') {
  startGeoWorker();
}
