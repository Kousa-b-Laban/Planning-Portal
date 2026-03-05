import { NextRequest, NextResponse } from 'next/server';
import { lookupPostcode } from '@/lib/api/postcodes';
import { searchAddressesByPostcode } from '@/lib/api/epc';

export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get('postcode');

  if (!postcode) {
    return NextResponse.json(
      { error: 'Postcode is required' },
      { status: 400 }
    );
  }

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

  // Search EPC register for addresses at this postcode
  const addresses = await searchAddressesByPostcode(postcode);

  return NextResponse.json({
    postcode: postcodeData,
    addresses,
  });
}
