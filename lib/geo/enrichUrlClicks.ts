import { prisma } from '@/lib/prisma';
import { geoLookup } from './geoProvider';

export interface EnrichOptions {
  limit?: number;           // how many rows per batch
  dryRun?: boolean;         // if true, do not persist
  log?: boolean;            // verbose logging
}

/**
 * Batch enrichment: find url_click_analytics rows missing country or city but having ip_address.
 * For each row perform geo lookup and update.
 */
export async function enrichUrlClickGeo(opts: EnrichOptions = {}) {
  const limit = opts.limit ?? 100;
  const missing = await prisma.url_click_analytics.findMany({
    where: {
      ip_address: { not: null },
      OR: [
        { country: null },
        { city: null },
      ]
    },
    select: { id: true, ip_address: true },
    take: limit
  });

  if (opts.log) console.log(`[ENRICH] Found ${missing.length} rows needing geo (limit ${limit})`);
  if (!missing.length) return { updated: 0, scanned: 0 };

  let updated = 0;
  for (const row of missing) {
    if (!row.ip_address) continue;
    const geo = await geoLookup(row.ip_address);
    if (!geo) continue;
    if (opts.dryRun) {
      if (opts.log) console.log(`[ENRICH][DRY] Would update ${row.id} -> ${geo.country}/${geo.city}`);
      updated++;
      continue;
    }
    await prisma.url_click_analytics.update({
      where: { id: row.id },
      data: {
        country: geo.country || undefined,
        city: geo.city || undefined,
        region: geo.region || undefined,
        timezone: geo.timezone || undefined,
        isp: geo.isp || undefined,
        latitude: geo.latitude || undefined,
        longitude: geo.longitude || undefined,
      }
    }).catch(() => {});
    updated++;
  }
  return { updated, scanned: missing.length };
}
