'use client';

import { PropertyProfile } from '@/types/property';
import { Badge } from '@/components/ui/Badge';
import { formatAddress } from '@/lib/utils/formatting';

interface PropertyHeaderProps {
  property: PropertyProfile;
}

export function PropertyHeader({ property }: PropertyHeaderProps) {
  const { epc, planningConstraints, localAuthority } = property;

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900">
        {formatAddress(property.address)}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {property.postcode} &middot; {localAuthority}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {epc && (
          <>
            <Badge label={epc.propertyType} variant="info" />
            {epc.builtForm && <Badge label={epc.builtForm} variant="neutral" />}
            <Badge label={`${epc.floorArea}m²`} variant="neutral" />
            {epc.tenure && <Badge label={epc.tenure} variant="neutral" />}
          </>
        )}

        {planningConstraints?.conservationArea && (
          <Badge label="Conservation Area" variant="warning" />
        )}
        {planningConstraints?.listedBuilding && (
          <Badge
            label={`Listed (Grade ${planningConstraints.listedBuildingGrade || '?'})`}
            variant="danger"
          />
        )}
        {planningConstraints?.article4Direction && (
          <Badge label="Article 4" variant="warning" />
        )}
        {planningConstraints?.greenBelt && (
          <Badge label="Green Belt" variant="warning" />
        )}
      </div>
    </div>
  );
}
