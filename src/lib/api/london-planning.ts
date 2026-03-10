import { NearbyPlanningApp } from '@/types/property';

const BASE_URL = 'https://planningdata.london.gov.uk/api-guest/applications';
// Publicly documented guest token for read-only access
const GUEST_HEADER = 'be2rmRnt&';

interface ESHit {
  _source: Record<string, unknown>;
}

/**
 * Planning London Datahub — GLA's planning application API.
 * Uses Elasticsearch under the hood. Free guest read access via header.
 * Only covers London boroughs. Returns empty array for non-London areas.
 */
export async function getLondonPlanningApps(
  lat: number,
  lng: number,
  radiusKm: string = '1km'
): Promise<NearbyPlanningApp[]> {
  try {
    const res = await fetch(`${BASE_URL}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-AllowRequest': GUEST_HEADER,
      },
      body: JSON.stringify({
        size: 20,
        sort: [{ decision_date: { order: 'desc', unmapped_type: 'date' } }],
        query: {
          bool: {
            filter: {
              geo_distance: {
                distance: radiusKm,
                location: { lat, lon: lng },
              },
            },
          },
        },
        _source: [
          'application_reference',
          'lpa_name',
          'development_description',
          'decision',
          'decision_date',
          'status',
          'site_address',
          'valid_date',
        ],
      }),
      next: { revalidate: 60 * 60 }, // Cache 1 hour
    });

    if (!res.ok) return [];

    const data = await res.json();
    const hits: ESHit[] = data.hits?.hits || [];
    if (hits.length === 0) return [];

    return hits.map((hit) => {
      const s = hit._source;
      return {
        reference: String(s.application_reference || ''),
        description: String(s.development_description || ''),
        address: String(s.site_address || ''),
        status: String(s.status || s.decision || ''),
        decisionDate: s.decision_date ? String(s.decision_date) : null,
        submittedDate: String(s.valid_date || ''),
        distance: 0, // ES geo_distance doesn't return distance by default
        url: null,
        authority: String(s.lpa_name || ''),
      };
    });
  } catch {
    return [];
  }
}
