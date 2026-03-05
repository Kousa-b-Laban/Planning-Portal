'use client';

import { FloodRiskData } from '@/types/property';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils/formatting';

interface FloodRiskProps {
  floodRisk: FloodRiskData | null;
}

const floodZoneDescriptions: Record<string, string> = {
  '1': 'Low probability — less than 1 in 1,000 annual probability of flooding',
  '2': 'Medium probability — between 1 in 100 and 1 in 1,000 annual probability',
  '3': 'High probability — 1 in 100 or greater annual probability',
  '3b': 'Functional floodplain — land where water has to flow or be stored in times of flood',
};

export function FloodRisk({ floodRisk }: FloodRiskProps) {
  if (!floodRisk) {
    return (
      <Card title="Flood Risk" status="unavailable">
        <p className="text-sm text-gray-500">Flood risk data unavailable.</p>
      </Card>
    );
  }

  const zoneVariant = floodRisk.floodZone === '1' ? 'success' : floodRisk.floodZone === '2' ? 'warning' : 'danger';

  return (
    <Card title="Flood Risk" subtitle="Environment Agency data">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge label={`Zone ${floodRisk.floodZone}`} variant={zoneVariant} />
          <span className="text-xs text-gray-500">
            {floodZoneDescriptions[floodRisk.floodZone] || ''}
          </span>
        </div>

        {floodRisk.floodWarnings.length > 0 && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-xs font-medium text-red-800">
              {floodRisk.floodWarnings.length} active flood warning{floodRisk.floodWarnings.length !== 1 ? 's' : ''}
            </p>
            {floodRisk.floodWarnings.map((w, i) => (
              <p key={i} className="mt-1 text-xs text-red-700">
                {w.description} ({w.area})
              </p>
            ))}
          </div>
        )}

        {floodRisk.nearestStation && (
          <div className="text-xs text-gray-500">
            <p>Nearest station: {floodRisk.nearestStation.label}</p>
            {floodRisk.nearestStation.riverName && (
              <p>River: {floodRisk.nearestStation.riverName}</p>
            )}
            {floodRisk.nearestStation.latestReading && (
              <p>
                Latest reading: {floodRisk.nearestStation.latestReading.value}
                {floodRisk.nearestStation.latestReading.unit}{' '}
                ({formatDate(floodRisk.nearestStation.latestReading.dateTime)})
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
