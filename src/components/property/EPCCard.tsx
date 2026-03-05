'use client';

import { EPCData } from '@/types/property';
import { Card } from '@/components/ui/Card';
import { getEPCRatingClass, formatDate } from '@/lib/utils/formatting';

interface EPCCardProps {
  epc: EPCData | null;
}

export function EPCCard({ epc }: EPCCardProps) {
  if (!epc) {
    return (
      <Card title="Energy Performance" status="unavailable">
        <p className="text-sm text-gray-500">No EPC data available for this property.</p>
      </Card>
    );
  }

  return (
    <Card title="Energy Performance" subtitle={`Inspected ${formatDate(epc.inspectionDate)}`}>
      <div className="flex items-start gap-4">
        {/* Rating badge */}
        <div className="flex flex-col items-center gap-1">
          <div className={`epc-rating ${getEPCRatingClass(epc.currentEnergyRating)}`}>
            {epc.currentEnergyRating}
          </div>
          <span className="text-xs text-gray-500">{epc.currentEnergyEfficiency}/100</span>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-1.5 text-sm">
          <DetailRow label="Potential" value={`${epc.potentialEnergyRating} (${epc.potentialEnergyEfficiency}/100)`} />
          <DetailRow label="Floor area" value={`${epc.floorArea}m²`} />
          <DetailRow label="Built" value={epc.constructionAgeBand} />
          <DetailRow label="Heating" value={epc.heatingDescription} />
          <DetailRow label="Walls" value={epc.wallsDescription} />
          <DetailRow label="Roof" value={epc.roofDescription} />
          <DetailRow label="CO₂" value={`${epc.co2EmissionsCurrent} tonnes/year`} />
        </div>
      </div>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 min-w-[80px]">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}
