import { NearbySchool } from '@/types/property';

/**
 * DfE "Get Information About Schools" (GIAS) API.
 * Free, no authentication required.
 * Returns establishments near a point with Ofsted rating, phase, and type.
 *
 * Uses the Establishment Search endpoint which supports lat/lng + distance.
 */
const GIAS_API = 'https://api.education.gov.uk/gias/establishments';

export async function getNearbySchools(
  lat: number,
  lng: number,
  radiusKm: number = 1
): Promise<NearbySchool[]> {
  try {
    // GIAS search-by-location endpoint
    const res = await fetch(
      `${GIAS_API}?latitude=${lat}&longitude=${lng}&distance=${radiusKm}&top=15&status=1`, // status=1 = Open schools only
      {
        headers: { Accept: 'application/json' },
        next: { revalidate: 60 * 60 * 24 * 7 }, // Cache 7 days
      }
    );

    if (!res.ok) return [];

    const data = await res.json();
    const establishments = data?.value || data?.establishments || data;
    if (!Array.isArray(establishments) || establishments.length === 0) return [];

    return establishments
      .map((school: Record<string, unknown>) => {
        const schoolLat = Number(school.latitude) || 0;
        const schoolLng = Number(school.longitude) || 0;

        return {
          name: String(school.establishmentName || school.name || ''),
          phase: normalisePhase(String(school.phaseOfEducation || school.phase || '')),
          type: String(school.typeOfEstablishment || school.type || ''),
          ofstedRating: normaliseOfsted(String(school.ofstedRating || school.overallEffectiveness || '')),
          ageRange: buildAgeRange(school),
          distance: Math.round(haversineDistance(lat, lng, schoolLat, schoolLng)),
          urn: String(school.urn || school.URN || ''),
        };
      })
      .filter((s: NearbySchool) => s.phase !== 'Other' && s.name.length > 0)
      .sort((a: NearbySchool, b: NearbySchool) => a.distance - b.distance)
      .slice(0, 10);
  } catch {
    return [];
  }
}

function normalisePhase(phase: string): string {
  const lower = phase.toLowerCase();
  if (lower.includes('primary') || lower.includes('infant') || lower.includes('junior')) return 'Primary';
  if (lower.includes('secondary')) return 'Secondary';
  if (lower.includes('16 plus') || lower.includes('post-16') || lower.includes('sixth')) return 'Sixth Form';
  if (lower.includes('all-through') || lower.includes('all through')) return 'All-through';
  if (lower.includes('nursery')) return 'Nursery';
  if (lower.includes('special')) return 'Special';
  if (lower.includes('not applicable')) return 'Other';
  return phase || 'Other';
}

function normaliseOfsted(rating: string): string | null {
  const lower = rating.toLowerCase().trim();
  if (lower === '1' || lower.includes('outstanding')) return 'Outstanding';
  if (lower === '2' || lower.includes('good')) return 'Good';
  if (lower === '3' || lower.includes('requires improvement')) return 'Requires Improvement';
  if (lower === '4' || lower.includes('inadequate')) return 'Inadequate';
  return null; // Not yet inspected or unknown
}

function buildAgeRange(school: Record<string, unknown>): string | null {
  const low = school.statutoryLowAge || school.lowAge;
  const high = school.statutoryHighAge || school.highAge;
  if (low !== undefined && high !== undefined) {
    return `${low}-${high}`;
  }
  return null;
}

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
