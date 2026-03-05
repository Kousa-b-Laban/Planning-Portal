'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PropertyProfile } from '@/types/property';
import { PropertyHeader } from '@/components/property/PropertyHeader';
import { EPCCard } from '@/components/property/EPCCard';
import { TransactionHistory } from '@/components/property/TransactionHistory';
import { FloodRisk } from '@/components/property/FloodRisk';
import { PlanningConstraintsCard } from '@/components/property/PlanningConstraints';
import { NearbyPlanning } from '@/components/property/NearbyPlanning';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { CardSkeleton } from '@/components/ui/Skeleton';

export default function PropertyPage() {
  const searchParams = useSearchParams();
  const [property, setProperty] = useState<PropertyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const lmkKey = searchParams.get('lmkKey');
  const postcode = searchParams.get('postcode');
  const address = searchParams.get('address');

  useEffect(() => {
    if (!lmkKey || !postcode) {
      setError('Missing property identifier');
      setIsLoading(false);
      return;
    }

    async function fetchProperty() {
      try {
        const params = new URLSearchParams({
          lmkKey: lmkKey!,
          postcode: postcode!,
          ...(address ? { address } : {}),
        });
        const res = await fetch(`/api/property?${params}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load property');
        }
        const data = await res.json();
        setProperty(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load property');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProperty();
  }, [lmkKey, postcode, address]);

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <a
            href="/"
            className="mt-3 inline-block text-sm text-primary-600 hover:underline"
          >
            Back to search
          </a>
        </div>
      </div>
    );
  }

  if (isLoading || !property) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="animate-pulse">
            <div className="h-8 w-72 rounded bg-gray-200 mb-2" />
            <div className="h-4 w-48 rounded bg-gray-200" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-4">
        <a
          href="/"
          className="text-sm text-primary-600 hover:underline"
        >
          &larr; Back to search
        </a>
      </div>

      <PropertyHeader property={property} />

      <div className="grid gap-6 lg:grid-cols-2">
        <EPCCard epc={property.epc} />
        <TransactionHistory transactions={property.transactions} />
        <FloodRisk floodRisk={property.floodRisk} />
        <PlanningConstraintsCard
          constraints={property.planningConstraints}
          magic={property.magicDesignations}
        />
        <div className="lg:col-span-2">
          <NearbyPlanning apps={property.nearbyPlanningApps} />
        </div>
      </div>

      {/* Chat panel - floating */}
      <ChatPanel property={property} />
    </div>
  );
}
