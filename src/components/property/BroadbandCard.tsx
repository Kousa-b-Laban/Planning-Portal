'use client';

import { BroadbandData } from '@/types/property';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface BroadbandCardProps {
  broadband: BroadbandData | null;
}

export function BroadbandCard({ broadband }: BroadbandCardProps) {
  if (!broadband) {
    return (
      <Card title="Broadband" status="unavailable">
        <p className="text-sm text-gray-500">Broadband data unavailable.</p>
      </Card>
    );
  }

  const speedVariant = getSpeedVariant(broadband.averageDownload);

  return (
    <Card title="Broadband" subtitle={broadband.source}>
      <div className="space-y-3">
        {broadband.averageDownload !== null && (
          <div className="flex items-center gap-2">
            <Badge
              label={`${broadband.averageDownload} Mbps`}
              variant={speedVariant}
            />
            <span className="text-xs text-gray-500">average download</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {broadband.averageUpload !== null && (
            <Stat label="Avg upload" value={`${broadband.averageUpload} Mbps`} />
          )}
          {broadband.superfast !== null && (
            <Stat label="Superfast (30+ Mbps)" value={`${broadband.superfast}%`} />
          )}
          {broadband.ultrafast !== null && (
            <Stat label="Ultrafast (300+ Mbps)" value={`${broadband.ultrafast}%`} />
          )}
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function getSpeedVariant(speed: number | null): 'success' | 'warning' | 'danger' {
  if (speed === null) return 'warning';
  if (speed >= 100) return 'success';
  if (speed >= 30) return 'warning';
  return 'danger';
}
