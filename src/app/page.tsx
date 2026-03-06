'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PostcodeSearch } from '@/components/search/PostcodeSearch';
import { AddressList } from '@/components/search/AddressList';
import { AddressResult, PostcodeLookup } from '@/types/property';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<AddressResult[]>([]);
  const [searchedPostcode, setSearchedPostcode] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  async function handleSearch(postcode: string) {
    setIsLoading(true);
    setError(null);
    setWarning(null);
    setAddresses([]);
    setHasSearched(false);

    try {
      const res = await fetch(
        `/api/search?postcode=${encodeURIComponent(postcode)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Search failed');
        return;
      }

      setAddresses(data.addresses);
      setSearchedPostcode((data.postcode as PostcodeLookup).postcode);
      setHasSearched(true);
      if (data.warning) setWarning(data.warning);
    } catch {
      setError('Network error — please try again');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelect(address: AddressResult) {
    const id = address.uprn || address.lmkKey || address.address;
    const params = new URLSearchParams({
      postcode: address.postcode,
      address: address.address,
      ...(address.uprn ? { uprn: address.uprn } : {}),
      ...(address.lmkKey ? { lmkKey: address.lmkKey } : {}),
      ...(address.latitude ? { lat: String(address.latitude) } : {}),
      ...(address.longitude ? { lng: String(address.longitude) } : {}),
    });
    router.push(`/property/${encodeURIComponent(id)}?${params}`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center">
        <h1 className="text-4xl font-bold text-gray-900 text-center">
          UK Property Intelligence
        </h1>
        <p className="mt-3 max-w-lg text-center text-gray-500">
          Look up any property in England. Get energy ratings, price history,
          flood risk, planning constraints, and AI-powered planning permission
          guidance.
        </p>

        <div className="mt-8">
          <PostcodeSearch onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {warning && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
            {warning}
          </div>
        )}

        {hasSearched && addresses.length === 0 && !error && !warning && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
            No addresses found for {searchedPostcode}.
          </div>
        )}

        {addresses.length > 0 && (
          <AddressList
            addresses={addresses}
            postcode={searchedPostcode}
            onSelect={handleSelect}
          />
        )}

        {/* Feature overview */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          {[
            {
              title: 'Energy Performance',
              desc: 'EPC ratings, floor area, heating, insulation details from the official EPC register.',
            },
            {
              title: 'Price History',
              desc: 'Every recorded sale from HM Land Registry since 1995.',
            },
            {
              title: 'Flood Risk',
              desc: 'Real-time flood warnings and zone data from the Environment Agency.',
            },
            {
              title: 'Planning Constraints',
              desc: 'Conservation areas, listed buildings, Article 4 directions, Green Belt, SSSI, AONB.',
            },
            {
              title: 'Nearby Planning',
              desc: 'Recent planning applications within 500m from PlanIt.',
            },
            {
              title: 'AI Planning Advisor',
              desc: 'Ask our chatbot about planning permission, building regs, and permitted development.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-gray-200 bg-white p-5"
            >
              <h3 className="text-sm font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="mt-1 text-xs text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
