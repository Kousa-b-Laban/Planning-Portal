import { NextRequest, NextResponse } from 'next/server';
import { lookupPostcode } from '@/lib/api/postcodes';
import { getEPCByLmkKey } from '@/lib/api/epc';
import { getTransactionHistory } from '@/lib/api/land-registry';
import { getFloodRisk } from '@/lib/api/flood';
import { getPlanningConstraints, getNearbyPlanningApps } from '@/lib/api/planning';
import { getMagicDesignations } from '@/lib/api/magic';
import { PropertyProfile } from '@/types/property';

export async function GET(request: NextRequest) {
  const lmkKey = request.nextUrl.searchParams.get('lmkKey');
  const postcode = request.nextUrl.searchParams.get('postcode');
  const address = request.nextUrl.searchParams.get('address');

  if (!lmkKey || !postcode) {
    return NextResponse.json(
      { error: 'lmkKey and postcode are required' },
      { status: 400 }
    );
  }

  // Get postcode coordinates
  const postcodeData = await lookupPostcode(postcode);
  if (!postcodeData) {
    return NextResponse.json(
      { error: 'Could not resolve postcode' },
      { status: 404 }
    );
  }

  const { latitude, longitude, admin_district } = postcodeData;

  // Fire all data requests in parallel — each one gracefully handles its own errors
  const [epc, transactions, floodRisk, planningConstraints, nearbyPlanningApps, magicDesignations] =
    await Promise.all([
      getEPCByLmkKey(lmkKey).catch(() => null),
      getTransactionHistory(postcode, address || '').catch(() => []),
      getFloodRisk(latitude, longitude).catch(() => null),
      getPlanningConstraints(latitude, longitude).catch(() => null),
      getNearbyPlanningApps(latitude, longitude).catch(() => []),
      getMagicDesignations(latitude, longitude).catch(() => null),
    ]);

  const profile: PropertyProfile = {
    address: address || epc?.address || 'Unknown address',
    postcode,
    latitude,
    longitude,
    localAuthority: admin_district,
    epc,
    transactions,
    floodRisk,
    planningConstraints,
    nearbyPlanningApps,
    magicDesignations,
  };

  return NextResponse.json(profile);
}
