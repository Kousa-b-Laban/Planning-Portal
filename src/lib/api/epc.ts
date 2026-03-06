import { AddressResult, EPCData } from '@/types/property';

const BASE_URL = 'https://epc.opendatacommunities.org/api/v1';

function getAuthHeaders(): HeadersInit {
  // EPC API uses HTTP Basic Auth with base64(email:apiKey)
  // Option 1: Set EPC_API_TOKEN to the pre-encoded base64 token from the EPC dashboard
  // Option 2: Set EPC_EMAIL and EPC_API_KEY separately
  const token = process.env.EPC_API_TOKEN;
  if (token) {
    return { Authorization: `Basic ${token}`, Accept: 'application/json' };
  }

  const email = process.env.EPC_EMAIL;
  const apiKey = process.env.EPC_API_KEY;
  if (!email || !apiKey) {
    throw new Error(
      'EPC auth not configured. Set EPC_API_TOKEN (base64 token) or both EPC_EMAIL and EPC_API_KEY. Register free at https://epc.opendatacommunities.org'
    );
  }
  return {
    Authorization: `Basic ${Buffer.from(`${email}:${apiKey}`).toString('base64')}`,
    Accept: 'application/json',
  };
}

export async function searchAddressesByPostcode(
  postcode: string
): Promise<AddressResult[]> {
  const encoded = encodeURIComponent(postcode.trim());
  const res = await fetch(
    `${BASE_URL}/domestic/search?postcode=${encoded}&size=100`,
    {
      headers: getAuthHeaders(),
      next: { revalidate: 60 * 60 * 24 }, // Cache 24 hours
    }
  );

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('EPC API authentication failed — check your EPC_EMAIL + EPC_API_KEY or EPC_API_TOKEN');
    }
    throw new Error(`EPC API returned status ${res.status}`);
  }

  const data = await res.json();
  if (!data.rows || data.rows.length === 0) return [];

  // Deduplicate by address (keep the most recent EPC per address)
  const byAddress = new Map<string, AddressResult>();
  for (const row of data.rows) {
    const address = row.address || '';
    if (!byAddress.has(address)) {
      byAddress.set(address, {
        lmkKey: row['lmk-key'],
        address,
        postcode: row.postcode,
        propertyType: row['property-type'] || '',
        builtForm: row['built-form'] || '',
      });
    }
  }

  return Array.from(byAddress.values()).sort((a, b) =>
    a.address.localeCompare(b.address)
  );
}

export async function getEPCByLmkKey(lmkKey: string): Promise<EPCData | null> {
  const res = await fetch(
    `${BASE_URL}/domestic/certificate/${lmkKey}`,
    {
      headers: getAuthHeaders(),
      next: { revalidate: 60 * 60 * 24 }, // Cache 24 hours
    }
  );

  if (!res.ok) return null;

  const data = await res.json();
  if (!data.rows || data.rows.length === 0) return null;

  const row = data.rows[0];
  return {
    lmkKey: row['lmk-key'],
    address: row.address || '',
    postcode: row.postcode || '',
    currentEnergyRating: row['current-energy-rating'] || '',
    currentEnergyEfficiency: parseInt(row['current-energy-efficiency'] || '0', 10),
    potentialEnergyRating: row['potential-energy-rating'] || '',
    potentialEnergyEfficiency: parseInt(row['potential-energy-efficiency'] || '0', 10),
    propertyType: row['property-type'] || '',
    builtForm: row['built-form'] || '',
    floorArea: parseFloat(row['total-floor-area'] || '0'),
    constructionAgeBand: row['construction-age-band'] || '',
    tenure: row.tenure || '',
    wallsDescription: row['walls-description'] || '',
    roofDescription: row['roof-description'] || '',
    windowsDescription: row['windows-description'] || '',
    heatingDescription: row['mainheat-description'] || '',
    hotWaterDescription: row['hot-water-description'] || '',
    floorDescription: row['floor-description'] || '',
    co2Emissions: parseFloat(row['co2-emiss-curr-per-floor-area'] || '0'),
    co2EmissionsCurrent: parseFloat(row['co2-emissions-current'] || '0'),
    inspectionDate: row['inspection-date'] || '',
    lodgementDate: row['lodgement-date'] || '',
    localAuthorityLabel: row['local-authority-label'] || '',
  };
}
