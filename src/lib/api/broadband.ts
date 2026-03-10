import { BroadbandData } from '@/types/property';

/**
 * Ofcom Connected Nations data via the Think Broadband API.
 *
 * Ofcom publishes Connected Nations data as CSV downloads, not a REST API.
 * Think Broadband (labs.thinkbroadband.com) aggregates Ofcom data and
 * provides a free JSON API by postcode — widely used in property portals.
 *
 * Fallback: if Think Broadband is unavailable, return null.
 */
export async function getBroadbandData(
  postcode: string
): Promise<BroadbandData | null> {
  try {
    const encoded = encodeURIComponent(postcode.trim().replace(/\s+/g, ''));
    const res = await fetch(
      `https://labs.thinkbroadband.com/local/stats/${encoded}.json`,
      { next: { revalidate: 60 * 60 * 24 * 30 } } // Cache 30 days — data updates quarterly
    );

    if (!res.ok) return null;

    const data = await res.json();

    return {
      averageDownload: parseSpeed(data.AvgDownload || data.avgDownload),
      averageUpload: parseSpeed(data.AvgUpload || data.avgUpload),
      superfast: parsePercent(data.SFBB || data.sfbb),
      ultrafast: parsePercent(data.UFBB || data.ufbb),
      source: 'Ofcom / Think Broadband',
    };
  } catch {
    return null;
  }
}

function parseSpeed(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? null : Math.round(num * 10) / 10;
}

function parsePercent(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? null : Math.round(num * 10) / 10;
}
