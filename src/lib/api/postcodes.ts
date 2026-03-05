import { PostcodeLookup } from '@/types/property';

const BASE_URL = 'https://api.postcodes.io';

export async function lookupPostcode(postcode: string): Promise<PostcodeLookup | null> {
  const encoded = encodeURIComponent(postcode.trim());
  const res = await fetch(`${BASE_URL}/postcodes/${encoded}`, {
    next: { revalidate: 60 * 60 * 24 * 30 }, // Cache 30 days
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (data.status !== 200 || !data.result) return null;

  const r = data.result;
  return {
    postcode: r.postcode,
    latitude: r.latitude,
    longitude: r.longitude,
    admin_district: r.admin_district,
    parliamentary_constituency: r.parliamentary_constituency,
    region: r.region,
    country: r.country,
    codes: {
      admin_district: r.codes.admin_district,
      parish: r.codes.parish,
    },
  };
}

export async function validatePostcode(postcode: string): Promise<boolean> {
  const encoded = encodeURIComponent(postcode.trim());
  const res = await fetch(`${BASE_URL}/postcodes/${encoded}/validate`);
  if (!res.ok) return false;
  const data = await res.json();
  return data.result === true;
}
