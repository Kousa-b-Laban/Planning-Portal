import { TransportData, NearestStation } from '@/types/property';

const BASE_URL = 'https://api.tfl.gov.uk';

/**
 * TfL Unified API — find nearest stations/stops to a coordinate.
 * Free, no API key required for basic usage (rate-limited).
 * Optional: set TFL_APP_KEY env var for higher rate limits.
 */
export async function getNearestStations(
  lat: number,
  lng: number
): Promise<TransportData> {
  try {
    const appKey = process.env.TFL_APP_KEY;
    const authParam = appKey ? `&app_key=${appKey}` : '';

    // StopPoint endpoint: find stops within radius of a point
    // stoptypes: NaptanMetroStation (tube), NaptanRailStation (rail), NaptanPublicBusCoachTram
    const stopTypes = 'NaptanMetroStation,NaptanRailStation,NaptanPublicBusCoachTram';
    const res = await fetch(
      `${BASE_URL}/StopPoint?lat=${lat}&lon=${lng}&stopTypes=${stopTypes}&radius=1500${authParam}`,
      { next: { revalidate: 60 * 60 * 24 } } // Cache 24 hours
    );

    if (!res.ok) return { nearestStations: [] };

    const data = await res.json();
    if (!data.stopPoints || !Array.isArray(data.stopPoints)) {
      return { nearestStations: [] };
    }

    const stations: NearestStation[] = data.stopPoints
      .slice(0, 5)
      .map((stop: Record<string, unknown>) => {
        const lines = Array.isArray(stop.lines)
          ? (stop.lines as { name: string }[]).map((l) => l.name)
          : [];
        const modes = Array.isArray(stop.modes) ? (stop.modes as string[]) : [];

        return {
          name: String(stop.commonName || ''),
          distance: Math.round(Number(stop.distance) || 0),
          lines,
          modes,
        };
      });

    return { nearestStations: stations };
  } catch {
    return { nearestStations: [] };
  }
}
