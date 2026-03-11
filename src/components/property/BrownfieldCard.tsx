'use client';

import { BrownfieldSite } from '@/types/property';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface BrownfieldCardProps {
  sites: BrownfieldSite[];
}

export function BrownfieldCard({ sites }: BrownfieldCardProps) {
  if (sites.length === 0) {
    return (
      <Card title="Brownfield Sites" status="unavailable">
        <p className="text-sm text-gray-500">
          No brownfield sites registered within 500m.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Brownfield Sites"
      subtitle="DLUHC Brownfield Land Register"
    >
      <div className="space-y-3">
        <p className="text-xs text-gray-500">
          Sites identified by the council as suitable for housing development
          within ~500m. These could become future construction projects.
        </p>

        {sites.map((site, i) => (
          <div
            key={i}
            className="rounded-md border border-gray-100 bg-gray-50 p-3 space-y-1.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {site.name}
              </p>
              <span className="shrink-0 text-xs text-gray-400">
                {site.distance}m
              </span>
            </div>

            {site.address && site.address !== site.name && (
              <p className="text-xs text-gray-500">{site.address}</p>
            )}

            <div className="flex flex-wrap gap-1.5">
              {site.planningStatus && (
                <Badge
                  label={formatStatus(site.planningStatus)}
                  variant={statusVariant(site.planningStatus)}
                />
              )}
              {site.minDwellings && site.minDwellings > 0 && (
                <Badge
                  label={`${site.minDwellings}+ homes`}
                  variant="info"
                />
              )}
              {site.hectares && site.hectares > 0 && (
                <Badge
                  label={`${site.hectares} ha`}
                  variant="neutral"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function formatStatus(status: string): string {
  const lower = status.toLowerCase();
  if (lower.includes('permissioned') && !lower.includes('not')) return 'Permissioned';
  if (lower.includes('not permissioned')) return 'Not yet permissioned';
  if (lower.includes('pending')) return 'Pending decision';
  return status;
}

function statusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const lower = status.toLowerCase();
  if (lower.includes('permissioned') && !lower.includes('not')) return 'warning';
  if (lower.includes('pending')) return 'info';
  return 'neutral';
}
