import { NextRequest, NextResponse } from 'next/server';
import { lookupPostcode } from '@/lib/api/postcodes';
import { getEPCByLmkKey, getEPCByAddress } from '@/lib/api/epc';
import { getTransactionHistory } from '@/lib/api/land-registry';
import { getFloodRisk } from '@/lib/api/flood';
import { getPlanningConstraints, getNearbyPlanningApps } from '@/lib/api/planning';
import { getMagicDesignations } from '@/lib/api/magic';
import { getNearestStations } from '@/lib/api/tfl';
import { getCrimeSummary } from '@/lib/api/police';
import { getBroadbandData } from '@/lib/api/broadband';
import { getLondonPlanningApps } from '@/lib/api/london-planning';
import { getBoroughConfig } from '@/lib/borough';
import { PropertyProfile, BoroughInfo } from '@/types/property';

export async function GET(request: NextRequest) {
  const uprn = request.nextUrl.searchParams.get('uprn');
  const lmkKey = request.nextUrl.searchParams.get('lmkKey');
  const postcode = request.nextUrl.searchParams.get('postcode');
  const address = request.nextUrl.searchParams.get('address');
  const lat = request.nextUrl.searchParams.get('lat');
  const lng = request.nextUrl.searchParams.get('lng');

  if (!postcode) {
    return NextResponse.json(
      { error: 'postcode is required' },
      { status: 400 }
    );
  }

  if (!uprn && !lmkKey) {
    return NextResponse.json(
      { error: 'uprn or lmkKey is required' },
      { status: 400 }
    );
  }

  // Resolve coordinates: use per-property lat/lng if available, else fall back to postcode centroid
  let latitude = lat ? parseFloat(lat) : 0;
  let longitude = lng ? parseFloat(lng) : 0;
  let admin_district = '';

  const postcodeData = await lookupPostcode(postcode);
  if (!postcodeData) {
    return NextResponse.json(
      { error: 'Could not resolve postcode' },
      { status: 404 }
    );
  }

  admin_district = postcodeData.admin_district;
  if (!latitude || !longitude) {
    latitude = postcodeData.latitude;
    longitude = postcodeData.longitude;
  }

  // Fire all data requests in parallel — each one gracefully handles its own errors
  const epcPromise = lmkKey
    ? getEPCByLmkKey(lmkKey).catch(() => null)
    : address
      ? getEPCByAddress(postcode, address).catch(() => null)
      : Promise.resolve(null);

  const [epc, transactions, floodRisk, planningConstraints, nearbyPlanningApps, magicDesignations, transport, crime, broadband, londonApps] =
    await Promise.all([
      epcPromise,
      getTransactionHistory(postcode, address || '').catch(() => []),
      getFloodRisk(latitude, longitude).catch(() => null),
      getPlanningConstraints(latitude, longitude).catch(() => null),
      getNearbyPlanningApps(latitude, longitude).catch(() => []),
      getMagicDesignations(latitude, longitude).catch(() => null),
      getNearestStations(latitude, longitude).catch(() => null),
      getCrimeSummary(latitude, longitude).catch(() => null),
      getBroadbandData(postcode).catch(() => null),
      getLondonPlanningApps(latitude, longitude).catch(() => []),
    ]);

  // Merge London Datahub results with PlanIt results, dedup by reference
  const allPlanningApps = [...nearbyPlanningApps];
  const existingRefs = new Set(allPlanningApps.map((a) => a.reference));
  for (const app of londonApps) {
    if (!existingRefs.has(app.reference)) {
      allPlanningApps.push(app);
    }
  }

  // Build borough-specific info if config exists for this local authority
  let borough: BoroughInfo | null = null;
  const boroughConfig = getBoroughConfig(admin_district);
  if (boroughConfig) {
    borough = {
      name: boroughConfig.name,
      planningPortalUrl: boroughConfig.planningPortalUrl,
      cilRateResidential: boroughConfig.cilRateResidential,
      mayoralCilRate: boroughConfig.mayoralCilRate,
      conservationAreaCount: boroughConfig.conservationAreaCount,
      article4Count: boroughConfig.article4Directions.length,
      planningContact: boroughConfig.planningContact,
    };
  }

  const profile: PropertyProfile = {
    address: address || epc?.address || 'Unknown address',
    postcode,
    latitude,
    longitude,
    localAuthority: admin_district,
    uprn: uprn || undefined,
    epc,
    transactions,
    floodRisk,
    planningConstraints,
    nearbyPlanningApps: allPlanningApps,
    magicDesignations,
    transport,
    crime,
    broadband,
    borough,
  };

  return NextResponse.json(profile);
}
