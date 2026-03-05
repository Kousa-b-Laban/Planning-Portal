import { FloodRiskData, FloodWarning, FloodStation } from '@/types/property';

const BASE_URL = 'https://environment.data.gov.uk/flood-monitoring';

export async function getFloodRisk(
  lat: number,
  lng: number
): Promise<FloodRiskData> {
  // Fetch flood warnings and nearest station in parallel
  const [warnings, station] = await Promise.all([
    getFloodWarnings(lat, lng),
    getNearestFloodStation(lat, lng),
  ]);

  // Determine flood zone from warnings and station data
  // Note: The real-time API doesn't directly provide flood zones.
  // For a proper flood zone lookup, you'd use the EA flood map API.
  // For MVP, we infer from active warnings.
  let floodZone = '1'; // Default: low risk
  if (warnings.length > 0) {
    const maxSeverity = Math.min(...warnings.map((w) => w.severityLevel));
    if (maxSeverity <= 2) floodZone = '3';
    else if (maxSeverity === 3) floodZone = '2';
  }

  return {
    floodZone,
    floodWarnings: warnings,
    nearestStation: station,
  };
}

async function getFloodWarnings(
  lat: number,
  lng: number
): Promise<FloodWarning[]> {
  try {
    const res = await fetch(
      `${BASE_URL}/id/floods?lat=${lat}&long=${lng}&dist=3`,
      { next: { revalidate: 60 * 60 } } // Cache 1 hour
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.items)) return [];

    return data.items.map((item: Record<string, unknown>) => ({
      severity: String(item.severity || ''),
      severityLevel: Number(item.severityLevel) || 4,
      description: String(item.description || ''),
      area: (item.floodArea as Record<string, string>)?.label || '',
      timeRaised: String(item.timeRaised || ''),
    }));
  } catch {
    return [];
  }
}

async function getNearestFloodStation(
  lat: number,
  lng: number
): Promise<FloodStation | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/id/stations?lat=${lat}&long=${lng}&dist=3&_limit=1`,
      { next: { revalidate: 60 * 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.items) || data.items.length === 0) return null;

    const station = data.items[0];
    const measures = Array.isArray(station.measures)
      ? station.measures
      : station.measures
        ? [station.measures]
        : [];

    const latestReading = measures[0]?.latestReading;

    return {
      stationReference: station.stationReference || '',
      label: station.label || '',
      riverName: station.riverName || '',
      latestReading: latestReading
        ? {
            value: Number(latestReading.value) || 0,
            dateTime: String(latestReading.dateTime || ''),
            unit: measures[0]?.unitName || 'm',
          }
        : null,
    };
  } catch {
    return null;
  }
}
