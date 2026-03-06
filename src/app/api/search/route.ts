import { NextRequest, NextResponse } from 'next/server';
import { lookupPostcode } from '@/lib/api/postcodes';
import { searchAddressesByPostcodeOS } from '@/lib/api/os-places';
import { searchAddressesByPostcode as searchAddressesByPostcodeEPC } from '@/lib/api/epc';

export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get('postcode');

  if (!postcode) {
    return NextResponse.json(
      { error: 'Postcode is required' },
      { status: 400 }
    );
  }

  try {
    // Validate postcode and get coordinates
    const postcodeData = await lookupPostcode(postcode);
    if (!postcodeData) {
      return NextResponse.json(
        { error: 'Invalid postcode or postcode not found' },
        { status: 404 }
      );
    }

    // Only support England for MVP
    if (postcodeData.country !== 'England') {
      return NextResponse.json(
        { error: 'This service currently only covers England. Scotland, Wales, and Northern Ireland are not yet supported.' },
        { status: 400 }
      );
    }

    let addresses: Awaited<ReturnType<typeof searchAddressesByPostcodeOS>> = [];
    let warning: string | undefined;
    let source: 'os-places' | 'epc' = 'os-places';

    // Primary: OS Places API (covers all addressable properties)
    try {
      addresses = await searchAddressesByPostcodeOS(postcode);
    } catch (osError) {
      const msg = osError instanceof Error ? osError.message : 'OS Places lookup failed';
      console.error('OS Places API error:', msg);

      // Fallback: EPC register (only properties with EPC certificates)
      try {
        addresses = await searchAddressesByPostcodeEPC(postcode);
        source = 'epc';
        warning = 'Using EPC register as fallback — some properties without EPC certificates may not appear.';
      } catch (epcError) {
        const epcMsg = epcError instanceof Error ? epcError.message : 'EPC lookup also failed';
        console.error('EPC API fallback error:', epcMsg);
        warning = `Address lookup unavailable: ${msg}`;
      }
    }

    return NextResponse.json({
      postcode: postcodeData,
      addresses,
      source,
      warning,
    });
  } catch (error) {
    console.error('Search API error:', error);
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
