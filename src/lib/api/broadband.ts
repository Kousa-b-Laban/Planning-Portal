import { BroadbandData } from '@/types/property';

/**
 * Broadband speed data — tries Ofcom official API first, falls back to Think Broadband.
 *
 * Option 1: Ofcom Connected Nations API (api-proxy.ofcom.org.uk)
 *   - Requires free subscription key (OFCOM_API_KEY env var)
 *   - Returns per-premise predicted speeds
 *
 * Option 2: Think Broadband (labs.thinkbroadband.com)
 *   - Aggregates Ofcom data, free JSON API by postcode, no auth
 */
export async function getBroadbandData(
  postcode: string
): Promise<BroadbandData | null> {
  // Try Ofcom official API first if key is configured
  const ofcomKey = process.env.OFCOM_API_KEY;
  if (ofcomKey) {
    const result = await fetchOfcomData(postcode, ofcomKey);
    if (result) return result;
  }

  // Fallback: Think Broadband
  return fetchThinkBroadband(postcode);
}

async function fetchOfcomData(
  postcode: string,
  apiKey: string
): Promise<BroadbandData | null> {
  try {
    // Ofcom requires uppercase, no spaces
    const clean = postcode.trim().replace(/\s+/g, '').toUpperCase();
    const res = await fetch(
      `https://api-proxy.ofcom.org.uk/broadband/coverage/${clean}`,
      {
        headers: { 'Ocp-Apim-Subscription-Key': apiKey },
        next: { revalidate: 60 * 60 * 24 * 30 }, // Cache 30 days
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const premises = data.Availability;
    if (!Array.isArray(premises) || premises.length === 0) return null;

    // Aggregate across all premises in the postcode
    let totalDown = 0;
    let totalUp = 0;
    let sfCount = 0;
    let ufCount = 0;
    let count = 0;

    for (const p of premises) {
      const down = Number(p.maxPredictedDown);
      const up = Number(p.maxPredictedUp);
      if (down > 0) {
        totalDown += down;
        totalUp += Math.max(0, up);
        count++;
        if (down >= 30) sfCount++;
        if (down >= 300) ufCount++;
      }
    }

    if (count === 0) return null;

    return {
      averageDownload: Math.round((totalDown / count) * 10) / 10,
      averageUpload: Math.round((totalUp / count) * 10) / 10,
      superfast: Math.round((sfCount / count) * 1000) / 10,
      ultrafast: Math.round((ufCount / count) * 1000) / 10,
      source: 'Ofcom Connected Nations',
    };
  } catch {
    return null;
  }
}

async function fetchThinkBroadband(
  postcode: string
): Promise<BroadbandData | null> {
  try {
    const encoded = encodeURIComponent(postcode.trim().replace(/\s+/g, ''));
    const res = await fetch(
      `https://labs.thinkbroadband.com/local/stats/${encoded}.json`,
      { next: { revalidate: 60 * 60 * 24 * 30 } }
    );

    if (!res.ok) return null;

    const data = await res.json();

    return {
      averageDownload: parseNum(data.AvgDownload || data.avgDownload),
      averageUpload: parseNum(data.AvgUpload || data.avgUpload),
      superfast: parseNum(data.SFBB || data.sfbb),
      ultrafast: parseNum(data.UFBB || data.ufbb),
      source: 'Ofcom / Think Broadband',
    };
  } catch {
    return null;
  }
}

function parseNum(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? null : Math.round(num * 10) / 10;
}
