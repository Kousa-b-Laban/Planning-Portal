'use client';

import { TransportData } from '@/types/property';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface TransportCardProps {
  transport: TransportData | null;
}

const modeLabels: Record<string, string> = {
  tube: 'Tube',
  bus: 'Bus',
  'national-rail': 'Rail',
  overground: 'Overground',
  dlr: 'DLR',
  'elizabeth-line': 'Elizabeth line',
  tram: 'Tram',
  coach: 'Coach',
};

export function TransportCard({ transport }: TransportCardProps) {
  if (!transport || transport.nearestStations.length === 0) {
    return (
      <Card title="Transport" status="unavailable">
        <p className="text-sm text-gray-500">Transport data unavailable.</p>
      </Card>
    );
  }

  return (
    <Card title="Transport" subtitle="TfL data">
      <div className="space-y-3">
        {transport.nearestStations.map((station, i) => (
          <div key={i} className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {station.name}
              </p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {station.modes.map((mode) => (
                  <Badge
                    key={mode}
                    label={modeLabels[mode] || mode}
                    variant="info"
                  />
                ))}
              </div>
              {station.lines.length > 0 && (
                <p className="mt-0.5 text-xs text-gray-500 truncate">
                  {station.lines.join(', ')}
                </p>
              )}
            </div>
            <span className="shrink-0 text-xs text-gray-500">
              {station.distance < 1000
                ? `${station.distance}m`
                : `${(station.distance / 1000).toFixed(1)}km`}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
