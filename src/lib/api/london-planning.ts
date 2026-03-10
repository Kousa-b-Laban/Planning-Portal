import { NearbyPlanningApp } from '@/types/property';

const BASE_URL = 'https://planningdata.london.gov.uk/api-guest/applications';

/**
 * Planning London Datahub — GLA's planning application API.
 * Free, no authentication required for guest access.
 * Only covers London boroughs. Returns empty array for non-London postcodes.
 */
export async function getLondonPlanningApps(
  lat: number,
  lng: number,
  radiusMetres: number = 500
): Promise<NearbyPlanningApp[]> {
  try {
    // The London Planning Datahub provides a search endpoint
    // with point-and-radius spatial queries
    const res = await fetch(
      `${BASE_URL}?point=${lng},${lat}&radius=${radiusMetres}&size=20&sort=-received_date`,
      { next: { revalidate: 60 * 60 } } // Cache 1 hour
    );

    if (!res.ok) return [];

    const data = await res.json();
    const records = data.records || data.data || data.results || [];
    if (!Array.isArray(records) || records.length === 0) return [];

    return records.map((app: Record<string, unknown>) => ({
      reference: String(app.application_reference || app.lpa_app_no || ''),
      description: String(app.description || app.development_description || ''),
      address: String(app.site_address || app.address || ''),
      status: String(app.status || app.decision || ''),
      decisionDate: app.decision_date ? String(app.decision_date) : null,
      submittedDate: String(app.received_date || app.valid_date || ''),
      distance: Number(app.distance) || 0,
      url: app.url ? String(app.url) : null,
      authority: String(app.lpa_name || app.borough || ''),
    }));
  } catch {
    return [];
  }
}
