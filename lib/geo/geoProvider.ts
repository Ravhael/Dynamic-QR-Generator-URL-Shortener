/**
 * Geo Provider Stub
 * ------------------
 * Abstraction layer so we can plug different IP -> Geo providers (MaxMind, IP2Location, free API, etc.).
 * For now returns null (no data) or mocked data when MOCK_GEO=1.
 */

export interface GeoResult {
  ip: string;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  isp?: string | null;
}

export interface GeoProvider {
  lookup(ip: string): Promise<GeoResult | null>;
}

class MockGeoProvider implements GeoProvider {
  async lookup(ip: string): Promise<GeoResult | null> {
    if (!process.env.MOCK_GEO) return null;
    // naive hash for deterministic fake city
    const hash = ip.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    const cities = ['Jakarta','Bandung','Surabaya','Medan','Makassar'];
    const city = cities[hash % cities.length];
    return {
      ip,
      country: 'Indonesia',
      city,
      region: 'ID-' + (hash % 34 + 1).toString().padStart(2,'0'),
      latitude: -6.2,
      longitude: 106.8,
      timezone: 'Asia/Jakarta',
      isp: 'Mock ISP'
    };
  }
}

let provider: GeoProvider = new MockGeoProvider();

export function setGeoProvider(p: GeoProvider) {
  provider = p;
}

export async function geoLookup(ip: string): Promise<GeoResult | null> {
  if (!ip || ip === '0.0.0.0') return null;
  try {
    return await provider.lookup(ip);
  } catch {
    return null;
  }
}
