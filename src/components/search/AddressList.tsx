'use client';

import { AddressResult } from '@/types/property';
import { formatAddress } from '@/lib/utils/formatting';

interface AddressListProps {
  addresses: AddressResult[];
  postcode: string;
  onSelect: (address: AddressResult) => void;
}

export function AddressList({ addresses, postcode, onSelect }: AddressListProps) {
  if (addresses.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-500">
          No addresses found for {postcode}. This may mean no EPC certificates exist for properties at this postcode.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 w-full max-w-md">
      <p className="mb-2 text-sm text-gray-600">
        {addresses.length} {addresses.length === 1 ? 'address' : 'addresses'} found
      </p>
      <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm">
        {addresses.map((addr) => (
          <li key={addr.lmkKey}>
            <button
              onClick={() => onSelect(addr)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900">
                {formatAddress(addr.address)}
              </p>
              <p className="text-xs text-gray-500">
                {addr.propertyType}
                {addr.builtForm ? ` · ${addr.builtForm}` : ''}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
