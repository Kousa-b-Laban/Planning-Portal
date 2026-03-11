import { BrownfieldSite } from '@/types/property';

const PLANNING_DATA_URL = 'https://www.planning.data.gov.uk';

/**
 * DLUHC Planning Data Platform — Brownfield Land Register.
 * Free, no auth. Returns brownfield sites near a point.
 * These are sites that councils have identified as suitable for housing development.
 */
export async function getNearbyBrownfieldSites(
  lat: number,
  lng: number
): Promise<BrownfieldSite[]> {
  try {
    // Query brownfield-land dataset within ~500m using bounding box
    // The API doesn't support radius queries for lists, so we use a tight bbox
    const delta = 0.005; // ~500m at London latitudes
    const res = await fetch(
      `${PLANNING_DATA_URL}/api/v1/entity.json?dataset=brownfield-land&longitude_min=${lng - delta}&longitude_max=${lng + delta}&latitude_min=${lat - delta}&latitude_max=${lat + delta}&limit=10`,
      { next: { revalidate: 60 * 60 * 24 * 7 } } // Cache 7 days — register updates annually
    );

    if (!res.ok) return [];

    const data = await res.json();
    const entities = data?.entities;
    if (!Array.isArray(entities) || entities.length === 0) return [];

    return entities.map((e: Record<string, unknown>) => {
      const siteLat = Number(e.latitude) || 0;
      const siteLng = Number(e.longitude) || 0;

      return {
        name: String(e.name || e['site-address'] || 'Unnamed site'),
        address: String(e['site-address'] || e.name || ''),
        hectares: parseFloat(String(e.hectares || '0')) || null,
        minDwellings: parseInt(String(e['minimum-net-dwellings'] || '0'), 10) || null,
        planningStatus: String(e['planning-permission-status'] || ''),
        lastUpdated: String(e['entry-date'] || e['start-date'] || ''),
        distance: Math.round(haversineDistance(lat, lng, siteLat, siteLng)),
        organisation: String(e.organisation || ''),
      };
    })
    .sort((a, b) => a.distance - b.distance);
  } catch {
    return [];
  }
}

/** Haversine distance between two points in metres */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
