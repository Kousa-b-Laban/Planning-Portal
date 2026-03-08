import { AddressResult } from '@/types/property';

const BASE_URL = 'https://api.os.uk/search/places/v1';

function getApiKey(): string {
  const key = process.env.OS_PLACES_API_KEY;
  if (!key) {
    throw new Error(
      'OS_PLACES_API_KEY not configured. Get a free API key at https://osdatahub.os.uk'
    );
  }
  return key;
}

// Classification codes → human-readable property type
function classifyProperty(code: string): string {
  if (!code) return '';
  const prefix = code.substring(0, 4);
  const map: Record<string, string> = {
    RD01: 'Detached',
    RD02: 'Semi-Detached',
    RD03: 'Detached',
    RD04: 'Terraced',
    RD06: 'Flat',
    RD07: 'Flat',
    RD08: 'Flat',
    RD10: 'Sheltered Accommodation',
  };
  if (map[prefix]) return map[prefix];
  if (code.startsWith('RD')) return 'Dwelling';
  if (code.startsWith('RH')) return 'HMO';
  if (code.startsWith('RI')) return 'Residential Institution';
  if (code.startsWith('C')) return 'Commercial';
  return '';
}

export interface OSPlaceResult {
  uprn: string;
  address: string;
  postcode: string;
  latitude: number;
  longitude: number;
  classificationCode: string;
  propertyType: string;
  localCustodian: string;
}

export async function searchAddressesByPostcodeOS(
  postcode: string
): Promise<AddressResult[]> {
  const key = getApiKey();
  const encoded = encodeURIComponent(postcode.trim());
  const byUprn = new Map<string, AddressResult>();
  let offset = 0;
  const pageSize = 100;

  // Paginate through all results (API caps at 100 per request)
  while (true) {
    const res = await fetch(
      `${BASE_URL}/postcode?postcode=${encoded}&key=${key}&dataset=DPA&maxresults=${pageSize}&offset=${offset}`,
      {
        next: { revalidate: 60 * 60 * 24 }, // Cache 24 hours
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('OS Places API key is invalid — check OS_PLACES_API_KEY');
      }
      throw new Error(`OS Places API returned status ${res.status}`);
    }

    const data = await res.json();
    if (!data.results || data.results.length === 0) break;

    for (const result of data.results) {
      const dpa = result.DPA;
      if (!dpa) continue;

      const uprn = dpa.UPRN;
      if (byUprn.has(uprn)) continue;

      byUprn.set(uprn, {
        uprn,
        address: dpa.ADDRESS || '',
        postcode: dpa.POSTCODE || postcode.trim(),
        propertyType: classifyProperty(dpa.CLASSIFICATION_CODE || ''),
        builtForm: dpa.CLASSIFICATION_CODE_DESCRIPTION || '',
        latitude: dpa.LAT || 0,
        longitude: dpa.LNG || 0,
      });
    }

    const totalResults = data.header?.totalresults ?? 0;
    offset += pageSize;
    if (offset >= totalResults) break;
  }

  return Array.from(byUprn.values()).sort((a, b) =>
    a.address.localeCompare(b.address)
  );
}
